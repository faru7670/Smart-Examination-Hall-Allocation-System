import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getHalls, addHall, deleteHall } from '../lib/db'
import { HiOutlinePlus, HiOutlineTrash, HiOutlineOfficeBuilding } from 'react-icons/hi'

export default function HallsPage() {
    const { user } = useAuth()
    const [halls, setHalls] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', rows: '', cols: '' })
    const [error, setError] = useState('')

    const fetchHalls = async () => {
        if (!user?.collegeId) return
        setLoading(true)
        try { setHalls(await getHalls(user.collegeId)) } catch { setHalls([]) }
        setLoading(false)
    }

    useEffect(() => { fetchHalls() }, [user?.collegeId])

    const handleAdd = async (e) => {
        e.preventDefault(); setError('')
        try {
            await addHall(user.collegeId, { name: form.name, rows: Number(form.rows), cols: Number(form.cols) })
            setForm({ name: '', rows: '', cols: '' }); setShowForm(false); fetchHalls()
        } catch (err) { setError(err.message || 'Failed to add hall') }
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"? This also removes its allocations.`)) return
        try { await deleteHall(user.collegeId, id); fetchHalls() }
        catch (err) { alert(err.message || 'Failed') }
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Exam Halls</h1>
                    <p className="text-dark-400 mt-1">Manage examination halls and seating capacity</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
                    <HiOutlinePlus className="w-4 h-4" /> Add Hall
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 animate-slide-up">
                    <h3 className="text-lg font-semibold text-white mb-4">New Hall</h3>
                    {error && <p className="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-xl">{error}</p>}
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm text-dark-400 mb-1">Hall Name</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Hall A" required />
                        </div>
                        <div>
                            <label className="block text-sm text-dark-400 mb-1">Rows</label>
                            <input type="number" min="1" max="100" value={form.rows} onChange={e => setForm({ ...form, rows: e.target.value })} className="input-field" placeholder="10" required />
                        </div>
                        <div>
                            <label className="block text-sm text-dark-400 mb-1">Columns</label>
                            <input type="number" min="1" max="100" value={form.cols} onChange={e => setForm({ ...form, cols: e.target.value })} className="input-field" placeholder="10" required />
                        </div>
                        <div className="flex items-end gap-2">
                            <button type="submit" className="btn-primary flex-1">Add</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                        </div>
                    </form>
                    {form.rows && form.cols && (
                        <p className="mt-3 text-sm text-dark-400">Capacity: <span className="text-primary-400 font-semibold">{(Number(form.rows) || 0) * (Number(form.cols) || 0)} seats</span></p>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : halls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {halls.map((hall, i) => (
                        <div key={hall.id} className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                                        <HiOutlineOfficeBuilding className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{hall.name}</h3>
                                        <p className="text-sm text-dark-400">{hall.rows} × {hall.cols} grid</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(hall.id, hall.name)} className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                    <HiOutlineTrash className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-4 p-4 bg-dark-900/50 rounded-xl flex items-center justify-between">
                                <span className="text-sm text-dark-400">Total Capacity</span>
                                <span className="text-2xl font-bold text-primary-400">{hall.capacity}</span>
                            </div>
                            <div className="mt-4 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.min(hall.cols, 10)}, 1fr)` }}>
                                {Array.from({ length: Math.min(hall.rows * hall.cols, 100) }).map((_, j) => (
                                    <div key={j} className="aspect-square bg-dark-700/50 rounded-sm" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center text-dark-400">
                    <HiOutlineOfficeBuilding className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No halls added yet</p>
                </div>
            )}
        </div>
    )
}
