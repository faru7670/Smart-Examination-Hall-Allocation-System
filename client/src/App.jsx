import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InvigilatorDashboardPage from './pages/InvigilatorDashboardPage';
import StudentsPage from './pages/StudentsPage';
import HallsPage from './pages/HallsPage';
import AllocationPage from './pages/AllocationPage';
import SearchPage from './pages/SearchPage';
import ReportsPage from './pages/ReportsPage';
import StudentLookupPage from './pages/StudentLookupPage';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen bg-dark-950"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) {
        if (user.role === 'invigilator') return <Navigate to="/invigilator-dashboard" />;
        return <Navigate to="/dashboard" />;
    }
    return children;
}

export default function App() {
    console.log("App.jsx rendering");
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
                <Route index element={<Navigate to="/lookup" />} />
                <Route path="lookup" element={<StudentLookupPage />} />
                <Route path="public/allocation" element={<AllocationPage isPublic={true} />} />
                <Route path="public/reports" element={<ReportsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/halls" element={<HallsPage />} />
                <Route path="/allocation" element={<AllocationPage isPublic={false} />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/reports" element={<ReportsPage />} />
            </Route>

            {/* Invigilator Routes */}
            <Route element={<ProtectedRoute roles={['invigilator']}><Layout /></ProtectedRoute>}>
                <Route path="/invigilator-dashboard" element={<InvigilatorDashboardPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
