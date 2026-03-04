import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { getHalls, runAllocation, getHallAllocation, getAllocations } from '../lib/db'

// ─── 3D COMPONENTS ────────────────────────────────────────────────────────────

const COLORS_HEX = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6', '#fb7185']

function Seat({ position, color, occupied, label, onClick, isSelected }) {
    const mesh = useRef()
    const [hovered, setHovered] = useState(false)

    useFrame(() => {
        if (mesh.current) {
            mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, hovered || isSelected ? 1.3 : 1, 0.1)
        }
    })

    const baseColor = occupied ? color : '#1e293b'
    const emissive = hovered || isSelected ? (occupied ? color : '#334155') : '#000000'

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); onClick && onClick() }}>
            <mesh ref={mesh} position={[0, 0.15, 0]}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}>
                <boxGeometry args={[0.7, 0.3, 0.7]} />
                <meshStandardMaterial color={baseColor} emissive={emissive} emissiveIntensity={0.3} roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Desk */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.75, 0.05, 0.75]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            {occupied && label && (
                <Text position={[0, 0.35, 0.38]} fontSize={0.13} color="white" anchorX="center" anchorY="middle" maxWidth={0.65}>
                    {label}
                </Text>
            )}
        </group>
    )
}

function HallScene({ hall, seats, subjectMap, onSeatClick, selectedSeat }) {
    const cols = hall.cols
    const rows = hall.rows
    const SPACING = 1.2

    return (
        <>
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[cols * SPACING / 2, 8, rows * SPACING / 2]} intensity={1.5} color="#a5b4fc" />
            <pointLight position={[0, 6, 0]} intensity={0.8} color="#e879f9" />

            {/* Floor */}
            <mesh position={[cols * SPACING / 2 - SPACING / 2, -0.1, rows * SPACING / 2 - SPACING / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[cols * SPACING + 2, rows * SPACING + 2]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>

            {/* Seats */}
            {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                    const seat = seats.find(s => s.row_num === r + 1 && s.col_num === c + 1)
                    const color = seat ? (subjectMap[seat.subject_code] || COLORS_HEX[0]) : '#1e293b'
                    return (
                        <Seat
                            key={`${r}-${c}`}
                            position={[c * SPACING, 0, r * SPACING]}
                            color={color}
                            occupied={!!seat}
                            label={seat?.student_id}
                            isSelected={selectedSeat && seat && selectedSeat.id === seat.id}
                            onClick={() => seat && onSeatClick(seat)}
                        />
                    )
                })
            )}

            <OrbitControls enableDamping dampingFactor={0.05} minDistance={3} maxDistance={50} />
        </>
    )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AllocationPage() {
    const [halls, setHalls] = useState([])
    const [selectedHall, setSelectedHall] = useState(null)
    const [seats, setSeats] = useState([])
    const [subjectMap, setSubjectMap] = useState({})
    const [selectedSeat, setSelectedSeat] = useState(null)
    const [allocating, setAllocating] = useState(false)
    const [allocResult, setAllocResult] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingGrid, setLoadingGrid] = useState(false)
    const [view, setView] = useState('3d')
    const [search, setSearch] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const h = await getHalls()
            setHalls(h)
            if (h.length > 0) loadGrid(h[0])
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const loadGrid = async (hall) => {
        setSelectedHall(hall); setLoadingGrid(true); setSeats([])
        try {
            const s = await getHallAllocation(hall.id)
            setSeats(s)
            const subjects = [...new Set(s.map(x => x.subject_code))]
            const map = {}
            subjects.sort().forEach((sub, i) => { map[sub] = COLORS_HEX[i % COLORS_HEX.length] })
            setSubjectMap(map)
        } catch { }
        setLoadingGrid(false)
    }

    useEffect(() => { load() }, [])

    const handleAllocate = async () => {
        setAllocating(true); setAllocResult(null)
        try {
            const r = await runAllocation()
            setAllocResult(r)
            if (selectedHall) loadGrid(selectedHall)
            else load()
        } catch (err) { setAllocResult({ error: err.message }) }
        setAllocating(false)
    }

    const filteredSeats = search ? seats.filter(s =>
        String(s.student_id).toUpperCase().includes(search.toUpperCase()) ||
        String(s.student_name).toUpperCase().includes(search.toUpperCase())
    ) : seats

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">🎯 Allocation</h2>
                    <p className="text-slate-400 text-sm mt-1">3D seat visualization · Run algorithm to allocate seats</p>
                </div>
                <button onClick={handleAllocate} disabled={allocating}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                    {allocating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '▶'}
                    {allocating ? 'Allocating...' : 'Run Allocation'}
                </button>
            </div>

            {/* Result banner */}
            {allocResult && (
                <div className={`rounded-2xl p-4 border ${allocResult.error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    {allocResult.error ? <p>❌ {allocResult.error}</p> : (
                        <div className="flex flex-wrap gap-6 items-center">
                            <span className="text-emerald-400 font-semibold">✅ Allocation complete!</span>
                            <span className="text-slate-300">Seats filled: <b className="text-white">{allocResult.allocated}</b></span>
                            <span className="text-slate-300">Unallocated: <b className="text-amber-400">{allocResult.unallocated}</b></span>
                        </div>
                    )}
                </div>
            )}

            {/* Hall selector */}
            {halls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {halls.map(h => (
                        <button key={h.id} onClick={() => loadGrid(h)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedHall?.id === h.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                            {h.name} <span className="opacity-60">({h.capacity})</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Subject legend */}
            {Object.keys(subjectMap).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(subjectMap).map(([sub, color]) => (
                        <div key={sub} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-slate-300">{sub}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* View toggle + search */}
            {selectedHall && (
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                        {['3d', '2d'].map(v => (
                            <button key={v} onClick={() => setView(v)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                                {v === '3d' ? '🎲 3D' : '⊞ 2D'}
                            </button>
                        ))}
                    </div>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search student in this hall..."
                        className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500" />
                    <span className="text-slate-400 text-sm">{seats.length}/{selectedHall?.capacity} occupied</span>
                </div>
            )}

            {/* 3D / 2D view */}
            {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : !selectedHall ? (
                <div className="text-center py-16 text-slate-500">
                    <div className="text-6xl mb-4">🏛️</div>
                    <p>Add halls first, then run allocation</p>
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {view === '3d' ? (
                        <div style={{ height: '520px' }}>
                            {loadingGrid ? (
                                <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : (
                                <Canvas camera={{ position: [selectedHall.cols * 0.6, selectedHall.rows * 0.8, selectedHall.rows * 1.2], fov: 50 }} shadows>
                                    <Suspense fallback={null}>
                                        <HallScene hall={selectedHall} seats={filteredSeats} subjectMap={subjectMap} onSeatClick={setSelectedSeat} selectedSeat={selectedSeat} />
                                    </Suspense>
                                </Canvas>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 overflow-auto max-h-[520px]">
                            <div className="inline-block">
                                {Array.from({ length: selectedHall.rows }).map((_, r) => (
                                    <div key={r} className="flex gap-1 mb-1">
                                        <span className="w-8 text-xs text-slate-600 flex items-center justify-end pr-1">R{r + 1}</span>
                                        {Array.from({ length: selectedHall.cols }).map((_, c) => {
                                            const seat = seats.find(s => s.row_num === r + 1 && s.col_num === c + 1)
                                            const color = seat ? subjectMap[seat.subject_code] : null
                                            const highlighted = search && filteredSeats.includes(seat)
                                            return (
                                                <div key={c} onClick={() => seat && setSelectedSeat(seat)}
                                                    className={`w-16 h-12 rounded-lg flex flex-col items-center justify-center text-[10px] cursor-pointer transition-all hover:scale-110 ${seat ? 'border' : 'bg-slate-800/30 border border-slate-700/30'} ${highlighted ? 'ring-2 ring-yellow-400' : ''}`}
                                                    style={seat ? { backgroundColor: `${color}22`, borderColor: `${color}55` } : {}}>
                                                    {seat && (
                                                        <>
                                                            <span className="font-semibold truncate w-full text-center px-1" style={{ color }}>{seat.student_id}</span>
                                                            <span className="text-slate-400 truncate w-full text-center">{seat.subject_code}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Seat detail modal */}
            {selectedSeat && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSeat(null)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-5">📍 Seat Details</h3>
                        {[
                            ['Student ID', selectedSeat.student_id],
                            ['Name', selectedSeat.student_name],
                            ['Subject', selectedSeat.subject_code],
                            ['Hall', selectedSeat.hall_name],
                            ['Position', `Row ${selectedSeat.row_num}, Col ${selectedSeat.col_num}`],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-2.5 border-b border-slate-800 last:border-0">
                                <span className="text-slate-400 text-sm">{k}</span>
                                <span className="text-white text-sm font-medium">{v}</span>
                            </div>
                        ))}
                        <button onClick={() => setSelectedSeat(null)} className="w-full mt-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all">Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}
