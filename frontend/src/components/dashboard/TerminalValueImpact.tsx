import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TerminalValueImpactProps {
    enterpriseValue: number;
    terminalValue?: number; // Optional, defaults to ~70% of EV if not provided
}

export const TerminalValueImpact: React.FC<TerminalValueImpactProps> = ({ enterpriseValue, terminalValue }) => {
    // If terminal value is not provided, assume a typical 70/30 split for display
    const tValue = terminalValue || (enterpriseValue * 0.7);
    const discreteValue = enterpriseValue - tValue;

    const data = [
        { name: 'Discrete Period', value: discreteValue },
        { name: 'Terminal Value', value: tValue },
    ];

    const COLORS = ['#34C759', '#007AFF']; // Green for Discrete, Blue for Terminal

    const formatCurrency = (value: number) => {
        return `$${(value / 1000000).toFixed(1)}M`;
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Terminal Value Impact</h3>

            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                    <div className="text-xs text-gray-500 font-medium">TV %</div>
                    <div className="text-xl font-bold text-gray-900">
                        {((tValue / enterpriseValue) * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    );
};
