import React from 'react';

interface CompanyProps {
    name: string;
    change: string;
    status: 'optimal' | 'warning' | 'critical';
    size: 'lg' | 'md' | 'sm';
}

export const PortfolioHeatmap: React.FC = () => {
    const companies: CompanyProps[] = [
        { name: 'Solaris Energy', change: '+25%', status: 'critical', size: 'lg' },
        { name: 'Nexus Tech', change: '+12%', status: 'optimal', size: 'md' },
        { name: 'Vertex', change: '-3%', status: 'warning', size: 'md' },
        { name: 'Horizon', change: '-15%', status: 'critical', size: 'md' },
        { name: 'Zenith', change: '+8%', status: 'optimal', size: 'sm' },
        { name: 'Apex', change: '+4%', status: 'optimal', size: 'sm' },
        { name: 'Novus', change: '-2%', status: 'warning', size: 'sm' },
    ];

    return (
        <div className="glass-panel p-6 border-t-4 border-t-slate-400">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-slate-900 dark:text-white">Portfolio Heatmap</h3>
                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> Growth</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500"></div> Stable</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500"></div> Risk</span>
                </div>
            </div>

            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-64">
                {companies.map((company, i) => (
                    <div
                        key={i}
                        className={`
                            relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                            rounded-lg p-4 flex flex-col justify-between
                            ${company.size === 'lg' ? 'col-span-2 row-span-2' : company.size === 'md' ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1'}
                            ${company.status === 'optimal' ? 'bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' :
                                company.status === 'warning' ? 'bg-amber-50/50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' :
                                    'bg-red-50/50 border border-red-100 dark:bg-red-900/20 dark:border-red-800'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">{company.name}</span>
                            {company.status === 'critical' && <span className="text-lg animate-pulse">🔥</span>}
                            {company.status === 'optimal' && <span className="text-lg">✅</span>}
                            {company.status === 'warning' && <span className="text-lg">⚠️</span>}
                        </div>

                        <div className="mt-auto">
                            <span className={`text-2xl font-mono font-bold tracking-tighter
                                ${company.status === 'optimal' ? 'text-emerald-600' :
                                    company.status === 'warning' ? 'text-amber-600' :
                                        'text-red-600'}
                            `}>
                                {company.change}
                            </span>
                            {company.size === 'lg' && (
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                                    Valuation confidence high. Q4 upgrade projected based on new IP acquisition.
                                </p>
                            )}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <button className="text-xs font-bold uppercase tracking-widest border border-slate-900 px-3 py-1 rounded hover:bg-slate-900 hover:text-white transition-colors">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
