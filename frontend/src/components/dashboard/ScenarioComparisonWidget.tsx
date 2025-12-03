import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScenarioComparisonWidgetProps {
    scenarios: {
        base: number;
        bull: number;
        bear: number;
    };
}

export const ScenarioComparisonWidget: React.FC<ScenarioComparisonWidgetProps> = ({ scenarios }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: "compact",
        }).format(val);
    };

    const getDiff = (val: number, base: number) => {
        const diff = ((val - base) / base) * 100;
        return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
    };

    return (
        <div className="glass-panel p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Scenario Analysis</h3>

            <div className="space-y-4">
                {/* Bull Case */}
                <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Bull Case</p>
                            <p className="text-xs text-green-600 font-medium">{getDiff(scenarios.bull, scenarios.base)} vs Base</p>
                        </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(scenarios.bull)}</p>
                </div>

                {/* Base Case */}
                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <Minus className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Base Case</p>
                            <p className="text-xs text-blue-600 font-medium">Primary Scenario</p>
                        </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(scenarios.base)}</p>
                </div>

                {/* Bear Case */}
                <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Bear Case</p>
                            <p className="text-xs text-red-600 font-medium">{getDiff(scenarios.bear, scenarios.base)} vs Base</p>
                        </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(scenarios.bear)}</p>
                </div>
            </div>
        </div>
    );
};
