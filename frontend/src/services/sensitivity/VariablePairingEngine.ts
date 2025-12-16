export interface Variable {
    id: string;
    label: string;
    value: number;
    category: 'growth' | 'margin' | 'discount' | 'macro';
}

export interface VariablePair {
    xVar: Variable;
    yVar: Variable;
    correlationStrength: number; // -1 to 1
    insight: string;
    recommended: boolean;
}

export class VariablePairingEngine {

    /**
     * Analyzes variables to suggest optimal pairs for sensitivity analysis.
     * Uses simulated correlation logic for now.
     */
    static suggestOptimalPairs(variables: Variable[]): VariablePair[] {
        const pairs: VariablePair[] = [];

        // Simple heuristic: Pair variables from different categories for "Coverage"
        // or same category for "Deep Dive".

        for (let i = 0; i < variables.length; i++) {
            for (let j = i + 1; j < variables.length; j++) {
                const v1 = variables[i];
                const v2 = variables[j];

                const correlation = this.calculateSimulatedCorrelation(v1, v2);
                const insight = this.generateInsight(v1, v2, correlation);

                pairs.push({
                    xVar: v1,
                    yVar: v2,
                    correlationStrength: correlation,
                    insight,
                    recommended: Math.abs(correlation) > 0.6 // Recommend strong relationships
                });
            }
        }

        return pairs.sort((a, b) => Math.abs(b.correlationStrength) - Math.abs(a.correlationStrength));
    }

    private static calculateSimulatedCorrelation(v1: Variable, v2: Variable): number {
        // Mock logic: 
        // Growth & Discount rates = High Inverse Correlation
        if (v1.category === 'growth' && v2.category === 'discount') return -0.85;
        // Growth & Margin = Moderate Positive Correlation
        if (v1.category === 'growth' && v2.category === 'margin') return 0.45;

        return (Math.random() * 2 - 1) * 0.3; // Random weak correlation
    }

    private static generateInsight(v1: Variable, v2: Variable, correlation: number): string {
        if (correlation < -0.7) return `Strong inverse relationship between ${v1.label} and ${v2.label}. Balancing these is key.`;
        if (correlation > 0.7) return `High positive correlation. ${v1.label} amplifies ${v2.label}.`;
        return `Explore the interaction between ${v1.label} and ${v2.label}.`;
    }

    /**
     * Auto-selects a pair based on a natural language question (Mock NLP)
     */
    static autoSwitchForQuestion(question: string, variables: Variable[]): VariablePair | null {
        const q = question.toLowerCase();

        if (q.includes('recession')) {
            const rev = variables.find(v => v.id === 'revenue_growth');
            const margin = variables.find(v => v.id === 'ebitda_margin');
            if (rev && margin) return { xVar: rev, yVar: margin, correlationStrength: 0.5, insight: 'Stress test Revenue vs Margin', recommended: true };
        }

        if (q.includes('capital structure') || q.includes('wacc')) {
            const wacc = variables.find(v => v.id === 'wacc');
            const growth = variables.find(v => v.id === 'terminal_growth');
            if (wacc && growth) return { xVar: wacc, yVar: growth, correlationStrength: -0.9, insight: 'Classic WACC vs Growth sensitivity', recommended: true };
        }

        return null;
    }
}
