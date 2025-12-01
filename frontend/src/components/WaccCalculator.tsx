import React, { useState, useEffect } from 'react';

interface WaccCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (wacc: number) => void;
    initialTicker: string;
}

export const WaccCalculator: React.FC<WaccCalculatorProps> = ({ isOpen, onClose, onApply, initialTicker }) => {
    const [ticker, setTicker] = useState(initialTicker);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState({
        risk_free_rate: 0.045,
        beta: 1.0,
        market_risk_premium: 0.055,
        cost_of_debt: 0.065,
        tax_rate: 0.21,
        equity_weight: 0.60
    });

    const [wacc, setWacc] = useState(0.0);

    useEffect(() => {
        if (isOpen && initialTicker) {
            setTicker(initialTicker);
            fetchMarketData(initialTicker);
        }
    }, [isOpen, initialTicker]);

    useEffect(() => {
        calculateWacc();
    }, [data]);

    const fetchMarketData = async (symbol: string) => {
        if (!symbol) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8000/api/market-data/${symbol}`);
            if (!response.ok) {
                throw new Error('Failed to fetch market data');
            }
            const result = await response.json();
            setData(prev => ({
                ...prev,
                risk_free_rate: result.risk_free_rate,
                beta: result.beta,
                market_risk_premium: result.market_risk_premium,
                cost_of_debt: result.cost_of_debt,
                // Keep existing weights/tax if not provided, or use defaults
            }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateWacc = () => {
        const ke = data.risk_free_rate + data.beta * data.market_risk_premium;
        const kd_after_tax = data.cost_of_debt * (1 - data.tax_rate);
        const w = (data.equity_weight * ke) + ((1 - data.equity_weight) * kd_after_tax);
        setWacc(w);
    };

    const handleApply = () => {
        onApply(parseFloat(wacc.toFixed(4)));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-fade-in-up border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">WACC Calculator</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="Ticker (e.g. IBM)"
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={() => fetchMarketData(ticker)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Fetch'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Risk-Free Rate</label>
                            <input
                                type="number"
                                step="0.001"
                                value={data.risk_free_rate}
                                onChange={(e) => setData({ ...data, risk_free_rate: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Beta</label>
                            <input
                                type="number"
                                step="0.01"
                                value={data.beta}
                                onChange={(e) => setData({ ...data, beta: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Market Risk Premium</label>
                            <input
                                type="number"
                                step="0.001"
                                value={data.market_risk_premium}
                                onChange={(e) => setData({ ...data, market_risk_premium: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Cost of Debt</label>
                            <input
                                type="number"
                                step="0.001"
                                value={data.cost_of_debt}
                                onChange={(e) => setData({ ...data, cost_of_debt: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tax Rate</label>
                            <input
                                type="number"
                                step="0.01"
                                value={data.tax_rate}
                                onChange={(e) => setData({ ...data, tax_rate: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Equity Weight</label>
                            <input
                                type="number"
                                step="0.01"
                                value={data.equity_weight}
                                onChange={(e) => setData({ ...data, equity_weight: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                        <span className="font-medium text-gray-700">Calculated WACC</span>
                        <span className="text-2xl font-bold text-blue-600">{(wacc * 100).toFixed(2)}%</span>
                    </div>

                    <button
                        onClick={handleApply}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Apply to Valuation
                    </button>
                </div>
            </div>
        </div>
    );
};
