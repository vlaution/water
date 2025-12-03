import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ValuationBreakdownChartProps {
    data: Record<string, number>;
}

export const ValuationBreakdownChart: React.FC<ValuationBreakdownChartProps> = ({ data }) => {
    const chartData = Object.entries(data).map(([method, value]) => ({
        method: method.toUpperCase(),
        value: value,
    })).filter(item => item.value > 0);

    const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#6366F1'];

    return (
        <div className="glass-panel p-6 h-full">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Valuation Breakdown</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="method"
                            type="category"
                            tick={{ fontSize: 10, fontWeight: 600 }}
                            width={50}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, 'Value']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
