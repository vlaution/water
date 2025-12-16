import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useSensitivity } from '../../context/SensitivityContext';
import { PeerBenchmarkService } from '../../services/PeerBenchmarkService';
import type { BenchmarkData } from '../../services/PeerBenchmarkService';
import { Radar } from 'lucide-react';

// Math Helpers
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

// Component
export const FinancialRadar: React.FC = () => {
    const { inputs, updateInput } = useSensitivity();
    const benchmarks = useMemo(() => PeerBenchmarkService.getBenchmarks(), []);

    // Config
    const width = 400;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = 140; // Leave padding

    // State for interactions
    const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

    // Calculate Points
    const getPoints = (datasetType: 'current' | 'industry' | 'best') => {
        return benchmarks.map((b, i) => {
            const angle = (360 / benchmarks.length) * i;

            let value = 0;
            if (datasetType === 'current') {
                // If mapping exists, use live input, else use midpoint for demo
                value = b.inputKey && inputs[b.inputKey as keyof typeof inputs] !== undefined
                    ? (inputs[b.inputKey as keyof typeof inputs] as number)
                    : (b.min + b.max) / 2;
            } else if (datasetType === 'industry') {
                value = b.industryAvg;
            } else {
                value = b.bestInClass;
            }

            // Normalize (Clamp to min/max)
            const normalized = Math.max(0, Math.min(1, (value - b.min) / (b.max - b.min)));

            // For WACC and Capex, lower is often better/outward? 
            // For simplicity, let's assume "Higher Value = Further out" 
            // BUT for 'Cost' metrics we might want to invert. Let's keep it simple: Raw Value mapping.

            const radius = normalized * maxRadius;
            return {
                ...polarToCartesian(centerX, centerY, radius, angle),
                value,
                normalized,
                angle,
                metric: b
            };
        });
    };

    const currentPoints = getPoints('current');
    const industryPoints = getPoints('industry');
    const bestPoints = getPoints('best');

    // Generate Path String
    const polyString = (points: { x: number, y: number }[]) => {
        return points.map(p => `${p.x},${p.y}`).join(' ');
    };

    // Drag Handler
    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number, metric: BenchmarkData) => {
        if (!metric.inputKey) return;

        const p = currentPoints[index];
        // Vector from center to drag point
        // We only care about the distance from center projected onto the spoke vector
        // But simpler: just get distance from center of the touch point

        // Approx new radius based on drag delta (simple projection)
        // Correct way: Calculate distance of cursor from center
        // Since we are in SVG space, we might need ref bounding rect. 
        // Let's rely on Framer Motion's delta projection relative to the current point?
        // Actually, simplest UX: Since we can't easily get cursor pos relative to SVG center in useDrag callback without refs,
        // let's just use the `point` delta to increase/decrease value.

        const sensitivity = 0.001 * (metric.max - metric.min); // Scale sensitivity
        // Dot product with spoke vector to determine "out" or "in" drag
        // Vector Spoke: (p.x - centerX, p.y - centerY)
        // Vector Drag: (info.delta.x, info.delta.y)

        const spokeX = p.x - centerX;
        const spokeY = p.y - centerY;
        const mag = Math.sqrt(spokeX * spokeX + spokeY * spokeY);
        const normX = spokeX / mag;
        const normY = spokeY / mag;

        const dot = (info.delta.x * normX) + (info.delta.y * normY);

        // Update Input
        const currentVal = inputs[metric.inputKey as keyof typeof inputs] as number;
        let newVal = currentVal + (dot * sensitivity * 2.0); // *2 for speed

        // Clamp
        newVal = Math.max(metric.min, Math.min(metric.max, newVal));

        updateInput(metric.inputKey as any, newVal);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative glass-panel p-4">
            <h3 className="absolute top-4 left-4 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Radar size={14} className="text-blue-500" />
                Financial Peer Radar
            </h3>

            <div className="relative">
                <svg width={width} height={height} className="overflow-visible">
                    {/* Grid Webs */}
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map(r => (
                        <circle
                            key={r}
                            cx={centerX}
                            cy={centerY}
                            r={maxRadius * r}
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Spokes */}
                    {benchmarks.map((b, i) => {
                        const angle = (360 / benchmarks.length) * i;
                        const edge = polarToCartesian(centerX, centerY, maxRadius + 20, angle);
                        return (
                            <React.Fragment key={i}>
                                <line
                                    x1={centerX} y1={centerY}
                                    x2={edge.x} y2={edge.y}
                                    stroke="rgba(255,255,255,0.1)" strokeWidth={1}
                                    strokeDasharray="4 4"
                                />
                                {/* Label */}
                                <g transform={`translate(${edge.x}, ${edge.y})`}>
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill={hoveredMetric === b.metric ? '#3b82f6' : '#6b7280'}
                                        fontSize={10}
                                        fontWeight="bold"
                                        className="uppercase tracking-wide"
                                    >
                                        {b.label}
                                    </text>
                                </g>
                            </React.Fragment>
                        );
                    })}

                    {/* Industry Polygon */}
                    <motion.polygon
                        points={polyString(industryPoints)}
                        fill="rgba(100, 100, 100, 0.1)"
                        stroke="#6b7280"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                    />

                    {/* Best-in-Class Polygon */}
                    <motion.polygon
                        points={polyString(bestPoints)}
                        fill="rgba(255, 215, 0, 0.05)"
                        stroke="#fbbf24"
                        strokeWidth={1}
                        strokeOpacity={0.5}
                    />

                    {/* Current Polygon (The Target) */}
                    <motion.polygon
                        points={polyString(currentPoints)}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        filter="url(#glow)"
                        animate={{ d: `path("${polyString(currentPoints)}")` }} // Tries to animate, though polygon uses 'points'
                    />

                    {/* Defs for Glow */}
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Interactive Handles */}
                    {currentPoints.map((p, i) => {
                        const metric = p.metric;
                        const isDraggable = !!metric.inputKey;

                        return (
                            <motion.g
                                key={i}
                                drag={isDraggable}
                                dragMomentum={false}
                                dragElastic={0}
                                onDrag={(e, info) => handleDrag(e, info, i, metric)}
                                whileHover={{ scale: 1.2 }}
                                onHoverStart={() => setHoveredMetric(metric.metric)}
                                onHoverEnd={() => setHoveredMetric(null)}
                            >
                                <circle
                                    cx={p.x} cy={p.y} r={6}
                                    fill={isDraggable ? "#3b82f6" : "#1f2937"}
                                    stroke="white" strokeWidth={2}
                                    className={isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
                                />

                                {/* Floating Tooltip value on hover */}
                                {hoveredMetric === metric.metric && (
                                    <g transform={`translate(${p.x}, ${p.y - 15})`}>
                                        <rect x="-30" y="-20" width="60" height="20" rx="4" fill="black" fillOpacity="0.8" />
                                        <text x="0" y="-6" textAnchor="middle" fill="white" fontSize="10">
                                            {metric.format === 'percent' ? (p.value * 100).toFixed(1) + '%' : p.value.toFixed(2)}
                                        </text>
                                    </g>
                                )}
                            </motion.g>
                        );
                    })}

                </svg>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 text-[10px] font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500/50 border border-blue-400" />
                    Current (Draggable)
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-yellow-500 bg-yellow-500/10" />
                    Best-in-Class
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-gray-500 border-dashed" />
                    Industry Avg
                </div>
            </div>
        </div>
    );
};
