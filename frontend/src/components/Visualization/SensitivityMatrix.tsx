import React, { useRef, useEffect, useState } from 'react';
import { WebGLVisualizationEngine } from './WebGLVisualizationEngine';
import { useSensitivity } from '../../context/SensitivityContext';

export const SensitivityMatrix: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<WebGLVisualizationEngine | null>(null);
    const { activePair, calculate, inputs } = useSensitivity();
    const [generating, setGenerating] = useState(false);

    // Initialize WebGL
    useEffect(() => {
        if (canvasRef.current && !engineRef.current) {
            try {
                engineRef.current = new WebGLVisualizationEngine(canvasRef.current);
            } catch (e) {
                console.error("WebGL Init Failed", e);
            }
        }
    }, []);

    // Render Logic
    useEffect(() => {
        if (!engineRef.current || !activePair) return;

        setGenerating(true);

        const generateMatrix = async () => {
            // Generate a 50x50 grid (2500 calculations)
            // Offload via the Context's calculate (w/ caching)
            const steps = 50;
            const data = new Float32Array(steps * steps);

            // X-Axis range (activePair.xVar +/- 20%)
            const xBase = activePair.xVar.value;
            const yBase = activePair.yVar.value;

            const xRange = xBase * 0.4; // +/- 20%
            const yRange = yBase * 0.4;

            let minVal = Infinity;
            let maxVal = -Infinity;

            // Simple loop for now. In "High Perf" pipeline this would be batched.
            // Using small timeout to not freeze UI if calculate is synchronous (it's worker based so it's async)

            const promises: Promise<number>[] = [];

            for (let y = 0; y < steps; y++) {
                for (let x = 0; x < steps; x++) {
                    const xVal = (xBase - xRange / 2) + (x / steps) * xRange;
                    const yVal = (yBase - yRange / 2) + (y / steps) * yRange;

                    const iterInputs = {
                        ...inputs,
                        [activePair.xVar.id]: xVal,
                        [activePair.yVar.id]: yVal
                    };

                    promises.push(calculate(iterInputs));
                }
            }

            const results = await Promise.all(promises);

            results.forEach((val, i) => {
                data[i] = val;
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            });

            // Render Frame
            // We need to pass the probability center/stdDev. 
            // In a real app these come from ScenarioPainter or Analysis.
            // For Sci-Fi demo, we'll pulse them or just set standard values.
            const probCenter: [number, number] = [0.5, 0.5];
            const probStdDev: [number, number] = [0.2 + Math.sin(Date.now() / 1000) * 0.05, 0.2]; // Pulse effect

            engineRef.current?.render(data, steps, steps, minVal, maxVal, probCenter, probStdDev);
            setGenerating(false);
        };

        generateMatrix();

    }, [activePair, inputs, calculate]); // Re-run when inputs change (e.g. slider drag)

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 bg-black">
            <canvas
                ref={canvasRef}
                width={800} // High Res internal
                height={600}
                className="w-full h-full object-cover"
            />
            {generating && (
                <div className="absolute top-2 right-2 text-[10px] text-green-400 font-mono animate-pulse">
                    GPU_COMPUTE :: ACTIVE
                </div>
            )}

            {/* Axis Labels Overlay */}
            {activePair && (
                <>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/50 font-mono">
                        {activePair.xVar.label} →
                    </div>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-white/50 font-mono">
                        {activePair.yVar.label} →
                    </div>
                </>
            )}
        </div>
    );
};
