import { useState } from 'react';

interface BadgePlacementConfig {
    mode: 'progressive' | 'all';
    priorityThreshold: number; // 0-1
}

export const useBadgePlacement = (initialConfig: BadgePlacementConfig = { mode: 'progressive', priorityThreshold: 0.7 }) => {
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [interactedFields, setInteractedFields] = useState<Set<string>>(new Set());
    const [config] = useState(initialConfig);

    const handleFocus = (field: string) => {
        setFocusedField(field);
        setInteractedFields(prev => {
            const newSet = new Set(prev);
            newSet.add(field);
            return newSet;
        });
    };

    const handleBlur = () => {
        setFocusedField(null);
    };

    const shouldShowBadge = (field: string, suggestionConfidence: number) => {
        // Always show if confidence is very high
        if (suggestionConfidence > 0.9) return true;

        if (config.mode === 'all') return true;

        // Progressive mode:
        // 1. Show if field is focused
        if (focusedField === field) return true;

        // 2. Show if field has been interacted with
        if (interactedFields.has(field)) return true;

        // 3. Show if confidence is above threshold
        if (suggestionConfidence >= config.priorityThreshold) return true;

        return false;
    };

    return {
        focusedField,
        handleFocus,
        handleBlur,
        shouldShowBadge
    };
};
