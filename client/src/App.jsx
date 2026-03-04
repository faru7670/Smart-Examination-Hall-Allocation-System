import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import HallsPage from './pages/HallsPage'
import AllocationPage from './pages/AllocationPage'
import SearchPage from './pages/SearchPage'
import ReportsPage from './pages/ReportsPage'
import StudentLookupPage from './pages/StudentLookupPage'

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth()
    if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
    if (!user) return <Navigate to="/login" />
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />
    return children
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/lookup" element={<StudentLookupPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="students" element={<ProtectedRoute roles={['admin']}><StudentsPage /></ProtectedRoute>} />
                <Route path="halls" element={<ProtectedRoute roles={['admin']}><HallsPage /></ProtectedRoute>} />
                <Route path="allocation" element={<AllocationPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="reports" element={<ProtectedRoute roles={['admin', 'coordinator']}><ReportsPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}
