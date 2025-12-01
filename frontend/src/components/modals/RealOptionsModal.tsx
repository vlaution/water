import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, HelpCircle, Activity } from 'lucide-react';

interface RealOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dcfValue?: number; // Optional link to DCF
    runId?: string; // ID of the saved run
}

type OptionType = 'patent' | 'expansion' | 'abandonment' | 'delay';

interface RealOptionsState {
    optionType: OptionType;
    assetValue: string; // S
    strikePrice: string; // K
    timeToExpiration: string; // T
    riskFreeRate: string; // r
    volatility: string; // sigma
    sector: string;
}

export const RealOptionsModal: React.FC<RealOptionsModalProps> = ({ isOpen, onClose, dcfValue, runId }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [formData, setFormData] = useState<RealOptionsState>({
        optionType: 'expansion',
        assetValue: dcfValue ? dcfValue.toString() : '',
        strikePrice: '',
        timeToExpiration: '1',
        riskFreeRate: '', // Will be auto-fetched if empty
        volatility: '', // Will be auto-fetched if empty
        sector: 'technology'
    });

    const handleInputChange = (field: keyof RealOptionsState, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculateOption = async () => {
        setLoading(true);
        try {
            const payload = {
                option_type: formData.optionType,
                asset_value: parseFloat(formData.assetValue) || 0, // Handle 0 or empty
                strike_price: parseFloat(formData.strikePrice),
                time_to_expiration: parseFloat(formData.timeToExpiration),
                risk_free_rate: formData.riskFreeRate ? parseFloat(formData.riskFreeRate) / 100 : null,
                volatility: formData.volatility ? parseFloat(formData.volatility) / 100 : null,
                sector: formData.sector,
                dcf_valuation_id: runId
            };

            const response = await fetch('http://localhost:8000/api/real-options/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                setStep(4); // Move to results
            }
        } catch (error) {
            console.error("Calculation failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Real Options Valuation</h2>
                        <p className="text-sm text-gray-500">Value strategic flexibility and uncertainty</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-system-blue' : 'bg-gray-200'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-900">What type of flexibility are you valuing?</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'expansion', label: 'Expansion Option', desc: 'Right to invest/expand if conditions are favorable.' },
                                    { id: 'patent', label: 'Patent / R&D', desc: 'Value of R&D pipeline or patent commercialization.' },
                                    { id: 'abandonment', label: 'Abandonment Option', desc: 'Right to exit/sell assets if project fails.' },
                                    { id: 'delay', label: 'Option to Delay', desc: 'Value of waiting for more information.' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleInputChange('optionType', opt.id as any)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${formData.optionType === opt.id
                                            ? 'border-system-blue bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-900">{opt.label}</div>
                                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-900">Define the Project</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Underlying Asset Value (S)
                                        <span className="ml-2 text-xs text-gray-400 font-normal">Present Value of future cash flows</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.assetValue}
                                            onChange={(e) => handleInputChange('assetValue', e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent"
                                            placeholder={runId ? "Linked to DCF Run" : "e.g. 1000000"}
                                        />
                                    </div>
                                    {runId && (
                                        <div className="text-xs text-system-blue mt-1 flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            Linked to current valuation run
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Investment Cost (K)
                                        <span className="ml-2 text-xs text-gray-400 font-normal">Cost to exercise the option</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.strikePrice}
                                            onChange={(e) => handleInputChange('strikePrice', e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent"
                                            placeholder="e.g. 1200000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Time to Expiration (Years)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.timeToExpiration}
                                        onChange={(e) => handleInputChange('timeToExpiration', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent"
                                        placeholder="e.g. 3"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-900">Estimate Uncertainty</h3>
                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                                <HelpCircle className="w-5 h-5 text-system-blue flex-shrink-0" />
                                <p className="text-sm text-blue-800">
                                    We can auto-estimate these values based on the sector and current market rates. Leave blank to use defaults.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                                    <select
                                        value={formData.sector}
                                        onChange={(e) => handleInputChange('sector', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent"
                                    >
                                        <option value="technology">Technology (High Volatility)</option>
                                        <option value="biotech">Biotech (Very High Volatility)</option>
                                        <option value="energy">Energy (Medium Volatility)</option>
                                        <option value="manufacturing">Manufacturing (Low Volatility)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volatility (%)</label>
                                    <input
                                        type="number"
                                        value={formData.volatility}
                                        onChange={(e) => handleInputChange('volatility', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent"
                                        placeholder="Auto-estimated if blank"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk-Free Rate (%)</label>
                                    <input
                                        type="number"
                                        value={formData.riskFreeRate}
                                        onChange={(e) => handleInputChange('riskFreeRate', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent"
                                        placeholder="Auto-fetched (10y Treasury)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && result && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
                                <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Option Value</div>
                                <div className="text-4xl font-bold mb-2">
                                    ${(result.option_value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-sm text-gray-300 opacity-90 leading-relaxed">
                                    {result.strategic_insight.replace(/\*\*/g, '')}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase">Delta (Sensitivity to Value)</div>
                                    <div className="text-lg font-semibold text-gray-900">{result.greeks.delta.toFixed(2)}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase">Vega (Sensitivity to Vol)</div>
                                    <div className="text-lg font-semibold text-gray-900">{result.greeks.vega.toFixed(2)}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase">Theta (Time Decay)</div>
                                    <div className="text-lg font-semibold text-gray-900">{result.greeks.theta.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-400 text-center">
                                Inputs used: Volatility {(result.inputs_used.volatility * 100).toFixed(1)}%,
                                Risk-Free Rate {(result.inputs_used.risk_free_rate * 100).toFixed(2)}%
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between">
                    {step > 1 && step < 4 ? (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="px-6 py-2 bg-system-blue text-white rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2 shadow-sm"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : step === 3 ? (
                        <button
                            onClick={calculateOption}
                            disabled={loading}
                            className="px-6 py-2 bg-system-blue text-white rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Calculate Value'}
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium shadow-sm"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
