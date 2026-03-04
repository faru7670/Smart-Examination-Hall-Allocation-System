import { useState, useEffect } from 'react'
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, Title
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { getStudents, getHalls, getAllocations } from '../lib/db'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6']

function StatCard({ icon, label, value, color, delay = 0 }) {
    const [display, setDisplay] = useState(0)
    const isNum = typeof value === 'number'
    useEffect(() => {
        if (!isNum) return
        let start = 0
        const step = Math.ceil(value / 30) || 1
        const timer = setInterval(() => {
            start = Math.min(start + step, value)
            setDisplay(start)
            if (start >= value) clearInterval(timer)
        }, 30)
        return () => clearInterval(timer)
    }, [value])

    const styles = {
        indigo: { grad: 'from-indigo-600 to-indigo-400', bg: 'bg-indigo-500/10', shadow: 'shadow-indigo-500/10' },
        purple: { grad: 'from-purple-600 to-purple-400', bg: 'bg-purple-500/10', shadow: 'shadow-purple-500/10' },
        amber: { grad: 'from-amber-600 to-amber-400', bg: 'bg-amber-500/10', shadow: 'shadow-amber-500/10' },
        emerald: { grad: 'from-emerald-600 to-emerald-400', bg: 'bg-emerald-500/10', shadow: 'shadow-emerald-500/10' },
    }[color]

    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:scale-[1.02] transition-all duration-300 shadow-xl ${styles.shadow} animate-slide-up group`}
            style={{ animationDelay: `${delay}ms` }}>
            <div className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-4`}>{icon}</div>
            <p className="text-4xl font-black text-white animate-count" style={{ animationDelay: `${delay + 100}ms` }}>
                {isNum ? display : value}
            </p>
            <p className="text-slate-400 text-sm mt-1 font-medium">{label}</p>
            <div className={`h-1 w-full rounded-full bg-gradient-to-r ${styles.grad} mt-4 opacity-60`} />
        </div>
    )
}

export default function DashboardPage() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [students, halls, allocs] = await Promise.all([getStudents(), getHalls(), getAllocations()])
                const totalSeats = halls.reduce((s, h) => s + h.capacity, 0)
                const subjectMap = {}
                students.forEach(s => { subjectMap[s.subject_code] = (subjectMap[s.subject_code] || 0) + 1 })
                setStats({
                    totalStudents: students.length, totalHalls: halls.length, totalSeats,
                    allocated: allocs.length,
                    pct: students.length > 0 ? Math.round(allocs.length / students.length * 100) : 0,
                    subjectDistribution: Object.entries(subjectMap).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
                    hallUtilization: halls.map(h => ({ name: h.name, capacity: h.capacity, seated: allocs.filter(a => a.hall_id === h.id).length })),
                    unallocated: students.length - allocs.length,
                })
            } catch (e) { console.error(e) }
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl shimmer" />)}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}</div>
        </div>
    )

    const subjectChart = {
        labels: stats?.subjectDistribution.slice(0, 10).map(s => s.code),
        datasets: [{ data: stats?.subjectDistribution.slice(0, 10).map(s => s.count), backgroundColor: COLORS, borderWidth: 0, hoverOffset: 12 }]
    }
    const hallChart = {
        labels: stats?.hallUtilization.map(h => h.name),
        datasets: [
            { label: 'Seated', data: stats?.hallUtilization.map(h => h.seated), backgroundColor: '#6366f1', borderRadius: 8, borderSkipped: false },
            { label: 'Capacity', data: stats?.hallUtilization.map(h => h.capacity), backgroundColor: '#1e293b', borderRadius: 8, borderSkipped: false },
        ]
    }
    const barOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } } },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { display: false }, border: { display: false } },
            y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b38' }, border: { display: false } },
        }
    }

    return (
        <div className="space-y-8">
            {/* Hero banner */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-transparent" />
                <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2" />
                <div className="relative">
                    <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Smart Allocation Platform</p>
                    <h2 className="text-3xl sm:text-4xl font-black">
                        <span className="gradient-text">Examination Hall</span><br />
                        <span className="text-white">Allocation System</span>
                    </h2>
                    <p className="text-slate-400 mt-3 max-w-md">Automated seat allocation with zero conflicts — subject separation enforced, fully visualized in 3D.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👨‍🎓" label="Total Students" value={stats?.totalStudents || 0} color="indigo" delay={0} />
                <StatCard icon="🏛️" label="Total Halls" value={stats?.totalHalls || 0} color="purple" delay={100} />
                <StatCard icon="🪑" label="Total Seats" value={stats?.totalSeats || 0} color="amber" delay={200} />
                <StatCard icon="✅" label="Allocated" value={`${stats?.pct || 0}%`} color="emerald" delay={300} />
            </div>

            {/* Charts */}
            {(stats?.subjectDistribution?.length > 0 || stats?.hallUtilization?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <h3 className="font-bold text-white">Subject Distribution</h3>
                        <p className="text-slate-500 text-xs mb-5">Students per subject</p>
                        {stats?.subjectDistribution?.length > 0
                            ? <div style={{ height: '220px' }}><Doughnut data={subjectChart} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, padding: 12, font: { size: 10 } } } } }} /></div>
                            : <p className="text-slate-500 text-center py-16">No student data yet</p>}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                        <h3 className="font-bold text-white">Hall Utilization</h3>
                        <p className="text-slate-500 text-xs mb-5">Seated vs capacity</p>
                        {stats?.hallUtilization?.length > 0
                            ? <div style={{ height: '220px' }}><Bar data={hallChart} options={barOptions} /></div>
                            : <p className="text-slate-500 text-center py-16">No hall data yet</p>}
                    </div>
                </div>
            )}

            {/* Allocation summary */}
            {stats?.allocated > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                    <h3 className="font-bold text-white mb-4">Allocation Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            ['Allocated', stats.allocated, 'text-emerald-400', 'bg-emerald-500/10'],
                            ['Unallocated', stats.unallocated, 'text-red-400', 'bg-red-500/10'],
                            ['Subjects', stats.subjectDistribution?.length || 0, 'text-indigo-400', 'bg-indigo-500/10'],
                            ['Halls Used', stats.hallUtilization?.filter(h => h.seated > 0).length || 0, 'text-amber-400', 'bg-amber-500/10'],
                        ].map(([label, val, color, bg]) => (
                            <div key={label} className={`${bg} rounded-xl p-4 text-center border border-slate-800`}>
                                <p className={`text-3xl font-black ${color}`}>{val}</p>
                                <p className="text-slate-400 text-xs mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state / quick start */}
            {stats?.totalStudents === 0 && stats?.totalHalls === 0 && (
                <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="text-6xl mb-4 animate-float">🚀</div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to allocate!</h3>
                    <p className="text-slate-400 text-sm mb-8">Follow the steps below to run your first exam seat allocation</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[['1', 'Add Halls', '🏛️'], ['2', 'Upload Students', '👨‍🎓'], ['3', 'Run Allocation', '🎯'], ['4', 'Export Report', '📄']].map(([n, label, emoji]) => (
                            <div key={n} className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-5 py-3 rounded-xl text-sm text-slate-300 hover:border-indigo-500/50 transition-colors">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">{n}</span>
                                <span>{emoji} {label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
