import React, { useState, useEffect } from 'react';
import { SuggestionPanel } from './SuggestionPanel';
import { LBOWizard } from './lbo/LBOWizard';
import { useAuth } from '../context/AuthContext';
import { useValuationForm } from '../hooks/useValuationForm';

// New Sub-Components
import { GPCPanel } from './ManualEntry/GPCPanel';
import { PrecedentTransactionsPanel } from './ManualEntry/PrecedentTransactionsPanel';
import { DCFPanel } from './ManualEntry/DCFPanel';
import { ANAVPanel } from './ManualEntry/ANAVPanel';
import { WeightsPanel } from './ManualEntry/WeightsPanel';
import { ManualEntrySidebar } from './ManualEntry/ManualEntrySidebar';
import { ManualEntryHeader } from './ManualEntry/ManualEntryHeader';

// Lazy load heavy modals if needed (kept from original)
const ExplanationModal = React.lazy(() => import('./common/ExplanationModal').then(module => ({ default: module.ExplanationModal })));
const AISettingsModal = React.lazy(() => import('./common/AISettingsModal').then(module => ({ default: module.AISettingsModal })));

interface ManualEntryFormProps {
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
    errors?: any[];
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSubmit, isLoading }) => {

    // Retrieve any pending ticker from localStorage (set by CommandPalette)
    const [pendingTicker, setPendingTicker] = useState<string | null>(null);
    useEffect(() => {
        const t = localStorage.getItem('pending_valuation_ticker');
        if (t) {
            setPendingTicker(t);
            localStorage.removeItem('pending_valuation_ticker');
        }
    }, []);

    const { token } = useAuth();

    // Use the new Hook for all state management
    const {
        formData,
        setFormData,
        undo,
        redo,
        canUndo,
        canRedo,
        handleFindPeers
    } = useValuationForm(pendingTicker);

    const [activeMethod, setActiveMethod] = useState<'dcf' | 'gpc' | 'fcfe' | 'precedent' | 'lbo' | 'anav' | 'weights'>('dcf');
    const [explanationModalOpen, setExplanationModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    // --- Update Handler Wrappers (to match Panel interfaces) ---

    const handleApplySuggestions = (suggestions: any) => {
        setFormData((prev: any) => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: { ...prev.dcf_input.projections, ...suggestions }
            }
        }));
    };

    const updateProjection = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            dcf_input: {
                ...prev.dcf_input,
                projections: { ...prev.dcf_input.projections, [field]: parseFloat(value) }
            }
        }));
    };

    const updateFCFEProjection = (field: string, value: any) => {
        const val = typeof value === 'string' ? parseFloat(value) : value;
        setFormData((prev: any) => {
            if (field in prev.dcfe_input) {
                return { ...prev, dcfe_input: { ...prev.dcfe_input, [field]: val } };
            }
            return {
                ...prev,
                dcfe_input: {
                    ...prev.dcfe_input,
                    projections: { ...prev.dcfe_input.projections, [field]: val }
                }
            };
        });
    };

    const updateDebtSchedule = (index: number, field: string, value: string) => {
        setFormData((prev: any) => ({
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

            <ManualEntryHeader
                companyName={formData.company_name}
                isLoading={isLoading}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onSubmit={() => onSubmit(formData)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar */}
                <ManualEntrySidebar
                    formData={formData}
                    setFormData={setFormData}
                    activeMethod={activeMethod}
                    setActiveMethod={setActiveMethod}
                    token={token}
                />

                {/* Right Content Area */}
                <div className="lg:col-span-3 min-h-[600px]">

                    {/* Suggestion Panel */}
                    <SuggestionPanel
                        companyData={formData}
                        currentAssumptions={{ ...formData.dcf_input.projections }}
                        onApplySuggestions={handleApplySuggestions}
                    />

                    <div className="mt-6">
                        {activeMethod === 'dcf' && (
                            <DCFPanel
                                mode="dcf"
                                data={formData.dcf_input}
                                onChange={(field, value) => {
                                    setFormData((prev: any) => ({ ...prev, dcf_input: { ...prev.dcf_input, [field]: value } }));
                                }}
                                onUpdateProjection={updateProjection}
                                onUpdateDebts={() => { }}
                            />
                        )}

                        {activeMethod === 'gpc' && (
                            <GPCPanel
                                data={formData.gpc_input}
                                onChange={(newData) => setFormData((prev: any) => ({ ...prev, gpc_input: newData }))}
                                onFindPeers={(ticker) => handleFindPeers(ticker, token || '')}
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
                                onChange={(newData) => setFormData((prev: any) => ({ ...prev, precedent_transactions_input: newData }))}
                            />
                        )}

                        {activeMethod === 'lbo' && (
                            <div className="animate-fade-in-up">
                                <LBOWizard
                                    data={formData.lbo_input}
                                    onChange={(newData) => setFormData((prev: any) => ({ ...prev, lbo_input: newData }))}
                                />
                            </div>
                        )}

                        {activeMethod === 'anav' && (
                            <ANAVPanel
                                data={formData.anav_input}
                                onChange={(newData) => setFormData((prev: any) => ({ ...prev, anav_input: newData }))}
                            />
                        )}

                        {activeMethod === 'weights' && (
                            <WeightsPanel
                                weights={formData.method_weights}
                                onChange={(method: string, weight: number) => {
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        method_weights: { ...prev.method_weights, [method]: weight }
                                    }));
                                }}
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
                        onApply={() => { }}
                        suggestion={{
                            field: 'ebitda_margin',
                            currentValue: 0.20,
                            suggestedValue: 0.25,
                            reasoning: 'Market benchmarks suggest higher efficiency.',
                            impact: 'Significant upside to enterprise value.',
                            confidence: 0.85,
                            source: 'Industry Peers'
                        } as any}
                    />
                )}
                {settingsModalOpen && (
                    <AISettingsModal
                        isOpen={settingsModalOpen}
                        onClose={() => setSettingsModalOpen(false)}
                    />
                )}
            </React.Suspense>
        </div>
    );
};
