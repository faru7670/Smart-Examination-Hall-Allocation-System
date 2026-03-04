const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { db } = require('../config/firebase');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', authenticate, async (req, res) => {
    try {
        const snapshot = await db.collection('students')
            .where('collegeId', '==', req.user.collegeId)
            .orderBy('student_id')
            .get();
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(students);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { student_id, name, subject_code } = req.body;
        if (!student_id || !name || !subject_code) return res.status(400).json({ error: 'All fields required' });

        const sid = student_id.trim();
        const existing = await db.collection('students')
            .where('collegeId', '==', req.user.collegeId)
            .where('student_id', '==', sid)
            .get();
        if (!existing.empty) {
            return res.status(409).json({ error: 'Student ID already exists' });
        }

        await db.collection('students').add({
            collegeId: req.user.collegeId,
            student_id: sid,
            name: name.trim(),
            subject_code: subject_code.trim().toUpperCase()
        });

        res.status(201).json({ message: 'Student added successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/subjects', authenticate, async (req, res) => {
    try {
        const snapshot = await db.collection('students').where('collegeId', '==', req.user.collegeId).get();
        const subjects = new Set();
        snapshot.forEach(doc => subjects.add(doc.data().subject_code));
        res.json(Array.from(subjects).sort());
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/upload', authenticate, authorize('admin'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

        let records = [];
        try {
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            records = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
        } catch (e) {
            return res.status(400).json({ error: 'Failed to parse file. Please upload a valid CSV or Excel file: ' + e.message });
        }

        let added = 0, duplicates = 0, errors = 0;
        const errorDetails = [];

        // Batch write to Firestore
        let batch = db.batch();
        let batchedCount = 0;
        const commitments = []; // For concurrent batch commits

        // Get existing specific to this college to avoid reads in loop (optional but good for large lists)
        const snapshot = await db.collection('students').where('collegeId', '==', req.user.collegeId).get();
        const existingIds = new Set();
        snapshot.forEach(doc => existingIds.add(doc.data().student_id));

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const sid = String(row.StudentID || row.studentid || row.student_id || row.ID || '').trim();
            const name = String(row.StudentName || row.studentname || row.student_name || row.Name || row.name || '').trim();
            const subj = String(row.SubjectCode || row.subjectcode || row.subject_code || row.Subject || row.subject || '').trim().toUpperCase();

            if (!sid || !name || !subj) { errors++; errorDetails.push(`Row ${i + 2}: Missing fields`); continue; }
            if (existingIds.has(sid)) { duplicates++; continue; }

            existingIds.add(sid);

            const docRef = db.collection('students').doc();
            batch.set(docRef, {
                collegeId: req.user.collegeId,
                student_id: sid,
                name: name,
                subject_code: subj
            });
            batchedCount++;
            added++;

            // Firestore batch limit is 500 operations
            if (batchedCount === 490) {
                commitments.push(batch.commit());
                batch = db.batch();
                batchedCount = 0;
            }
        }

        if (batchedCount > 0) commitments.push(batch.commit());
        await Promise.all(commitments);

        const newTotal = existingIds.size;
        res.json({ message: 'Upload complete', summary: { total_in_file: records.length, added, duplicates, errors, total_in_db: newTotal }, errors: errorDetails });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const studentSnap = await db.collection('students').where('collegeId', '==', req.user.collegeId).get();
        const allocSnap = await db.collection('allocations').where('collegeId', '==', req.user.collegeId).get();

        const deleteInBatches = async (snapshot) => {
            const batches = [];
            while (snapshot.docs.length) {
                const batch = db.batch();
                const chunk = snapshot.docs.splice(0, 490);
                chunk.forEach(doc => batch.delete(doc.ref));
                batches.push(batch.commit());
            }
            await Promise.all(batches);
        };

        if (!studentSnap.empty) await deleteInBatches(studentSnap);
        if (!allocSnap.empty) await deleteInBatches(allocSnap);

        res.json({ message: 'All student and allocation data cleared for your college.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
