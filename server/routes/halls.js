const express = require('express');
const { db } = require('../config/firebase');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    try {
        const snapshot = await db.collection('halls')
            .where('collegeId', '==', req.user.collegeId)
            .orderBy('name')
            .get();
        const halls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(halls);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, rows, cols } = req.body;
        if (!name || !rows || !cols) return res.status(400).json({ error: 'Name, rows, cols required.' });
        if (rows < 1 || cols < 1 || rows > 100 || cols > 100) return res.status(400).json({ error: 'Rows/cols must be 1-100.' });

        const existing = await db.collection('halls')
            .where('collegeId', '==', req.user.collegeId)
            .where('name', '==', name)
            .get();
        if (!existing.empty) return res.status(409).json({ error: 'Hall name exists.' });

        const capacity = rows * cols;
        const newHall = {
            collegeId: req.user.collegeId,
            name,
            rows: Number(rows),
            cols: Number(cols),
            capacity
        };
        const docRef = await db.collection('halls').add(newHall);
        res.status(201).json({ id: docRef.id, ...newHall });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const hallId = req.params.id;
        const hallRef = db.collection('halls').doc(hallId);
        const hallDoc = await hallRef.get();

        if (!hallDoc.exists || hallDoc.data().collegeId !== req.user.collegeId) {
            return res.status(404).json({ error: 'Hall not found.' });
        }

        // Delete associated allocations
        const allocSnap = await db.collection('allocations')
            .where('collegeId', '==', req.user.collegeId)
            .where('hall_id', '==', hallId)
            .get();

        const batch = db.batch();
        allocSnap.forEach(doc => batch.delete(doc.ref));
        batch.delete(hallRef);
        await batch.commit();

        res.json({ message: 'Hall deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
