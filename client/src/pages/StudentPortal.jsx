import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useToast } from '../context/ToastContext'
import { GraduationCap, ArrowLeft, Search, MapPin, Clock } from 'lucide-react'

export default function StudentPortal() {
    const toast = useToast()
    const [collegeCode, setCollegeCode] = useState('')
    const [rollNo, setRollNo] = useState('')
    const [loading, setLoading] = useState(false)
    const [allocation, setAllocation] = useState(null)
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e) => {
        e.preventDefault()
        setLoading(true)
        setSearched(true)

        try {
            if (!collegeCode || !rollNo) throw new Error("Please fill all fields")

            const q = query(
                collection(db, `colleges/${collegeCode.toUpperCase()}/allocations`),
                where('student_id', '==', rollNo.trim())
            )
            const snap = await getDocs(q)

            if (snap.empty) {
                setAllocation(null)
                toast.error("No seat allocation found for this Roll No.")
            } else {
                setAllocation(snap.docs[0].data())
                toast.success("Seat found!")
            }
        } catch (err) {
            toast.error(err.message)
            setAllocation(null)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Link to="/" className="absolute top-6 left-6 text-slate-600 hover:text-slate-900 flex items-center gap-2 z-20 transition">
                <ArrowLeft size={20} /> Back to Home
            </Link>

            {/* Background effects */}
            <div className="absolute w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 translate-y-1/4" />

            <div className="w-full max-w-lg">
                <div className="text-center mb-8 animate-slide-up">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                        <GraduationCap size={40} />
                    </div>
                    <h2 className="text-4xl font-black mb-2">Student Seat Verification</h2>
                    <p className="text-slate-600">Enter your college code and roll number to find your designated examination hall and seat.</p>
                </div>

                <div className="glass p-8 rounded-3xl shadow-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSearch} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1 uppercase">College Code</label>
                                <input type="text" value={collegeCode} onChange={e => setCollegeCode(e.target.value.toUpperCase())}
                                    placeholder="E.g. A1B2C3" maxLength={6} required
                                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono uppercase tracking-widest text-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1 uppercase">Roll Number</label>
                                <input type="text" value={rollNo} onChange={e => setRollNo(e.target.value)} required
                                    placeholder="Your ID"
                                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono text-lg" />
                            </div>
                        </div>

                        <button disabled={loading} type="submit"
                            className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                            {loading ? 'Searching...' : <><Search size={20} /> Find My Seat</>}
                        </button>
                    </form>
                </div>

                {/* Results Card */}
                {searched && !loading && allocation && (
                    <div className="mt-8 glass border-emerald-500/30 p-8 rounded-3xl shadow-2xl animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

                        <div className="text-center mb-6 border-b border-slate-200 pb-6">
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">{allocation.student_name}</h3>
                            <p className="text-emerald-400 font-mono">{allocation.student_id} • Subject: {allocation.subject_code}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white/80 rounded-2xl p-4 border border-slate-200">
                                <MapPin className="mx-auto text-slate-600 mb-2" size={24} />
                                <p className="text-sm text-slate-600 uppercase tracking-wide font-semibold mb-1">Hall</p>
                                <p className="text-xl font-bold text-slate-900">{allocation.hall_name}</p>
                            </div>
                            <div className="bg-white/80 rounded-2xl p-4 border border-slate-200">
                                <div className="text-2xl mb-2">🪑</div>
                                <p className="text-sm text-slate-600 uppercase tracking-wide font-semibold mb-1">Seat</p>
                                <p className="text-xl font-bold text-slate-900">Row {allocation.row_num} • Col {allocation.col_num}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600 bg-white/40 py-3 rounded-xl">
                            <Clock size={16} /> Exam starts at 09:00 AM • Please arrive 15 mins early.
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
