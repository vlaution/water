import React from 'react';

interface MethodValue {
    name: string;
    value: number;
    weight: number;
    color: string;
}

interface MethodBreakdownProps {
    methods: MethodValue[];
}

export const MethodBreakdown: React.FC<MethodBreakdownProps> = ({ methods }) => {
    const maxValue = Math.max(...methods.map(m => m.value));

    return (
        <div className="glass-panel p-6 h-full">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">Comparative Method Breakdown</h3>

            <div className="space-y-5">
                {methods.map((method) => (
                    <div key={method.name} className="group">
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{method.name}</span>
                            <div className="text-right">
                                <span className="font-bold text-gray-900 dark:text-white block">
                                    ${(method.value / 1000000).toFixed(1)}M
                                </span>
                            </div>
                        </div>

                        <div className="relative h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${method.color}`}
                                style={{ width: `${(method.value / maxValue) * 100}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-end mt-1">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-100 dark:border-white/10">
                                Weight: {method.weight}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
