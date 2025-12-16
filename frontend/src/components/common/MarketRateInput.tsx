import React from 'react';

interface MarketRateInputProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    marketRate?: number;
    autoUpdate: boolean;
    onAutoUpdateChange: (val: boolean) => void;
    step?: number;
    description?: string;
}

export const MarketRateInput: React.FC<MarketRateInputProps> = ({
    label,
    value,
    onChange,
    marketRate,
    autoUpdate,
    onAutoUpdateChange,
    step = 0.001,
    description
}) => {
    // If autoUpdate is on, effective value is marketRate (if available), else value
    // When autoUpdate is on, we should probably trigger onChange to sync parent state if it differs?
    // Or just display marketRate.
    // Ideally, the parent component handles the synchronization. Here we just render.

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-500">{label}</label>
                {marketRate !== undefined && (
                    <button
                        onClick={() => onAutoUpdateChange(!autoUpdate)}
                        className={`text-xs flex items-center gap-1 transition-colors ${autoUpdate
                                ? 'text-blue-600 font-medium'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        title={autoUpdate ? "Unlink from market rates" : "Link to live market rates"}
                    >
                        {autoUpdate ? (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span>Auto-Sync</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span>Link</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="relative">
                <input
                    type="number"
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    disabled={autoUpdate}
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${autoUpdate
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-gray-200 focus:ring-2 focus:ring-blue-500'
                        }`}
                />

                {autoUpdate && marketRate !== undefined && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        Live
                    </div>
                )}
            </div>
            {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
        </div>
    );
};
