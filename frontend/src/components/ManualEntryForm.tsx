import React, { useState } from 'react';
import { api } from '../config/api';
import { WaccCalculator } from './WaccCalculator';
import { AuditAlert, type AuditIssue } from './dashboard/AuditAlert';
import { ScenarioWizard } from './ScenarioWizard';
import { AIValidationResult } from './AIValidationResult';
import { useDebounce } from '../hooks/useDebounce';
import { SuggestionPanel } from './SuggestionPanel';
import { EnhancedFormInput } from './common/EnhancedFormInput';
import { useChangeHistory } from '../hooks/useChangeHistory';
import { AISuggestionsButton } from './common/AISuggestionsButton';
import { useAICopilot } from '../hooks/useAICopilot';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { LBOWizard } from './lbo/LBOWizard';
import { useGlobalConfig } from '../context/GlobalConfigContext';

// New Sub-Components
import { GPCPanel } from './ManualEntry/GPCPanel';
import { PrecedentTransactionsPanel } from './ManualEntry/PrecedentTransactionsPanel';
import { DCFPanel } from './ManualEntry/DCFPanel';
import { ANAVPanel } from './ManualEntry/ANAVPanel';
import { WeightsPanel } from './ManualEntry/WeightsPanel';

// Lazy load heavy modals
const ExplanationModal = React.lazy(() => import('./common/ExplanationModal').then(module => ({ default: module.ExplanationModal })));
const AISettingsModal = React.lazy(() => import('./common/AISettingsModal').then(module => ({ default: module.AISettingsModal })));

