import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, DollarSign, Shield } from 'lucide-react';

interface DebtConditions {
    senior_rate: number;
    mezzanine_rate: number;
    high_yield_rate: number;
    pik_percent: number;
    leverage_limit: number;
    interest_coverage_min: number;
    cash_sweep_percent: number;
}

export const DebtMarketDashboard: React.FC = () => {
    const [conditions, setConditions] = useState<DebtConditions | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [condRes, histRes] = await Promise.all([
                    fetch(api.url('/api/analytics/debt-market')),
                    fetch(api.url('/api/analytics/debt-market/history'))
                ]);

                if (condRes.ok) setConditions(await condRes.json());
                if (histRes.ok) setHistory(await histRes.json());
            } catch (error) {
                console.error("Failed to fetch debt market data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Market Data...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Live Debt Markets</h2>
                    <p className="text-gray-500">Real-time financing conditions and covenant trends</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <Activity size={16} />
                    Live Updates Active
                </div>
            </div>

            {/* Rate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Senior Debt (SOFR+)</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{conditions?.senior_rate}%</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">Spread: ~275 bps</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Mezzanine</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{conditions?.mezzanine_rate}%</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">Includes {conditions?.pik_percent}% PIK</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">High Yield</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{conditions?.high_yield_rate}%</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">Unsecured Notes</div>
                </div>
            </div>

            {/* Charts & Covenants */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">30-Day Rate Trend (Senior)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="day" hide />
                                <YAxis domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#2563EB"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Covenants */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Shield size={18} className="text-gray-400" />
                        Standard Covenants
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Max Leverage (Total/EBITDA)</span>
                                <span className="font-medium text-gray-900">{conditions?.leverage_limit}x</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Min Interest Coverage</span>
                                <span className="font-medium text-gray-900">{conditions?.interest_coverage_min}x</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Cash Sweep</span>
                                <span className="font-medium text-gray-900">{conditions?.cash_sweep_percent}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
                            Market conditions are updated every 15 minutes based on aggregated lender quotes and index movements.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
