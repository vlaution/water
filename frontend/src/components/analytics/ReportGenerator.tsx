import React, { useState } from 'react';
import { api } from '../../config/api';

interface ReportGeneratorProps {
    runId?: string; // If null, maybe generate portfolio report? For now assume runId required or 'latest'
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ runId }) => {
    const [generating, setGenerating] = useState(false);

    const handleDownload = async () => {
        if (!runId) {
            alert("No valuation run selected.");
            return;
        }

        setGenerating(true);
        try {
            // Using fetch to handle blob download
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${api.baseURL}/api/analytics/report/pdf/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to generate report");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Board_Report_${runId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Error generating report. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900">Board Report</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Generate a comprehensive PDF report for this valuation run, including charts and executive summary.
                </p>
            </div>

            <button
                onClick={handleDownload}
                disabled={generating || !runId}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all
                    ${generating || !runId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30'}`}
            >
                {generating ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </span>
                ) : (
                    "Download PDF Report"
                )}
            </button>
        </div>
    );
};
