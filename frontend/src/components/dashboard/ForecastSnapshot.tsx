import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ForecastSnapshotProps {
    data: {
        revenue: number[];
        ebitda: number[];
        fcf: number[];
    };
}

export const ForecastSnapshot: React.FC<ForecastSnapshotProps> = ({ data }) => {
    // Transform data for Recharts
    // Assuming data arrays are aligned by year
    const chartData = data.revenue.map((rev, idx) => ({
        year: `Y${idx + 1}`,
        Revenue: rev,
        EBITDA: data.ebitda[idx] || 0,
        FCF: data.fcf[idx] || 0
    }));

    return (
        <div className="glass-panel p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Financial Forecast</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val / 1000000}M`} />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="EBITDA" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="FCF" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
