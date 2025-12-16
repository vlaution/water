import React, { useState, useEffect, useRef } from 'react';
import { useSensitivity } from '../../context/SensitivityContext';
import { Play, Pause, FastForward, Rewind, Clock, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimePoint {
    id: number;
    label: string;
    drift: number;
    divergence: 'base' | 'optimistic' | 'pessimistic';
}

export const TimeSensitivityPlayer: React.FC = () => {
    const { inputs, setInputs } = useSensitivity();
    const [isPlaying, setIsPlaying] = useState(false);
    const [quarter, setQuarter] = useState(1); // 1 to 4
    const intervalRef = useRef<any>(null);
    const [baseInputs] = useState(inputs);

    // Causal History Track (Ghost Trails)
    const [history, setHistory] = useState<{ q: number, center: { x: number, y: number } }[]>([]);

    // Scenario Divergence Paths
    const [activeBranch, setActiveBranch] = useState<'base' | 'optimistic' | 'pessimistic'>('base');

    const quarters: TimePoint[] = [
        { id: 1, label: "Q1 2024 (Actual)", drift: 0, divergence: 'base' },
        { id: 2, label: "Q2 2024 (Forecast)", drift: 0.05, divergence: 'base' },
        { id: 3, label: "Q3 2024 (Stress)", drift: -0.15, divergence: 'pessimistic' }, // Divergence
        { id: 4, label: "Q4 2024 (Recovery)", drift: 0.08, divergence: 'optimistic' }, // Divergence
    ];

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setQuarter(prev => {
                    if (prev >= 4) {
                        setIsPlaying(false);
                        return 1;
                    }
                    return prev + 1;
                });
            }, 2000); // 2s per quarter for cinematic feel
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying]);

    // Causal Drift Engine
    useEffect(() => {
        const currentQ = quarters.find(q => q.id === quarter);
        if (!currentQ || quarter === 1) {
            setHistory([]); // Reset history on restart
            setInputs(baseInputs);
            return;
        }

        // 1. Calculate Drift based on Branch + Time
        const branchFactor = activeBranch === 'optimistic' ? 1.2 : activeBranch === 'pessimistic' ? 0.8 : 1.0;
        const volatility = currentQ.drift * branchFactor;

        // 2. Apply Causal Shock (Cumulative from Base)
        const newInputs = { ...baseInputs };
        Object.keys(newInputs).forEach(key => {
            const k = key as keyof typeof newInputs;
            if (typeof newInputs[k] === 'number') {
                const stability = (key.length % 2 === 0 ? 1 : -1);
                // Non-linear drift: (1 + vol) ^ quarter
                newInputs[k] = (baseInputs[k] as number) * (1 + volatility * stability);
            }
        });

        // 3. Record Ghost Trail
        // Calculate a "Center of Gravity" for the visualization (approximate coords for simple UI overlay)
        // In a real app we'd map this to sensitivity space coordinates
        const ghostX = 50 + (volatility * 100);
        const ghostY = 50 - (volatility * 50);

        setHistory(prev => {
            // Keep unique history per quarter
            const existing = prev.filter(h => h.q !== quarter);
            return [...existing, { q: quarter, center: { x: ghostX, y: ghostY } }];
        });

        setInputs(newInputs);

    }, [quarter, baseInputs, setInputs, activeBranch]);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl z-20 text-white animate-fade-in-up">

            {/* Header / Branch Selector */}
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                    <Clock size={12} /> Causal Timeline
                </div>

                {/* Branch Switching UI */}
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {(['base', 'optimistic', 'pessimistic'] as const).map(branch => (
                        <button
                            key={branch}
                            onClick={() => setActiveBranch(branch)}
                            className={`px-3 py-1 rounded text-[10px] font-medium transition-all ${activeBranch === branch ?
                                (branch === 'optimistic' ? 'bg-emerald-500/20 text-emerald-300' : branch === 'pessimistic' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300')
                                : 'hover:bg-white/10 text-gray-400'}`}
                        >
                            <span className="capitalize">{branch}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setQuarter(1)}
                        className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                    >
                        <Rewind size={18} />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button
                        onClick={() => setQuarter(q => Math.min(4, q + 1))}
                        className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                    >
                        <FastForward size={18} />
                    </button>
                </div>

                {/* Scrubber / Timeline */}
                <div className="flex-1 relative h-12 flex flex-col justify-center">

                    {/* Ghost Trails (Dots above timeline) */}
                    <div className="absolute top-0 left-0 right-0 h-4 pointer-events-none">
                        <AnimatePresence>
                            {history.map(h => (
                                <motion.div
                                    key={h.q}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.5, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 blur-[1px]"
                                    style={{ left: `${(h.q / 4) * 100}%` }} // Simplified X pos
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                        <motion.div
                            layout
                            className={`absolute inset-y-0 left-0 bg-gradient-to-r transition-all duration-500 ease-out ${activeBranch === 'optimistic' ? 'from-emerald-900 to-emerald-400' : activeBranch === 'pessimistic' ? 'from-rose-900 to-rose-400' : 'from-blue-900 to-blue-400'}`}
                            style={{ width: `${(quarter / 4) * 100}%` }}
                        />
                    </div>

                    {/* Keyframes */}
                    <div className="flex justify-between w-full mt-2 px-0.5">
                        {[1, 2, 3, 4].map(q => (
                            <div
                                key={q}
                                onClick={() => setQuarter(q)}
                                className={`cursor-pointer transition-all flex flex-col items-center gap-1 group ${q <= quarter ? 'text-white' : 'text-gray-600'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-black transition-all ${q === quarter ? 'bg-white ring-blue-500' : q < quarter ? 'bg-blue-400/50 ring-transparent' : 'bg-gray-700 ring-transparent'}`} />
                                <span className="text-[9px] font-bold uppercase hidden group-hover:block absolute -bottom-4 whitespace-nowrap">
                                    {quarters.find(item => item.id === q)?.label.split(' ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Text */}
            <div className="absolute top-4 right-4 text-[10px] text-gray-400 font-mono flex items-center gap-2">
                <GitBranch size={10} />
                {activeBranch.toUpperCase()} PATH
                {isPlaying && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            </div>

        </div>
    );
};
