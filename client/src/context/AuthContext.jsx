import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [userLoading, setUserLoading] = useState(true)

    useEffect(() => {
        if (!auth) {
            setLoading(false)
            setUserLoading(false)
            return
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)
            if (user) {
                setUserLoading(true)
                try {
                    const docSnap = await getDoc(doc(db, 'users', user.uid))
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
            } else {
                setUserData(null)
                setUserLoading(false)
            }
            setLoading(false)
        })

        return unsubscribe
    }, [])

    const logout = () => {
        return firebaseSignOut(auth)
    }

    const value = {
        currentUser,
        userData,   // Contains role & collegeCode
        isAuthReady: !loading && auth,
        userLoading,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
