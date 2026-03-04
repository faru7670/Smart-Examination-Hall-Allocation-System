import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../api'
import { HiOutlineDocumentDownload, HiOutlineTable, HiOutlineDocumentText } from 'react-icons/hi'

export default function ReportsPage({ isPublic = false }) {
    const [allocations, setAllocations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAllocs = async () => {
            try {
                const r = isPublic ? await axios.get('/api/allocations') : await API.get('/allocations')
                setAllocations(Array.isArray(r.data) ? r.data : [])
            } catch (err) { }
            setLoading(false)
        }
        fetchAllocs()
    }, [isPublic])

    const handleDownloadCSV = async () => {
        try {
            const url = isPublic ? '/api/export/csv' : 'http://localhost:5000/api/export/csv'
            const r = isPublic
                ? await axios.get(url, { responseType: 'blob' })
                : await API.get('/export/csv', { responseType: 'blob' })
            const objectUrl = window.URL.createObjectURL(new Blob([r.data]))
            const link = document.createElement('a')
            link.href = objectUrl
            link.setAttribute('download', 'seat_allocation.csv')
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (e) { alert('Failed to download CSV') }
    }

    const handleDownloadPDF = async () => {
        try {
            const url = isPublic ? '/api/export/pdf' : 'http://localhost:5000/api/export/pdf'
            const r = isPublic
                ? await axios.get(url, { responseType: 'blob' })
                : await API.get('/export/pdf', { responseType: 'blob' })
            const objectUrl = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href = objectUrl
            link.setAttribute('download', 'seat_allocation.pdf')
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (e) { alert('Failed to download PDF') }
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
                        <HiOutlineDocumentDownload className="w-5 h-5" /> Download PDF Report
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : allocations.length > 0 ? (
                <div className="glass-card overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-dark-700/50 flex items-center gap-3">
                        <HiOutlineDocumentText className="w-5 h-5 text-primary-400" />
                        <span className="font-semibold">{allocations.length} Allocated Seats (Preview)</span>
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
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 font-mono text-xs text-dark-300 shadow-inner">
                                                R{a.row_num}C{a.col_num}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {allocations.length > 100 && (
                            <div className="p-4 text-center border-t border-dark-700/50 text-dark-400 text-sm">
                                Showing first 100 rows. Download full report for all records.
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
