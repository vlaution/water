import React, { useState, useEffect } from 'react';

interface InputReviewProps {
    inputs: any;
    onUpdate?: (data: any) => void;
}

export const InputReview: React.FC<InputReviewProps> = ({ inputs, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'financials' | 'wacc' | 'results'>('financials');
    const [localData, setLocalData] = useState<any>(inputs);

    useEffect(() => {
        setLocalData(inputs);
    }, [inputs]);

    if (!localData) return <div className="text-gray-500">No data available.</div>;

    const { financials, wacc_metrics, valuation_results, company_name, valuation_date } = localData;

    const handleUpdate = (newData: any) => {
        setLocalData(newData);
        if (onUpdate) {
            onUpdate(newData);
        }
    };

    const handleFinancialChange = (index: number, field: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const newFinancials = [...financials];
        newFinancials[index] = { ...newFinancials[index], [field]: numValue };
        handleUpdate({ ...localData, financials: newFinancials });
    };

    const handleWaccChange = (field: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const newWacc = { ...wacc_metrics, [field]: numValue };
        handleUpdate({ ...localData, wacc_metrics: newWacc });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Metadata Header */}
            <div className="glass-panel p-6 flex justify-between items-center bg-white/40 dark:bg-gray-800/40 border-white/40 dark:border-white/10">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">Target Entity</h3>
                    <input
                        className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 rounded px-1 -ml-1 w-full outline-none"
                        value={company_name || ''}
                        onChange={(e) => handleUpdate({ ...localData, company_name: e.target.value })}
                    />
                </div>
                <div className="text-right">
                    <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">Model Date</h3>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{valuation_date}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                {(['financials', 'wacc', 'results'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                            ? 'bg-system-blue text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                            }`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="glass-panel p-6 bg-white/60 dark:bg-gray-800/60 border-white/60 dark:border-white/10 min-h-[400px]">
                {activeTab === 'financials' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white">Financial Projections</h4>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full font-bold">EDITABLE</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">Metric (USD M)</th>
                                        {financials?.map((f: any) => (
                                            <th key={f.year} className="px-6 py-3 font-bold text-gray-700 dark:text-gray-300">{f.year}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">Revenue</td>
                                        {financials?.map((f: any, i: number) => (
                                            <td key={i} className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    className="w-24 bg-blue-50/30 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 focus:border-system-blue focus:ring-0 text-sm font-semibold rounded px-1 transition-all text-gray-900 dark:text-white"
                                                    value={f.revenue}
                                                    onChange={(e) => handleFinancialChange(i, 'revenue', e.target.value)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">EBITDA</td>
                                        {financials?.map((f: any, i: number) => (
                                            <td key={i} className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    className="w-24 bg-blue-50/30 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 focus:border-system-blue focus:ring-0 text-sm font-semibold rounded px-1 transition-all text-gray-900 dark:text-white"
                                                    value={f.ebitda}
                                                    onChange={(e) => handleFinancialChange(i, 'ebitda', e.target.value)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">Net Income</td>
                                        {financials?.map((f: any, i: number) => (
                                            <td key={i} className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    className="w-24 bg-blue-50/30 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 focus:border-system-blue focus:ring-0 text-sm font-semibold rounded px-1 transition-all text-gray-900 dark:text-white"
                                                    value={f.net_income}
                                                    onChange={(e) => handleFinancialChange(i, 'net_income', e.target.value)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'wacc' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xl font-bold text-gray-800 dark:text-white">WACC Assumptions</h4>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full font-bold">EDITABLE</span>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Risk Free Rate', field: 'risk_free_rate', value: wacc_metrics?.risk_free_rate, percent: true },
                                    { label: 'Beta (Adjusted)', field: 'beta', value: wacc_metrics?.beta, percent: false },
                                    { label: 'Equity Risk Premium', field: 'equity_risk_premium', value: wacc_metrics?.equity_risk_premium, percent: true },
                                    { label: 'Cost of Equity', field: 'cost_of_equity', value: wacc_metrics?.cost_of_equity, percent: true },
                                    { label: 'Weighted Average Cost of Capital', field: 'wacc', value: wacc_metrics?.wacc, percent: true, highlight: true }
                                ].map((item, i) => (
                                    <div key={i} className={`flex justify-between items-center p-4 rounded-xl ${item.highlight ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                        <span className={`text-sm ${item.highlight ? 'font-bold text-blue-900 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                className={`w-28 text-right bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:border-system-blue focus:ring-0 text-sm font-bold ${item.highlight ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                                                value={item.value}
                                                onChange={(e) => handleWaccChange(item.field, e.target.value)}
                                            />
                                            {item.percent && <span className="text-xs opacity-50 font-bold dark:text-gray-500">Dec</span>}
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">* Use decimals (e.g. 0.05 for 5%) for rates.</p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                            <p className="text-sm font-medium opacity-80 mb-2 uppercase tracking-widest">Effective WACC</p>
                            <p className="text-7xl font-black">{(wacc_metrics?.wacc * 100).toFixed(1)}%</p>
                            <p className="text-xs mt-6 max-w-[240px] text-center opacity-70 leading-relaxed font-medium">This rate is automatically synchronized with your edits above and will be used for DCF discounting.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="space-y-6">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-white">Parsed Valuation Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {valuation_results?.map((res: any, i: number) => (
                                <div key={i} className="glass-panel p-5 bg-white/40 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:border-system-blue/30 transition-all cursor-default group">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-tighter">{res.approach}</span>
                                        <h5 className="font-bold text-gray-900 dark:text-white text-lg mt-1 group-hover:text-system-blue dark:group-hover:text-blue-400 transition-colors">{res.method}</h5>
                                    </div>
                                    <div className="mt-8">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Enterprise Value</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">${Math.round(res.enterprise_value || 0).toLocaleString()}</p>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">MODEL WEIGHT</span>
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{(res.weight * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
