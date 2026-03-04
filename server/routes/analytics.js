const express = require('express');
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    try {
        const collegeId = req.user.collegeId;

        // Fetch all data for this college to aggregate in memory
        const [studentsSnap, hallsSnap, allocsSnap] = await Promise.all([
            db.collection('students').where('collegeId', '==', collegeId).get(),
            db.collection('halls').where('collegeId', '==', collegeId).get(),
            db.collection('allocations').where('collegeId', '==', collegeId).get()
        ]);

        const totalStudents = studentsSnap.size;
        const totalHalls = hallsSnap.size;
        const allocatedStudents = allocsSnap.size;

        const halls = hallsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const totalSeats = halls.reduce((sum, h) => sum + (h.capacity || 0), 0);

        const subjectsCounts = {};
        studentsSnap.forEach(doc => {
            const subj = doc.data().subject_code;
            subjectsCounts[subj] = (subjectsCounts[subj] || 0) + 1;
        });
        const subjectDistribution = Object.keys(subjectsCounts)
            .map(k => ({ subject_code: k, count: subjectsCounts[k] }))
            .sort((a, b) => b.count - a.count);

        const hallUtilization = halls.map(h => {
            const seated = allocsSnap.docs.filter(d => d.data().hall_id === h.id).length;
            return {
                name: h.name,
                capacity: h.capacity,
                seated,
                utilization: h.capacity > 0 ? Math.round((seated / h.capacity) * 100) : 0
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        const allocBySubj = {};
        allocsSnap.forEach(doc => {
            const a = doc.data();
            const key = `${a.hall_name}_${a.subject_code}`;
            if (!allocBySubj[key]) {
                allocBySubj[key] = { hall_name: a.hall_name, subject_code: a.subject_code, count: 0 };
            }
            allocBySubj[key].count++;
        });
        const allocationBySubject = Object.values(allocBySubj).sort((a, b) => a.hall_name.localeCompare(b.hall_name));

        res.json({
            totalStudents, totalHalls, totalSeats, allocatedStudents,
            unallocatedStudents: totalStudents - allocatedStudents,
            allocationPercentage: totalStudents > 0 ? Math.round((allocatedStudents / totalStudents) * 100) : 0,
            subjectDistribution, hallUtilization, allocationBySubject
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
