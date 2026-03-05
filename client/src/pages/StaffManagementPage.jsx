import { useState, useEffect } from 'react'
import { getInvigilators, addInvigilator, deleteInvigilator } from '../lib/db'
import { useToast } from '../context/ToastContext'
import { Users, Trash2, Mail, Key } from 'lucide-react'

export default function StaffManagementPage({ collegeCode }) {
    const toast = useToast()
    const [staff, setStaff] = useState([])
    const [loading, setLoading] = useState(true)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const loadStaff = async () => {
        try {
            const data = await getInvigilators(collegeCode)
            setStaff(data)
        } catch (e) { toast.error(e.message) }
        setLoading(false)
    }

    useEffect(() => {
        if (collegeCode) loadStaff()
    }, [collegeCode])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!name || !email || !password) return toast.warning("All fields are required")
        try {
            await addInvigilator(collegeCode, { name, email, password })
            toast.success("Invigilator added successfully")
            setName(''); setEmail(''); setPassword('');
            loadStaff()
        } catch (e) { toast.error("Failed to add staff") }
    }

    const handleDelete = async (id, staffName) => {
        if (!window.confirm(`Remove ${staffName} from system?`)) return
        try {
            await deleteInvigilator(collegeCode, id)
            toast.info("Staff member removed")
            loadStaff()
        } catch (e) { toast.error("Failed to delete staff") }
    }

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="glass p-8 rounded-3xl border-l-[6px] border-l-purple-500 shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center"><Users size={24} /></div>
                    <h2 className="text-3xl font-black">Staff Management</h2>
                </div>
                <p className="text-slate-400 ml-16">Create login credentials for invigilators so they can access seating charts. Share your College Code (<b className="text-white">{collegeCode}</b>) with them.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="glass p-6 rounded-3xl shadow-xl h-fit sticky top-24">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-indigo-500 rounded-full" /> Add Invigilator</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe"
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-3.5 text-slate-500" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="staff@college.edu"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Temporary Password</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-4 top-3.5 text-slate-500" />
                                <input type="text" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password123!"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 mt-4 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 transition-all">
                            Create Account
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}</div>
                    ) : staff.length === 0 ? (
                        <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-slate-700">
                            <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto mb-4 flex items-center justify-center text-slate-400"><Users size={30} /></div>
                            <h3 className="font-bold text-xl mb-1 text-white">No Staff Accounts</h3>
                            <p className="text-slate-400 text-sm">Create accounts for your invigilators here. They will need these credentials plus your College Code to log in.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {staff.map((s, idx) => (
                                <div key={s.id} className="glass p-4 rounded-3xl flex items-center justify-between hover:border-purple-500/50 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl">{s.name[0]?.toUpperCase()}</div>
                                        <div>
                                            <p className="font-bold text-white text-lg leading-tight">{s.name}</p>
                                            <p className="text-sm text-slate-400">{s.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 pr-2">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Password</p>
                                            <code className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-xs font-mono text-purple-300">{s.password}</code>
                                        </div>
                                        <button onClick={() => handleDelete(s.id, s.name)} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
