
import React from 'react';

interface LBOTimelineControlProps {
    min: number;
    max: number;
    value: number;
    onChange: (year: number) => void;
}

export const LBOTimelineControl: React.FC<LBOTimelineControlProps> = ({ min, max, value, onChange }) => {
    return (
        <div className="flex items-center gap-4 bg-white/40 dark:bg-white/5 p-3 rounded-lg border border-white/20 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Exit Year: <span className="text-blue-600 dark:text-blue-400 font-bold">Year {value}</span></span>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
        </div>
    );
};
