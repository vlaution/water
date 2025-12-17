import React from 'react';
import { useAuth } from '../context/AuthContext';

export const AssociateDashboard: React.FC = () => {
    const { user } = useAuth();

    // Mock Data for "Quality Control Center"
    const pendingReviews = [
        { id: '1', company: 'Startup XYZ', analyst: 'John Doe', status: 'High Risk', flags: 3, riskScore: 'High', due: 'Today' },
        { id: '2', company: 'Company kmABC', analyst: 'Jane Smith', status: 'Review Pending', flags: 0, riskScore: 'Low', due: 'Today' },
        { id: '3', company: 'Corp 123', analyst: 'Mike Jones', status: 'Review Pending', flags: 1, riskScore: 'Medium', due: 'Tomorrow' },
    ];

    const teamPerformance = [
        { name: 'John Doe', valuations: 12, accuracy: 92 },
        { name: 'Jane Smith', valuations: 15, accuracy: 98 },
        { name: 'Mike Jones', valuations: 8, accuracy: 88 },
    ];

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                        Quality Control Center
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Senior Analyst Dashboard • {user?.name}</p>
                </div>
                <div className="flex gap-3">
                    <button className="glass-button bg-amber-50/50 text-amber-900 border-amber-200/50 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50 shadow-sm hover:shadow-amber-500/10 transition-all duration-300">
                        Batch Review (3)
                    </button>
                    <button className="glass-button-primary bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 dark:from-amber-700 dark:to-amber-600 shadow-lg shadow-amber-500/30">
                        Create Template
                    </button>
                </div>
            </div>

            {/* Top Stats - Team Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:shadow-red-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-all duration-500"></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Pending Review</p>
                        <h3 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">5</h3>
                        <p className="text-xs text-red-500 mt-1 font-bold bg-red-50 px-2 py-0.5 rounded-full inline-block border border-red-100">2 Overdue</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100/50 text-red-500 flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>

                <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:shadow-emerald-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-all duration-500"></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Avg Completion</p>
                        <h3 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">3.2d</h3>
                        <p className="text-xs text-emerald-600 mt-1 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-100">↓ 12% vs last week</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 text-emerald-500 flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                </div>

                <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:shadow-blue-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all duration-500"></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Accuracy Score</p>
                        <h3 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">94%</h3>
                        <p className="text-xs text-blue-600 mt-1 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block border border-blue-100">Top 5% Industry</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100/50 text-blue-500 flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Review Queue */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse"></div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                            Review Queue (Priority)
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {pendingReviews.map((item) => (
                            <div key={item.id} className="glass-panel p-5 flex items-center justify-between hover:bg-white/80 transition-all duration-300 cursor-pointer group border-l-4 border-l-transparent hover:border-l-amber-500 hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/0 via-amber-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${item.riskScore === 'High'
                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                            : 'bg-gray-50 text-gray-600 border border-gray-200'
                                        }`}>
                                        {item.riskScore === 'High' ? '!!!' : 'Val'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors flex items-center gap-2 text-lg">
                                            {item.company}
                                            {item.flags > 0 && (
                                                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-extrabold uppercase tracking-wider border border-red-200/50">
                                                    {item.flags} Flags
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                                            <span>Analyst: <span className="font-medium text-gray-700">{item.analyst}</span></span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span>Due: <span className={`${item.due === 'Today' ? 'text-amber-600 font-bold' : ''}`}>{item.due}</span></span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-sm ${item.status === 'High Risk'
                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                        {item.status}
                                    </span>
                                    <button className="w-8 h-8 rounded-full bg-gray-50 hover:bg-amber-100 text-gray-400 hover:text-amber-600 flex items-center justify-center transition-colors">
                                        →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team & Client Side */}
                <div className="space-y-6">
                    {/* Team Performance Mini-Table */}
                    <div className="glass-panel p-6">
                        <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider text-gray-400">Team Performance</h3>
                        <div className="space-y-4">
                            {teamPerformance.map((member, i) => (
                                <div key={i} className="flex items-center justify-between text-sm group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-600 group-hover:scale-110 transition-transform">
                                            {member.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-700 group-hover:text-amber-600 transition-colors">{member.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-400 font-medium">Volume</span>
                                            <span className="text-gray-900 font-semibold">{member.valuations}</span>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100"></div>
                                        <div className="flex flex-col items-end w-12">
                                            <span className="text-xs text-gray-400 font-medium">Acc</span>
                                            <span className={`font-bold ${member.accuracy >= 95 ? 'text-emerald-600' : 'text-gray-700'}`}>
                                                {member.accuracy}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Client Deliverables */}
                    <div className="bg-gradient-to-br from-slate-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all duration-700"></div>

                        <div className="relative z-10">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-amber-400 uppercase tracking-widest text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                                Client Deliverables
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold leading-tight">
                                        <span className="text-[10px] opacity-70">DEC</span>
                                        <span className="text-lg">17</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white leading-tight">Tesla LBO Deck</h4>
                                        <p className="text-xs text-gray-400 mt-1">Due by 5:00 PM EST</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-3 rounded-xl bg-transparent border border-transparent hover:bg-white/5 transition-colors cursor-pointer opacity-70 hover:opacity-100">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600/30 font-bold leading-tight">
                                        <span className="text-[10px] opacity-70">DEC</span>
                                        <span className="text-lg">20</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-200 leading-tight">Q4 Review (J.Doe)</h4>
                                        <p className="text-xs text-gray-500 mt-1">Drafting Phase</p>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-5 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 transition-colors border border-white/5 hover:border-white/20">
                                Open Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
