import { useState, useCallback } from 'react';
import { api } from '../config/api';
import { analytics } from '../services/AnalyticsService';
import type { Suggestion, CopilotState } from '../types/ai';

export const useAICopilot = () => {
    const [state, setState] = useState<CopilotState>({
        suggestions: {},
        isLoading: false,
        error: null
    });

    const [changeHistory, setChangeHistory] = useState<any[]>([]);

    const fetchSuggestions = useCallback(async (formData: any) => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await fetch(api.url('/api/ai/suggestions'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_data: {
                        sector: formData.sector,
                        revenue: formData.dcf_input?.historical?.revenue?.slice(-1)[0] || 0
                    },
                    current_assumptions: {
                        revenue_growth: formData.dcf_input?.projections?.revenue_growth_start,
                        ebitda_margin: formData.dcf_input?.projections?.ebitda_margin_start,
                        wacc: formData.dcf_input?.projections?.discount_rate,
                        terminal_growth: formData.dcf_input?.projections?.terminal_growth_rate
                    },
                    context: {
                        use_case: 'fundraising',
                        risk_tolerance: 'moderate'
                    }
                })
            });
            const data = await response.json();

            // Transform API response to simpler map
            const suggestionsMap: Record<string, Suggestion> = {};
            if (data.suggestions && data.suggestions.adjusted_assumptions) {
                Object.entries(data.suggestions.adjusted_assumptions).forEach(([key, value]: [string, any]) => {
                    suggestionsMap[key] = {
                        value: value,
                        confidence: data.suggestions.confidence_scores[key] || 0,
                        reasoning: data.suggestions.reasoning.per_assumption[key],
                        impact: data.suggestions.expected_impact ? `${(data.suggestions.expected_impact.valuation_change_pct * 100).toFixed(1)}%` : undefined,
                        source: 'AI Model'
                    };
                });
            }

            analytics.log('ai_suggestion_fetched', undefined, { count: Object.keys(suggestionsMap).length });

            setState({
                suggestions: suggestionsMap,
                isLoading: false,
                error: null
            });
        } catch (err) {
            console.error(err);
            setState(prev => ({ ...prev, isLoading: false, error: 'Failed to fetch suggestions' }));
        }
    }, []);

    const applySuggestion = (field: string, currentValue: any, onApply: (val: any) => void) => {
        const suggestion = state.suggestions[field];
        if (suggestion) {
            // Save history for Undo
            setChangeHistory(prev => [...prev, { field, oldValue: currentValue, newValue: suggestion.value }]);

            analytics.log('ai_suggestion_applied', field, { value: suggestion.value, old: currentValue });

            onApply(suggestion.value);
        }
    };

    const undoLastChange = (onRevert: (field: string, val: any) => void) => {
        if (changeHistory.length === 0) return;
        const lastChange = changeHistory[changeHistory.length - 1];

        analytics.log('ai_suggestion_undone', lastChange.field, { revertedTo: lastChange.oldValue });

        onRevert(lastChange.field, lastChange.oldValue);
        setChangeHistory(prev => prev.slice(0, -1));
    };

    return {
        suggestions: state.suggestions,
        isLoading: state.isLoading,
        fetchSuggestions,
        applySuggestion,
        undoLastChange,
        canUndo: changeHistory.length > 0
    };
};
