import React from 'react';
import { CorrelationHeatmap } from '../components/risk/CorrelationHeatmap';
import { StressTestManager } from '../components/risk/StressTestManager';
import { ConcentrationCharts } from '../components/risk/ConcentrationCharts';
import { RiskScorecard } from '../components/risk/RiskScorecard';
import { MarketPulse } from '../components/dashboard/widgets/MarketPulse';

export const RiskDashboard: React.FC = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Risk Management</h1>
                    <p className="text-gray-600 mt-1">Analyze portfolio risks, correlations, and stress scenarios.</p>
                </div>
                {/* Real-time Market Pulse */}
                <div className="w-64">
                    <MarketPulse />
                </div>
            </div>

            {/* Portfolio Health Scorecard - Top of Page */}
            <section>
                <RiskScorecard />
            </section>

            <div className="grid grid-cols-1 gap-8">
                {/* Correlation Analysis Section */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Portfolio Correlation</h2>
                        <p className="text-sm text-gray-500">
                            Analyze how portfolio companies move together based on financial metrics and qualitative factors.
                        </p>
                    </div>
                    <CorrelationHeatmap />
                </section>

                {/* Scenario Stress Testing Section */}
                <section>
                    <StressTestManager />
                </section>

                {/* Concentration Risk Section */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Concentration Risk</h2>
                        <p className="text-sm text-gray-500">
                            Analyze exposure by sector, stage, and power law compliance.
                        </p>
                    </div>
                    <ConcentrationCharts />
                </section>
            </div>
        </div>
    );
};
