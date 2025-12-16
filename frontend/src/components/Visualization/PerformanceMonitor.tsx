import React, { useEffect, useState, useRef } from 'react';
import { useSensitivity } from '../../context/SensitivityContext';
import { Activity, Zap, Cpu } from 'lucide-react';

export const PerformanceMonitor: React.FC = () => {
    const { isCalculating, lastCalculationDuration } = useSensitivity();
    const [fps, setFps] = useState(60);
    const [memory, setMemory] = useState(0);

    // FPS Tracker
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());

    useEffect(() => {
        let animationFrameId: number;

        const loop = () => {
            const now = performance.now();
            frameCount.current++;

            if (now - lastTime.current >= 1000) {
                setFps(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
                frameCount.current = 0;
                lastTime.current = now;

                // Memory Check (Chrome Only)
                if ((performance as any).memory) {
                    setMemory(Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024));
                }
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Color coding
    const getFpsColor = (val: number) => val >= 55 ? 'text-green-400' : val >= 30 ? 'text-yellow-400' : 'text-red-400';
    const getLatColor = (val: number) => val < 16 ? 'text-green-400' : val < 50 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="absolute top-4 left-4 z-50 pointer-events-none opacity-80 font-mono text-[10px] space-y-1">
            <div className="bg-black/80 backdrop-blur border border-white/10 px-2 py-1 rounded flex items-center gap-2 text-gray-400">
                <Activity size={10} />
                <span>FPS: <span className={`font-bold ${getFpsColor(fps)}`}>{fps}</span></span>
            </div>

            <div className="bg-black/80 backdrop-blur border border-white/10 px-2 py-1 rounded flex items-center gap-2 text-gray-400">
                <Zap size={10} />
                <span>LAT: <span className={`font-bold ${isCalculating ? 'text-blue-400 animate-pulse' : getLatColor(lastCalculationDuration || 0)}`}>
                    {isCalculating ? '...' : (lastCalculationDuration ? lastCalculationDuration.toFixed(1) : '-')}ms
                </span></span>
            </div>

            {memory > 0 && (
                <div className="bg-black/80 backdrop-blur border border-white/10 px-2 py-1 rounded flex items-center gap-2 text-gray-400">
                    <Cpu size={10} />
                    <span>MEM: <span className="font-bold text-blue-400">{memory}MB</span></span>
                </div>
            )}
        </div>
    );
};
