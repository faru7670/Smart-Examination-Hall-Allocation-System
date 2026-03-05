import { useState, useEffect } from 'react'
import { getHalls, addHall, deleteHall } from '../lib/db'
import { useToast } from '../context/ToastContext'
import { Plus, Trash2, Maximize, AlertCircle } from 'lucide-react'

export default function HallsPage({ collegeCode }) {
    const toast = useToast()
    const [halls, setHalls] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ name: '', rows: 5, cols: 5 })

    const loadHalls = async () => {
        try {
            const data = await getHalls(collegeCode)
            setHalls(data)
        } catch (e) { toast.error(e.message) }
        setLoading(false)
    }

    useEffect(() => {
        if (collegeCode) loadHalls()
    }, [collegeCode])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.name || form.rows < 1 || form.cols < 1) return toast.warning("Invalid hall parameters")
        if (form.rows > 50 || form.cols > 50) return toast.error("Maximum grid size is 50x50")

        setLoading(true)
        try {
            await addHall(collegeCode, { name: form.name, rows: parseInt(form.rows), cols: parseInt(form.cols) })
            toast.success("Hall added!")
            setForm({ name: '', rows: 5, cols: 5 })
            loadHalls()
        } catch (e) { toast.error(e.message) }
        setLoading(false)
    }

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete ${name}? Allocations will be cleared.`)) return
        try {
            await deleteHall(collegeCode, id)
            toast.info("Hall deleted")
            loadHalls()
        } catch (e) { toast.error("Failed to delete") }
    }

    const totalSeats = halls.reduce((acc, h) => acc + h.capacity, 0)

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="glass p-8 rounded-3xl border-l-[6px] border-l-amber-500 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center"><Maximize size={24} /></div>
                        <h2 className="text-3xl font-black">Examination Halls</h2>
                    </div>
                    <p className="text-slate-400 ml-16">Configure your physical venues and layout dimensions.</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-6 py-4 rounded-2xl md:ml-0 ml-16 w-full md:w-auto text-center shadow-lg shadow-black/50">
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Total Venue Capacity</p>
                    <p className="text-4xl font-black text-amber-400">{totalSeats}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Add Hall Form */}
                <div className="lg:col-span-1">
                    <div className="glass p-6 rounded-3xl shadow-xl sticky top-24">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-amber-500 rounded-full" /> Add New Hall</h3>
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Hall Name / Number</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Main Hall A"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors font-bold text-white tracking-wide" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Rows</label>
                                    <input type="number" min="1" max="50" value={form.rows} onChange={e => setForm({ ...form, rows: e.target.value })} required
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-center font-mono text-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Columns</label>
                                    <input type="number" min="1" max="50" value={form.cols} onChange={e => setForm({ ...form, cols: e.target.value })} required
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-center font-mono text-lg" />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center hidden">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview Capacity</span>
                                <span className="text-xl font-black text-amber-400">{(form.rows || 0) * (form.cols || 0)}</span>
                            </div>

                            <button disabled={loading} type="submit" className="w-full py-3.5 mt-2 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-white shadow-md shadow-amber-900/20">
                                <Plus size={20} /> Register Venue
                            </button>
                        </form>
                    </div>
                </div>

                {/* Halls Grid */}
                <div className="lg:col-span-3">
                    {loading && halls.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl shimmer border border-slate-700/50" />)}
                        </div>
                    ) : halls.length === 0 ? (
                        <div className="glass p-16 rounded-3xl text-center border-dashed border-2 border-slate-700 h-full flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-slate-800 mx-auto mb-6 flex items-center justify-center text-slate-400 shadow-inner"><AlertCircle size={40} /></div>
                            <h3 className="font-bold text-2xl text-white mb-2">No Exam Halls Found</h3>
                            <p className="text-slate-400">Add physical venues and specify their dimensions (rows × columns) to begin allocating students.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {halls.map((h, idx) => (
                                <div key={h.id} className="glass p-6 rounded-3xl relative group hover:border-amber-500/50 transition-colors animate-slide-up hover:-translate-y-1 duration-300" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

                                    <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                                        <div>
                                            <h3 className="font-black text-xl text-white leading-tight mb-1">{h.name}</h3>
                                            <p className="text-sm text-slate-400 font-mono tracking-wider">{h.rows} ROWS × {h.cols} COLS</p>
                                        </div>
                                        <button onClick={() => handleDelete(h.id, h.name)} className="text-slate-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-colors" title="Delete Hall">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Mini Grid Preview */}
                                    <div className="h-[200px] w-full bg-slate-900/80 rounded-2xl flex items-center justify-center p-4 border border-slate-800 mb-6 relative overflow-hidden group-hover:border-slate-700 transition-colors">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="grid gap-[2px] transition-transform duration-500 relative z-10"
                                            style={{
                                                gridTemplateColumns: `repeat(${h.cols}, minmax(0, 1fr))`,
                                                maxWidth: '100%', maxHeight: '100%',
                                                width: h.cols > 20 ? '100%' : 'auto',
                                                height: h.rows > 20 ? '100%' : 'auto'
                                            }}>
                                            {[...Array(Math.min(h.capacity, 400))].map((_, i) => (
                                                <div key={i} className="bg-slate-700/50 aspect-square rounded-[1px]"
                                                    style={{ width: h.cols > 30 ? '3px' : '6px' }} />
                                            ))}
                                            {h.capacity > 400 && <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent flex items-end justify-center pb-2 text-[10px] text-amber-500 font-bold tracking-widest">+ {h.capacity - 400} more</div>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Capacity</p>
                                            <p className="text-3xl font-black text-amber-400 leading-none">{h.capacity}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-700">🪑</div>
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
