import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ConnectivityTest } from '../components/ConnectivityTest';

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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 space-y-6 animate-fade-in-up">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to your Valuation account</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 mb-6 group"
                >
                    <span className="bg-white/20 p-1 rounded-full group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </span>
                    Try Live Demo
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white/50 backdrop-blur-sm text-gray-500">or sign in with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        className="w-full bg-system-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* SSO Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                {/* SSO Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/auth/sso/login/google`}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all bg-white/50 backdrop-blur-sm font-medium text-gray-700"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <button
                        onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/auth/sso/login/okta`}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all bg-white/50 backdrop-blur-sm font-medium text-gray-700"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#007DC1">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        </svg>
                        Sign in with Okta
                    </button>

                    <button
                        onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/auth/sso/login/azure_ad`}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all bg-white/50 backdrop-blur-sm font-medium text-gray-700"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                            <path fill="#F25022" d="M0 0h11v11H0z" />
                            <path fill="#00A4EF" d="M12 0h11v11H12z" />
                            <path fill="#7FBA00" d="M0 12h11v11H0z" />
                            <path fill="#FFB900" d="M12 12h11v11H12z" />
                        </svg>
                        Sign in with Microsoft
                    </button>
                </div>

                <p className="text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-system-blue font-medium hover:underline">
                        Sign up
                    </Link>
                </p>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <ConnectivityTest />
                </div>
            </div>
        </div>
    );
};
