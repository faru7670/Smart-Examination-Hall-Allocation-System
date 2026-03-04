import { useState, useEffect } from 'react'
import { getHalls, addHall, deleteHall } from '../lib/db'

export default function HallsPage() {
    const [halls, setHalls] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ name: '', rows: '', cols: '' })
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    const load = async () => {
        setLoading(true)
        try { setHalls(await getHalls()) } catch { }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleAdd = async (e) => {
        e.preventDefault(); setError('')
        if (Number(form.rows) < 1 || Number(form.cols) < 1) return setError('Rows and columns must be at least 1')
        try {
            await addHall({ name: form.name.trim(), rows: Number(form.rows), cols: Number(form.cols) })
            setForm({ name: '', rows: '', cols: '' }); setShowForm(false); load()
        } catch (err) { setError(err.message) }
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"? This will also clear its allocations.`)) return
        try { await deleteHall(id); load() } catch (err) { alert(err.message) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">🏛️ Exam Halls</h2>
                    <p className="text-slate-400 text-sm mt-1">{halls.length} hall{halls.length !== 1 ? 's' : ''} • Total seats: {halls.reduce((s, h) => s + h.capacity, 0)}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all">
                    {showForm ? 'Cancel' : '+ Add Hall'}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="font-semibold text-white mb-4">New Hall</h3>
                    {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 p-3 rounded-xl">{error}</p>}
                    <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs text-slate-400 mb-1">Hall Name</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Hall A" required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div className="w-28">
                            <label className="block text-xs text-slate-400 mb-1">Rows</label>
                            <input type="number" min="1" max="50" value={form.rows} onChange={e => setForm({ ...form, rows: e.target.value })}
                                placeholder="10" required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div className="w-28">
                            <label className="block text-xs text-slate-400 mb-1">Columns</label>
                            <input type="number" min="1" max="50" value={form.cols} onChange={e => setForm({ ...form, cols: e.target.value })}
                                placeholder="10" required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all">
                            Add Hall
                        </button>
                    </form>
                    {form.rows && form.cols && (
                        <p className="mt-3 text-sm text-slate-400">Capacity: <span className="text-indigo-400 font-semibold">{Number(form.rows) * Number(form.cols)} seats</span></p>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : halls.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {halls.map(hall => (
                        <div key={hall.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{hall.name}</h3>
                                    <p className="text-slate-400 text-sm">{hall.rows} rows × {hall.cols} cols</p>
                                </div>
                                <button onClick={() => handleDelete(hall.id, hall.name)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                    🗑
                                </button>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-3 text-center mb-4">
                                <span className="text-3xl font-bold text-indigo-400">{hall.capacity}</span>
                                <span className="text-slate-400 text-sm ml-2">seats</span>
                            </div>
                            {/* Mini seat grid preview */}
                            <div className="overflow-hidden rounded-lg"
                                style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(hall.cols, 12)}, 1fr)`, gap: '2px' }}>
                                {Array.from({ length: Math.min(hall.rows * hall.cols, 120) }).map((_, i) => (
                                    <div key={i} className="aspect-square bg-indigo-500/20 rounded-sm" style={{ minHeight: '6px' }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-slate-500">
                    <div className="text-6xl mb-4">🏛️</div>
                    <p>No halls yet. Add your first hall above.</p>
                </div>
            )}
        </div>
    )
}
