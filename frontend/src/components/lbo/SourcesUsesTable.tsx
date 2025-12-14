import React from 'react';

interface SourcesUsesTableProps {
    sources: Record<string, number>;
    uses: Record<string, number>;
}

export const SourcesUsesTable: React.FC<SourcesUsesTableProps> = ({ sources, uses }) => {
    // Calculate totals
    const totalSources = Object.values(sources).reduce((a, b) => a + b, 0);
    const totalUses = Object.values(uses).reduce((a, b) => a + b, 0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: "compact" }).format(val);

    return (
        <div className="bg-white/50 border border-white/20 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sources & Uses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sources Column */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Sources</h4>
                    <div className="space-y-3">
                        {Object.entries(sources).map(([name, value]) => (
                            <div key={name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">{name}</span>
                                <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold text-gray-900">
                            <span>Total Sources</span>
                            <span>{formatCurrency(totalSources)}</span>
                        </div>
                    </div>
                </div>

                {/* Uses Column */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Uses</h4>
                    <div className="space-y-3">
                        {Object.entries(uses).map(([name, value]) => (
                            <div key={name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">{name}</span>
                                <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold text-gray-900">
                            <span>Total Uses</span>
                            <span>{formatCurrency(totalUses)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
