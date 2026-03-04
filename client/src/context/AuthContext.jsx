import { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, createUserProfile } from '../lib/db';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const profile = await getUserProfile(firebaseUser.uid);
                    setUser(profile ? { ...profile, email: firebaseUser.email } : { uid: firebaseUser.uid, email: firebaseUser.email, role: 'admin' });
                } catch {
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'admin' });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = async (email, password) => {
        if (!auth) throw new Error('Firebase not configured. Add .env file.');
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(cred.user.uid);
        return profile;
    };

    const registerCollege = async (email, password, collegeName) => {
        if (!auth) throw new Error('Firebase not configured. Add .env file.');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const profile = await createUserProfile(cred.user.uid, { email, collegeName });
        return profile;
    };

    const logoutUser = async () => {
        if (!auth) return;
        await signOut(auth);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, registerCollege, logoutUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
