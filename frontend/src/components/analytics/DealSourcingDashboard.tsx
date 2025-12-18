import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { TransactionRadar } from './TransactionRadar';

interface SectorSignal {
    sector: string;
    avg_ev_ebitda: number;
    percentile_rank: number;
    signal: string;
}

interface DistressedOpportunity {
    ticker: string;
    company_name: string;
    sector: string;
    ev_ebitda: number;
    net_debt_to_ebitda: number;
    interest_coverage: number;
    distress_score: number;
}

export const DealSourcingDashboard: React.FC = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [marketCycles, setMarketCycles] = useState<SectorSignal[]>([]);
    const [opportunities, setOpportunities] = useState<DistressedOpportunity[]>([]);

    const [activeTab, setActiveTab] = useState<'signals' | 'radar'>('signals');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cyclesRes, oppsRes] = await Promise.all([
                fetch(api.url('/api/analytics/market-cycles'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(api.url('/api/analytics/distressed-opportunities'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (cyclesRes.ok) setMarketCycles(await cyclesRes.json());
            if (oppsRes.ok) setOpportunities(await oppsRes.json());
        } catch (error) {
            console.error("Error fetching deal sourcing data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case 'Buy': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
            case 'Sell': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Deal Sourcing Intelligence</h2>
                    <p className="text-gray-500 dark:text-gray-400">Market timing signals and distressed opportunity screener</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('signals')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'signals' ? 'bg-white dark:bg-gray-700 text-system-blue shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            Market Signals
                        </button>
                        <button
                            onClick={() => setActiveTab('radar')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'radar' ? 'bg-white dark:bg-gray-700 text-system-blue shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            Transaction Radar
                        </button>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="glass-button text-gray-600 dark:text-gray-400 hover:text-system-blue dark:hover:text-blue-400"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </div>

            {activeTab === 'signals' ? (
                <>
                    {/* Market Timing Heatmap */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Activity size={20} className="text-system-blue" />
                            Sector Market Timing
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {marketCycles.map((cycle) => (
                                <div key={cycle.sector} className={`p-4 rounded-xl border ${getSignalColor(cycle.signal)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{cycle.sector}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/50 dark:bg-black/20 text-gray-900 dark:text-gray-200`}>
                                            {cycle.signal.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="opacity-70">Avg EV/EBITDA</span>
                                            <span className="font-mono">{cycle.avg_ev_ebitda.toFixed(1)}x</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="opacity-70">Percentile</span>
                                            <span className="font-mono">{cycle.percentile_rank.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    {/* Mini Bar for Percentile */}
                                    <div className="mt-3 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${cycle.signal === 'Buy' ? 'bg-green-500' : cycle.signal === 'Sell' ? 'bg-red-500' : 'bg-gray-500'}`}
                                            style={{ width: `${cycle.percentile_rank}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Distressed Opportunities */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" />
                            Distressed Opportunities Watchlist
                        </h3>
                        <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-white/10">
                                    <tr>
                                        <th className="px-6 py-3">Company</th>
                                        <th className="px-6 py-3">Sector</th>
                                        <th className="px-6 py-3 text-right" title="Enterprise Value / EBITDA">EV/EBITDA</th>
                                        <th className="px-6 py-3 text-right" title="Net Debt / EBITDA (>4x is high risk)">Net Debt / EBITDA</th>
                                        <th className="px-6 py-3 text-right" title="Composite score based on leverage, Z-Score, and growth">Distress Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {opportunities.length > 0 ? (
                                        opportunities.map((opp) => (
                                            <tr key={opp.ticker} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">
                                                    {opp.company_name} <span className="text-gray-400 dark:text-gray-500 font-normal">({opp.ticker})</span>
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{opp.sector}</td>
                                                <td className="px-6 py-3 text-right font-mono text-gray-900 dark:text-gray-200">{opp.ev_ebitda.toFixed(1)}x</td>
                                                <td className="px-6 py-3 text-right font-mono text-red-600 dark:text-red-400 font-medium">
                                                    {opp.net_debt_to_ebitda.toFixed(1)}x
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium text-xs">
                                                        {opp.distress_score}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No distressed opportunities found in watchlist.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <TransactionRadar />
            )}
        </div>
    );
};
