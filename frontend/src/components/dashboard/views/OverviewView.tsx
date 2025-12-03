import React from 'react';
import { DollarSign, ShieldCheck, PieChart } from 'lucide-react';
import { MetricCard } from '../MetricCard';
import { ValuationBreakdownChart } from '../ValuationBreakdownChart';
import { ScenarioComparisonWidget } from '../ScenarioComparisonWidget';
import { ForecastSnapshot } from '../ForecastSnapshot';
import { RisksList } from '../RisksList';
import { InputsSummaryAccordion } from '../InputsSummaryAccordion';
import { SkeletonCard } from '../SkeletonCard';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface OverviewViewProps {
    data: any;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ data }) => {
    if (!data) return <SkeletonCard height="h-96" />;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: "compact",
        }).format(val);
    };

    const tvData = [
        { name: 'Terminal Value', value: data.terminal_value_split.terminal_value },
        { name: 'Explicit Period', value: data.terminal_value_split.explicit_period },
    ];
    const COLORS = ['#3B82F6', '#10B981'];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Row 1: Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Enterprise Value"
                    value={formatCurrency(data.valuation_summary.enterprise_value)}
                    icon={DollarSign}
                    color="blue"
                />
                <MetricCard
                    title="Equity Value"
                    value={formatCurrency(data.valuation_summary.equity_value)}
                    icon={PieChart}
                    color="purple"
                />
                <MetricCard
                    title="Confidence Score"
                    value={`${data.credibility_score.score}/100`}
                    subValue={data.credibility_score.rating}
                    icon={ShieldCheck}
                    color={data.credibility_score.score > 80 ? 'green' : 'amber'}
                />
            </div>

            {/* Row 2: Valuation Breakdown & Scenarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ValuationBreakdownChart data={data.method_breakdown} />
                <ScenarioComparisonWidget scenarios={data.scenarios} />
            </div>

            {/* Row 3: Forecast & Terminal Value */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ForecastSnapshot data={data.forecast} />
                </div>
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Terminal Value Split</h3>
                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                                <Pie
                                    data={tvData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {tvData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                            </RechartsPie>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-xs font-bold text-gray-400">TV Split</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Terminal ({(data.terminal_value_split.terminal_value / (data.terminal_value_split.terminal_value + data.terminal_value_split.explicit_period) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Explicit ({(data.terminal_value_split.explicit_period / (data.terminal_value_split.terminal_value + data.terminal_value_split.explicit_period) * 100).toFixed(0)}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 4: Risks */}
            <RisksList risks={data.risks} />

            {/* Row 5: Inputs Summary */}
            <InputsSummaryAccordion data={data.input_summary} />
        </div>
    );
};
