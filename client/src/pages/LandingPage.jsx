import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, ShieldCheck, Users, ArrowRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function LandingPage() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated BG */}
            <div className="absolute inset-0 z-0">
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'} rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-float`} />
                <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'} rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 animate-float`} style={{ animationDelay: '2s' }} />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 glass border-b-0 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">🏛️</div>
                    <h1 className="font-black text-xl tracking-tight">Smart<span className="text-indigo-500">Alloc</span></h1>
                </div>
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-500/10 transition">
                    {isDark ? '☀️ Light' : '🌙 Dark'}
                </button>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        Flawless <span className="gradient-text">Exam Seats</span> <br />in Seconds.
                    </h2>
                    <p className={`text-lg md:text-xl ${isDark ? 'text-slate-600' : 'text-slate-600'} mb-10`}>
                        The ultimate multi-tenant platform for colleges. Smart subject-separation algorithms, complete 3D hall visualization, and personalized portals for admins, staff, and students.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Admin */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="glass rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">College Admin</h3>
                        <p className={`mb-8 ${isDark ? 'text-slate-600' : 'text-slate-600'}`}>Create halls, upload bulk students, run algorithms, add staff, and oversee the entire college dashboard.</p>
                        <Link to="/auth/admin" className="inline-flex items-center gap-2 text-indigo-500 font-semibold group-hover:gap-3 transition-all">
                            Admin Portal <ArrowRight size={18} />
                        </Link>
                    </motion.div>

                    {/* Staff */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="glass rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
                            <Users size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Invigilator Staff</h3>
                        <p className={`mb-8 ${isDark ? 'text-slate-600' : 'text-slate-600'}`}>Log in to access generated seating charts, print authentic PDFs, and manage hall rosters effortlessly.</p>
                        <Link to="/auth/staff" className="inline-flex items-center gap-2 text-purple-500 font-semibold group-hover:gap-3 transition-all">
                            Staff Login <ArrowRight size={18} />
                        </Link>
                    </motion.div>

                    {/* Student */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="glass rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10" />
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                            <GraduationCap size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Student Portal</h3>
                        <p className={`mb-8 ${isDark ? 'text-slate-600' : 'text-slate-600'}`}>Find your exact seat, hall, row, and column in seconds using your College Code and Roll Number.</p>
                        <Link to="/student" className="inline-flex items-center gap-2 text-emerald-500 font-semibold group-hover:gap-3 transition-all">
                            Check Seat <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
