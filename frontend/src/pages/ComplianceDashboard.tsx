import React from 'react';

export const ComplianceDashboard: React.FC = () => {

    return (
        <div className="space-y-8 animate-fade-in-up font-sans text-slate-900 dark:text-gray-100">
            {/* Steel Blue Background Overlay */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50/50 to-white/0 pointer-events-none dark:from-blue-900/10 dark:via-gray-900/50 dark:to-gray-900/0" />

            {/* Header */}
            <div className="flex justify-between items-end pb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                        Compliance Control Center
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium tracking-wide uppercase">System Secure • Audit Active</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="glass-button bg-white/80 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all duration-300 text-xs font-bold tracking-widest uppercase shadow-sm">
                        Generate Report
                    </button>
                    <button className="glass-button-primary bg-slate-700 hover:bg-slate-800 shadow-xl shadow-slate-700/20 text-xs font-bold tracking-widest uppercase border border-slate-600">
                        Scheduled Audit
                    </button>
                </div>
            </div>

            {/* Compliance Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 border-t-4 border-t-emerald-500 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-20 h-20 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">ASC 820 Compliance</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">98%</span>
                        <span className="text-sm font-bold text-emerald-600 mb-1">Pass</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 dark:bg-white/10">
                        <div className="bg-emerald-500 h-full w-[98%] rounded-full"></div>
                    </div>
                </div>

                <div className="glass-panel p-6 border-t-4 border-t-blue-500 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-20 h-20 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 10.324a.75.75 0 01.666-1.074 1.5 1.5 0 011.059-2.583A1.5 1.5 0 006 5.5V5a3 3 0 013-3h6a3 3 0 013 3v.5a1.5 1.5 0 001.059 2.583 1.5 1.5 0 011.059 2.583c.184.288.169.66-.025.96a1.5 1.5 0 01-1.059 2.583 1.5 1.5 0 01-1.059 2.583 1.5 1.5 0 00-1.059 2.583v.5a3 3 0 01-3 3H9a3 3 0 01-3-3v-.5a1.5 1.5 0 00-1.059-2.583 1.5 1.5 0 01-1.059-2.583 1.5 1.5 0 01-1.059-2.583.75.75 0 01-.025-.96z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">SOX Controls</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">100%</span>
                        <span className="text-sm font-bold text-blue-600 mb-1">Verified</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 dark:bg-white/10">
                        <div className="bg-blue-500 h-full w-full rounded-full"></div>
                    </div>
                </div>

                <div className="glass-panel p-6 border-t-4 border-t-amber-500 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-20 h-20 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Doc Verification</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">338</span>
                        <span className="text-sm font-bold text-amber-600 mb-1">/ 342</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 dark:bg-white/10">
                        <div className="bg-amber-500 h-full w-[99%] rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-amber-600 font-bold mt-2 text-right">4 Overdue</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Audit Queue */}
                <div className="glass-panel p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Audit Queue</h3>
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">5 Pending</span>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/10">
                        <div className="p-4 hover:bg-slate-50 transition-colors dark:hover:bg-white/5 cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 text-red-600 rounded">⚠️</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Project Phoenix M&A</h4>
                                        <p className="text-xs text-slate-500">Valuation: $420M • Lead: John Doe</p>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors">Review</button>
                            </div>
                        </div>
                        <div className="p-4 hover:bg-slate-50 transition-colors dark:hover:bg-white/5 cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded">⏰</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Quarterly Portfolio Review</h4>
                                        <p className="text-xs text-slate-500">Scheduled: Q4 2024</p>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1 rounded hover:bg-slate-50 transition-colors">Details</button>
                            </div>
                        </div>
                        <div className="p-4 hover:bg-slate-50 transition-colors dark:hover:bg-white/5 cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded">🔍</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Random Sample: #4829</h4>
                                        <p className="text-xs text-slate-500">Auto-selected for spot check</p>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1 rounded hover:bg-slate-50 transition-colors">Start</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Flags */}
                <div className="glass-panel p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Risk Flags</h3>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-4 p-4 bg-red-50/50 border border-red-100 rounded-lg dark:bg-red-900/10 dark:border-red-900/20">
                            <div className="mt-1">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">High Deviation Detected</h4>
                                <p className="text-xs text-slate-600 mt-1 dark:text-gray-400">Solaris Energy valuation exceeds sector volatility index by 15%.</p>
                                <button className="text-xs font-bold text-red-600 mt-2 hover:underline">Investigate Source →</button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-lg dark:bg-amber-900/10 dark:border-amber-900/20">
                            <div className="mt-1">
                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Missing Documentation</h4>
                                <p className="text-xs text-slate-600 mt-1 dark:text-gray-400">Valuation #2048 missing "Auditor Sign-off" for Q3.</p>
                                <button className="text-xs font-bold text-amber-600 mt-2 hover:underline">Request Document →</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
