import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SensitivityMatrix } from '../SensitivityMatrix';

interface StrategyViewProps {
    data: any;
}

export const StrategyView: React.FC<StrategyViewProps> = ({ data }) => {
    if (!data) return <div>Loading...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.scenarios.map((scenario: any, idx: number) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-xl">
                            <h4 className="font-medium text-gray-900 capitalize">{scenario.name}</h4>
                            <p className="text-2xl font-bold text-system-blue mt-2">
                                ${(scenario.enterprise_value / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Probability: {(scenario.probability * 100).toFixed(0)}%</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Alerts</h3>
                    <div className="space-y-3">
                        {data.strategic_alerts.map((alert: any, idx: number) => (
                            <div key={idx} className={`p-3 rounded-lg flex gap-3 ${alert.severity === 'high' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                                }`}>
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 border-white/20 dark:border-white/10 ring-1 ring-black/5 shadow-xl">
                    <SensitivityMatrix
                        data={data.sensitivity_data || {}}
                        baseValue={data.enterprise_value}
                    />
                </div>
            </div>
        </div>
    );
};
