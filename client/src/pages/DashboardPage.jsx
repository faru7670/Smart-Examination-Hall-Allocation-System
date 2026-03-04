import { useState, useEffect } from 'react'
import { API } from '../context/AuthContext'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineViewGrid, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const COLORS = ['#6366f1', '#d946ef', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function DashboardPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        API.get('/analytics').then(r => setData(r.data)).catch(() => { }).finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

    const stats = [
        { label: 'Total Students', value: data?.totalStudents || 0, icon: HiOutlineUsers, color: 'from-primary-500 to-primary-600', bg: 'bg-primary-500/10' },
        { label: 'Exam Halls', value: data?.totalHalls || 0, icon: HiOutlineOfficeBuilding, color: 'from-accent-500 to-accent-600', bg: 'bg-accent-500/10' },
        { label: 'Total Seats', value: data?.totalSeats || 0, icon: HiOutlineViewGrid, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10' },
        { label: 'Allocated', value: `${data?.allocationPercentage || 0}%`, icon: data?.allocationPercentage >= 80 ? HiOutlineCheckCircle : HiOutlineExclamationCircle, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10' },
    ]

    const subjectChart = {
        labels: data?.subjectDistribution?.map(s => s.subject_code) || [],
        datasets: [{
            data: data?.subjectDistribution?.map(s => s.count) || [],
            backgroundColor: COLORS.slice(0, data?.subjectDistribution?.length || 0),
            borderWidth: 0,
            hoverOffset: 8,
        }]
    }

    const hallChart = {
        labels: data?.hallUtilization?.map(h => h.name) || [],
        datasets: [
            { label: 'Seated', data: data?.hallUtilization?.map(h => h.seated) || [], backgroundColor: '#6366f1', borderRadius: 8 },
            { label: 'Capacity', data: data?.hallUtilization?.map(h => h.capacity) || [], backgroundColor: '#334155', borderRadius: 8 },
        ]
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="text-dark-400 mt-1">Overview of examination hall allocation</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, i) => (
                    <div key={stat.label} className="stat-card group" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="flex items-center justify-between">
                            <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-sm text-dark-400">{stat.label}</p>
                        </div>
                        <div className={`h-1 w-full rounded-full bg-gradient-to-r ${stat.color} opacity-50`} />
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Subject Distribution</h3>
                    {data?.subjectDistribution?.length > 0 ? (
                        <div className="h-64 flex items-center justify-center">
                            <Doughnut data={subjectChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, usePointStyle: true } } } }} />
                        </div>
                    ) : <p className="text-dark-400 text-center py-16">No student data yet</p>}
                </div>

                <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Hall Utilization</h3>
                    {data?.hallUtilization?.length > 0 ? (
                        <div className="h-64">
                            <Bar data={hallChart} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#94a3b8' }, grid: { display: false } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } } }, plugins: { legend: { labels: { color: '#94a3b8' } } } }} />
                        </div>
                    ) : <p className="text-dark-400 text-center py-16">No hall data yet</p>}
                </div>
            </div>

            {/* Quick stats */}
            {data?.allocatedStudents > 0 && (
                <div className="glass-card p-6 animate-slide-up">
                    <h3 className="text-lg font-semibold text-white mb-4">Allocation Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-dark-900/50 rounded-xl">
                            <p className="text-2xl font-bold text-emerald-400">{data.allocatedStudents}</p>
                            <p className="text-xs text-dark-400 mt-1">Allocated</p>
                        </div>
                        <div className="text-center p-4 bg-dark-900/50 rounded-xl">
                            <p className="text-2xl font-bold text-red-400">{data.unallocatedStudents}</p>
                            <p className="text-xs text-dark-400 mt-1">Unallocated</p>
                        </div>
                        <div className="text-center p-4 bg-dark-900/50 rounded-xl">
                            <p className="text-2xl font-bold text-primary-400">{data.subjectDistribution?.length || 0}</p>
                            <p className="text-xs text-dark-400 mt-1">Subjects</p>
                        </div>
                        <div className="text-center p-4 bg-dark-900/50 rounded-xl">
                            <p className="text-2xl font-bold text-amber-400">{data.totalHalls}</p>
                            <p className="text-xs text-dark-400 mt-1">Halls</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
