import React, { useState, useEffect } from 'react';
import { api } from '../config/api';

interface BenchmarkDashboardProps {
    ticker: string;
    token: string | null;
}

interface Comparison {
    metric: string;
    target_value: number;
    peer_average: number;
    percentile: number;
    status: string;
}

interface BenchmarkData {
    target: any;
    peer_avg: any;
    comparisons: Comparison[];
    peers_used: string[];
}

interface TransactionComp {
    date: string;
    target: string;
    acquirer: string;
    deal_size_mm: number;
    ev_ebitda: number;
    sector: string;
}

export const BenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({ ticker, token }) => {
    const [data, setData] = useState<BenchmarkData | null>(null);
    const [loading, setLoading] = useState(false);
    const [peers, setPeers] = useState<string>(""); // Comma separated
    const [useSector, setUseSector] = useState(true);
    const [transactionComps, setTransactionComps] = useState<TransactionComp[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const peerList = peers.split(',').map(p => p.trim()).filter(p => p);
            const res = await fetch(api.url('/api/benchmark'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ticker: ticker,
                    peer_tickers: peerList.length > 0 ? peerList : null,
                    use_sector_average: useSector
                })
            });

            if (res.ok) {
                const result = await res.json();
                setData(result);

                // Fetch transaction comps if sector is available
                if (result.target && result.target.sector) {
                    fetchTransactionComps(result.target.sector);
                }
            }
        } catch (error) {
            console.error("Failed to fetch benchmark data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionComps = async (sector: string) => {
        try {
            const res = await fetch(api.url(`/api/benchmark/transactions/${encodeURIComponent(sector)}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTransactionComps(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch transaction comps", error);
        }
    };

    useEffect(() => {
        if (ticker) {
            fetchData();
        }
    }, [ticker]);

    if (loading && !data) {
        return <div className="p-6 text-center">Loading Benchmarks...</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">Benchmarking: {ticker}</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Add peers (e.g. MSFT, GOOGL)"
                            className="border rounded px-3 py-1 text-sm w-64"
                            value={peers}
                            onChange={(e) => setPeers(e.target.value)}
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={useSector}
                                onChange={(e) => setUseSector(e.target.checked)}
                            />
                            Auto-Sector Peers
                        </label>
                        <button
                            onClick={fetchData}
                            className="bg-system-blue text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                            Update
                        </button>
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    Comparing against {data.peers_used.length} peers: {data.peers_used.join(', ')}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Comparison Table */}
                <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Financial Comparison</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Metric</th>
                                <th className="px-4 py-3 text-right">{ticker}</th>
                                <th className="px-4 py-3 text-right">Peer Avg</th>
                                <th className="px-4 py-3 text-right">Diff</th>
                                <th className="px-4 py-3 text-center">Percentile</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.comparisons.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.metric}</td>
                                    <td className="px-4 py-3 text-right font-mono">
                                        {formatValue(item.metric, item.target_value)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-500">
                                        {formatValue(item.metric, item.peer_average)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-system-blue rounded-full"
                                                    style={{ width: `${item.percentile}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 w-8 text-right">
                                                {Math.round(item.percentile)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Quick Stats / Visuals */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">Strengths</h3>
                        <div className="space-y-2">
                            {data.comparisons.filter(c => c.status === "Above Average").map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-green-700 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    {c.metric} ({Math.round(c.percentile)}th percentile)
                                </div>
                            ))}
                            {data.comparisons.filter(c => c.status === "Above Average").length === 0 && (
                                <p className="text-gray-400 text-sm">No clear strengths identified relative to peers.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">Weaknesses</h3>
                        <div className="space-y-2">
                            {data.comparisons.filter(c => c.status === "Below Average").map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-red-700 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    {c.metric} ({Math.round(c.percentile)}th percentile)
                                </div>
                            ))}
                            {data.comparisons.filter(c => c.status === "Below Average").length === 0 && (
                                <p className="text-gray-400 text-sm">No clear weaknesses identified relative to peers.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Comps */}
            {transactionComps.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Recent Transaction Comparables ({transactionComps[0].sector})</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Target</th>
                                <th className="px-4 py-3">Acquirer</th>
                                <th className="px-4 py-3 text-right">Deal Size ($M)</th>
                                <th className="px-4 py-3 text-right">EV/EBITDA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactionComps.map((deal, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">{deal.date}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{deal.target}</td>
                                    <td className="px-4 py-3 text-gray-600">{deal.acquirer}</td>
                                    <td className="px-4 py-3 text-right font-mono">${deal.deal_size_mm.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-mono">{deal.ev_ebitda.toFixed(1)}x</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

function formatValue(metric: string, value: number): string {
    if (value === null || value === undefined) return "-";
    if (metric.includes("Margin") || metric.includes("ROE") || metric.includes("Growth")) {
        return `${(value * 100).toFixed(1)}%`;
    }
    if (metric.includes("Ratio") || metric.includes("Turnover") || metric.includes("Debt")) {
        return value.toFixed(2) + "x";
    }
    return value.toLocaleString();
}

function getStatusColor(status: string): string {
    if (status === "Above Average") return "bg-green-100 text-green-800";
    if (status === "Below Average") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
}
