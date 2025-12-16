import React from 'react';
import { type SensitivityResult } from '../../services/AnalyticsService';

interface SensitivityTableProps {
    data: SensitivityResult;
    metricLabel?: string;
}

export const SensitivityTable: React.FC<SensitivityTableProps> = ({ data, metricLabel = "IRR" }) => {
    // Helper for heat map coloring
    const getColor = (val: number | null) => {
        if (val === null) return 'bg-gray-100 text-gray-400';

        // Simple scale for IRR: <0% Red, 0-15% Yellow, 15-25% Green, >25% Bright Green
        // Assuming values are decimal (0.20 for 20%)
        if (val < 0) return 'bg-red-100 text-red-800';
        if (val < 0.15) return 'bg-orange-100 text-orange-800';
        if (val < 0.25) return 'bg-yellow-50 text-yellow-800';
        if (val < 0.30) return 'bg-green-100 text-green-800';
        return 'bg-green-200 text-green-900 font-bold';
    };

    const formatVal = (val: number | null) => {
        if (val === null) return "N/A";
        return (val * 100).toFixed(1) + "%";
    };

    return (
        <div className="overflow-x-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">{data.row_label} vs {data.col_label} ({metricLabel})</h4>
            <table className="min-w-full text-sm border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 border border-gray-100 bg-gray-50 text-gray-500 font-medium text-xs">
                            {data.row_label} \ {data.col_label}
                        </th>
                        {data.col_values.map((colVal, idx) => (
                            <th key={idx} className="p-2 border border-gray-100 bg-gray-50 text-gray-600 font-medium">
                                {colVal}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.matrix.map((row, rIdx) => (
                        <tr key={rIdx}>
                            <td className="p-2 border border-gray-100 bg-gray-50 text-gray-600 font-medium whitespace-nowrap">
                                {row.row_value}
                            </td>
                            {row.values.map((cellVal, cIdx) => (
                                <td
                                    key={cIdx}
                                    className={`p-2 border border-blue-50 text-center transition-colors ${getColor(cellVal)}`}
                                    title={`${data.row_label}: ${row.row_value}, ${data.col_label}: ${data.col_values[cIdx]} => ${formatVal(cellVal)}`}
                                >
                                    {formatVal(cellVal)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
