import React, { useState, useEffect } from 'react';
import { api } from '../config/api';

interface ScenarioWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (newAssumptions: any) => void;
    currentAssumptions: any;
}

type Step = 'objective' | 'intensity' | 'preview';

const SCENARIOS = [
    { id: 'market_share_gain', name: 'Market Share Gain', description: 'Aggressive growth through customer acquisition', icon: '' },
    { id: 'cost_cutting', name: 'Cost Cutting', description: 'Focus on profitability and efficiency', icon: '' },
    { id: 'recession', name: 'Recession / Downside', description: 'Economic downturn survival mode', icon: '' },
    { id: 'blue_sky', name: 'Blue Sky / Upside', description: 'Optimistic growth and margin expansion', icon: '' },
];

export const ScenarioWizard: React.FC<ScenarioWizardProps> = ({ isOpen, onClose, onApply, currentAssumptions }) => {
    const [step, setStep] = useState<Step>('objective');
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [intensity, setIntensity] = useState<number>(1.0); // 0.5 to 1.5
    const [previewData, setPreviewData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep('objective');
            setSelectedScenario(null);
            setIntensity(1.0);
            setPreviewData(null);
            setError(null);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!selectedScenario) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(api.url('/api/scenarios/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_assumptions: currentAssumptions,
                    scenario_type: selectedScenario,
                    intensity: intensity
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to generate scenario');
            }

            const data = await response.json();
            setPreviewData(data);
            setStep('preview');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Scenario Wizard</h2>
                        <p className="text-sm text-gray-500">Create coherent financial scenarios in seconds</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {step === 'objective' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800">Step 1: What is the goal of this scenario?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {SCENARIOS.map((scenario) => (
                                    <button
                                        key={scenario.id}
                                        onClick={() => setSelectedScenario(scenario.id)}
                                        className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md flex items-start gap-4 ${selectedScenario === scenario.id
                                            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-blue-300 bg-white'
                                            }`}
                                    >
                                        <span className="text-4xl">{scenario.icon}</span>
                                        <div>
                                            <div className="font-bold text-gray-900">{scenario.name}</div>
                                            <div className="text-sm text-gray-500 mt-1">{scenario.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'intensity' && (
                        <div className="space-y-8 max-w-2xl mx-auto text-center py-8">
                            <h3 className="text-lg font-semibold text-gray-800">Step 2: How aggressive is this strategy?</h3>

                            <div className="relative pt-12 pb-6 px-4">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.1"
                                    value={intensity}
                                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between mt-4 text-sm font-medium text-gray-500">
                                    <span>Conservative (Low)</span>
                                    <span>Balanced (Medium)</span>
                                    <span>Aggressive (High)</span>
                                </div>
                                <div className="mt-8 text-4xl font-bold text-blue-600">
                                    {Math.round(intensity * 100)}%
                                </div>
                                <p className="text-gray-500 mt-2">Intensity Multiplier</p>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && previewData && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    Strategy Explanation
                                </h4>
                                <p className="text-blue-800 leading-relaxed">
                                    {previewData.explanation}
                                </p>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800">Impact Preview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Key Metrics Comparison */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Revenue Growth (Start)</h4>
                                    <div className="flex items-end gap-4">
                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">Current</div>
                                            <div className="text-2xl font-bold text-gray-400">
                                                {(previewData.base_assumptions.dcf_input.projections.revenue_growth_start * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="text-gray-300 pb-2">→</div>
                                        <div>
                                            <div className="text-sm text-blue-600 mb-1">New</div>
                                            <div className="text-3xl font-bold text-blue-600">
                                                {(previewData.generated_assumptions.dcf_input.projections.revenue_growth_start * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">EBITDA Margin (Start)</h4>
                                    <div className="flex items-end gap-4">
                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">Current</div>
                                            <div className="text-2xl font-bold text-gray-400">
                                                {(previewData.base_assumptions.dcf_input.projections.ebitda_margin_start * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="text-gray-300 pb-2">→</div>
                                        <div>
                                            <div className="text-sm text-blue-600 mb-1">New</div>
                                            <div className="text-3xl font-bold text-blue-600">
                                                {(previewData.generated_assumptions.dcf_input.projections.ebitda_margin_start * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Changes List */}
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Detailed Adjustments</h4>
                                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Field</th>
                                                <th className="px-4 py-3">Old Value</th>
                                                <th className="px-4 py-3">New Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {previewData.changes.map((change: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-white transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-800">{change.field}</td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {typeof change.old_value === 'number'
                                                            ? (change.field.includes('growth') || change.field.includes('margin') || change.field.includes('rate') || change.field.includes('percent')
                                                                ? `${(change.old_value * 100).toFixed(1)}%`
                                                                : change.old_value.toFixed(1))
                                                            : change.old_value}
                                                    </td>
                                                    <td className="px-4 py-3 text-blue-600 font-semibold">
                                                        {typeof change.new_value === 'number'
                                                            ? (change.field.includes('growth') || change.field.includes('margin') || change.field.includes('rate') || change.field.includes('percent')
                                                                ? `${(change.new_value * 100).toFixed(1)}%`
                                                                : change.new_value.toFixed(1))
                                                            : change.new_value}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500">Generating scenario...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mt-4">
                            Error: {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    {step === 'objective' ? (
                        <div className="text-sm text-gray-400">Select a scenario to continue</div>
                    ) : (
                        <button
                            onClick={() => setStep(step === 'preview' ? 'intensity' : 'objective')}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Back
                        </button>
                    )}

                    <div className="flex gap-3">
                        {step === 'objective' && (
                            <button
                                onClick={() => setStep('intensity')}
                                disabled={!selectedScenario}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                            >
                                Next: Intensity
                            </button>
                        )}
                        {step === 'intensity' && (
                            <button
                                onClick={handleGenerate}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                                Generate Preview
                            </button>
                        )}
                        {step === 'preview' && (
                            <button
                                onClick={() => {
                                    if (previewData) {
                                        onApply(previewData.generated_assumptions);
                                        onClose();
                                    }
                                }}
                                className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
                            >
                                <span>Apply Scenario</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
