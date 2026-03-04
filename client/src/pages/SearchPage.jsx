import { useState } from 'react'
import { API } from '../context/AuthContext'
import { HiOutlineSearch, HiOutlineLocationMarker } from 'react-icons/hi'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [searched, setSearched] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSearch = async (e) => {
        e?.preventDefault()
        if (!query.trim()) return
        setLoading(true)
        try {
            const r = await API.get(`/allocations/search?q=${encodeURIComponent(query.trim())}`)
            setResults(r.data)
        } catch (e) {
            setResults([])
        }
        setSearched(true)
        setLoading(false)
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="page-title">Search Student</h1>
                <p className="text-dark-400 mt-1">Find a student's seat by ID or name</p>
            </div>

            <form onSubmit={handleSearch} className="glass-card p-6">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            id="search-input"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="input-field pl-12"
                            placeholder="Enter Student ID or Name..."
                            autoFocus
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
                    </button>
                </div>
            </form>

            {searched && (
                results.length > 0 ? (
                    <div className="space-y-4 animate-slide-up">
                        <p className="text-dark-400 text-sm">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
                        {results.map((r, i) => (
                            <div key={i} className="glass-card-hover p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0">
                                        <HiOutlineLocationMarker className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-dark-400">Student ID</p>
                                            <p className="text-white font-mono font-semibold">{r.student_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-dark-400">Name</p>
                                            <p className="text-white">{r.student_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-dark-400">Subject</p>
                                            <p className="text-primary-400">{r.subject_code}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-dark-400">Seat</p>
                                            <p className="text-white">{r.hall_name} — Row {r.row_num}, Col {r.col_num}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center text-dark-400 animate-slide-up">
                        <HiOutlineSearch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No results found for "{query}"</p>
                    </div>
                )
            )}
        </div>
    )
}
