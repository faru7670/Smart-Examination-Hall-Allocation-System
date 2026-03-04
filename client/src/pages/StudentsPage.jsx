import { useState, useEffect, useRef } from 'react'
import { getStudents, addStudent, uploadStudents, clearStudents } from '../lib/db'
import Papa from 'papaparse'

export default function StudentsPage() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [form, setForm] = useState({ student_id: '', name: '', subject_code: '' })
    const [formError, setFormError] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const fileRef = useRef()

    const load = async () => {
        setLoading(true)
        try { setStudents(await getStudents()) } catch (e) { console.error(e) }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleAdd = async (e) => {
        e.preventDefault(); setFormError('')
        try {
            await addStudent({ student_id: form.student_id.trim(), name: form.name.trim(), subject_code: form.subject_code.trim().toUpperCase() })
            setForm({ student_id: '', name: '', subject_code: '' })
            load()
        } catch (err) { setFormError(err.message) }
    }

    const handleFile = (file) => {
        if (!file) return
        setUploading(true); setResult(null)
        Papa.parse(file, {
            skipEmptyLines: true,
            complete: async (res) => {
                try {
                    const rows = res.data.filter((r, i) => i === 0 && isNaN(r[0]) ? false : r.length >= 3)
                    const r = await uploadStudents(rows)
                    setResult(r); load()
                } catch (err) { setResult({ error: err.message }) }
                setUploading(false)
            }
        })
    }

    const handleClear = async () => {
        if (!confirm('Delete ALL students and allocations?')) return
        await clearStudents(); setResult(null); load()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">👨‍🎓 Students</h2>
                    <p className="text-slate-400 text-sm mt-1">{students.length} students • Upload CSV or add manually</p>
                </div>
                {students.length > 0 && (
                    <button onClick={handleClear} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm transition-all">
                        🗑 Clear All
                    </button>
                )}
            </div>

            {/* Manual Add */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Add Student</h3>
                {formError && <p className="text-red-400 text-sm mb-3 bg-red-500/10 p-3 rounded-xl">{formError}</p>}
                <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
                    {[
                        { key: 'student_id', placeholder: 'Student ID  e.g. 21CS001', label: 'ID' },
                        { key: 'name', placeholder: 'Full Name', label: 'Name' },
                        { key: 'subject_code', placeholder: 'Subject Code  e.g. CS101', label: 'Subject' },
                    ].map(f => (
                        <input key={f.key} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                            placeholder={f.placeholder} required
                            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
                    ))}
                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all">+ Add</button>
                </form>
            </div>

            {/* CSV Upload */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
                className={`bg-slate-900 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}`}
            >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                <div className="text-4xl mb-3">{uploading ? '⏳' : '📁'}</div>
                <p className="text-white font-medium">{uploading ? 'Uploading...' : 'Drop CSV or click to upload'}</p>
                <p className="text-slate-500 text-sm mt-1">Format: StudentID, StudentName, SubjectCode</p>
            </div>

            {result && (
                <div className={`rounded-2xl p-5 border ${result.error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    {result.error ? <p>❌ {result.error}</p> : (
                        <div className="flex flex-wrap gap-6">
                            <span className="text-emerald-400 font-semibold">✅ Upload done</span>
                            <span className="text-slate-300">Added: <b className="text-emerald-400">{result.added}</b></span>
                            <span className="text-slate-300">Duplicates: <b className="text-amber-400">{result.duplicates}</b></span>
                            <span className="text-slate-300">Total in DB: <b className="text-white">{result.total}</b></span>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : students.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 sticky top-0">
                                <tr>
                                    {['#', 'Student ID', 'Name', 'Subject'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-slate-400 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {students.slice(0, 300).map((s, i) => (
                                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3 text-slate-500">{i + 1}</td>
                                        <td className="px-5 py-3 font-mono text-indigo-400">{s.student_id}</td>
                                        <td className="px-5 py-3 text-white">{s.name}</td>
                                        <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">{s.subject_code}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {students.length > 300 && <p className="text-center py-3 text-slate-500 text-sm">Showing first 300 of {students.length} students</p>}
                </div>
            ) : null}
        </div>
    )
}
