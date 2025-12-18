import React, { useState } from 'react';
import { PortfolioHeatmap } from '../components/executive/PortfolioHeatmap';
import { DealPipeline } from '../components/executive/DealPipeline';

export const PartnerDashboard: React.FC = () => {
    const [generatingReport, setGeneratingReport] = useState(false);

    const handleGenerateReport = () => {
        setGeneratingReport(true);
        // Mock generation
        setTimeout(() => setGeneratingReport(false), 2000);
    };

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
                        Executive Command Center
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-bold tracking-widest uppercase">System Status: Optimal</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="glass-button bg-white/80 border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-all duration-300 text-xs font-bold tracking-widest uppercase shadow-sm">
                        Compliance Audit
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        className={`glass - button - primary bg - gradient - to - r from - slate - 900 to - slate - 800 hover: from - black hover: to - gray - 900 shadow - xl shadow - slate - 900 / 20 text - xs font - bold tracking - widest uppercase border border - slate - 700 flex items - center gap - 2 ${generatingReport ? 'opacity-80 cursor-wait' : ''} `}
                    >
                        {generatingReport ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            'Prepare Board Update'
                        )}
                    </button>
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Value */}
                <div className="glass-panel p-6 border-t-4 border-t-amber-500">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Portfolio Value</p>
                    <h3 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">$4.2 B</h3>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full">+18% YoY</span>
                    </div>
                </div>

                {/* Portfolio Health */}
                <div className="glass-panel p-6 border-t-4 border-t-emerald-500">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Portfolio Health Score</p>
                    <h3 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">87%</h3>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs font-bold text-emerald-600">Stable</span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden ml-2">
                            <div className="h-full bg-emerald-500 w-[87%]"></div>
                        </div>
                    </div>
                </div>

                {/* Deal Readiness */}
                <div className="glass-panel p-6 border-t-4 border-t-purple-500">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Deal Readiness Index</p>
                    <h3 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">92%</h3>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-1 rounded-full">High Capability</span>
                    </div>
                </div>
            </div>

            {/* Row 2: Heatmap & Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                <div className="lg:col-span-2">
                    <PortfolioHeatmap />
                </div>
                <div className="lg:col-span-1">
                    <DealPipeline />
                </div>
            </div>

            {/* Row 3: Strategic Alerts & Value Creation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Strategic Alerts */}
                <div className="glass-panel p-8 space-y-6 bg-white/40 dark:bg-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Strategic Alerts</h2>
                        <div className="flex items-center gap-1.5 ">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-red-600 uppercase">Live Updates</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg dark:bg-red-900/10 dark:border-red-900/20 flex gap-4">
                            <span className="text-2xl">📉</span>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">EBITDA Decline Detected</h4>
                                <p className="text-xs text-slate-600 mt-1">Company D margins declining for 3 consecutive quarters.</p>
                                <button className="text-[10px] font-bold text-red-600 mt-2 uppercase hover:underline">View Analysis →</button>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg dark:bg-emerald-900/10 dark:border-emerald-900/20 flex gap-4">
                            <span className="text-2xl">🎯</span>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Acquisition Target Identified</h4>
                                <p className="text-xs text-slate-600 mt-1">Company A Synergies match: +$500M opportunity.</p>
                                <button className="text-[10px] font-bold text-emerald-600 mt-2 uppercase hover:underline">View Deal Profile →</button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg dark:bg-white/5 dark:border-white/10 flex gap-4 opacity-75">
                            <span className="text-2xl">📊</span>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Sector Multiples Compressed</h4>
                                <p className="text-xs text-slate-600 mt-1">Market sentiment shift: -15% valuation impact.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quarterly Value Creation */}
                <div className="glass-panel p-8 space-y-6">
                    <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white mb-4">Quarterly Value Creation</h2>
                    <div className="h-64 flex items-end justify-between gap-2 p-4 border-b border-l border-slate-200 dark:border-gray-700/50">
                        {/* Bars */}
                        <div className="w-1/4 bg-slate-200 dark:bg-gray-700/50 rounded-t-sm h-[40%] relative group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">+$420M</div>
                            <div className="absolute bottom-0 w-full bg-slate-300 dark:bg-gray-600 h-0 group-hover:h-full transition-all duration-500"></div>
                        </div>
                        <div className="w-1/4 bg-slate-200 dark:bg-gray-700/50 rounded-t-sm h-[30%] relative group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">+$310M</div>
                            <div className="absolute bottom-0 w-full bg-slate-300 dark:bg-gray-600 h-0 group-hover:h-full transition-all duration-500"></div>
                        </div>
                        <div className="w-1/4 bg-slate-200 dark:bg-gray-700/50 rounded-t-sm h-[20%] relative group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">+$180M</div>
                            <div className="absolute bottom-0 w-full bg-slate-300 dark:bg-gray-600 h-0 group-hover:h-full transition-all duration-500"></div>
                        </div>
                        <div className="w-1/4 bg-amber-400 dark:bg-amber-600 rounded-t-sm h-[55%] relative shadow-[0_0_15px_rgba(251,191,36,0.3)] group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-amber-600">+$550M</div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Projected</div>
                            <div className="absolute bottom-0 w-full bg-amber-300 dark:bg-amber-500 h-0 group-hover:h-full transition-all duration-500"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
                        <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4 (Est)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

