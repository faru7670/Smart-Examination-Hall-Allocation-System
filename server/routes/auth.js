const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryAll, queryOne, runSql } = require('../database/db');
const { authenticate, authorize, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
        const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
        if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials.' });
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/register', authenticate, authorize('admin'), (req, res) => {
    try {
        const { username, password, full_name, role } = req.body;
        if (!username || !password || !full_name || !role) return res.status(400).json({ error: 'All fields required.' });
        if (!['admin', 'coordinator', 'invigilator', 'student'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
        if (queryOne('SELECT id FROM users WHERE username = ?', [username])) return res.status(409).json({ error: 'Username exists.' });
        const hash = bcrypt.hashSync(password, 10);
        const result = runSql('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)', [username, hash, full_name, role]);
        res.status(201).json({ id: result.lastInsertRowid, username, full_name, role });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', authenticate, (req, res) => { res.json({ user: req.user }); });

router.get('/users', authenticate, authorize('admin'), (req, res) => {
    try { res.json(queryAll('SELECT id, username, full_name, role, created_at FROM users')); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
