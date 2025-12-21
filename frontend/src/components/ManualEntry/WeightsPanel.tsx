import React from 'react';

interface WeightsPanelProps {
    weights: Record<string, number>;
    onChange: (method: string, value: number) => void;
}

export const WeightsPanel: React.FC<WeightsPanelProps> = ({ weights, onChange }) => {
    return (
        <div className="glass-panel p-8 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Valuation Method Weights</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Assign weights to each valuation method. The total should ideally sum to 1.0 (100%), but the system will normalize it automatically.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(weights).map(([method, weight]) => (
                    <div key={method} className="bg-white/40 dark:bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 capitalize flex justify-between">
                            <span>{method.replace('_', ' ').toUpperCase()} Weight (%)</span>
                            <span className="text-system-blue font-bold">{(Number(weight) * 100).toFixed(0)}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={weight as number}
                            onChange={(e) => onChange(method, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-system-blue"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
