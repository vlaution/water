import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';

interface AnalystDashboardProps {
    onCreateValuation: () => void;
}

interface ValuationRun {
    id: string;
    name: string;
    status?: string;
    type: string;
    created_at: string;
    enterprise_value?: number;
    progress: number;
}

export const AnalystDashboard: React.FC<AnalystDashboardProps> = ({ onCreateValuation }) => {
    const { user, token } = useAuth();
    const [valuations, setValuations] = useState<ValuationRun[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRuns = async () => {
            try {
                const response = await fetch(api.url('/runs'), {
                    headers: token ? {
                        'Authorization': `Bearer ${token}`
                    } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    const mapped = data.map((run: any) => ({
                        id: run.id,
                        name: run.company_name,
                        status: 'Completed',
                        type: run.mode === 'manual' ? 'Manual' : 'Upload',
                        progress: 100,
                        created_at: run.created_at
                    }));
                    setValuations(mapped);
                }
            } catch (error) {
                console.error('Error fetching valuations:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchRuns();
        }
    }, [token]);

    const recentTemplates = [
        { name: 'SaaS DCF Template', category: 'Technology' },
        { name: 'LBO Model Template', category: 'Private Equity' },
        { name: 'Merger Model', category: 'M&A' },
    ];

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analyst Workbench</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name}</p>
                </div>
                <div className="text-sm text-gray-500 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="glass-panel p-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
                <div className="grid grid-cols-4 gap-4">
                    <button
                        onClick={onCreateValuation}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-system-blue transition-colors group border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30"
                    >
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-blue-800 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">New Valuation</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors group border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/30">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-purple-800 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Run Comps</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors group border border-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/30">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-green-800 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Validate</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors group border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/30">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-orange-800 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Export</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Valuations */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-system-blue"></span>
                        Active Valuations
                    </h2>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="glass-panel p-8 flex justify-center text-gray-500">Loading...</div>
                        ) : valuations.length === 0 ? (
                            <div className="glass-panel p-8 text-center text-gray-500">
                                No active valuations. Start a new one!
                            </div>
                        ) : (
                            valuations.map((val) => (
                                <div key={val.id} className="glass-panel p-4 flex items-center justify-between hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-xs">
                                            {val.type.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-system-blue transition-colors">{val.name}</h3>
                                            <p className="text-xs text-gray-500">{new Date(val.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{val.status}</span>
                                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-system-blue rounded-full" style={{ width: `${val.progress}%` }}></div>
                                            </div>
                                        </div>
                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
                {/* Recent Templates */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Templates
                    </h2>
                    <div className="glass-panel p-4 space-y-3">
                        {recentTemplates.map((template, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
                                        <p className="text-xs text-gray-500">{template.category}</p>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Suggestions (Live) */}
                <AIInsightsPanel />
            </div>
        </div>

    );
};

const AIInsightsPanel: React.FC = () => {
    const { token } = useAuth();
    const [insights, setInsights] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchInsights = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const url = api.url(`/dashboard/insights${isRefresh ? '?refresh=true' : ''}`);
            const response = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setInsights(data.insights || []);
            }
        } catch (error) {
            console.error("Failed to load insights:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (token) fetchInsights();
    }, [token]);

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Insights
            </h3>

            {loading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
            ) : insights.length > 0 ? (
                <ul className="space-y-3 mb-6">
                    {insights.map((insight, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-indigo-100">
                            <span className="mt-1 w-1.5 h-1.5 bg-indigo-300 rounded-full flex-shrink-0"></span>
                            {insight}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-indigo-100 mb-4">No active valuations analysis available.</p>
            )}

            <button
                onClick={() => fetchInsights(true)}
                disabled={refreshing || loading}
                className={`w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center justify-center gap-2 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh Analysis'}
            </button>
        </div>
    );
};
