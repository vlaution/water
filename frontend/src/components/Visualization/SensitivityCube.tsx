import React from 'react';
import { useSensitivity } from '../../context/SensitivityContext';
import { Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const SensitivityCube: React.FC = () => {
    const { inputs, variables, updateInput, activePair } = useSensitivity();

    // Find a 3rd variable that is NOT in the active pair
    // Default to the first one available
    const zVarId = variables.find(v => v.id !== activePair?.xVar.id && v.id !== activePair?.yVar.id)?.id || 'wacc';
    const zVar = variables.find(v => v.id === zVarId);

    // Create 3 slices: Low, Current, High
    const range = 0.05; // 5% shift
    const currentVal = inputs[zVarId as keyof typeof inputs] as number;

    const slices = [
        { id: 'high', label: 'High (+5%)', val: currentVal * (1 + range) },
        { id: 'curr', label: 'Current', val: currentVal },
        { id: 'low', label: 'Low (-5%)', val: currentVal * (1 - range) },
    ];

    if (!activePair || !zVar) return null;

    return (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg pointer-events-auto w-40">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase">
                    <Layers size={14} />
                    <span>Z-Axis Slicer</span>
                </div>

                <div className="text-sm font-medium text-white mb-3">
                    {zVar.label}
                </div>

                <div className="flex flex-col gap-1.5 relative perspective-[1000px]">
                    {slices.map((slice) => (
                        <motion.button
                            key={slice.id}
                            onClick={() => updateInput(zVarId as any, slice.val)}
                            className={`
                                relative h-12 w-full rounded border transition-all duration-300 group
                                flex items-center justify-center text-xs font-mono
                                ${slice.id === 'curr'
                                    ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 scale-105'
                                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:border-white/20 scale-95 opacity-60'
                                }
                            `}
                            style={{
                                transform: slice.id === 'curr'
                                    ? 'translateZ(0px)'
                                    : `translateY(${slice.id === 'high' ? '2px' : '-2px'}) scale(0.9) translateZ(-20px)`,
                            }}
                        >
                            <span className="bg-black/50 px-1 rounded">
                                {['percent', 'margin'].includes(zVar.category)
                                    ? (slice.val * 100).toFixed(1) + '%'
                                    : slice.val.toFixed(2)}
                            </span>

                            {/* Fake Heatmap Grid Background */}
                            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)]" />
                        </motion.button>
                    ))}

                    {/* Connecting Lines (Visual Cue for "Stack") */}
                    <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent -z-10" />
                </div>

                <div className="mt-3 text-[10px] text-center text-gray-500">
                    Click slice to jump
                </div>
            </div>
        </div>
    );
};
