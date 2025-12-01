import React, { useState } from 'react';
import { TrendingUp, Users, Activity, ArrowUpRight, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { LazyLoad } from '../../common/LazyLoad';
import { SkeletonCard } from '../SkeletonCard';

interface ExecutiveViewProps {
    data: any;
}

export const ExecutiveView: React.FC<ExecutiveViewProps> = ({ data }) => {
    const [showDetails, setShowDetails] = useState(false);

    if (!data) return <SkeletonCard height="h-96" />;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* TIER 1: Critical Metrics (Immediate Load) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Enterprise Value (New Tier 1 Item) */}
                <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-system-blue">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Latest Enterprise Value</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">
                            ${(data.enterprise_value / 1000000).toFixed(1)}M
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-system-blue">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>

                {/* Confidence Score */}
                <div className="glass-panel p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Avg Confidence Score</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{data.average_confidence.toFixed(1)}%</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                        <Activity className="w-6 h-6" />
                    </div>
                </div>

                {/* Active Companies */}
                <div className="glass-panel p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Active Companies</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{data.active_companies}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full text-system-green">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Strategic Alerts (Tier 1) */}
            {data.strategic_alerts && data.strategic_alerts.length > 0 && (
                <div className="glass-panel p-6 bg-amber-50 border-amber-100">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Strategic Alerts
                    </h3>
                    <div className="space-y-2">
                        {data.strategic_alerts.map((alert: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-amber-800 text-sm">
                                <span className="font-bold">•</span>
                                <p>{alert.message || alert}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TIER 2: Secondary Metrics (Lazy Load) */}
            <LazyLoad placeholder={<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /></div>}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Opportunities</h3>
                        <div className="space-y-4">
                            {data.top_opportunities.map((opp: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/60">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{opp.name}</h4>
                                        <p className="text-xs text-gray-500">{opp.industry}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-system-blue">${(opp.value / 1000000).toFixed(1)}M</p>
                                        <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                                            <ArrowUpRight className="w-3 h-3" /> High Potential
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {data.recent_activity.map((activity: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">{activity.company}</h4>
                                        <p className="text-xs text-gray-500">{activity.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </LazyLoad>

            {/* TIER 3: Deep Analysis (On Demand) */}
            <div className="text-center">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="glass-button text-system-blue flex items-center gap-2 mx-auto"
                >
                    {showDetails ? (
                        <>Hide Detailed Analysis <ChevronUp className="w-4 h-4" /></>
                    ) : (
                        <>Show Detailed Analysis <ChevronDown className="w-4 h-4" /></>
                    )}
                </button>
            </div>

            {showDetails && (
                <div className="animate-fade-in space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Composition</h3>
                        <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            Portfolio Chart Placeholder (Tier 3)
                        </div>
                    </div>
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Performance</h3>
                        <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            Performance Chart Placeholder (Tier 3)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

