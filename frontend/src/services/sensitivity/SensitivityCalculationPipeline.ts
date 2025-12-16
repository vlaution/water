import type { SensitivityInputs, CalculationRequest, CalculationResult } from '../../workers/sensitivity.worker';

// Define a type for the Worker class if strict typing is needed, 
// or utilize the specific worker loader pattern of Vite/Webpack
// For Vite: import MyWorker from './worker?worker'

export class SensitivityCalculationPipeline {
    private worker: Worker;
    private cache: Map<string, number> = new Map();
    private pendingRequests: Map<string, (result: CalculationResult) => void> = new Map();

    constructor() {
        // Initialize Worker
        // In a real Vite app, we import properly. For now, assuming standard instantiation works or fix later.
        this.worker = new Worker(new URL('../../workers/sensitivity.worker.ts', import.meta.url), { type: 'module' });

        this.worker.onmessage = (e: MessageEvent<CalculationResult>) => {
            const { id } = e.data;
            const resolve = this.pendingRequests.get(id);
            if (resolve) {
                resolve(e.data);
                this.pendingRequests.delete(id);
            }
        };
    }

    // --- Predictive Caching Logic ---
    // Generates a cache key based on inputs to O(1) retrieve calculated values
    private generateKey(inputs: SensitivityInputs): string {
        // Quantize inputs to limit cache bloat (e.g. 4 decimals)
        return `${inputs.wacc.toFixed(4)}|${inputs.terminalGrowth.toFixed(4)}|${inputs.revenueGrowth.toFixed(4)}|${inputs.ebitdaMargin.toFixed(4)}`;
    }

    public async calculate(inputs: SensitivityInputs): Promise<number> {
        const key = this.generateKey(inputs);

        // 1. Check Cache
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        // 2. Offload to Worker
        const id = crypto.randomUUID();
        return new Promise<number>((resolve) => {
            // Register callback
            this.pendingRequests.set(id, (result) => {
                // Warning: Unbounded cache growth. Need LRU in production.
                this.cache.set(key, result.enterpriseValue);
                resolve(result.enterpriseValue);
            });

            this.worker.postMessage({
                type: 'CALCULATE',
                id,
                inputs
            } as CalculationRequest);
        });
    }

    // --- Predictive Engine ---
    // "Warm" the cache for likely next values (neighbors)
    public precomputeNeighbors(currentInputs: SensitivityInputs) {
        // Example: User is dragging WACC. Precompute WACC +/- 0.5%
        const steps = [-0.001, 0.001]; // +/- 10 bps

        steps.forEach(step => {
            const nextInputs = { ...currentInputs, wacc: currentInputs.wacc + step };
            const key = this.generateKey(nextInputs);
            if (!this.cache.has(key)) {
                // Fire and forget (low priority)
                const id = `pre_${crypto.randomUUID()}`;
                this.worker.postMessage({ type: 'CALCULATE', id, inputs: nextInputs });

                // We'd need a separate handler for PRECOMPUTE results to silently update cache
                // For now, reusing the main handler but we won't await `precomputeNeighbors`
            }
        });
    }

    public terminate() {
        this.worker.terminate();
    }
}
