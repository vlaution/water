import React, { useState, useEffect } from 'react';
import { EnterpriseValueCard } from './dashboard/EnterpriseValueCard';
import { ConfidenceGauge } from './dashboard/ConfidenceGauge';
import { AlertPanel } from './dashboard/AlertPanel';
import { MethodBreakdown } from './dashboard/MethodBreakdown';
import { ScenarioToggle } from './dashboard/ScenarioToggle';
import { SensitivityMatrix } from './dashboard/SensitivityMatrix';
import { TrendChart } from './dashboard/TrendChart';
import { TerminalValueImpact } from './dashboard/TerminalValueImpact';
import { ActionCenter } from './dashboard/ActionCenter';

interface DashboardHomeProps {
    onSelectRun: (runId: string) => void;
    token: string | null;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onSelectRun, token }) => {
    const [latestRun, setLatestRun] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scenario, setScenario] = useState<'base' | 'bull' | 'bear'>('base');

    useEffect(() => {
        const fetchLatestRun = async () => {
            if (!token) return;

            try {
                // 1. Get recent runs to find the latest ID
                const runsRes = await fetch('http://localhost:8000/runs?limit=1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (runsRes.ok) {
                    const runs = await runsRes.json();
                    if (runs.length > 0) {
                        // 2. Get full details for the latest run
                        const detailRes = await fetch(`http://localhost:8000/runs/${runs[0].id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        if (detailRes.ok) {
                            const data = await detailRes.json();
                            setLatestRun(data);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestRun();
    }, [token]);

    // Helper to get data based on selected scenario
    const getDisplayData = () => {
        if (!latestRun) return null;
        const results = latestRun.results;

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-system-blue"></div>
            </div>
        );
    }

    if (!latestRun) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Welcome to Valuation Dashboard</h2>
                <p className="text-gray-500 mt-2">Start a new valuation to see insights here.</p>
                <button
                    onClick={() => onSelectRun('new')} // Assuming 'new' triggers creation flow
                    className="mt-6 glass-button bg-system-blue text-white hover:bg-blue-600"
                >
                    + New Valuation
                </button>
            </div>
        );
    }

    const results = latestRun.results;
    const displayData = getDisplayData();
    const enterpriseValue = displayData?.enterprise_value || 0;
    const confidenceScore = results?.confidence_score?.score ?? 85;

    // Prepare chart data
    const trendData = displayData?.dcf_details ? displayData.dcf_details.revenue.map((_: any, i: number) => ({
        year: `Year ${i + 1}`,
        ebitda: displayData.dcf_details.ebitda[i],
        cashFlow: displayData.dcf_details.fcff[i]
    })) : [];

    const methods = [
        { name: 'DCF', value: enterpriseValue, weight: 40, color: 'bg-system-blue' },
        { name: 'GPC', value: enterpriseValue * 1.1, weight: 30, color: 'bg-system-green' },
        { name: 'Precedent', value: enterpriseValue * 0.9, weight: 20, color: 'bg-system-orange' },
        { name: 'LBO', value: enterpriseValue * 0.7, weight: 10, color: 'bg-system-red' },
    ];

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{latestRun.company_name} Valuation</h1>
                    <p className="text-sm text-gray-500">Latest run: {new Date(latestRun.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => onSelectRun(latestRun.id)} className="glass-button text-system-blue text-sm">
                        View Full Report
                    </button>
                </div>
            </div>

            {/* Row 1: C1, C2, C3 */}
            <div className="grid grid-cols-12 gap-6 h-[280px]">
                <div className="col-span-3 h-full">
                    <EnterpriseValueCard value={enterpriseValue} medianValue={enterpriseValue * 0.95} />
                </div>
                <div className="col-span-3 h-full">
                    <ConfidenceGauge score={confidenceScore} />
                </div>
                <div className="col-span-6 h-full">
                    <AlertPanel alerts={results?.strategic_alerts || []} />
                </div>
            </div>

            {/* Row 2: C4, C5, C6 */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4 h-[320px]">
                    <MethodBreakdown methods={methods} />
                </div>
                <div className="col-span-8 flex flex-col gap-6">
                    <div className="flex justify-end">
                        <ScenarioToggle currentScenario={scenario} onChange={setScenario} />
                    </div>
                    <div className="flex-1">
                        <SensitivityMatrix data={results?.sensitivity || {}} baseValue={enterpriseValue} />
                    </div>
                </div>
            </div>

            {/* Row 3: C7, C8 */}
            <div className="grid grid-cols-12 gap-6 h-[350px]">
                <div className="col-span-8 h-full">
                    <TrendChart data={trendData} />
                </div>
                <div className="col-span-4 h-full">
                    <TerminalValueImpact enterpriseValue={enterpriseValue} />
                </div>
            </div>

            {/* Row 4: C9 */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                    <ActionCenter
                        actions={results?.action_items || []}
                        onGenerateReport={(type) => window.open(`http://localhost:8000/export/${type}/${latestRun.id}`, '_blank')}
                    />
                </div>
            </div>

            {/* Row 5: C10 (Recent Activity) */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-3">Company</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Value</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{latestRun.company_name}</td>
                                <td className="px-4 py-3 text-gray-500">{new Date(latestRun.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">${(enterpriseValue / 1000000).toFixed(1)}M</td>
                                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span></td>
                                <td className="px-4 py-3">
                                    <button onClick={() => onSelectRun(latestRun.id)} className="text-system-blue hover:underline text-sm">Open</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
