import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineViewGrid, HiOutlineSearch, HiOutlineDocumentReport, HiOutlineLogout, HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

const navItems = [
    { to: '/dashboard', icon: HiOutlineChartBar, label: 'Dashboard', roles: ['admin', 'coordinator', 'invigilator'] },
    { to: '/students', icon: HiOutlineUsers, label: 'Students', roles: ['admin'] },
    { to: '/halls', icon: HiOutlineOfficeBuilding, label: 'Halls', roles: ['admin'] },
    { to: '/allocation', icon: HiOutlineViewGrid, label: 'Allocation', roles: ['admin', 'coordinator', 'invigilator'] },
    { to: '/search', icon: HiOutlineSearch, label: 'Search', roles: ['admin', 'coordinator', 'invigilator'] },
    { to: '/reports', icon: HiOutlineDocumentReport, label: 'Reports', roles: ['admin', 'coordinator'] },
]

export default function Layout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => { logout(); navigate('/login') }
    const filteredNav = navItems.filter(item => item.roles.includes(user?.role))

    const roleColors = {
        admin: 'from-primary-500 to-accent-500',
        coordinator: 'from-emerald-500 to-teal-500',
        invigilator: 'from-amber-500 to-orange-500',
        student: 'from-cyan-500 to-blue-500'
    }

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-dark-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <HiOutlineAcademicCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">ExamHall</h1>
                        <p className="text-xs text-dark-400">Smart Allocation</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {filteredNav.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-primary-500/15 text-primary-400 shadow-lg shadow-primary-500/10'
                                : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-dark-700/50">
                <div className="glass-card p-4 mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${roleColors[user?.role] || roleColors.admin} flex items-center justify-center text-white font-bold text-sm`}>
                            {user?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                            <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <HiOutlineLogout className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </>
    )

    return (
        <div className="flex h-screen overflow-hidden bg-dark-950">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-64 bg-dark-900/50 backdrop-blur-xl border-r border-dark-700/50">
                <SidebarContent />
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-dark-900 flex flex-col z-50 animate-slide-up">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-dark-900/50 backdrop-blur-xl border-b border-dark-700/50">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-dark-400 hover:text-white">
                        <HiOutlineMenu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <HiOutlineAcademicCap className="w-6 h-6 text-primary-500" />
                        <span className="font-bold">ExamHall</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
