import React, { useState, useEffect } from 'react';
import { ScenarioWizard } from './ScenarioWizard';

interface Scenario {
    id: string;
    name: string;
    probability: number;
    assumptions: any;
    value?: number; // Calculated individual value
}

interface RiskMetrics {
    var_95: number;
    upside_potential: number;
    standard_deviation: number;
}

interface PWSAProps {
    baseAssumptions: any;
    isOpen: boolean;
    onClose: () => void;
}

export const ScenarioManager: React.FC<PWSAProps> = ({ baseAssumptions, isOpen, onClose }) => {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{
        weighted_value: number;
        risk_metrics: RiskMetrics;
        scenario_results: any[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize with Base Case
    useEffect(() => {
        if (isOpen && scenarios.length === 0) {
            setScenarios([
                {
                    id: 'base',
                    name: 'Base Case',
                    probability: 1.0,
                    assumptions: baseAssumptions
                }
            ]);
        }
    }, [isOpen, baseAssumptions]);

    const handleAddScenario = (newAssumptions: any) => {
        const newScenario: Scenario = {
            id: `scenario_${Date.now()}`,
            name: `Scenario ${scenarios.length + 1}`, // User can rename later ideally, but simple for now
            probability: 0.0, // Start at 0, user adjusts
            assumptions: newAssumptions
        };

        // Auto-adjust probabilities? 
        // For now, just add it and let user normalize manually or auto-normalize on run
        setScenarios([...scenarios, newScenario]);
    };

    const updateProbability = (id: string, newProb: number) => {
        setScenarios(scenarios.map(s =>
            s.id === id ? { ...s, probability: newProb } : s
        ));
    };

    const runAnalysis = async () => {
        setIsRunning(true);
        setError(null);
        try {
            // Prepare request
            const requestBody = {
                scenarios: scenarios.map(s => ({
                    name: s.name,
                    probability: s.probability,
                    assumptions: s.assumptions
                }))
            };

            const response = await fetch('http://localhost:8000/api/valuation/pwsa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Analysis failed');
            }

            const data = await response.json();
            setResult({
                weighted_value: data.probability_weighted_value,
                risk_metrics: data.risk_metrics,
                scenario_results: data.scenario_results
            });

            // Update individual values in state for display
            const resultMap = new Map(data.scenario_results.map((r: any) => [r.name, r.value]));
            setScenarios(prev => prev.map(s => ({
                ...s,
                value: resultMap.get(s.name) as number | undefined
            })));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsRunning(false);
        }
    };

    const totalProbability = scenarios.reduce((sum, s) => sum + s.probability, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Probability-Weighted Scenario Analysis</h2>
                        <p className="text-sm text-gray-500">Analyze valuation under uncertainty</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                    {/* Left Column: Scenarios */}
                    <div className="w-1/2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">Scenarios</h3>
                            <button
                                onClick={() => setIsWizardOpen(true)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                + Add Scenario
                            </button>
                        </div>

                        <div className="space-y-4">
                            {scenarios.map((scenario) => (
                                <div key={scenario.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-semibold text-gray-900">{scenario.name}</div>
                                            {scenario.value && (
                                                <div className="text-sm text-gray-500">
                                                    Val: ${(scenario.value / 1000000).toFixed(1)}M
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setScenarios(scenarios.filter(s => s.id !== scenario.id))}
                                            disabled={scenario.id === 'base'}
                                            className="text-gray-400 hover:text-red-500 disabled:opacity-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Probability</span>
                                            <span className="font-medium text-blue-600">{(scenario.probability * 100).toFixed(0)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={scenario.probability}
                                            onChange={(e) => updateProbability(scenario.id, parseFloat(e.target.value))}
                                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`p-4 rounded-xl border ${Math.abs(totalProbability - 1.0) < 0.01 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>
                            <div className="flex justify-between font-medium">
                                <span>Total Probability</span>
                                <span>{(totalProbability * 100).toFixed(0)}%</span>
                            </div>
                            {Math.abs(totalProbability - 1.0) >= 0.01 && (
                                <div className="text-xs mt-1 opacity-80">
                                    Probabilities will be normalized automatically.
                                </div>
                            )}
                        </div>

                        <button
                            onClick={runAnalysis}
                            disabled={isRunning}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {isRunning ? 'Running Analysis...' : 'Run Analysis'}
                        </button>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Results */}
                    <div className="w-1/2 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Analysis Results</h3>

                        {result ? (
                            <div className="space-y-8">
                                {/* Main Value */}
                                <div className="text-center">
                                    <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Probability-Weighted Value</div>
                                    <div className="text-4xl font-bold text-gray-900">
                                        ${(result.weighted_value / 1000000).toFixed(1)}M
                                    </div>
                                </div>

                                {/* Risk Metrics */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">Value at Risk (95%)</div>
                                        <div className="text-xl font-bold text-red-600">
                                            ${(result.risk_metrics.var_95 / 1000000).toFixed(1)}M
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">Upside Potential</div>
                                        <div className="text-xl font-bold text-green-600">
                                            ${(result.risk_metrics.upside_potential / 1000000).toFixed(1)}M
                                        </div>
                                    </div>
                                    <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">Standard Deviation</div>
                                        <div className="text-xl font-bold text-gray-700">
                                            ${(result.risk_metrics.standard_deviation / 1000000).toFixed(1)}M
                                        </div>
                                    </div>
                                </div>

                                {/* Distribution Visualization (Simple Bar) */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-4">Outcome Distribution</h4>
                                    <div className="space-y-3">
                                        {scenarios.map(s => {
                                            const val = s.value || 0;
                                            const maxVal = Math.max(...scenarios.map(sc => sc.value || 0));
                                            const width = maxVal > 0 ? (val / maxVal) * 100 : 0;

                                            return (
                                                <div key={s.id}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-medium text-gray-700">{s.name}</span>
                                                        <span className="text-gray-500">${(val / 1000000).toFixed(1)}M</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${width}%`, opacity: 0.5 + (s.probability * 0.5) }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p>Run analysis to see risk-adjusted valuation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ScenarioWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onApply={handleAddScenario}
                currentAssumptions={baseAssumptions}
            />
        </div>
    );
};
