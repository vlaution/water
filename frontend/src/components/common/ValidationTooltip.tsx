import React, { useState } from 'react';

interface ValidationTooltipProps {
    children: React.ReactNode;
    content: string | null;
    severity?: "warning" | "critical" | "normal";
}

export const ValidationTooltip: React.FC<ValidationTooltipProps> = ({ children, content, severity }) => {
    const [isVisible, setIsVisible] = useState(false);

    if (!content) return <>{children}</>;

    const getBorderColor = () => {
        if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-800';
        if (severity === 'warning') return 'border-yellow-200 bg-yellow-50 text-yellow-800';
        return 'border-gray-200 bg-white text-gray-800';
    };

    return (
        <div
            className="relative flex items-center w-full"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-50 left-full ml-2 px-3 py-2 text-xs rounded-lg shadow-lg border w-64 ${getBorderColor()} animate-fade-in`}>
                    <div className="font-semibold mb-1">Industry Context</div>
                    {content}
                    <div className="absolute left-0 top-1/2 -ml-1 -mt-1 w-2 h-2 bg-inherit border-l border-b border-inherit transform rotate-45"></div>
                </div>
            )}
            {severity && severity !== 'normal' && (
                <div className="absolute right-3 top-1/2 -mt-2 pointer-events-none">
                    {severity === 'critical' ? '!' : '!'}
                </div>
            )}
        </div>
    );
};
