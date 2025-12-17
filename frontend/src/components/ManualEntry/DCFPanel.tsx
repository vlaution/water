import React from 'react';
import { EnhancedFormInput } from '../common/EnhancedFormInput';

interface DCFPanelProps {
    mode: 'dcf' | 'fcfe';
    data: any;
    onChange: (field: string, value: any) => void;
    // Special handlers for nested updates if needed
    onUpdateProjection: (field: string, value: string) => void;
    onUpdateDebts?: (index: number, field: string, value: string) => void;
}

export const DCFPanel: React.FC<DCFPanelProps> = ({ mode, data, onChange, onUpdateProjection, onUpdateDebts }) => {

    return (
        <div className="glass-panel p-8 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <span className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </span>
                {mode === 'dcf' ? 'Discounted Cash Flow (Unlevered)' : 'Free Cash Flow to Equity (Levered)'}
            </h3>

            {/* General Assumptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10 pb-2">Growth & Margins</h4>
                    <EnhancedFormInput
                        label="Revenue Growth (Year 1)"
                        type="number"
                        step="0.01"
                        value={data.projections.revenue_growth_start}
                        onChange={(e) => onUpdateProjection('revenue_growth_start', e.target.value)}
                        showBadge={false}
                    />
                    <EnhancedFormInput
                        label="Revenue Growth (Terminal)"
                        type="number"
                        step="0.01"
                        value={data.projections.revenue_growth_end}
                        onChange={(e) => onUpdateProjection('revenue_growth_end', e.target.value)}
                        showBadge={false}
                    />
                    <EnhancedFormInput
                        label="EBITDA Margin (Year 1)"
                        type="number"
                        step="0.01"
                        value={data.projections.ebitda_margin_start}
                        onChange={(e) => onUpdateProjection('ebitda_margin_start', e.target.value)}
                        showBadge={false}
                    />
                    <EnhancedFormInput
                        label="EBITDA Margin (Terminal)"
                        type="number"
                        step="0.01"
                        value={data.projections.ebitda_margin_end}
                        onChange={(e) => onUpdateProjection('ebitda_margin_end', e.target.value)}
                        showBadge={false}
                    />
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10 pb-2">Discount & Tax</h4>
                    <EnhancedFormInput
                        label={mode === 'dcf' ? "WACC / Discount Rate" : "Cost of Equity (Ke)"}
                        type="number"
                        step="0.01"
                        value={mode === 'dcf' ? data.projections.discount_rate : data.cost_of_equity}
                        onChange={(e) => mode === 'dcf'
                            ? onUpdateProjection('discount_rate', e.target.value)
                            : onChange('cost_of_equity', parseFloat(e.target.value))}
                        showBadge={true}
                    />
                    <EnhancedFormInput
                        label="Tax Rate"
                        type="number"
                        step="0.01"
                        value={data.projections.tax_rate}
                        onChange={(e) => onUpdateProjection('tax_rate', e.target.value)}
                        showBadge={false}
                    />
                    <EnhancedFormInput
                        label="Terminal Growth Rate (g)"
                        type="number"
                        step="0.01"
                        value={data.projections.terminal_growth_rate || data.terminal_growth_rate}
                        onChange={(e) => mode === 'dcf'
                            ? onUpdateProjection('terminal_growth_rate', e.target.value)
                            : onChange('terminal_growth_rate', parseFloat(e.target.value))}
                        showBadge={false}
                    />
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10 pb-2">Capital Structure</h4>
                    <EnhancedFormInput
                        label="Shares Outstanding"
                        type="number"
                        value={data.shares_outstanding}
                        onChange={(e) => onChange('shares_outstanding', parseFloat(e.target.value))}
                        showBadge={false}
                    />
                    {mode === 'dcf' && (
                        <EnhancedFormInput
                            label="Net Debt"
                            type="number"
                            value={data.net_debt}
                            onChange={(e) => onChange('net_debt', parseFloat(e.target.value))}
                            showBadge={false}
                        />
                    )}
                </div>
            </div>

            {/* FCFE Specific: Debt Schedule */}
            {mode === 'fcfe' && data.debt_schedule && onUpdateDebts && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Debt Schedule (Projected)</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Begin Debt</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Borrowing</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Repayment</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                {data.debt_schedule.map((yearDebt: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 text-sm text-gray-500">Y{idx + 1}</td>
                                        <td className="px-4 py-2"><input type="number" className="glass-input w-24 text-sm py-1" value={yearDebt.beginning_debt} onChange={(e) => onUpdateDebts(idx, 'beginning_debt', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input type="number" className="glass-input w-24 text-sm py-1" value={yearDebt.new_borrowing} onChange={(e) => onUpdateDebts(idx, 'new_borrowing', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input type="number" className="glass-input w-24 text-sm py-1" value={yearDebt.debt_repayment} onChange={(e) => onUpdateDebts(idx, 'debt_repayment', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input type="number" step="0.01" className="glass-input w-20 text-sm py-1" value={yearDebt.interest_rate} onChange={(e) => onUpdateDebts(idx, 'interest_rate', e.target.value)} /></td>
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
