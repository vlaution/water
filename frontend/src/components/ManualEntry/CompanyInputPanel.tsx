import React from 'react';
import { apiFetch } from '../../config/api';

interface CompanyInputPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    token?: string | null;
}

export const CompanyInputPanel: React.FC<CompanyInputPanelProps> = ({ formData, setFormData, token }) => {
    return (
        <div className="glass-panel p-5">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Company Name</label>
            <input
                value={formData.company_name}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, company_name: e.target.value }))}
                className="glass-input w-full text-lg font-semibold mb-4"
                placeholder="Enter Name..."
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Ticker</label>
                    <div className="relative">
                        <input
                            value={formData.ticker}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                            className="glass-input w-full font-mono font-bold pr-8"
                            placeholder="TICKER"
                        />
                        <button
                            onClick={async () => {
                                if (!formData.ticker) return;
                                try {
                                    const res = await apiFetch(`/api/financials/${formData.ticker}`, {}, token);
                                    if (res.ok) {
                                        const data = await res.json();
                                        setFormData((prev: any) => ({
                                            ...prev,
                                            company_name: data.company_name || prev.company_name,
                                            beta: data.beta || prev.beta,
                                            cost_of_debt: data.cost_of_debt || prev.cost_of_debt,
                                            tax_rate: data.tax_rate || prev.tax_rate,
                                            dcf_input: {
                                                ...prev.dcf_input,
                                                historical: {
                                                    ...prev.dcf_input.historical,
                                                    // Convert raw values to Millions ($M)
                                                    revenue: (data.revenue || []).map((v: number) => v / 1000000),
                                                    ebitda: (data.ebitda || []).map((v: number) => v / 1000000),
                                                    ebit: (data.ebit || []).map((v: number) => v / 1000000),
                                                    net_income: (data.net_income || []).map((v: number) => v / 1000000),
                                                    capex: (data.capex || []).map((v: number) => v / 1000000),
                                                    nwc: (data.nwc || []).map((v: number) => v / 1000000),
                                                    years: data.years || prev.dcf_input.historical.years
                                                },
                                                net_debt: (data.net_debt || 0) / 1000000,
                                                shares_outstanding: (data.shares_outstanding || 0) / 1000000 // Shares also in Millions usually? Or kept raw? Let's stick to M for consistency or explicit label.
                                                // Actually shares are usually in Millions too for EPS. Let's assume M.
                                            }
                                        }));
                                    }
                                } catch (e) {
                                    console.error("Failed to fetch financials", e);
                                }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                            title="Auto-fill Financials"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Exchange</label>
                    <input
                        className="glass-input w-full"
                        placeholder="NASDAQ"
                        readOnly
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                    <select
                        value={formData.currency}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, currency: e.target.value }))}
                        className="glass-input w-full text-sm py-1.5"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fiscal Year</label>
                    <input
                        value={formData.fiscal_year_end}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, fiscal_year_end: e.target.value }))}
                        placeholder="Dec 31"
                        className="glass-input w-full text-sm py-1.5"
                    />
                </div>
            </div>
        </div>
    );
};
