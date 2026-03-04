import { useState, useEffect } from 'react'
import { API } from '../context/AuthContext'
import { HiOutlineDocumentDownload, HiOutlineTable, HiOutlineDocumentText } from 'react-icons/hi'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function ReportsPage() {
    const [allocations, setAllocations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        API.get('/allocations').then(r => setAllocations(r.data)).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const downloadCSV = () => {
        let csv = 'StudentID,StudentName,SubjectCode,Hall,Row,Column\n'
        allocations.forEach(a => { csv += `${a.student_id},${a.student_name},${a.subject_code},${a.hall_name},${a.row_num},${a.col_num}\n` })
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'seat_allocation.csv'; a.click()
        URL.revokeObjectURL(url)
    }

    const downloadPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.setTextColor(30, 41, 59)
        doc.text('Smart Examination Hall Allocation Report', 14, 22)
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
        doc.text(`Total Allocated: ${allocations.length}`, 14, 36)

        const halls = [...new Set(allocations.map(a => a.hall_name))]
        let startY = 44

        halls.forEach(hallName => {
            const hallData = allocations.filter(a => a.hall_name === hallName)
            doc.setFontSize(13)
            doc.setTextColor(30, 41, 59)
            if (startY > 270) { doc.addPage(); startY = 20 }
            doc.text(hallName, 14, startY)
            startY += 4

            doc.autoTable({
                startY,
                head: [['Student ID', 'Name', 'Subject', 'Row', 'Col']],
                body: hallData.map(a => [a.student_id, a.student_name, a.subject_code, a.row_num, a.col_num]),
                headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [241, 245, 249] },
                styles: { fontSize: 8, cellPadding: 3 },
                margin: { left: 14 }
            })
            startY = doc.lastAutoTable.finalY + 12
        })

        doc.save('seat_allocation.pdf')
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="page-title">Reports</h1>
                <p className="text-dark-400 mt-1">Download allocation reports</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card-hover p-8 text-center" onClick={downloadCSV}>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineTable className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">CSV Report</h3>
                    <p className="text-sm text-dark-400 mt-1 mb-4">Download complete allocation data as CSV</p>
                    <button className="btn-primary inline-flex items-center gap-2 text-sm">
                        <HiOutlineDocumentDownload className="w-4 h-4" /> Download CSV
                    </button>
                </div>

                <div className="glass-card-hover p-8 text-center" onClick={downloadPDF}>
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineDocumentText className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">PDF Report</h3>
                    <p className="text-sm text-dark-400 mt-1 mb-4">Download formatted seating chart as PDF</p>
                    <button className="btn-primary inline-flex items-center gap-2 text-sm">
                        <HiOutlineDocumentDownload className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>

            {/* Preview */}
            {allocations.length > 0 && (
                <div className="glass-card overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-dark-700/50">
                        <span className="font-semibold">{allocations.length} allocations</span>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-dark-800/50 sticky top-0">
                                <tr>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Student ID</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Name</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Subject</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Hall</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Row</th>
                                    <th className="text-left px-6 py-3 text-dark-400 font-medium">Col</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700/30">
                                {allocations.slice(0, 100).map((a, i) => (
                                    <tr key={i} className="hover:bg-dark-700/20">
                                        <td className="px-6 py-3 font-mono text-primary-400">{a.student_id}</td>
                                        <td className="px-6 py-3 text-white">{a.student_name}</td>
                                        <td className="px-6 py-3"><span className="badge bg-primary-500/20 text-primary-300">{a.subject_code}</span></td>
                                        <td className="px-6 py-3 text-white">{a.hall_name}</td>
                                        <td className="px-6 py-3 text-dark-300">{a.row_num}</td>
                                        <td className="px-6 py-3 text-dark-300">{a.col_num}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {allocations.length > 100 && <p className="text-center py-3 text-dark-400 text-sm">Showing first 100 of {allocations.length}</p>}
                    </div>
                </div>
            )}
        </div>
    )
}
