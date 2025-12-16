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

// Lazy load heavy modals
const ExplanationModal = React.lazy(() => import('./common/ExplanationModal').then(module => ({ default: module.ExplanationModal })));
const AISettingsModal = React.lazy(() => import('./common/AISettingsModal').then(module => ({ default: module.AISettingsModal })));



interface ManualEntryFormProps {
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
    errors?: any[];
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSubmit, isLoading, errors = [] }) => {
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
            // Wait a tick for component to mount fully if needed, or just set it
            setTimeout(() => {
                setFormData(prev => ({ ...prev, ticker: pendingTicker }));
                localStorage.removeItem('pending_valuation_ticker');
                // Optional: Auto-fetch could be triggered here or by the user
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

    const handleWizardApply = (newAssumptions: any) => {
        setFormData(newAssumptions);
    };

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

    const updateWorkingCapital = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: {
                    ...prev.dcf_input.projections,
                    working_capital: {
                        ...prev.dcf_input.projections.working_capital,
                        [field]: parseFloat(value)
                    }
                }
            }
        }));
    };

    const updateFCFEProjection = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dcfe_input: {
                ...prev.dcfe_input,
                projections: {
                    ...prev.dcfe_input.projections,
                    [field]: parseFloat(value)
                }
            }
        }));
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

    const [isWaccModalOpen, setIsWaccModalOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [auditIssues, setAuditIssues] = useState<AuditIssue[]>([]);

    // AI Validation State
    const [validationResult, setValidationResult] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Debounce the entire form data (wait 1s after typing stops)
    const debouncedFormData = useDebounce(formData, 1000);
    const { suggestions: aiSuggestions, isLoading: isFetchingSuggestions, undoLastChange, canUndo: canUndoAI } = useAICopilot();

    // Validation Cache
    const validationCache = React.useRef<Record<string, any>>({});

    // Effect to trigger validation when debounced data changes
    React.useEffect(() => {
        const validate = async () => {
            if (!preferences.aiEnabled || !preferences.autoValidate) return;
            if (!debouncedFormData.ticker) return;

            // Create a simple hash/key for the current state
            const cacheKey = JSON.stringify({
                ticker: debouncedFormData.ticker,
                revenue: debouncedFormData.dcf_input.historical.revenue,
                ebitda: debouncedFormData.dcf_input.historical.ebitda
            });

            // Check cache
            if (validationCache.current[cacheKey]) {
                setValidationResult(validationCache.current[cacheKey]);
                return;
            }

            setIsValidating(true);
            try {
                const response = await fetch(api.url(`/api/validation/analyze?ticker=${debouncedFormData.ticker}`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(debouncedFormData)
                });
                if (response.ok) {
                    const result = await response.json();
                    setValidationResult(result);
                    // Update cache
                    validationCache.current[cacheKey] = result;
                }
            } catch (error) {
                console.error("Validation error", error);
            } finally {
                setIsValidating(false);
            }
        };

        validate();
    }, [debouncedFormData, preferences.aiEnabled, preferences.autoValidate]);

    // Auto-sync with Global Config
    React.useEffect(() => {
        if (globalConfig) {
            setFormData((prev: any) => {
                const next = JSON.parse(JSON.stringify(prev));
                let changed = false;

                // Helper to safely update nested if different
                const sync = (path: string[], value: number) => {
                    let current = next;
                    for (let i = 0; i < path.length - 1; i++) {
                        current = current[path[i]];
                        if (!current) return;
                    }
                    const field = path[path.length - 1];
                    // Check strict inequality to avoid microscopic fp diffs if value is float
                    if (Math.abs(current[field] - value) > 0.0001) {
                        current[field] = value;
                        changed = true;
                    }
                };

                // Apply Global Defaults
                if (next.dcf_input?.projections) {
                    sync(['dcf_input', 'projections', 'tax_rate'], globalConfig.default_tax_rate);
                    sync(['dcf_input', 'projections', 'discount_rate'], globalConfig.default_discount_rate);
                    sync(['dcf_input', 'projections', 'revenue_growth_start'], globalConfig.default_revenue_growth);
                    sync(['dcf_input', 'projections', 'ebitda_margin_start'], globalConfig.default_ebitda_margin);
                    sync(['dcf_input', 'projections', 'terminal_growth_rate'], globalConfig.default_terminal_growth);

                    if (next.dcf_input.projections.working_capital) {
                        sync(['dcf_input', 'projections', 'working_capital', 'dso'], globalConfig.default_dso);
                        sync(['dcf_input', 'projections', 'working_capital', 'dio'], globalConfig.default_dio);
                        sync(['dcf_input', 'projections', 'working_capital', 'dpo'], globalConfig.default_dpo);
                    }
                }

                if (next.lbo_input) {
                    sync(['lbo_input', 'entry_ev_ebitda_multiple'], globalConfig.default_entry_multiple);
                    // Leverage is trickier structure, simplified for now:
                    if (next.lbo_input.financing) {
                        sync(['lbo_input', 'financing', 'total_leverage_ratio'], globalConfig.default_leverage);
                    }
                }

                return changed ? next : prev;
            });
        }
    }, [globalConfig]);





    const getSuggestion = (field: string) => {
        if (!preferences.aiEnabled || !preferences.showBadges) return undefined;
        // Map form field to suggestion key used by AI Copilot
        const fieldMap: Record<string, string> = {
            revenue_growth_start: 'revenue_growth',
            ebitda_margin_start: 'ebitda_margin',
            discount_rate: 'wacc',
            terminal_growth_rate: 'terminal_growth'
        };
        const key = fieldMap[field];
        return aiSuggestions?.[key];
    };


    const validateWithAI = async () => {
        // Manual trigger (keep existing logic but maybe just force update)
        // The effect handles it, but this button can be "Force Refresh"
        // For now, let's just let the effect handle it mostly, but keep the button for explicit user action
        // We can just trigger the same logic.
        // Actually, let's just rely on the effect for "Real-time" but keep the button for "Show me the summary panel" focus.
        // Or we can make the button scroll to the result.
    };

    const runAudit = async () => {
        try {
            const response = await fetch(api.url('/api/audit/assumptions'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                const issues = await response.json();
                setAuditIssues(issues);
            }
        } catch (error) {
            console.error("Audit failed", error);
        }
    };

    const fetchFinancialData = async () => {
        if (!formData.ticker) return;
        setIsFetching(true);
        setFetchError(null);
        try {
            const response = await fetch(api.url(`/api/financials/${formData.ticker}`));
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch financials');
            }
            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                company_name: data.company_name || prev.company_name,
                industry: data.industry || "",
                sector: data.sector || "",
                description: data.description || "",
                address: data.address || "",
                employees: data.employees ? data.employees.toString() : "",
                fiscal_year_end: data.fiscal_year_end || "",
                dcf_input: {
                    ...prev.dcf_input,
                    historical: {
                        years: data.years,
                        revenue: data.revenue,
                        ebitda: data.ebitda,
                        ebit: data.ebit,
                        net_income: data.net_income,
                        capex: data.capex,
                        nwc: data.nwc
                    }
                }
            }));
        } catch (error: any) {
            console.error(error);
            setFetchError(error.message || 'Failed to fetch financial data.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleWaccApply = (wacc: number) => {
        updateProjection('discount_rate', wacc.toString());
    };

    const handleApplyPattern = (values: { revenue_growth: number; ebitda_margin: number }) => {
        setFormData(prev => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: {
                    ...prev.dcf_input.projections,
                    revenue_growth_start: values.revenue_growth,
                    ebitda_margin_start: values.ebitda_margin
                }
            }
        }));
    };

    const handleApplySuggestions = (suggestions: any) => {
        // Batch application logic
        // 1. Create a deep copy of current state to modify
        let newFormData = JSON.parse(JSON.stringify(formData));

        // 2. Apply updates in logical order (though for state snapshot, order matters less than result)
        if (suggestions.revenue_growth) newFormData.dcf_input.projections.revenue_growth_start = suggestions.revenue_growth;
        if (suggestions.ebitda_margin) newFormData.dcf_input.projections.ebitda_margin_start = suggestions.ebitda_margin;
        if (suggestions.wacc) newFormData.dcf_input.projections.discount_rate = suggestions.wacc;
        if (suggestions.terminal_growth) newFormData.dcf_input.projections.terminal_growth_rate = suggestions.terminal_growth;

        // 3. Push single new state to history
        pushState(newFormData);
    };

    const applyAllAISuggestions = () => {
        if (!aiSuggestions) return;
        const updates: any = {};
        Object.entries(aiSuggestions).forEach(([key, suggestion]: [string, any]) => {
            updates[key] = suggestion.value;
        });
        handleApplySuggestions(updates);
    };

    const handleExplainSuggestion = (field: string, suggestion: any) => {
        if (!suggestion) return;
        setActiveSuggestion({
            field,
            currentValue: field === 'revenue_growth_start' ? formData.dcf_input.projections.revenue_growth_start :
                field === 'ebitda_margin_start' ? formData.dcf_input.projections.ebitda_margin_start :
                    field === 'discount_rate' ? formData.dcf_input.projections.discount_rate :
                        field === 'terminal_growth_rate' ? formData.dcf_input.projections.terminal_growth_rate : 0,
            suggestedValue: suggestion.value,
            confidence: suggestion.confidence,
            reasoning: suggestion.reasoning || suggestion.message,
            impact: suggestion.impact,
            source: suggestion.source || "AI Analysis"
        });
        setExplanationModalOpen(true);
    };






    // Undo the last AI change
    const undoLastAIChange = () => {
        undoLastChange((field: string, oldVal: any) => {
            // Revert the corresponding form field
            if (field === 'revenue_growth_start') updateProjection('revenue_growth_start', oldVal.toString());
            else if (field === 'ebitda_margin_start') updateProjection('ebitda_margin_start', oldVal.toString());
            else if (field === 'discount_rate') updateProjection('discount_rate', oldVal.toString());
            else if (field === 'terminal_growth_rate') updateProjection('terminal_growth_rate', oldVal.toString());
        });
    };

    const sanitizeData = (data: any): any => {
        if (typeof data === 'number') {
            return isNaN(data) ? 0 : data;
        }
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }
        if (typeof data === 'object' && data !== null) {
            const clean: any = {};
            for (const key in data) {
                clean[key] = sanitizeData(data[key]);
            }
            return clean;
        }
        return data;
    };

    return (
        <div className="max-w-6xl mx-auto mt-10 animate-fade-in-up" >
            <ScenarioWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onApply={handleWizardApply}
                currentAssumptions={formData}
            />
            <form onSubmit={async (e) => {
                e.preventDefault();
                await runAudit();
                onSubmit(sanitizeData(formData));
            }} className="space-y-8">

                <AuditAlert issues={auditIssues} />

                <div id="suggestion-panel">
                    <SuggestionPanel
                        companyData={{
                            sector: formData.sector,
                            revenue: formData.dcf_input.historical.revenue[formData.dcf_input.historical.revenue.length - 1] * 1000000 // Assuming millions input
                        }}
                        currentAssumptions={{
                            revenue_growth: formData.dcf_input.projections.revenue_growth_start,
                            ebitda_margin: formData.dcf_input.projections.ebitda_margin_start,
                            wacc: formData.dcf_input.projections.discount_rate,
                            terminal_growth: formData.dcf_input.projections.terminal_growth_rate
                        }}
                        onApplySuggestions={handleApplySuggestions}
                    />
                </div>

                <AIValidationResult
                    result={validationResult}
                    isLoading={isValidating}
                    onApplyPattern={handleApplyPattern}
                />

                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Select Valuation Method</h2>

                            {/* Undo/Redo Controls - Styled like buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={undo}
                                    disabled={!canUndo}
                                    className="p-2 bg-system-blue text-white rounded-lg shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 transition-all"
                                    title="Undo"
                                >
                                    ↩
                                </button>
                                <button
                                    type="button"
                                    onClick={redo}
                                    disabled={!canRedo}
                                    className="p-2 bg-system-blue text-white rounded-lg shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 transition-all"
                                    title="Redo"
                                >
                                    ↪
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Global AI Apply Button */}
                            {validationResult && (
                                <AISuggestionsButton
                                    suggestions={validationResult}
                                    onApplyAll={applyAllAISuggestions}
                                    onReview={() => {
                                        // Open modal with summary or first suggestion
                                        if (validationResult.patterns?.avg_values) {
                                            // Just pick one for demo or create a summary view
                                            handleExplainSuggestion('revenue_growth_start', {
                                                value: validationResult.patterns.avg_values.revenue_growth,
                                                confidence: validationResult.patterns.confidence,
                                                message: `Market consensus for ${validationResult.patterns.matched_cluster}`,
                                                impact: "Aligns with industry standards"
                                            });
                                        }
                                    }}
                                />
                            )}

                            {/* Undo AI Changes Button */}
                            <button
                                type="button"
                                onClick={undoLastAIChange}
                                disabled={!canUndoAI}
                                className="px-3 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                                title="Undo last AI change"
                            >
                                <span>↺</span>
                            </button>

                            <button
                                type="button"
                                onClick={validateWithAI}
                                disabled={isValidating || !preferences.aiEnabled}
                                className="px-5 py-2.5 bg-system-blue text-white rounded-xl shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all font-medium flex items-center gap-2 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {isValidating ? (
                                    <>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Validate with AI
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setSettingsModalOpen(true)}
                                className="p-2.5 bg-white text-gray-600 rounded-xl shadow-sm hover:bg-gray-50 border border-gray-200 transition-colors"
                                title="AI Settings"
                            >

                            </button>
                        </div>
                    </div>
                    <div className="flex space-x-2 bg-gray-100/50 backdrop-blur-md p-1.5 rounded-xl w-fit overflow-x-auto border border-white/20">
                        {['dcf', 'fcfe', 'gpc', 'precedent', 'lbo', 'anav', 'weights'].map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setActiveMethod(method as any)}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeMethod === method
                                    ? 'glass-tab-active scale-100'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/30 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                                    }`}
                            >
                                {method === 'dcf' ? 'DCF (FCFF)' :
                                    method === 'fcfe' ? 'DCF (FCFE)' :
                                        method === 'precedent' ? 'Precedent Txns' :
                                            method === 'anav' ? 'ANAV' :
                                                method.toUpperCase().replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <EnhancedFormInput
                                label="Company Name"
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                error={getFieldError('company_name')?.message}
                                className="glass-input"
                            />
                        </div>
                        <div>
                            <div className="flex gap-2 items-end">
                                <EnhancedFormInput
                                    label="Ticker Symbol"
                                    type="text"
                                    value={formData.ticker}
                                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                                    placeholder="e.g. IBM"
                                    error={getFieldError('ticker')?.message}
                                    className="glass-input"
                                    wrapperClassName="flex-grow"
                                />
                                <button
                                    type="button"
                                    onClick={fetchFinancialData}
                                    disabled={!formData.ticker || isFetching}
                                    className="px-4 py-2 bg-system-blue text-white rounded-lg shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-50 transition-all text-sm font-medium whitespace-nowrap h-[42px] mb-1"
                                >
                                    {isFetching ? 'Loading...' : 'Auto-Populate'}
                                </button>
                            </div>

                            {fetchError && (
                                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                    {fetchError}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="glass-input"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Company Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="glass-input h-24 resize-none"
                                placeholder="Company description..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Industry</label>
                            <input
                                type="text"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="glass-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sector</label>
                            <input
                                type="text"
                                value={formData.sector}
                                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                className="glass-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Location (Address)</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="glass-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Employees</label>
                            <input
                                type="text"
                                value={formData.employees}
                                onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                                className="glass-input"
                            />
                        </div>
                    </div>
                </div>

                {activeMethod === 'dcf' && (
                    <div className="glass-panel p-8 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">DCF Assumptions</h3>
                                <p className="text-sm text-gray-500 mt-1">Free Cash Flow to Firm (FCFF)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsWizardOpen(true)}
                                className="glass-button text-sm font-medium flex items-center gap-2 text-system-blue"
                            >

                                <span>Scenario Wizard</span>
                            </button>
                        </div>

                        {/* AI Suggestions Panel */}
                        {aiSuggestions && (
                            <div className="mb-6 flex justify-end">
                                <AISuggestionsButton
                                    suggestions={aiSuggestions}
                                    onApplyAll={applyAllAISuggestions}
                                    onReview={() => {
                                        // Highlight first suggestion logic or open panel
                                        const firstKey = Object.keys(aiSuggestions.suggestions)[0];
                                        if (firstKey) {
                                            // Focus logic or scroll to it
                                        }
                                    }}
                                    isLoading={isFetchingSuggestions}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <EnhancedFormInput
                                    label="Revenue Growth (Start)"
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.revenue_growth_start}
                                    onChange={(e) => updateProjection('revenue_growth_start', e.target.value)}
                                    error={getFieldError('revenue_growth_start')?.message}
                                    suggestion={getSuggestion('revenue_growth_start')}
                                    onApplySuggestion={(val) => updateProjection('revenue_growth_start', val)}
                                    isLoading={isFetchingSuggestions}
                                    onExplain={() => {
                                        const s = getSuggestion('revenue_growth_start');
                                        if (s) handleExplainSuggestion('revenue_growth_start', s);
                                    }}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label="EBITDA Margin (Start)"
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.ebitda_margin_start}
                                    onChange={(e) => updateProjection('ebitda_margin_start', e.target.value)}
                                    error={getFieldError('ebitda_margin_start')?.message}
                                    suggestion={getSuggestion('ebitda_margin_start')}
                                    onApplySuggestion={(val) => updateProjection('ebitda_margin_start', val)}
                                    isLoading={isFetchingSuggestions}
                                    onExplain={() => {
                                        const s = getSuggestion('ebitda_margin_start');
                                        if (s) handleExplainSuggestion('ebitda_margin_start', s);
                                    }}
                                />
                            </div>
                            <div>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-grow">
                                        <EnhancedFormInput
                                            label="Discount Rate (WACC)"
                                            type="number"
                                            step="0.001"
                                            value={formData.dcf_input.projections.discount_rate}
                                            onChange={(e) => updateProjection('discount_rate', e.target.value)}
                                            error={getFieldError('discount_rate')?.message}
                                            suggestion={getSuggestion('wacc')}
                                            onApplySuggestion={(val) => updateProjection('discount_rate', val)}
                                            isLoading={isFetchingSuggestions}
                                            onExplain={() => {
                                                const s = getSuggestion('wacc');
                                                if (s) handleExplainSuggestion('discount_rate', s);
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsWaccModalOpen(true)}
                                        className="mb-4 px-3 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium h-[42px]"
                                        title="Calculate WACC"
                                    >
                                        Calc
                                    </button>
                                </div>
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label="Terminal Growth Rate"
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.terminal_growth_rate}
                                    onChange={(e) => updateProjection('terminal_growth_rate', e.target.value)}
                                    error={getFieldError('terminal_growth_rate')?.message}
                                    suggestion={getSuggestion('terminal_growth_rate')}
                                    onApplySuggestion={(val) => updateProjection('terminal_growth_rate', val)}
                                    isLoading={isFetchingSuggestions}
                                    onExplain={() => {
                                        const s = getSuggestion('terminal_growth_rate');
                                        if (s) handleExplainSuggestion('terminal_growth_rate', s);
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Tax Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.tax_rate}
                                    onChange={(e) => updateProjection('tax_rate', e.target.value)}
                                    className={getInputClassName('tax_rate')}
                                />
                                {renderErrorMessage('tax_rate')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Exit Multiple (EV/EBITDA)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.dcf_input.projections.terminal_exit_multiple}
                                    onChange={(e) => updateProjection('terminal_exit_multiple', e.target.value)}
                                    className={getInputClassName('terminal_exit_multiple')}
                                />
                                {renderErrorMessage('terminal_exit_multiple')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Depreciation Rate (% of Rev)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.dcf_input.projections.depreciation_rate}
                                    onChange={(e) => updateProjection('depreciation_rate', e.target.value)}
                                    className={getInputClassName('depreciation_rate')}
                                />
                                {renderErrorMessage('depreciation_rate')}
                            </div>
                        </div>

                        <h4 className="font-semibold text-gray-800 mb-4 mt-8 flex items-center gap-2">
                            <span className="w-1 h-4 bg-system-blue rounded-full"></span>
                            Working Capital Assumptions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">DSO (Days Sales Outstanding)</label>
                                <input
                                    type="number"
                                    value={formData.dcf_input.projections.working_capital.dso}
                                    onChange={(e) => updateWorkingCapital('dso', e.target.value)}
                                    className={getInputClassName('dso')}
                                />
                                {renderErrorMessage('dso')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">DIO (Days Inventory Outstanding)</label>
                                <input
                                    type="number"
                                    value={formData.dcf_input.projections.working_capital.dio}
                                    onChange={(e) => updateWorkingCapital('dio', e.target.value)}
                                    className={getInputClassName('dio')}
                                />
                                {renderErrorMessage('dio')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">DPO (Days Payable Outstanding)</label>
                                <input
                                    type="number"
                                    value={formData.dcf_input.projections.working_capital.dpo}
                                    onChange={(e) => updateWorkingCapital('dpo', e.target.value)}
                                    className={getInputClassName('dpo')}
                                />
                                {renderErrorMessage('dpo')}
                            </div>
                        </div>
                    </div >
                )}

                {
                    activeMethod === 'fcfe' && (
                        <>
                            <div className="glass-panel p-8 animate-fade-in-up">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">DCF Assumptions (FCFE)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Cost of Equity</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.dcfe_input.cost_of_equity}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                dcfe_input: { ...prev.dcfe_input, cost_of_equity: parseFloat(e.target.value) }
                                            }))}
                                            className={getInputClassName('cost_of_equity')}
                                        />
                                        {renderErrorMessage('cost_of_equity')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Terminal Growth Rate</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.dcfe_input.terminal_growth_rate}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                dcfe_input: { ...prev.dcfe_input, terminal_growth_rate: parseFloat(e.target.value) }
                                            }))}
                                            className={getInputClassName('terminal_growth_rate')}
                                        />
                                        {renderErrorMessage('terminal_growth_rate')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Tax Rate</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.dcfe_input.projections.tax_rate}
                                            onChange={(e) => updateFCFEProjection('tax_rate', e.target.value)}
                                            className={getInputClassName('tax_rate')}
                                        />
                                        {renderErrorMessage('tax_rate')}
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-8 animate-fade-in-up">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Debt Schedule (5 Years)</h3>
                                <div className="overflow-x-auto rounded-xl border border-white/30">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-white/50 border-b border-white/30">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Year</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Beginning Debt</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">New Borrowing</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Repayment</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Interest Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/30">
                                            {formData.dcfe_input.debt_schedule.map((debt: any, index: number) => (
                                                <tr key={index} className="hover:bg-white/40">
                                                    <td className="py-3 px-4 text-sm text-gray-600">Year {index + 1}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={debt.beginning_debt}
                                                                onChange={(e) => updateDebtSchedule(index, 'beginning_debt', e.target.value)}
                                                                className={`${getInputClassName(`debt_beginning_debt_${index}`)} w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm`}
                                                            />
                                                            {renderErrorMessage(`debt_beginning_debt_${index}`)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={debt.new_borrowing}
                                                                onChange={(e) => updateDebtSchedule(index, 'new_borrowing', e.target.value)}
                                                                className={`${getInputClassName(`debt_new_borrowing_${index}`)} w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm`}
                                                            />
                                                            {renderErrorMessage(`debt_new_borrowing_${index}`)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={debt.debt_repayment}
                                                                onChange={(e) => updateDebtSchedule(index, 'debt_repayment', e.target.value)}
                                                                className={`${getInputClassName(`debt_debt_repayment_${index}`)} w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm`}
                                                            />
                                                            {renderErrorMessage(`debt_debt_repayment_${index}`)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={debt.interest_rate}
                                                                onChange={(e) => updateDebtSchedule(index, 'interest_rate', e.target.value)}
                                                                className={`${getInputClassName(`debt_interest_rate_${index}`)} w-full px-3 py-1.5 rounded-lg border border-white/30 bg-white/50 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm`}
                                                            />
                                                            {renderErrorMessage(`debt_interest_rate_${index}`)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )
                }

                {
                    activeMethod === 'gpc' && (
                        <div className="glass-panel p-8 animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">GPC Inputs</h3>
                                    <p className="text-gray-500 text-sm">Guideline Public Company multiples analysis</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!formData.ticker) {
                                            alert("Please enter a ticker first");
                                            return;
                                        }
                                        try {
                                            const res = await fetch(api.url(`/api/peers/${formData.ticker}?sector=${formData.sector}`));
                                            if (!res.ok) throw new Error("Failed to fetch peers");
                                            const peers = await res.json();

                                            // Calculate median multiples
                                            const evRevs = peers.map((p: any) => p.ev_revenue).filter((v: number) => v > 0);
                                            const evEbitdas = peers.map((p: any) => p.ev_ebitda).filter((v: number) => v > 0);

                                            const median = (arr: number[]) => {
                                                if (arr.length === 0) return 0;
                                                const sorted = [...arr].sort((a, b) => a - b);
                                                const mid = Math.floor(sorted.length / 2);
                                                return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                                            };

                                            const medianEvRev = median(evRevs);
                                            const medianEvEbitda = median(evEbitdas);

                                            setFormData(prev => ({
                                                ...prev,
                                                gpc_input: {
                                                    ...prev.gpc_input,
                                                    peer_tickers: peers.map((p: any) => p.ticker),
                                                    ev_revenue_multiple: parseFloat(medianEvRev.toFixed(2)),
                                                    ev_ebitda_multiple: parseFloat(medianEvEbitda.toFixed(2))
                                                }
                                            }));

                                            if (peers.length > 0) {
                                                alert(`Found ${peers.length} peers. Applied median multiples.`);
                                            } else {
                                                alert("No peers found.");
                                            }
                                        } catch (e) {
                                            alert("Error finding peers: " + e);
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium border border-blue-200 dark:border-blue-500/30"
                                >
                                    Find Peers
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">LTM Revenue ($M)</label>
                                    <input
                                        type="number"
                                        value={formData.gpc_input.metrics["LTM Revenue"]}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            gpc_input: {
                                                ...prev.gpc_input,
                                                metrics: { ...prev.gpc_input.metrics, "LTM Revenue": parseFloat(e.target.value) }
                                            }
                                        }))}
                                        className={getInputClassName('gpc_revenue')}
                                    />
                                    {renderErrorMessage('gpc_revenue')}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">LTM EBITDA ($M)</label>
                                    <input
                                        type="number"
                                        value={formData.gpc_input.metrics["LTM EBITDA"]}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            gpc_input: {
                                                ...prev.gpc_input,
                                                metrics: { ...prev.gpc_input.metrics, "LTM EBITDA": parseFloat(e.target.value) }
                                            }
                                        }))}
                                        className={getInputClassName('gpc_ebitda')}
                                    />
                                    {renderErrorMessage('gpc_ebitda')}
                                </div>
                                <div className="mt-4 col-span-1 md:col-span-2 grid grid-cols-2 gap-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                    <h4 className="col-span-2 font-semibold text-gray-800 dark:text-gray-200 text-sm">Applied Multiples (Median)</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">EV / Revenue</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.gpc_input.ev_revenue_multiple || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                gpc_input: {
                                                    ...prev.gpc_input,
                                                    ev_revenue_multiple: parseFloat(e.target.value)
                                                }
                                            }))}
                                            className="w-full px-3 py-2 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm text-gray-900 dark:text-white"
                                            placeholder="Auto-calc"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">EV / EBITDA</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.gpc_input.ev_ebitda_multiple || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                gpc_input: {
                                                    ...prev.gpc_input,
                                                    ev_ebitda_multiple: parseFloat(e.target.value)
                                                }
                                            }))}
                                            className="w-full px-3 py-2 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm text-gray-900 dark:text-white"
                                            placeholder="Auto-calc"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Peer Group</label>
                                        {formData.gpc_input.peer_tickers?.length > 0
                                            ? formData.gpc_input.peer_tickers.join(", ")
                                            : "No peers selected"}
                                    </div>
                                </div>
                            </div>
                        </div>

                    )
                }

                {
                    activeMethod === 'precedent' && (
                        <div className="glass-panel p-8 animate-fade-in-up">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Precedent Transactions</h3>
                            <p className="text-gray-500 text-sm mb-6">Enter comparable M&A transactions</p>

                            <div className="mb-6 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Target Company Metrics</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">LTM Revenue ($M)</label>
                                        <input
                                            type="number"
                                            value={formData.precedent_transactions_input.target_revenue}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                precedent_transactions_input: {
                                                    ...prev.precedent_transactions_input,
                                                    target_revenue: parseFloat(e.target.value)
                                                }
                                            }))}
                                            className={`${getInputClassName('precedent_target_revenue')} bg-white/80 dark:bg-white/5 dark:text-white`}
                                        />
                                        {renderErrorMessage('precedent_target_revenue')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">LTM EBITDA ($M)</label>
                                        <input
                                            type="number"
                                            value={formData.precedent_transactions_input.target_ebitda}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                precedent_transactions_input: {
                                                    ...prev.precedent_transactions_input,
                                                    target_ebitda: parseFloat(e.target.value)
                                                }
                                            }))}
                                            className={`${getInputClassName('precedent_target_ebitda')} bg-white/80 dark:bg-white/5 dark:text-white`}
                                        />
                                        {renderErrorMessage('precedent_target_ebitda')}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-white/30">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-white/50 dark:bg-white/5 border-b border-white/30 dark:border-white/10">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Target</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Acquirer</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Deal Value ($M)</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Revenue ($M)</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">EBITDA ($M)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/30">
                                        {formData.precedent_transactions_input.transactions.map((txn: any, index: number) => (
                                            <tr key={index} className="hover:bg-white/40 dark:hover:bg-white/5">
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        value={txn.target_name}
                                                        onChange={(e) => {
                                                            const newTxns = [...formData.precedent_transactions_input.transactions];
                                                            newTxns[index].target_name = e.target.value;
                                                            setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        value={txn.acquirer_name}
                                                        onChange={(e) => {
                                                            const newTxns = [...formData.precedent_transactions_input.transactions];
                                                            newTxns[index].acquirer_name = e.target.value;
                                                            setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="date"
                                                        value={txn.announcement_date}
                                                        onChange={(e) => {
                                                            const newTxns = [...formData.precedent_transactions_input.transactions];
                                                            newTxns[index].announcement_date = e.target.value;
                                                            setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        value={txn.deal_value}
                                                        onChange={(e) => {
                                                            const newTxns = [...formData.precedent_transactions_input.transactions];
                                                            newTxns[index].deal_value = parseFloat(e.target.value);
                                                            setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        value={txn.revenue}
                                                        onChange={(e) => {
                                                            const newTxns = [...formData.precedent_transactions_input.transactions];
                                                            newTxns[index].revenue = parseFloat(e.target.value);
                                                            setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        value={txn.ebitda}
                                                        onChange={(e) => {
                                                            const newTxns = [...formData.precedent_transactions_input.transactions];
                                                            newTxns[index].ebitda = parseFloat(e.target.value);
                                                            setFormData(prev => ({ ...prev, precedent_transactions_input: { ...prev.precedent_transactions_input, transactions: newTxns } }));
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-system-blue/50 outline-none text-sm dark:text-white"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        precedent_transactions_input: {
                                            ...prev.precedent_transactions_input,
                                            transactions: [
                                                ...prev.precedent_transactions_input.transactions,
                                                {
                                                    target_name: "New Company",
                                                    acquirer_name: "Buyer",
                                                    announcement_date: "2024-01-01",
                                                    deal_value: 100,
                                                    revenue: 50,
                                                    ebitda: 10
                                                }
                                            ]
                                        }
                                    }));
                                }}
                                className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-system-blue dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium border border-blue-100 dark:border-blue-500/20"
                            >
                                + Add Transaction
                            </button>
                        </div >
                    )
                }

                {
                    activeMethod === 'anav' && (
                        <div className="glass-panel p-8 animate-fade-in-up">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Adjusted Net Asset Value (ANAV)</h3>
                            <p className="text-gray-500 text-sm mb-6">Enter book values and fair value adjustments</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-system-green rounded-full"></span>
                                        Assets
                                    </h4>
                                    {Object.entries(formData.anav_input.assets).map(([key, value]) => (
                                        <div key={key} className="mb-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm text-gray-600">{key}</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={value as number}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            anav_input: {
                                                                ...prev.anav_input,
                                                                assets: { ...prev.anav_input.assets, [key]: parseFloat(e.target.value) }
                                                            }
                                                        }))}
                                                        className={`${getInputClassName(`anav_assets_${key}`)} w-24 px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm dark:text-white`}
                                                        placeholder="Book Value"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={formData.anav_input.adjustments[key] || 0}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            anav_input: {
                                                                ...prev.anav_input,
                                                                adjustments: { ...prev.anav_input.adjustments, [key]: parseFloat(e.target.value) }
                                                            }
                                                        }))}
                                                        className="w-24 px-2 py-1.5 rounded-lg border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 text-sm dark:text-white"
                                                        placeholder="Adj (+/-)"
                                                    />
                                                </div>
                                            </div>
                                            {renderErrorMessage(`anav_assets_${key}`)}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-system-red rounded-full"></span>
                                        Liabilities
                                    </h4>
                                    {Object.entries(formData.anav_input.liabilities).map(([key, value]) => (
                                        <div key={key} className="mb-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm text-gray-600">{key}</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={value as number}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            anav_input: {
                                                                ...prev.anav_input,
                                                                liabilities: { ...prev.anav_input.liabilities, [key]: parseFloat(e.target.value) }
                                                            }
                                                        }))}
                                                        className={`${getInputClassName(`anav_liabilities_${key}`)} w-24 px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm dark:text-white`}
                                                        placeholder="Book Value"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={formData.anav_input.adjustments[key] || 0}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            anav_input: {
                                                                ...prev.anav_input,
                                                                adjustments: { ...prev.anav_input.adjustments, [key]: parseFloat(e.target.value) }
                                                            }
                                                        }))}
                                                        className="w-24 px-2 py-1.5 rounded-lg border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 text-sm dark:text-white"
                                                        placeholder="Adj (+/-)"
                                                    />
                                                </div>
                                            </div>
                                            {renderErrorMessage(`anav_liabilities_${key}`)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeMethod === 'weights' && (
                        <div className="glass-panel p-8 animate-fade-in-up">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Valuation Method Weights</h3>
                            <p className="text-gray-500 text-sm mb-6">Assign weights to each valuation method. The total should ideally sum to 1.0 (100%), but the system will normalize it automatically.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(formData.method_weights).map(([method, weight]) => (
                                    <div key={method} className="bg-white/40 dark:bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-700 mb-4 capitalize flex justify-between">
                                            <span>{method.replace('_', ' ').toUpperCase()} Weight</span>
                                            <span className="text-system-blue font-bold">{(Number(weight) * 100).toFixed(0)}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={weight as number}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                method_weights: {
                                                    ...prev.method_weights,
                                                    [method]: parseFloat(e.target.value)
                                                }
                                            }))}
                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-system-blue"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
                {
                    activeMethod === 'lbo' && (
                        <>
                            {!formData.lbo_input ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 glass-panel">
                                    <p>Initializing LBO Module...</p>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            lbo_input: {
                                                solve_for: 'entry_price',
                                                entry_revenue: 100,
                                                entry_ebitda: 20,
                                                entry_ev_ebitda_multiple: 10.0 as number | undefined,
                                                target_irr: 0.20,
                                                financing: {
                                                    tranches: [],
                                                    total_leverage_ratio: 5.0,
                                                    equity_contribution_percent: 0.40
                                                },
                                                assumptions: { transaction_fees_percent: 0.02, synergy_benefits: 0.0 },
                                                revenue_growth_rate: 0.05,
                                                ebitda_margin: 0.25,
                                                capex_percentage: 0.03,
                                                nwc_percentage: 0.05,
                                                tax_rate: 0.25,
                                                holding_period: 5,
                                                exit_ev_ebitda_multiple: 10.0
                                            }
                                        }))}
                                        className="mt-4 px-4 py-2 bg-system-blue text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Initialize LBO Data
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in-up">
                                    <LBOWizard
                                        data={formData.lbo_input}
                                        onChange={(newData) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                lbo_input: newData
                                            }));
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )
                }

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="glass-button-primary px-8 py-3 text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Calculating...' : 'Calculate Valuation'}
                    </button>
                </div>
            </form >

            <WaccCalculator
                isOpen={isWaccModalOpen}
                onClose={() => setIsWaccModalOpen(false)}
                onApply={handleWaccApply}
                initialTicker={formData.ticker}
            />

            <React.Suspense fallback={null}>
                {activeSuggestion && (
                    <ExplanationModal
                        isOpen={explanationModalOpen}
                        onClose={() => setExplanationModalOpen(false)}
                        onApply={() => {
                            const updates: any = {};
                            if (activeSuggestion.field === 'revenue_growth_start') updates.revenue_growth = activeSuggestion.suggestedValue;
                            if (activeSuggestion.field === 'ebitda_margin_start') updates.ebitda_margin = activeSuggestion.suggestedValue;
                            handleApplySuggestions(updates);
                        }}
                        suggestion={activeSuggestion}
                    />
                )}
                <AISettingsModal
                    isOpen={settingsModalOpen}
                    onClose={() => setSettingsModalOpen(false)}
                />
            </React.Suspense>


        </div >
    );
};
