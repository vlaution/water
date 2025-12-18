import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

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
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Transform data for Recharts
    if (!schedule || schedule.length === 0) return (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No schedule data available
        </div>
    );

    const chartData = schedule.map(item => {
        const row: any = { year: `Year ${item.year}` };
        item.tranches.forEach(t => {
            row[t.name] = t.beginning_balance;
        });
        return row;
    });

    const trancheNames = Array.from(new Set(schedule[0]?.tranches.map(t => t.name) || []));

    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

    // Chart Theme Vars
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const axisTextColor = isDark ? "#9ca3af" : "#6b7280";
    const tooltipBg = isDark ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.9)";
    const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "none";
    const tooltipText = isDark ? "#f3f4f6" : "#1f2937";

    return (
        <div className="w-full h-[400px] bg-white/50 dark:bg-white/5 rounded-xl p-4 border border-white/20 dark:border-white/10 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Debt Paydown Profile</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: axisTextColor, fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: axisTextColor, fontSize: 12 }}
                        tickFormatter={(val) => `$${val}M`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: tooltipBg,
                            borderRadius: '12px',
                            border: tooltipBorder,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: tooltipText
                        }}
                        itemStyle={{ color: tooltipText }}
                        labelStyle={{ color: tooltipText, marginBottom: '0.5rem', fontWeight: 600 }}
                        formatter={(value: number) => [`$${value.toFixed(1)}M`, ""]}
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
