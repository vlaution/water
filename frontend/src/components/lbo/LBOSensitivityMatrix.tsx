import React from 'react';

interface SensitivityMatrixProps {
    data: {
        entry_multiples: number[];
        rows: Array<{
            exit_multiple: number;
            irrs: number[];
        }>;
    };
    highlightValue?: number;
}

export const LBOSensitivityMatrix: React.FC<SensitivityMatrixProps> = ({ data }) => {
    if (!data || !data.rows || data.rows.length === 0) {
        return <div className="text-gray-500 text-sm">No sensitivity data available.</div>;
    }

    const getColor = (irr: number) => {
        if (irr < 0.15) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
        if (irr < 0.20) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
        if (irr < 0.25) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
        return 'bg-green-200 text-green-900 font-bold dark:bg-green-600/30 dark:text-green-100';
    };

    return (
        <div className="bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Sensitivity Analysis (IRR)</h3>
            <div className="flex items-center justify-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Entry Multiple (x)</span>
            </div>

            <div className="flex">
                <div className="flex items-center justify-center mr-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 -rotate-90 whitespace-nowrap">Exit Multiple (x)</span>
                </div>

                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {data.entry_multiples.map((m, i) => (
                                <th key={i} className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400">{m.toFixed(1)}x</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row, i) => (
                            <tr key={i}>
                                <td className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-right pr-4">{row.exit_multiple.toFixed(1)}x</td>
                                {row.irrs.map((irr, j) => (
                                    <td key={j} className="p-1">
                                        <div className={`p-2 rounded-lg text-xs ${getColor(irr)}`}>
                                            {(irr * 100).toFixed(1)}%
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
