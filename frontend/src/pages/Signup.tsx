import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); // Default to user
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signup(email, password, name, role);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const getRoleStyles = (roleId: string, isActive: boolean) => {
        const styles: Record<string, { border: string, bg: string, text: string, iconBg: string, iconText: string, hover: string, shadow: string }> = {
            'user': {
                border: isActive ? 'border-blue-500' : 'border-white/20 dark:border-white/5',
                bg: isActive ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-white/20 dark:bg-white/5',
                text: isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
                iconBg: isActive ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800',
                iconText: isActive ? 'text-white' : 'text-gray-400',
                hover: 'hover:border-blue-400/50',
                shadow: isActive ? 'shadow-blue-500/10' : ''
            },
            'analyst': {
                border: isActive ? 'border-purple-500' : 'border-white/20 dark:border-white/5',
                bg: isActive ? 'bg-purple-500/10 dark:bg-purple-500/20' : 'bg-white/20 dark:bg-white/5',
                text: isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
                iconBg: isActive ? 'bg-purple-500' : 'bg-gray-100 dark:bg-gray-800',
                iconText: isActive ? 'text-white' : 'text-gray-400',
                hover: 'hover:border-purple-400/50',
                shadow: isActive ? 'shadow-purple-500/10' : ''
            },
            'associate': {
                border: isActive ? 'border-amber-500' : 'border-white/20 dark:border-white/5',
                bg: isActive ? 'bg-amber-500/10 dark:bg-amber-500/20' : 'bg-white/20 dark:bg-white/5',
                text: isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
                iconBg: isActive ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-800',
                iconText: isActive ? 'text-white' : 'text-gray-400',
                hover: 'hover:border-amber-400/50',
                shadow: isActive ? 'shadow-amber-500/10' : ''
            },
            'manager': {
                border: isActive ? 'border-slate-800 dark:border-slate-600' : 'border-white/20 dark:border-white/5',
                bg: isActive ? 'bg-slate-800/10 dark:bg-slate-600/20' : 'bg-white/20 dark:bg-white/5',
                text: isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
                iconBg: isActive ? 'bg-slate-800 dark:bg-slate-700' : 'bg-gray-100 dark:bg-gray-800',
                iconText: isActive ? 'text-white' : 'text-gray-400',
                hover: 'hover:border-slate-400/50',
                shadow: isActive ? 'shadow-slate-500/10' : ''
            },
            'partner': {
                border: isActive ? 'border-indigo-500' : 'border-white/20 dark:border-white/5',
                bg: isActive ? 'bg-indigo-500/10 dark:bg-indigo-500/20' : 'bg-white/20 dark:bg-white/5',
                text: isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
                iconBg: isActive ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-800',
                iconText: isActive ? 'text-white' : 'text-gray-400',
                hover: 'hover:border-indigo-400/50',
                shadow: isActive ? 'shadow-indigo-500/10' : ''
            },
            'compliance': {
                border: isActive ? 'border-teal-500' : 'border-white/20 dark:border-white/5',
                bg: isActive ? 'bg-teal-500/10 dark:bg-teal-500/20' : 'bg-white/20 dark:bg-white/5',
                text: isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
                iconBg: isActive ? 'bg-teal-500' : 'bg-gray-100 dark:bg-gray-800',
                iconText: isActive ? 'text-white' : 'text-gray-400',
                hover: 'hover:border-teal-400/50',
                shadow: isActive ? 'shadow-teal-500/10' : ''
            },
            'admin': {
                border: isActive ? 'border-cyan-500' : 'border-white/20 dark:border-white/5',
                bg: isActive ? 'bg-cyan-500/10 dark:bg-cyan-500/20' : 'bg-white/20 dark:bg-white/5',
                text: isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
                iconBg: isActive ? 'bg-cyan-500' : 'bg-gray-100 dark:bg-gray-800',
                iconText: isActive ? 'text-white' : 'text-gray-400',
                hover: 'hover:border-cyan-400/50',
                shadow: isActive ? 'shadow-cyan-500/10' : ''
            }
        };
        return styles[roleId] || styles['user'];
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl p-8 space-y-8 animate-fade-in-up">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Create Account</h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Join Valuation to get started</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Role Selection Grid - Redesigned for Consistency */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'user', label: 'Standard User', sub: 'Reports & basic access', icon: <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
                            { id: 'analyst', label: 'Analyst', sub: 'Run valuations & LBOs', icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
                            { id: 'associate', label: 'Sr. Analyst', sub: 'Quality Control & Review', icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
                            { id: 'manager', label: 'Manager / VP', sub: 'Portfolio & Strategy', icon: <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
                            { id: 'partner', label: 'Partner / C-Suite', sub: 'Firm Governance', icon: <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
                            { id: 'compliance', label: 'Compliance / Legal', sub: 'Audit & Risk Mitigation', icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
                            { id: 'admin', label: 'System Admin', sub: 'System Operations', icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> }
                        ].map((r) => {
                            const s = getRoleStyles(r.id, role === r.id);
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => setRole(r.id)}
                                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 relative group flex items-center gap-4 ${s.border} ${s.bg} ${s.shadow} ${s.hover}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${s.iconBg} ${s.iconText}`}>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            {r.icon}
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm truncate ${s.text}`}>{r.label}</h3>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">{r.sub}</p>
                                    </div>
                                    {role === r.id && (
                                        <div className={`absolute top-2 right-2 ${s.iconText}`}>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Inputs Polish */}
                    <div className="space-y-5 px-1">
                        {[
                            { id: 'name', label: 'Full Name', value: name, setter: setName, placeholder: 'John Doe', type: 'text' },
                            { id: 'email', label: 'Email Address', value: email, setter: setEmail, placeholder: 'you@example.com', type: 'email' },
                            { id: 'password', label: 'Security Password', value: password, setter: setPassword, placeholder: '••••••••', type: 'password' }
                        ].map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label htmlFor={field.id} className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                    {field.label}
                                </label>
                                <input
                                    id={field.id}
                                    type={field.type}
                                    value={field.value}
                                    onChange={(e) => field.setter(e.target.value)}
                                    required
                                    className="w-full px-5 py-4 rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none font-medium"
                                    placeholder={field.placeholder}
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-system-blue hover:bg-blue-600 text-white px-6 py-5 rounded-2xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 transform hover:-translate-y-1 active:translate-y-0 tracking-tight"
                    >
                        {loading ? 'Securing Account...' : `Join as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                <p className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-system-blue font-bold hover:underline ml-1">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};
