import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';
import { ValuationHeatmap } from './dashboard/widgets/ValuationHeatmap';
import { AcquisitionPotentialScore } from './dashboard/widgets/AcquisitionPotentialScore';
import { ValuationTimeline } from './dashboard/widgets/ValuationTimeline';
import { RiskMatrix } from './dashboard/widgets/RiskMatrix';
import { MarketPulse } from './dashboard/widgets/MarketPulse';

interface PortfolioDashboardProps {
    token: string | null;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ token }) => {
    const [summary, setSummary] = useState<any>(null);
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [potential, setPotential] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [risks, setRisks] = useState<any[]>([]);

    // Filters State
    const [filters, setFilters] = useState({
        sector: "All" as string,
        region: "All" as string
    });
    const [comparisonDays, setComparisonDays] = useState<number | null>(null);

    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingWidgets, setLoadingWidgets] = useState(false);
    // Other loading states if needed, or derived from data being null

    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const query = comparisonDays ? `?comparison_days=${comparisonDays}` : "";
            const res = await apiFetch(`/api/dashboard/portfolio/summary${query}`, {}, token);
            if (res.ok) setSummary(await res.json());
        } catch (e) { console.error(e); } finally { setLoadingSummary(false); }
    };

    const fetchWidgets = async () => {
        setLoadingWidgets(true);
        const query = new URLSearchParams();
        if (filters.sector !== "All") query.append("sector", filters.sector);
        if (filters.region !== "All") query.append("region", filters.region);

        try {
            apiFetch(`/api/dashboard/portfolio/heatmap?limit=100&${query.toString()}`, {}, token).then(r => { if (r.ok) r.json().then(setHeatmap); });
            apiFetch('/api/dashboard/portfolio/acquisition-potential', {}, token).then(r => { if (r.ok) r.json().then(setPotential); });
            apiFetch('/api/dashboard/portfolio/timeline', {}, token).then(r => { if (r.ok) r.json().then(setTimeline); });
            apiFetch('/api/dashboard/portfolio/risk-matrix', {}, token).then(r => { if (r.ok) r.json().then(setRisks); });
        } finally {
            setLoadingWidgets(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, comparisonDays]);

    useEffect(() => {
        if (!token) return;
        fetchWidgets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveView = () => {
        localStorage.setItem("dashboard_filters", JSON.stringify(filters));
        alert("View Saved!");
    };

    const handleDrillDown = (runId: string) => {
        // Navigate or open modal (Mock for now)
        console.log("Navigating to run: " + runId);
    };

    if (loadingSummary) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-system-blue"></div>
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
                <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>

                {/* Filters & Actions */}
                <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                    <select
                        className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        value={filters.sector}
                        onChange={(e) => handleFilterChange("sector", e.target.value)}
                    >
                        <option value="All">All Sectors</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Energy">Energy</option>
                    </select>

                    <select
                        className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        value={filters.region}
                        onChange={(e) => handleFilterChange("region", e.target.value)}
                    >
                        <option value="All">All Regions</option>
                        <option value="North America">North America</option>
                        <option value="Europe">Europe</option>
                        <option value="Asia">Asia</option>
                    </select>

                    <select
                        className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        value={comparisonDays || ""}
                        onChange={(e) => setComparisonDays(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">No Comparison</option>
                        <option value="30">Vs Last 30 Days</option>
                        <option value="90">Vs Last 90 Days</option>
                        <option value="365">Vs Last Year</option>
                    </select>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleSaveView}
                            className="flex-1 md:flex-none bg-white text-gray-600 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                        >
                            <span>Save View</span>
                        </button>

                        <button className="flex-1 md:flex-none bg-white text-gray-600 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50">
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Row: Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Total Portfolio EV</h3>
                    <div className="flex items-baseline mt-2 flex-wrap">
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 break-all sm:break-normal">
                            ${(summary.total_ev / 1000000).toFixed(1)}M
                        </p>
                        {summary.total_ev_change != null && (
                            <span className={`text-sm font-bold ml-2 ${summary.total_ev_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {summary.total_ev_change >= 0 ? '↑' : '↓'} {Math.abs(summary.total_ev_change).toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Avg. EV/EBITDA</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900 mt-2">{summary.avg_multiple.toFixed(1)}x</p>
                        <span className="text-sm text-gray-500">(Raw)</span>
                    </div>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                        Weighted: {summary.weighted_avg_multiple?.toFixed(1) || '-'}x
                    </p>
                </div>
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Data Quality</h3>
                    <div className="flex items-center mt-2">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path
                                    className="text-gray-200"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                                <path
                                    className={`${(summary.data_quality_score || 0) > 80 ? 'text-green-500' : (summary.data_quality_score || 0) > 50 ? 'text-yellow-500' : 'text-red-500'}`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray={`${summary.data_quality_score || 0}, 100`}
                                />
                                <text x="18" y="20.35" className="text-xs font-bold" textAnchor="middle" fill="currentColor">{Math.round(summary.data_quality_score || 0)}%</text>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Completeness Score</p>
                            <p className="text-xs text-gray-500">Based on input density</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Active Companies</h3>
                    <div className="flex items-baseline mt-2">
                        <p className="text-3xl font-bold text-gray-900">{summary.active_companies}</p>
                        {summary.active_companies_change != null && Math.abs(summary.active_companies_change) > 0 && (
                            <span className={`text-sm font-bold ml-2 ${summary.active_companies_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {summary.active_companies_change > 0 ? '+' : ''}{summary.active_companies_change}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Row: Heatmap & Acquisition Potential */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Valuation Heatmap</h3>
                        <span className="text-xs text-gray-400">
                            {filters.sector !== 'All' ? filters.sector : ''} {filters.region !== 'All' ? `• ${filters.region}` : ''}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Size = EV, Color = Confidence Score</p>

                    {loadingWidgets && heatmap.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">Updating...</div>
                    ) : heatmap.length > 0 ? (
                        <ValuationHeatmap data={heatmap} onBubbleClick={handleDrillDown} />
                    ) : (
                        <div className="text-center py-20 text-gray-400">No data found</div>
                    )}
                </div>
                <div className="glass-panel p-6 min-h-[400px]">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Acquisition Potential</h3>
                    {potential.length > 0 ? <AcquisitionPotentialScore data={potential} /> : <div className="text-center py-20 text-gray-400">Loading Potential...</div>}
                </div>
            </div>

            {/* Bottom Row: Timeline & Risk Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 min-h-[300px]">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Timeline</h3>
                    {timeline.length > 0 ? <ValuationTimeline data={timeline} /> : <div className="text-center py-20 text-gray-400">Loading Timeline...</div>}
                </div>
                <div className="glass-panel p-6 min-h-[300px] flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Risk Matrix</h3>
                    {/* Market Pulse Widget (Real-time) */}
                    <MarketPulse />
                    {loadingWidgets && risks.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">Loading Risks...</div>
                    ) : risks.length > 0 ? (
                        <RiskMatrix data={risks} />
                    ) : (
                        <div className="text-center py-20 text-gray-400">No high-risk items detected</div>
                    )}
                </div>
            </div>
        </div>
    );
};
