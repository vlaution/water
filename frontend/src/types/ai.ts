export type SuggestionType = 'increase' | 'decrease' | 'optimization' | 'warning' | 'info';

export interface Suggestion {
    value: number;
    confidence: number;
    impact?: string;
    reasoning?: string;
    source?: string;
    type?: SuggestionType;
}

export interface CopilotState {
    suggestions: Record<string, Suggestion>;
    isLoading: boolean;
    error: string | null;
}

export type AnalyticsEventType =
    | 'ai_suggestion_fetched'
    | 'ai_suggestion_viewed'
    | 'ai_suggestion_applied'
    | 'ai_suggestion_dismissed'
    | 'ai_suggestion_undone'
    | 'ai_explanation_opened'
    | 'error';

export interface AnalyticsEvent {
    type: AnalyticsEventType;
    field?: string;
    context?: any;
    timestamp: number;
}
