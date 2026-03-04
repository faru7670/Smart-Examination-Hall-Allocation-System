import React, { useState, useEffect } from 'react'
import { db } from './firebase'

// Import pages
import LoginPage from './pages/LoginPage'
import StudentsPage from './pages/StudentsPage'
import HallsPage from './pages/HallsPage'
import AllocationPage from './pages/AllocationPage'
import ReportsPage from './pages/ReportsPage'

const ADMIN_PASSWORD = 'admin123' // Change this to your preferred password

const TABS = [
    { id: 'students', label: '👨‍🎓 Students' },
    { id: 'halls', label: '🏛️ Halls' },
    { id: 'allocation', label: '🎯 Allocation' },
    { id: 'reports', label: '📊 Reports' },
]

export default function App() {
    const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('examhall_auth') === 'true')
    const [tab, setTab] = useState('students')
    const [dbReady, setDbReady] = useState(true)

    useEffect(() => {
        if (!db) setDbReady(false)
    }, [])

    const handleLogin = (password) => {
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('examhall_auth', 'true')
            setLoggedIn(true)
            return true
        }
        return false
    }

    const handleLogout = () => {
        localStorage.removeItem('examhall_auth')
        setLoggedIn(false)
    }

    if (!loggedIn) return <LoginPage onLogin={handleLogin} />

    if (!dbReady) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="text-center p-8 max-w-md">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2">Firebase Not Configured</h2>
                <p className="text-slate-400 text-sm">Add your Firebase credentials to the <code className="bg-slate-800 px-1 rounded">.env</code> file and redeploy.</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">🏛️</div>
                        <h1 className="font-bold text-lg hidden sm:block">ExamHall Allocator</h1>
                    </div>
                    <nav className="flex items-center gap-1">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>
                    <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-400 transition-colors ml-2">Logout</button>
                </div>
            </header>

            {/* Page */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {tab === 'students' && <StudentsPage />}
                {tab === 'halls' && <HallsPage />}
                {tab === 'allocation' && <AllocationPage />}
                {tab === 'reports' && <ReportsPage />}
            </main>
        </div>
    )
}
