import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../config/api';

interface ReportGeneratorProps {
    runId: string;
    onGenerate?: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ runId, onGenerate }) => {
    const [generating, setGenerating] = useState(false);
    const [complete, setComplete] = useState(false);

    const handleDownload = async (type: 'pdf' | 'csv') => {
        setGenerating(true);
        try {
            if (type === 'pdf') {
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
            }
            // CSV logic could go here

            setComplete(true);
            if (onGenerate) onGenerate();
            setTimeout(() => setComplete(false), 3000); // Reset after 3s
        } catch (error) {
            console.error("Report generation failed:", error);
            alert("Failed to generate report.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        Report Generator
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Export professional board-ready materials.</p>
                </div>
                {complete && (
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-fade-in">
                        <CheckCircle className="w-3 h-3" />
                        Downloaded
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => handleDownload('pdf')}
                    disabled={generating}
                    className="w-full bg-white/10 hover:bg-white/20 active:bg-white/5 transition-all p-3 rounded-lg flex items-center justify-between group border border-white/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400 group-hover:bg-red-500/30 transition-colors">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-sm">Board Report (PDF)</p>
                            <p className="text-xs text-gray-500">Executive summary & charts</p>
                        </div>
                    </div>
                    {generating ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                        <Download className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                    )}
                </button>
            </div>
        </div>
    );
};
