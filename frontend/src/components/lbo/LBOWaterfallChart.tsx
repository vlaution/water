import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrancheData {
    name: string;
    beginning_balance: number;
    interest: number;
    is_pik: boolean;
}

interface ScheduleItem {
    year: number;
    tranches: TrancheData[];
    total_debt_balance: number;
}

interface LBOWaterfallChartProps {
    schedule: ScheduleItem[];
}

export const LBOWaterfallChart: React.FC<LBOWaterfallChartProps> = ({ schedule }) => {
    // Transform data for Recharts
    // Recharts Stacked Bar needs data like: { year: 1, "Senior Debt": 100, "Mezzanine": 50 }

    if (!schedule || schedule.length === 0) return (
        <div className="h-64 flex items-center justify-center text-gray-500">
            No schedule data available
        </div>
    );

    const chartData = schedule.map(item => {
        const row: any = { year: `Year ${item.year}` };
        item.tranches.forEach(t => {
            row[t.name] = t.beginning_balance; // Or maybe ending balance? Using beginning for now as snapshot
        });
        return row;
    });

    // Extract unique tranche names for stacks
    const trancheNames = Array.from(new Set(schedule[0]?.tranches.map(t => t.name) || []));

    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

    return (
        <div className="w-full h-[400px] bg-white/50 rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Debt Paydown Profile</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, ""]}
                    />
                    <Legend iconType="circle" />
                    {trancheNames.map((name, index) => (
                        <Bar
                            key={name}
                            dataKey={name}
                            stackId="a"
                            fill={colors[index % colors.length]}
                            radius={index === trancheNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
