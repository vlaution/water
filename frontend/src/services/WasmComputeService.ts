import init, { run_monte_carlo } from '../../wasm-engine/wasm-pkg/wasm_engine';

class WasmComputeService {
    private isInitialized = false;

    async init() {
        if (!this.isInitialized) {
            await init();
            this.isInitialized = true;
        }
    }

    async runMonteCarlo(mean: number, std_dev: number, iterations: number = 10000) {
        await this.init();
        try {
            // JS object is automatically serialized by serde-wasm-bindgen
            const result = run_monte_carlo({ mean, std_dev, iterations });
            return result;
        } catch (e) {
            console.error("Wasm Error:", e);
            // Fallback to JS if Wasm fails
            return this.runMonteCarloJS(mean, std_dev, iterations);
        }
    }

    // Fallback implementation
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
