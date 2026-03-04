const express = require('express');
const { queryAll, queryOne } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, (req, res) => {
    try {
        const totalStudents = queryOne('SELECT COUNT(*) as count FROM students').count;
        const totalHalls = queryOne('SELECT COUNT(*) as count FROM halls').count;
        const totalSeats = queryOne('SELECT COALESCE(SUM(capacity), 0) as count FROM halls').count;
        const allocatedStudents = queryOne('SELECT COUNT(*) as count FROM allocations').count;

        const subjectDistribution = queryAll('SELECT subject_code, COUNT(*) as count FROM students GROUP BY subject_code ORDER BY count DESC');
        const halls = queryAll('SELECT id, name, capacity FROM halls ORDER BY name');
        const hallUtilization = halls.map(h => {
            const seated = queryOne('SELECT COUNT(*) as count FROM allocations WHERE hall_id = ?', [h.id]).count;
            return { name: h.name, capacity: h.capacity, seated, utilization: h.capacity > 0 ? Math.round((seated / h.capacity) * 100) : 0 };
        });
        const allocationBySubject = queryAll('SELECT hall_name, subject_code, COUNT(*) as count FROM allocations GROUP BY hall_name, subject_code ORDER BY hall_name');

        res.json({
            totalStudents, totalHalls, totalSeats, allocatedStudents,
            unallocatedStudents: totalStudents - allocatedStudents,
            allocationPercentage: totalStudents > 0 ? Math.round((allocatedStudents / totalStudents) * 100) : 0,
            subjectDistribution, hallUtilization, allocationBySubject
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
