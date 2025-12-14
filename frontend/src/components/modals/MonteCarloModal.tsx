import React, { useState } from 'react';
import { X, Play, BarChart2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonteCarloModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseData?: {
        revenue: number;
        ebitda: number;
        enterpriseValue: number;
    };
    lboData?: any; // Start parsing strictly if we have the type
}

interface VariableConfig {
    enabled: boolean;
    mean: number;
    stdDev: number;
}

export const MonteCarloModal: React.FC<MonteCarloModalProps> = ({ isOpen, onClose, baseData, lboData }) => {
    const [step, setStep] = useState<'config' | 'results'>('config');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const isLBO = !!lboData;

    const [config, setConfig] = useState<{
        growth: VariableConfig;
        margin: VariableConfig;
        wacc: VariableConfig;
        iterations: number;
    }>({
        growth: { enabled: true, mean: 5.0, stdDev: 1.0 },
        margin: { enabled: true, mean: 20.0, stdDev: 2.0 },
        wacc: { enabled: true, mean: 10.0, stdDev: 1.0 },
        iterations: 1000
    });

    const handleRunSimulation = async () => {
        setLoading(true);
        try {
            if (isLBO) {
                // LBO Mode
                const payload = { ...lboData, iterations: config.iterations };
                // Note: We are using the backend's internal randomization (20% growth var, 10% margin var) 
                // rather than the fine-grained controls here for simplicity in this phase.

                const response = await fetch('http://localhost:8000/api/monte-carlo/lbo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                    setStep('results');
                }
            } else if (baseData) {
                // Standard EV Mode
                const variables = [];
                if (config.growth.enabled) {
                    variables.push({
                        name: "revenue_growth",
                        distribution: "normal",
                        params: { mean: config.growth.mean / 100, std_dev: config.growth.stdDev / 100 }
                    });
                }
                if (config.margin.enabled) {
                    variables.push({
                        name: "ebitda_margin",
                        distribution: "normal",
                        params: { mean: config.margin.mean / 100, std_dev: config.margin.stdDev / 100 }
                    });
                }
                if (config.wacc.enabled) {
                    variables.push({
                        name: "wacc",
                        distribution: "normal",
                        params: { mean: config.wacc.mean / 100, std_dev: config.wacc.stdDev / 100 }
                    });
                }

                const payload = {
                    base_enterprise_value: baseData.enterpriseValue,
                    base_revenue: baseData.revenue,
                    base_ebitda: baseData.ebitda,
                    iterations: config.iterations,
                    variables: variables
                };

                const response = await fetch('http://localhost:8000/api/monte-carlo/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                    setStep('results');
                }
            }
        } catch (error) {
            console.error("Simulation failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{isLBO ? 'LBO Monte Carlo' : 'Monte Carlo Simulation'}</h2>
                            <p className="text-sm text-gray-500">
                                {isLBO ? 'Simulate IRR probabilities based on volatility' : 'Risk Analysis & Outcome Distribution'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {step === 'config' ? (
                        <div className="space-y-8">
                            {/* Only show variable config for Standard mode for now */}
                            {!isLBO && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Growth Config */}
                                    <div className={`p-6 rounded-xl border-2 transition-all ${config.growth.enabled ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 opacity-60'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-gray-900">Revenue Growth</h3>
                                            <input
                                                type="checkbox"
                                                checked={config.growth.enabled}
                                                onChange={(e) => setConfig({ ...config, growth: { ...config.growth, enabled: e.target.checked } })}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Mean (%)</label>
                                                <input
                                                    type="number"
                                                    value={config.growth.mean}
                                                    onChange={(e) => setConfig({ ...config, growth: { ...config.growth, mean: parseFloat(e.target.value) } })}
                                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Std Dev (%)</label>
                                                <input
                                                    type="number"
                                                    value={config.growth.stdDev}
                                                    onChange={(e) => setConfig({ ...config, growth: { ...config.growth, stdDev: parseFloat(e.target.value) } })}
                                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Margin Config */}
                                    <div className={`p-6 rounded-xl border-2 transition-all ${config.margin.enabled ? 'border-green-500 bg-green-50/30' : 'border-gray-200 opacity-60'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-gray-900">EBITDA Margin</h3>
                                            <input
                                                type="checkbox"
                                                checked={config.margin.enabled}
                                                onChange={(e) => setConfig({ ...config, margin: { ...config.margin, enabled: e.target.checked } })}
                                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Mean (%)</label>
                                                <input
                                                    type="number"
                                                    value={config.margin.mean}
                                                    onChange={(e) => setConfig({ ...config, margin: { ...config.margin, mean: parseFloat(e.target.value) } })}
                                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Std Dev (%)</label>
                                                <input
                                                    type="number"
                                                    value={config.margin.stdDev}
                                                    onChange={(e) => setConfig({ ...config, margin: { ...config.margin, stdDev: parseFloat(e.target.value) } })}
                                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* WACC Config */}
                                    <div className={`p-6 rounded-xl border-2 transition-all ${config.wacc.enabled ? 'border-purple-500 bg-purple-50/30' : 'border-gray-200 opacity-60'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-gray-900">WACC</h3>
                                            <input
                                                type="checkbox"
                                                checked={config.wacc.enabled}
                                                onChange={(e) => setConfig({ ...config, wacc: { ...config.wacc, enabled: e.target.checked } })}
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Mean (%)</label>
                                                <input
                                                    type="number"
                                                    value={config.wacc.mean}
                                                    onChange={(e) => setConfig({ ...config, wacc: { ...config.wacc, mean: parseFloat(e.target.value) } })}
                                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Std Dev (%)</label>
                                                <input
                                                    type="number"
                                                    value={config.wacc.stdDev}
                                                    onChange={(e) => setConfig({ ...config, wacc: { ...config.wacc, stdDev: parseFloat(e.target.value) } })}
                                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isLBO && (
                                <div className="text-center p-8 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Run Analysis</h3>
                                    <p className="text-blue-700 max-w-lg mx-auto">
                                        The simulation will run {config.iterations} iterations with standard market volatility assumptions:
                                        <br />• Revenue Growth: ±20% variability
                                        <br />• EBITDA Margin: ±10% variability
                                        <br />• Exit Multiple: ±1.0x standard deviation
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={handleRunSimulation}
                                    disabled={loading}
                                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <Play className="w-6 h-6" />
                                    )}
                                    <span className="text-lg font-semibold">Run Simulation ({config.iterations} Iterations)</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-4 gap-4">
                                {isLBO ? (
                                    <>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <p className="text-sm text-gray-500">Mean IRR</p>
                                            <p className="text-2xl font-bold text-gray-900">{(results.mean_irr * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <p className="text-sm text-gray-500">Success Probability</p>
                                            <p className="text-2xl font-bold text-blue-600">{(results.probability_success * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                            <p className="text-sm text-red-600">P5 IRR (Downside)</p>
                                            <p className="text-2xl font-bold text-red-700">{(results.percentiles.p5 * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-sm text-green-600">P95 IRR (Upside)</p>
                                            <p className="text-2xl font-bold text-green-700">{(results.percentiles.p95 * 100).toFixed(1)}%</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <p className="text-sm text-gray-500">Mean Value</p>
                                            <p className="text-2xl font-bold text-gray-900">${(results.statistics.mean / 1e6).toFixed(1)}M</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <p className="text-sm text-gray-500">Median</p>
                                            <p className="text-2xl font-bold text-gray-900">${(results.statistics.median / 1e6).toFixed(1)}M</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                            <p className="text-sm text-red-600">P10 (Bear Case)</p>
                                            <p className="text-2xl font-bold text-red-700">${(results.statistics.p10 / 1e6).toFixed(1)}M</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-sm text-green-600">P90 (Bull Case)</p>
                                            <p className="text-2xl font-bold text-green-700">${(results.statistics.p90 / 1e6).toFixed(1)}M</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chart */}
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={isLBO
                                        ? results.distribution.counts.map((count: number, i: number) => ({
                                            range_start: (results.distribution.bins[i] * 100).toFixed(1),
                                            frequency: count
                                        }))
                                        : results.histogram
                                    }>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="range_start"
                                            tickFormatter={(val) => isLBO ? `${val}%` : `$${(Number(val) / 1e6).toFixed(0)}M`}
                                            label={{ value: isLBO ? 'IRR %' : 'Enterprise Value', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip
                                            formatter={(value: number) => [value, 'Frequency']}
                                            labelFormatter={(label: number) => isLBO ? `IRR > ${label}%` : `Valuation > $${(label / 1e6).toFixed(1)}M`}
                                        />
                                        <Bar dataKey="frequency" fill={isLBO ? "#8b5cf6" : "#3b82f6"} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={() => setStep('config')}
                                    className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Adjust Parameters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
