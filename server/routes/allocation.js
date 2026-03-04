const express = require('express');
const { db } = require('../config/firebase');
const { allocateSeats } = require('../algorithm/allocate');
const { authenticate, authorize } = require('../middleware/auth');
const { sendAllocationEmail } = require('../services/emailService');
const { generatePDFBuffer, getExportData } = require('./export');
const router = express.Router();

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const collegeId = req.user.collegeId;

        // Fetch students and halls for this college
        const [studentsSnap, hallsSnap] = await Promise.all([
            db.collection('students').where('collegeId', '==', collegeId).get(),
            db.collection('halls').where('collegeId', '==', collegeId).get()
        ]);

        const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const halls = hallsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (students.length === 0) return res.status(400).json({ error: 'No students. Upload data first.' });
        if (halls.length === 0) return res.status(400).json({ error: 'No halls. Add halls first.' });

        // Delete existing allocations for this college
        const existingAllocsSnap = await db.collection('allocations').where('collegeId', '==', collegeId).get();
        if (!existingAllocsSnap.empty) {
            const batch = db.batch();
            existingAllocsSnap.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        // Run algorithm
        const { allocations, unallocated } = allocateSeats(students, halls);

        // Save new allocations in batches
        let promises = [];
        let batch = db.batch();
        let batchedCount = 0;

        // allocations array contains object from allocate.js
        for (const a of allocations) {
            const docRef = db.collection('allocations').doc();
            batch.set(docRef, {
                collegeId: collegeId,
                student_id: a.student_id,
                student_name: a.student_name,
                subject_code: a.subject_code,
                hall_id: a.hall_id,
                hall_name: a.hall_name,
                row_num: a.row_num,
                col_num: a.col_num
            });
            batchedCount++;
            if (batchedCount === 490) {
                promises.push(batch.commit());
                batch = db.batch();
                batchedCount = 0;
            }
        }
        if (batchedCount > 0) promises.push(batch.commit());
        await Promise.all(promises);

        // Calculate violations
        let violations = 0;
        const byHall = {};
        for (const a of allocations) { if (!byHall[a.hall_id]) byHall[a.hall_id] = []; byHall[a.hall_id].push(a); }
        for (const hid of Object.keys(byHall)) {
            const seats = byHall[hid].sort((a, b) => a.row_num - b.row_num || a.col_num - b.col_num);
            for (let i = 0; i < seats.length - 1; i++) {
                if (seats[i].row_num === seats[i + 1].row_num && seats[i + 1].col_num === seats[i].col_num + 1 && seats[i].subject_code === seats[i + 1].subject_code) violations++;
            }
        }

        // Optional: Generate PDF and send via email without blocking the response heavily
        const { halls: sortedHalls, allocs: sortedAllocs } = await getExportData(collegeId).catch(err => {
            console.error("Failed to get export data for PDF email:", err);
            return { halls: [], allocs: [] };
        });

        if (sortedAllocs.length > 0) {
            generatePDFBuffer(sortedHalls, sortedAllocs).then(pdfBuffer => {
                sendAllocationEmail(req.user.email, pdfBuffer, "ExamHall Platform");
            }).catch(console.error);
        }

        res.json({
            message: 'Allocation complete', allocated: allocations.length, unallocated: unallocated.length, violations,
            unallocated_students: unallocated.map(s => ({ student_id: s.student_id, name: s.name, subject_code: s.subject_code }))
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('allocations')
            .where('collegeId', '==', req.user.collegeId)
            .orderBy('hall_name')
            .orderBy('row_num')
            .orderBy('col_num')
            .get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/hall/:id', authenticate, async (req, res) => {
    try {
        const hallDoc = await db.collection('halls').doc(req.params.id).get();
        if (!hallDoc.exists || hallDoc.data().collegeId !== req.user.collegeId) {
            return res.status(404).json({ error: 'Hall not found.' });
        }
        const hall = { id: hallDoc.id, ...hallDoc.data() };

        const seatsSnap = await db.collection('allocations')
            .where('collegeId', '==', req.user.collegeId)
            .where('hall_id', '==', req.params.id)
            .get();

        // Sorting in memory since Firestore multi-orderBy requires composite index
        const seats = seatsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.row_num - b.row_num || a.col_num - b.col_num);

        const grid = [];
        for (let r = 1; r <= hall.rows; r++) {
            const row = [];
            for (let c = 1; c <= hall.cols; c++) {
                const seat = seats.find(s => s.row_num === r && s.col_num === c);
                row.push(seat || { row_num: r, col_num: c, empty: true });
            }
            grid.push(row);
        }
        res.json({ hall, grid, total_seated: seats.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/search', async (req, res) => {
    try {
        const { q, collegeId } = req.query;
        if (!q) return res.status(400).json({ error: 'Search query required.' });
        if (!collegeId) return res.status(400).json({ error: 'collegeId required for public search.' });

        // Firestore does not natively support text search LIKE '%q%' for partial string matching.
        // We will fetch all allocations for the college and filter in memory, which is acceptable 
        // for smaller colleges, but for SaaS at scale we'd use Algolia.
        const snap = await db.collection('allocations').where('collegeId', '==', collegeId).get();
        const allocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const qUpper = q.toUpperCase();
        const results = allocs.filter(a => String(a.student_id).toUpperCase().includes(qUpper) || String(a.student_name).toUpperCase().includes(qUpper));

        for (let r of results) {
            try {
                const hallDoc = await db.collection('halls').doc(r.hall_id).get();
                if (hallDoc.exists) {
                    r.hall_rows = hallDoc.data().rows;
                    r.hall_cols = hallDoc.data().cols;
                }
            } catch (e) {
                console.error("Error fetching hall for search result", e);
            }
        }

        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
