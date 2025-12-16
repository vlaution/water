
// Defines the shape of our benchmark data
export interface BenchmarkData {
    metric: string;
    label: string;
    industryAvg: number;
    bestInClass: number;
    min: number;
    max: number;
    format: 'percent' | 'currency' | 'number';
    // Key in SensitivityInputs to map back to
    inputKey?: string;
}

export const PEER_BENCHMARKS: BenchmarkData[] = [
    {
        metric: 'ebitdaMargin',
        label: 'EBITDA Margin',
        industryAvg: 0.18,
        bestInClass: 0.35,
        min: 0.05,
        max: 0.50,
        format: 'percent',
        inputKey: 'ebitdaMargin'
    },
    {
        metric: 'revenueGrowth',
        label: 'Rev Growth',
        industryAvg: 0.04,
        bestInClass: 0.12,
        min: -0.05,
        max: 0.25,
        format: 'percent',
        inputKey: 'revenueGrowth'
    },
    {
        metric: 'wacc',
        label: 'WACC',
        industryAvg: 0.08, // Lower is better usually, but for radar we might invert or just plot
        bestInClass: 0.06,
        min: 0.04,
        max: 0.12,
        format: 'percent',
        inputKey: 'wacc'
    },
    {
        metric: 'terminalGrowth',
        label: 'Term Growth',
        industryAvg: 0.02,
        bestInClass: 0.035,
        min: 0.01,
        max: 0.05,
        format: 'percent',
        inputKey: 'terminalGrowth'
    },
    {
        metric: 'capexRatio', // Mock derived input
        label: 'Capex/Rev',
        industryAvg: 0.05,
        bestInClass: 0.03,
        min: 0.01,
        max: 0.15,
        format: 'percent'
    },
    {
        metric: 'roic', // Mock derived
        label: 'ROIC',
        industryAvg: 0.10,
        bestInClass: 0.22,
        min: 0.0,
        max: 0.40,
        format: 'percent'
    }
];

export const PeerBenchmarkService = {
    getBenchmarks: () => PEER_BENCHMARKS
};
