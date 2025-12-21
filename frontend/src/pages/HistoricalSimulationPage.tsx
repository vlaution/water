import React, { useEffect, useState } from 'react';
import { SimulationService } from '../services/SimulationService';
import type { HistoricalSimulationReport } from '../services/SimulationService';
import { SimulationOverview } from '../components/simulation/SimulationOverview';
import { SimulationCharts } from '../components/simulation/SimulationCharts';
import { DecisionLog } from '../components/simulation/DecisionLog';
import { LeadTimeTable } from '../components/simulation/LeadTimeTable';
import { History, TrendingUp, Download } from 'lucide-react';

export const HistoricalSimulationPage: React.FC = () => {
    const [report, setReport] = useState<HistoricalSimulationReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await SimulationService.getReport();
            setReport(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load simulation data. Ensure the backend simulation has been run.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <div className="p-4 bg-red-100 rounded-full mb-4">
                    <History className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Simulation Data Not Found</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={loadData} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                            Market Replay Module
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <History className="w-8 h-8 text-gray-400" />    
                        Historical Simulation: 2008 Crisis
                    </h1>
                    <p className="text-gray-500 mt-2 max-w-2xl">
                        Replaying Decision Engine logic against historical datasets ({report.simulation_summary.period_analyzed}) to validate predictive capabilities and risk detection latency.
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export Audit
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                        <TrendingUp className="w-4 h-4" />
                        Run New Simulation
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <SimulationOverview summary={report.simulation_summary} />
            
            {/* Predictive Lead Time Analysis */}
            {report.lead_time_analysis && (
                <LeadTimeTable data={report.lead_time_analysis} />
            )}

            {/* Charts */}
            <SimulationCharts summary={report.simulation_summary} />

            {/* Interactive Decision Log */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Timeline - Left Column */}
                <div className="xl:col-span-1 space-y-6">
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                             <History className="w-5 h-5 text-purple-500" />
                             Key Findings Timeline
                        </h3>
                        <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-8 pl-6 py-2">
                            {report.key_findings.map((finding, i) => (
                                <div key={i} className="relative">
                                    <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-white dark:border-gray-800" />
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{finding.year}</span>
                                        <span className="text-xs font-mono text-gray-400">{finding.exporter}</span>
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize mb-1">
                                        {finding.signal.replace('_', ' ')}
                                    </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {finding.insight}
                                    </p>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>

                {/* Main Log - Right 2 Columns */}
                <div className="xl:col-span-2">
                    <DecisionLog decisions={report.detailed_decisions} />
                </div>
            </div>
        </div>
    );
};
