import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { SensitivityCalculationPipeline } from '../services/sensitivity/SensitivityCalculationPipeline';
import { VariablePairingEngine } from '../services/sensitivity/VariablePairingEngine';
import type { Variable, VariablePair } from '../services/sensitivity/VariablePairingEngine';
import type { SensitivityInputs } from '../workers/sensitivity.worker';
import { wasmCompute } from '../services/WasmComputeService';

// --- Types ---
interface SensitivityContextType {
    inputs: SensitivityInputs;
    setInputs: (inputs: SensitivityInputs) => void;
    updateInput: (key: keyof SensitivityInputs, value: number) => void;

    // Engine Access
    calculate: (inputs: SensitivityInputs) => Promise<number>;
    isCalculating: boolean;
    lastCalculationDuration: number;

    // Variables & Pairing
    variables: Variable[];
    activePair: VariablePair | null;
    setActivePair: (pair: VariablePair) => void;
    suggestedPairs: VariablePair[];
}

const SensitivityContext = createContext<SensitivityContextType | undefined>(undefined);

export const SensitivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Core State
    const [inputs, setInputs] = useState<SensitivityInputs>({
        wacc: 0.085,
        terminalGrowth: 0.025,
        revenueGrowth: 0.15,
        ebitdaMargin: 0.25,
        baseFCF: 1000,
        taxRate: 0.21
    });

    const [isCalculating, setIsCalculating] = useState(false);
    const pipelineRef = useRef<SensitivityCalculationPipeline | null>(null);

    const [lastCalculationDuration, setLastCalculationDuration] = useState(0);

    // 2. Variable State
    const [variables] = useState<Variable[]>([
        { id: 'wacc', label: 'WACC', value: 0.085, category: 'discount' },
        { id: 'terminalGrowth', label: 'Terminal Growth', value: 0.025, category: 'growth' },
        { id: 'revenueGrowth', label: 'Revenue CAGR', value: 0.15, category: 'growth' },
        { id: 'ebitdaMargin', label: 'EBITDA Margin', value: 0.25, category: 'margin' }
    ]);

    const [activePair, setActivePair] = useState<VariablePair | null>(null);
    const [suggestedPairs, setSuggestedPairs] = useState<VariablePair[]>([]);

    // 3. Initialize Pipeline
    useEffect(() => {
        pipelineRef.current = new SensitivityCalculationPipeline();

        // Initialize Wasm Engine
        wasmCompute.init().then(() => {
            console.log('✅ Wasm Engine Initialized');
        }).catch(err => console.warn('⚠️ Wasm Init Failed:', err));

        // Initial Suggestions
        const pairs = VariablePairingEngine.suggestOptimalPairs(variables);
        setSuggestedPairs(pairs);
        if (pairs.length > 0) setActivePair(pairs[0]);

        return () => pipelineRef.current?.terminate();
    }, []);

    // 4. Actions
    const updateInput = useCallback((key: keyof SensitivityInputs, value: number) => {
        setInputs(prev => {
            const next = { ...prev, [key]: value };
            // Optional: Trigger pre-computation of neighbors here
            pipelineRef.current?.precomputeNeighbors(next);
            return next;
        });
    }, []);

    const calculate = useCallback(async (calcInputs: SensitivityInputs) => {
        if (!pipelineRef.current) return 0;

        const start = performance.now();
        setIsCalculating(true);

        const result = await pipelineRef.current.calculate(calcInputs);

        const end = performance.now();
        setLastCalculationDuration(end - start);
        setIsCalculating(false);

        return result;
    }, []);

    return (
        <SensitivityContext.Provider value={{
            inputs,
            setInputs,
            updateInput,
            calculate,
            isCalculating,
            lastCalculationDuration,
            variables,
            activePair,
            setActivePair,
            suggestedPairs
        }}>
            {children}
        </SensitivityContext.Provider>
    );
};

export const useSensitivity = () => {
    const context = useContext(SensitivityContext);
    if (!context) throw new Error("useSensitivity must be used within SensitivityProvider");
    return context;
};
