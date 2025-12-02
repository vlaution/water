import React from 'react';


interface FinanceViewProps {
    data: any;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ data }) => {
    if (!data) return <div>Loading...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6">
                    <p className="text-sm text-gray-500 font-medium">Enterprise Value</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        ${(data.enterprise_value / 1000000).toFixed(1)}M
                    </h3>
                </div>
                <div className="glass-panel p-6">
                    <p className="text-sm text-gray-500 font-medium">Equity Value</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        ${(data.equity_value / 1000000).toFixed(1)}M
                    </h3>
                </div>
                <div className="glass-panel p-6">
                    <p className="text-sm text-gray-500 font-medium">WACC</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        {(data.wacc * 100).toFixed(1)}%
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Multiples</h3>
                    <div className="space-y-4">
                        {Object.entries(data.multiples).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 font-medium">{key}</span>
                                <span className="text-gray-900 font-bold">{(value as number).toFixed(1)}x</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Benchmarks</h3>
                    {/* Simplified benchmark display */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Revenue Growth (vs Peers)</span>
                            <span className="text-green-600 font-medium">+5.2%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">EBITDA Margin (vs Peers)</span>
                            <span className="text-red-500 font-medium">-2.1%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