interface ManualEntryFormProps {
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
    errors?: any[];
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSubmit, isLoading, errors = [] }) => {
    // ... (Keep existing helpers: getFieldError, getInputClassName, renderErrorMessage) ...
    const getFieldError = (field: string) => {
        return errors.find(e => e.field === field);
    };

    const getInputClassName = (field: string) => {
        const hasError = !!getFieldError(field);
        return `glass-input ${hasError ? 'border-red-500 focus:ring-red-500 bg-red-50' : ''}`;
    };

    const renderErrorMessage = (field: string) => {
        const error = getFieldError(field);
        if (!error) return null;
        return (
            <p className="mt-1 text-xs text-red-600 font-medium animate-fade-in">
                {error.message}
            </p>
        );
    };

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [activeMethod, setActiveMethod] = useState<'dcf' | 'gpc' | 'fcfe' | 'precedent' | 'lbo' | 'anav' | 'weights'>('dcf');
    const [explanationModalOpen, setExplanationModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState<any>(null);
    const { preferences } = useUserPreferences();
    const { config: globalConfig } = useGlobalConfig();

    // Effect: Check for pending valuation from Command Palette
    React.useEffect(() => {
        const pendingTicker = localStorage.getItem('pending_valuation_ticker');
        if (pendingTicker) {
            setTimeout(() => {
                setFormData(prev => ({ ...prev, ticker: pendingTicker }));
                localStorage.removeItem('pending_valuation_ticker');
            }, 100);
        }
    }, []);

    const { state: formData, pushState, undo, redo, canUndo, canRedo } = useChangeHistory({
        company_name: "New Company",
        currency: "USD",
        ticker: "",
        industry: "",
        sector: "",
        description: "",
        address: "",
        employees: "",
        fiscal_year_end: "",
        dcf_input: {
            historical: {
                years: [2020, 2021, 2022],
                revenue: [100, 110, 120],
                ebitda: [20, 22, 25],
                ebit: [15, 17, 20],
                net_income: [10, 12, 15],
                capex: [5, 5, 6],
                nwc: [2, 2, 3]
            },
            projections: {
                revenue_growth_start: 0.05,
                revenue_growth_end: 0.03,
                ebitda_margin_start: 0.20,
                ebitda_margin_end: 0.22,
                tax_rate: 0.25,
                discount_rate: 0.10,
                terminal_growth_rate: 0.02,
                terminal_exit_multiple: 12.0,
                depreciation_rate: 0.03,
                working_capital: {
                    dso: 45,
                    dio: 60,
                    dpo: 30
                }
            },
            shares_outstanding: 1000000,
            net_debt: 5000000
        },
        gpc_input: {
            target_ticker: "TARGET",
            peer_tickers: ["PEER1", "PEER2"],
            metrics: {
                "LTM Revenue": 120,
                "LTM EBITDA": 25
            },
            ev_revenue_multiple: undefined as number | undefined,
            ev_ebitda_multiple: undefined as number | undefined
        },
        dcfe_input: {
            historical: {
                years: [2020, 2021, 2022],
                revenue: [100, 110, 120],
                ebitda: [20, 22, 25],
                ebit: [15, 17, 20],
                net_income: [10, 12, 15],
                capex: [5, 5, 6],
                nwc: [2, 2, 3]
            },
            projections: {
                revenue_growth_start: 0.05,
                revenue_growth_end: 0.03,
                ebitda_margin_start: 0.20,
                ebitda_margin_end: 0.22,
                tax_rate: 0.25,
                discount_rate: 0.10,
                terminal_growth_rate: 0.025
            },
            debt_schedule: [
                { beginning_debt: 50, new_borrowing: 10, debt_repayment: 5, interest_rate: 0.05 },
                { beginning_debt: 55, new_borrowing: 5, debt_repayment: 5, interest_rate: 0.05 },
                { beginning_debt: 55, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 },
                { beginning_debt: 45, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 },
                { beginning_debt: 35, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 }
            ],
            cost_of_equity: 0.12,
            terminal_growth_rate: 0.025,
            shares_outstanding: 1000000
        },
        precedent_transactions_input: {
            transactions: [
                {
                    target_name: "Company A",
                    acquirer_name: "Buyer 1",
                    announcement_date: "2023-01-15",
                    deal_value: 500,
                    revenue: 200,
                    ebitda: 50
                },
                {
                    target_name: "Company B",
                    acquirer_name: "Buyer 2",
                    announcement_date: "2023-03-20",
                    deal_value: 800,
                    revenue: 300,
                    ebitda: 80
                }
            ],
            target_revenue: 220,
            target_ebitda: 55,
            use_median: true
        },
        anav_input: {
            assets: { "Cash": 10, "Inventory": 20, "PP&E": 100 } as Record<string, number>,
            liabilities: { "Debt": 50, "Payables": 10 } as Record<string, number>,
            adjustments: { "PP&E": 20, "Inventory": -5 } as Record<string, number>
        },
        sensitivity_analysis: {
            variable_1: "discount_rate",
            range_1: [0.08, 0.10, 0.12],
            variable_2: "terminal_growth_rate",
            range_2: [0.01, 0.02, 0.03]
        },
        method_weights: {
            dcf: 0.4,
            fcfe: 0.0,
            gpc: 0.3,
            precedent: 0.3,
            anav: 0.0,
            lbo: 0.0
        },
        lbo_input: {
            solve_for: 'entry_price' as any,
            entry_revenue: 100,
            entry_ebitda: 20,
            entry_ev_ebitda_multiple: 10.0 as number | undefined,
            target_irr: 0.20 as number | undefined,
            financing: {
                tranches: [
                    {
                        name: "Senior Debt",
                        amount: undefined as number | undefined,
                        leverage_multiple: 4.0 as number | undefined,
                        interest_rate: 0.08,
                        cash_interest: true,
                        amortization_rate: 0.05,
                        maturity: 5,
                        mandatory_cash_sweep_priority: 1
                    },
                    {
                        name: "Mezzanine",
                        amount: undefined as number | undefined,
                        leverage_multiple: 1.0 as number | undefined,
                        interest_rate: 0.12,
                        cash_interest: false, // PIK
                        amortization_rate: 0.0,
                        maturity: 7,
                        mandatory_cash_sweep_priority: 2
                    }
                ],
                total_leverage_ratio: 5.0 as number | undefined,
                equity_contribution_percent: 0.40 as number | undefined
            },
            assumptions: {
                transaction_fees_percent: 0.02,
                synergy_benefits: 0.0
            },
            revenue_growth_rate: 0.05,
            ebitda_margin: 0.25,
            capex_percentage: 0.03,
            nwc_percentage: 0.05,
            tax_rate: 0.25,
            holding_period: 5,
            exit_ev_ebitda_multiple: 10.0 as number | undefined
        }
    });

    // Helper to update state with history
    const setFormData = (newStateOrUpdater: React.SetStateAction<typeof formData>) => {
        if (typeof newStateOrUpdater === 'function') {
            // @ts-ignore - complex state type
            pushState(newStateOrUpdater(formData));
        } else {
            pushState(newStateOrUpdater);
        }
    };

    const handleApplySuggestions = (suggestions: any) => {
        setFormData(prev => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: {
                    ...prev.dcf_input.projections,
                    ...suggestions
                }
            }
        }));
    };

    // AI Copilot Integration
    const { askCopilot, loading: copilotLoading } = useAICopilot();
    const handleCopilotAction = async (action: string, context: any) => {
        // ... (Keep existing copilot logic or placeholder)
        console.log("Copilot action:", action, context);
    };

    // --- New Update Handlers for Sub-Components ---

    const handleUpdateGPC = (newData: any) => {
        setFormData(prev => ({ ...prev, gpc_input: newData }));
    };

    const handleFindPeers = async (ticker: string) => {
        // ... (Keep existing peer finding logic if any, or mockup)
        console.log("Finding peers for", ticker);
        // Mock implementation for now as per refactoring plan priority of structure
        handleUpdateGPC({
            ...formData.gpc_input,
            peer_tickers: [...formData.gpc_input.peer_tickers, "MOCK1", "MOCK2"]
        });
    };

    const handleUpdatePrecedent = (newData: any) => {
        setFormData(prev => ({ ...prev, precedent_transactions_input: newData }));
    };

    const handleUpdateANAV = (newData: any) => {
        setFormData(prev => ({ ...prev, anav_input: newData }));
    };

    const handleUpdateWeights = (method: string, weight: number) => {
        setFormData(prev => ({
            ...prev,
            method_weights: { ...prev.method_weights, [method]: weight }
        }));
    };

    // Generic Projection Updater for DCF/FCFE
    const updateProjection = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: {
                    ...prev.dcf_input.projections,
                    [field]: parseFloat(value)
                }
            }
        }));
    };

    // Specialized FCFE Updaters
    const updateFCFEProjection = (field: string, value: any) => {
        // Handle both string (inputs) and already parsed inputs (if any)
        const val = typeof value === 'string' ? parseFloat(value) : value;

        setFormData(prev => {
            // If field is top-level in dcfe_input inputs (like cost_of_equity)
            if (field in prev.dcfe_input) {
                return { ...prev, dcfe_input: { ...prev.dcfe_input, [field]: val } };
            }
            // Otherwise assume projections
            return {
                ...prev,
                dcfe_input: {
                    ...prev.dcfe_input,
                    projections: {
                        ...prev.dcfe_input.projections,
                        [field]: val
                    }
                }
            };
        });
    };

    const updateDebtSchedule = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcfe_input: {
                ...prev.dcfe_input,
                debt_schedule: prev.dcfe_input.debt_schedule.map((debt: any, i: number) =>
                    i === index ? { ...debt, [field]: parseFloat(value) } : debt
                )
            }
        }));
    };


    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Header / Company Info Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Valuation Analysis</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configure parameters for {formData.company_name || 'Target Company'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={undo} disabled={!canUndo}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                        title="Undo"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <button
                        onClick={redo} disabled={!canRedo}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                        title="Redo"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 01-8 8v2M21 10l-6 6m0-6l-6-6" /></svg>
                    </button>

                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

                    <AISuggestionsButton
                        isCopilotActive={false}
                        onClick={() => { }}
                        hasNewSuggestions={true}
                    />

                    <button
                        onClick={() => onSubmit(formData)}
                        disabled={isLoading}
                        className="glass-button-primary px-6 py-2.5 shadow-lg shadow-blue-500/20"
                    >
                        {isLoading ? 'Processing...' : 'Calculate Valuation'}
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar: Method Selection */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Company Details Mini-Card */}
                    <div className="glass-panel p-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Company Name</label>
                        <input
                            value={formData.company_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                            className="glass-input w-full text-lg font-semibold mb-4"
                            placeholder="Enter Name..."
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                    className="glass-input w-full text-sm py-1.5"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Fiscal Year</label>
                                <input
                                    value={formData.fiscal_year_end}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fiscal_year_end: e.target.value }))}
                                    placeholder="Dec 31"
                                    className="glass-input w-full text-sm py-1.5"
                                />
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {[
                            { id: 'dcf', label: 'DCF (Unlevered)', icon: 'chart' },
                            { id: 'fcfe', label: 'DCF (Levered / FCFE)', icon: 'cash' },
                            { id: 'gpc', label: 'Public Comps (GPC)', icon: 'building' },
                            { id: 'precedent', label: 'Precedent Transactions', icon: 'deal' },
                            { id: 'lbo', label: 'LBO Analysis', icon: 'lock' },
                            { id: 'anav', label: 'Net Asset Value', icon: 'cube' },
                            { id: 'weights', label: 'Method Weights', icon: 'scale' },
                        ].map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setActiveMethod(method.id as any)}
                                className={`
                                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                    ${activeMethod === method.id
                                        ? 'bg-system-blue text-white shadow-lg shadow-blue-500/30 translate-x-1'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:translate-x-1'
                                    }
                                `}
                            >
                                <span className={`mr-3 ${activeMethod === method.id ? 'text-white' : 'text-gray-400'}`}>
                                    {/* Simple Icon placeholder logic */}
                                    {method.icon === 'chart' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
                                    {method.icon === 'cash' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    {method.icon === 'building' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                    {method.icon === 'deal' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                                    {method.icon === 'lock' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                                    {method.icon === 'cube' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-8-4v-10l8 4m0 0v10" /></svg>}
                                    {method.icon === 'scale' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                                </span>
                                {method.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right Content Area */}
                <div className="lg:col-span-3 min-h-[600px]">

                    {/* Suggestion Panel */}
                    <SuggestionPanel
                        companyData={formData}
                        currentAssumptions={{ ...formData.dcf_input.projections }} // Simplified for demo
                        onApplySuggestions={handleApplySuggestions}
                    />

                    <div className="mt-6">
                        {activeMethod === 'dcf' && (
                            <DCFPanel
                                mode="dcf"
                                data={formData.dcf_input}
                                onChange={(field, value) => {
                                    // Top level field in dcf_input
                                    setFormData(prev => ({ ...prev, dcf_input: { ...prev.dcf_input, [field]: value } }));
                                }}
                                onUpdateProjection={updateProjection}
                                onUpdateDebts={() => { }} // No debts in unlevered
                            />
                        )}

                        {activeMethod === 'gpc' && (
                            <GPCPanel
                                data={formData.gpc_input}
                                onChange={handleUpdateGPC}
                                onFindPeers={handleFindPeers}
                            />
                        )}

                        {activeMethod === 'fcfe' && (
                            <DCFPanel
                                mode="fcfe"
                                data={formData.dcfe_input}
                                onChange={(field, value) => updateFCFEProjection(field, value)}
                                onUpdateProjection={updateFCFEProjection}
                                onUpdateDebts={updateDebtSchedule}
                            />
                        )}

                        {activeMethod === 'precedent' && (
                            <PrecedentTransactionsPanel
                                data={formData.precedent_transactions_input}
                                onChange={handleUpdatePrecedent}
                            />
                        )}

                        {activeMethod === 'lbo' && (
                            <div className="animate-fade-in-up">
                                <LBOWizard
                                    data={formData.lbo_input}
                                    onChange={(newData) => setFormData(prev => ({ ...prev, lbo_input: newData }))}
                                />
                            </div>
                        )}

                        {activeMethod === 'anav' && (
                            <ANAVPanel
                                data={formData.anav_input}
                                onChange={handleUpdateANAV}
                            />
                        )}

                        {activeMethod === 'weights' && (
                            <WeightsPanel
                                weights={formData.method_weights}
                                onChange={handleUpdateWeights}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Suspense Modals */}
            <React.Suspense fallback={null}>
                {explanationModalOpen && (
                    <ExplanationModal
                        isOpen={explanationModalOpen}
                        onClose={() => setExplanationModalOpen(false)}
                        title="AI Explanation"
                        content="Explanation content here..."
                    />
                )}
                {settingsModalOpen && (
                    <AISettingsModal
                        isOpen={settingsModalOpen}
                        onClose={() => setSettingsModalOpen(false)}
                        preferences={preferences}
                        onUpdatePreferences={() => { }}
                    />
                )}
            </React.Suspense>
        </div>
    );
};
