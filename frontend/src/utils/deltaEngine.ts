import type { ValuationNode } from '../types/comparison';

export type DeltaMode = 'absolute' | 'percentage' | 'heatmap';

interface DeltaResult {
    value: number;
    formatted: string;
    intensity: number; // 0 to 1, for heatmap opacity
    isPositiveGood: boolean; // e.g. High Growth = Good, High Cost = Bad
}

export class DeltaEngine {

    /**
     * Calculates the delta between a target node and a base node.
     */
    static calculate(target: ValuationNode, base: ValuationNode, mode: DeltaMode = 'percentage'): DeltaResult | null {
        if (target.type !== 'metric' || base.type !== 'metric' || typeof target.value !== 'number' || typeof base.value !== 'number') {
            return null;
        }

        const tVal = target.value;
        const bVal = base.value;

        let delta = 0;
        let formatted = '';

        // Basic Logic
        if (mode === 'absolute') {
            delta = tVal - bVal;
            formatted = `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`;
        } else {
            if (bVal === 0) return null; // Avoid division by zero
            delta = ((tVal - bVal) / bVal) * 100;
            formatted = `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
        }

        // Heatmap Intensity (Simple Linear Scale for now)
        // Cap at 50% deviation = 1.0 intensity
        const intensity = Math.min(Math.abs(delta) / 50, 1);

        return {
            value: delta,
            formatted,
            intensity,
            isPositiveGood: true // Default assumption, can be refined with tags
        };
    }

    /**
     * Recursively find a node by ID in a tree
     */
    static findNode(root: ValuationNode, id: string): ValuationNode | null {
        if (root.id === id) return root;
        if (root.children) {
            for (const child of root.children) {
                const found = this.findNode(child, id);
                if (found) return found;
            }
        }
        return null;
    }
}
