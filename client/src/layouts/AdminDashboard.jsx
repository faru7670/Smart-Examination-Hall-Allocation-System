import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getStudents } from '../lib/db'

// Admin Pages
import DashboardPage from '../pages/DashboardPage'
import StudentsPage from '../pages/StudentsPage'
import HallsPage from '../pages/HallsPage'
import AllocationPage from '../pages/AllocationPage'
import ReportsPage from '../pages/ReportsPage'
import StaffManagementPage from '../pages/StaffManagementPage' // new for creating invigilators

const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'students', label: '👨‍🎓 Students' },
    { id: 'halls', label: '🏛️ Halls' },
    { id: 'staff', label: '👥 Staff' },
    { id: 'allocation', label: '🎯 Allocation' },
    { id: 'reports', label: '📄 Reports' },
]

export default function AdminDashboard() {
    const { userData, logout } = useAuth()
    const { theme } = useTheme()
    const navigate = useNavigate()

    const [tab, setTab] = useState('dashboard')
    const [studentCount, setStudentCount] = useState(0)

    useEffect(() => {
        if (userData?.collegeCode) {
            getStudents(userData.collegeCode).then(s => setStudentCount(s.length)).catch(console.error)
        }
    }, [userData?.collegeCode, tab])

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    if (!userData?.collegeCode) return <div className="p-8 text-center text-red-500">Error loading Admin Context</div>

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            {/* Top Navbar */}
            <header className="sticky top-0 z-50 glass border-b border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">🏛️</div>
                        <div>
                            <h1 className="font-bold text-xl hidden sm:block tracking-tight text-inherit">Smart<span className="text-indigo-500">Alloc</span></h1>
                            <p className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest hidden sm:block">Code: {userData.collegeCode}</p>
                        </div>
                    </div>

                    <nav className="flex space-x-1 sm:space-x-2 py-4 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {TABS.map(t => {
                            const active = tab === t.id
                            return (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                    ${active ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50'}`}>
                                    {t.label}
                                    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="flex items-center gap-5 py-4 pl-4 border-l border-slate-800 ml-2 hidden sm:flex">
                        <div className="flex items-center gap-3">
                            {userData.profileUrl ? (
                                <img src={userData.profileUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-700">{userData.name?.[0]?.toUpperCase()}</div>
                            )}
                            <div className="text-right flex flex-col justify-center">
                                <span className="text-sm font-bold leading-none mb-1">{userData.name}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold leading-none">Admin</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg text-sm transition-all font-semibold">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
                {tab === 'dashboard' && <DashboardPage collegeCode={userData.collegeCode} />}
                {tab === 'students' && <StudentsPage collegeCode={userData.collegeCode} />}
                {tab === 'halls' && <HallsPage collegeCode={userData.collegeCode} />}
                {tab === 'staff' && <StaffManagementPage collegeCode={userData.collegeCode} />}
                {tab === 'allocation' && <AllocationPage collegeCode={userData.collegeCode} />}
                {tab === 'reports' && <ReportsPage collegeCode={userData.collegeCode} />}
            </main>
        </div>
    )
}
