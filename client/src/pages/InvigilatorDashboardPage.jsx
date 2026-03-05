import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { HiOutlineOfficeBuilding, HiOutlineUserGroup, HiOutlineDocumentReport } from 'react-icons/hi';
import { motion } from 'framer-motion';

export default function InvigilatorDashboardPage() {
    const { user } = useAuth();
    const [halls, setHalls] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch the halls associated with this college
                const [hallsRes, allocsRes] = await Promise.all([
                    API.get('/halls'),
                    API.get('/allocations')
                ]);

                // For a real invigilator logic, the backend should return ONLY the halls assigned to them.
                // However, the current backend returns all halls for the college. We will display them as tasks.
                setHalls(hallsRes.data);
                setAllocations(allocsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin glow-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent mb-2">
                    Welcome, {user.name || user.email.split('@')[0]}
                </h1>
                <p className="text-dark-400">Invigilator Portal for College ID: {user.collegeId}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-l-4 border-l-primary-500 group hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-dark-400 text-sm font-medium mb-1">Assigned Halls</p>
                            <h3 className="text-3xl font-bold text-slate-900 group-hover:text-primary-400 transition-colors">{halls.length}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                            <HiOutlineOfficeBuilding className="w-6 h-6 text-primary-400" />
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 border-l-4 border-l-accent-500 group hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-dark-400 text-sm font-medium mb-1">Total Students</p>
                            <h3 className="text-3xl font-bold text-slate-900 group-hover:text-accent-400 transition-colors">{allocations.length}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                            <HiOutlineUserGroup className="w-6 h-6 text-accent-400" />
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 border-l-4 border-l-green-500 group hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => window.print()}>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-dark-400 text-sm font-medium mb-1">Print Duties</p>
                            <h3 className="text-xl font-bold text-slate-900">Duty Chart</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <HiOutlineDocumentReport className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-xs text-dark-500">Download PDF of your roster</p>
                </motion.div>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Your Hall Assignments</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {halls.map((hall, idx) => {
                    const hallAllocs = allocations.filter(a => a.hall_id === hall.id);
                    return (
                        <motion.div
                            key={hall.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            className="glass-card p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900">{hall.name}</h4>
                                    <p className="text-sm text-dark-400">{hall.rows}x{hall.cols} Grid Layout</p>
                                </div>
                                <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-semibold">
                                    {hallAllocs.length} / {hall.capacity} Full
                                </span>
                            </div>

                            <div className="overflow-x-auto mt-4">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-dark-700/50">
                                            <th className="py-2 text-xs text-dark-400 font-medium">Student ID</th>
                                            <th className="py-2 text-xs text-dark-400 font-medium">Name</th>
                                            <th className="py-2 text-xs text-dark-400 font-medium text-right">Seat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-800/50">
                                        {hallAllocs.slice(0, 5).map(a => (
                                            <tr key={a.id} className="hover:bg-dark-800/30 transition-colors">
                                                <td className="py-2 text-sm text-dark-300">{a.student_id}</td>
                                                <td className="py-2 text-sm font-medium text-slate-900">{a.student_name}</td>
                                                <td className="py-2 text-sm font-mono text-primary-400 text-right">R{a.row_num}C{a.col_num}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {hallAllocs.length > 5 && (
                                    <div className="text-center mt-3 pt-3 border-t border-dark-700/50">
                                        <button className="text-xs text-dark-400 hover:text-slate-900 transition-colors">View all {hallAllocs.length} students...</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
