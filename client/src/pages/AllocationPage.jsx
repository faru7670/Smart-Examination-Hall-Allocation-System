import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { getStudents, getHalls, getAllocations, saveAllocations } from '../lib/db'
import { allocateSeats } from '../lib/allocate'
import { useToast } from '../context/ToastContext'
import { Play, Columns, Maximize2, X, Activity } from 'lucide-react'

// --- 3D Components ---
const SEAT_SPACING = 1.3
const palette = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316']

function Seat3D({ position, color, occupied, data, onClick }) {
    const meshRef = useRef()
    const [hovered, setHover] = useState(false)
    const targetScale = hovered ? 1.15 : 1
    const baseColor = occupied ? color : '#1e293b'

    // Smooth hover animation
    useFrame((state, delta) => {
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 10 * delta)
        // Add gentle breathing effect if occupied
        if (occupied && !hovered) {
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05
        }
    })

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
                onPointerOut={(e) => { setHover(false); document.body.style.cursor = 'auto' }}
                onClick={(e) => { e.stopPropagation(); if (occupied) onClick(data) }}
            >
                <boxGeometry args={[0.9, 0.4, 0.9]} />
                <meshStandardMaterial
                    color={baseColor}
                    roughness={0.2}
                    metalness={0.8}
                    emissive={baseColor}
                    emissiveIntensity={hovered && occupied ? 0.8 : (occupied ? 0.2 : 0)}
                />
            </mesh>
            {/* Seat Backrest */}
            <mesh position={[0, 0.35, -0.35]}>
                <boxGeometry args={[0.9, 0.4, 0.1]} />
                <meshStandardMaterial color={baseColor} roughness={0.4} metalness={0.6} />
            </mesh>
        </group>
    )
}

function HallLayout3D({ hall, allocations, onSeatClick }) {
    if (!hall) return null
    const { rows, cols } = hall

    // Center the whole grid on origin
    const offsetX = ((cols - 1) * SEAT_SPACING) / 2
    const offsetZ = ((rows - 1) * SEAT_SPACING) / 2

    // Subject color mapping
    const subjectColors = useMemo(() => {
        const unique = [...new Set(allocations.map(a => a.subject_code))]
        return unique.reduce((acc, code, idx) => {
            acc[code] = palette[idx % palette.length]
            return acc
        }, {})
    }, [allocations])

    const seats = []
    for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
            const alloc = allocations.find(a => a.row_num === r && a.col_num === c)
            const posX = (c - 1) * SEAT_SPACING - offsetX
            const posZ = (r - 1) * SEAT_SPACING - offsetZ

            seats.push(
                <Seat3D
                    key={`${r}-${c}`}
                    position={[posX, 0, posZ]}
                    color={alloc ? subjectColors[alloc.subject_code] : '#334155'}
                    occupied={!!alloc}
                    data={alloc}
                    onClick={onSeatClick}
                />
            )
        }
    }

    // Floor Base
    return (
        <group>
            <mesh position={[0, -0.3, 0]} receiveShadow>
                <boxGeometry args={[cols * SEAT_SPACING + 1, 0.1, rows * SEAT_SPACING + 1]} />
                <meshStandardMaterial color="#0b1120" roughness={0.9} />
            </mesh>
            {/* Grid Lines on Floor */}
            <gridHelper args={[Math.max(rows, cols) * SEAT_SPACING * 1.5, Math.max(rows, cols), '#1e293b', '#0f172a']} position={[0, -0.24, 0]} />
            {seats}
        </group>
    )
}

