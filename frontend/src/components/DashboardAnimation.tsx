import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, ShieldCheck, 
    LayoutGrid, Database, FileSpreadsheet, GitBranch, Calculator
} from 'lucide-react';

// --- Enterprise UI Components ---

const Panel = ({ children, className = "", isDimmed = false }: { children: React.ReactNode, className?: string, isDimmed?: boolean }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
            opacity: isDimmed ? 0.2 : 1, 
            y: 0,
            scale: isDimmed ? 0.98 : 1,
            filter: isDimmed ? "blur(2px) grayscale(100%)" : "blur(0px) grayscale(0%)"
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} 
        className={`bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl ring-1 ring-white/5 rounded-xl overflow-hidden transition-all relative ${className}`}
    >
        {children}
        {!isDimmed && (
             <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
             />
        )}
    </motion.div>
);

const MetricValue = ({ end, duration = 2, prefix = "", suffix = "", delay = 0 }: { end: number, duration?: number, prefix?: string, suffix?: string, delay?: number }) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / (duration * 1000), 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            setValue(progress === 1 ? end : end * ease);
            if (progress < 1) requestAnimationFrame(animate);
        };
        
        const timer = setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
        }, delay * 1000);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(animationFrame);
        };
    }, [end, duration, delay]);

    return (
        <span className="font-mono tracking-tighter tabular-nums text-white">
            {prefix}{value.toFixed(1)}{suffix}
        </span>
    );
};

