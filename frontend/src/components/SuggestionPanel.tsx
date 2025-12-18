import React, { useState } from 'react';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface SuggestionPanelProps {
    companyData: any;
    currentAssumptions: any;
    onApplySuggestions: (suggestions: any) => void;
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ companyData, currentAssumptions, onApplySuggestions }) => {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any>(null);
    const { token } = useAuth();
    const [context, setContext] = useState({
        use_case: 'fundraising',
        risk_tolerance: 'moderate'
    });

    const fetchSuggestions = async (isRefresh = false) => {
        setLoading(true);
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = api.url(`/api/ai/suggestions${isRefresh ? '?refresh=true' : ''}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    company_data: companyData,
                    current_assumptions: currentAssumptions,
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error("Failed to fetch suggestions:", error);
            // Optional: Set an error state to show in UI
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (suggestions && onApplySuggestions) {
            onApplySuggestions(suggestions.suggestions.adjusted_assumptions);
            // Log acceptance (simplified)
            fetch(api.url('/api/feedback'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anomaly_field: "smart_suggestion",
                    user_action: "accept",
                    context_data: JSON.stringify({ context })
                })
            });
        }
    };

    return (
        <div className="glass-panel p-8 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200/50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                    AI Smart Suggestions
                </h3>
                <div className="flex gap-3">
                    <select
                        value={context.use_case}
                        onChange={(e) => setContext({ ...context, use_case: e.target.value })}
                        className="glass-input text-sm py-2 !w-auto"
                    >
                        <option value="fundraising">Fundraising</option>
                        <option value="acquisition">Acquisition</option>
                        <option value="internal">Internal Planning</option>
                    </select>
                    <select
                        value={context.risk_tolerance}
                        onChange={(e) => setContext({ ...context, risk_tolerance: e.target.value })}
                        className="glass-input text-sm py-2 !w-auto"
                    >
                        <option value="conservative">Conservative</option>
                        <option value="moderate">Moderate</option>
                        <option value="aggressive">Aggressive</option>
                    </select>
                    <button
                        onClick={() => fetchSuggestions()}
                        disabled={loading}
                        className="glass-button-primary text-sm shadow-indigo-500/20"
                    >
                        {loading ? 'Analyzing...' : 'Get Suggestions'}
                    </button>
                </div>
            </div>

            {suggestions && (
                <div className="space-y-6 animate-scale-in">
                    {/* Impact Summary */}
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/50 dark:border-white/10 shadow-sm flex justify-between items-center">
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Projected Valuation Impact</div>
                            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                +{(suggestions.suggestions.expected_impact.valuation_change_pct * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 border border-white/40 dark:border-white/10">
                                Current: ${(suggestions.suggestions.expected_impact.enterprise_value_current / 1e6).toFixed(1)}M
                            </div>
                            <div className="px-3 py-1 rounded-full bg-indigo-50/80 dark:bg-indigo-900/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
                                New: ${(suggestions.suggestions.expected_impact.enterprise_value_suggested / 1e6).toFixed(1)}M
                            </div>
                        </div>
                    </div>

                    {/* Reasoning & Changes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(suggestions.suggestions.adjusted_assumptions).map(([key, value]: [string, any]) => (
                            <div key={key} className="p-4 rounded-2xl bg-white/40 dark:bg-gray-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{key.replace('_', ' ')}</span>
                                    {suggestions.suggestions.confidence_scores[key] && (
                                        <span className="px-2 py-0.5 rounded-full bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold border border-green-200/50 dark:border-green-500/20">
                                            {(suggestions.suggestions.confidence_scores[key] * 100).toFixed(0)}% CONFIDENCE
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-3 mb-3">
                                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {key.includes('growth') || key.includes('margin') || key.includes('wacc') ? `${(value * 100).toFixed(1)}%` : value}
                                    </span>
                                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600">
                                        {key.includes('growth') || key.includes('margin') || key.includes('wacc') ? `${(currentAssumptions[key] * 100).toFixed(1)}%` : currentAssumptions[key]}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed opacity-90">
                                    {suggestions.suggestions.reasoning.per_assumption[key]}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end pt-4 border-t border-gray-200/50 dark:border-white/10">
                        <button
                            onClick={handleApply}
                            className="glass-button bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30 hover:bg-green-500/20 px-6 py-2.5 flex items-center gap-2 shadow-none hover:shadow-sm"
                        >
                            <span>&#10003;</span>
                            <span className="font-semibold">Apply All Improvements</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
