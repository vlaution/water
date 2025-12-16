import React, { useState } from 'react';
import type { SuggestionType } from '../../types/ai';

interface SuggestionBadgeProps {
    type: SuggestionType;
    confidence: number;
    impact: string; // e.g., "+15% Valuation"
    message: string;
    onPreview?: () => void;
    onApply?: () => void;
    onExplain?: () => void;
    className?: string;
}

export const SuggestionBadge: React.FC<SuggestionBadgeProps> = ({
    type,
    confidence,
    impact,
    message,
    onPreview,
    onApply,
    onExplain,
    className = ''
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const getBadgeColor = () => {
        switch (type) {
            case 'increase': return 'bg-green-500 text-white';
            case 'decrease': return 'bg-red-500 text-white';
            case 'optimization': return 'bg-blue-500 text-white';
            case 'warning': return 'bg-yellow-500 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'increase': return '↑';
            case 'decrease': return '↓';
            case 'optimization': return '';
            case 'warning': return '!';
            default: return '•';
        }
    };

    return (
        <div
            className={`relative flex items-center ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* The Badge Itself */}
            <button
                type="button"
                onClick={onPreview}
                className={`
                    flex items-center justify-center w-5 h-5 rounded-full shadow-sm transition-all duration-300
                    ${getBadgeColor()}
                    ${isHovered ? 'scale-110 shadow-md' : 'scale-100'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                `}
                aria-label={`AI Suggestion: ${message}. Confidence: ${(confidence * 100).toFixed(0)}%. Type: ${type}.`}
                aria-expanded={isHovered}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
            >
                <span className="text-xs font-bold leading-none" aria-hidden="true">{getIcon()}</span>
            </button>

            {/* Hover Tooltip / Preview */}
            <div
                className={`
                    absolute left-full ml-2 z-50 w-64 p-3 bg-white rounded-xl shadow-xl border border-gray-100
                    transform transition-all duration-200 origin-left
                    ${isHovered ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 -translate-x-2 pointer-events-none'}
                `}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getBadgeColor().replace('text-white', 'bg-opacity-10 text-opacity-100')}`}>
                        {type}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                        {(confidence * 100).toFixed(0)}% Conf.
                    </span>
                </div>

                <p className="text-sm font-medium text-gray-800 mb-2 leading-snug">
                    {message}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className={`text-xs font-semibold ${type === 'decrease' ? 'text-red-600' : 'text-green-600'}`}>
                        {impact}
                    </span>

                    {onApply && (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onApply();
                                }}
                                className="flex-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors font-medium"
                            >
                                Apply
                            </button>
                            {onExplain && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onExplain();
                                    }}
                                    className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors font-medium border border-gray-200"
                                >
                                    Why?
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
