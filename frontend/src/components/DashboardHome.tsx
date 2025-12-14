import React, { useState, useEffect } from 'react';
import { api } from '../config/api';
import { SkeletonCard } from './dashboard/SkeletonCard';
import { Settings, Check } from 'lucide-react';
import { ExecutiveView } from './dashboard/views/ExecutiveView';
import { OverviewView } from './dashboard/views/OverviewView';
import { FinanceView } from './dashboard/views/FinanceView';
import { StrategyView } from './dashboard/views/StrategyView';
import { InvestorView } from './dashboard/views/InvestorView';
import { BenchmarkDashboard } from './BenchmarkDashboard';
import { PortfolioDashboard } from './PortfolioDashboard';
import { RealOptionsModal } from './modals/RealOptionsModal';
import { AISummaryModal } from './modals/AISummaryModal';
import { MonteCarloModal } from './modals/MonteCarloModal';
import { VCMethodModal } from './modals/VCMethodModal';
import { MergerAnalysisModal } from './MergerAnalysisModal';
import { ScenarioManager } from './ScenarioManager';
import { Building2, Sparkles, Activity, PieChart, Rocket, LayoutDashboard, DollarSign, TrendingUp, ShieldCheck, Briefcase, Globe } from 'lucide-react';
// GlobalAssumptionsPanel removed, lifted to App


