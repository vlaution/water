import React, { useRef, useState, useEffect } from 'react';
import { MousePointer2, Zap, Keyboard } from 'lucide-react';

interface ParameterSliderProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    step?: number; // Base step
    format?: 'percent' | 'decimal';
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
    label, value, onChange, min = 0, max = 1, step = 0.01, format = 'decimal'
}) => {
    const [mode, setMode] = useState<'coarse' | 'fine' | 'exact'>('coarse');
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef<number>(0);
    const startValRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);



    // Drag Logic (Apple-style invisible slider)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode === 'exact') return;
        setIsDragging(true);
        startXRef.current = e.clientX;
        startValRef.current = value;
        document.body.style.cursor = 'ew-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startXRef.current;
            // Sensitivity Factor
            const factor = mode === 'coarse' ? step : (step * 0.1);
            const deltaVal = deltaX * factor; // 1px = 1 step unit

            let nextVal = startValRef.current + deltaVal;
            if (min !== undefined) nextVal = Math.max(min, nextVal);
            if (max !== undefined) nextVal = Math.min(max, nextVal);

            onChange(nextVal);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, mode, step, min, max, onChange]);

    // Formatting
    const displayValue = format === 'percent'
        ? `${(value * 100).toFixed(mode === 'fine' ? 2 : 1)}%`
        : value.toFixed(mode === 'fine' ? 4 : 2);

    return (
        <div className="select-none group">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    {label}
                    {mode === 'fine' && <Zap size={10} className="text-yellow-400" />}
                </label>

                {/* Mode Selector */}
                <div className="flex bg-white/5 rounded-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setMode('coarse')}
                        className={`p-1 rounded ${mode === 'coarse' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Coarse (Drag)"
                    >
                        <MousePointer2 size={10} />
                    </button>
                    <button
                        onClick={() => setMode('fine')}
                        className={`p-1 rounded ${mode === 'fine' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Fine (Precise Drag)"
                    >
                        <Zap size={10} />
                    </button>
                    <button
                        onClick={() => setMode('exact')}
                        className={`p-1 rounded ${mode === 'exact' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Exact (Type)"
                    >
                        <Keyboard size={10} />
                    </button>
                </div>
            </div>

            <div
                className={`
                    relative h-9 rounded-xl border transition-all overflow-hidden shadow-sm
                    ${mode === 'exact' ? 'bg-white border-blue-500 ring-2 ring-blue-100' : 'bg-white/50 border-white/40 hover:bg-white/80 cursor-ew-resize'}
                `}
                onMouseDown={handleMouseDown}
            >
                {/* Visual Progress Bar (for Coarse/Fine) */}
                {mode !== 'exact' && min !== undefined && max !== undefined && (
                    <div
                        className="absolute top-0 left-0 h-full bg-blue-500/10"
                        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                    />
                )}

                {/* Value Display / Input */}
                <div className="absolute inset-0 flex items-center px-3">
                    {mode === 'exact' ? (
                        <input
                            ref={inputRef}
                            type="number"
                            value={value}
                            step={step * 0.1}
                            onChange={(e) => onChange(parseFloat(e.target.value))}
                            className="w-full bg-transparent text-gray-900 font-mono text-sm focus:outline-none font-bold"
                            autoFocus
                            onBlur={() => setMode('coarse')}
                        />
                    ) : (
                        <span className="text-sm font-mono text-gray-900 font-bold relative z-10">
                            {displayValue}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
