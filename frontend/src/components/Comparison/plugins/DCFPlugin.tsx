import React, { useState } from 'react';
import { useComparison } from '../../../context/ComparisonContext';
import type { AnalysisPlugin } from '../../../context/ComparisonContext';
import type { ValuationNode } from '../../../types/comparison';
import { ChevronRight, ChevronDown } from 'lucide-react';

// Recursive Row Component for nested DCF structures
const DCFRow: React.FC<{ node: ValuationNode; depth?: number }> = ({ node, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const { hoveredMetricId, setHoveredMetricId } = useComparison();
    const hasChildren = node.children && node.children.length > 0;
    const isHovered = hoveredMetricId === node.id;

    return (
        <div className="flex flex-col">
            <div
                className={`flex items-center justify-between py-1.5 px-2 rounded cursor-default transition-all duration-200
                    ${isHovered ? 'bg-white/10 shadow-sm z-10' : 'hover:bg-white/5'}
                `}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onMouseEnter={(e) => { e.stopPropagation(); setHoveredMetricId(node.id); }}
                onMouseLeave={(e) => { e.stopPropagation(); setHoveredMetricId(null); }}
            >
                <div className="flex items-center gap-1.5">
                    {hasChildren && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="text-gray-500 hover:text-gray-300"
                        >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                    )}
                    <span className={`text-sm ${hasChildren ? 'font-medium text-gray-300' : 'text-gray-400'}`}>
                        {node.label}
                    </span>
                </div>

                {node.value !== undefined && (
                    <span className="text-sm font-mono text-gray-200">
                        {typeof node.value === 'number' ? node.value.toFixed(1) : node.value}
                    </span>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="border-l border-white/5 ml-[15px]">
                    {node.children!.map(child => (
                        <DCFRow key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const DCFComponent: React.FC<{ data: ValuationNode }> = ({ data: _data }) => {
    // Mock DCF Structure
    const dcfData: ValuationNode = {
        id: 'dcf_root',
        label: 'DCF Model (Unlevered)',
        type: 'group',
        children: [
            {
                id: 'proj_period',
                label: 'Projection Period (5Y)',
                type: 'group',
                children: [
                    { id: 'rev_growth', label: 'Revenue Growth', type: 'metric', value: '15.2%' },
                    { id: 'ebit_margin', label: 'EBIT Margin', type: 'metric', value: '24.5%' },
                    { id: 'fcf', label: 'Unlevered FCF', type: 'metric', value: 1250.5 }
                ]
            },
            {
                id: 'term_val',
                label: 'Terminal Value',
                type: 'group',
                children: [
                    { id: 'wacc', label: 'WACC', type: 'metric', value: '8.5%' },
                    { id: 'tgr', label: 'Terminal Growth Rate', type: 'metric', value: '2.5%' },
                    { id: 'tv_pres', label: 'PV of Terminal Value', type: 'metric', value: 18400 }
                ]
            },
            { id: 'ev', label: 'Implied Enterprise Value', type: 'metric', value: 24500 }
        ]
    };

    return (
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden mt-4 p-2">
            <div className="px-2 py-2 mb-2 border-b border-white/5 flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Discounted Cash Flow</h4>
            </div>
            <DCFRow node={dcfData} />
        </div>
    );
};

export const DCFPlugin: AnalysisPlugin = {
    id: 'dcf_model',
    label: 'DCF Analysis',
    component: DCFComponent,
    isApplicable: (_data) => true // Can refine to only check if DCF data exists
};
