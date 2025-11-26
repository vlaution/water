import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

interface SensitivityAnalysisChartProps {
    data?: {
        x_axis: { name: string; values: number[] };
        y_axis: { name: string; values: number[] };
        matrix: number[][];
    };
    baseValue: number;
}

export const SensitivityAnalysisChart: React.FC<SensitivityAnalysisChartProps> = ({ data, baseValue }) => {
    if (!data || !data.matrix || data.matrix.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                No sensitivity data available
            </div>
        );
    }

    const chartData = [];
    const rows = data.y_axis.values;
    const cols = data.x_axis.values;

    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < cols.length; j++) {
            const val = data.matrix[i][j];
            chartData.push({
                x: parseFloat((cols[j] * 100).toFixed(1)), // Convert to %
                y: parseFloat((rows[i] * 100).toFixed(1)), // Convert to %
                z: val,
                formattedValue: `$${(val / 1000000).toFixed(1)}M`
            });
        }
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-white/90 p-3 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm">
                    <p className="font-medium text-gray-900">Valuation: {d.formattedValue}</p>
                    <p className="text-sm text-gray-600">{data.x_axis.name}: {d.x}%</p>
                    <p className="text-sm text-gray-600">{data.y_axis.name}: {d.y}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name={data.x_axis.name} unit="%" label={{ value: data.x_axis.name, position: 'bottom', offset: 0 }} />
                    <YAxis type="number" dataKey="y" name={data.y_axis.name} unit="%" label={{ value: data.y_axis.name, angle: -90, position: 'insideLeft' }} />
                    <ZAxis type="number" dataKey="z" range={[100, 500]} name="Value" />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Sensitivity" data={chartData} fill="#8884d8">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.z > baseValue ? '#10b981' : entry.z < baseValue ? '#ef4444' : '#3b82f6'} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};


