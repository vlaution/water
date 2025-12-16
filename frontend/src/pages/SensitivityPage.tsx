import React from 'react';
import { SensitivityProvider, useSensitivity } from '../context/SensitivityContext';

import { ParameterSlider } from '../components/Visualization/ParameterSlider';
import { ScenarioPainter } from '../components/Visualization/ScenarioPainter';
import { SensitivityMatrix } from '../components/Visualization/SensitivityMatrix';
import { TimeSensitivityPlayer } from '../components/Visualization/TimeSensitivityPlayer';
import { SensitivityCube } from '../components/Visualization/SensitivityCube';
import { VolumetricCube } from '../components/Visualization/VolumetricCube';
import { FinancialRadar } from '../components/Visualization/FinancialRadar';
import { PerformanceMonitor } from '../components/Visualization/PerformanceMonitor';
import { ExportOverlay } from '../components/Visualization/ExportOverlay';
import { Box, Grid } from 'lucide-react';

// Simple Test Component (Temporary)
const SensitivityDashboard = () => {
    const { inputs, updateInput, activePair, suggestedPairs, setActivePair } = useSensitivity();
    const [viewMode, setViewMode] = React.useState<'2d' | '3d'>('2d');

    return (
        <div className="flex flex-col h-screen w-full p-6 overflow-hidden">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900">
                Sensitivity 2.0 <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">PRO</span>
            </h1>

            <PerformanceMonitor />

            <div className="grid grid-cols-12 gap-6 h-full">
                {/* Controls Sidebar */}
                <div className="col-span-3 flex flex-col gap-6">
                    {/* Model Drivers */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Model Drivers</h2>
                        <div className="space-y-4">
                            <ParameterSlider
                                label="WACC"
                                value={inputs.wacc}
                                onChange={(v) => updateInput('wacc', v)}
                                min={0.04} max={0.15} step={0.001} format="percent"
                            />
                            <ParameterSlider
                                label="Terminal Growth"
                                value={inputs.terminalGrowth}
                                onChange={(v) => updateInput('terminalGrowth', v)}
                                min={0.01} max={0.06} step={0.001} format="percent"
                            />
                            <ParameterSlider
                                label="Rev Growth (CAGR)"
                                value={inputs.revenueGrowth}
                                onChange={(v) => updateInput('revenueGrowth', v)}
                                min={0.0} max={0.50} step={0.005} format="percent"
                            />
                            <ParameterSlider
                                label="EBITDA Margin"
                                value={inputs.ebitdaMargin}
                                onChange={(v) => updateInput('ebitdaMargin', v)}
                                min={0.05} max={0.50} step={0.005} format="percent"
                            />
                        </div>
                    </div>

                    {/* Scenario Painter */}
                    <div className="glass-panel p-6 flex-1">
                        <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Scenario Paint</h2>
                        <ScenarioPainter />
                    </div>

                    {/* Tornado Visual */}
                    <div className="h-64 mt-4 relative">
                        {/* Toggle between Tornado and Radar could be cool, but let's just stack or use Radar for now as requested by user focus on Radar */}
                        <FinancialRadar />
                    </div>
                </div>

                {/* Main Visualization Area */}
                <div className="col-span-9 flex flex-col gap-6 h-[calc(100vh-120px)]">
                    {/* Active Pair Info & View Toggle */}
                    <div className="glass-panel p-6 shrink-0 relative overflow-hidden group flex justify-between items-start">
                        <div className="relative z-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2 relative">
                                {activePair ? `${activePair.xVar.label} vs ${activePair.yVar.label}` : 'Select Analysis'}
                            </h2>
                            <p className="text-sm text-gray-600 relative max-w-lg">
                                {activePair?.insight}
                            </p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-gray-100/50 p-1 rounded-lg border border-gray-200 relative z-20">
                            <button
                                onClick={() => setViewMode('2d')}
                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === '2d' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Grid size={14} /> 2D Heatmap
                            </button>
                            <button
                                onClick={() => setViewMode('3d')}
                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === '3d' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Box size={14} /> 3D Volumetric
                            </button>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="grid grid-cols-3 gap-4 shrink-0">
                        {suggestedPairs.slice(0, 3).map((pair, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActivePair(pair)}
                                className={`p-4 rounded-xl border text-left transition-all ${activePair === pair ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-100' : 'bg-white/40 border-white/40 hover:bg-white/60 hover:shadow-sm'
                                    } backdrop-blur-md`}
                            >
                                <div className="text-xs text-blue-600 font-bold tracking-wide mb-1">
                                    {(pair.correlationStrength * 100).toFixed(0)}% Correlation
                                </div>
                                <div className="text-sm font-medium text-gray-800">
                                    {pair.xVar.label} & {pair.yVar.label}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* WebGL Matrix / 3D Cube */}
                    <div className="flex-1 min-h-0 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden relative shadow-2xl">

                        {viewMode === '2d' ? (
                            <>
                                {activePair && <SensitivityMatrix />}
                                <SensitivityCube />
                            </>
                        ) : (
                            <VolumetricCube />
                        )}

                        <TimeSensitivityPlayer />
                        <ExportOverlay />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SensitivityPage: React.FC = () => {
    return (
        <SensitivityProvider>
            <SensitivityDashboard />
        </SensitivityProvider>
    );
};
