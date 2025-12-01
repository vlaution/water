import React, { useState, useEffect } from 'react';
import { X, Calculator, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface VCMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseData: any;
    onSave: (data: any) => void;
}

export const VCMethodModal: React.FC<VCMethodModalProps> = ({ isOpen, onClose, baseData, onSave }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState({
        investment_amount: 2000000,
        target_return_type: 'multiple', // 'multiple' or 'irr'
        target_return: 10.0, // 10x or 0.40 (40%)
        exit_year: 5,
        exit_metric: 'revenue', // 'revenue' or 'ebitda'
        projected_exit_metric: 20000000,
        exit_multiple: 5.0,
        current_shares: 1000000
    });
    const [results, setResults] = useState<any>(null);

    // Auto-populate from base data if available
    useEffect(() => {
        if (baseData && baseData.dcf_details && baseData.dcf_details.revenue) {
            // Try to grab year 5 revenue
            const year5Rev = baseData.dcf_details.revenue[4];
            if (year5Rev) {
                setInputs(prev => ({
                    ...prev,
                    projected_exit_metric: year5Rev
                }));
            }
        }
    }, [baseData]);

    const handleInputChange = (field: string, value: any) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const runAnalysis = () => {
        setLoading(true);
        // Simulate local calculation for instant feedback, or call API if needed
        // For now, let's replicate the logic locally for the modal interaction, 
        // but ideally we should call the backend.
        // Given the user wants this integrated, let's call the backend.

        // Construct the full valuation input payload
        // We need to wrap it in the structure the backend expects
        // But wait, the backend endpoint /api/valuation/calculate expects a full ValuationInput.
        // We might need a specific endpoint for just VC method or just use the logic locally for the modal preview.
        // Let's implement local logic for speed and responsiveness in the modal, 
        // as the formula is simple. The backend runs it as part of the full run.

        setTimeout(() => {
            const exitValue = inputs.projected_exit_metric * inputs.exit_multiple;
            let postMoney = 0;
            if (inputs.target_return_type === 'multiple') {
                postMoney = exitValue / Math.max(inputs.target_return, 1);
            } else {
                postMoney = exitValue / Math.pow(1 + inputs.target_return, inputs.exit_year);
            }

            const preMoney = postMoney - inputs.investment_amount;
            const ownership = postMoney > 0 ? inputs.investment_amount / postMoney : 1;
            const newShares = inputs.current_shares * (ownership / (1 - ownership));
            const sharePrice = newShares > 0 ? inputs.investment_amount / newShares : 0;

            setResults({
                pre_money_valuation: preMoney,
                post_money_valuation: postMoney,
                ownership_required: ownership,
                new_shares_issued: newShares,
                implied_share_price: sharePrice,
                exit_value: exitValue
            });
            setLoading(false);
            setStep(2);
        }, 500);
    };

    const handleSave = () => {
        onSave(inputs);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Venture Capital Valuation</h2>
                            <p className="text-sm text-gray-500">Early-stage valuation based on exit expectations</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <div className="space-y-8">
                            {/* Section 1: Investment Ask */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">1</span>
                                    The Ask
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount ($)</label>
                                        <input
                                            type="number"
                                            value={inputs.investment_amount}
                                            onChange={(e) => handleInputChange('investment_amount', parseFloat(e.target.value))}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Money Shares Outstanding</label>
                                        <input
                                            type="number"
                                            value={inputs.current_shares}
                                            onChange={(e) => handleInputChange('current_shares', parseFloat(e.target.value))}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Exit Scenarios */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">2</span>
                                    Exit Scenario
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time to Exit (Years)</label>
                                        <input
                                            type="number"
                                            value={inputs.exit_year}
                                            onChange={(e) => handleInputChange('exit_year', parseFloat(e.target.value))}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Exit Metric</label>
                                        <select
                                            value={inputs.exit_metric}
                                            onChange={(e) => handleInputChange('exit_metric', e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="revenue">Revenue</option>
                                            <option value="ebitda">EBITDA</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Projected {inputs.exit_metric} at Exit ($)</label>
                                        <input
                                            type="number"
                                            value={inputs.projected_exit_metric}
                                            onChange={(e) => handleInputChange('projected_exit_metric', parseFloat(e.target.value))}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Exit Multiple (x)</label>
                                        <input
                                            type="number"
                                            value={inputs.exit_multiple}
                                            onChange={(e) => handleInputChange('exit_multiple', parseFloat(e.target.value))}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">SaaS: 5-10x Rev | E-comm: 1-3x Rev</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Investor Targets */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">3</span>
                                    Investor Targets
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Return Type</label>
                                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                onClick={() => handleInputChange('target_return_type', 'multiple')}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${inputs.target_return_type === 'multiple' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Multiple (x)
                                            </button>
                                            <button
                                                onClick={() => handleInputChange('target_return_type', 'irr')}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${inputs.target_return_type === 'irr' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                IRR (%)
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Target {inputs.target_return_type === 'multiple' ? 'Multiple (x)' : 'IRR (decimal)'}
                                        </label>
                                        <input
                                            type="number"
                                            step={inputs.target_return_type === 'irr' ? 0.01 : 0.5}
                                            value={inputs.target_return}
                                            onChange={(e) => handleInputChange('target_return', parseFloat(e.target.value))}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {inputs.target_return_type === 'multiple' ? 'VCs typically target 10x+' : 'VCs typically target 0.30 - 0.50 (30-50%)'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={runAnalysis}
                                    disabled={loading}
                                    className="glass-button bg-blue-600 text-white hover:bg-blue-700 w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Calculating...' : 'Calculate Valuation'}
                                    <Calculator className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            {/* Results Header */}
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900">Valuation Results</h3>
                                <p className="text-gray-500">Based on {inputs.exit_year}-year exit at {inputs.exit_multiple}x {inputs.exit_metric}</p>
                            </div>

                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Pre-Money Valuation</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        ${(results.pre_money_valuation / 1000000).toFixed(1)}M
                                    </p>
                                </div>
                                <div className="p-6 bg-green-50 rounded-2xl border border-green-100 text-center">
                                    <p className="text-sm text-green-600 font-medium mb-1">Post-Money Valuation</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        ${(results.post_money_valuation / 1000000).toFixed(1)}M
                                    </p>
                                </div>
                                <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                                    <p className="text-sm text-purple-600 font-medium mb-1">Equity Stake Required</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {(results.ownership_required * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <h4 className="font-semibold text-gray-900">Deal Mechanics</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Exit Value (Year {inputs.exit_year})</span>
                                        <span className="font-medium">${(results.exit_value / 1000000).toFixed(1)}M</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Implied Share Price</span>
                                        <span className="font-medium">${results.implied_share_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">New Shares Issued</span>
                                        <span className="font-medium">{(results.new_shares_issued / 1000000).toFixed(2)}M</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Shares Post-Money</span>
                                        <span className="font-medium">{((inputs.current_shares + results.new_shares_issued) / 1000000).toFixed(2)}M</span>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings */}
                            {results.ownership_required > 0.4 && (
                                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-medium text-yellow-800">High Dilution Warning</h5>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            This deal requires giving up {(results.ownership_required * 100).toFixed(1)}% of the company.
                                            Founders typically aim to sell 10-20% in early rounds. Consider raising less capital or targeting a higher valuation.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50"
                                >
                                    Adjust Assumptions
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
                                >
                                    Save to Valuation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
