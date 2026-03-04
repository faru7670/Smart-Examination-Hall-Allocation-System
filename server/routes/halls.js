const express = require('express');
const { queryAll, queryOne, runSql } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, (req, res) => {
    try { res.json(queryAll('SELECT * FROM halls ORDER BY name')); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
    try {
        const { name, rows, cols } = req.body;
        if (!name || !rows || !cols) return res.status(400).json({ error: 'Name, rows, cols required.' });
        if (rows < 1 || cols < 1 || rows > 100 || cols > 100) return res.status(400).json({ error: 'Rows/cols must be 1-100.' });
        if (queryOne('SELECT id FROM halls WHERE name = ?', [name])) return res.status(409).json({ error: 'Hall name exists.' });
        const capacity = rows * cols;
        const result = runSql('INSERT INTO halls (name, rows, cols, capacity) VALUES (?, ?, ?, ?)', [name, rows, cols, capacity]);
        res.status(201).json(queryOne('SELECT * FROM halls WHERE id = ?', [result.lastInsertRowid]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
    try {
        runSql('DELETE FROM allocations WHERE hall_id = ?', [Number(req.params.id)]);
        const result = runSql('DELETE FROM halls WHERE id = ?', [Number(req.params.id)]);
        if (result.changes === 0) return res.status(404).json({ error: 'Hall not found.' });
        res.json({ message: 'Hall deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
