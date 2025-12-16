import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ConnectivityTest } from '../components/ConnectivityTest';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, demoLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await demoLogin();
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Demo login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Dynamic Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse-slow pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-[120px] animate-pulse-slow pointer-events-none mix-blend-multiply dark:mix-blend-screen delay-1000" />

            {/* Theme Toggle Absolute */}
            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md relative z-10 perspective-1000">
                <div className="glass-panel p-10 backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl animate-fade-in-up">
                    <div className="text-center mb-10">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-3">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Sign in to your Valuation Platform
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-shake">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                                <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">Forgot?</a>
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm text-gray-500 dark:text-gray-400 rounded-full">Or continue with</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleDemoLogin}
                            disabled={loading}
                            className="w-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-6 py-3.5 rounded-xl font-semibold hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-3 group"
                        >
                            <span className="bg-emerald-500 text-white p-1 rounded-full group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </span>
                            Try Live Demo
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            Create an account
                        </Link>
                    </p>

                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/5 opacity-80">
                        <ConnectivityTest />
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8 font-medium">
                    &copy; 2024 Valuation Platform. Secure & Encrypted.
                </p>
            </div>
        </div>
    );
};
