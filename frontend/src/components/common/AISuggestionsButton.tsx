import React, { useState } from 'react';

interface AISuggestionsButtonProps {
    suggestions: any;
    onApplyAll: () => void;
    onReview: () => void;
    isLoading?: boolean;
    className?: string;
}

export const AISuggestionsButton: React.FC<AISuggestionsButtonProps> = ({
    suggestions,
    onApplyAll,
    onReview,
    isLoading,
    className = ''
}) => {
    const [isHovered, setIsHovered] = useState(false);

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 ${className}`}>
                <span className="animate-spin">...</span>
                <span className="text-sm font-medium">Analyzing...</span>
            </div>
        );
    }

    if (!suggestions || !suggestions.suggestions) return null;

    const impact = suggestions.suggestions.expected_impact?.valuation_change_pct || 0;
    const impactColor = impact >= 0 ? 'text-green-400' : 'text-red-400';
    const impactSign = impact >= 0 ? '+' : '';

    return (
        <div className={`relative ${className}`}>
            <div
                className="flex items-center gap-2 bg-gray-900 text-white p-1 rounded-xl shadow-lg border border-gray-700 transition-all hover:shadow-xl hover:scale-[1.02]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Main Action Button */}
                <button
                    onClick={onApplyAll}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors font-medium disabled:opacity-50"
                >

                    <span>Apply All</span>
                </button>

                {/* Review Button */}
                <button
                    onClick={onReview}
                    className="px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-300"
                >
                    Review
                </button>

                {/* Impact Badge */}
                <div className="px-3 border-l border-white/10">
                    <span className={`font-bold ${impactColor}`}>
                        {impactSign}{(impact * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400 ml-1">Valuation</span>
                </div>
            </div>

            {/* Hover Preview Card */}
            <div
                className={`
                    absolute bottom-full right-0 mb-3 w-72 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-100 p-4
                    transform transition-all duration-200 origin-bottom-right z-50
                    ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}
                `}
            >
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    Quick Impact Preview
                </h4>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valuation Change</span>
                        <span className={`font-bold ${impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {impactSign}{(impact * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Confidence</span>
                        <span className="font-bold text-indigo-600">
                            {(suggestions.confidence_score * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 mb-3">
                    Includes changes to Growth, Margins, and WACC based on {suggestions.patterns?.matched_cluster || 'market data'}.
                </div>

                <div className="text-[10px] text-gray-400 text-center">
                    Click "Review" to see details
                </div>
            </div>
        </div>
    );
};
