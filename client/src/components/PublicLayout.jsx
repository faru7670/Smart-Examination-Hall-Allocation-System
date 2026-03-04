import { Outlet, NavLink } from 'react-router-dom'
import { HiOutlineAcademicCap, HiOutlineSearch, HiOutlineViewGrid, HiOutlineDocumentDownload, HiOutlineLogin } from 'react-icons/hi'

const publicNavItems = [
    { to: '/lookup', icon: HiOutlineAcademicCap, label: 'Student Dashboard' },
    { to: '/public/allocation', icon: HiOutlineViewGrid, label: 'All Allotments' },
    { to: '/public/reports', icon: HiOutlineDocumentDownload, label: 'Downloads' },
]

export default function PublicLayout() {
    return (
        <div className="min-h-screen bg-dark-950 flex flex-col relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-[120px]" />
            </div>

            <header className="relative z-10 border-b border-dark-800/50 bg-dark-900/50 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <HiOutlineAcademicCap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent hidden sm:block">
                                ExamHall
                            </span>
                        </div>

                        <nav className="flex items-center gap-1 sm:gap-2">
                            {publicNavItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary-500/15 text-primary-400'
                                            : 'text-dark-400 hover:text-white hover:bg-dark-800'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="hidden md:inline">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        <div className="flex items-center">
                            <NavLink to="/login" className="btn-ghost flex items-center gap-2 text-sm px-3 py-2">
                                <HiOutlineLogin className="w-5 h-5" />
                                <span className="hidden sm:inline">Admin Login</span>
                            </NavLink>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    )
}