// --- Narrative Overlays ---
const CinematicOverlay = ({ text, subtext, isActive, icon: Icon }: { text: string, subtext: string, isActive: boolean, icon: any }) => (
    <AnimatePresence>
        {isActive && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]"
            >
                <div className="bg-[#050505]/90 border border-white/10 px-8 py-4 rounded-full flex items-center space-x-4 shadow-2xl ring-1 ring-white/10">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="p-1 bg-white/5 rounded-full"
                    >
                         <Icon className="w-4 h-4 text-indigo-400" />
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold tracking-widest text-xs uppercase">{text}</span>
                        <span className="text-indigo-400 text-[10px] tracking-tight font-mono">{subtext}</span>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- Dashboard Layout ---

export const DashboardAnimation = () => {
    // Narrative Phase State: 0=Init, 1=CONNECT, 2=PROCESS, 3=RESOLVE, 4=HOLD
    const [phase, setPhase] = useState(0);
    
    useEffect(() => {
        const schedule = [
            { p: 1, t: 500   }, // Connect Start
            { p: 2, t: 3500  }, // Process Start
            { p: 3, t: 6500  }, // Resolve Start
            { p: 4, t: 10000 }, // Hold
            { p: 0, t: 14000 }, // Reset
        ];

        let timeouts: NodeJS.Timeout[] = [];
        schedule.forEach(({ p, t }) => {
            timeouts.push(setTimeout(() => setPhase(p), t));
        });
        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="w-full h-full bg-[#050505] text-gray-400 font-sans overflow-hidden flex flex-col relative selection:bg-indigo-500/30">
            
            {/* Cinematic Overlays - UPDATED FOR AUTOMATION NARRATIVE */}
            <CinematicOverlay 
                text="Excel Sync" 
                subtext="Ingesting Models..." 
                isActive={phase === 1} 
                icon={FileSpreadsheet}
            />
             <CinematicOverlay 
                text="Logic Engine" 
                subtext="Standardizing Calculations..." 
                isActive={phase === 2} 
                icon={Calculator}
            />

            {/* Ambient Background Mesh */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
                 style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center' }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-0" />

            {/* 1. App Navigation */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#050505]/80 backdrop-blur-md z-20 relative">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-indigo-500">
                        <div className="w-5 h-5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                           <LayoutGrid className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-bold text-gray-100 tracking-tight text-sm">ValuationOS</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Grid */}
            <div className="flex-1 p-6 grid grid-cols-12 grid-rows-6 gap-4 z-10 relative">
                
                {/* PRIMARY SIGNAL: Enterprise Value */}
                <Panel 
                    className="col-span-4 row-span-3 p-6 relative flex flex-col justify-between" 
                    isDimmed={phase === 2} 
                >
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Enterprise Value</h3>
                            <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-tight">+4.2%</span>
                        </div>
                        <div className="text-5xl font-bold text-white tracking-tighter mb-2">
                             {/* Only show value from Resolve phase onwards */}
                            {phase >= 3 ? (
                                <MetricValue end={285.4} prefix="$" suffix="M" delay={0.2} />
                            ) : (
                                <div className="h-12 w-32 bg-white/5 rounded animate-pulse" /> 
                            )}
                        </div>
                    </div>
                    
                    <div className="w-full">
                        <div className="flex justify-between text-[10px] font-mono text-gray-600 mb-1.5 uppercase">
                            <span>Bear</span>
                            <span>Bull</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: phase >= 3 ? "65%" : "0%" }} 
                                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                            />
                        </div>
                    </div>
                </Panel>

                {/* SECONDARY: Data Quality (Was Confidence) */}
                <Panel 
                    className="col-span-3 row-span-3 p-6 flex flex-col justify-between" 
                    isDimmed={phase === 3}
                >
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Logic Integrity</h3>
                    
                    <div className="relative flex items-center justify-center py-4">
                        <svg className="w-28 h-28 transform -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                            <motion.circle 
                                cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                className="text-emerald-500 drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: phase >= 1 ? 1 : 0 }} 
                                transition={{ duration: 2.5, ease: "circOut" }}
                                strokeDasharray="301.59"
                                strokeDashoffset="0"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {phase >= 2 ? (
                                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
                                    <span className="text-xl font-bold text-white tracking-tight">PASS</span>
                                </motion.div>
                            ) : (
                                <Activity className="w-5 h-5 text-gray-700 animate-pulse" />
                            )}
                        </div>
                    </div>
                </Panel>

                {/* LOGIC ENGINE (Was AI Insights) */}
                <Panel 
                    className="col-span-5 row-span-2 p-5 bg-gradient-to-br from-[#0A0A0B]/90 to-blue-900/5" 
                    isDimmed={phase !== 2 && phase !== 4} 
                >
                     <div className="flex items-center space-x-2 mb-3">
                        <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                        <h3 className="text-[11px] font-bold text-blue-200/70 uppercase tracking-widest">Logic Stream</h3>
                    </div>
                    <div className="space-y-3">
                         {phase >= 2 ? (
                             <>
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 border border-white/5"
                                >
                                    <div className="mt-1 w-1 h-1 rounded-full bg-blue-400 shrink-0 shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                                    <p className="text-[13px] text-gray-300 leading-snug font-medium">
                                        Standardizing <strong className="text-white font-semibold">DCF WACC</strong> across all sheets.
                                    </p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 border border-white/5"
                                >
                                    <div className="mt-1 w-1 h-1 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                                    <p className="text-[13px] text-gray-300 leading-snug font-medium">
                                        Auto-formatting <span className="text-white">Output Tables</span> for report.
                                    </p>
                                </motion.div>
                             </>
                         ) : (
                             <div className="flex flex-col space-y-2">
                                 <div className="h-2 w-3/4 bg-white/10 rounded animate-pulse" />
                                 <div className="h-2 w-1/2 bg-white/10 rounded animate-pulse delay-75" />
                             </div>
                         )}
                    </div>
                </Panel>


                {/* CHARTS ROW */}
                <Panel className="col-span-8 row-span-3 p-6" isDimmed={phase === 3}>
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Formatted Projections</h3>
                        <Database className="w-3 h-3 text-gray-600" />
                    </div>
                    
                    {/* Fake Chart Visualization */}
                    <div className="flex items-end space-x-3 h-32 px-2">
                        {[40, 45, 30, 60, 55, 75, 65, 80, 70, 90, 85, 95].map((h, i) => (
                            <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: phase >= 1 ? `${h}%` : 0 }} // Grow on Connect
                                transition={{ duration: 0.8, delay: 0.5 + (i * 0.05), ease: "backOut" }}
                                className={`flex-1 rounded-t-[2px] ${i > 8 ? 'bg-indigo-500 shadow-[0_-4px_12px_rgba(99,102,241,0.3)]' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                </Panel>

                {/* CONTROLS */}
                <Panel className="col-span-4 row-span-3 p-6" isDimmed={phase === 3}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Calibrated Weights</h3>
                    </div>
                    
                    <div className="space-y-7">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-medium text-gray-400">
                                <span>DCF Analysis</span>
                                <span className="text-white">50%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full relative">
                                <motion.div 
                                    className="absolute h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: phase >= 1 ? "50%" : 0 }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>
            
        </div>
    );
};
