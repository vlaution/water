import React from 'react';
import { Download, FileText, TrendingUp, DollarSign } from 'lucide-react';

interface FinancialYear {
    year: number;
    revenue: number;
    ebitda: number;
    ebit?: number;
    net_income: number;
    capex?: number;
    nwc?: number;
}

interface FinancialsViewProps {
    data: FinancialYear[];
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Financial Data Available</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2">
                    Detailed financial projections are not available for this run.
                </p>
            </div>
        );
    }

    const downloadCSV = () => {
        const headers = ['Metric', ...data.map(d => d.year)];
        const rows = [
            ['Revenue', ...data.map(d => d.revenue)],
            ['EBITDA', ...data.map(d => d.ebitda)],
            ['EBIT', ...data.map(d => d.ebit || 0)],
            ['Net Income', ...data.map(d => d.net_income)],
        ];

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial_projections.csv`;
        a.click();
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Income Statement Projections</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Projected financial performance (USD M)</p>
                    </div>
                </div>

                <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="glass-panel overflow-hidden border-white/20 dark:border-white/10 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md z-10 w-64">
                                    Metric
                                </th>
                                {data.map((item) => (
                                    <th key={item.year} className="px-6 py-4 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                        FY {item.year}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Revenue */}
                            <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white sticky left-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                                    Total Revenue
                                </td>
                                {data.map((item, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-700 dark:text-gray-300">
                                        {formatCurrency(item.revenue)}
                                    </td>
                                ))}
                            </tr>

                            {/* EBITDA */}
                            <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors bg-gray-50/20 dark:bg-gray-800/10">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white sticky left-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                                    EBITDA
                                </td>
                                {data.map((item, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(item.ebitda)}
                                    </td>
                                ))}
                            </tr>

                            {/* EBIT */}
                            <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-400 sticky left-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                                    EBIT (Operating Income)
                                </td>
                                {data.map((item, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400 italic">
                                        {formatCurrency(item.ebit || 0)}
                                    </td>
                                ))}
                            </tr>

                            {/* Net Income */}
                            <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors bg-blue-50/20 dark:bg-blue-500/5">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white sticky left-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t-2 border-blue-100 dark:border-blue-900/30">
                                    Net Income
                                </td>
                                {data.map((item, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-center font-black text-gray-900 dark:text-white border-t-2 border-blue-100 dark:border-blue-900/30">
                                        {formatCurrency(item.net_income)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 text-[10px] text-gray-400 flex justify-between items-center font-medium uppercase tracking-widest border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-green-500" />
                        All figures in USD Millions
                    </div>
                    <span>Proprietary Forecast Model</span>
                </div>
            </div>
        </div>
    );
};
