import init, { run_monte_carlo, calculate_lbo, calculate_sensitivity } from '@wasm/wasm_engine';

export interface LBOInput {
    solve_for: string; // Enum string
    entry_revenue: number;
    entry_ebitda: number;
    entry_ev_ebitda_multiple?: number;
    financing: {
        tranches: any[];
        total_leverage_ratio?: number;
        equity_contribution_percent?: number;
    };
    assumptions: any;
    revenue_growth_rate: number;
    ebitda_margin: number;
    capex_percentage: number;
    nwc_percentage: number;
    tax_rate: number;
    holding_period: number;
    exit_ev_ebitda_multiple?: number;
    target_irr?: number;
    include_sensitivity?: boolean;
    refinancing_config?: any;
    covenants?: any[];
    mip_assumptions?: any;
    tax_assumptions?: any;
}

export interface SensitivityInput {
    variable_1: string;
    range_1: number[];
    variable_2: string;
    range_2: number[];
}

export interface LBOResult {
    irr: number;
    moic: number;
    entry_valuation: number;
    exit_valuation: number;
    equity_check: number;
    created_at_ms: number;
    error?: string;
}

class WasmComputeService {
    private isInitialized = false;

    async init() {
        if (!this.isInitialized) {
            await init();
            this.isInitialized = true;
        }
    }

    // Existing Monte Carlo
    async runMonteCarlo(mean: number, std_dev: number, iterations: number = 10000) {
        await this.init();
        try {
            return run_monte_carlo({ mean, std_dev, iterations });
        } catch (e) {
            console.error("Wasm MonteCarlo Error:", e);
            return this.runMonteCarloJS(mean, std_dev, iterations);
        }
    }

    // New LBO Method
    async calculateLBO(input: LBOInput): Promise<LBOResult> {
        await this.init();
        try {
            return calculate_lbo(input);
        } catch (e) {
            console.error("Wasm LBO Error:", e);
            throw e;
        }
    }

    // New Sensitivity Method
    async calculateSensitivity(input: LBOInput, sensitivity: SensitivityInput): Promise<number[][]> {
        await this.init();
        try {
            return calculate_sensitivity(input, sensitivity);
        } catch (e) {
            console.error("Wasm Sensitivity Error:", e);
            throw e;
        }
    }

    private runMonteCarloJS(mean: number, stdDev: number, iterations: number) {
        const results = [];
        for (let i = 0; i < iterations; i++) {
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            results.push(mean + z0 * stdDev);
        }
        results.sort((a, b) => a - b);
        return {
            p10: results[Math.floor(iterations * 0.1)],
            p50: results[Math.floor(iterations * 0.5)],
            p90: results[Math.floor(iterations * 0.9)],
        };
    }
}

export const wasmCompute = new WasmComputeService();
