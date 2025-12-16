import React from 'react';
import { TrendingUp, DollarSign, Percent, PieChart } from 'lucide-react';

interface ReturnsAnalysisProps {
    data: {
        moic: number;
        irr: number;
        entry_equity: number;
        exit_equity: number;
        profit: number;
        gp_carry?: number;
        lp_profit?: number;
        lp_moic?: number;
        // Detailed Waterfall
        dist_capital?: number;
        dist_pref?: number;
        gp_catchup?: number;
        dist_carry?: number;
        hurdle_rate?: number;
    };
}

export const ReturnsAnalysisTable: React.FC<ReturnsAnalysisProps> = ({ data }) => {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: "compact" }).format(val);

    const formatPercent = (val: number) =>
        (val * 100).toFixed(1) + '%';

    return (
        <div className="bg-white/50 border border-white/20 rounded-xl p-6 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Returns Analysis</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-500 mb-1">MoIC</div>
                    <div className="text-2xl font-bold text-system-blue flex items-center gap-1">
                        {data.moic.toFixed(2)}x
                        <TrendingUp size={16} />
                    </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-500 mb-1">IRR</div>
                    <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
                        {formatPercent(data.irr)}
                        <Percent size={16} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Invested Capital</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(data.entry_equity)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <PieChart size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Exit Equity Value</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(data.exit_equity)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg border-t-2 border-green-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <TrendingUp size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Net Profit</span>
                    </div>
                    <span className="font-bold text-green-600">+{formatCurrency(data.profit)}</span>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Waterfall Distribution</h4>

                    {(data.dist_pref !== undefined && data.gp_catchup !== undefined) && (
                        <div className="space-y-2 mb-3 pb-3 border-b border-gray-50 bg-gray-50/50 p-2 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">1. Return of Capital</span>
                                <span className="text-xs font-medium">{formatCurrency(data.dist_capital || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">2. Pref Return ({(data.hurdle_rate || 0.08) * 100}%)</span>
                                <span className="text-xs font-medium">{formatCurrency(data.dist_pref || 0)}</span>
                            </div>
                            {(data.gp_catchup || 0) > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-purple-600 font-medium">3. GP Catch-up</span>
                                    <span className="text-xs font-medium text-purple-700">{formatCurrency(data.gp_catchup || 0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">4. Carried Interest</span>
                                <span className="text-xs font-medium">{formatCurrency(data.dist_carry || 0)}</span>
                            </div>
                        </div>
                    )}

                    {/* GP Carry Total */}
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Total GP Carry</span>
                        <span className="text-sm font-medium text-gray-800">{formatCurrency(data.gp_carry || 0)}</span>
                    </div>
                    {/* LP Profit */}
                    <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                        <span className="text-sm font-medium text-blue-800">Net LP Profit</span>
                        <span className="text-sm font-bold text-blue-800">{formatCurrency(data.lp_profit || 0)}</span>
                    </div>
                    {/* LP MOIC */}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">Net LP MOIC</span>
                        <span className="text-xs font-bold text-gray-700">{data.lp_moic ? data.lp_moic.toFixed(2) : '0.00'}x</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
