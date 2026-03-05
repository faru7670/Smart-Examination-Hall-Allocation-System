import { useState, useEffect } from 'react'
import { getStudents, getHalls, getAllocations } from '../lib/db'
import { useToast } from '../context/ToastContext'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Users, Maximize, Target, Activity, CheckCircle2, AlertCircle } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function DashboardPage({ collegeCode }) {
    const toast = useToast()
    const [stats, setStats] = useState({ students: 0, halls: 0, totalCapacity: 0, allocations: 0 })
    const [subDist, setSubDist] = useState({})
    const [hallDist, setHallDist] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (collegeCode) loadDashboard()
    }, [collegeCode])

    const loadDashboard = async () => {
        try {
            const [s, h, a] = await Promise.all([getStudents(collegeCode), getHalls(collegeCode), getAllocations(collegeCode)])

            // Stats
            const totalCap = h.reduce((sum, hall) => sum + hall.capacity, 0)
            setStats({ students: s.length, halls: h.length, totalCapacity: totalCap, allocations: a.length })

            // Subject Distribution for Donut
            const subjects = {}
            s.forEach(student => {
                subjects[student.subject_code] = (subjects[student.subject_code] || 0) + 1
            })
            setSubDist(subjects)

            // Hall Utilization for Bar
            const utilization = {}
            h.forEach(hall => {
                const filled = a.filter(alloc => alloc.hall_id === hall.id).length
                utilization[hall.name] = { filled, capacity: hall.capacity }
            })
            setHallDist(utilization)

        } catch (e) { toast.error("Failed to load dashboard data") }
        setLoading(false)
    }

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 glass rounded-3xl shimmer border border-slate-200" />)}
        </div>
    )

    // Chart configs
    const donutData = {
        labels: Object.keys(subDist),
        datasets: [{
            data: Object.values(subDist),
            backgroundColor: ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
            borderWidth: 0,
            hoverOffset: 10
        }]
    }

    const barData = {
        labels: Object.keys(hallDist),
        datasets: [
            { label: 'Occupied Seats', data: Object.values(hallDist).map(d => d.filled), backgroundColor: '#6366f1', borderRadius: 6 },
            { label: 'Unused Capacity', data: Object.values(hallDist).map(d => d.capacity - d.filled), backgroundColor: '#1e293b', borderRadius: 6 }
        ]
    }

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } },
        scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: '#64748b' } },
            y: { stacked: true, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } }
        }
    }

    const donutOptions = {
        plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
        cutout: '75%'
    }

    const unallocated = stats.students - stats.allocations
    const shortSeats = stats.students > stats.totalCapacity

    return (
        <div className="space-y-8 animate-slide-up">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform border-t border-t-indigo-500/30">
                    <div className="absolute top-0 right-0 p-6 bg-indigo-500/10 rounded-bl-full -z-10 group-hover:bg-indigo-500/20 transition-colors" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><Users size={24} /></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Enrolled</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900">{stats.students}</h3>
                </div>

                <div className="glass p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform border-t border-t-amber-500/30">
                    <div className="absolute top-0 right-0 p-6 bg-amber-500/10 rounded-bl-full -z-10 group-hover:bg-amber-500/20 transition-colors" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center"><Maximize size={24} /></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Venues</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900">{stats.halls} <span className="text-lg text-slate-600 font-mono">({stats.totalCapacity} seats)</span></h3>
                </div>

                <div className="glass p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform border-t border-t-emerald-500/30">
                    <div className="absolute top-0 right-0 p-6 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:bg-emerald-500/20 transition-colors" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Target size={24} /></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Allocated</span>
                    </div>
                    <h3 className="text-4xl font-black text-emerald-400">{stats.allocations}</h3>
                </div>

                <div className="glass p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform border-t border-t-pink-500/30">
                    <div className="absolute top-0 right-0 p-6 bg-pink-500/10 rounded-bl-full -z-10 group-hover:bg-pink-500/20 transition-colors" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center"><Activity size={24} /></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Pending</span>
                    </div>
                    <h3 className="text-4xl font-black text-pink-400">{unallocated}</h3>
                </div>
            </div>

            {/* System Status Banner */}
            {shortSeats && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 text-red-200">
                    <AlertCircle className="text-red-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-400">Capacity Warning</h4>
                        <p className="text-sm opacity-90">You have {stats.students} students but only {stats.totalCapacity} physical seats. Add more halls before allocating.</p>
                    </div>
                </div>
            )}
            {!shortSeats && unallocated === 0 && stats.students > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4 text-emerald-200">
                    <CheckCircle2 className="text-emerald-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-emerald-400">System Ready</h4>
                        <p className="text-sm opacity-90">All scheduled students have been successfully allocated isolated seats. Seating charts are ready for printing.</p>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-900">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full" /> Hall Utilization Map
                    </h3>
                    <div className="h-72">
                        {Object.keys(hallDist).length > 0 ? (
                            <Bar data={barData} options={barOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600 font-mono text-sm border-2 border-dashed border-slate-200 rounded-2xl">No halls configured</div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 glass p-6 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-900">
                        <div className="w-2 h-6 bg-purple-500 rounded-full" /> Subject Density
                    </h3>
                    <div className="h-64 flex items-center justify-center relative">
                        {Object.keys(subDist).length > 0 ? (
                            <>
                                <Doughnut data={donutData} options={donutOptions} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -ml-24">
                                    <span className="text-3xl font-black text-slate-900">{Object.keys(subDist).length}</span>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Subjects</span>
                                </div>
                            </>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-600 font-mono text-sm border-2 border-dashed border-slate-200 rounded-2xl">No subjects found</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Start Guide */}
            {stats.students === 0 && stats.halls === 0 && (
                <div className="glass p-8 rounded-3xl border border-slate-200 mt-8 relative overflow-hidden border-t-2 border-t-cyan-500/50">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />
                    <h3 className="text-2xl font-black mb-4 text-slate-900">🚀 Initial Setup Guide</h3>
                    <div className="grid md:grid-cols-3 gap-6 relative z-10">
                        <div className="bg-white/80 p-6 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <span className="bg-indigo-500 text-slate-900 w-8 h-8 rounded-lg flex items-center justify-center font-bold mb-4 shadow-lg shadow-indigo-500/30">1</span>
                            <h4 className="font-bold text-slate-900 mb-2">Upload Students</h4>
                            <p className="text-sm text-slate-600">Head to the Students tab and upload your `.csv` file containing Roll Numbers and Subject priorities.</p>
                        </div>
                        <div className="bg-white/80 p-6 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <span className="bg-amber-500 text-slate-900 w-8 h-8 rounded-lg flex items-center justify-center font-bold mb-4 shadow-lg shadow-amber-500/30">2</span>
                            <h4 className="font-bold text-slate-900 mb-2">Configure Halls</h4>
                            <p className="text-sm text-slate-600">Go to the Halls tab and register physical exam venues by setting exact row and column dimensions.</p>
                        </div>
                        <div className="bg-white/80 p-6 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <span className="bg-emerald-500 text-slate-900 w-8 h-8 rounded-lg flex items-center justify-center font-bold mb-4 shadow-lg shadow-emerald-500/30">3</span>
                            <h4 className="font-bold text-slate-900 mb-2">Run Allocation</h4>
                            <p className="text-sm text-slate-600">In the Allocation tab, securely execute the matrix algorithm to seat students and completely avoid adjacent cheating.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
