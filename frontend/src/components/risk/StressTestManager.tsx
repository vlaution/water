import React, { useEffect, useState } from 'react';
import { apiFetch, api } from '../../config/api';

interface StressScenario {
    name: string;
    description: string;
    shocks: Record<string, number>;
}

interface StressTestResult {
    scenario_name: string;
    company_name: string;
    base_value: number;
    stressed_value: number;
    change_percent: number;
}

interface PortfolioStressResponse {
    scenario: string;
    total_base_value: number;
    total_stressed_value: number;
    total_change_percent: number;
    company_results: StressTestResult[];
}

export const StressTestManager: React.FC = () => {
    const [scenarios, setScenarios] = useState<StressScenario[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<string>('');
    const [results, setResults] = useState<PortfolioStressResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchScenarios();
    }, []);

    const fetchScenarios = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await apiFetch(api.endpoints.risk.stress.scenarios, {}, token);
            if (response.ok) {
                const data = await response.json();
                setScenarios(data);
                if (data.length > 0) setSelectedScenario(data[0].name);
            }
        } catch (err) {
            console.error("Failed to fetch scenarios", err);
        }
    };

    const runStressTest = async () => {
        if (!selectedScenario) return;
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await apiFetch(api.endpoints.risk.stress.run(selectedScenario), {
                method: 'POST'
            }, token);

            if (!response.ok) throw new Error('Stress test failed');

            const data = await response.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(val);
    };

    const formatPercent = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(val);
    };

    return (
        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Scenario Stress Testing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Simulate macroeconomic shocks to see their impact on portfolio valuation.
                </p>
            </div>

            <div className="flex gap-4 items-end mb-8">
                <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Scenario
                    </label>
                    <select
                        value={selectedScenario}
                        onChange={(e) => setSelectedScenario(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    >
                        {scenarios.map((s) => (
                            <option key={s.name} value={s.name}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={runStressTest}
                    disabled={loading || !selectedScenario}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
                >
                    {loading ? 'Simulating...' : 'Run Stress Test'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            {results && (
                <div className="space-y-6 animate-fade-in">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Base Portfolio Value</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(results.total_base_value)}
                            </div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm text-red-600">Stressed Value</div>
                            <div className="text-xl font-bold text-red-700">
                                {formatCurrency(results.total_stressed_value)}
                            </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Impact</div>
                            <div className={`text-xl font-bold ${results.total_change_percent < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {formatPercent(results.total_change_percent)}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                            <thead className="bg-gray-50 dark:bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base Value</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stressed Value</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/10">
                                {results.company_results.map((res, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {res.company_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                            {formatCurrency(res.base_value)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                                            {formatCurrency(res.stressed_value)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${res.change_percent < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {formatPercent(res.change_percent)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
