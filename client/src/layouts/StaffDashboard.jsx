import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Staff Pages (Read Only / Print Only)
import AllocationPage from '../pages/AllocationPage'
import ReportsPage from '../pages/ReportsPage'

const TABS = [
    { id: 'allocation', label: '🎯 360° Visualizer' },
    { id: 'reports', label: '📄 Printable Seat Reports' },
]

export default function StaffDashboard() {
    const { theme } = useTheme()
    const navigate = useNavigate()

    // We check localStorage because Staff Auth leverages Firestore directly without true Firebase Auth tracking
    const [staffData, setStaffData] = useState(null)
    const [tab, setTab] = useState('allocation')

    useEffect(() => {
        const localData = localStorage.getItem('examhall_staffAuth')
        if (localData) {
            setStaffData(JSON.parse(localData))
        } else {
            navigate('/')
        }
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('examhall_staffAuth')
        navigate('/')
    }

    if (!staffData || staffData.role !== 'invigilator') return null

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <header className="sticky top-0 z-50 glass border-b border-purple-500/20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">👥</div>
                        <div>
                            <h1 className="font-bold text-xl hidden sm:block tracking-tight text-inherit">Invigilator<span className="text-purple-500">Portal</span></h1>
                            <p className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest hidden sm:block">Code: {staffData.collegeCode}</p>
                        </div>
                    </div>

                    <nav className="flex space-x-1 sm:space-x-2 py-4">
                        {TABS.map(t => {
                            const active = tab === t.id
                            return (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                                    ${active ? 'text-purple-500 bg-purple-500/10' : 'text-slate-400 hover:text-purple-400 hover:bg-slate-800/50'}`}>
                                    {t.label}
                                    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="flex items-center gap-5 py-4 pl-4 border-l border-slate-800 ml-2">
                        <div className="text-right hidden sm:block">
                            <span className="text-sm font-bold block mb-0.5">{staffData.name || staffData.email.split('@')[0]}</span>
                            <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Staff</span>
                        </div>
                        <button onClick={handleLogout} className="bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg text-sm transition-all font-semibold">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
                {/* Notice that we disable actions like "Run Allocation" for Staff by passing isStaff=true */}
                {tab === 'allocation' && <AllocationPage collegeCode={staffData.collegeCode} isStaff={true} />}
                {tab === 'reports' && <ReportsPage collegeCode={staffData.collegeCode} isStaff={true} />}
            </main>
        </div>
    )
}
