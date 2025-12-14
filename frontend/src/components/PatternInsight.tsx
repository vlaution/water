import React, { useState } from 'react';
import { api } from '../config/api';

interface PatternMatch {
    matched_cluster: string;
    confidence: number;
    typical_assumptions: {
        revenue_growth: string;
        ebitda_margin: string;
    };
}

interface PatternInsightProps {
    pattern: PatternMatch;
    onAccept?: () => void;
}

export const PatternInsight: React.FC<PatternInsightProps> = ({ pattern, onAccept }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getConfidenceColor = (score: number) => {
        if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
        if (score >= 0.5) return "bg-blue-100 text-blue-800 border-blue-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    const formatName = (name: string) => {
        return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="mb-6 animate-fade-in-up">
            <div
                className={`rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md ${isExpanded ? 'bg-white shadow-md border-indigo-200' : 'bg-white/50 border-gray-200'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            🎯
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Matched Archetype</div>
                            <div className="font-bold text-gray-900 text-lg">{formatName(pattern.matched_cluster)}</div>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getConfidenceColor(pattern.confidence)}`}>
                        {(pattern.confidence * 100).toFixed(0)}% Match
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Typical Industry Metrics</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Revenue Growth</div>
                                <div className="font-mono font-medium text-indigo-700">{pattern.typical_assumptions.revenue_growth}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">EBITDA Margin</div>
                                <div className="font-mono font-medium text-indigo-700">{pattern.typical_assumptions.ebitda_margin}</div>
                            </div>
                        </div>

                        {onAccept && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Log feedback
                                    fetch(api.url('/api/feedback'), {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            anomaly_field: "pattern_match",
                                            user_action: "accept",
                                            context_data: JSON.stringify({ pattern: pattern.matched_cluster })
                                        })
                                    });
                                    if (onAccept) onAccept();
                                }}
                                className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <span>✨</span> Apply Typical Values
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
