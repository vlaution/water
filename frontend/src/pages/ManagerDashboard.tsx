import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';

interface PortfolioSummary {
    total_valuation: number;
    run_count: number;
    average_ev: number;
    companies: number;
}

export const ManagerDashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [summary, setSummary] = useState<PortfolioSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const response = await fetch(api.url('/dashboard/portfolio/summary'), {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    setSummary(data);
                }
            } catch (error) {
                console.error("Error fetching portfolio summary:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchPortfolio();
    }, [token]);

    const formatCurrency = (val: number) => {
        if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)} B`;
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)} M`;
        return `$${val.toLocaleString()}`;
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Premium Platinum Background for Light Mode */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-gray-100 to-slate-200 dark:hidden pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-gray-200 dark:to-gray-400 font-serif">
                        Portfolio Command
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-2 font-medium tracking-wide text-sm uppercase">Executive Portfolio • {user?.name}</p>
                </div>
                <div className="flex gap-4">
                    <button className="glass-button bg-white/80 text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 shadow-sm transition-all duration-300 backdrop-blur-md">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Period</span>
                        Current
                    </button>
                    <button className="glass-button-primary bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100 shadow-2xl shadow-slate-900/20 border border-slate-700/50">
                        Generate Board Report
                    </button>
                </div>
            </div>

            {/* Top Stats - Portfolio Health */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 border-t-4 border-t-indigo-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Valuations (EV)</p>
                        <h3 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mt-3 tracking-tight">
                            {loading ? "Loading..." : summary ? formatCurrency(summary.total_valuation) : "$0"}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 border-t-4 border-t-emerald-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Deal Count</p>
                        <h3 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mt-3 tracking-tight">
                            {loading ? "-" : summary?.run_count || 0}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Companies: {summary?.companies || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 border-t-4 border-t-cyan-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Average EV</p>
                        <h3 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mt-3 tracking-tight">
                            {loading ? "-" : summary ? formatCurrency(summary.average_ev) : "$0"}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">Mean</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 border-t-4 border-t-amber-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Risk Exposure</p>
                                <h3 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mt-3 tracking-tight">Low</h3>
                            </div>
                            <div className="h-12 w-12 rounded-full border-[3px] border-amber-400/30 flex items-center justify-center text-xs font-bold text-amber-600 bg-amber-50">
                                A
                            </div>
                        </div>
                        <p className="text-xs text-amber-600 mt-2 font-bold tracking-wide">STABLE</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area - Strategic Insights & Productivity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Strategic Insights */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Strategic Intelligence</h2>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass-panel p-6 hover:border-red-200 transition-colors group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-red-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-400/20 transition-all"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-red-50 rounded-lg text-red-500">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">CRITICAL</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg leading-tight">Sector Concentration Risk</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">Technology sector exposure exceeds 40% threshold. Recommended diversification strategy available.</p>
                                <div className="mt-4 flex items-center text-red-600 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                    Review Analysis →
                                </div>
                            </div>

                            <div className="glass-panel p-6 hover:border-emerald-200 transition-colors group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-400/20 transition-all"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">OPPORTUNITY</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg leading-tight">Market Entry Signal</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">SaaS multiples have compressed by 15% in Q3. Ideal entry point for "Project Phoenix" acquisition.</p>
                                <div className="mt-4 flex items-center text-emerald-600 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                    View Deal Memo →
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Productivity */}
                    <div className="glass-panel p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 font-serif">Productivity Matrix</h2>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center mr-2">Team Efficiency</span>
                                <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded-full shadow-lg shadow-slate-900/20">98.2%</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-4 font-medium">Analyst</th>
                                        <th className="px-4 py-4 font-medium text-right">Throughput</th>
                                        <th className="px-4 py-4 font-medium text-right">Velocity</th>
                                        <th className="px-4 py-4 font-medium text-center">Quality</th>
                                        <th className="px-4 py-4 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">John Doe</td>
                                        <td className="px-4 py-4 text-right font-mono">12 Vals</td>
                                        <td className="px-4 py-4 text-right font-mono text-slate-400">1.8h</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-0.5">
                                                {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-3 bg-indigo-500 rounded-sm"></div>)}
                                                <div className="w-1 h-3 bg-indigo-200 rounded-sm"></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right"><span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded border border-green-100 uppercase">Active</span></td>
                                    </tr>
                                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Jane Smith</td>
                                        <td className="px-4 py-4 text-right font-mono">15 Vals</td>
                                        <td className="px-4 py-4 text-right font-mono text-slate-400">2.4h</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-3 bg-indigo-500 rounded-sm"></div>)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right"><span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded border border-green-100 uppercase">Active</span></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Mike Jones</td>
                                        <td className="px-4 py-4 text-right font-mono">8 Vals</td>
                                        <td className="px-4 py-4 text-right font-mono text-slate-400">3.1h</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-0.5">
                                                {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-amber-500 rounded-sm"></div>)}
                                                {[4, 5].map(i => <div key={i} className="w-1 h-3 bg-slate-200 rounded-sm"></div>)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right"><span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded border border-amber-100 uppercase">Review</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Side - Revenue & Quick Actions */}
                <div className="space-y-8">
                    {/* Revenue Card - Premium Dark */}
                    <div className="bg-slate-900 rounded-xl p-8 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-500/30 transition-all duration-1000"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] -ml-10 -mb-10"></div>

                        <div className="relative z-10">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Profitability Index</h3>
                            <div className="flex items-baseline gap-3 mb-8">
                                <h2 className="text-6xl font-serif font-bold tracking-tighter">42<span className="text-3xl text-indigo-400">%</span></h2>
                                <div className="flex flex-col">
                                    <span className="text-xs text-green-400 font-bold uppercase tracking-wider">▲ 2.4%</span>
                                    <span className="text-[10px] text-slate-500 font-medium">vs Prev Qtr</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                                        <span className="text-slate-400">Pipeline Value</span>
                                        <span className="text-white">$420,000</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1">
                                        <div className="bg-gradient-to-r from-sky-500 to-blue-600 h-1 rounded-full w-[75%] shadow-[0_0_10px_rgba(14,165,233,0.4)]"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                                        <span className="text-slate-400">Billable Efficiency</span>
                                        <span className="text-white">88%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1">
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1 rounded-full w-[88%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Command Menu - Premium List */}
                    <div className="glass-panel p-0 overflow-hidden border border-slate-200 shadow-xl">
                        <div className="p-5 bg-slate-50 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 font-serif tracking-tight">Executive Actions</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {[
                                { title: 'Portfolio Summary', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'indigo' },
                                { title: 'Client Invoice', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'emerald' },
                                { title: 'Strategic Scenario', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'pink' }
                            ].map((action, i) => (
                                <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg bg-${action.color}-50 text-${action.color}-600 flex items-center justify-center group-hover:bg-${action.color}-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} /></svg>
                                        </div>
                                        <span className="font-bold text-slate-700 group-hover:text-slate-900">{action.title}</span>
                                    </div>
                                    <span className="text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
