import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { Bell, TrendingUp } from 'lucide-react';

interface TransactionDeal {
    id: string;
    date: string;
    target: string;
    acquirer: string;
    value_mm: number;
    ev_ebitda: number;
    sector: string;
    deal_type: string;
}

interface MarketAlert {
    id: string;
    date: string;
    severity: 'High' | 'Medium' | 'Low';
    title: string;
    description: string;
    related_tickers: string[];
}

export const TransactionRadar: React.FC = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [deals, setDeals] = useState<TransactionDeal[]>([]);
    const [alerts, setAlerts] = useState<MarketAlert[]>([]);
    const [selectedSector, setSelectedSector] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dealsRes, alertsRes] = await Promise.all([
                fetch(api.url(`/api/analytics/transactions/recent${selectedSector ? `?sector=${selectedSector}` : ''}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(api.url('/api/analytics/transactions/alerts'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (dealsRes.ok) setDeals(await dealsRes.json());
            if (alertsRes.ok) setAlerts(await alertsRes.json());
        } catch (error) {
            console.error("Error fetching transaction radar data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedSector]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'High': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
            case 'Medium': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
            case 'Low': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Recent Transactions Column */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <TrendingUp size={20} className="text-system-blue" />
                            Recent M&A Transactions
                        </h3>
                        <div className="flex gap-2">
                            <select
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="text-sm border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">All Sectors</option>
                                <option value="Technology">Technology</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Industrials">Industrials</option>
                                <option value="Consumer">Consumer</option>
                                <option value="Energy">Energy</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-white/10">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Target</th>
                                        <th className="px-4 py-3">Acquirer</th>
                                        <th className="px-4 py-3 text-right">Value ($M)</th>
                                        <th className="px-4 py-3 text-right">EV/EBITDA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : deals.length > 0 ? (
                                        deals.map((deal) => (
                                            <tr key={deal.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{deal.date}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                                    {deal.target}
                                                    <span className="block text-xs text-gray-400 dark:text-gray-500 font-normal">{deal.sector}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{deal.acquirer}</td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">${deal.value_mm.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/40 rounded-lg">
                                                    {deal.ev_ebitda.toFixed(1)}x
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                No transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Market Alerts Column */}
                <div className="w-full md:w-80 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Bell size={20} className="text-orange-500" />
                        Market Alerts
                    </h3>
                    <div className="space-y-3">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white/50 p-4 rounded-xl border border-gray-200 animate-pulse h-24"></div>
                            ))
                        ) : alerts.length > 0 ? (
                            alerts.map((alert) => (
                                <div key={alert.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/60 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">{alert.date}</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">{alert.title}</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                                        {alert.description}
                                    </p>
                                    {alert.related_tickers.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                            {alert.related_tickers.map(t => (
                                                <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm bg-white/30 rounded-xl border border-dashed border-gray-300">
                                No active alerts.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
