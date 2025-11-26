import React from 'react';

interface SensitivityMatrixProps {
    data: Record<string, Record<string, number>>;
    baseValue: number;
}

export const SensitivityMatrix: React.FC<SensitivityMatrixProps> = ({ data, baseValue }) => {
    // Get row and column keys
    const rowKeys = Object.keys(data);
    const colKeys = rowKeys.length > 0 ? Object.keys(data[rowKeys[0]]) : [];

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Sensitivity Matrix</h3>
                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100 font-medium">
                    Risk Zone Highlighted
                </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-[10px] text-gray-400 uppercase tracking-wider font-medium"></th>
                            {colKeys.map((col) => (
                                <th key={col} className="p-2 text-[10px] text-gray-500 font-semibold bg-gray-50/50 rounded-t-lg">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                        {rowKeys.map((row) => (
                            <tr key={row}>
                                <td className="p-2 text-[10px] text-gray-500 font-semibold bg-gray-50/50 rounded-l-lg">{row}</td>
                                {colKeys.map((col) => {
                                    const val = data[row][col];
                                    const diff = ((val - baseValue) / baseValue) * 100;
                                    const isRisk = diff < -10;
                                    const isHigh = diff > 10;

                                    return (
                                        <td key={col} className={`p-2 text-xs font-medium transition-colors hover:bg-white/40 cursor-default
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
