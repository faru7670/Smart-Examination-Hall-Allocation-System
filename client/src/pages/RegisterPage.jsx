import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineAcademicCap, HiOutlineLockClosed, HiOutlineMail, HiOutlineOfficeBuilding } from 'react-icons/hi';

export default function RegisterPage() {
    const [collegeName, setCollegeName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { registerCollege, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    if (user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await registerCollege(email, password, collegeName);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-primary-900/20 to-dark-950" />
            <div className="absolute top-1/4 -right-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8 animate-slide-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4 shadow-2xl shadow-primary-500/30 animate-pulse-glow">
                        <HiOutlineAcademicCap className="w-8 h-8 text-slate-900" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent">ExamHall SaaS</h1>
                    <p className="text-dark-400 mt-1">Register Your Institution</p>
                </div>

                <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Create Admin Account</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">College/University Name</label>
                            <div className="relative">
                                <HiOutlineOfficeBuilding className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input type="text" value={collegeName} onChange={e => setCollegeName(e.target.value)} className="input-field pl-12" placeholder="e.g. Oxford University" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">Admin Email</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-12" placeholder="admin@college.edu" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field pl-12" placeholder="Min 6 characters" required minLength={6} />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Register College'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-dark-700/50 text-center">
                        <p className="text-sm text-dark-400">
                            Already registered? <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors">Log In Here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
