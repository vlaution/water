import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area
} from 'recharts';

interface TrendChartProps {
    data: {
        year: string;
        ebitda: number;
        cashFlow: number;
    }[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    const formatYAxis = (value: number) => {
        return `$${(value / 1000000).toFixed(0)}M`;
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-gray-900">EBITDA + Cash Flow Projection</h3>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-system-blue"></span> EBITDA
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-system-green"></span> Cash Flow
                    </span>
                </div>
            </div>

            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                            <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#007AFF" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.3)" />
                        <XAxis
                            dataKey="year"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, '']}
                        />
                        <Line
                            type="monotone"
                            dataKey="ebitda"
                            stroke="#007AFF"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#007AFF', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="cashFlow"
                            stroke="#34C759"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#34C759', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
