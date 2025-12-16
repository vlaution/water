export type NodeType = 'group' | 'metric' | 'text';

export interface ValuationNode {
    id: string;
    label: string;
    type: NodeType;
    value?: number | string;
    format?: 'currency' | 'percent' | 'number' | 'text';
    children?: ValuationNode[];
    tags?: string[]; // e.g. ["revenue", "growth"] for smart linking
}

export interface ComparisonSlot {
    id: string; // Company Ticker or Unique ID
    name: string;
    color: string; // Assigned color for charts/highlights
    data: ValuationNode; // Root node for this company
}

export interface ComparisonProject {
    id: string;
    title: string;
    slots: ComparisonSlot[];
    settings: {
        baseSlotId?: string; // ID of the "Base" company for deltas
        commonSizeMode?: 'revenue' | 'ebitda' | 'none';
        currency: string;
    };
}
