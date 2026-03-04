const express = require('express');
const { admin, db } = require('../config/firebase');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Get current user profile
router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

// Setup a new college (Called after frontend registers a user via Firebase Auth)
router.post('/setup-college', async (req, res) => {
    try {
        const { collegeName } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Ensure user doc doesn't already exist
        const userRef = db.collection('users').doc(decodedToken.uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            return res.status(400).json({ error: 'User already setup.' });
        }

        // Create College
        const collegeRef = await db.collection('colleges').add({
            name: collegeName,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create User as Admin for this College
        await userRef.set({
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: 'admin',
            collegeId: collegeRef.id
        });

        res.status(201).json({ message: 'College and admin account setup complete.', collegeId: collegeRef.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create an Invigilator (Admin only)
router.post('/invigilator', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) return res.status(400).json({ error: 'All fields required.' });

        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name
        });

        // Add to users collection
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            name,
            role: 'invigilator',
            collegeId: req.user.collegeId
        });

        res.status(201).json({ message: 'Invigilator created successfully.', uid: userRecord.uid });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
