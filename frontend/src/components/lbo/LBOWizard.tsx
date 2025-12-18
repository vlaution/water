import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Calculator, Activity, Check, BookOpen, Layers, RefreshCw } from 'lucide-react';
const MonteCarloModal = React.lazy(() => import('../modals/MonteCarloModal').then(module => ({ default: module.MonteCarloModal })));
import { TutorialOverlay } from '../common/TutorialOverlay';
import { MarketDataService } from '../../services/MarketDataService';
import type { MarketSnapshot, MarketRates, MarketScenarios } from '../../services/MarketDataService';
import { SensitivityAnalysis } from '../analytics/SensitivityAnalysis';
import { LBOStep1_Structure } from './steps/LBOStep1_Structure';
import { LBOStep2_Financing } from './steps/LBOStep2_Financing';
import { LBOStep3_TaxCovenants } from './steps/LBOStep3_TaxCovenants';
import { LBOStep4_MIP } from './steps/LBOStep4_MIP';
import { LBOStep5_Exit } from './steps/LBOStep5_Exit';
import type { LBOInputState } from '../../types/lbo';
import type { BenchmarkData } from '../../types/lbo';

interface LBOWizardProps {
    data: LBOInputState;
    onChange: (newData: LBOInputState) => void;
}

export const LBOWizard: React.FC<LBOWizardProps> = ({ data, onChange }) => {
    const [step, setStep] = useState(1);
    const [showMonteCarlo, setShowMonteCarlo] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [benchmarks] = useState<BenchmarkData | null>(null);
    const [isFetchingMarketData, setIsFetchingMarketData] = useState(false);
    const [marketRates, setMarketRates] = useState<MarketRates | null>(null);
    const [scenarios, setScenarios] = useState<MarketScenarios | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<string>("Current");
    const [advisoryData, setAdvisoryData] = useState<any>(null);
    const [isFetchingAdvice, setIsFetchingAdvice] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    // Historical Data State
    const [isHistoricalMode, setIsHistoricalMode] = useState(false);
    const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");

    // Fetch Scenarios on Mount
    React.useEffect(() => {
        const loadScenarios = async () => {
            try {
                const data = await MarketDataService.getScenarios();
                setScenarios(data);
            } catch (err) {
                console.error("Failed to fetch scenarios", err);
            }
        };
        loadScenarios();
    }, []);

    const fetchAdvisory = async () => {
        if (!data.sector) return;
        setIsFetchingAdvice(true);
        try {
            const advice = await MarketDataService.getDebtStructureAdvice(data.sector || "Technology", data.entry_ebitda);
            setAdvisoryData(advice);
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetchingAdvice(false);
        }
    };

    const applyAdvisory = (advice: any) => {
        const senior = advice.suggested_structure.senior_debt;
        // Construct tranches based on advice - simplified for this refactor to match previous logic
        const tranches = [
            {
                name: "Senior Debt",
                amount: undefined,
                leverage_multiple: senior.leverage,
                interest_rate: senior.interest_rate,
                cash_interest: true,
                amortization_rate: 0.01,
                maturity: senior.term_years,
                mandatory_cash_sweep_priority: 1,
                auto_update_rate: true
            }
        ];
        onChange({ ...data, financing: { ...data.financing, tranches } });
        setAdvisoryData(null);
    };

    const fetchSnapshots = async () => {
        try {
            const data = await MarketDataService.getSnapshots(90); // Last 90 days
            setSnapshots(data);
        } catch (error) {
            console.error("Failed to fetch snapshots", error);
        }
    };

    const handleSnapshotSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedSnapshotId(id);
        if (!id) return;

        const snapshot = snapshots.find(s => s.id.toString() === id);
        if (snapshot) {
            // Apply Snapshot Data logic
            const newTranches = data.financing.tranches.map(t => {
                let newRate = t.interest_rate;
                if (t.name.toLowerCase().includes('senior') || t.mandatory_cash_sweep_priority === 1) {
                    newRate = snapshot.rates.senior_debt_rate;
                } else if (t.name.toLowerCase().includes('mezz') || t.name.toLowerCase().includes('junior')) {
                    newRate = snapshot.rates.mezzanine_debt_rate;
                } else if (t.name.toLowerCase().includes('preferred')) {
                    newRate = snapshot.rates.preferred_equity_rate;
                }
                return { ...t, interest_rate: newRate, auto_update_rate: true };
            });

            let levRatio = data.financing.total_leverage_ratio;
            let equityContrib = data.financing.equity_contribution_percent;

            if (data.sector && snapshot.system_multiples && snapshot.system_multiples[data.sector]) {
                const sm = snapshot.system_multiples[data.sector];
                levRatio = sm.total_leverage;
                equityContrib = sm.equity_contribution_percent;
            }

            onChange({
                ...data,
                financing: {
                    ...data.financing,
                    tranches: newTranches,
                    total_leverage_ratio: levRatio,
                    equity_contribution_percent: equityContrib
                }
            });
        }
    };

    const toggleHistoricalMode = () => {
        const newMode = !isHistoricalMode;
        setIsHistoricalMode(newMode);
        if (newMode && snapshots.length === 0) {
            fetchSnapshots();
        }
    };

    const fetchMarketRates = async () => {
        setIsFetchingMarketData(true);
        try {
            const rates = await MarketDataService.getRates();
            setMarketRates(rates);

            const newTranches = data.financing.tranches.map(t => {
                let newRate = t.interest_rate;
                let shouldUpdate = t.auto_update_rate ?? true;

                let targetRate = t.interest_rate;
                if (t.name.toLowerCase().includes('senior') || t.mandatory_cash_sweep_priority === 1) {
                    targetRate = rates.senior_debt_rate;
                } else if (t.name.toLowerCase().includes('mezz') || t.name.toLowerCase().includes('junior')) {
                    targetRate = rates.mezzanine_debt_rate;
                } else if (t.name.toLowerCase().includes('preferred')) {
                    targetRate = rates.preferred_equity_rate;
                }

                if (shouldUpdate) {
                    newRate = targetRate;
                }

                return { ...t, interest_rate: newRate, auto_update_rate: shouldUpdate };
            });
            onChange({ ...data, financing: { ...data.financing, tranches: newTranches } });
        } catch (error) {
            console.error("Failed to fetch market rates", error);
        } finally {
            setIsFetchingMarketData(false);
        }
    };

    const fetchMarketLevMultiples = async () => {
        if (!data.sector) return;
        setIsFetchingMarketData(true);
        try {
            const mults = await MarketDataService.getLeverageMultiples(data.sector);
            if (data.financing.tranches.length > 0) {
                const newTranches = [...data.financing.tranches];
                newTranches[0].leverage_multiple = mults.senior_leverage;
                onChange({
                    ...data,
                    financing: {
                        ...data.financing,
                        tranches: newTranches,
                        total_leverage_ratio: mults.total_leverage,
                        equity_contribution_percent: mults.equity_contribution_percent
                    }
                });
            }
        } catch (error) {
            console.error("Failed to fetch market multiples", error);
        } finally {
            setIsFetchingMarketData(false);
        }
    };

    const tutorialSteps = [
        { title: "Define Entry & Structure", content: "Start by setting the purchase price, solving for either Entry Price or Target IRR. Use 'Quick Start' templates for standard setups." },
        { title: "Configure Financing", content: "Add debt tranches (Senior, Mezzanine) with interest rates and covenants. Toggle 'Refinancing' to optimize capital structure later." },
        { title: "Advanced Tax & Covenants", content: "Set financial covenants (e.g. Max Leverage) and enable Tax Shields (NOLs, Step-Up) to optimize returns." },
        { title: "Management Incentive Plan", content: "Configure an option pool for management to align incentives with equity holders." },
        { title: "Exit & Waterfall", content: "Define the exit multiple and holding period. The waterfall calculates returns for LPs and GP (Carry, Catch-up)." },
        { title: "Risk Analysis", content: "Run a Monte Carlo simulation to see the probability of achieving your Target IRR under different scenarios." }
    ];

    const fetchBenchmarks = async (_sector: string) => {
        try {
            // Use relative path or env var in real app
            // Mocking for now as per original code structure
            // const res = await fetch(`http://localhost:8000/api/historical/benchmarks/${sector}`);
            // if (res.ok) setBenchmarks(await res.json());
        } catch (e) {
            console.error("Failed to fetch benchmarks", e);
        }
    };

    const prevStep = () => setStep(s => Math.max(1, s - 1));
    const nextStep = () => setStep(s => Math.min(6, s + 1));

    const handleCalculate = async () => {
        setIsCalculating(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsCalculating(false);
        console.log("LBO Calculation Triggered with data:", data);
    };

    return (
        <div className="glass-panel p-0 overflow-hidden animate-fade-in-up">
            {/* Header / Stepper */}
            <div className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">LBO Analysis Wizard</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure your Leverage Buyout model in 6 steps</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Start Tutorial"
                        >
                            <BookOpen size={20} />
                        </button>
                        {[1, 2, 3, 4, 5, 6].map(s => (
                            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-system-blue' : 'text-gray-400 dark:text-gray-600'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step === s ? 'border-system-blue bg-blue-50 text-system-blue dark:bg-blue-500/20' : step > s ? 'border-system-blue bg-system-blue text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {step > s ? <Check size={16} /> : s}
                                </div>
                                {s < 6 && <div className={`w-4 h-0.5 ${step > s ? 'bg-system-blue' : 'bg-gray-300 dark:bg-gray-700'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {step === 1 && (
                    <LBOStep1_Structure
                        data={data}
                        onChange={onChange}
                        benchmarks={benchmarks}
                        scenarios={scenarios}
                        selectedScenario={selectedScenario}
                        onSelectScenario={(key, scenario) => {
                            setSelectedScenario(key);
                            // Rate updates handled here or passed up? 
                            // In original code it was inline. reproducing logic:
                            if (scenario.rates) setMarketRates(scenario.rates as unknown as MarketRates);
                            const newData = { ...data };
                            const baseGrowth = 0.05;
                            newData.revenue_growth_rate = baseGrowth + scenario.growth_adjustment;
                            const baseExitMult = 10.0;
                            newData.exit_ev_ebitda_multiple = baseExitMult + scenario.multiples_adjustment;
                            if (data.solve_for === 'target_irr' && data.entry_ev_ebitda_multiple) {
                                newData.entry_ev_ebitda_multiple = baseExitMult + scenario.multiples_adjustment;
                            }
                            onChange(newData);
                        }}
                        onSelectSector={(sector) => fetchBenchmarks(sector)}
                    />
                )}

                {step === 2 && (
                    <LBOStep2_Financing
                        data={data}
                        onChange={onChange}
                        isHistoricalMode={isHistoricalMode}
                        toggleHistoricalMode={toggleHistoricalMode}
                        snapshots={snapshots}
                        selectedSnapshotId={selectedSnapshotId}
                        onSnapshotSelect={handleSnapshotSelect}
                        fetchMarketRates={fetchMarketRates}
                        isFetchingMarketData={isFetchingMarketData}
                        fetchMarketLevMultiples={fetchMarketLevMultiples}
                        fetchAdvisory={fetchAdvisory}
                        isFetchingAdvice={isFetchingAdvice}
                        advisoryData={advisoryData}
                        setAdvisoryData={setAdvisoryData}
                        applyAdvisory={applyAdvisory}
                        marketRates={marketRates}
                    />
                )}

                {step === 3 && <LBOStep3_TaxCovenants data={data} onChange={onChange} />}

                {step === 4 && <LBOStep4_MIP data={data} onChange={onChange} />}

                {step === 5 && <LBOStep5_Exit data={data} onChange={onChange} />}

                {step === 6 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Step 6: Sensitivity Analysis (Phase 4)</h3>
                        </div>

                        <div className="bg-blue-50/50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <Activity className="inline w-4 h-4 mr-1 text-blue-500" />
                                Run sensitivity scenarios to understand how changes in key variables impact your returns (IRR).
                            </p>
                        </div>
                        <SensitivityAnalysis lboData={data} />
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 1}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all ${step === 1
                        ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm'
                        }`}
                >
                    <ChevronLeft size={16} /> Back
                </button>

                {step < 5 ? (
                    <button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium text-white bg-system-blue hover:bg-blue-600 shadow-md hover:shadow-lg transition-all"
                    >
                        Next Step <ChevronRight size={16} />
                    </button>
                ) : step === 5 ? (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 shadow-sm transition-all"
                        >
                            Sensitivity <Layers size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleCalculate}
                            disabled={isCalculating}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-system-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isCalculating ? <RefreshCw className="animate-spin" size={16} /> : <Calculator size={16} />}
                            Calculate Valuation
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-system-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isCalculating ? <RefreshCw className="animate-spin" size={16} /> : <Calculator size={16} />}
                        Recalculate
                    </button>
                )}
            </div>

            <React.Suspense fallback={null}>
                <MonteCarloModal
                    isOpen={showMonteCarlo}
                    onClose={() => setShowMonteCarlo(false)}
                    lboData={data}
                />
            </React.Suspense>

            <TutorialOverlay
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                steps={tutorialSteps}
            />
        </div>
    );
};
