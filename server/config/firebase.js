const admin = require('firebase-admin');

// We'll initialize firebase admin using default credentials or an env variable.
// During local dev, if FIREBASE_SERVICE_ACCOUNT is not set, we'll try to find a local key.json
// If it fails, that's up to the host to provide correct credentials.
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback to default if no env variable (e.g., using GOOGLE_APPLICATION_CREDENTIALS)
        // Or if running in an environment where it's auto-injected.
        admin.initializeApp();
    }
    console.log('Firebase Admin initialized successfully.');
} catch (err) {
    console.error('Firebase Admin initialization error:', err.message);
}

const db = admin.firestore();

module.exports = { admin, db };
