import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useToast } from '../context/ToastContext'
import { GraduationCap, ArrowLeft, Search, MapPin, Clock } from 'lucide-react'

export default function StudentPortal() {
    const toast = useToast()
    const [collegeCode, setCollegeCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [allocations, setAllocations] = useState([])
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e) => {
        e.preventDefault()
        setLoading(true)
        setSearched(true)

        try {
            if (!collegeCode) throw new Error("Please enter a College Code")

            const q = query(collection(db, `colleges/${collegeCode.toUpperCase()}/allocations`))
            const snap = await getDocs(q)

            if (snap.empty) {
                setAllocations([])
                toast.error("No seat allocations found for this College.")
            } else {
                setAllocations(snap.docs.map(doc => doc.data()))
                toast.success(`Found ${snap.docs.length} seat allocations!`)
            }
        } catch (err) {
            toast.error(err.message)
            setAllocations([])
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
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1 uppercase">College Code</label>
                                <input type="text" value={collegeCode} onChange={e => setCollegeCode(e.target.value.toUpperCase())}
                                    placeholder="Enter the 6-digit College Code provided by Admin" maxLength={6} required
                                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono uppercase tracking-widest text-lg" />
                            </div>
                        </div>

                        <button disabled={loading} type="submit"
                            className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                            {loading ? 'Searching...' : <><Search size={20} /> Find My Seat</>}
                        </button>
                    </form>
                </div>

                {/* Results Card */}
                {searched && !loading && allocations.length > 0 && (
                    <div className="mt-8 glass border-emerald-500/30 p-8 rounded-3xl shadow-2xl animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                        <h3 className="text-xl font-bold text-slate-900 mb-6 text-center border-b border-slate-200 pb-4">All Seating Allocations</h3>

                        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                            {allocations.map((alloc, idx) => (
                                <div key={idx} className="bg-white/80 rounded-2xl p-4 border border-slate-200 flex items-center justify-between hover:border-emerald-300 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg">{alloc.student_name}</p>
                                        <p className="text-slate-600 font-mono text-sm">{alloc.student_id} • {alloc.subject_code}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-1">
                                            {alloc.hall_name}
                                        </div>
                                        <p className="text-slate-900 font-bold text-sm">Row {alloc.row_num}, Col {alloc.col_num}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
