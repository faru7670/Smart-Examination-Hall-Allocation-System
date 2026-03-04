const express = require('express');
const { queryAll, queryOne, runSql } = require('../database/db');
const { allocateSeats } = require('../algorithm/allocate');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, authorize('admin'), (req, res) => {
    try {
        const students = queryAll('SELECT * FROM students');
        const halls = queryAll('SELECT * FROM halls');
        if (students.length === 0) return res.status(400).json({ error: 'No students. Upload data first.' });
        if (halls.length === 0) return res.status(400).json({ error: 'No halls. Add halls first.' });

        runSql('DELETE FROM allocations');
        const { allocations, unallocated } = allocateSeats(students, halls);

        for (const a of allocations) {
            runSql('INSERT INTO allocations (student_id, student_name, subject_code, hall_id, hall_name, row_num, col_num) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [a.student_id, a.student_name, a.subject_code, a.hall_id, a.hall_name, a.row_num, a.col_num]);
        }

        let violations = 0;
        const byHall = {};
        for (const a of allocations) { if (!byHall[a.hall_id]) byHall[a.hall_id] = []; byHall[a.hall_id].push(a); }
        for (const hid of Object.keys(byHall)) {
            const seats = byHall[hid].sort((a, b) => a.row_num - b.row_num || a.col_num - b.col_num);
            for (let i = 0; i < seats.length - 1; i++) {
                if (seats[i].row_num === seats[i + 1].row_num && seats[i + 1].col_num === seats[i].col_num + 1 && seats[i].subject_code === seats[i + 1].subject_code) violations++;
            }
        }

        res.json({
            message: 'Allocation complete', allocated: allocations.length, unallocated: unallocated.length, violations,
            unallocated_students: unallocated.map(s => ({ student_id: s.student_id, name: s.name, subject_code: s.subject_code }))
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticate, (req, res) => {
    try { res.json(queryAll('SELECT * FROM allocations ORDER BY hall_name, row_num, col_num')); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/hall/:id', authenticate, (req, res) => {
    try {
        const hall = queryOne('SELECT * FROM halls WHERE id = ?', [Number(req.params.id)]);
        if (!hall) return res.status(404).json({ error: 'Hall not found.' });
        const seats = queryAll('SELECT * FROM allocations WHERE hall_id = ? ORDER BY row_num, col_num', [Number(req.params.id)]);
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

router.get('/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Search query required.' });
        res.json(queryAll('SELECT * FROM allocations WHERE student_id LIKE ? OR student_name LIKE ? ORDER BY hall_name, row_num', [`%${q}%`, `%${q}%`]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
