export const AdminDashboard: React.FC = () => {

    return (
        <div className="space-y-8 animate-fade-in-up font-sans text-slate-900 dark:text-gray-100">
            {/* Vibrant Turquoise/Cyan Glass Overlay (Restoring "earlier background") */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-100/40 via-blue-50/40 to-white/0 pointer-events-none dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-black/0" />

            {/* Header */}
            <div className="flex justify-between items-end pb-4 border-b border-cyan-500/20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white font-mono uppercase">
                        System Operations Center
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                            <p className="text-cyan-400 text-xs font-mono tracking-wider uppercase">System: Online</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                            <p className="text-emerald-400 text-xs font-mono tracking-wider uppercase">DB: Optimal</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-slate-900 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-950 hover:text-white transition-all text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        View Logs
                    </button>
                    <button className="px-4 py-2 bg-cyan-600 text-white hover:bg-cyan-500 transition-all text-xs font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                        System Config
                    </button>
                </div>
            </div>

            {/* System Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 bg-slate-900/50 border border-cyan-500/30 rounded-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50">
                        <svg className="w-12 h-12 text-cyan-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-cyan-500/70 uppercase mb-1">System Uptime</p>
                    <h3 className="text-3xl font-mono text-white">99.98%</h3>
                    <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full w-[99.98%] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 border border-cyan-500/30 rounded-lg relative overflow-hidden">
                    <p className="text-[10px] font-mono font-bold text-cyan-500/70 uppercase mb-1">Response Time (P95)</p>
                    <h3 className="text-3xl font-mono text-white">142ms</h3>
                    <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[30%]"></div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 border border-cyan-500/30 rounded-lg relative overflow-hidden">
                    <p className="text-[10px] font-mono font-bold text-cyan-500/70 uppercase mb-1">Active Users</p>
                    <h3 className="text-3xl font-mono text-white">47</h3>
                    <p className="text-xs text-cyan-400 mt-2">↑ 3 since last hour</p>
                </div>

                <div className="p-6 bg-slate-900/50 border border-cyan-500/30 rounded-lg relative overflow-hidden">
                    <p className="text-[10px] font-mono font-bold text-cyan-500/70 uppercase mb-1">API Requests/min</p>
                    <h3 className="text-3xl font-mono text-white">1,243</h3>
                    <div className="flex gap-1 h-3 mt-2 items-end">
                        {[40, 60, 45, 70, 50, 80, 65, 90, 75, 60].map((h, i) => (
                            <div key={i} className="flex-1 bg-cyan-500/50 hover:bg-cyan-400" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management */}
                <div className="border border-slate-700 bg-slate-900/50 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <h3 className="font-mono font-bold text-white">User Management</h3>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-900">54/100 Licenses</span>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
                            <p className="text-xs text-slate-400 uppercase mb-1">New Signups (7d)</p>
                            <p className="text-2xl font-mono text-white">12</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
                            <p className="text-xs text-slate-400 uppercase mb-1">Support Tickets</p>
                            <p className="text-2xl font-mono text-white">3</p>
                        </div>
                        <div className="col-span-2">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="py-2 font-mono">User</th>
                                        <th className="py-2 font-mono">Role</th>
                                        <th className="py-2 font-mono text-right">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <tr className="hover:bg-slate-800/50 cursor-pointer">
                                        <td className="py-2 text-white">alex.chen@firm.com</td>
                                        <td><span className="text-xs bg-slate-700 text-slate-300 px-1 py-0.5 rounded">Analyst</span></td>
                                        <td className="py-2 text-right font-mono text-emerald-400">Now</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/50 cursor-pointer">
                                        <td className="py-2 text-white">sarah.v@firm.com</td>
                                        <td><span className="text-xs bg-indigo-900 text-indigo-300 px-1 py-0.5 rounded">Associate</span></td>
                                        <td className="py-2 text-right font-mono">5m ago</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/50 cursor-pointer">
                                        <td className="py-2 text-white">m.ross@firm.com</td>
                                        <td><span className="text-xs bg-amber-900 text-amber-300 px-1 py-0.5 rounded">Partner</span></td>
                                        <td className="py-2 text-right font-mono">12m ago</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Integration Status */}
                <div className="border border-slate-700 bg-slate-900/50 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                        <h3 className="font-mono font-bold text-white">Integration Matrix</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">Market Data Feed</h4>
                                    <p className="text-xs text-slate-500">Bloomberg API • 52ms latency</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-emerald-400">CONNECTED</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">CRM Sync</h4>
                                    <p className="text-xs text-slate-500">Salesforce • Syncing batch 429</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-blue-400">SYNCING</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">Cloud Storage</h4>
                                    <p className="text-xs text-slate-500">AWS S3 • us-east-1</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-emerald-400">HEALTHY</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-400">Legacy ERP</h4>
                                    <p className="text-xs text-slate-600">Migration scheduled</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-slate-500">OFFLINE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
