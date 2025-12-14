import React, { useState } from 'react';
import { EnhancedFormInput } from '../common/EnhancedFormInput';
import { ChevronRight, ChevronLeft, Check, Plus, Trash2, BarChart2, BookOpen } from 'lucide-react';
import { MonteCarloModal } from '../modals/MonteCarloModal';
import { TutorialOverlay } from '../common/TutorialOverlay';

// Define TS Interfaces locally or import from types if available centrally
// Simulating the backend structure
interface DebtTranche {
    name: string;
    amount?: number;
    leverage_multiple?: number;
    interest_rate: number;
    cash_interest: boolean;
    amortization_rate: number;
    maturity: number;
    mandatory_cash_sweep_priority: number;
}

interface RefinancingConfig {
    enabled: boolean;
    refinance_year: number;
    new_interest_rate: number;
    refinance_amount_pct: number;
    penalty_fee_percent: number;
}

interface CovenantRule {
    covenant_type: 'max_debt_ebitda' | 'min_interest_coverage';
    limit: number;
    start_year: number;
    end_year: number;
}

interface MIPConfig {
    option_pool_percent: number;
    strike_price_discount: number;
    vesting_period: number;
    cliff_years: number;
}

interface TaxConfig {
    enable_nol: boolean;
    initial_nol_balance: number;
    nol_annual_limit: number;
    interest_deductibility_cap: number;
    step_up_percent?: number;
    depreciation_years?: number;
}


interface LBOInputState {
    solve_for: 'entry_price' | 'target_irr' | 'exit_multiple' | 'moic' | 'optimal_refinancing';
    entry_revenue: number;
    entry_ebitda: number;
    entry_ev_ebitda_multiple?: number;
    target_irr?: number;
    financing: {
        tranches: DebtTranche[];
    };
    assumptions: {
        transaction_fees_percent: number;
        synergy_benefits: number;
        hurdle_rate?: number;
        carry_percent?: number;
        catchup_active?: boolean;
    };
    revenue_growth_rate: number;
    ebitda_margin: number;
    capex_percentage: number;
    nwc_percentage: number;
    tax_rate: number;
    holding_period: number;
    exit_ev_ebitda_multiple?: number;
    // Advanced
    refinancing_config?: RefinancingConfig;
    covenants?: CovenantRule[];
    mip_assumptions?: MIPConfig;
    tax_assumptions?: TaxConfig;
    sector?: string;
}

interface BenchmarkData {
    ev_ebitda: { mean: number; min: number; max: number };
    leverage: { mean: number; max: number };
    irr: { mean: number; median: number };
    success_rate: number;
    count: number;
}


interface LBOWizardProps {
    data: LBOInputState;
    onChange: (newData: LBOInputState) => void;
}

