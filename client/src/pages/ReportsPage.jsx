import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllocations } from '../lib/db'
import { HiOutlineDocumentDownload, HiOutlineTable, HiOutlineDocumentText } from 'react-icons/hi'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'

export default function ReportsPage() {
    const { user } = useAuth()
    const [allocations, setAllocations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.collegeId) return
        getAllocations(user.collegeId).then(data => setAllocations(Array.isArray(data) ? data : [])).catch(() => { }).finally(() => setLoading(false))
    }, [user?.collegeId])

    const handleDownloadCSV = () => {
        if (allocations.length === 0) return
        const csv = Papa.unparse(allocations.map(a => ({
            'Student ID': a.student_id,
            'Name': a.student_name,
            'Subject': a.subject_code,
            'Hall': a.hall_name,
            'Row': a.row_num,
            'Col': a.col_num,
        })))
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url; link.download = 'seat_allocation.csv'
        document.body.appendChild(link); link.click(); link.remove()
        URL.revokeObjectURL(url)
    }

    const handleDownloadPDF = () => {
        if (allocations.length === 0) return
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text('Seat Allocation Report', 14, 15)
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
        autoTable(doc, {
            startY: 28,
            head: [['Student ID', 'Name', 'Subject', 'Hall', 'Seat']],
            body: allocations.map(a => [a.student_id, a.student_name, a.subject_code, a.hall_name, `R${a.row_num}C${a.col_num}`]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [99, 102, 241] }
        })
        doc.save('seat_allocation.pdf')
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Reports & Exports</h1>
                    <p className="text-dark-400 mt-1">Download seating charts and allocation data</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadCSV} disabled={allocations.length === 0} className="btn-secondary flex items-center gap-2">
                        <HiOutlineTable className="w-5 h-5" /> Export CSV
                    </button>
                    <button onClick={handleDownloadPDF} disabled={allocations.length === 0} className="btn-primary flex items-center gap-2">
                        <HiOutlineDocumentDownload className="w-5 h-5" /> Download PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : allocations.length > 0 ? (
                <div className="glass-card overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-dark-700/50 flex items-center gap-3">
                        <HiOutlineDocumentText className="w-5 h-5 text-primary-400" />
                        <span className="font-semibold">{allocations.length} Allocated Seats</span>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-dark-800/50 sticky top-0">
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-dark-400">Student ID</th>
                                    <th className="text-left px-6 py-3 font-medium text-dark-400">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-dark-400">Subject</th>
                                    <th className="text-left px-6 py-3 font-medium text-dark-400">Hall</th>
                                    <th className="text-center px-6 py-3 font-medium text-dark-400">Seat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700/30">
                                {allocations.slice(0, 100).map((a, i) => (
                                    <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                                        <td className="px-6 py-3 font-mono text-primary-400">{a.student_id}</td>
                                        <td className="px-6 py-3 text-white">{a.student_name}</td>
                                        <td className="px-6 py-3"><span className="badge bg-primary-500/20 text-primary-300">{a.subject_code}</span></td>
                                        <td className="px-6 py-3 text-white">{a.hall_name}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="inline-flex items-center justify-center w-14 h-8 rounded-lg bg-dark-800 border border-dark-600 font-mono text-xs text-dark-300">R{a.row_num}C{a.col_num}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {allocations.length > 100 && (
                            <div className="p-4 text-center border-t border-dark-700/50 text-dark-400 text-sm">
                                Showing first 100. Download full report for all records.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass-card p-12 text-center text-dark-400">
                    <HiOutlineDocumentDownload className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary-500" />
                    <p className="text-lg">No allocations found</p>
                    <p className="text-sm mt-1">Run the allocation algorithm first to generate reports.</p>
                </div>
            )}
        </div>
    )
}
