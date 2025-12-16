import React from 'react';
import { api } from '../config/api';
import { PatternInsight } from './PatternInsight';

interface AnomalyResult {
    field: string;
    value: number;
    is_outlier: boolean;
    severity: "warning" | "critical" | "normal";
    message: string;
    z_score: number;
    benchmark_source: string;
}

interface ValidationAnalysisResponse {
    anomalies: AnomalyResult[];
    patterns?: {
        matched_cluster: string;
        confidence: number;
        typical_assumptions: {
            revenue_growth: string;
            ebitda_margin: string;
        };
        avg_values: {
            revenue_growth: number;
            ebitda_margin: number;
        };
    };
    confidence_score: number;
    summary: string;
}

interface AIValidationResultProps {
    result: ValidationAnalysisResponse | null;
    isLoading: boolean;
    onApplyPattern?: (values: { revenue_growth: number; ebitda_margin: number }) => void;
}

export const AIValidationResult: React.FC<AIValidationResultProps> = ({ result, isLoading, onApplyPattern }) => {
    if (isLoading) {
        return (
            <div className="glass-panel p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        );
    }

    if (!result) return null;

    const getScoreColor = (score: number) => {
        if (score >= 0.9) return "text-green-600";
        if (score >= 0.6) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="glass-panel p-6 animate-fade-in-up border-l-4 border-indigo-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        AI Validation Analysis
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Powered by Llama 3 & Alpha Vantage
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Confidence Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.confidence_score)}`}>
                        {(result.confidence_score * 100).toFixed(0)}%
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50/50 rounded-xl p-4 mb-6 border border-indigo-100">
                <p className="text-gray-800 italic">
                    "{result.summary}"
                </p>
            </div>

            {result.patterns && (
                <PatternInsight
                    pattern={result.patterns}
                    onAccept={() => {
                        if (onApplyPattern && result.patterns?.avg_values) {
                            onApplyPattern(result.patterns.avg_values);
                        }
                    }}
                />
            )}

            {result.anomalies.length > 0 ? (
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Detected Anomalies</h4>
                    {result.anomalies.map((anomaly, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border flex items-start gap-3 ${anomaly.severity === 'critical'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                }`}
                        >
                            <div className="mt-0.5">
                                {anomaly.severity === 'critical' ? '!' : '!'}
                            </div>
                            <div>
                                <div className="font-medium">
                                    {anomaly.field.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                <div className="text-sm mt-1">
                                    {anomaly.message}
                                </div>
                                <div className="text-xs mt-1 opacity-75">
                                    Source: {anomaly.benchmark_source}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            fetch(api.url('/api/feedback'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    anomaly_field: anomaly.field,
                                                    user_action: 'accept',
                                                    context_data: JSON.stringify(anomaly)
                                                })
                                            });
                                        }}
                                        className="text-xs bg-white/50 hover:bg-white px-2 py-1 rounded border border-black/5 transition-colors"
                                        title="Helpful"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => {
                                            fetch(api.url('/api/feedback'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    anomaly_field: anomaly.field,
                                                    user_action: 'dismiss',
                                                    context_data: JSON.stringify(anomaly)
                                                })
                                            });
                                        }}
                                        className="text-xs bg-white/50 hover:bg-white px-2 py-1 rounded border border-black/5 transition-colors"
                                        title="Dismiss / Not Helpful"
                                    >
                                        -
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <span>&#10003;</span>
                    <span className="font-medium">No anomalies detected. Assumptions look solid!</span>
                </div>
            )}
        </div>
    );
};
