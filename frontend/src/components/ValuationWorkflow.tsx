import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Keyboard, Check, Sparkles, TrendingUp, ShieldCheck, SlidersHorizontal, Moon, Sun, Edit2 } from 'lucide-react';

// --- Shared Styles ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-700 ${className}`}>
        {children}
    </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors duration-700">{children}</span>
);

// --- Stages ---

// Phase 1: Input
const InputStage = () => (
    <div className="flex items-center justify-center space-x-8 h-full">
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Upload Excel</span>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"
        />

        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Keyboard className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manual Input</span>
        </motion.div>
    </div>
);

// Phase 2 & 3: Verify (Light -> Dark Transition)
const VerifyStage = ({ }: { phase?: number }) => {
    // Value correction animation state
    const [value, setValue] = useState("$32.5M");
    const [isEdited, setIsEdited] = useState(false);

    useEffect(() => {
        // Trigger edit shortly after mount (start of Phase 2)
        const timer = setTimeout(() => {
            setValue("$34.2M");
            setIsEdited(true);
        }, 800); 
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-3">
                <Label>Analyst Verification</Label>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold transition-colors duration-700"
                >
                    PARSED
                </motion.div>
            </div>
            <Card className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 transition-colors duration-700">
                     <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors duration-700">Metric</span>
                     </div>
                     <div className="flex items-center space-x-8">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors duration-700">Value</span>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors duration-700">Status</span>
                     </div>
                </div>
                <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: "easeOut" }}
                    className="flex items-center justify-between p-4"
                >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-700">EBITDA (LTM)</span>
                    <div className="flex items-center space-x-8">
                        <div className="relative w-16 text-right">
                           {/* Value Ticker Effect */}
                           <AnimatePresence mode="popLayout">
                                <motion.span 
                                    key={value}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`block text-sm font-mono transition-colors duration-700 ${isEdited ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    {value}
                                </motion.span>
                           </AnimatePresence>
                        </div>
                        <div className="flex items-center justify-center w-6">
                             {isEdited ? (
                                <motion.div 
                                    layoutId="status-icon"
                                    className="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full transition-colors duration-700"
                                >
                                    <Check className="w-3 h-3" />
                                </motion.div>
                             ) : (
                                <motion.div 
                                    layoutId="status-icon"
                                    className="p-1 text-gray-400"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </motion.div>
                             )}
                        </div>
                    </div>
                </motion.div>
            </Card>
        </div>
    );
};

// Phase 4: Methods
const MethodsStage = () => {
    const MethodRow = ({ label, weight, color, delay }: { label: string, weight: string, color: string, delay: number }) => (
        <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            className="flex items-center space-x-4 py-2"
        >
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 truncate">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: weight }} 
                    transition={{ delay: delay + 0.2, duration: 0.6, ease: "easeOut" }}
                    className={`h-full ${color}`}
                />
            </div>
            <span className="text-xs text-gray-400 font-mono w-8 text-right">{weight}</span>
        </motion.div>
    );

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-3">
                 <Label>Method Weighting</Label>
                 <SlidersHorizontal className="w-3 h-3 text-gray-400" />
            </div>
            <Card className="p-5 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                <MethodRow label="DCF Analysis" weight="50%" color="bg-blue-500" delay={0.1} />
                <MethodRow label="Public Comps" weight="30%" color="bg-indigo-500" delay={0.2} />
                <MethodRow label="Precedent Tx" weight="20%" color="bg-purple-500" delay={0.3} />
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    className="mt-4 text-[10px] text-center text-gray-400 dark:text-gray-500 font-medium"
                >
                    + 2 other methods excluded
                </motion.div>
            </Card>
        </div>
    );
};

// Phase 5 & 6: Output
const OutputStage = () => (
    <div className="flex items-center justify-center space-x-6 w-full max-w-4xl mx-auto">
        {/* Primary Value */}
        <Card className="p-8 min-w-[280px] border-l-4 border-l-blue-600 dark:border-l-blue-500">
            <Label>Enterprise Value</Label>
            <motion.div 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-5xl font-bold text-gray-900 dark:text-white mt-3 tracking-tight"
            >
                $285.4M
            </motion.div>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1"
            >
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Range: $270M - $310M</span>
            </motion.div>
        </Card>

        {/* Secondary Stats */}
        <div className="flex flex-col space-y-4">
            <Card className="p-4 flex items-center space-x-4 w-[220px]">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Confidence</div>
                    <div className="text-base font-bold text-gray-900 dark:text-white">High (98%)</div>
                </div>
            </Card>
            
            <Card className="p-4 w-[220px] bg-slate-900 border-slate-800 text-white">
                 <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">AI Insight</span>
                 </div>
                 <div className="text-xs text-slate-300 leading-snug">
                    Rate sensitivity is low. Market conditions favorable.
                 </div>
            </Card>
        </div>
    </div>
);


export const ValuationWorkflow = () => {
    // Phases: 0=Ambient, 1=Input, 2=Verify, 3=Switch, 4=Methods, 5=Calc, 6=Output
    const [phase, setPhase] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // Strict Duration Map (ms)
    // 0: 500, 1: 1200, 2: 1500, 3: 800, 4: 1500, 5: 800, 6: 2800 -> Total ~9.1s
    const DURATIONS = [500, 1200, 1500, 800, 1500, 800, 2800];

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const runLoop = () => {
            timer = setTimeout(() => {
                setPhase(prev => {
                    const next = (prev + 1) % 7;
                    return next;
                });
            }, DURATIONS[phase]);
        };
        runLoop();
        return () => clearTimeout(timer);
    }, [phase]);

    // Dark Mode Logic dependent on Phase
    useEffect(() => {
        if (phase === 0) setIsDarkMode(false);
        if (phase === 3) setIsDarkMode(true);
    }, [phase]);

    // Render Stage Logic
    const renderStage = () => {
        switch (phase) {
            case 0: return null; // Ambient
            case 1: return <InputStage key="input" />;
            case 2: // Verify Light
            case 3: // Verify Dark (Transitioning)
                    return <VerifyStage key="verify" phase={phase} />;
            case 4: return <MethodsStage key="methods" />; // Methods
            case 5: // Calc (Quick transition)
            case 6: // Output
                    return <OutputStage key="output" />;
            default: return null;
        }
    };

    return (
        // Container must be h-screen for the requirements
        <div className={`
            ${isDarkMode ? 'dark' : ''} 
            w-full h-screen flex items-center justify-center 
            transition-colors duration-700 
            bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-950 dark:to-slate-900
            overflow-hidden relative
        `}>
            {/* Theme Toggle Indicator (Positioned absolute top-right) */}
            <div className="absolute top-8 right-8 z-50">
                 <div className={`
                    relative w-14 h-8 rounded-full transition-colors duration-500 flex items-center px-1
                    ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}
                 `}>
                    <motion.div 
                        className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center z-10"
                        animate={{ 
                            x: isDarkMode ? 24 : 0,
                            scale: phase === 3 ? [1, 0.8, 1] : 1 // Click effect at start of Phase 3
                        }}
                        transition={{ 
                            type: "spring", stiffness: 400, damping: 25,
                            scale: { duration: 0.2 } 
                        }}
                    >
                        {isDarkMode ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-yellow-500" />}
                    </motion.div>
                 </div>
            </div>

            {/* Main Stage Area */}
            <div className="w-full px-4 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase >= 5 ? 'output-group' : phase >= 2 ? 'verify-group' : phase} // key grouping mostly for specific switches
                        // We need specific exit/enter interactions based on the storyboard
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full flex justify-center"
                    >
                         {/* 
                            Custom rendering logic:
                            If switching 2->3 (Verify Light -> Verify Dark), we DON'T want unmount animation. 
                            We want the SAME component to stay and just CSS switch.
                            So we group them with the same key.
                          */}
                         { phase === 2 || phase === 3 ? (
                            <VerifyStage phase={phase} />
                         ) : (
                            renderStage()
                         )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
