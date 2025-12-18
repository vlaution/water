import React, { useState } from 'react';
import { api } from '../config/api';
import { InputReview } from './InputReview';
import { EnterpriseValueCard } from './dashboard/EnterpriseValueCard';
import { ConfidenceGauge } from './dashboard/ConfidenceGauge';
import { AlertPanel } from './dashboard/AlertPanel';
import { MethodBreakdown } from './dashboard/MethodBreakdown';
import { SensitivityMatrix } from './dashboard/SensitivityMatrix';
import { TrendChart } from './dashboard/TrendChart';
import { ActionCenter } from './dashboard/ActionCenter';
import { ScenarioToggle } from './dashboard/ScenarioToggle';
import { LBOWaterfallChart } from './lbo/LBOWaterfallChart';
import { SourcesUsesTable } from './lbo/SourcesUsesTable';
import { ReturnsAnalysisTable } from './lbo/ReturnsAnalysisTable';
import { LBOSensitivityMatrix } from './lbo/LBOSensitivityMatrix';
import { LBOTimelineControl } from './lbo/LBOTimelineControl';
import { CovenantTracker } from './lbo/CovenantTracker';
import { MIPTable } from './lbo/MIPTable';
import { AIInsightsWidget } from './dashboard/widgets/AIInsightsWidget';
import { FinancialsView } from './dashboard/FinancialsView';

import { ReportActionCenter } from './ReportActionCenter';

