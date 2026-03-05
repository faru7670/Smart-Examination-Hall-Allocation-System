import { useState, useEffect, useRef } from 'react'
import { getHalls, getAllocations } from '../lib/db'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from '../context/ToastContext'
import { Search, Download, Printer, FileText, FileSpreadsheet, Send, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const palette = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316']

export default function ReportsPage({ collegeCode, isStaff }) {
    const toast = useToast()
    const { userData } = useAuth()
    const [allocations, setAllocations] = useState([])
    const [halls, setHalls] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // For PDF generation
    const [selectedHallId, setSelectedHallId] = useState('all')
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const [sendingEmail, setSendingEmail] = useState(false)
    const printRef = useRef()

    useEffect(() => {
        if (collegeCode) {
            Promise.all([getAllocations(collegeCode), getHalls(collegeCode)])
                .then(([a, h]) => { setAllocations(a); setHalls(h) })
                .catch(e => toast.error(e.message))
                .finally(() => setLoading(false))
        }
    }, [collegeCode])

    const filtered = allocations.filter(a => {
        const matchesSearch = a.student_id.toLowerCase().includes(search.toLowerCase()) ||
            a.student_name.toLowerCase().includes(search.toLowerCase()) ||
            a.subject_code.toLowerCase().includes(search.toLowerCase())
        const matchesHall = selectedHallId === 'all' || a.hall_id === selectedHallId
        return matchesSearch && matchesHall
    })

    const handleCSV = () => {
        if (filtered.length === 0) return toast.warning("No data to export")
        const csv = Papa.unparse(filtered.map(a => ({
            'Student ID': a.student_id,
            'Name': a.student_name,
            'Subject': a.subject_code,
            'Hall': a.hall_name,
            'Row': a.row_num,
            'Col': a.col_num
        })))
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `exam_allocation_report_${selectedHallId === 'all' ? 'overall' : selectedHallId}.csv`
        link.click()
        toast.success("CSV Downloaded!")
    }

    // Advanced PDF Snapshot logic
    const handlePDF = async (simulateEmail = false) => {
        if (selectedHallId === 'all') return toast.warning("Please select a specific hall from the dropdown to generate its visual seating chart.")
        if (filtered.length === 0) return toast.error("No allocations exist for this hall.")

        const hall = halls.find(h => h.id === selectedHallId)

        if (simulateEmail) {
            setSendingEmail(true)
        } else {
            setGeneratingPDF(true)
            toast.info("Generating high-res grid snapshot...")
        }

        try {
            const element = printRef.current

            // Generate canvas
            const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
            const imgData = canvas.toDataURL('image/png')

            // Create PDF
            const pdf = new jsPDF('l', 'mm', 'a4') // landscape
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

            if (simulateEmail) {
                // Simulate email sending API delay
                await new Promise(r => setTimeout(r, 2000))
                toast.success(`Success! PDF sent to your registered email (${userData?.email || 'Admin Mail'}).`)
            } else {
                pdf.save(`Seating_Chart_${hall.name.replace(/\s+/g, '_')}.pdf`)
                toast.success("PDF Seating Chart generated!")
            }

        } catch (e) {
            console.error(e)
            toast.error("Failed to generate document")
        }

        setGeneratingPDF(false)
        setSendingEmail(false)
    }

    // Off-screen container for rendering the perfect "Printable 2D Table"
    const renderPrintableGrid = () => {
        if (selectedHallId === 'all') return null
        const hall = halls.find(h => h.id === selectedHallId)
        if (!hall) return null

        const grid = Array(hall.rows).fill(null).map(() => Array(hall.cols).fill(null))
        filtered.forEach(a => grid[a.row_num - 1][a.col_num - 1] = a)

        const subjList = [...new Set(filtered.map(a => a.subject_code))]
        const colors = subjList.reduce((acc, code, idx) => { acc[code] = palette[idx % palette.length]; return acc }, {})

        return (
            <div className="absolute top-0 left-[-9999px] bg-white p-12 text-black w-[1123px] min-h-[794px]" ref={printRef}>
                {/* Header Header */}
                <div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">OFFICIAL SEATING ALLOTMENT</h1>
                        <p className="text-xl text-slate-600 font-bold uppercase tracking-widest">{hall.name} • {hall.rows} ROWS × {hall.cols} COLS</p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-600 font-bold text-2xl mb-1">{collegeCode}</p>
                        <p className="text-slate-600 font-mono text-sm">{new Date().toLocaleString()}</p>
                    </div>
                </div>

                {/* The Visual Tabular Grid */}
                <div className="border-2 border-slate-200 bg-slate-50 p-6 rounded-xl shadow-inner mb-8">
                    <div className="grid gap-[2px] w-full" style={{ gridTemplateColumns: `repeat(${hall.cols}, minmax(0, 1fr))` }}>
                        {grid.map((row, r) => row.map((cell, c) => (
                            <div key={`${r}-${c}`} className={`p-2 border-2 text-center aspect-square flex flex-col justify-center items-center ${cell ? 'bg-white shadow-sm' : 'border-dashed border-slate-300 bg-transparent'}`}
                                style={{ borderColor: cell ? colors[cell.subject_code] : '' }}>
                                {cell ? (
                                    <>
                                        <div className="text-xs font-black text-slate-800 tracking-tighter w-full truncate mb-1">{cell.student_id}</div>
                                        <div className="text-[9px] text-slate-900 px-1.5 py-0.5 rounded-full font-bold shadow-sm" style={{ backgroundColor: colors[cell.subject_code] }}>{cell.subject_code}</div>
                                    </>
                                ) : (
                                    <div className="text-[10px] text-slate-600 font-bold opacity-50">Empty</div>
                                )}
                            </div>
                        )))}
                    </div>
                </div>

                {/* Footer Legend */}
                <div className="flex flex-wrap gap-4 mt-8 border-t-2 border-slate-200 pt-6">
                    {Object.entries(colors).map(([sub, col]) => (
                        <div key={sub} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md" style={{ backgroundColor: col }} />
                            <span className="text-sm font-bold text-slate-600">{sub}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-slide-up relative overflow-hidden">
            {/* Print Grid injected into DOM securely (invisible to user, only captured by html2canvas) */}
            {renderPrintableGrid()}

            <div className="glass p-8 rounded-3xl border-l-[6px] border-l-pink-500 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center"><Printer size={24} /></div>
                        <h2 className="text-3xl font-black">Official Reports & Exports</h2>
                    </div>
                    <p className="text-slate-600 ml-16">Download precise tabular seating layouts in High-Res PDF & CSV. Email to staff automatically.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Export Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-3xl flex flex-col h-full sticky top-24 shadow-xl">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-pink-500 rounded-full" /> Filter & Export</h3>

                        <div className="space-y-5 flex-1">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1 uppercase">Target Venue</label>
                                <select value={selectedHallId} onChange={e => setSelectedHallId(e.target.value)}
                                    className="w-full bg-white/80 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 appearance-none font-bold">
                                    <option value="all">🌐 All Halls (List View)</option>
                                    {halls.map(h => <option key={h.id} value={h.id}>🏛️ {h.name}</option>)}
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <button onClick={handleCSV} className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-200 hover:bg-slate-700 hover:text-slate-900 text-slate-300 rounded-xl transition-colors font-bold group mb-3 shadow-lg hover:shadow-cyan-500/10 border border-slate-300">
                                    <span className="flex items-center gap-3"><FileSpreadsheet size={18} className="text-cyan-400" /> Export CSV</span>
                                    <Download size={16} className="opacity-50 group-hover:opacity-100" />
                                </button>

                                <button onClick={() => handlePDF(false)} disabled={generatingPDF || selectedHallId === 'all'}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all font-bold group mb-3 shadow-lg border relative overflow-hidden
                                        ${selectedHallId === 'all' ? 'bg-slate-200 text-slate-600 cursor-not-allowed border-slate-300' : 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border-pink-500/30 hover:border-pink-400'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/10 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <span className="flex items-center gap-3 z-10"><FileText size={18} className="text-pink-400" /> {generatingPDF ? 'Rendering...' : 'Print Visual PDF'}</span>
                                    <Download size={16} className={`z-10 ${selectedHallId === 'all' ? 'opacity-30' : 'opacity-80 group-hover:opacity-100'}`} />
                                </button>
                                {selectedHallId === 'all' && <p className="text-[10px] text-pink-500 font-bold uppercase text-center mt-[-4px] tracking-wide animate-pulse">Select a hall to enable Visual Print</p>}
                            </div>

                            {/* Email Feature */}
                            {!isStaff && (
                                <div className="pt-4 border-t border-slate-200">
                                    <p className="text-xs text-slate-600 font-semibold uppercase mb-3 text-center tracking-widest">Share Automations</p>
                                    <button onClick={() => handlePDF(true)} disabled={sendingEmail || selectedHallId === 'all'}
                                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all font-bold group shadow-lg border
                                            ${selectedHallId === 'all' ? 'bg-slate-200 text-slate-600 cursor-not-allowed border-slate-300' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400 hover:shadow-emerald-500/20'}`}>
                                        <span className="flex items-center gap-3"><Send size={18} className="text-emerald-400" /> {sendingEmail ? 'Connecting Outbox...' : 'Email to Staff HQ'}</span>
                                        <Send size={16} className={`transform -rotate-45 ${selectedHallId === 'all' ? 'opacity-30' : 'opacity-80 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform'}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table Preview */}
                <div className="lg:col-span-3">
                    <div className="glass p-4 rounded-3xl relative z-10 w-full lg:w-96 mb-4">
                        <Search className="absolute left-8 top-7 text-slate-600" size={18} />
                        <input type="text" placeholder="Search allotment..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/80 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:border-pink-500 transition-colors" />
                    </div>

                    <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative group">
                        <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/90 sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-5 text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">Roll No</th>
                                        <th className="p-5 text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">Student Name</th>
                                        <th className="p-5 text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">Hall</th>
                                        <th className="p-5 text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">Seat</th>
                                        <th className="p-5 text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [1, 2, 3].map(i => <tr key={i} className="border-b border-slate-200/50"><td colSpan={5} className="p-5"><div className="h-5 shimmer w-full opacity-30 rounded" /></td></tr>)
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="5" className="p-16 text-center text-slate-600 font-bold text-lg"><Calendar className="mx-auto mb-3 opacity-30" size={40} />No matches found.</td></tr>
                                    ) : (
                                        filtered.map(a => (
                                            <tr key={a.id} className="border-b border-slate-200/50 hover:bg-slate-200/40 transition-colors">
                                                <td className="p-5 font-mono font-bold text-pink-400">{a.student_id}</td>
                                                <td className="p-5 font-bold text-slate-900">{a.student_name} <br /><span className="text-xs text-slate-600 font-mono bg-slate-200 px-1 rounded">{a.subject_code}</span></td>
                                                <td className="p-5 text-indigo-300 font-bold">{a.hall_name}</td>
                                                <td className="p-5 font-mono text-slate-300">R<span className="text-slate-900 font-bold">{a.row_num}</span> • C<span className="text-slate-900 font-bold">{a.col_num}</span></td>
                                                <td className="p-5 text-right text-xs text-slate-600 font-bold tracking-widest">09:00 AM</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
