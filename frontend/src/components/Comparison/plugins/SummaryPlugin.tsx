import React from 'react';
import type { AnalysisPlugin } from '../../../context/ComparisonContext';
import type { ValuationNode } from '../../../types/comparison';

const SummaryComponent: React.FC<{ data: ValuationNode }> = ({ data }) => {
    // Determine the "Key Metric" to show. For now, just show the root label.
    // In a real app, this would be EV, Share Price, etc.

    return (
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Summary</h4>
            <div className="flex flex-col gap-2">
                <div className="text-3xl font-bold text-white">
                    {/* Mock Value for Enterprise Value */}
                    $2.4T
                </div>
                <div className="text-xs text-green-400 font-mono">
                    +12.4% vs Peers
                </div>
            </div>

            {/* Quick list of children if available */}
            {data.children && (
                <div className="space-y-1 pt-4 border-t border-white/5">
                    {data.children.slice(0, 3).map((child) => (
                        <div key={child.id} className="flex justify-between text-sm">
                            <span className="text-gray-400">{child.label}</span>
                            <span className="text-gray-200 font-mono">{child.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SummaryPlugin: AnalysisPlugin = {
    id: 'summary',
    label: 'Overview',
    component: SummaryComponent,
    isApplicable: (_data) => true // Always applicable to root nodes
};
