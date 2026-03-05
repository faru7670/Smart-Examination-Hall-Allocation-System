const admin = require('firebase-admin');
require('./config/firebase');

const deleteLegacyDocs = async () => {
    const users = await admin.firestore().collection('users').get();
    for (let doc of users.docs) {
        if (doc.data().name === 'Legacy Admin') {
            await admin.firestore().collection('users').doc(doc.id).delete();
            console.log('Deleted legacy profile for:', doc.id);
        }
    }
    console.log("Done");
}

deleteLegacyDocs();
