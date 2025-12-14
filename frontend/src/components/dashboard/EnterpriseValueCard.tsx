import React from 'react';

interface EnterpriseValueCardProps {
    value: number;
    medianValue?: number;
    currency?: string;
}

export const EnterpriseValueCard: React.FC<EnterpriseValueCardProps> = ({
    value,
    medianValue,
    currency = '$'
}) => {
    const formattedValue = (val: number) => {
        if (!val) return '-';
        return `${currency}${(val / 1000000).toFixed(1)}M`;
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-system-blue/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-system-blue/20"></div>

            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Enterprise Value</h3>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight break-all">
                        {formattedValue(value)}
                    </span>
                    <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Weighted Avg</span>
                </div>
            </div>

            {medianValue && (
                <div className="mt-4 pt-4 border-t border-white/30 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Median Estimate</span>
                    <span className="text-lg font-semibold text-gray-700">{formattedValue(medianValue)}</span>
                </div>
            )}

            <div className="mt-2">
                <div className="w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-system-blue h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>Low</span>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
};
