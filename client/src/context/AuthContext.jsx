import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If Firebase is not configured, skip auth initialization
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const token = await firebaseUser.getIdToken();
                    const res = await axios.get('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser({ ...firebaseUser, ...res.data.user });
                } catch (err) {
                    console.error("Failed to fetch user profile", err);
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        if (!auth) throw new Error('Firebase is not configured. Please set up your .env file.');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    };

    const registerCollege = async (email, password, collegeName) => {
        if (!auth) throw new Error('Firebase is not configured. Please set up your .env file.');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        await axios.post('/api/auth/setup-college', { collegeName }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const res = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUser({ ...userCredential.user, ...res.data.user });
        return userCredential.user;
    };

    const logoutUser = () => {
        if (!auth) return Promise.resolve();
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, login, registerCollege, logout: logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
