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

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-xl p-8 space-y-6 animate-fade-in-up">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join Valuation to get started</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection - Premium UI */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div
                            onClick={() => setRole('user')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group ${role === 'user'
                                ? 'border-system-blue bg-blue-50/50 shadow-md'
                                : 'border-transparent bg-white/40 hover:bg-white/60 hover:shadow-sm'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${role === 'user' ? 'bg-system-blue text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900">Standard User</h3>
                                <p className="text-xs text-gray-500">View reports & basic access</p>
                            </div>
                            {role === 'user' && (
                                <div className="absolute top-2 right-2 text-system-blue">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <div
                            onClick={() => setRole('analyst')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group ${role === 'analyst'
                                ? 'border-purple-500 bg-purple-50/50 shadow-md'
                                : 'border-transparent bg-white/40 hover:bg-white/60 hover:shadow-sm'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${role === 'analyst' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900">Analyst</h3>
                                <p className="text-xs text-gray-500">Create & run valuations</p>
                            </div>
                            {role === 'analyst' && (
                                <div className="absolute top-2 right-2 text-purple-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Role Selection Row 2 - Senior/Admin */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div
                            onClick={() => setRole('associate')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group ${role === 'associate'
                                ? 'border-amber-500 bg-amber-50/50 shadow-md'
                                : 'border-transparent bg-white/40 hover:bg-white/60 hover:shadow-sm'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${role === 'associate' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">Sr. Analyst</h3>
                                    <p className="text-[10px] text-gray-500">Quality Control</p>
                                </div>
                            </div>
                            {role === 'associate' && (
                                <div className="absolute top-2 right-2 text-amber-500">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <div
                            onClick={() => setRole('manager')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group ${role === 'manager'
                                ? 'border-slate-800 bg-slate-100 shadow-md'
                                : 'border-transparent bg-white/40 hover:bg-white/60 hover:shadow-sm'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-600/0 to-slate-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${role === 'manager' ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">Manager / VP</h3>
                                    <p className="text-[10px] text-gray-500">Portfolio & Strategy</p>
                                </div>
                            </div>
                            {role === 'manager' && (
                                <div className="absolute top-2 right-2 text-slate-800">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Partner Card - Royal Platinum Theme */}
                        <div
                            onClick={() => setRole('partner')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group col-span-2 ${role === 'partner'
                                ? 'border-amber-400/50 bg-gradient-to-br from-slate-50 to-amber-50 shadow-xl shadow-amber-900/5'
                                : 'border-transparent bg-white/40 hover:bg-white/60 hover:shadow-sm'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r from-amber-200/20 via-yellow-100/20 to-amber-200/20 opacity-0 transition-opacity duration-700 ${role === 'partner' ? 'opacity-100' : 'group-hover:opacity-50'}`} />

                            <div className="relative flex items-center justify-between px-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${role === 'partner' ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-gray-200 border-transparent text-gray-500'
                                        }`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <h3 className={`font-bold text-sm ${role === 'partner' ? 'text-slate-900' : 'text-gray-900'}`}>Partner / C-Suite</h3>
                                        <p className={`text-[10px] ${role === 'partner' ? 'text-amber-700' : 'text-gray-500'}`}>Firm Governance & Strategy</p>
                                    </div>
                                </div>
                                {role === 'partner' && (
                                    <div className="text-amber-500">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Compliance Card - Steel Blue Theme */}
                        <div
                            onClick={() => setRole('compliance')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group ${role === 'compliance'
                                ? 'border-blue-800/20 bg-gradient-to-br from-slate-50 to-blue-50 shadow-xl shadow-blue-900/5'
                                : 'border-transparent bg-white/40 hover:bg-white/60 hover:shadow-sm'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-slate-100/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center justify-between px-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${role === 'compliance' ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-gray-200 border-transparent text-gray-500'
                                        }`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <h3 className={`font-bold text-sm ${role === 'compliance' ? 'text-slate-900' : 'text-gray-900'}`}>Compliance / Legal</h3>
                                        <p className={`text-[10px] ${role === 'compliance' ? 'text-blue-700' : 'text-gray-500'}`}>Audit & Risk Mitigation</p>
                                    </div>
                                </div>
                                {role === 'compliance' && (
                                    <div className="text-blue-600">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Card - Cyber Neon Theme */}
                        <div
                            onClick={() => setRole('admin')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group col-span-2 ${role === 'admin'
                                ? 'border-cyan-500/50 bg-slate-900 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                                : 'border-transparent bg-white/40 hover:bg-white/60 hover:shadow-sm'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {role === 'admin' && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>}

                            <div className="relative flex items-center justify-between px-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${role === 'admin' ? 'bg-cyan-950 border-cyan-500/50 text-cyan-400' : 'bg-gray-200 border-transparent text-gray-500'
                                        }`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <h3 className={`font-bold text-sm ${role === 'admin' ? 'text-white' : 'text-gray-900'}`}>System Admin</h3>
                                        <p className={`text-[10px] ${role === 'admin' ? 'text-cyan-400' : 'text-gray-500'}`}>System Operations</p>
                                    </div>
                                </div>
                                {role === 'admin' && (
                                    <div className="text-cyan-400 animate-spin-slow">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-system-blue focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-system-blue focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-system-blue focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 ${role === 'analyst'
                            ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'
                            : role === 'associate'
                                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30'
                                : role === 'manager'
                                    ? 'bg-slate-900 hover:bg-black shadow-slate-900/30'
                                    : role === 'partner'
                                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 text-white'
                                        : role === 'compliance'
                                            ? 'bg-slate-700 hover:bg-slate-800 shadow-slate-600/30 text-white'
                                            : role === 'admin'
                                                ? 'bg-cyan-950 hover:bg-cyan-900 shadow-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                                                : 'bg-system-blue hover:bg-blue-600 shadow-blue-500/30'
                            }`}
                    >
                        {loading ? 'Creating account...' : `Create ${role === 'analyst' ? 'Analyst' : role === 'associate' ? 'Senior Analyst' : role === 'manager' ? 'Manager' : role === 'partner' ? 'Partner' : role === 'compliance' ? 'Compliance' : role === 'admin' ? 'Admin' : ''} Account`}
                    </button>
                </form>

                <p className="text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-system-blue font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};
