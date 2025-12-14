import React, { useEffect, useState } from 'react';
import { api, apiFetch } from '../../config/api';
// import { api } from '../../config/api'; // Previous potential error source if it was missing

interface CorrelationData {
    companies: string[];
    matrix: number[][];
    metrics_used: string[];
}

export const CorrelationHeatmap: React.FC = () => {
    const [data, setData] = useState<CorrelationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'financial' | 'qualitative'>('financial');

    useEffect(() => {
        fetchData();
    }, [mode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const endpoint = mode === 'financial'
                ? api.endpoints.risk.correlation.financial
                : api.endpoints.risk.correlation.qualitative;

            const response = await apiFetch(endpoint, {}, token);
            if (!response.ok) throw new Error('Failed to fetch correlation data');

            const result = await response.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getColor = (value: number) => {
        // -1 to 1 for financial, 0 to 1 for qualitative
        if (mode === 'qualitative') {
            // 0 to 1: White to Blue
            // const intensity = Math.round(value * 255);
            // return `rgb(${255-intensity}, ${255-intensity}, 255)`; // Grayscale
            return `rgba(59, 130, 246, ${value})`; // Blue opacity
        } else {
            // -1 (Red) to 0 (White) to 1 (Green)
            if (value > 0) {
                return `rgba(34, 197, 94, ${value})`; // Green
            } else {
                return `rgba(239, 68, 68, ${Math.abs(value)})`; // Red
            }
        }
    };

    if (loading) return <div className="p-4">Loading correlation data...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
    if (!data || data.companies.length === 0) return <div className="p-4">No portfolio data available for correlation.</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Correlation Matrix</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('financial')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'financial'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Financial
                    </button>
                    <button
                        onClick={() => setMode('qualitative')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'qualitative'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Qualitative
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    <div className="grid" style={{
                        gridTemplateColumns: `auto repeat(${data.companies.length}, minmax(40px, 1fr))`
                    }}>
                        {/* Header Row */}
                        <div className="h-10"></div> {/* Empty top-left */}
                        {data.companies.map((company, i) => (
                            <div key={i} className="h-32 flex items-end justify-center pb-2">
                                <span className="transform -rotate-45 text-xs text-gray-500 whitespace-nowrap origin-bottom-left translate-x-4">
                                    {company}
                                </span>
                            </div>
                        ))}

                        {/* Data Rows */}
                        {data.companies.map((rowCompany, i) => (
                            <React.Fragment key={i}>
                                {/* Row Label */}
                                <div className="h-10 flex items-center justify-end pr-4">
                                    <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]" title={rowCompany}>
                                        {rowCompany}
                                    </span>
                                </div>
                                {/* Cells */}
                                {data.matrix[i].map((value, j) => (
                                    <div
                                        key={`${i}-${j}`}
                                        className="h-10 border border-gray-50 flex items-center justify-center text-xs relative group cursor-default"
                                        style={{ backgroundColor: getColor(value) }}
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 font-medium text-gray-800 drop-shadow-sm transition-opacity">
                                            {value.toFixed(2)}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
                                            {rowCompany} vs {data.companies[j]}: {value.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
                {mode === 'financial'
                    ? `Based on: ${data.metrics_used.join(', ')}`
                    : `Based on: ${data.metrics_used.join(', ')}`}
            </div>
        </div>
    );
};
