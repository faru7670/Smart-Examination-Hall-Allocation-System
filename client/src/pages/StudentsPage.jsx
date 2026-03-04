import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStudents, addStudent, uploadStudents, clearStudents } from '../lib/db'
import { HiOutlineUpload, HiOutlineTrash, HiOutlineDocumentText, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlinePlus, HiOutlineUsers } from 'react-icons/hi'
import Papa from 'papaparse'

export default function StudentsPage() {
    const { user } = useAuth()
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const fileRef = useRef()

    const [showSingleForm, setShowSingleForm] = useState(false)
    const [singleStudent, setSingleStudent] = useState({ student_id: '', name: '', subject_code: '' })
    const [singleError, setSingleError] = useState('')
    const [singleSuccess, setSingleSuccess] = useState('')

    const fetchStudents = async () => {
        if (!user?.collegeId) return
        setLoading(true)
        try { setStudents(await getStudents(user.collegeId)) } catch { setStudents([]) }
        setLoading(false)
    }

    useEffect(() => { fetchStudents() }, [user?.collegeId])

    const handleAddSingle = async (e) => {
        e.preventDefault()
        setSingleError(''); setSingleSuccess('')
        try {
            await addStudent(user.collegeId, singleStudent)
            setSingleSuccess(`Added ${singleStudent.name} successfully!`)
            setSingleStudent({ student_id: '', name: '', subject_code: '' })
            fetchStudents()
            setTimeout(() => setSingleSuccess(''), 3000)
        } catch (err) { setSingleError(err.message || 'Failed to add student') }
    }

    const handleUpload = (file) => {
        if (!file) return
        setUploading(true); setUploadResult(null)
        Papa.parse(file, {
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data.filter((r, i) => {
                        // Skip header row if it starts with non-numeric text
                        if (i === 0 && isNaN(r[0])) return false
                        return r.length >= 3
                    })
                    const result = await uploadStudents(user.collegeId, rows)
                    setUploadResult({ summary: result })
                    fetchStudents()
                } catch (err) {
                    setUploadResult({ error: err.message || 'Upload failed' })
                } finally { setUploading(false) }
            },
            error: () => { setUploadResult({ error: 'Failed to parse CSV' }); setUploading(false) }
        })
    }

    const handleClear = async () => {
        if (!confirm('Delete ALL student data? This also clears allocations.')) return
        try { await clearStudents(user.collegeId); fetchStudents(); setUploadResult(null) }
        catch (err) { alert(err.message || 'Failed') }
    }

    const handleDrop = (e) => { e.preventDefault(); setDragActive(false); handleUpload(e.dataTransfer.files[0]) }
    const handleDrag = (e) => { e.preventDefault(); setDragActive(e.type === 'dragenter' || e.type === 'dragover') }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="text-dark-400 mt-1">Upload and manage student data</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowSingleForm(!showSingleForm)} className="btn-primary flex items-center gap-2 text-sm">
                        <HiOutlinePlus className="w-4 h-4" /> Add Single Student
                    </button>
                    {students.length > 0 && (
                        <button onClick={handleClear} className="btn-danger flex items-center gap-2 text-sm">
                            <HiOutlineTrash className="w-4 h-4" /> Clear All ({students.length})
                        </button>
                    )}
                </div>
            </div>

            {showSingleForm && (
                <div className="glass-card p-6 animate-slide-up">
                    <h3 className="text-lg font-semibold text-white mb-4">Add Student Manually</h3>
                    {singleError && <p className="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-xl">{singleError}</p>}
                    {singleSuccess && <p className="text-emerald-400 text-sm mb-4 p-3 bg-emerald-500/10 rounded-xl">{singleSuccess}</p>}
                    <form onSubmit={handleAddSingle} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm text-dark-400 mb-1">Student ID</label>
                            <input value={singleStudent.student_id} onChange={e => setSingleStudent({ ...singleStudent, student_id: e.target.value })} className="input-field" placeholder="e.g. 21CS001" required />
                        </div>
                        <div>
                            <label className="block text-sm text-dark-400 mb-1">Name</label>
                            <input value={singleStudent.name} onChange={e => setSingleStudent({ ...singleStudent, name: e.target.value })} className="input-field" placeholder="e.g. John Doe" required />
                        </div>
                        <div>
                            <label className="block text-sm text-dark-400 mb-1">Subject Code</label>
                            <input value={singleStudent.subject_code} onChange={e => setSingleStudent({ ...singleStudent, subject_code: e.target.value })} className="input-field" placeholder="e.g. CS101" required />
                        </div>
                        <div className="flex items-end gap-2">
                            <button type="submit" className="btn-primary flex-1">Add</button>
                            <button type="button" onClick={() => setShowSingleForm(false)} className="btn-ghost">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div
                onDrop={handleDrop} onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag}
                onClick={() => fileRef.current?.click()}
                className={`glass-card p-12 text-center cursor-pointer transition-all duration-300 ${dragActive ? 'border-primary-500 bg-primary-500/10 scale-[1.01]' : 'hover:border-dark-500'}`}
            >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleUpload(e.target.files[0])} />
                <div className="flex flex-col items-center gap-4">
                    {uploading ? (
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                            <HiOutlineUpload className="w-8 h-8 text-primary-400" />
                        </div>
                    )}
                    <div>
                        <p className="text-lg font-semibold text-white">{uploading ? 'Uploading...' : 'Drop CSV file here or click to bulk upload'}</p>
                        <p className="text-sm text-dark-400 mt-1">Format: StudentID, StudentName, SubjectCode</p>
                    </div>
                </div>
            </div>

            {uploadResult && (
                <div className={`glass-card p-6 animate-slide-up ${uploadResult.error ? 'border-red-500/50' : 'border-emerald-500/50'}`}>
                    {uploadResult.error ? (
                        <div className="flex items-center gap-3 text-red-400">
                            <HiOutlineExclamation className="w-6 h-6 flex-shrink-0" />
                            <p>{uploadResult.error}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 text-emerald-400 mb-4">
                                <HiOutlineCheckCircle className="w-6 h-6" />
                                <p className="font-semibold">Upload Successful</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: 'In File', value: uploadResult.summary.total_in_file, color: 'text-white' },
                                    { label: 'Added', value: uploadResult.summary.added, color: 'text-emerald-400' },
                                    { label: 'Duplicates', value: uploadResult.summary.duplicates, color: 'text-amber-400' },
                                    { label: 'Errors', value: uploadResult.summary.errors, color: 'text-red-400' },
                                    { label: 'Total in DB', value: uploadResult.summary.total_in_db, color: 'text-primary-400' },
                                ].map(s => (
                                    <div key={s.label} className="text-center p-3 bg-dark-900/50 rounded-xl">
                                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                        <p className="text-xs text-dark-400">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : students.length > 0 ? (
                <div className="glass-card overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-dark-700/50 flex items-center gap-3">
                        <HiOutlineDocumentText className="w-5 h-5 text-primary-400" />
                        <span className="font-semibold">{students.length} Students</span>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-dark-800/50 sticky top-0">
                                <tr>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">#</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Student ID</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Name</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Subject</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700/30">
                                {students.slice(0, 200).map((s, i) => (
                                    <tr key={s.id} className="hover:bg-dark-700/20 transition-colors">
                                        <td className="px-6 py-3 text-dark-500">{i + 1}</td>
                                        <td className="px-6 py-3 font-mono text-primary-400">{s.student_id}</td>
                                        <td className="px-6 py-3 text-white">{s.name}</td>
                                        <td className="px-6 py-3"><span className="badge bg-primary-500/20 text-primary-300">{s.subject_code}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {students.length > 200 && <p className="text-center py-3 text-dark-400 text-sm">Showing first 200 of {students.length} students</p>}
                    </div>
                </div>
            ) : (
                <div className="glass-card p-12 text-center text-dark-400">
                    <HiOutlineUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No students uploaded yet</p>
                </div>
            )}
        </div>
    )
}
