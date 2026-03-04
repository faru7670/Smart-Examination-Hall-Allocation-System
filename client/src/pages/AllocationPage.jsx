import { useState, useEffect } from 'react'
import { API, useAuth } from '../context/AuthContext'
import { HiOutlinePlay, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi'

const SUBJECT_COLORS = [
    { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30', hex: '#818cf8' },
    { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30', hex: '#f472b6' },
    { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', hex: '#fbbf24' },
    { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', hex: '#34d399' },
    { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', hex: '#f87171' },
    { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30', hex: '#22d3ee' },
    { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30', hex: '#a78bfa' },
    { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', hex: '#fb923c' },
    { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30', hex: '#2dd4bf' },
    { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', hex: '#fb7185' },
]

export default function AllocationPage() {
    const { user } = useAuth()
    const [halls, setHalls] = useState([])
    const [selectedHall, setSelectedHall] = useState(null)
    const [gridData, setGridData] = useState(null)
    const [allocating, setAllocating] = useState(false)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(true)
    const [subjectMap, setSubjectMap] = useState({})
    const [selectedSeat, setSelectedSeat] = useState(null)

    useEffect(() => { fetchHalls() }, [])

    const fetchHalls = async () => {
        setLoading(true)
        try {
            const r = await API.get('/halls')
            setHalls(r.data)
            if (r.data.length > 0) loadHallGrid(r.data[0])
        } catch (e) { }
        setLoading(false)
    }

    const loadHallGrid = async (hall) => {
        setSelectedHall(hall)
        try {
            const r = await API.get(`/allocations/hall/${hall.id}`)
            setGridData(r.data)
            // Build subject color map
            const subjects = new Set()
            r.data.grid.forEach(row => row.forEach(seat => { if (!seat.empty) subjects.add(seat.subject_code) }))
            const map = {}
            Array.from(subjects).sort().forEach((s, i) => { map[s] = SUBJECT_COLORS[i % SUBJECT_COLORS.length] })
            setSubjectMap(map)
        } catch (e) {
            setGridData(null)
        }
    }

    const handleAllocate = async () => {
        setAllocating(true)
        setResult(null)
        try {
            const r = await API.post('/allocate')
            setResult(r.data)
            if (selectedHall) loadHallGrid(selectedHall)
        } catch (err) {
            setResult({ error: err.response?.data?.error || 'Allocation failed' })
        }
        setAllocating(false)
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Seat Allocation</h1>
                    <p className="text-dark-400 mt-1">Visualize and generate seating arrangements</p>
                </div>
                {user?.role === 'admin' && (
                    <button onClick={handleAllocate} disabled={allocating} className="btn-primary flex items-center gap-2">
                        {allocating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlinePlay className="w-5 h-5" />}
                        {allocating ? 'Allocating...' : 'Run Allocation'}
                    </button>
                )}
            </div>

            {/* Allocation Result */}
            {result && (
                <div className={`glass-card p-6 animate-slide-up ${result.error ? 'border-red-500/50' : 'border-emerald-500/50'}`}>
                    {result.error ? (
                        <div className="flex items-center gap-3 text-red-400">
                            <HiOutlineExclamation className="w-6 h-6" />
                            <p>{result.error}</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2 text-emerald-400"><HiOutlineCheckCircle className="w-6 h-6" /><span className="font-semibold">Allocation Complete</span></div>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="text-dark-300">Allocated: <span className="text-white font-bold">{result.allocated}</span></span>
                                <span className="text-dark-300">Unallocated: <span className="text-amber-400 font-bold">{result.unallocated}</span></span>
                                <span className="text-dark-300">Violations: <span className={result.violations > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{result.violations}</span></span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Hall Tabs */}
            {halls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {halls.map(hall => (
                        <button
                            key={hall.id}
                            onClick={() => loadHallGrid(hall)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedHall?.id === hall.id
                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                    : 'text-dark-400 hover:text-white hover:bg-dark-700/50 border border-transparent'
                                }`}
                        >
                            {hall.name} ({hall.capacity})
                        </button>
                    ))}
                </div>
            )}

            {/* Legend */}
            {Object.keys(subjectMap).length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {Object.entries(subjectMap).map(([subject, color]) => (
                        <div key={subject} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${color.bg} border ${color.border}`}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                            <span className={`text-xs font-medium ${color.text}`}>{subject}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Seating Grid */}
            {gridData ? (
                <div className="glass-card p-6 animate-slide-up overflow-x-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{selectedHall?.name} — {gridData.total_seated}/{selectedHall?.capacity} seats</h3>
                        <button onClick={() => loadHallGrid(selectedHall)} className="btn-ghost"><HiOutlineRefresh className="w-4 h-4" /></button>
                    </div>

                    {/* Column headers */}
                    <div className="inline-block min-w-full">
                        <div className="flex gap-1 mb-1 ml-10">
                            {Array.from({ length: selectedHall?.cols || 0 }).map((_, c) => (
                                <div key={c} className="w-20 text-center text-xs text-dark-500">C{c + 1}</div>
                            ))}
                        </div>

                        {gridData.grid.map((row, ri) => (
                            <div key={ri} className="flex gap-1 mb-1">
                                <div className="w-9 flex items-center justify-center text-xs text-dark-500 flex-shrink-0">R{ri + 1}</div>
                                {row.map((seat, ci) => {
                                    const color = seat.empty ? null : subjectMap[seat.subject_code]
                                    return (
                                        <div
                                            key={ci}
                                            onClick={() => !seat.empty && setSelectedSeat(seat)}
                                            className={`w-20 h-14 rounded-lg flex flex-col items-center justify-center text-xs transition-all cursor-pointer ${seat.empty
                                                    ? 'bg-dark-800/30 border border-dark-700/30'
                                                    : `${color?.bg || 'bg-dark-700'} border ${color?.border || 'border-dark-600'} hover:scale-105 hover:shadow-lg`
                                                }`}
                                        >
                                            {!seat.empty && (
                                                <>
                                                    <span className={`font-semibold ${color?.text || 'text-white'} text-[10px] truncate w-full text-center px-1`}>{seat.student_id}</span>
                                                    <span className="text-dark-400 text-[9px] truncate w-full text-center">{seat.subject_code}</span>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            ) : loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="glass-card p-12 text-center text-dark-400">
                    <p>No halls available. Add halls first.</p>
                </div>
            )}

            {/* Seat Detail Modal */}
            {selectedSeat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSeat(null)}>
                    <div className="glass-card p-8 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Seat Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-dark-400">Student ID</span><span className="text-white font-mono">{selectedSeat.student_id}</span></div>
                            <div className="flex justify-between"><span className="text-dark-400">Name</span><span className="text-white">{selectedSeat.student_name}</span></div>
                            <div className="flex justify-between"><span className="text-dark-400">Subject</span><span className="text-primary-400">{selectedSeat.subject_code}</span></div>
                            <div className="flex justify-between"><span className="text-dark-400">Hall</span><span className="text-white">{selectedSeat.hall_name}</span></div>
                            <div className="flex justify-between"><span className="text-dark-400">Position</span><span className="text-white">Row {selectedSeat.row_num}, Col {selectedSeat.col_num}</span></div>
                        </div>
                        <button onClick={() => setSelectedSeat(null)} className="btn-primary w-full mt-6">Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}
