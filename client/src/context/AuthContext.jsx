import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'

// ... (skipping to the snapshot part in my actual replacement)

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [userLoading, setUserLoading] = useState(true)

    const fetchUserData = async (uid) => {
        setUserLoading(true)
        try {
            const docSnap = await getDoc(doc(db, 'users', uid))
            if (docSnap.exists()) {
                setUserData(docSnap.data()) // { role: 'admin'|'invigilator', collegeCode: 'ABCDEF', name, profileUrl }
            } else {
                setUserData(null)
            }
        } catch (e) {
            console.error("Failed to fetch user data", e)
        } finally {
            setUserLoading(false)
        }
    }

    useEffect(() => {
        if (!auth) {
            setLoading(false)
            setUserLoading(false)
            return
        }

        let unsubscribeSnapshot = null

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user)
            if (user) {
                setUserLoading(true)
                // Listen to the user document in real-time. This eliminates race conditions!
                unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data())
                    } else {
                        // User has no doc. This is a legacy account from before our multi-tenant upgrade.
                        // We must create a permanent doc for them so they don't get random college codes on refresh!
                        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
                        const legacyData = {
                            role: 'admin',
                            collegeCode: code,
                            name: user.displayName || 'Legacy Admin',
                            email: user.email,
                            createdAt: new Date().toISOString()
                        }
                        // Optimistically set the data so the UI loads immediately
                        setUserData(legacyData)
                        // Permanently write to DB so their collegeCode stays the same forever
                        setDoc(doc(db, 'users', user.uid), legacyData)
                            .then(() => console.log("Legacy user migrated perfectly."))
                            .catch(err => {
                                console.error("Could not migrate legacy user to DB:", err)
                                // If they get permission denied, fallback to a STATIC code rather than random
                                setUserData({ ...legacyData, collegeCode: 'LEGACY' })
                            })
                    }
                    setUserLoading(false)
                }, (error) => {
                    console.error("Snapshot error:", error)
                    setUserLoading(false)
                })
            } else {
                setUserData(null)
                setUserLoading(false)
                if (unsubscribeSnapshot) unsubscribeSnapshot()
            }
            setLoading(false)
        })

        return () => {
            unsubscribeAuth()
            if (unsubscribeSnapshot) unsubscribeSnapshot()
        }
    }, [])

    const logout = () => {
        return firebaseSignOut(auth)
    }

    const value = {
        currentUser,
        userData,   // Contains role & collegeCode
        isAuthReady: !loading && auth,
        userLoading,
        logout,
        fetchUserData
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