interface ResultsDashboardProps {
    runId?: string;
    results?: any;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ runId, results }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'inputs' | 'financials'>('dashboard');
    const [scenario, setScenario] = useState<'base' | 'bull' | 'bear'>('base');
    const [overrideExitYear, setOverrideExitYear] = useState<number | null>(null);
    const [showReportCenter, setShowReportCenter] = useState(false);
    const [reportFormat, setReportFormat] = useState<'pdf' | 'pptx' | 'docx' | 'excel'>('pdf');

    // Derived LBO Data for Interactivity
    const getInteractiveLBO = () => {
        if (!results?.lbo_details?.schedule) return results?.lbo_details;

        const schedule = results.lbo_details.schedule;
        const maxYear = schedule.length;
        const currentYear = overrideExitYear || maxYear;

        // Find data for this year
        const yearData = schedule.find((s: any) => s.year === currentYear);
        if (!yearData) return results.lbo_details;

        // Check for required data
        const returns = results.lbo_details.returns_analysis;
        const waterfall = results.lbo_details.waterfall_summary;
        if (!returns || !waterfall) return results.lbo_details;

        // Recalculate Returns (Client-Side approximation)
        // Need Entry Equity.
        const entryEquity = returns.entry_equity;

        // Exit Equity = (EBITDA * ExitMultiple) - NetDebt
        // We assume Exit Multiple is constant or same as input. 
        // Let's infer implied exit multiple from original results: ExitEV / FinalEBITDA
        const originalExitEV = returns.exit_equity + waterfall.final_debt;
        const finalEBITDA = schedule[schedule.length - 1].ebitda;
        const impliedMultiple = originalExitEV / finalEBITDA;

        const currentExitEV = yearData.ebitda * impliedMultiple;
        const currentNetDebt = yearData.total_debt_balance; // Simplified (cash?)
        const currentEquity = Math.max(0, currentExitEV - currentNetDebt);

        const moic = entryEquity > 0 ? currentEquity / entryEquity : 0;
        const irr = entryEquity > 0 ? Math.pow(currentEquity / entryEquity, 1 / currentYear) - 1 : 0;
        const profit = currentEquity - entryEquity;

        return {
            ...results.lbo_details,
            schedule: schedule.slice(0, currentYear),
            returns_analysis: {
                ...results.lbo_details.returns_analysis,
                moic,
                irr,
                exit_equity: currentEquity,
                profit,
                // Zero out detail for interim (or approx)
                gp_carry: 0,
                lp_profit: profit,
                lp_moic: moic,
                // Clear detailed breakdown for interactive mode as we don't recalc waterfall client-side
                dist_capital: undefined,
                dist_pref: undefined,
                gp_catchup: undefined,
                dist_carry: undefined
            }
        };
    };

    const lboData = getInteractiveLBO();

    // Helper to get data based on selected scenario
    const getDisplayData = () => {
        if (scenario === 'base') {
            return {
                enterprise_value: results?.enterprise_value || 0,
                dcf_details: results?.dcf_details
            };
        }

        // Find scenario data
        const scenarioData = results?.scenarios?.find((s: any) => s.name.toLowerCase().includes(scenario));
        return {
            enterprise_value: scenarioData?.enterprise_value || results?.enterprise_value || 0,
            dcf_details: scenarioData?.dcf_details || results?.dcf_details
        };
    };

    const displayData = getDisplayData();
    const enterpriseValue = displayData.enterprise_value;

    // Use backend data if available, otherwise fallback to mock for demo
    const confidenceScore = results?.confidence_score?.score ?? 85;

    const alerts = results?.strategic_alerts || [
        { id: '1', type: 'warning', message: 'Growth input outdated (using 2023 data)', severity: 'medium' },
        { id: '2', type: 'info', message: 'Market multiple updated to 12.5x', severity: 'low' },
        { id: '3', type: 'critical', message: 'Debt maturity < 12 months', severity: 'high' },
    ];

    // Add Optimization Note if present
    if (results?.lbo_details?.optimization_note) {
        alerts.unshift({
            id: 'opt_note',
            type: 'success', // Optimization is usually positive
            message: `Optimization: ${results.lbo_details.optimization_note}`,
            severity: 'medium'
        });
    }

    const methods = [
        { name: 'DCF (FCFF)', value: results?.methods?.['DCF_FCFF']?.value || 0, weight: results?.methods?.['DCF_FCFF']?.weight * 100 || 0, color: 'bg-system-blue' },
        { name: 'Comparable (GPC)', value: results?.methods?.['GPC']?.value || 0, weight: results?.methods?.['GPC']?.weight * 100 || 0, color: 'bg-system-green' },
        { name: 'Precedent (GTM)', value: results?.methods?.['Precedent_Transactions']?.value || 0, weight: results?.methods?.['Precedent_Transactions']?.weight * 100 || 0, color: 'bg-system-orange' },
        { name: 'LBO (Implied)', value: results?.methods?.['LBO']?.value || 0, weight: results?.methods?.['LBO']?.weight * 100 || 0, color: 'bg-system-red' },
    ].filter(m => m.value > 0);

    // Use backend sensitivity data
    const sensitivityData = results?.sensitivity || {};

    // Prepare trend data based on selected scenario
    const trendData = displayData.dcf_details ? displayData.dcf_details.revenue.map((_: any, i: number) => ({
        year: `Year ${i + 1}`,
        ebitda: displayData.dcf_details.ebitda[i],
        cashFlow: displayData.dcf_details.fcff[i]
    })) : [
        { year: '2024', ebitda: 5000000, cashFlow: 3000000 },
        { year: '2025', ebitda: 6000000, cashFlow: 4000000 },
        { year: '2026', ebitda: 7500000, cashFlow: 5500000 },
        { year: '2027', ebitda: 9000000, cashFlow: 7000000 },
        { year: '2028', ebitda: 11000000, cashFlow: 9000000 },
    ];

    const handleGenerateReport = async (type: string) => {
        if (!runId) {
            alert('No run ID available');
            return;
        }

        // Open Action Center for supported formats
        if (['pdf', 'pptx', 'docx'].includes(type)) {
            setReportFormat(type as any);
            setShowReportCenter(true);
        } else {
            // Legacy/Excel direct export
            // Or if type is excel, do we support it via AC? Let's say yes.
            window.open(api.url(`/export/${type}/${runId}`), '_blank');
        }
    };

    return (
        <div className="max-w-7xl mx-auto mt-6 animate-fade-in-up pb-12">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Valuation Dashboard</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Run ID: {runId ? runId.slice(0, 8) : 'Simulated'}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Scenario Toggle moved to Header */}
                        <ScenarioToggle currentScenario={scenario} onChange={setScenario} />

                        <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-md p-1.5 rounded-xl border border-white/20 dark:border-white/10">
                            {['dashboard', 'inputs', 'financials'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm scale-100'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-gray-700/30'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-8">
                    {/* LBO Analysis Section (Conditional) */}
                    {lboData && lboData.schedule && (
                        <div className="space-y-6 mb-8 animate-fade-in-up">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex gap-4 items-center">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">LBO Analysis</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-system-blue dark:text-blue-300 text-xs font-bold uppercase tracking-wide">Advanced Model</span>
                                </div>

                                <LBOTimelineControl
                                    min={1}
                                    max={lboData.schedule.length}
                                    value={overrideExitYear || lboData.schedule.length}
                                    onChange={setOverrideExitYear}
                                />
                            </div>

                            <LBOWaterfallChart schedule={lboData.schedule} />

                            {/* LBO Detail Tables */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">
                                <div className="lg:col-span-8">
                                    {lboData.sources && lboData.uses && (
                                        <SourcesUsesTable
                                            sources={lboData.sources}
                                            uses={lboData.uses}
                                        />
                                    )}
                                </div>
                                <div className="lg:col-span-4 h-full">
                                    {lboData.returns_analysis && (
                                        <div className="space-y-6">
                                            <ReturnsAnalysisTable data={lboData.returns_analysis} />

                                            {/* MIP Table */}
                                            {lboData.returns_analysis.mip_pool_percent > 0 && (
                                                <MIPTable
                                                    returnsAnalysis={lboData.returns_analysis}
                                                    mipConfig={{ option_pool_percent: lboData.returns_analysis.mip_pool_percent }}
                                                />
                                            )}

                                            {lboData.sensitivity_matrix && (
                                                <LBOSensitivityMatrix data={lboData.sensitivity_matrix} />
                                            )}
                                        </div>

                                    )}
                                </div>
                            </div>

                            {/* Covenant Tracker */}
                            {lboData.schedule && lboData.schedule[0].covenant_status && (
                                <div className="mt-8 animate-fade-in-up">
                                    <CovenantTracker
                                        schedule={lboData.schedule}
                                        covenants={results.input_summary?.lbo?.covenants || results?.lbo_input?.covenants || []}
                                    // Fallback to extraction if needed or empty list if only visualizing status
                                    // Actually CovenantTracker uses covenants prop to show limits lines.
                                    // If we don't have the original input easily, we might skip the lines or pass dummy.
                                    // Let's assume input_summary has it or simplified.
                                    />
                                </div>
                            )}

                        </div>
                    )}


                    {/* Row 1.5: AI Insights */}
                    <div className="grid grid-cols-12 gap-8 mb-8">
                        <div className="col-span-12">
                            {runId && <AIInsightsWidget runId={runId} />}
                        </div>
                    </div>
                    {/* Row 1: High-Level Metrics & Breakdown (4 columns) */}
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-3">
                            <EnterpriseValueCard value={enterpriseValue} medianValue={enterpriseValue * 0.95} />
                        </div>
                        <div className="col-span-3">
                            <ConfidenceGauge score={confidenceScore} />
                        </div>
                        <div className="col-span-3">
                            <AlertPanel alerts={alerts} />
                        </div>
                        <div className="col-span-3">
                            <MethodBreakdown methods={methods} />
                        </div>
                    </div>

                    {/* Row 2: Financial Trends (Full Width) */}
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 h-96">
                            <TrendChart data={trendData} />
                        </div>
                    </div>

                    {/* Row 3: Deep Dive & Actions */}
                    <div className="grid grid-cols-12 gap-8 h-96">
                        <div className="col-span-8">
                            <SensitivityMatrix data={sensitivityData} baseValue={enterpriseValue} />
                        </div>
                        <div className="col-span-4 space-y-6">
                            <ActionCenter
                                actions={results?.action_items || [
                                    { id: '1', task: 'Review growth assumptions', status: 'urgent' },
                                    { id: '2', task: 'Confirm tax rate', status: 'pending' }
                                ]}
                                onGenerateReport={handleGenerateReport}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Report Action Center Overlay */}
            {showReportCenter && runId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <ReportActionCenter
                        runId={runId}
                        companyName={results?.company_name || "Company"}
                        initialFormat={reportFormat}
                        onClose={() => setShowReportCenter(false)}
                    />
                </div>
            )}

            {activeTab === 'inputs' && (
                <div className="animate-fade-in-up">
                    <InputReview inputs={results?.input_summary} />
                </div>
            )}

            {activeTab === 'financials' && (
                <div className="animate-fade-in-up">
                    <FinancialsView data={results?.input_summary?.financials || results?.financials || []} />
                </div>
            )}
        </div>
    );
};
