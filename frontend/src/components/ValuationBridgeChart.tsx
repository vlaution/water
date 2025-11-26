import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface ValuationBridgeChartProps {
    enterpriseValue: number;
    netDebt: number;
    equityValue: number;
}

export const ValuationBridgeChart: React.FC<ValuationBridgeChartProps> = ({ enterpriseValue, netDebt, equityValue }) => {
    const data = [
        {
            name: 'Enterprise Value',
            value: enterpriseValue,
            start: 0,
            end: enterpriseValue,
            color: '#3b82f6' // blue-500
        },
        {
            name: 'Net Debt',
            value: -netDebt,
            start: enterpriseValue,
            end: enterpriseValue - netDebt,
            color: '#ef4444' // red-500
        },
        {
            name: 'Equity Value',
            value: equityValue,
            start: 0,
            end: equityValue,
            color: '#10b981' // green-500
        }
    ];

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/90 p-3 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm">
                    <p className="font-medium text-gray-900">{data.name}</p>
                    <p className="text-sm text-gray-600">
                        ${(Math.abs(data.value) / 1000000).toFixed(1)}M
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <ReferenceLine y={0} stroke="#9ca3af" />
                    <Bar dataKey="end" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
