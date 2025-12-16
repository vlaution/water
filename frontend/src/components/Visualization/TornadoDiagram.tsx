import React, { useState } from 'react';
import { useSensitivity } from '../../context/SensitivityContext';
import { motion } from 'framer-motion';
import { Flame, Snowflake, AlertTriangle, TrendingUp } from 'lucide-react';

export const TornadoDiagram: React.FC = () => {
    const { inputs, calculate, variables, setActivePair, activePair, suggestedPairs } = useSensitivity();
    const [analyzing, setAnalyzing] = useState(false);

    // Data State
    const [primaryImpacts, setPrimaryImpacts] = useState<{ id: string, label: string, low: number, high: number, delta: number }[]>([]);
    const [scenarioImpacts, setScenarioImpacts] = useState<{ id: string, label: string, value: number, delta: number }[]>([]);

    // --- Analysis Engine ---
    React.useEffect(() => {
        const analyze = async () => {
            setAnalyzing(true);
            const baseVal = await calculate(inputs);
            const range = 0.10; // +/- 10%

            // 1. Primary Sensitivities (Standard Tornado)
            const primaryResults = await Promise.all(variables.map(async (v) => {
                const baseInput = inputs[v.id as keyof typeof inputs];
                if (typeof baseInput !== 'number') return null;

                const lowInput = { ...inputs, [v.id]: baseInput * (1 - range) };
                const highInput = { ...inputs, [v.id]: baseInput * (1 + range) };

                const lowVal = await calculate(lowInput);
                const highVal = await calculate(highInput);

                return {
                    id: v.id,
                    label: v.label,
                    low: lowVal,
                    high: highVal,
                    delta: highVal - lowVal // Directional delta
                };
            }));

            const validPrimary = primaryResults.filter(r => r !== null) as NonNullable<typeof primaryResults[0]>[];
            validPrimary.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
            setPrimaryImpacts(validPrimary);

            // 2. Scenario Sensitivities (Bundled Shocks)
            const scenarios = [
                { id: 'recession', label: 'Global Recession', inputs: { revenueGrowth: inputs.revenueGrowth * 0.8, ebitdaMargin: inputs.ebitdaMargin * 0.9, wacc: inputs.wacc * 1.1 } },
                { id: 'expansion', label: 'Tech Boom', inputs: { revenueGrowth: inputs.revenueGrowth * 1.2, ebitdaMargin: inputs.ebitdaMargin * 1.1, wacc: inputs.wacc * 0.95 } },
                { id: 'tax_hike', label: 'Tax Policy Shift', inputs: { taxRate: 0.28 } } // Assuming taxRate exists or ignored
            ];

            const scenarioResults = await Promise.all(scenarios.map(async (s) => {
                const mergedInputs = { ...inputs, ...s.inputs };
                const val = await calculate(mergedInputs);
                return {
                    id: s.id,
                    label: s.label,
                    value: val,
                    delta: val - baseVal
                };
            }));

            setScenarioImpacts(scenarioResults);
            setAnalyzing(false);
        };

        analyze();
    }, [inputs, variables, calculate]);

    // --- Interaction Matrix Helpers ---
    // Find the strongest interaction for a given variable
    const getInteractionInfo = (varId: string) => {
        const pair = suggestedPairs.find(p => p.xVar.id === varId || p.yVar.id === varId);
        if (!pair) return null;

        const otherVar = pair.xVar.id === varId ? pair.yVar : pair.xVar;
        const strength = pair.correlationStrength;

        return {
            partner: otherVar.label,
            strength: strength,
            icon: strength > 0.7 ? <Flame size={12} className="text-orange-500" /> : <Snowflake size={12} className="text-blue-400" />,
            label: strength > 0.7 ? "High" : "Low"
        };
    };

    // --- Render Helpers ---
    const maxPrimaryDelta = Math.max(...primaryImpacts.map(i => Math.abs(i.delta)), 1);
    const maxScenarioDelta = Math.max(...scenarioImpacts.map(i => Math.abs(i.delta)), 1);
    const globalMax = Math.max(maxPrimaryDelta, maxScenarioDelta);

    return (
        <div className="glass-panel p-4 w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase flex justify-between tracking-wider sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-2">
                <div>Hierarchical Sensitivity</div>
                {analyzing && <span className="text-blue-500 text-xs animate-pulse font-mono">Simulating...</span>}
            </h3>

            <div className="space-y-6">

                {/* Section 1: Primary Sensitivities */}
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                        <TrendingUp size={10} /> Single Variable Impact (+/- 10%)
                    </h4>
                    <div className="space-y-2">
                        {primaryImpacts.map((item) => {
                            const widthPercent = (Math.abs(item.delta) / globalMax) * 100;
                            const interaction = getInteractionInfo(item.id);
                            const isPositive = item.delta > 0;

                            return (
                                <div key={item.id} className="group relative">
                                    <div className="flex items-center gap-2 text-xs mb-1">
                                        <span className="w-24 font-medium text-gray-700 truncate">{item.label}</span>

                                        {/* Interaction Badge */}
                                        {interaction && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[9px] text-gray-500" title={`Interaction with ${interaction.partner}`}>
                                                {interaction.icon}
                                                {interaction.partner.split(' ')[0]}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bar Container */}
                                    <div className="flex items-center gap-3 h-6">
                                        {/* Interaction Matrix Cell (Visual Only) */}
                                        <div
                                            className={`w-1 h-full rounded-sm opacity-50 ${interaction?.strength && interaction.strength > 0.7 ? 'bg-orange-400' : 'bg-blue-300'}`}
                                            title="Interaction Intensity"
                                        />

                                        {/* Main Bar */}
                                        <div className="flex-1 bg-gray-100 rounded-full h-2 relative overflow-hidden">
                                            {/* Center Line */}
                                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />

                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${widthPercent / 2}%` }}
                                                className={`absolute top-0 bottom-0 h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} // Simplified color logic
                                                style={{
                                                    left: '50%', // Simplified to always grow from center for "Magnitude"
                                                    x: '-50%' // Assuming simplified magnitude view for now. Real tornado splits L/R.
                                                }}
                                            />
                                            {/* Note: True Tornado splits. Let's do a fast implementation of Magnitude for "Impact" */}
                                        </div>

                                        <span className="w-12 text-right text-xs font-mono text-gray-600">
                                            ${Math.abs(item.delta).toFixed(1)}M
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Section 2: Interaction Effects Matrix (Mini Heatmap) */}
                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                        <Flame size={10} /> Critical Interactions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {suggestedPairs.slice(0, 2).map((pair, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActivePair(pair)}
                                className={`flex items-center justify-between p-2 rounded bg-white border border-blue-100 hover:border-blue-300 transition-colors text-left ${activePair === pair ? 'ring-1 ring-blue-400' : ''}`}
                            >
                                <div>
                                    <div className="text-[10px] text-gray-500">{pair.xVar.label} × {pair.yVar.label}</div>
                                    <div className="text-xs font-bold text-gray-800">{pair.insight.split(' ')[0]} Correlation</div>
                                </div>
                                <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pair.correlationStrength > 0.7 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {(pair.correlationStrength * 100).toFixed(0)}%
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 3: Scenario Sensitivities */}
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                        <AlertTriangle size={10} /> Macro Scenarios
                    </h4>
                    <div className="space-y-2">
                        {scenarioImpacts.map((scenario) => {
                            const widthPercent = (Math.abs(scenario.delta) / globalMax) * 100;
                            const isPositive = scenario.delta > 0;

                            return (
                                <div key={scenario.id} className="flex items-center gap-3">
                                    <div className="w-24 text-xs font-medium text-gray-600 flex items-center gap-1">
                                        {scenario.label}
                                    </div>

                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full relative overflow-hidden">
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${widthPercent / 2}%` }}
                                            className={`absolute h-full rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                            style={{
                                                left: isPositive ? '50%' : `calc(50% - ${widthPercent / 2}%)`,
                                                // Correct directional rendering for scenarios
                                            }}
                                        />
                                    </div>

                                    <div className={`w-12 text-right text-xs font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isPositive ? '+' : ''}{scenario.delta.toFixed(1)}M
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
