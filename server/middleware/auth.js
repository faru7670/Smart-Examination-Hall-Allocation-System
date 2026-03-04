const { admin, db } = require('../config/firebase');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Fetch user data from firestore to get role and collegeId
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            return res.status(401).json({ error: 'User record not found.' });
        }

        const userData = userDoc.data();
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: userData.role,
            collegeId: userData.collegeId
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.', details: err.message });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
        next();
    };
};

module.exports = { authenticate, authorize };
