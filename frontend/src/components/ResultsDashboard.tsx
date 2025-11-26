import React, { useState } from 'react';
import { InputReview } from './InputReview';
import { EnterpriseValueCard } from './dashboard/EnterpriseValueCard';
import { ConfidenceGauge } from './dashboard/ConfidenceGauge';
import { AlertPanel } from './dashboard/AlertPanel';
import { MethodBreakdown } from './dashboard/MethodBreakdown';
import { SensitivityMatrix } from './dashboard/SensitivityMatrix';
import { TrendChart } from './dashboard/TrendChart';
import { ActionCenter } from './dashboard/ActionCenter';
import { ScenarioToggle } from './dashboard/ScenarioToggle';

interface ResultsDashboardProps {
    runId?: string;
    results?: any;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ runId, results }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'inputs' | 'financials'>('dashboard');
    const [scenario, setScenario] = useState<'base' | 'bull' | 'bear'>('base');

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

    const methods = [
        { name: 'DCF (FCFF)', value: enterpriseValue, weight: 40, color: 'bg-system-blue' },
        { name: 'Comparable (GPC)', value: enterpriseValue * 1.1, weight: 30, color: 'bg-system-green' },
        { name: 'Precedent (GTM)', value: enterpriseValue * 0.9, weight: 20, color: 'bg-system-orange' },
        { name: 'LBO Floor', value: enterpriseValue * 0.7, weight: 10, color: 'bg-system-red' },
    ];

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

    const handleGenerateReport = (type: string) => {
        if (!runId) {
            alert('No run ID available');
            return;
        }
        window.open(`http://localhost:8000/export/${type}/${runId}`, '_blank');
    };

    return (
        <div className="max-w-7xl mx-auto mt-6 animate-fade-in-up pb-12">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Valuation Dashboard</h2>
                        <p className="text-gray-500 mt-1 font-medium">Run ID: {runId ? runId.slice(0, 8) : 'Simulated'}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Scenario Toggle moved to Header */}
                        <ScenarioToggle currentScenario={scenario} onChange={setScenario} />

                        <div className="flex space-x-1 bg-gray-100/50 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
                            {['dashboard', 'inputs', 'financials'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm scale-100'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-white/30'
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
                        <div className="col-span-4">
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

            {activeTab === 'inputs' && (
                <div className="animate-fade-in-up">
                    <InputReview inputs={results?.input_summary} />
                </div>
            )}

            {activeTab === 'financials' && (
                <div className="glass-panel p-8 animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Financials</h3>
                    <p className="text-gray-500">Financial statement views would go here (reusing previous table logic).</p>
                </div>
            )}
        </div>
    );
};
