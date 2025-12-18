import React, { useState } from 'react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, TrendingUp, DollarSign, PieChart } from 'lucide-react';
import initWasm, { run_fund_simulation } from "@wasm/wasm_engine";

interface FundModel {
    name: string;
    vintage_year: number;
    committed_capital: number;
    management_fee: number;
    carried_interest: number;
    hurdle_rate: number;
    fund_term_years: number;
    investment_period_years: number;
}

interface FundStrategy {
    target_deal_count: number;
    min_deal_size: number;
    max_deal_size: number;
    target_sectors: string[];
    target_irr_mean: number;
    target_irr_std_dev: number;
    hold_period_mean: number;
    hold_period_std_dev: number;
}

export const FundSimulator: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const [fund, setFund] = useState<FundModel>({
        name: "Water Capital Fund I",
        vintage_year: 2024,
        committed_capital: 500000000, // 500M
        management_fee: 0.02,
        carried_interest: 0.20,
        hurdle_rate: 0.08,
        fund_term_years: 10,
        investment_period_years: 5
    });

    const [strategy, setStrategy] = useState<FundStrategy>({
        target_deal_count: 10,
        min_deal_size: 20000000,
        max_deal_size: 100000000,
        target_sectors: ["Technology", "Healthcare"],
        target_irr_mean: 0.25,
        target_irr_std_dev: 0.10,
        hold_period_mean: 5,
        hold_period_std_dev: 1
    });

    const runSimulation = async () => {
        setLoading(true);
        try {
            // Ensure WASM is initialized
            await initWasm();
            // Run simulation using Rust WASM engine (Client-side)
            const data = run_fund_simulation(fund, strategy);
            setResults(data);
        } catch (error) {
            console.error(error);
            alert("Failed to run simulation");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(val);

    const formatPercent = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(val);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">LBO Fund Simulator</h2>
                    <p className="text-gray-500 dark:text-gray-400">Monte Carlo simulation of fund-level returns</p>
                </div>
                <button
                    onClick={runSimulation}
                    disabled={loading}
                    className="glass-button bg-system-blue text-white hover:bg-blue-600 flex items-center gap-2"
                >
                    {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div> : <Play size={16} />}
                    Run Simulation
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <DollarSign size={18} className="text-gray-400" />
                            Fund Parameters
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Committed Capital</label>
                                <input
                                    type="number"
                                    value={fund.committed_capital}
                                    onChange={e => setFund({ ...fund, committed_capital: parseFloat(e.target.value) })}
                                    className="glass-input w-full dark:bg-black/20 dark:text-gray-200 dark:border-white/10"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mgmt Fee</label>
                                    <input
                                        type="number" step="0.005"
                                        value={fund.management_fee}
                                        onChange={e => setFund({ ...fund, management_fee: parseFloat(e.target.value) })}
                                        className="glass-input w-full dark:bg-black/20 dark:text-gray-200 dark:border-white/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Carry</label>
                                    <input
                                        type="number" step="0.05"
                                        value={fund.carried_interest}
                                        onChange={e => setFund({ ...fund, carried_interest: parseFloat(e.target.value) })}
                                        className="glass-input w-full dark:bg-black/20 dark:text-gray-200 dark:border-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <PieChart size={18} className="text-gray-400" />
                            Strategy
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Target Deal Count</label>
                                <input
                                    type="number"
                                    value={strategy.target_deal_count}
                                    onChange={e => setStrategy({ ...strategy, target_deal_count: parseInt(e.target.value) })}
                                    className="glass-input w-full dark:bg-black/20 dark:text-gray-200 dark:border-white/10"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Target IRR (Mean)</label>
                                <input
                                    type="number" step="0.01"
                                    value={strategy.target_irr_mean}
                                    onChange={e => setStrategy({ ...strategy, target_irr_mean: parseFloat(e.target.value) })}
                                    className="glass-input w-full dark:bg-black/20 dark:text-gray-200 dark:border-white/10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-6">
                    {results ? (
                        <div className="space-y-6 print:space-y-4">
                            <div className="flex justify-between items-center print:hidden">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Simulation Results</h3>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-400 rounded-sm"></div>
                                    Export Report
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-4 print:grid-cols-4">
                                <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 print:border-gray-300">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net IRR</div>
                                    <div className="text-2xl font-bold text-system-blue dark:text-blue-400">
                                        {formatPercent(results.net_irr)}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 print:border-gray-300">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">MOIC</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {results.moic.toFixed(2)}x
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 print:border-gray-300">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">DPI</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {results.dpi.toFixed(2)}x
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 print:border-gray-300">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">TVPI</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {results.tvpi.toFixed(2)}x
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 print:border-gray-300 print:break-inside-avoid">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Cash Flow Profile</h4>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={results.cash_flows}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="year" stroke="#9ca3af" />
                                            <YAxis tickFormatter={formatCurrency} stroke="#9ca3af" />
                                            <Tooltip
                                                formatter={(val: number) => formatCurrency(val)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="amount" fill="#3b82f6" name="Net Cash Flow" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Print-only Footer */}
                            <div className="hidden print:block text-center text-sm text-gray-400 mt-8">
                                Generated by Water LBO Platform on {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
                            <div className="text-center">
                                <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Run simulation to see results</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 2cm; }
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    /* Hide sidebar and other app elements if they are outside this component */
                    /* Assuming the app layout has specific classes, but we can't target them easily from here without global styles */
                    /* Best effort: hide common interactive elements */
                    button { display: none !important; }
                    input, select { border: none !important; appearance: none !important; }
                }
            `}</style>
        </div>
    );
};
