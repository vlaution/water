import React from 'react';
import { useAuth } from '../context/AuthContext';

export const PartnerDashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-8 animate-fade-in-up font-sans text-slate-900 dark:text-gray-100">
            {/* Royal Platinum Backing Layer (Blocks global turquoise) */}
            <div className="fixed inset-0 -z-20 bg-slate-50 dark:bg-gray-900 pointer-events-none" />

            {/* Royal Platinum Gradient Overlay */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/50 via-slate-50/50 to-white/0 pointer-events-none dark:from-amber-900/10 dark:via-gray-900/50 dark:to-gray-900/0" />

            {/* Header */}
            <div className="flex justify-between items-end pb-2">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 dark:from-amber-200 dark:via-yellow-200 dark:to-amber-400 font-serif">
                        Executive Command
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-bold tracking-widest uppercase">Firm Status: Optimal</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="glass-button bg-white/80 border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-all duration-300 text-xs font-bold tracking-widest uppercase shadow-sm">
                        Compliance Audit
                    </button>
                    <button className="glass-button-primary bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-gray-900 shadow-xl shadow-slate-900/20 text-xs font-bold tracking-widest uppercase border border-slate-700">
                        Board Materials
                    </button>
                </div>
            </div>

            {/* Firm Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Card - Gold Theme */}
                <div className="glass-panel p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 border-t-4 border-t-amber-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Firm Revenue (QTD)</p>
                    <h3 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">$4.8 M</h3>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full">+24% YoY</span>
                    </div>
                </div>

                {/* Retention Card - Platinum Theme */}
                <div className="glass-panel p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-500 border-t-4 border-t-slate-400">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-slate-400/20 transition-all"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Client Retention</p>
                    <h3 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">94%</h3>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">Top Quartile</span>
                    </div>
                </div>

                {/* Risk Card - Alert Theme */}
                <div className="glass-panel p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 border-t-4 border-t-red-500 bg-gradient-to-br from-white to-red-50/30 dark:from-gray-900 dark:to-red-900/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/20 transition-all"></div>
                    <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-[0.2em] mb-2">Active Risk Alerts</p>
                    <h3 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">3</h3>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs font-bold text-red-600 bg-red-100 border border-red-200 px-2 py-1 rounded-full uppercase">Action Required</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk & Compliance Dashboard */}
                <div className="glass-panel p-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Risk Radar</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded border border-slate-100">Live Monitoring</span>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'Regulatory Compliance', score: '100%', status: 'optimal' },
                            { label: 'Audit Trail Completeness', score: '98%', status: 'optimal' },
                            { label: 'High-Risk Valuations', score: '3', status: 'critical' },
                            { label: 'Data Governance', score: '95%', status: 'warning' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors dark:bg-white/5 dark:border-white/10 dark:hover:border-white/20">
                                <span className="font-medium text-slate-700 dark:text-gray-200 text-sm">{item.label}</span>
                                <div className="flex items-center gap-4">
                                    <span className={`font-mono font-bold text-lg ${item.status === 'optimal' ? 'text-emerald-600' : item.status === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                                        {item.score}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full shadow-sm ${item.status === 'optimal' ? 'bg-emerald-500' : item.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Strategic Initiatives */}
                <div className="glass-panel p-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Strategic Initiatives</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded border border-slate-100">Q4 Priorities</span>
                    </div>

                    <div className="space-y-4">
                        <div className="group p-5 bg-white/50 rounded-xl border border-slate-100 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer dark:bg-white/5 dark:border-white/10">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white font-serif">Market Expansion: APAC</h3>
                                <div className="flex items-center gap-1.5 ">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-bold text-emerald-600">ON TRACK</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3 dark:bg-white/10 overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">Regulatory approval pending in Singapore. Team staffing 80% complete.</p>
                        </div>

                        <div className="group p-5 bg-white/50 rounded-xl border border-slate-100 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/5 transition-all cursor-pointer dark:bg-white/5 dark:border-white/10">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white font-serif">AI Implementation Phase 2</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-bold text-red-600">AT RISK</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3 dark:bg-white/10 overflow-hidden">
                                <div className="bg-slate-400 h-full w-[40%] rounded-full"></div>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">Integration with legacy systems showing latency. Technical audit scheduled.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
