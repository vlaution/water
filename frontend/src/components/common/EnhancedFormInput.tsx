import React, { useState } from 'react';
import { SuggestionBadge } from './SuggestionBadge';
import type { Suggestion, SuggestionType } from '../../types/ai';

interface EnhancedFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    suggestion?: Suggestion;
    onApplySuggestion?: (value: any) => void;
    onExplain?: () => void;
    showBadge?: boolean;
    isLoading?: boolean;
    className?: string;
    wrapperClassName?: string;
}

export const EnhancedFormInput: React.FC<EnhancedFormInputProps> = ({
    label,
    error,
    suggestion,
    onApplySuggestion,
    onExplain,
    showBadge = true,
    isLoading = false,
    className = '',
    wrapperClassName = '',
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        setHasInteracted(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    // Determine if we should show the badge
    // Logic: Show if explicitly enabled AND (focused OR interacted OR high confidence)
    const shouldDisplayBadge = showBadge && suggestion && (
        isFocused ||
        hasInteracted ||
        suggestion.confidence > 0.8
    );

    return (
        <div className={`relative ${wrapperClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-600 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    {...props}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`
                        glass-input
                        ${error ? '!border-red-300 !focus:border-red-500 !focus:ring-red-500 !bg-red-50' : ''}
                        ${suggestion && !error ? '!border-indigo-200' : ''}
                        ${className}
                    `}
                />

                {/* Validation Error Message Icon */}
                {error && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-red-500 text-lg">!</span>
                    </div>
                )}

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                    </div>
                )}

                {/* Suggestion Badge */}
                {shouldDisplayBadge && suggestion && !isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center z-10">
                        <SuggestionBadge
                            type={suggestion.type || 'info'}
                            confidence={suggestion.confidence}
                            impact={suggestion.impact || ''}
                            message={suggestion.reasoning || 'AI Suggestion'}
                            onApply={() => onApplySuggestion && onApplySuggestion(suggestion.value)}
                            onExplain={onExplain}
                        />
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-xs text-red-600 font-medium animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
};