export const LBOWizard: React.FC<LBOWizardProps> = ({ data, onChange }) => {
    const [step, setStep] = useState(1);
    const [showMonteCarlo, setShowMonteCarlo] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [benchmarks, setBenchmarks] = useState<BenchmarkData | null>(null);

    const tutorialSteps = [
        { title: "Define Entry & Structure", content: "Start by setting the purchase price, solving for either Entry Price or Target IRR. Use 'Quick Start' templates for standard setups." },
        { title: "Configure Financing", content: "Add debt tranches (Senior, Mezzanine) with interest rates and covenants. Toggle 'Refinancing' to optimize capital structure later." },
        { title: "Advanced Tax & Covenants", content: "Set financial covenants (e.g. Max Leverage) and enable Tax Shields (NOLs, Step-Up) to optimize returns." },
        { title: "Exit & Waterfall", content: "Define the exit multiple and holding period. The waterfall calculates returns for LPs and GP (Carry, Catch-up)." },
        { title: "Risk Analysis", content: "Run a Monte Carlo simulation to see the probability of achieving your Target IRR under different scenarios." }
    ];

    const fetchBenchmarks = async (sector: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/historical/benchmarks/${sector}`);
            if (res.ok) {
                setBenchmarks(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch benchmarks", e);
        }
    };

    const updateField = (field: keyof LBOInputState, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const updateAssumption = (field: string, value: number) => {
        onChange({
            ...data,
            assumptions: { ...data.assumptions, [field]: value }
        });
    };

    const addTranche = () => {
        const newTranche: DebtTranche = {
            name: "New Tranche",
            leverage_multiple: 1.0,
            interest_rate: 0.08,
            cash_interest: true,
            amortization_rate: 0.0,
            maturity: 5,
            mandatory_cash_sweep_priority: data.financing.tranches.length + 1
        };
        onChange({
            ...data,
            financing: { ...data.financing, tranches: [...data.financing.tranches, newTranche] }
        });
    };

    const updateTranche = (index: number, field: string, value: any) => {
        const newTranches = [...data.financing.tranches];
        newTranches[index] = { ...newTranches[index], [field]: value };
        onChange({
            ...data,
            financing: { ...data.financing, tranches: newTranches }
        });
    };

    const removeTranche = (index: number) => {
        const newTranches = data.financing.tranches.filter((_, i) => i !== index);
        onChange({
            ...data,
            financing: { ...data.financing, tranches: newTranches }
        });
    };

    return (
        <div className="glass-panel p-0 overflow-hidden animate-fade-in-up">
            {/* Header / Stepper */}
            <div className="bg-gray-50 border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">LBO Analysis Wizard</h2>
                        <p className="text-sm text-gray-500">Configure your Leverage Buyout model in 3 steps</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                            title="Start Tutorial"
                        >
                            <BookOpen size={20} />
                        </button>
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-system-blue' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step === s ? 'border-system-blue bg-blue-50' : step > s ? 'border-system-blue bg-system-blue text-white' : 'border-gray-300'}`}>
                                    {step > s ? <Check size={16} /> : s}
                                </div>
                                {s < 5 && <div className={`w-4 h-0.5 ${step > s ? 'bg-system-blue' : 'bg-gray-300'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h3 className="text-lg font-semibold text-gray-800">Step 1: Deal Structure & Entry</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Quick Start:</span>
                                <select
                                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        if (!type) return;

                                        // Template Logic
                                        const base = { ...data };
                                        if (type === 'aggressive') {
                                            base.revenue_growth_rate = 0.10; // 10%
                                            base.ebitda_margin = 0.30;
                                            base.exit_ev_ebitda_multiple = 12.0;
                                            // More leverage
                                            base.financing.tranches[0].leverage_multiple = 6.0;
                                        } else if (type === 'conservative') {
                                            base.revenue_growth_rate = 0.03;
                                            base.ebitda_margin = 0.20;
                                            base.exit_ev_ebitda_multiple = 8.0;
                                            base.financing.tranches[0].leverage_multiple = 3.5;
                                        } else if (type === 'distressed') {
                                            base.revenue_growth_rate = -0.05; // Initial decline
                                            base.ebitda_margin = 0.10;
                                            base.exit_ev_ebitda_multiple = 6.0;
                                            base.financing.tranches[0].leverage_multiple = 2.5;
                                            // Turnaround specific logic would go deeper here
                                        } else { // Standard
                                            base.revenue_growth_rate = 0.05;
                                            base.ebitda_margin = 0.25;
                                            base.exit_ev_ebitda_multiple = 10.0;
                                            base.financing.tranches[0].leverage_multiple = 4.5;
                                        }
                                        onChange(base);
                                    }}
                                >
                                    <option value="">Select Template...</option>
                                    <option value="standard">Standard LBO</option>
                                    <option value="aggressive">Aggressive Growth</option>
                                    <option value="conservative">Conservative / Downside</option>
                                    <option value="distressed">Distressed Turnaround</option>
                                </select>
                            </div>
                        </div>

                        {/* Benchmarks Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Target Sector (for Benchmarking)</label>
                                <select
                                    className="glass-input w-full"
                                    value={data.sector || ""}
                                    onChange={(e) => {
                                        updateField('sector', e.target.value);
                                        if (e.target.value) fetchBenchmarks(e.target.value);
                                        else setBenchmarks(null);
                                    }}
                                >
                                    <option value="">Select Sector...</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Industrial">Industrial</option>
                                    <option value="Consumer">Consumer</option>
                                </select>
                                {benchmarks && (
                                    <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm border border-blue-100 grid grid-cols-3 gap-2">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">Avg EV/EBITDA</div>
                                            <div className="font-bold text-blue-700">{benchmarks.ev_ebitda.mean.toFixed(1)}x</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">Max Leverage</div>
                                            <div className="font-bold text-blue-700">{benchmarks.leverage.max.toFixed(1)}x</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">Success Rate</div>
                                            <div className="font-bold text-blue-700">{(benchmarks.success_rate * 100).toFixed(0)}%</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Inputs continued */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Solve For</label>
                                <select
                                    value={data.solve_for}
                                    onChange={(e) => updateField('solve_for', e.target.value)}
                                    className="glass-input w-full"
                                >
                                    <option value="entry_price">Entry Price (Given Target IRR)</option>
                                    <option value="target_irr">Target IRR (Given Entry Price)</option>
                                </select>
                            </div>

                            {data.solve_for === 'target_irr' && (
                                <div>
                                    <EnhancedFormInput
                                        label="Entry EV/EBITDA Multiple"
                                        type="number"
                                        value={data.entry_ev_ebitda_multiple}
                                        onChange={(e) => updateField('entry_ev_ebitda_multiple', parseFloat(e.target.value))}
                                        step="0.1"
                                    />
                                </div>
                            )}

                            {data.solve_for === 'entry_price' && (
                                <div>
                                    <EnhancedFormInput
                                        label="Target IRR (%)" // Input as e.g. 20 for 0.20
                                        type="number"
                                        value={data.target_irr ? data.target_irr * 100 : 20}
                                        onChange={(e) => updateField('target_irr', parseFloat(e.target.value) / 100)}
                                        step="0.1"
                                    />
                                </div>
                            )}

                            <div>
                                <EnhancedFormInput
                                    label="LTM Revenue ($)"
                                    type="number"
                                    value={data.entry_revenue}
                                    onChange={(e) => updateField('entry_revenue', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label="LTM EBITDA ($)"
                                    type="number"
                                    value={data.entry_ebitda}
                                    onChange={(e) => updateField('entry_ebitda', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label="Transaction Fees (% of EV)"
                                    type="number"
                                    value={data.assumptions.transaction_fees_percent * 100}
                                    onChange={(e) => updateAssumption('transaction_fees_percent', parseFloat(e.target.value) / 100)}
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h3 className="text-lg font-semibold text-gray-800">Step 2: Financing Structure</h3>
                            <button type="button" onClick={addTranche} className="text-sm text-system-blue font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg">
                                <Plus size={16} /> Add Tranche
                            </button>
                        </div>

                        <div className="space-y-4">
                            {data.financing.tranches.map((tranche, index) => (
                                <div key={index} className="bg-white/50 border border-gray-200 rounded-xl p-4 relative group">
                                    <button type="button" onClick={() => removeTranche(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="col-span-1 md:col-span-3">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Tranche Name</label>
                                            <input
                                                className="glass-input w-full md:w-1/2"
                                                value={tranche.name}
                                                onChange={(e) => updateTranche(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="Leverage (x EBITDA)"
                                                type="number"
                                                step="0.1"
                                                value={tranche.leverage_multiple}
                                                onChange={(e) => updateTranche(index, 'leverage_multiple', parseFloat(e.target.value))}
                                            // suggestion={...} could add linking here
                                            />
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="Interest Rate (%)"
                                                type="number"
                                                step="0.1"
                                                value={tranche.interest_rate * 100}
                                                onChange={(e) => updateTranche(index, 'interest_rate', parseFloat(e.target.value) / 100)}
                                            />
                                        </div>
                                        <div className="flex items-center pt-8">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={tranche.cash_interest}
                                                    onChange={(e) => updateTranche(index, 'cash_interest', e.target.checked)}
                                                    className="rounded text-system-blue focus:ring-system-blue"
                                                />
                                                Cash Interest (vs PIK)
                                            </label>
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="Amortization (%/yr)"
                                                type="number"
                                                step="0.5"
                                                value={tranche.amortization_rate * 100}
                                                onChange={(e) => updateTranche(index, 'amortization_rate', parseFloat(e.target.value) / 100)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Sweep Priority</label>
                                            <input
                                                type="number"
                                                className="glass-input w-full"
                                                value={tranche.mandatory_cash_sweep_priority}
                                                onChange={(e) => updateTranche(index, 'mandatory_cash_sweep_priority', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {data.financing.tranches.length === 0 && (
                                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No debt tranches defined. Add one to get started.</p>
                                </div>
                            )}

                            {/* REFINANCING SECTION */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-md font-semibold text-gray-700">Refinancing Strategy</h4>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => updateField('solve_for', data.solve_for === 'optimal_refinancing' ? 'entry_price' : 'optimal_refinancing')}
                                            className={`text-xs px-2 py-1 rounded border ${data.solve_for === 'optimal_refinancing' ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-500'}`}
                                        >
                                            {data.solve_for === 'optimal_refinancing' ? 'Optimization Active' : 'Auto-Optimize Timing'}
                                        </button>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-system-blue">
                                            <input
                                                type="checkbox"
                                                checked={data.refinancing_config?.enabled || false}
                                                onChange={(e) => updateField('refinancing_config', e.target.checked ? {
                                                    enabled: true,
                                                    refinance_year: 3,
                                                    new_interest_rate: 0.06,
                                                    refinance_amount_pct: 1.0,
                                                    penalty_fee_percent: 0.01
                                                } : { ...data.refinancing_config, enabled: false })}
                                                className="rounded text-system-blue focus:ring-system-blue"
                                            />
                                            Enable Refinancing
                                        </label>
                                    </div>
                                </div>

                                {data.refinancing_config?.enabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <div>
                                            {data.solve_for === 'optimal_refinancing' ? (
                                                <div className="bg-purple-50 p-3 rounded border border-purple-100 text-sm text-purple-800">
                                                    <strong>Auto-Optimization:</strong> The model will test all years and choose the best refinancing timing for MAX IRR.
                                                </div>
                                            ) : (
                                                <EnhancedFormInput
                                                    label="Refinance Year"
                                                    type="number"
                                                    value={data.refinancing_config.refinance_year}
                                                    onChange={(e) => updateField('refinancing_config', { ...data.refinancing_config, refinance_year: parseInt(e.target.value) })}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="New Interest Rate (%)"
                                                type="number" step="0.1"
                                                value={data.refinancing_config.new_interest_rate * 100}
                                                onChange={(e) => updateField('refinancing_config', { ...data.refinancing_config, new_interest_rate: parseFloat(e.target.value) / 100 })}
                                            />
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="Refinance Amount (%)"
                                                type="number" step="1"
                                                value={data.refinancing_config.refinance_amount_pct * 100}
                                                onChange={(e) => updateField('refinancing_config', { ...data.refinancing_config, refinance_amount_pct: parseFloat(e.target.value) / 100 })}
                                            />
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="Penalty Fee (%)"
                                                type="number" step="0.1"
                                                value={data.refinancing_config.penalty_fee_percent * 100}
                                                onChange={(e) => updateField('refinancing_config', { ...data.refinancing_config, penalty_fee_percent: parseFloat(e.target.value) / 100 })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Step 3: Covenants & Tax</h3>

                        {/* COVENANTS */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-md font-semibold text-gray-700">Financial Covenants</h4>
                                <button type="button" onClick={() => {
                                    const newCov: CovenantRule = { covenant_type: 'max_debt_ebitda', limit: 6.0, start_year: 1, end_year: 5 };
                                    updateField('covenants', [...(data.covenants || []), newCov]);
                                }} className="text-sm text-system-blue font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg">
                                    <Plus size={16} /> Add Covenant
                                </button>
                            </div>

                            {(data.covenants || []).map((cov, idx) => (
                                <div key={idx} className="bg-white/50 border border-gray-200 rounded-xl p-4 relative flex gap-4 items-end">
                                    <button type="button" onClick={() => updateField('covenants', data.covenants?.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 block mb-1">Type</label>
                                        <select
                                            value={cov.covenant_type}
                                            onChange={(e) => {
                                                const newCovs = [...(data.covenants || [])];
                                                newCovs[idx].covenant_type = e.target.value as any;
                                                updateField('covenants', newCovs);
                                            }}
                                            className="glass-input w-full"
                                        >
                                            <option value="max_debt_ebitda">Max Debt / EBITDA</option>
                                            <option value="min_interest_coverage">Min Interest Coverage</option>
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <EnhancedFormInput
                                            label="Limit (x)" type="number" step="0.1"
                                            value={cov.limit}
                                            onChange={(e) => {
                                                const newCovs = [...(data.covenants || [])];
                                                newCovs[idx].limit = parseFloat(e.target.value);
                                                updateField('covenants', newCovs);
                                            }}
                                        />
                                    </div>
                                    <div className="w-20">
                                        <EnhancedFormInput
                                            label="Start Yr" type="number"
                                            value={cov.start_year}
                                            onChange={(e) => {
                                                const newCovs = [...(data.covenants || [])];
                                                newCovs[idx].start_year = parseInt(e.target.value);
                                                updateField('covenants', newCovs);
                                            }}
                                        />
                                    </div>
                                    <div className="w-20">
                                        <EnhancedFormInput
                                            label="End Yr" type="number"
                                            value={cov.end_year}
                                            onChange={(e) => {
                                                const newCovs = [...(data.covenants || [])];
                                                newCovs[idx].end_year = parseInt(e.target.value);
                                                updateField('covenants', newCovs);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TAX SHIELD */}
                        <div className="pt-6 border-t border-gray-100">
                            <h4 className="text-md font-semibold text-gray-700 mb-4">Tax Optimization</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Loss Carryforwards (NOL)</h5>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 mb-4">
                                        <input
                                            type="checkbox"
                                            checked={data.tax_assumptions?.enable_nol || false}
                                            onChange={(e) => {
                                                const currentTax = data.tax_assumptions || { initial_nol_balance: 0, nol_annual_limit: 0.8, interest_deductibility_cap: 0.3 };
                                                updateField('tax_assumptions', { ...currentTax, enable_nol: e.target.checked } as TaxConfig);
                                            }}
                                            className="rounded text-system-blue focus:ring-system-blue"
                                        />
                                        Enable NOL Carryforwards
                                    </label>
                                </div>
                                {data.tax_assumptions?.enable_nol && (
                                    <>
                                        <div>
                                            <EnhancedFormInput
                                                label="Initial NOL Balance ($)"
                                                type="number"
                                                value={data.tax_assumptions.initial_nol_balance}
                                                onChange={(e) => updateField('tax_assumptions', { ...data.tax_assumptions, initial_nol_balance: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="Annual Usage Limit (% of Inc)"
                                                type="number" step="1"
                                                value={data.tax_assumptions.nol_annual_limit * 100}
                                                onChange={(e) => updateField('tax_assumptions', { ...data.tax_assumptions, nol_annual_limit: parseFloat(e.target.value) / 100 })}
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Deductibility</h5>
                                    <EnhancedFormInput
                                        label="Interest Deductibility Cap (% EBITDA)"
                                        type="number" step="1"
                                        value={(data.tax_assumptions?.interest_deductibility_cap || 0.3) * 100}
                                        onChange={(e) => {
                                            const currentTax = data.tax_assumptions || { enable_nol: false, initial_nol_balance: 0, nol_annual_limit: 0.8 };
                                            updateField('tax_assumptions', { ...currentTax, interest_deductibility_cap: parseFloat(e.target.value) / 100 } as TaxConfig);
                                        }}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave 0 for no cap (Section 163(j) defaults to 30%)</p>
                                </div>

                                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Asset Step-Up (Section 338(h)(10))</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <EnhancedFormInput
                                                label="Step-Up Allocation (% of Price)"
                                                type="number" step="1"
                                                value={(data.tax_assumptions?.step_up_percent || 0.0) * 100}
                                                onChange={(e) => {
                                                    const currentTax = data.tax_assumptions || { enable_nol: false, initial_nol_balance: 0, nol_annual_limit: 0.8, interest_deductibility_cap: 0.3 };
                                                    updateField('tax_assumptions', { ...currentTax, step_up_percent: parseFloat(e.target.value) / 100 } as TaxConfig);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <EnhancedFormInput
                                                label="Depreciation Period (Years)"
                                                type="number"
                                                value={data.tax_assumptions?.depreciation_years || 15}
                                                onChange={(e) => {
                                                    const currentTax = data.tax_assumptions || { enable_nol: false, initial_nol_balance: 0, nol_annual_limit: 0.8, interest_deductibility_cap: 0.3 };
                                                    updateField('tax_assumptions', { ...currentTax, depreciation_years: parseInt(e.target.value) } as TaxConfig);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Step 4: Management Incentive Plan (MIP)</h3>

                        <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <EnhancedFormInput
                                        label="Option Pool Size (% of Exit Equity)"
                                        type="number" step="0.1"
                                        value={(data.mip_assumptions?.option_pool_percent || 0.1) * 100}
                                        onChange={(e) => {
                                            const currentMIP = data.mip_assumptions || { strike_price_discount: 0, vesting_period: 4, cliff_years: 1 };
                                            updateField('mip_assumptions', { ...currentMIP, option_pool_percent: parseFloat(e.target.value) / 100 } as MIPConfig);
                                        }}
                                    />
                                </div>
                                <div>
                                    <EnhancedFormInput
                                        label="Vesting Period (Years)"
                                        type="number"
                                        value={data.mip_assumptions?.vesting_period || 4}
                                        onChange={(e) => {
                                            const currentMIP = data.mip_assumptions || { option_pool_percent: 0.1, strike_price_discount: 0, cliff_years: 1 };
                                            updateField('mip_assumptions', { ...currentMIP, vesting_period: parseFloat(e.target.value) } as MIPConfig);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Step 5: Assumptions & Exit</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <EnhancedFormInput
                                    label="Revenue Growth Rate (%)"
                                    type="number"
                                    step="0.1"
                                    value={data.revenue_growth_rate * 100}
                                    onChange={(e) => updateField('revenue_growth_rate', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label="EBITDA Margin (%)"
                                    type="number"
                                    step="0.1"
                                    value={data.ebitda_margin * 100}
                                    onChange={(e) => updateField('ebitda_margin', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label="CapEx (% of Rev)"
                                    type="number"
                                    step="0.1"
                                    value={data.capex_percentage * 100}
                                    onChange={(e) => updateField('capex_percentage', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label="NWC (% of Rev)"
                                    type="number"
                                    step="0.1"
                                    value={data.nwc_percentage * 100}
                                    onChange={(e) => updateField('nwc_percentage', parseFloat(e.target.value) / 100)}
                                />
                            </div>

                            <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                <h4 className="text-md font-semibold text-gray-700 mb-4">Exit Assumptions</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <EnhancedFormInput
                                            label="Holding Period (Years)"
                                            type="number"
                                            value={data.holding_period}
                                            onChange={(e) => updateField('holding_period', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <EnhancedFormInput
                                            label="Exit Multiple (x EBITDA)"
                                            type="number"
                                            step="0.1"
                                            value={data.exit_ev_ebitda_multiple}
                                            onChange={(e) => updateField('exit_ev_ebitda_multiple', parseFloat(e.target.value))}
                                        />
                                    </div>

                                    <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                        <h4 className="text-md font-semibold text-gray-700 mb-2">Waterfall Distribution</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <EnhancedFormInput
                                                    label="Hurdle Rate (%)"
                                                    type="number" step="0.5"
                                                    value={(data.assumptions.hurdle_rate || 0.08) * 100}
                                                    onChange={(e) => updateAssumption('hurdle_rate', parseFloat(e.target.value) / 100)}
                                                />
                                            </div>
                                            <div>
                                                <EnhancedFormInput
                                                    label="Carry %"
                                                    type="number" step="1"
                                                    value={(data.assumptions.carry_percent || 0.20) * 100}
                                                    onChange={(e) => updateAssumption('carry_percent', parseFloat(e.target.value) / 100)}
                                                />
                                            </div>
                                            <div className="flex items-center pt-8">
                                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.assumptions.catchup_active !== false} // Default true
                                                        onChange={(e) => onChange({ ...data, assumptions: { ...data.assumptions, catchup_active: e.target.checked } })}
                                                        className="rounded text-system-blue focus:ring-system-blue"
                                                    />
                                                    GP Catch-up Active
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Navigation */}
            <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={18} /> Back
                </button>

                {step < 5 ? (
                    <button
                        type="button"
                        onClick={() => setStep(s => Math.min(5, s + 1))}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                ) : (
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setShowMonteCarlo(true)}
                            className="px-5 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-200 transition-all flex items-center gap-2 font-medium"
                        >
                            <BarChart2 size={18} /> Run Risk Analysis
                        </button>
                        <div className="text-green-600 font-medium flex items-center gap-2">
                            <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Check size={18} />
                            </span>
                            Ready to Calculate
                        </div>
                    </div>
                )}
            </div>

            <MonteCarloModal
                isOpen={showMonteCarlo}
                onClose={() => setShowMonteCarlo(false)}
                lboData={data}
            />

            <TutorialOverlay
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                steps={tutorialSteps}
            />
        </div>
    );
};
