import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

interface HeatmapItem {
    run_id: string; // New
    company_name: string;
    enterprise_value: number;
    confidence_score: number;
    completeness_score?: number;
    last_updated?: string;
    validation_warnings?: string[];
}

interface ValuationHeatmapProps {
    data: HeatmapItem[];
    onBubbleClick?: (runId: string) => void;
}

export const ValuationHeatmap: React.FC<ValuationHeatmapProps> = ({ data, onBubbleClick }) => {

    const getColor = (score: number) => {
        if (score >= 80) return '#22c55e'; // Green
        if (score >= 50) return '#eab308'; // Yellow
        return '#ef4444'; // Red
    };

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis
                        type="category"
                        dataKey="company_name"
                        name="Company"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        type="number"
                        dataKey="confidence_score"
                        name="Confidence"
                        domain={[0, 100]}
                        label={{ value: 'Confidence Score', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis
                        type="number"
                        dataKey="enterprise_value"
                        range={[100, 1000]}
                        name="Valuation"
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload as HeatmapItem;
                                return (
                                    <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-sm z-50">
                                        <p className="font-bold mb-1">{d.company_name}</p>
                                        <div className="space-y-1">
                                            <p className="text-gray-600">Valuation: <span className="text-gray-900 font-medium">${(d.enterprise_value / 1000000).toFixed(1)}M</span></p>
                                            <p className="text-gray-600">Confidence: <span className="text-gray-900 font-medium">{d.confidence_score}%</span></p>
                                            {d.completeness_score !== undefined && (
                                                <p className="text-gray-600">Completeness: <span className="text-gray-900 font-medium">{Math.round(d.completeness_score)}%</span></p>
                                            )}
                                            {d.last_updated && (
                                                <p className="text-gray-400 text-xs">Updated: {d.last_updated}</p>
                                            )}
                                            {d.validation_warnings && d.validation_warnings.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    {d.validation_warnings.map((w, i) => (
                                                        <p key={i} className="text-xs text-red-500 flex items-center">
                                                            <span className="mr-1">!</span> {w}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-blue-500 mt-2 font-medium">Click for details →</p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter name="Valuations" data={data}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getColor(entry.confidence_score)}
                                onClick={() => onBubbleClick && onBubbleClick(entry.run_id)}
                                style={{ cursor: onBubbleClick ? 'pointer' : 'default' }}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