interface DashboardHomeProps {
    onSelectRun: (runId: string) => void;
    token: string | null;
    onOpenGlobalSettings: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onSelectRun, token, onOpenGlobalSettings }) => {
    const [latestRun, setLatestRun] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'overview' | 'portfolio' | 'executive' | 'finance' | 'strategy' | 'investor' | 'benchmarking'>('overview');
    const [viewData, setViewData] = useState<any>(null);
    const [viewLoading, setViewLoading] = useState(false);

    // Customization State
    const [dashboardConfig, setDashboardConfig] = useState<any>(null);
    const [isCustomizing, setIsCustomizing] = useState(false);

    // Modals
    const [isRealOptionsOpen, setIsRealOptionsOpen] = useState(false);
    const [isMergerModalOpen, setIsMergerModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isMonteCarloOpen, setIsMonteCarloOpen] = useState(false);
    const [isPWSAOpen, setIsPWSAOpen] = useState(false);
    const [isVCOpen, setIsVCOpen] = useState(false);
    // isGlobalSettingsOpen lifted to App

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                // 1. Fetch Config
                const configRes = await fetch(api.url('/api/dashboard/config'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (configRes.ok) {
                    const config = await configRes.json();
                    setDashboardConfig(config);
                }

                // 2. Fetch Latest Run
                const runsRes = await fetch(api.url('/runs?limit=1'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (runsRes.ok) {
                    const runs = await runsRes.json();
                    if (runs.length > 0) {
                        const detailRes = await fetch(api.url(`/runs/${runs[0].id}`), {
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
        fetchData();
    }, [token]);

    useEffect(() => {
        const fetchViewData = async () => {
            if (!token || (activeView !== 'executive' && activeView !== 'portfolio' && !latestRun) || activeView === 'benchmarking' || activeView === 'portfolio') return;
            setViewLoading(true);
            try {
                let url = '';
                if (activeView === 'executive') {
                    url = api.url('/api/dashboard/executive');
                } else if (activeView === 'overview') {
                    url = api.url(`/api/dashboard/overview/${latestRun.id}`);
                } else {
                    url = api.url(`/api/dashboard/${activeView}/${latestRun.id}`);
                }

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setViewData(data);
                } else {
                    setViewData(null);
                }
            } catch (error) {
                console.error(`Failed to fetch ${activeView} view data`, error);
                setViewData(null);
            } finally {
                setViewLoading(false);
            }
        };

        if (!loading) {
            fetchViewData();
        }
    }, [activeView, latestRun, token, loading]);

    const toggleViewVisibility = async (viewName: string) => {
        if (!dashboardConfig) return;

        const currentLayout = dashboardConfig.layout || { visible_components: [] };
        const visible = currentLayout.visible_components || [];

        let newVisible;
        if (visible.includes(viewName)) {
            newVisible = visible.filter((v: string) => v !== viewName);
        } else {
            newVisible = [...visible, viewName];
        }

        const newConfig = {
            ...dashboardConfig,
            layout: {
                ...currentLayout,
                visible_components: newVisible
            }
        };

        setDashboardConfig(newConfig);

        // Save to backend
        try {
            await fetch(api.url('/api/dashboard/config'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newConfig)
            });
        } catch (error) {
            console.error("Failed to save config", error);
        }
    };

    const isViewVisible = (viewName: string) => {
        if (!dashboardConfig?.layout?.visible_components) return true; // Default to all visible if no config
        return dashboardConfig.layout.visible_components.includes(viewName);
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SkeletonCard height="h-48" />
                    <SkeletonCard height="h-48" />
                    <SkeletonCard height="h-48" />
                </div>
                <SkeletonCard height="h-96" />
            </div>
        );
    }

    if (!latestRun && activeView !== 'executive' && activeView !== 'portfolio') {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Welcome to Valuation Dashboard</h2>
                <p className="text-gray-500 mt-2">Start a new valuation to see insights here.</p>
                <button
                    onClick={() => onSelectRun('new')}
                    className="mt-6 glass-button bg-system-blue text-white hover:bg-blue-600"
                >
                    + New Valuation
                </button>
            </div>
        );
    }

    const views = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'executive', label: 'Executive', icon: Activity },
        { id: 'finance', label: 'Finance', icon: DollarSign },
        { id: 'strategy', label: 'Strategy', icon: TrendingUp },
        { id: 'investor', label: 'Investor', icon: ShieldCheck },
        { id: 'benchmarking', label: 'Benchmarking', icon: Building2 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {latestRun ? latestRun.company_name : 'Dashboard'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {latestRun ? `Valuation as of ${new Date(latestRun.created_at).toLocaleDateString()}` : 'Welcome back'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        onClick={() => setIsCustomizing(!isCustomizing)}
                        className={`glass-button text-sm flex items-center gap-2 ${isCustomizing ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
                    >
                        {isCustomizing ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                        {isCustomizing ? 'Done' : 'Customize'}
                    </button>

                    <button onClick={onOpenGlobalSettings} className="glass-button text-sm flex items-center gap-2 text-gray-700 hover:text-gray-900 border-gray-300">
                        <Globe className="w-4 h-4" />
                        Global Assumptions
                    </button>

                    <div className="h-6 w-px bg-gray-300 mx-2"></div>

                    <button onClick={() => setIsAIModalOpen(true)} className="glass-button bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Summary
                    </button>
                    <button onClick={() => setIsMonteCarloOpen(true)} className="glass-button bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Risk Analysis
                    </button>
                    <button onClick={() => setIsPWSAOpen(true)} className="glass-button bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-sm flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        PWSA
                    </button>
                    <button onClick={() => setIsVCOpen(true)} className="glass-button bg-green-50 text-green-700 hover:bg-green-100 border-green-200 text-sm flex items-center gap-2">
                        <Rocket className="w-4 h-4" />
                        VC Method
                    </button>
                    <button onClick={() => setIsMergerModalOpen(true)} className="glass-button bg-white text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        M&A Impact
                    </button>
                    <button onClick={() => setIsRealOptionsOpen(true)} className="glass-button text-system-blue text-sm">
                        Real Options
                    </button>
                    <button onClick={() => window.open(api.url(`/api/export/report/${latestRun?.id}`), '_blank')} className="glass-button text-system-blue text-sm">
                        View Full Report
                    </button>
                </div>
            </div>

            <MergerAnalysisModal isOpen={isMergerModalOpen} onClose={() => setIsMergerModalOpen(false)} />
            <AISummaryModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} runId={latestRun?.id} />
            <MonteCarloModal isOpen={isMonteCarloOpen} onClose={() => setIsMonteCarloOpen(false)} baseData={latestRun?.results} />
            <VCMethodModal
                isOpen={isVCOpen}
                onClose={() => setIsVCOpen(false)}
                baseData={latestRun?.results}
                onSave={() => { }}
            />
            <ScenarioManager
                isOpen={isPWSAOpen}
                onClose={() => setIsPWSAOpen(false)}
                baseAssumptions={latestRun?.results?.input_summary}
            />
            <RealOptionsModal
                isOpen={isRealOptionsOpen}
                onClose={() => setIsRealOptionsOpen(false)}
                dcfValue={latestRun?.results?.enterprise_value}
                runId={latestRun?.id}
            />
            <RealOptionsModal
                isOpen={isRealOptionsOpen}
                onClose={() => setIsRealOptionsOpen(false)}
                dcfValue={latestRun?.results?.enterprise_value}
                runId={latestRun?.id}
            />

            {/* View Selector */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {views.map(view => {
                        const isVisible = isViewVisible(view.id);
                        if (!isVisible && !isCustomizing) return null;

                        return (
                            <div key={view.id} className="relative group">
                                <button
                                    onClick={() => !isCustomizing && setActiveView(view.id as any)}
                                    className={`${activeView === view.id
                                        ? 'border-system-blue text-system-blue'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } ${isCustomizing ? 'opacity-100 cursor-default' : ''} 
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                                >
                                    <view.icon className="w-4 h-4" />
                                    {view.label}
                                </button>
                                {isCustomizing && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleViewVisibility(view.id);
                                        }}
                                        className={`absolute -top-2 -right-2 p-1 rounded-full shadow-sm border ${isVisible ? 'bg-green-100 border-green-200 text-green-600' : 'bg-gray-100 border-gray-200 text-gray-400'
                                            }`}
                                    >
                                        <Check className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* View Content */}
            {viewLoading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SkeletonCard height="h-64" />
                        <SkeletonCard height="h-64" />
                    </div>
                    <SkeletonCard height="h-96" />
                </div>
            ) : (
                <>
                    {activeView === 'overview' && <OverviewView data={viewData} />}
                    {activeView === 'portfolio' && <PortfolioDashboard token={token} />}
                    {activeView === 'executive' && <ExecutiveView data={viewData} />}
                    {activeView === 'finance' && <FinanceView data={viewData} />}
                    {activeView === 'strategy' && <StrategyView data={viewData} />}
                    {activeView === 'investor' && <InvestorView data={viewData} />}
                    {activeView === 'benchmarking' && (
                        <BenchmarkDashboard
                            ticker={latestRun?.company_name}
                            token={token}
                        />
                    )}
                </>
            )}
        </div >
    );
};

