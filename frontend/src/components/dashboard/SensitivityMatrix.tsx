import React, { useState, useEffect } from 'react';

interface SensitivityMatrixProps {
    data: Record<string, Record<string, number>> | any;
    baseValue: number;
    cacheKey?: string;
}

export const SensitivityMatrix: React.FC<SensitivityMatrixProps> = ({ data, cacheKey }) => {
    const [matrixData, setMatrixData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data && Object.keys(data).length > 0 && !data.matrix) {
            setMatrixData(transformLegacyData(data));
        } else if (data && data.matrix) {
            setMatrixData(data);
        } else if (cacheKey) {
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
            x_axis: { name: "Column", values: cols.map(c => parseFloat(c)) },
            y_axis: { name: "Row", values: rows.map(r => parseFloat(r)) },
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
    const colKeys = x_axis.values; // e.g. [0.08, 0.09, 0.10]
    const rowKeys = y_axis.values; // e.g. [0.01, 0.02, 0.03]

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 flex justify-between items-center">
                Sensitivity Analysis
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Automated</span>
            </h3>

            <div className="flex-1 relative w-full h-full min-h-[300px] overflow-hidden flex flex-col items-center justify-center p-6">

                {/* Y-Axis Label */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap origin-center">
                    {y_axis.name === 'Row' ? 'Terminal Growth' : y_axis.name}
                </div>

                {/* X-Axis Label */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {x_axis.name === 'Column' ? 'Discount Rate' : x_axis.name}
                </div>

                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden w-full h-full max-w-4xl max-h-[80%]">
                    <table className="border-collapse w-full h-full">
                        <thead>
                            <tr>
                                <th className="p-2 bg-gray-50 dark:bg-white/5 border-b border-r border-gray-100 dark:border-white/10 w-[10%]"></th>
                                {colKeys.map((col: any, i: number) => (
                                    <th key={i} className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 w-[18%]">
                                        {typeof col === 'number' ? `${(col * 100).toFixed(1)}%` : col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rowKeys.map((rowVal: any, i: number) => (
                                <tr key={i}>
                                    <td className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 whitespace-nowrap">
                                        {typeof rowVal === 'number' ? `${(rowVal * 100).toFixed(1)}%` : rowVal}
                                    </td>
                                    {matrix[i].map((val: number, j: number) => {
                                        const isBaseCase = i === Math.floor(rowKeys.length / 2) && j === Math.floor(colKeys.length / 2);
                                        return (
                                            <td
                                                key={j}
                                                className={`p-1 text-sm font-semibold text-center transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-default border border-gray-50 dark:border-white/5
                                                    ${isBaseCase ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/10' : ''}
                                                    text-gray-700 dark:text-gray-200
                                                `}
                                            >
                                                ${(val / 1000000).toFixed(1)}M
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Base Case highlighted. Values in Millions.
                </p>
            </div>
        </div>
    );
};
