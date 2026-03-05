import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { getStudents, addStudent, addStudentsBatch, deleteStudent, clearAllStudents } from '../lib/db'
import { useToast } from '../context/ToastContext'
import { Upload, Plus, Trash2, Search, Users, AlertCircle } from 'lucide-react'

export default function StudentsPage({ collegeCode }) {
    const toast = useToast()
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const fileInputRef = useRef()

    const [form, setForm] = useState({ student_id: '', name: '', subject_code: '' })

    const loadStudents = async () => {
        try {
            const data = await getStudents(collegeCode)
            setStudents(data)
        } catch (e) { toast.error(e.message) }
        setLoading(false)
    }

    useEffect(() => {
        if (collegeCode) loadStudents()
    }, [collegeCode])

    const handleAddSingle = async (e) => {
        e.preventDefault()
        if (!form.student_id || !form.name || !form.subject_code) return toast.warning("All fields required")
        if (students.some(s => s.student_id === form.student_id)) return toast.error("Student ID already exists")

        setLoading(true)
        try {
            await addStudent(collegeCode, form)
            toast.success("Student added!")
            setForm({ student_id: '', name: '', subject_code: '' })
            loadStudents()
        } catch (e) { toast.error("Failed to add student") }
        setLoading(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm(`Delete student ${id}?`)) return
        try {
            await deleteStudent(collegeCode, id)
            toast.info("Student deleted")
            loadStudents()
        } catch (e) { toast.error("Failed to delete") }
    }

    const handleClearAll = async () => {
        if (!window.confirm("WARNING: This deletes ALL students and current allocations. Proceed?")) return
        setLoading(true)
        try {
            await clearAllStudents(collegeCode)
            toast.success("Database cleared!")
            setStudents([])
        } catch (e) { toast.error("Failed to clear database") }
        setLoading(false)
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        Papa.parse(file, {
            header: false, skipEmptyLines: true,
            complete: async (results) => {
                setLoading(true)
                const items = results.data
                let valid = 0, duplicates = 0, errors = 0
                const batch = []
                const existingIds = new Set(students.map(s => s.student_id))

                for (let i = 0; i < items.length; i++) {
                    const row = items[i]
                    if (row.length < 3) continue
                    if (i === 0 && isNaN(parseInt(row[0], 10)) && isNaN(parseInt(row[2], 10))) continue

                    const student_id = String(row[0]).trim()
                    const name = String(row[1]).trim()
                    const subject_code = String(row[2]).trim()

                    if (!student_id || !name || !subject_code) { errors++; continue }
                    if (existingIds.has(student_id)) { duplicates++; continue }

                    batch.push({ student_id, name, subject_code })
                    existingIds.add(student_id)
                    valid++
                }

                if (batch.length > 0) {
                    try {
                        await addStudentsBatch(collegeCode, batch)
                        toast.success(`Success! Added ${valid}. (Duplicates skipped: ${duplicates})`)
                        loadStudents()
                    } catch (e) { toast.error("Batch upload failed") }
                } else {
                    toast.warning(`No valid new students found. Errors: ${errors}, Dupes: ${duplicates}`)
                }
                if (fileInputRef.current) fileInputRef.current.value = ''
                setLoading(false)
            }
        })
    }

    const filtered = students.filter(s =>
        s.student_id.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.subject_code.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="glass p-8 rounded-3xl border-l-[6px] border-l-indigo-500 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><Users size={24} /></div>
                        <h2 className="text-3xl font-black">Students Database</h2>
                    </div>
                    <p className="text-slate-400 ml-16">Enroll students individually or upload a CSV file.</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-6 py-4 rounded-2xl md:ml-0 ml-16 w-full md:w-auto text-center shadow-lg shadow-black/50">
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Total Enrolled</p>
                    <p className="text-4xl font-black text-indigo-400">{students.length}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Add/Upload Panel */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-3xl shadow-xl">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-emerald-500 rounded-full" /> Bulk Upload CSV</h3>
                        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current.click()}>
                            <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                            <p className="text-sm font-semibold text-white mb-1">Click to upload CSV</p>
                            <p className="text-xs text-slate-400">Format: ID, Name, Subject</p>
                        </div>
                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    </div>

                    <div className="glass p-6 rounded-3xl shadow-xl">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-indigo-500 rounded-full" /> Manual Entry</h3>
                        <form onSubmit={handleAddSingle} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Student ID / Roll No</label>
                                <input type="text" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required placeholder="14041"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors uppercase" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Full Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Jane Smith"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase">Subject Code</label>
                                <input type="text" value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} required placeholder="CS101"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors uppercase" />
                            </div>
                            <button disabled={loading} type="submit" className="w-full py-3 mt-4 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-white">
                                <Plus size={20} /> Add Student
                            </button>
                        </form>
                    </div>
                </div>

                {/* Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass p-4 rounded-3xl relative z-10">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-4 top-3 text-slate-500" size={18} />
                            <input type="text" placeholder="Search by ID, Name, or Subject..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors" />
                        </div>
                        {students.length > 0 && (
                            <button onClick={handleClearAll} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-colors w-full sm:w-auto justify-center whitespace-nowrap border-red-500/20 border">
                                <Trash2 size={16} /> Clear All
                            </button>
                        )}
                    </div>

                    <div className="glass rounded-3xl shadow-xl overflow-hidden relative border border-slate-800">
                        <div className="overflow-x-auto max-h-[700px] overflow-y-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800">Student ID</th>
                                        <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800">Name</th>
                                        <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800">Subject</th>
                                        <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && students.length === 0 ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="border-b border-slate-800/50"><td colSpan={4} className="p-4"><div className="h-4 shimmer rounded-full w-full opacity-30" /></td></tr>
                                        ))
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="4" className="p-16 text-center text-slate-500">
                                            <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-bold text-lg text-white mb-1">No students found</p>
                                            <p className="text-sm">Time to upload your roster!</p>
                                        </td></tr>
                                    ) : (
                                        filtered.map(s => (
                                            <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 font-mono font-bold text-white max-w-[120px] truncate" title={s.student_id}>{s.student_id}</td>
                                                <td className="p-4 font-medium text-slate-300 max-w-[200px] truncate" title={s.name}>{s.name}</td>
                                                <td className="p-4">
                                                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-lg text-xs font-bold tracking-widest">{s.subject_code}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleDelete(s.id)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors inline-block" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-slate-900 border-t border-slate-800 p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Showing {filtered.length} of {students.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
