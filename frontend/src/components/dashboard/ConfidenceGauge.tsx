import React from 'react';

interface ConfidenceGaugeProps {
    score: number; // 0 to 100
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ score }) => {
    // Determine color based on score
    let colorClass = 'text-system-red';
    let label = 'High Risk';

    if (score >= 80) {
        colorClass = 'text-system-green';
        label = 'High Confidence';
    } else if (score >= 50) {
        colorClass = 'text-system-orange';
        label = 'Medium Confidence';
    }

    // Calculate rotation for semi-circle gauge (0 to 180 degrees)
    const rotation = (score / 100) * 180;

    return (
        <div className="glass-panel p-6 h-full flex flex-col items-center justify-center relative">
            <h3 className="absolute top-6 left-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confidence Score</h3>

            <div className="relative w-40 h-20 mt-4 overflow-hidden">
                {/* Background Arc */}
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[12px] border-gray-200/50 dark:border-white/10 box-border"></div>

                {/* Colored Arc (using clip-path or rotation trick) */}
                <div
                    className={`absolute top-0 left-0 w-40 h-40 rounded-full border-[12px] border-current ${colorClass} box-border origin-center transition-transform duration-1000 ease-out`}
                    style={{
                        transform: `rotate(${rotation - 180}deg)`,
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' // Only show top half
                    }}
                ></div>
            </div>

            <div className="text-center -mt-6 z-10">
                <span className={`text-3xl font-bold ${colorClass}`}>{score}%</span>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
        </div>
    );
};
