import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, Wand2 } from 'lucide-react';

interface ScenarioPainterProps {
    onDistributionChange?: (distribution: number[]) => void;
}

export const ScenarioPainter: React.FC<ScenarioPainterProps> = ({ onDistributionChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState<{ x: number, y: number }[]>([]);

    // Setup Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid Lines
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }

        // Draw active curve
        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            // Catmull-Rom or simple straight lines for now
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Gradient fill
            ctx.lineTo(points[points.length - 1].x, canvas.height);
            ctx.lineTo(points[0].x, canvas.height);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
            grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
            ctx.fillStyle = grad;
            ctx.fill();
        }

    }, [points]);

    const handleMouseDown = () => {
        setIsDrawing(true);
        setPoints([]); // Clear on new draw
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add point
        setPoints(prev => [...prev, { x, y }]);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        // Normalize points to distribution array
        if (onDistributionChange) {
            // Logic to convert X/Y curve to probability array
            onDistributionChange([]);
        }
    };

    // AI Assist: Generate "Normal Distribution"
    const generateNormal = () => {
        const width = canvasRef.current?.width || 300;
        const height = canvasRef.current?.height || 150;
        const newPoints = [];
        for (let x = 0; x <= width; x += 5) {
            // Gaussian bell curve
            const mean = width / 2;
            const stdDev = width / 6;
            const y = height - (Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2))) * (height * 0.8));
            newPoints.push({ x, y });
        }
        setPoints(newPoints);
    };

    return (
        <div className="relative group">
            <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setPoints([])}
                    className="p-1.5 bg-white/10 rounded-md text-white hover:bg-white/20"
                    title="Clear"
                >
                    <RefreshCw size={14} />
                </button>
                <button
                    onClick={generateNormal}
                    className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 border border-blue-500/50"
                    title="AI Suggest: Normal Dist"
                >
                    <Wand2 size={14} />
                </button>
            </div>

            <canvas
                ref={canvasRef}
                width={400}
                height={160}
                className="w-full h-40 bg-[#0a0a0a] rounded-xl border border-white/10 cursor-crosshair active:cursor-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            <div className="mt-1 text-center text-xs text-gray-500">
                Draw to define probability distribution
            </div>
        </div>
    );
};
