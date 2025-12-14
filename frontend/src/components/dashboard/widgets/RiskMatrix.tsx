import React from 'react';

interface RiskMatrixItem {
    company_name: string;
    risk_level: string;
    flags: string[];
}

interface RiskMatrixProps {
    data: RiskMatrixItem[];
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ data }) => {
    const getBadgeColor = (level: string) => {
        switch (level) {
            case 'High': return 'bg-red-100 text-red-800 border-red-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Risk Level</th>
                        <th className="px-4 py-3">Flags</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">{item.company_name}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(item.risk_level)}`}>
                                    {item.risk_level}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {item.flags.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {item.flags.map((flag, fIdx) => (
                                            <li key={fIdx} className="truncate max-w-xs">{flag}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-gray-400 italic">None</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
