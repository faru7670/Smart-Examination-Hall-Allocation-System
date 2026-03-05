import { useState, useEffect } from 'react'
import axios from 'axios'
import { HiOutlineAcademicCap, HiOutlineSearch, HiOutlineLocationMarker, HiOutlineQrcode, HiOutlineUser, HiOutlineBookOpen, HiOutlineClock, HiOutlineOfficeBuilding } from 'react-icons/hi'
import ThreeDHall from '../components/ThreeDHall'

export default function StudentDashboard() {
    const [studentId, setStudentId] = useState('')
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(true)

    // Optional: read from URL if preferred
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const id = params.get('id')
        if (id) {
            setStudentId(id)
            handleSearchForm(id)
        }
    }, [])

    const handleSearchForm = async (idToSearch) => {
        const id = typeof idToSearch === 'string' ? idToSearch : studentId
        if (!id.trim()) return

        setLoading(true)
        setError('')

        try {
            const searchRes = await axios.get(`/api/allocations/search?q=${encodeURIComponent(id.trim())}`)
            if (searchRes.data.length === 0) {
                setError('No exam seat allocation found for this Student ID yet. Please check back later or contact admin.')
                setLoading(false)
                return
            }
            const allocation = searchRes.data[0]
            let qrCode = null
            try {
                const qrRes = await axios.get(`/api/qrcode/${allocation.student_id}`)
                qrCode = qrRes.data.qrCode
            } catch (e) { }

            setResult({ ...allocation, qrCode })
            setIsSearching(false) // switch to dashboard view
        } catch (err) {
            setError('Unable to fetch your dashboard right now. Please try again.')
        }
        setLoading(false)
    }

    const resetSearch = () => {
        setResult(null)
        setStudentId('')
        setIsSearching(true)
    }

    if (isSearching) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-primary-900/10 to-dark-950" />
                <div className="absolute top-1/3 -left-32 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" />

                <div className="relative z-10 w-full max-w-lg">
                    <div className="text-center mb-8 animate-slide-up">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 mb-6 shadow-2xl shadow-primary-500/30">
                            <HiOutlineAcademicCap className="w-10 h-10 text-slate-900" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent">Student Dashboard</h1>
                        <p className="text-dark-400 mt-2 text-lg">Enter your ID to access your exam allocation portal</p>
                    </div>

                    <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <form onSubmit={(e) => { e.preventDefault(); handleSearchForm(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">Student ID / Roll Number</label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                    <input
                                        type="text"
                                        value={studentId}
                                        onChange={e => setStudentId(e.target.value)}
                                        className="input-field pl-12 py-3 text-lg font-mono uppercase"
                                        placeholder="e.g. 21CS001"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg font-medium flex justify-center items-center gap-2">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Access Dashboard <HiOutlineSearch className="w-5 h-5" /></>}
                            </button>
                        </form>

                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
                                <div className="p-1 rounded bg-red-500/20 text-red-400">!</div>
                                <p>{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="page-title text-3xl">My Exam Dashboard</h1>
                    <p className="text-dark-400 mt-1">Allocation details for {result.student_name}</p>
                </div>
                <button onClick={resetSearch} className="btn-secondary self-start md:self-auto">
                    ← Different Student
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: ID Card & QR */}
                <div className="space-y-6">
                    <div className="glass-card p-6 border-t-4 border-t-primary-500 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="text-center pb-6 border-b border-dark-700/50">
                            <div className="w-24 h-24 mx-auto rounded-3xl bg-dark-800 border-2 border-primary-500/30 flex items-center justify-center shadow-inner mb-4">
                                <HiOutlineUser className="w-10 h-10 text-primary-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{result.student_name}</h2>
                            <p className="text-primary-400 font-mono mt-1 px-3 py-1 bg-primary-500/10 rounded-full inline-block">{result.student_id}</p>
                        </div>

                        <div className="pt-6 space-y-4">
                            <div className="flex items-center gap-3 text-dark-300">
                                <div className="p-2 rounded-lg bg-dark-800"><HiOutlineBookOpen className="w-5 h-5 text-accent-400" /></div>
                                <div>
                                    <p className="text-xs text-dark-500">Exam Subject</p>
                                    <p className="font-semibold text-slate-900">{result.subject_code}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-dark-300">
                                <div className="p-2 rounded-lg bg-dark-800"><HiOutlineClock className="w-5 h-5 text-amber-400" /></div>
                                <div>
                                    <p className="text-xs text-dark-500">Allocation Status</p>
                                    <p className="font-semibold text-emerald-400 badge bg-emerald-500/10 mt-1 border-0">Confirmed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {result.qrCode && (
                        <div className="glass-card p-6 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <h3 className="text-sm font-semibold text-dark-300 flex items-center justify-center gap-2 mb-4">
                                <HiOutlineQrcode className="w-5 h-5 text-primary-400" /> Hall Entry Pass
                            </h3>
                            <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
                                <img src={result.qrCode} alt="Security QR Pass" className="w-48 h-48" />
                            </div>
                            <p className="text-xs text-dark-400 mt-4 leading-relaxed">
                                Please present this QR code to the invigilator at the examination hall entrance for fast verification.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Seat Layout Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 lg:p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dark-700/50">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                                <HiOutlineLocationMarker className="w-6 h-6 text-slate-900" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Your Seating Info</h1>
                                <p className="text-sm text-dark-400">Proceed to this exact location during your exam slot.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-700/50">
                                <HiOutlineOfficeBuilding className="w-6 h-6 text-primary-400 mb-3" />
                                <p className="text-sm text-dark-400">Building / Hall</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{result.hall_name}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-700/50">
                                <span className="w-8 h-8 rounded bg-dark-800 border border-dark-600 flex items-center justify-center font-mono text-xs text-dark-300 mb-3">R</span>
                                <p className="text-sm text-dark-400">Row Number</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">Row {result.row_num}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-700/50">
                                <span className="w-8 h-8 rounded bg-dark-800 border border-dark-600 flex items-center justify-center font-mono text-xs text-dark-300 mb-3">C</span>
                                <p className="text-sm text-dark-400">Column / Desk</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">Desk {result.col_num}</p>
                            </div>
                        </div>

                        <div className="bg-primary-900/10 border border-primary-500/20 rounded-2xl p-5 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-500/10 to-transparent" />
                            <h3 className="font-semibold text-primary-300 mb-2 relative z-10">Important Instructions</h3>
                            <ul className="space-y-2 text-sm text-dark-300 relative z-10">
                                <li className="flex gap-2"><span className="text-primary-500">•</span> Please arrive at {result.hall_name} at least 15 minutes early.</li>
                                <li className="flex gap-2"><span className="text-primary-500">•</span> Carry your University ID card along with this allocation reference.</li>
                                <li className="flex gap-2"><span className="text-primary-500">•</span> Ensure you are seated strictly at Row {result.row_num}, Column {result.col_num}.</li>
                                <li className="flex gap-2"><span className="text-primary-500">•</span> Any seating mismatch must be reported to the invigilator immediately.</li>
                            </ul>
                        </div>

                        {/* 3D Visualizer */}
                        {result.hall_rows && result.hall_cols && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <HiOutlineLocationMarker className="w-5 h-5 text-accent-400" />
                                    3D Path Finder
                                </h3>
                                <p className="text-dark-400 mb-4 text-sm">Find your exact row and desk placement visually.</p>
                                <div className="h-[400px] w-full bg-dark-900 border border-dark-700/50 rounded-2xl overflow-hidden shadow-inner hidden md:block">
                                    <ThreeDHall
                                        hall={{ rows: result.hall_rows, cols: result.hall_cols }}
                                        gridData={Array.from({ length: result.hall_rows }, (_, r) =>
                                            Array.from({ length: result.hall_cols }, (_, c) => {
                                                const matches = (r + 1 === result.row_num && c + 1 === result.col_num)
                                                return matches ? { ...result, empty: false } : { row_num: r + 1, col_num: c + 1, empty: true }
                                            })
                                        )}
                                        subjectMap={{ [result.subject_code]: { hex: '#38bdf8' } }}
                                        height="100%"
                                    />
                                </div>
                                <div className="md:hidden mt-4 p-4 text-center text-sm text-dark-400 bg-dark-900/50 rounded-xl border border-dark-800">
                                    3D view available on desktop devices.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
