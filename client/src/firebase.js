import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These should ideally come from environment variables, but for demonstration we leave them blank
// The user needs to supply their own Firebase config here or in .env
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_YOUR_MOCK_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "examhall-demo.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "examhall-demo",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "examhall-demo.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:12abc345def6789"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
