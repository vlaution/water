import React from 'react';

export const DealPipeline: React.FC = () => {
    return (
        <div className="glass-panel p-6 border-t-4 border-t-purple-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-bold text-slate-900 dark:text-white">Deal Pipeline Tracker</h3>
                <button className="text-xs font-bold text-purple-600 border border-purple-200 px-3 py-1 rounded-full hover:bg-purple-50 transition-colors uppercase tracking-wider">
                    + New Opportunity
                </button>
            </div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-white/10 -translate-y-1/2 rounded-full"></div>

                <div className="grid grid-cols-4 gap-4 relative">
                    {/* Stage 1: Identification */}
                    <div className="relative group">
                        <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-white dark:border-gray-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg z-10 group-hover:scale-125 transition-transform"></div>
                        <div className="mt-8 p-3 bg-white/50 dark:bg-white/5 border border-purple-100 dark:border-purple-900/30 rounded-lg hover:shadow-md transition-all text-center">
                            <h4 className="font-bold text-xs text-purple-700 uppercase tracking-wider mb-1">Identified</h4>
                            <p className="font-serif font-bold text-slate-900 dark:text-white">Project Alpha</p>
                            <span className="text-[10px] text-slate-500">$500M Opp</span>
                        </div>
                    </div>

                    {/* Stage 2: Due Diligence */}
                    <div className="relative group">
                        <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-white dark:border-gray-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg z-10 group-hover:scale-125 transition-transform"></div>
                        <div className="mt-8 p-3 bg-white/50 dark:bg-white/5 border border-purple-100 dark:border-purple-900/30 rounded-lg hover:shadow-md transition-all text-center">
                            <h4 className="font-bold text-xs text-purple-700 uppercase tracking-wider mb-1">Due Diligence</h4>
                            <p className="font-serif font-bold text-slate-900 dark:text-white">TechFlow Inc.</p>
                            <span className="text-[10px] text-slate-500">Probability: 60%</span>
                        </div>
                        {/* Connecting Active Line */}
                        <div className="absolute top-1/2 right-1/2 w-full h-1 bg-purple-200 -translate-y-1/2 -z-10"></div>
                    </div>

                    {/* Stage 3: Negotiation */}
                    <div className="relative group">
                        <div className="w-4 h-4 rounded-full bg-slate-300 border-4 border-white dark:border-gray-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg z-10"></div>
                        <div className="mb-14 p-3 bg-slate-50/50 dark:bg-white/5 border border-slate-100 rounded-lg hover:shadow-md transition-all text-center opacity-70">
                            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">Negotiation</h4>
                            <p className="font-serif font-bold text-slate-400 italic">Pending</p>
                        </div>
                    </div>

                    {/* Stage 4: Closed */}
                    <div className="relative group">
                        <div className="w-4 h-4 rounded-full bg-slate-300 border-4 border-white dark:border-gray-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg z-10"></div>
                        <div className="mb-14 p-3 bg-slate-50/50 dark:bg-white/5 border border-slate-100 rounded-lg hover:shadow-md transition-all text-center opacity-70">
                            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">Closed</h4>
                            <p className="font-serif font-bold text-slate-400 italic">--</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-between items-center px-4 py-2 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300">Expected Value Creation</span>
                <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">+$1.2B</span>
            </div>
        </div>
    );
};
