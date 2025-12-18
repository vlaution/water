import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../config/api';
import { Sparkles, AlertTriangle, TrendingUp, Cpu, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface InsightData {
    strategic_assessment: string[];
    risk_factors: string[];
    upside_potential: string[];
}

interface AIInsightsWidgetProps {
    runId: string;
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ runId }) => {
    const [insights, setInsights] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { token } = useAuth();

    const fetchInsights = async (forceRefresh: boolean = false) => {
        if (!runId || !token) return;

        if (forceRefresh) setIsRefreshing(true);
        else setLoading(true);

        try {
            const url = `/api/analytics/insights/${runId}${forceRefresh ? '?refresh=true' : ''}`;
            const response = await apiFetch(url, {}, token);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setInsights(data);
            setError(null);
        } catch (error) {
            console.error("Failed to load insights:", error);
            setError("Unable to generate AI insights.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [runId, token]);

    if (loading) return (
        <div className="glass-panel p-6 animate-pulse h-64 flex flex-col items-center justify-center">
            <Cpu className="w-8 h-8 text-system-blue animate-spin mb-4" />
            <p className="text-sm text-gray-400">Analyzing Valuation Scenarios...</p>
        </div>
    );

    if (error) return (
        <div className="glass-panel p-6 h-64 flex flex-col items-center justify-center bg-red-50/10">
            <XCircle className="w-8 h-8 text-red-400 mb-4" />
            <p className="text-sm text-red-400">{error}</p>
            <button
                onClick={() => fetchInsights(true)}
                className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
            >
                <RefreshCw className="w-3 h-3" />
                Try Again
            </button>
        </div>
    );

    if (!insights) return null;

    return (
        <div className="glass-panel p-6 relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="w-32 h-32" />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Valuation Analyst</h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Auto-Generated Assessment</p>
                    </div>
                </div>

                <button
                    onClick={() => fetchInsights(true)}
                    disabled={isRefreshing}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh AI Insights"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'text-indigo-500' : 'text-gray-400'}`} />
                </button>
            </div>

            <div className="space-y-6 relative z-10">
                {/* Strategic Assessment */}
                {insights.strategic_assessment.length > 0 && (
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <Cpu className="w-4 h-4 text-indigo-500" />
                            Strategic Assessment
                        </h4>
                        <div className="bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                            <ul className="space-y-2">
                                {insights.strategic_assessment.map((text, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex gap-2">
                                        <span className="text-indigo-400 mt-1">•</span>
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Risks & Upside Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.risk_factors.length > 0 && (
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                Key Risks
                            </h4>
                            <div className="bg-orange-50/50 dark:bg-orange-500/10 rounded-xl p-4 border border-orange-100 dark:border-orange-500/20 h-full">
                                <ul className="space-y-2">
                                    {insights.risk_factors.map((text, i) => (
                                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                            <span className="text-orange-400">•</span>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {insights.upside_potential.length > 0 && (
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Upside Potential
                            </h4>
                            <div className="bg-emerald-50/50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20 h-full">
                                <ul className="space-y-2">
                                    {insights.upside_potential.map((text, i) => (
                                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                            <span className="text-emerald-400">•</span>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
