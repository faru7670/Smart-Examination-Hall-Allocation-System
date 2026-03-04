import React, { useState, useEffect } from 'react'
import { db } from './firebase'
import { getStudents } from './lib/db'
import { ToastProvider } from './context/ToastContext'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import HallsPage from './pages/HallsPage'
import AllocationPage from './pages/AllocationPage'
import ReportsPage from './pages/ReportsPage'

const ADMIN_PASSWORD = 'admin123'

const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'students', label: '👨‍🎓 Students' },
    { id: 'halls', label: '🏛️ Halls' },
    { id: 'allocation', label: '🎯 Allocation' },
    { id: 'reports', label: '📄 Reports' },
]

export default function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    )
}

function AppContent() {
    const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('examhall_auth') === 'true')
    const [tab, setTab] = useState('dashboard')
    const [dbReady, setDbReady] = useState(true)
    const [studentCount, setStudentCount] = useState(0)

    useEffect(() => {
        if (!db) setDbReady(false)
        if (db && loggedIn) {
            getStudents().then(s => setStudentCount(s.length)).catch(console.error)
        }
    }, [loggedIn, tab]) // refresh count occasionally like on tab switch

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
            <div className="text-center p-8 max-w-md animate-slide-up">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-red-500/20">⚠️</div>
                <h2 className="text-2xl font-bold mb-3 text-white">Firebase Not Configured</h2>
                <p className="text-slate-400 text-sm mb-6">Your app is deployed but missing a database connection. Add your Firebase credentials.</p>
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-left">
                    <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Create .env file with:</p>
                    <code className="text-xs text-indigo-300 font-mono block whitespace-pre">
                        VITE_FIREBASE_API_KEY="..."<br />
                        VITE_FIREBASE_PROJECT_ID="..."
                    </code>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
            {/* Premium App Navbar */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                            🏛️
                        </div>
                        <h1 className="font-bold text-xl hidden sm:block tracking-tight">
                            Smart<span className="text-indigo-400">Alloc</span>
                        </h1>
                    </div>

                    {/* Tabs */}
                    <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {TABS.map(t => {
                            const active = tab === t.id
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap overflow-hidden
                                        ${active ? 'text-indigo-300 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    {t.label}
                                    {/* Animated underline indicator */}
                                    {active && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 border-radius-full" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Right side bits */}
                    <div className="flex items-center gap-5 py-4 pl-4 border-l border-slate-800 ml-2 hidden sm:flex">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">Students Database</span>
                            <span className="bg-slate-800 border border-slate-700 text-indigo-300 font-mono text-xs px-2 py-1 rounded-md">
                                {studentCount}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg text-sm transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
                {tab === 'dashboard' && <DashboardPage />}
                {tab === 'students' && <StudentsPage />}
                {tab === 'halls' && <HallsPage />}
                {tab === 'allocation' && <AllocationPage />}
                {tab === 'reports' && <ReportsPage />}
            </main>
        </div>
    )
}
