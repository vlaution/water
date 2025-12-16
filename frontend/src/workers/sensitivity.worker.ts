// sensitivity.worker.ts

// Define input types for the calculation
export interface CalculationRequest {
    type: 'CALCULATE' | 'PRECOMPUTE';
    id: string; // Request ID to match response
    inputs: SensitivityInputs;
}

export interface SensitivityInputs {
    wacc: number;
    terminalGrowth: number;
    revenueGrowth: number;
    ebitdaMargin: number;
    // ... other DCF inputs
    baseFCF: number; // Simplified starting point
    taxRate: number;
}

export interface CalculationResult {
    id: string;
    enterpriseValue: number;
    equityValue: number;
}

// --- Simplified DCF Engine (To be optimized/replaced by Wasm later) ---
function calculateDCF(inputs: SensitivityInputs): number {
    // 1. Project FCF for 5 years
    let fcf = inputs.baseFCF;
    let sumPV = 0;

    for (let i = 1; i <= 5; i++) {
        fcf = fcf * (1 + inputs.revenueGrowth); // Simplified: Rev growth drives FCF growth direct
        // Real model would include Margin impact, Capex, NWC
        const pvFactor = Math.pow(1 + inputs.wacc, i);
        sumPV += fcf / pvFactor;
    }

    // 2. Terminal Value
    // Gordon Growth Method
    const terminalValue = (fcf * (1 + inputs.terminalGrowth)) / (inputs.wacc - inputs.terminalGrowth);
    const terminalPV = terminalValue / Math.pow(1 + inputs.wacc, 5);

    return sumPV + terminalPV;
}

// --- Worker Message Handler ---
self.onmessage = (e: MessageEvent<CalculationRequest>) => {
    const { type, id, inputs } = e.data;

    if (type === 'CALCULATE') {
        const ev = calculateDCF(inputs);
        // Mocking Equity Value (EV - Net Debt)
        const equityVal = ev - 500; // Assume 500 Net Debt

        const result: CalculationResult = {
            id,
            enterpriseValue: ev,
            equityValue: equityVal
        };

        self.postMessage(result);
    }
    else if (type === 'PRECOMPUTE') {
        // High-perf batch processing for predictive caching
        // ... logic placeholders
    }
};
