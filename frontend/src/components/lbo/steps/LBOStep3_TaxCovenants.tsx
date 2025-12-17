import React from 'react';
import { EnhancedFormInput } from '../../common/EnhancedFormInput';
import { Plus, Trash2 } from 'lucide-react';
import type { LBOInputState, CovenantRule, TaxConfig } from '../../../types/lbo';

interface LBOStep3Props {
    data: LBOInputState;
    onChange: (newData: LBOInputState) => void;
}

export const LBOStep3_TaxCovenants: React.FC<LBOStep3Props> = ({ data, onChange }) => {

    const updateField = (field: keyof LBOInputState, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-white/10 pb-2">Step 3: Covenants & Tax</h3>

            {/* COVENANTS */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Financial Covenants</h4>
                    <button type="button" onClick={() => {
                        const newCov: CovenantRule = { covenant_type: 'max_debt_ebitda', limit: 6.0, start_year: 1, end_year: 5 };
                        updateField('covenants', [...(data.covenants || []), newCov]);
                    }} className="text-sm text-system-blue font-medium flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-2 py-1 rounded-lg">
                        <Plus size={16} /> Add Covenant
                    </button>
                </div>

                {(data.covenants || []).map((cov, idx) => (
                    <div key={idx} className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 relative flex gap-4 items-end">
                        <button type="button" onClick={() => updateField('covenants', data.covenants?.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                        </button>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Type</label>
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
            <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-4">Tax Optimization</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Loss Carryforwards (NOL)</h5>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
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
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Deductibility</h5>
                        <EnhancedFormInput
                            label="Interest Deductibility Cap (% EBITDA)"
                            type="number" step="1"
                            value={(data.tax_assumptions?.interest_deductibility_cap || 0.3) * 100}
                            onChange={(e) => {
                                const currentTax = data.tax_assumptions || { enable_nol: false, initial_nol_balance: 0, nol_annual_limit: 0.8 };
                                updateField('tax_assumptions', { ...currentTax, interest_deductibility_cap: parseFloat(e.target.value) / 100 } as TaxConfig);
                            }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave 0 for no cap (Section 163(j) defaults to 30%)</p>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-white/10">
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Asset Step-Up (Section 338(h)(10))</h5>
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
    );
};
