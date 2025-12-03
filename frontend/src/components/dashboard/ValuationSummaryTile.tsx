import React from 'react';
import { DollarSign, PieChart } from 'lucide-react';

interface ValuationSummaryTileProps {
    data: {
        enterprise_value: number;
        equity_value: number;
        method_weights: Record<string, number>;
    };
}

export const ValuationSummaryTile: React.FC<ValuationSummaryTileProps> = ({ data }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: "compact",
            compactDisplay: "short"
        }).format(val);
    };

    return (
        <div className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-24 h-24" />
            </div>

            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Valuation Summary</h3>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Enterprise Value</p>
                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                        {formatCurrency(data.enterprise_value)}
                    </h2>
                </div>
                <div>
                    <p className="text-sm text-gray-500 mb-1">Equity Value</p>
                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                        {formatCurrency(data.equity_value)}
                    </h2>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <PieChart className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Methodology Weights</span>
                </div>
                <div className="flex gap-2 h-2 rounded-full overflow-hidden bg-gray-100">
                    {Object.entries(data.method_weights).map(([method, weight], idx) => {
                        if (weight === 0) return null;
                        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-indigo-500'];
                        return (
                            <div
                                key={method}
                                style={{ width: `${weight * 100}%` }}
                                className={`${colors[idx % colors.length]}`}
                                title={`${method.toUpperCase()}: ${(weight * 100).toFixed(0)}%`}
                            />
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                    {Object.entries(data.method_weights).map(([method, weight], idx) => {
                        if (weight === 0) return null;
                        const colors = ['text-blue-500', 'text-purple-500', 'text-green-500', 'text-amber-500', 'text-indigo-500'];
                        return (
                            <div key={method} className="flex items-center gap-1 text-xs text-gray-500">
                                <div className={`w-2 h-2 rounded-full ${colors[idx % colors.length].replace('text-', 'bg-')}`} />
                                <span className="uppercase">{method}</span>
                                <span className="font-medium">{(weight * 100).toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
