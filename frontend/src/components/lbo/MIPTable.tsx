import React from 'react';
import { Users, Info } from 'lucide-react';

interface MIPTableProps {
    returnsAnalysis: any;
    mipConfig: any;
}

export const MIPTable: React.FC<MIPTableProps> = ({ returnsAnalysis, mipConfig }) => {
    if (!mipConfig) return null;

    const exitEquity = returnsAnalysis.exit_equity;
    const poolPercent = mipConfig.option_pool_percent;
    const mipValue = exitEquity * poolPercent; // Simplified, in reality strike price matters
    const netLPEquity = exitEquity - mipValue; // Gross simplification for display

    // In our backend logic, we subtracted MIP from Profit logic, but here we show the breakdown of Exit Equity

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                    <Users size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Management Incentive Plan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Equity Pool & Dilution Analysis</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Option Pool Size</span>
                        <div className="group relative">
                            <Info size={14} className="text-gray-400 cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 dark:bg-black text-white text-xs rounded hidden group-hover:block z-10 border border-gray-700">
                                Allocated % of Exit Equity for Management
                            </div>
                        </div>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{(poolPercent * 100).toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Gross Exit Equity</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(exitEquity)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-500/20">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">MIP Value (Mgmt)</span>
                    </div>
                    <span className="font-bold text-orange-700 dark:text-orange-300">{formatCurrency(mipValue)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Net LP Equity</span>
                    </div>
                    <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(netLPEquity)}</span>
                </div>
            </div>
        </div>
    );
};
