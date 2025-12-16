import React from 'react';
import { useComparison } from '../../../context/ComparisonContext';
import { DeltaEngine } from '../../../utils/deltaEngine';
import type { AnalysisPlugin } from '../../../context/ComparisonContext';
import type { ValuationNode } from '../../../types/comparison';

const FinancialsComponent: React.FC<{ data: ValuationNode }> = ({ data }) => {
    const { project, hoveredMetricId, setHoveredMetricId } = useComparison();
    const isCommonSize = project?.settings.commonSizeMode !== 'none';

    // 1. Find the "Base" slot data to compare against
    const baseSlotId = project?.settings.baseSlotId;
    const baseSlot = baseSlotId ? project?.slots.find(s => s.id === baseSlotId) : undefined;

    // Safety check for data.id being a string
    const isBase = typeof data.id === 'string' && typeof baseSlotId === 'string' && data.id.includes(baseSlotId);

    // Mock Financial Data if not present (In real app, traverse data)
    const financials = [
        { id: 'rev', label: 'Revenue', value: 1000, commonSize: '100%' },
        { id: 'cogs', label: 'COGS', value: 400, commonSize: '40%' },
        { id: 'gp', label: 'Gross Profit', value: 600, commonSize: '60%' },
        { id: 'ebitda', value: 300, commonSize: '30%' },
    ];

    return (
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden mt-4">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-300">Financials</h4>
                {isCommonSize && <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Common Sized</span>}
                {isBase && <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Base</span>}
            </div>

            <table className="w-full text-sm text-left">
                <tbody>
                    {financials.map((row) => {
                        // Calculate Delta (Mocking the lookup for now)
                        let deltaInfo = null;
                        if (!isBase && baseSlot && baseSlotId && typeof row.id === 'string') {
                            // In real app: find matching node in baseSlot.data by ID (row.id)
                            // For mock: just assuming base has same value + 100
                            const mockBaseValue = row.value + (Math.random() * 200 - 100);

                            // Ensure IDs are strings
                            const rowId = row.id || `row_${Math.random()}`;
                            const targetNode = { id: rowId, label: String(row.label || ''), type: 'metric' as const, value: row.value };
                            const baseNode = { id: rowId, label: String(row.label || ''), type: 'metric' as const, value: mockBaseValue };

                            deltaInfo = DeltaEngine.calculate(targetNode, baseNode, 'percentage');
                        }

                        // Heatmap Color Logic
                        let deltaColor = 'transparent';
                        if (deltaInfo) {
                            const opacity = Math.min(Math.abs(deltaInfo.value) / 100, 0.3); // Cap opacity
                            if (deltaInfo.value > 0) deltaColor = `rgba(52, 211, 153, ${opacity})`; // Green
                            else deltaColor = `rgba(248, 113, 113, ${opacity})`; // Red
                        }

                        const isHovered = hoveredMetricId === row.id;

                        return (
                            <tr
                                key={row.label}
                                className={`border-b border-white/5 transition-all duration-200 cursor-default ${isHovered ? 'bg-white/10 scale-[1.02] shadow-lg z-10 mx-[-4px] rounded-lg relative' : 'hover:bg-white/5'}`}
                                onMouseEnter={() => setHoveredMetricId(row.id)}
                                onMouseLeave={() => setHoveredMetricId(null)}
                            >
                                <td className={`px-4 py-2.5 flex justify-between items-center ${isHovered ? 'text-white font-medium' : 'text-gray-400'}`}>
                                    {row.label}
                                    {deltaInfo && (
                                        <span
                                            className={`text-[10px] px-1.5 rounded ml-2 font-mono ${deltaInfo.value > 0 ? 'text-green-400' : 'text-red-400'}`}
                                            style={{ backgroundColor: deltaColor }}
                                        >
                                            {deltaInfo.formatted}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-200">
                                    {isCommonSize ? row.commonSize : `$${row.value}M`}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export const FinancialsPlugin: AnalysisPlugin = {
    id: 'financials',
    label: 'Financials',
    component: FinancialsComponent,
    isApplicable: (_data) => true
};
