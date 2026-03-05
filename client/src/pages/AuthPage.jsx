import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, Users, ArrowLeft } from 'lucide-react'

// Generate random 6-char college code
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export default function AuthPage() {
    const { type } = useParams() // 'admin' or 'staff'
    const navigate = useNavigate()
    const toast = useToast()
    const { fetchUserData } = useAuth()

    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [collegeCode, setCollegeCode] = useState('') // For staff login
    const [loading, setLoading] = useState(false)

    const handleAdminAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (isLogin) {
                const cred = await signInWithEmailAndPassword(auth, email, password)

                // Self-healing: If they log in and we detect they are a legacy admin with the dummy name,
                // we overwrite their Firestore doc with the Name they just typed into the login box!
                const docSnap = await getDoc(doc(db, 'users', cred.user.uid))
                if (docSnap.exists() && docSnap.data().name === 'Legacy Admin' && name.trim() !== '') {
                    await setDoc(doc(db, 'users', cred.user.uid), { name: name }, { merge: true })
                }

                await fetchUserData(cred.user.uid)
                toast.success("Welcome back, Admin!")
                navigate('/admin/dashboard')
            } else {
                const code = genCode()
                const cred = await createUserWithEmailAndPassword(auth, email, password)

                // Create user doc
                await setDoc(doc(db, 'users', cred.user.uid), {
                    role: 'admin',
                    collegeCode: code,
                    name: name || 'Admin',
                    email,
                    createdAt: new Date().toISOString()
                })

                await fetchUserData(cred.user.uid)
                toast.success(`Account created! Your College Code is ${code}`)
                navigate('/admin/dashboard')
            }
        } catch (err) {
            toast.error(err.message.replace('Firebase:', '').trim())
        }
        setLoading(false)
    }

    const handleStaffLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (!collegeCode) throw new Error("College code is required")

            // Query the invigilators collection for this college
            const q = query(
                collection(db, `colleges/${collegeCode.toUpperCase()}/invigilators`),
                where('email', '==', email),
                where('password', '==', password)
            )
            const snap = await getDocs(q)

            if (snap.empty) {
                throw new Error("Invalid staff credentials or college code.")
            }

            const staffData = { id: snap.docs[0].id, ...snap.docs[0].data(), collegeCode: collegeCode.toUpperCase(), role: 'invigilator' }

            // Store simple mock session for staff in localStorage since they don't use Firebase Auth directly
            localStorage.setItem('examhall_staffAuth', JSON.stringify(staffData))

            toast.success("Staff login successful!")
            navigate('/staff/dashboard')

            // Note: In App.jsx ProtectedRoute we'll need to check this localStorage if currentUser is null but role='invigilator' is requested. 
            // Wait, an easier way is to just use standard Firebase Auth for everyone, or build a robust interceptor. 
            // Let's actually use a global intercept for Staff logic in AuthContext soon.

        } catch (err) {
            toast.error(err.message)
        }
        setLoading(false)
    }

    const onSubmit = type === 'admin' ? handleAdminAuth : handleStaffLogin

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <Link to="/" className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition z-20">
                <ArrowLeft size={20} /> Back
            </Link>

            {/* Glowing ORB */}
            <div className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] -z-10 ${type === 'admin' ? 'bg-indigo-600/20' : 'bg-purple-600/20'}`} />

            <div className="glass p-8 rounded-3xl w-full max-w-md shadow-2xl animate-slide-up">
                <div className="text-center mb-8">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${type === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {type === 'admin' ? <ShieldCheck size={32} /> : <Users size={32} />}
                    </div>
                    <h2 className="text-3xl font-black">{type === 'admin' ? (isLogin ? 'Admin Login' : 'Create Admin') : 'Staff Login'}</h2>
                    <p className="text-slate-400 mt-2 text-sm">
                        {type === 'admin' ? 'Manage your entire college seating arrangement.' : 'Access your designated hall seating charts.'}
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    {type === 'admin' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Admin Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="E.g., Dr. Smith" />
                        </div>
                    )}

                    {type === 'staff' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">College Code</label>
                            <input type="text" value={collegeCode} onChange={e => setCollegeCode(e.target.value.toUpperCase())} required
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors uppercase"
                                placeholder="E.g., RX79P" maxLength={6} />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="mail@college.edu" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="••••••••" />
                    </div>

                    <button disabled={loading} type="submit"
                        className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl'}
                        ${type === 'admin' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-indigo-500/25' : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-purple-500/25'}`}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                {type === 'admin' && (
                    <p className="mt-6 text-center text-sm text-slate-400">
                        {isLogin ? "Don't have an account?" : "Already registered?"}
                        <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 font-semibold ml-2 hover:underline">
                            {isLogin ? "Create one" : "Sign in here"}
                        </button>
                    </p>
                )}
            </div>
        </div>
    )
}
