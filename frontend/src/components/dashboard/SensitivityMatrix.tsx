import React, { useState, useEffect } from 'react';

interface SensitivityMatrixProps {
    data: Record<string, Record<string, number>> | any; // Allow any for the precomputed structure
    baseValue: number;
    cacheKey?: string;
}

export const SensitivityMatrix: React.FC<SensitivityMatrixProps> = ({ data, baseValue, cacheKey }) => {
    const [matrixData, setMatrixData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If data is provided and not empty, use it
        if (data && Object.keys(data).length > 0 && !data.matrix) {
            // Handle legacy format if any, or just use it
            // But wait, the precomputed format is different: { x_axis, y_axis, matrix }
            // The existing component expects Record<string, Record<string, number>>
            // I need to adapt.
            setMatrixData(transformLegacyData(data));
        } else if (data && data.matrix) {
            setMatrixData(data);
        } else if (cacheKey) {
            // Fetch from cache
            fetchSensitivity();
        }
    }, [data, cacheKey]);

    const fetchSensitivity = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/valuation/sensitivity/${cacheKey}`);
            if (res.ok) {
                const result = await res.json();
                if (result.status !== 'pending') {
                    setMatrixData(result);
                }
            }
        } catch (error) {
            console.error("Failed to fetch sensitivity", error);
        } finally {
            setLoading(false);
        }
    };

    const transformLegacyData = (legacyData: any) => {
        // Transform { "Row1": { "Col1": 100 } } to { x_axis, y_axis, matrix }
        const rows = Object.keys(legacyData);
        if (rows.length === 0) return null;
        const cols = Object.keys(legacyData[rows[0]]);

        const matrix = rows.map(row => cols.map(col => legacyData[row][col]));

        return {
            x_axis: { name: "Column", values: cols },
            y_axis: { name: "Row", values: rows },
            matrix: matrix
        };
    };

    if (loading) {
        return (
            <div className="glass-panel p-6 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!matrixData || !matrixData.matrix) {
        return (
            <div className="glass-panel p-6 h-full flex items-center justify-center text-gray-400">
                Sensitivity analysis not available
            </div>
        );
    }

    const { x_axis, y_axis, matrix } = matrixData;
    const colKeys = x_axis.values;
    const rowKeys = y_axis.values;

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Sensitivity Matrix ({y_axis.name} vs {x_axis.name})</h3>
                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100 font-medium">
                    Risk Zone Highlighted
                </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-[10px] text-gray-400 uppercase tracking-wider font-medium"></th>
                            {colKeys.map((col: any, i: number) => (
                                <th key={i} className="p-2 text-[10px] text-gray-500 font-semibold bg-gray-50/50 rounded-t-lg">
                                    {typeof col === 'number' ? `${(col * 100).toFixed(1)}%` : col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                        {rowKeys.map((row: any, i: number) => (
                            <tr key={i}>
                                <td className="p-2 text-[10px] text-gray-500 font-semibold bg-gray-50/50 rounded-l-lg">
                                    {typeof row === 'number' ? `${(row * 100).toFixed(1)}%` : row}
                                </td>
                                {matrix[i].map((val: number, j: number) => {
                                    const diff = baseValue ? ((val - baseValue) / baseValue) * 100 : 0;
                                    const isRisk = diff < -10;
                                    const isHigh = diff > 10;

                                    return (
                                        <td key={j} className={`p-2 text-xs font-medium transition-colors hover:bg-white/40 cursor-default
                                            ${isRisk ? 'bg-red-50/30 text-red-700' : ''}
                                            ${isHigh ? 'bg-green-50/30 text-green-700' : 'text-gray-700'}
                                        `}>
                                            ${(val / 1000000).toFixed(1)}M
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-4 justify-center text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-100 border border-red-200"></div>
                    <span>Risk (&lt;-10%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-100 border border-green-200"></div>
                    <span>Opportunity (&gt;+10%)</span>
                </div>
            </div>
        </div>
    );
};
