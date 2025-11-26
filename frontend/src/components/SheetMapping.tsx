import React, { useState } from 'react';

interface WorkbookData {
    file_id: string;
    sheets: Record<string, {
        headers: string[];
        rows: Record<string, any>[];
    }>;
}

interface SheetMappingProps {
    workbookData: WorkbookData;
    onConfirm: (mappings: Record<string, string>) => Promise<void>;
    isLoading: boolean;
}

export const SheetMapping: React.FC<SheetMappingProps> = ({ workbookData, onConfirm, isLoading }) => {
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [activeSheet, setActiveSheet] = useState<string>(Object.keys(workbookData.sheets)[0]);

    const requiredSheets = [
        'Cover', 'Tab 1. User Input>>', 'Flow', 'Inp_1', 'Inp_2', 'Inp_3', 'Inp_4'
    ];

    const handleMappingChange = (required: string, selected: string) => {
        setMappings(prev => ({ ...prev, [required]: selected }));
    };

    return (
        <div className="glass-panel p-8 max-w-6xl mx-auto mt-10 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Map Sheets</h2>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar - Required Sheets */}
                <div className="col-span-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-600 mb-4">Required Modules</h3>
                    {requiredSheets.map(req => (
                        <div key={req} className="p-4 bg-white/50 rounded-xl border border-white/40 shadow-sm">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{req}</label>
                            <select
                                className="w-full p-2 rounded-lg bg-white/80 border border-gray-200 focus:ring-2 focus:ring-system-blue outline-none"
                                value={mappings[req] || ''}
                                onChange={(e) => handleMappingChange(req, e.target.value)}
                            >
                                <option value="">Select Sheet...</option>
                                {Object.keys(workbookData.sheets).map(sheet => (
                                    <option key={sheet} value={sheet}>{sheet}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* Main Content - Preview */}
                <div className="col-span-8">
                    <div className="bg-white/40 rounded-2xl p-6 border border-white/30 h-full">
                        <h3 className="text-lg font-semibold text-gray-600 mb-4">
                            Preview: <span className="text-system-blue">{activeSheet}</span>
                        </h3>

                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {Object.keys(workbookData.sheets).map(sheet => (
                                <button
                                    key={sheet}
                                    onClick={() => setActiveSheet(sheet)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeSheet === sheet
                                        ? 'bg-system-blue text-white shadow-lg'
                                        : 'bg-white/60 text-gray-600 hover:bg-white'
                                        }`}
                                >
                                    {sheet}
                                </button>
                            ))}
                        </div>

                        <div className="overflow-auto max-h-[600px] rounded-xl border border-gray-200 bg-white/50">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm">
                                    <tr>
                                        {workbookData.sheets[activeSheet]?.headers.map((header, i) => (
                                            <th key={i} className="px-4 py-3 font-medium text-gray-500 border-b border-gray-200">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workbookData.sheets[activeSheet]?.rows.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                                            {workbookData.sheets[activeSheet]?.headers.map((header, j) => (
                                                <td key={j} className="px-4 py-2 text-gray-700">
                                                    {row[header]?.toString() || ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={() => onConfirm(mappings)}
                    disabled={isLoading}
                    className="px-8 py-3 bg-system-blue text-white rounded-xl font-medium shadow-lg hover:bg-blue-600 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Processing...' : 'Confirm Mappings'}
                </button>
            </div>
        </div>
    );
};
