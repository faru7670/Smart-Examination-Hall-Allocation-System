import { useState, useEffect } from 'react'
import { getAllocations } from '../lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'

export default function ReportsPage() {
    const [allocations, setAllocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        getAllocations().then(d => setAllocations(Array.isArray(d) ? d : [])).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const filtered = search ? allocations.filter(a =>
        String(a.student_id).toUpperCase().includes(search.toUpperCase()) ||
        String(a.student_name).toUpperCase().includes(search.toUpperCase()) ||
        String(a.hall_name).toUpperCase().includes(search.toUpperCase()) ||
        String(a.subject_code).toUpperCase().includes(search.toUpperCase())
    ) : allocations

    const downloadCSV = () => {
        const csv = Papa.unparse(allocations.map(a => ({
            'Student ID': a.student_id, 'Name': a.student_name,
            'Subject': a.subject_code, 'Hall': a.hall_name,
            'Row': a.row_num, 'Col': a.col_num
        })))
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
        const a = document.createElement('a'); a.href = url; a.download = 'allocation.csv'
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    }

    const downloadPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(18); doc.setTextColor(99, 102, 241)
        doc.text('ExamHall — Seat Allocation Report', 14, 16)
        doc.setFontSize(10); doc.setTextColor(150, 150, 150)
        doc.text(`Generated: ${new Date().toLocaleString()} · Total: ${allocations.length} seats`, 14, 24)
        autoTable(doc, {
            startY: 30,
            head: [['Student ID', 'Name', 'Subject', 'Hall', 'Row', 'Col']],
            body: allocations.map(a => [a.student_id, a.student_name, a.subject_code, a.hall_name, a.row_num, a.col_num]),
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [240, 240, 255] }
        })
        doc.save('seat_allocation.pdf')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">📊 Reports</h2>
                    <p className="text-slate-400 text-sm mt-1">{allocations.length} allocations total</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={downloadCSV} disabled={!allocations.length}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-all disabled:opacity-40 flex items-center gap-2">
                        📋 Export CSV
                    </button>
                    <button onClick={downloadPDF} disabled={!allocations.length}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-2">
                        📄 Download PDF
                    </button>
                </div>
            </div>

            {allocations.length > 0 && (
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by student, hall, or subject..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
            )}

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : allocations.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {search && <p className="px-5 py-2 text-sm text-slate-400 border-b border-slate-800">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>}
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 sticky top-0">
                                <tr>
                                    {['Student ID', 'Name', 'Subject', 'Hall', 'Seat'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-slate-400 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filtered.slice(0, 200).map((a, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3 font-mono text-indigo-400">{a.student_id}</td>
                                        <td className="px-5 py-3 text-white">{a.student_name}</td>
                                        <td className="px-5 py-3"><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs">{a.subject_code}</span></td>
                                        <td className="px-5 py-3 text-slate-300">{a.hall_name}</td>
                                        <td className="px-5 py-3 font-mono text-slate-400 text-xs">R{a.row_num}·C{a.col_num}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length > 200 && <p className="text-center py-3 text-slate-500 text-sm">Showing 200 of {filtered.length}</p>}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-slate-500">
                    <div className="text-6xl mb-4">📊</div>
                    <p>No allocations yet. Run allocation from the Allocation tab.</p>
                </div>
            )}
        </div>
    )
}
