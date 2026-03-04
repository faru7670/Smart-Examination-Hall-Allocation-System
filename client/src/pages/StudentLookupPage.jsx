import { useState } from 'react'
import axios from 'axios'
import { HiOutlineAcademicCap, HiOutlineSearch, HiOutlineLocationMarker, HiOutlineQrcode } from 'react-icons/hi'

export default function StudentLookupPage() {
    const [studentId, setStudentId] = useState('')
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!studentId.trim()) return
        setLoading(true)
        setError('')
        setResult(null)
        try {
            // Search without auth
            const searchRes = await axios.get(`/api/allocations/search?q=${encodeURIComponent(studentId.trim())}`)
            if (searchRes.data.length === 0) {
                setError('No seat found for this Student ID. Please check and try again.')
                setLoading(false)
                return
            }
            const allocation = searchRes.data[0]
            // Get QR code
            let qrCode = null
            try {
                const qrRes = await axios.get(`/api/qrcode/${allocation.student_id}`)
                qrCode = qrRes.data.qrCode
            } catch (e) { }
            setResult({ ...allocation, qrCode })
        } catch (err) {
            setError('Something went wrong. Please try again.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-primary-900/20 to-dark-950" />
            <div className="absolute top-1/3 -left-32 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

            <div className="relative z-10 w-full max-w-lg">
                <div className="text-center mb-8 animate-slide-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4 shadow-2xl shadow-primary-500/30">
                        <HiOutlineAcademicCap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent">Find Your Seat</h1>
                    <p className="text-dark-400 mt-1">Enter your Student ID to view your exam seat</p>
                </div>

                <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                id="lookup-input"
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                className="input-field pl-12"
                                placeholder="Enter Student ID (e.g. 21CS001)"
                                autoFocus
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Find'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="mt-6 space-y-6 animate-slide-up">
                            <div className="p-6 bg-dark-900/50 rounded-2xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <HiOutlineLocationMarker className="w-6 h-6 text-primary-400" />
                                    <h3 className="text-lg font-bold text-white">Your Seat Information</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-dark-400">Student ID</p><p className="text-white font-mono font-semibold">{result.student_id}</p></div>
                                    <div><p className="text-xs text-dark-400">Name</p><p className="text-white">{result.student_name}</p></div>
                                    <div><p className="text-xs text-dark-400">Subject</p><p className="text-primary-400 font-semibold">{result.subject_code}</p></div>
                                    <div><p className="text-xs text-dark-400">Hall</p><p className="text-white font-semibold">{result.hall_name}</p></div>
                                    <div><p className="text-xs text-dark-400">Row</p><p className="text-white text-2xl font-bold">{result.row_num}</p></div>
                                    <div><p className="text-xs text-dark-400">Column</p><p className="text-white text-2xl font-bold">{result.col_num}</p></div>
                                </div>
                            </div>

                            {result.qrCode && (
                                <div className="text-center p-6 bg-dark-900/50 rounded-2xl">
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <HiOutlineQrcode className="w-5 h-5 text-primary-400" />
                                        <p className="text-sm font-medium text-dark-300">Your QR Code</p>
                                    </div>
                                    <img src={result.qrCode} alt="Seat QR Code" className="mx-auto rounded-xl bg-white p-2 w-48 h-48" />
                                    <p className="text-xs text-dark-500 mt-3">Scan to verify your seat details</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-center mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <a href="/login" className="text-sm text-dark-400 hover:text-primary-400 transition-colors">← Staff Login</a>
                </div>
            </div>
        </div>
    )
}
