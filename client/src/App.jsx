import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { useTheme } from './context/ThemeContext'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import StudentPortal from './pages/StudentPortal'

// Role Dashboards
import AdminDashboard from './layouts/AdminDashboard'
import StaffDashboard from './layouts/StaffDashboard'

export default function App() {
    return (
        <ToastProvider>
            <AppRouter />
        </ToastProvider>
    )
}

function AppRouter() {
    const { isAuthReady } = useAuth()
    const { theme } = useTheme()

    if (!isAuthReady) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-white selection:bg-indigo-500/30' : 'bg-slate-50 text-slate-900 selection:bg-indigo-500/20'}`}>
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/:type" element={<AuthPage />} /> {/* type = admin | staff */}
                <Route path="/student" element={<StudentPortal />} />

                {/* Protected Admin */}
                <Route path="/admin/*" element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Protected Staff (StaffDashboard protects itself via localStorage check) */}
                <Route path="/staff/*" element={<StaffDashboard />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    )
}

function ProtectedRoute({ role, children }) {
    const { currentUser, userData, userLoading } = useAuth()

    if (userLoading) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading your profile...</div>
    }

    if (!currentUser) return <Navigate to="/" replace />

    // If we require a specific role that doesn't match...
    if (role && userData?.role !== role) {
        return <Navigate to="/" replace />
    }

    return children
}
