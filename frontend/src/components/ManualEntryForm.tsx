import React, { useState } from 'react';

interface ManualEntryFormProps {
    onSubmit: (data: any) => void;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSubmit }) => {
    const [activeMethod, setActiveMethod] = useState<'dcf' | 'gpc' | 'fcfe' | 'precedent' | 'anav' | 'weights'>('dcf');
    const [formData, setFormData] = useState<{
        company_name: string;
        currency: string;
        dcf_input: any;
        gpc_input: any;
        dcfe_input: any;
        precedent_transactions_input: any;
        anav_input: {
            assets: Record<string, number>;
            liabilities: Record<string, number>;
            adjustments: Record<string, number>;
        };
        sensitivity_analysis: any;
        method_weights: any;
    }>({
        company_name: "New Company",
        currency: "USD",
        dcf_input: {
            historical: {
                years: [2020, 2021, 2022],
                revenue: [100, 110, 120],
                ebitda: [20, 22, 25],
                ebit: [15, 17, 20],
                net_income: [10, 12, 15],
                capex: [5, 5, 6],
                nwc: [2, 2, 3]
            },
            projections: {
                revenue_growth_start: 0.05,
                revenue_growth_end: 0.03,
                ebitda_margin_start: 0.20,
                ebitda_margin_end: 0.22,
                tax_rate: 0.25,
                discount_rate: 0.10,
                terminal_growth_rate: 0.02,
                terminal_exit_multiple: 12.0,
                depreciation_rate: 0.03,
                working_capital: {
                    dso: 45,
                    dio: 60,
                    dpo: 30
                }
            },
            shares_outstanding: 1000000,
            net_debt: 5000000
        },
        gpc_input: {
            target_ticker: "TARGET",
            peer_tickers: ["PEER1", "PEER2"],
            metrics: {
                "LTM Revenue": 120,
                "LTM EBITDA": 25
            }
        },
        dcfe_input: {
            historical: {
                years: [2020, 2021, 2022],
                revenue: [100, 110, 120],
                ebitda: [20, 22, 25],
                ebit: [15, 17, 20],
                net_income: [10, 12, 15],
                capex: [5, 5, 6],
                nwc: [2, 2, 3]
            },
            projections: {
                revenue_growth_start: 0.05,
                revenue_growth_end: 0.03,
                ebitda_margin_start: 0.20,
                ebitda_margin_end: 0.22,
                tax_rate: 0.25,
                discount_rate: 0.10,
                terminal_growth_rate: 0.025
            },
            debt_schedule: [
                { beginning_debt: 50, new_borrowing: 10, debt_repayment: 5, interest_rate: 0.05 },
                { beginning_debt: 55, new_borrowing: 5, debt_repayment: 5, interest_rate: 0.05 },
                { beginning_debt: 55, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 },
                { beginning_debt: 45, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 },
                { beginning_debt: 35, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 }
            ],
            cost_of_equity: 0.12,
            terminal_growth_rate: 0.025,
            shares_outstanding: 1000000
        },
        precedent_transactions_input: {
            transactions: [
                {
                    target_name: "Company A",
                    acquirer_name: "Buyer 1",
                    announcement_date: "2023-01-15",
                    deal_value: 500,
                    revenue: 200,
                    ebitda: 50
                },
                {
                    target_name: "Company B",
                    acquirer_name: "Buyer 2",
                    announcement_date: "2023-03-20",
                    deal_value: 800,
                    revenue: 300,
                    ebitda: 80
                }
            ],
            target_revenue: 220,
            target_ebitda: 55,
            use_median: true
        },
        anav_input: {
            assets: { "Cash": 10, "Inventory": 20, "PP&E": 100 },
            liabilities: { "Debt": 50, "Payables": 10 },
            adjustments: { "PP&E": 20, "Inventory": -5 }
        },
        sensitivity_analysis: {
            variable_1: "discount_rate",
            range_1: [0.08, 0.10, 0.12],
            variable_2: "terminal_growth_rate",
            range_2: [0.01, 0.02, 0.03]
        },
        method_weights: {
            dcf: 0.4,
            fcfe: 0.0,
            gpc: 0.3,
            precedent: 0.3,
            anav: 0.0,
            lbo: 0.0
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const updateProjection = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: {
                    ...prev.dcf_input.projections,
                    [field]: parseFloat(value)
                }
            }
        }));
    };

    const updateWorkingCapital = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: {
                    ...prev.dcf_input.projections,
                    working_capital: {
                        ...prev.dcf_input.projections.working_capital,
                        [field]: parseFloat(value)
                    }
                }
            }
        }));
    };

    const updateFCFEProjection = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcfe_input: {
                ...prev.dcfe_input,
                projections: {
                    ...prev.dcfe_input.projections,
                    [field]: parseFloat(value)
                }
            }
        }));
    };

    const updateDebtSchedule = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcfe_input: {
                ...prev.dcfe_input,
                debt_schedule: prev.dcfe_input.debt_schedule.map((debt: any, i: number) =>
                    i === index ? { ...debt, [field]: parseFloat(value) } : debt
                )
            }
        }));
    };

    return (
        <div className="max-w-6xl mx-auto mt-10 animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Method Selection Tabs */}
                <div className="glass-panel p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Select Valuation Method</h2>
                    <div className="flex space-x-2 bg-gray-100/50 backdrop-blur-md p-1.5 rounded-xl w-fit overflow-x-auto border border-white/20">
                        {['dcf', 'fcfe', 'gpc', 'precedent', 'anav', 'weights'].map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setActiveMethod(method as any)}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeMethod === method
                                        ? 'bg-white text-gray-900 shadow-sm scale-100'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-white/30'
                                    }`}
                            >
                                {method === 'dcf' ? 'DCF (FCFF)' :
                                    method === 'fcfe' ? 'DCF (FCFE)' :
                                        method === 'precedent' ? 'Precedent Txns' :
                                            method === 'anav' ? 'ANAV' :
                                                method.toUpperCase().replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DCF Form */}
                {activeMethod === 'dcf' && (
                    <div className="glass-panel p-8 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">DCF Assumptions (FCFF)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Discount Rate (WACC)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.discount_rate}
                                    onChange={(e) => updateProjection('discount_rate', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Terminal Growth Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.terminal_growth_rate}
                                    onChange={(e) => updateProjection('terminal_growth_rate', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Tax Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.tax_rate}
                                    onChange={(e) => updateProjection('tax_rate', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Exit Multiple (EV/EBITDA)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.dcf_input.projections.terminal_exit_multiple}
                                    onChange={(e) => updateProjection('terminal_exit_multiple', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Depreciation Rate (% of Rev)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.depreciation_rate}
                                    onChange={(e) => updateProjection('depreciation_rate', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        <h4 className="font-semibold text-gray-800 mb-4 mt-8 flex items-center gap-2">
                            <span className="w-1 h-4 bg-system-blue rounded-full"></span>
                            Working Capital Assumptions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">DSO (Days Sales Outstanding)</label>
                                <input
                                    type="number"
                                    value={formData.dcf_input.projections.working_capital.dso}
                                    onChange={(e) => updateWorkingCapital('dso', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">DIO (Days Inventory Outstanding)</label>
                                <input
                                    type="number"
                                    value={formData.dcf_input.projections.working_capital.dio}
                                    onChange={(e) => updateWorkingCapital('dio', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">DPO (Days Payable Outstanding)</label>
                                <input
                                    type="number"
                                    value={formData.dcf_input.projections.working_capital.dpo}
                                    onChange={(e) => updateWorkingCapital('dpo', e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* FCFE Form */}
                {activeMethod === 'fcfe' && (
                    <>
                        <div className="glass-panel p-8 animate-fade-in-up">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">DCF Assumptions (FCFE)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Cost of Equity</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.dcfe_input.cost_of_equity}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            dcfe_input: { ...prev.dcfe_input, cost_of_equity: parseFloat(e.target.value) }
                                        }))}
                                        className="glass-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Terminal Growth Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.dcfe_input.terminal_growth_rate}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            dcfe_input: { ...prev.dcfe_input, terminal_growth_rate: parseFloat(e.target.value) }
                                        }))}
                                        className="glass-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Tax Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.dcfe_input.projections.tax_rate}
                                        onChange={(e) => updateFCFEProjection('tax_rate', e.target.value)}
                                        className="glass-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-8 animate-fade-in-up">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Debt Schedule (5 Years)</h3>
                            <div className="overflow-x-auto rounded-xl border border-white/30">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-white/50 border-b border-white/30">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Year</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Beginning Debt</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">New Borrowing</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Repayment</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Interest Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/30">
                                        {formData.dcfe_input.debt_schedule.map((debt: any, index: number) => (
                                            <tr key={index} className="hover:bg-white/40">
                                                <td className="py-3 px-4 text-sm text-gray-600">Year {index + 1}</td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={debt.beginning_debt}
                                                        onChange={(e) => updateDebtSchedule(index, 'beginning_debt', e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={debt.new_borrowing}
                                                        onChange={(e) => updateDebtSchedule(index, 'new_borrowing', e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={debt.debt_repayment}
                                                        onChange={(e) => updateDebtSchedule(index, 'debt_repayment', e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={debt.interest_rate}
                                                        onChange={(e) => updateDebtSchedule(index, 'interest_rate', e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* GPC Form */}
                {activeMethod === 'gpc' && (
                    <div className="glass-panel p-8 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">GPC Inputs</h3>
                        <p className="text-gray-500 text-sm mb-4">Guideline Public Company multiples analysis</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">LTM Revenue</label>
                                <input
                                    type="number"
                                    value={formData.gpc_input.metrics["LTM Revenue"]}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        gpc_input: {
                                            ...prev.gpc_input,
                                            metrics: { ...prev.gpc_input.metrics, "LTM Revenue": parseFloat(e.target.value) }
                                        }
                                    }))}
                                    className="glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">LTM EBITDA</label>
                                <input
                                    type="number"
                                    value={formData.gpc_input.metrics["LTM EBITDA"]}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        gpc_input: {
                                            ...prev.gpc_input,
                                            metrics: { ...prev.gpc_input.metrics, "LTM EBITDA": parseFloat(e.target.value) }
                                        }
                                    }))}
                                    className="glass-input"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Precedent Transactions Form */}
                {activeMethod === 'precedent' && (
                    <div className="glass-panel p-8 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Precedent Transactions</h3>
                        <p className="text-gray-500 text-sm mb-6">Enter comparable M&A transactions</p>

                        {/* Target Company Metrics */}
                        <div className="mb-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h4 className="font-semibold text-gray-800 mb-4">Target Company Metrics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">LTM Revenue ($M)</label>
                                    <input
                                        type="number"
                                        value={formData.precedent_transactions_input.target_revenue}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            precedent_transactions_input: {
                                                ...prev.precedent_transactions_input,
                                                target_revenue: parseFloat(e.target.value)
                                            }
                                        }))}
                                        className="glass-input bg-white/80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">LTM EBITDA ($M)</label>
                                    <input
                                        type="number"
                                        value={formData.precedent_transactions_input.target_ebitda}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            precedent_transactions_input: {
                                                ...prev.precedent_transactions_input,
                                                target_ebitda: parseFloat(e.target.value)
                                            }
                                        }))}
                                        className="glass-input bg-white/80"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="overflow-x-auto rounded-xl border border-white/30">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/50 border-b border-white/30">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Target</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Acquirer</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Deal Value ($M)</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Revenue ($M)</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">EBITDA ($M)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/30">
                                    {formData.precedent_transactions_input.transactions.map((txn: any, index: number) => (
                                        <tr key={index} className="hover:bg-white/40">
                                            <td className="py-2 px-2">
                                                <input
                                                    type="text"
                                                    value={txn.target_name}
                                                    onChange={(e) => {
                                                        const newTxns = [...formData.precedent_transactions_input.transactions];
                                                        newTxns[index].target_name = e.target.value;
                                                        setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                    }}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="text"
                                                    value={txn.acquirer_name}
                                                    onChange={(e) => {
                                                        const newTxns = [...formData.precedent_transactions_input.transactions];
                                                        newTxns[index].acquirer_name = e.target.value;
                                                        setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                    }}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="date"
                                                    value={txn.announcement_date}
                                                    onChange={(e) => {
                                                        const newTxns = [...formData.precedent_transactions_input.transactions];
                                                        newTxns[index].announcement_date = e.target.value;
                                                        setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                    }}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="number"
                                                    value={txn.deal_value}
                                                    onChange={(e) => {
                                                        const newTxns = [...formData.precedent_transactions_input.transactions];
                                                        newTxns[index].deal_value = parseFloat(e.target.value);
                                                        setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                    }}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="number"
                                                    value={txn.revenue}
                                                    onChange={(e) => {
                                                        const newTxns = [...formData.precedent_transactions_input.transactions];
                                                        newTxns[index].revenue = parseFloat(e.target.value);
                                                        setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                    }}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="number"
                                                    value={txn.ebitda}
                                                    onChange={(e) => {
                                                        const newTxns = [...formData.precedent_transactions_input.transactions];
                                                        newTxns[index].ebitda = parseFloat(e.target.value);
                                                        setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                    }}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setFormData(prev => ({
                                    ...prev,
                                    precedent_transactions_input: {
                                        ...prev.precedent_transactions_input,
                                        transactions: [
                                            ...prev.precedent_transactions_input.transactions,
                                            {
                                                target_name: "New Company",
                                                acquirer_name: "Buyer",
                                                announcement_date: "2024-01-01",
                                                deal_value: 100,
                                                revenue: 50,
                                                ebitda: 10
                                            }
                                        ]
                                    }
                                }));
                            }}
                            className="mt-4 px-4 py-2 bg-blue-50 text-system-blue rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-100"
                        >
                            + Add Transaction
                        </button>
                    </div>
                )}

                {/* ANAV Form */}
                {activeMethod === 'anav' && (
                    <div className="glass-panel p-8 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Adjusted Net Asset Value (ANAV)</h3>
                        <p className="text-gray-500 text-sm mb-6">Enter book values and fair value adjustments</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Assets */}
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-system-green rounded-full"></span>
                                    Assets
                                </h4>
                                {Object.entries(formData.anav_input.assets).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between mb-3">
                                        <label className="text-sm text-gray-600">{key}</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={value as number}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    anav_input: {
                                                        ...prev.anav_input,
                                                        assets: { ...prev.anav_input.assets, [key]: parseFloat(e.target.value) }
                                                    }
                                                }))}
                                                className="w-24 px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 text-sm"
                                                placeholder="Book Value"
                                            />
                                            <input
                                                type="number"
                                                value={formData.anav_input.adjustments[key] || 0}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    anav_input: {
                                                        ...prev.anav_input,
                                                        adjustments: { ...prev.anav_input.adjustments, [key]: parseFloat(e.target.value) }
                                                    }
                                                }))}
                                                className="w-24 px-2 py-1.5 rounded-lg border border-blue-100 bg-blue-50/50 text-sm"
                                                placeholder="Adj (+/-)"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Liabilities */}
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-system-red rounded-full"></span>
                                    Liabilities
                                </h4>
                                {Object.entries(formData.anav_input.liabilities).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between mb-3">
                                        <label className="text-sm text-gray-600">{key}</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={value as number}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    anav_input: {
                                                        ...prev.anav_input,
                                                        liabilities: { ...prev.anav_input.liabilities, [key]: parseFloat(e.target.value) }
                                                    }
                                                }))}
                                                className="w-24 px-2 py-1.5 rounded-lg border border-white/30 bg-white/50 text-sm"
                                                placeholder="Book Value"
                                            />
                                            <input
                                                type="number"
                                                value={formData.anav_input.adjustments[key] || 0}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    anav_input: {
                                                        ...prev.anav_input,
                                                        adjustments: { ...prev.anav_input.adjustments, [key]: parseFloat(e.target.value) }
                                                    }
                                                }))}
                                                className="w-24 px-2 py-1.5 rounded-lg border border-blue-100 bg-blue-50/50 text-sm"
                                                placeholder="Adj (+/-)"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Weights Form */}
                {activeMethod === 'weights' && (
                    <div className="glass-panel p-8 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Valuation Method Weights</h3>
                        <p className="text-gray-500 text-sm mb-6">Assign weights to each valuation method. The total should ideally sum to 1.0 (100%), but the system will normalize it automatically.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(formData.method_weights).map(([method, weight]) => (
                                <div key={method} className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-sm">
                                    <label className="block text-sm font-medium text-gray-700 mb-4 capitalize flex justify-between">
                                        <span>{method.replace('_', ' ').toUpperCase()} Weight</span>
                                        <span className="text-system-blue font-bold">{(Number(weight) * 100).toFixed(0)}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={weight as number}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            method_weights: {
                                                ...prev.method_weights,
                                                [method]: parseFloat(e.target.value)
                                            }
                                        }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-system-blue"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="glass-button-primary px-8 py-3 text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        Calculate Valuation
                    </button>
                </div>
            </form>
        </div>
    );
};