export default function AllocationPage({ collegeCode, isStaff }) {
    const toast = useToast()
    const [halls, setHalls] = useState([])
    const [allocations, setAllocations] = useState([])
    const [students, setStudents] = useState([])
    const [activeHallId, setActiveHallId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [viewMode, setViewMode] = useState('3d') // '3d' or '2d'
    const [selectedStudent, setSelectedStudent] = useState(null)

    const loadData = async () => {
        try {
            const [h, a, s] = await Promise.all([getHalls(collegeCode), getAllocations(collegeCode), getStudents(collegeCode)])
            setHalls(h)
            setAllocations(a)
            setStudents(s)
            if (h.length > 0 && !activeHallId) setActiveHallId(h[0].id)
        } catch (e) { toast.error(e.message) }
        setLoading(false)
    }

    useEffect(() => {
        if (collegeCode) loadData()
    }, [collegeCode])

    const handleRunLayout = async () => {
        if (students.length === 0 || halls.length === 0) return toast.warning("Needs students and halls first.")
        if (!window.confirm("This will clear existing allocations. Run algorithm?")) return

        setRunning(true)
        try {
            const result = allocateSeats(students, halls)
            await saveAllocations(collegeCode, result.allocations)

            if (result.conflicts > 0) toast.warning(`Allocated, but ${result.conflicts} subject collision(s) could not be avoided due to hall size.`)
            else toast.success(`Perfect allocation: ${result.allocations.length} seated!`)

            if (result.unallocated.length > 0) toast.error(`${result.unallocated.length} students could not fit anywhere.`)

            loadData()
        } catch (e) { toast.error(e.message) }
        setRunning(false)
    }

    const activeHall = halls.find(h => h.id === activeHallId)
    const hallAllocations = allocations.filter(a => a.hall_id === activeHallId)

    const subjectColors = useMemo(() => {
        const unique = [...new Set(hallAllocations.map(a => a.subject_code))]
        return unique.reduce((acc, code, idx) => { acc[code] = palette[idx % palette.length]; return acc }, {})
    }, [hallAllocations])

    if (loading) return <div className="h-64 rounded-3xl shimmer border border-slate-800 animate-slide-up" />

    // --- 2D Grid Render ---
    const render2DMenu = () => {
        if (!activeHall) return null
        const grid = Array(activeHall.rows).fill(null).map(() => Array(activeHall.cols).fill(null))
        hallAllocations.forEach(a => grid[a.row_num - 1][a.col_num - 1] = a)

        return (
            <div className="overflow-auto max-h-[600px] p-6 no-scrollbar relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="inline-grid gap-3 relative z-10 mx-auto" style={{ gridTemplateColumns: `repeat(${activeHall.cols}, minmax(0, 1fr))` }}>
                    {grid.map((row, r) => row.map((cell, c) => (
                        <div key={`${r}-${c}`}
                            onClick={() => cell && setSelectedStudent(cell)}
                            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all cursor-pointer ${cell ? 'hover:scale-110 shadow-lg' : 'border-dashed border-slate-700 bg-slate-900/40 relative group'}`}
                            style={cell ? { backgroundColor: `${subjectColors[cell.subject_code]}20`, borderColor: subjectColors[cell.subject_code], color: subjectColors[cell.subject_code] } : {}}>
                            {cell ? (
                                <>
                                    <span className="text-white text-xs whitespace-nowrap overflow-hidden text-ellipsis w-14 text-center">{cell.student_id}</span>
                                    <span className="opacity-70 mt-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: subjectColors[cell.subject_code] }}><span className="text-white mix-blend-difference">{cell.subject_code}</span></span>
                                </>
                            ) : (
                                <span className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">R{r + 1}C{c + 1}</span>
                            )}
                        </div>
                    )))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-slide-up h-[85vh] flex flex-col">
            <div className="glass p-6 rounded-3xl border-l-[6px] border-l-emerald-500 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Activity size={24} /></div>
                        <h2 className="text-3xl font-black">Allocation Visualizer</h2>
                    </div>
                    <p className="text-slate-400 ml-16">{isStaff ? "View seating arrangements." : "Run the matrix algorithm to generate zero-conflict seating."}</p>
                </div>

                <div className="flex items-center gap-3 ml-16 lg:ml-0 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                    <button onClick={() => setViewMode('3d')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${viewMode === '3d' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                        <Maximize2 size={18} /> 3D Enivornment
                    </button>
                    <button onClick={() => setViewMode('2d')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${viewMode === '2d' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                        <Columns size={18} /> 2D Matrix Map
                    </button>
                    {!isStaff && (
                        <div className="border-l border-slate-700 pl-3 ml-2 border-dashed">
                            <button onClick={handleRunLayout} disabled={running} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all w-max leading-none">
                                {running ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing</> : <><Play fill="currentColor" size={16} /> Run Algorithm</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {halls.length > 0 ? (
                <div className="flex flex-col flex-1 overflow-hidden min-h-[500px]">
                    {/* Hall Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 shrink-0 border-b border-slate-800">
                        {halls.map(h => (
                            <button key={h.id} onClick={() => setActiveHallId(h.id)}
                                className={`px-5 py-3 rounded-t-2xl font-bold text-sm tracking-widest whitespace-nowrap transition-colors uppercase relative
                                    ${activeHallId === h.id ? 'text-white bg-slate-900 border-t border-x border-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>
                                {h.name}
                                {activeHallId === h.id && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-full" />}
                            </button>
                        ))}
                    </div>

                    {/* Stage */}
                    <div className="flex-1 bg-slate-950 rounded-b-3xl rounded-tr-3xl relative overflow-hidden border border-t-0 border-slate-800 shadow-2xl flex">

                        {viewMode === '3d' ? (
                            <div className="w-full h-full relative cursor-move">
                                <div className="absolute top-6 left-6 z-10 pointer-events-none mix-blend-difference">
                                    <h3 className="text-4xl font-black text-white mix-blend-overlay opacity-50 tracking-tighter uppercase">{activeHall?.name}</h3>
                                    <p className="text-slate-400 font-mono font-bold tracking-widest">3D HALL RENDER</p>
                                </div>
                                <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
                                    <color attach="background" args={['#020617']} />
                                    <fog attach="fog" args={['#020617', 15, 30]} />
                                    <ambientLight intensity={0.4} />
                                    <pointLight position={[0, 10, 0]} intensity={1.5} color="#indigo" />
                                    <directionalLight position={[5, 10, -5]} intensity={1} castShadow />

                                    <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={25} />

                                    <HallLayout3D hall={activeHall} allocations={hallAllocations} onSeatClick={setSelectedStudent} />
                                </Canvas>
                                <div className="absolute bottom-6 right-6 z-10 glass px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 border-indigo-500/20 text-right">
                                    <p>Left Click: Rotate Scene</p>
                                    <p>Scroll: Zoom in/out</p>
                                    <p className="text-indigo-400">Click Seat: View Details</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-slate-900/50 flex items-center justify-center p-8">
                                {render2DMenu()}
                            </div>
                        )}

                        {/* Subject Legend */}
                        <div className="absolute top-6 right-6 w-56 glass p-5 rounded-2xl shadow-xl z-10 border-indigo-500/20">
                            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">Subject Legend</h4>
                            {Object.entries(subjectColors).length > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(subjectColors).map(([sub, col]) => (
                                        <div key={sub} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: col, boxShadow: `0 0 10px ${col}80` }} />
                                            <span className="text-sm font-bold text-white tracking-widest font-mono">{sub}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 font-mono">No allocation data</p>}
                        </div>

                        {/* Student Details Modal */}
                        {selectedStudent && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 glass p-6 rounded-3xl z-20 shadow-2xl border-purple-500/50 animate-slide-up bg-slate-900/95 backdrop-blur-xl">
                                <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
                                    <X size={20} />
                                </button>
                                <div className="w-16 h-16 rounded-full mx-auto mb-4 border-2 shadow-xl flex items-center justify-center text-2xl" style={{ borderColor: subjectColors[selectedStudent.subject_code], backgroundColor: `${subjectColors[selectedStudent.subject_code]}20`, color: subjectColors[selectedStudent.subject_code] }}>
                                    👨‍🎓
                                </div>
                                <h3 className="text-xl font-black text-center text-white leading-tight mb-1">{selectedStudent.student_name}</h3>
                                <p className="text-sm text-center text-slate-400 font-mono tracking-wider mb-6">{selectedStudent.student_id}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subject</span>
                                        <span className="text-sm font-black tracking-widest" style={{ color: subjectColors[selectedStudent.subject_code] }}>{selectedStudent.subject_code}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seat Position</span>
                                        <span className="text-sm font-black text-white tracking-widest font-mono">R{selectedStudent.row_num} • C{selectedStudent.col_num}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass p-16 rounded-3xl text-center border-dashed border-2 border-slate-700 h-64 flex flex-col items-center justify-center text-slate-500">
                    <Activity size={40} className="mb-4 opacity-50" />
                    <p className="font-bold text-xl text-white mb-2">No Halls Available</p>
                    <p className="text-sm">Please create halls in the Halls tab before running algorithms.</p>
                </div>
            )}
        </div>
    )
}
