import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw, FileText } from 'lucide-react';

interface AISummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    runId?: string;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({ isOpen, onClose, runId }) => {
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && runId) {
            generateSummary();
        }
    }, [isOpen, runId]);

    const generateSummary = async () => {
        if (!runId) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/reports/ai-summary/${runId}`, {
                method: 'POST',
            });
            if (response.ok) {
                const data = await response.json();
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Failed to generate summary", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">AI Executive Summary</h2>
                            <p className="text-sm text-gray-500">Powered by Cortex Intelligence</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                            <p className="text-gray-500 animate-pulse">Analyzing valuation data...</p>
                        </div>
                    ) : (
                        <div className="prose prose-purple max-w-none">
                            {summary.split('\n\n').map((paragraph, idx) => (
                                <div key={idx} className="mb-6 last:mb-0">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {paragraph.split('**').map((part, i) =>
                                            i % 2 === 1 ? <strong key={i} className="text-gray-900 font-semibold">{part}</strong> : part
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                    <button
                        onClick={generateSummary}
                        disabled={loading}
                        className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Regenerate
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
                        >
                            <FileText className="w-4 h-4" />
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
