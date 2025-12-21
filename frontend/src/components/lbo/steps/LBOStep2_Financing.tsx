import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedFormInput } from '../../common/EnhancedFormInput';
import { MarketRateInput } from '../../common/MarketRateInput';
import { History, Zap, RefreshCw, BarChart2, TrendingUp, Plus, Trash2 } from 'lucide-react';
import type { LBOInputState, DebtTranche } from '../../../types/lbo';
import type { MarketSnapshot, MarketRates } from '../../../services/MarketDataService';
import { api } from '../../../config/api';

interface LBOStep2Props {
    data: LBOInputState;
    onChange: (newData: LBOInputState) => void;
    // Market Data Props
    isHistoricalMode: boolean;
    toggleHistoricalMode: () => void;
    snapshots: MarketSnapshot[];
    selectedSnapshotId: string;
    onSnapshotSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;

    // Actions
    fetchMarketRates: () => Promise<void>;
    isFetchingMarketData: boolean;
    fetchMarketLevMultiples: () => Promise<void>;
    fetchAdvisory: () => Promise<void>;
    isFetchingAdvice: boolean;
    advisoryData: any;
    setAdvisoryData: (data: any) => void;
    applyAdvisory: (advice: any) => void;

    // Derived
    marketRates: MarketRates | null;
}

export const LBOStep2_Financing: React.FC<LBOStep2Props> = ({
    data, onChange,
    isHistoricalMode, toggleHistoricalMode, snapshots, selectedSnapshotId, onSnapshotSelect,
    fetchMarketRates, isFetchingMarketData, fetchMarketLevMultiples,
    fetchAdvisory, isFetchingAdvice, advisoryData, setAdvisoryData, applyAdvisory,
    marketRates
}) => {
    const { t } = useTranslation();
    // Local State for Refi Optimizer UI
    const [showRefiOptimizer, setShowRefiOptimizer] = useState(false);
    const [refiParams, setRefiParams] = useState({ newRate: 0.06, costPercent: 0.01 });
    const [refiResult, setRefiResult] = useState<any>(null);

    const updateField = (field: keyof LBOInputState, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const addTranche = () => {
        const newTranche: DebtTranche = {
            name: "New Tranche",
            amount: undefined,
            leverage_multiple: 1.0,
            interest_rate: 0.08,
            cash_interest: true,
            amortization_rate: 0.0,
            maturity: 5,
            mandatory_cash_sweep_priority: data.financing.tranches.length + 1
        };
        onChange({
            ...data,
            financing: { ...data.financing, tranches: [...data.financing.tranches, newTranche] }
        });
    };

    const updateTranche = (index: number, field: string, value: any) => {
        const newTranches = [...data.financing.tranches];
        newTranches[index] = { ...newTranches[index], [field]: value };
        onChange({
            ...data,
            financing: { ...data.financing, tranches: newTranches }
        });
    };

    const removeTranche = (index: number) => {
        const newTranches = data.financing.tranches.filter((_, i) => i !== index);
        onChange({
            ...data,
            financing: { ...data.financing, tranches: newTranches }
        });
    };

    const calculateRefi = async () => {
        const totalDebt = data.financing.tranches.reduce((sum, t) => sum + (t.amount || (t.leverage_multiple || 0) * data.entry_ebitda), 0);
        if (totalDebt === 0) return;

        const weightedRate = data.financing.tranches.reduce((sum, t) => sum + ((t.amount || (t.leverage_multiple || 0) * data.entry_ebitda) * t.interest_rate), 0) / totalDebt;

        try {
            // In real app, token handle via context or interceptor.
            // We'll mock the response check for now or assume api helper handles headers if updated
            const res = await fetch(api.url('/api/analytics/refinancing/analyze'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_debt_amount: totalDebt,
                    current_interest_rate: weightedRate,
                    new_interest_rate: refiParams.newRate,
                    remaining_term_years: 5,
                    refinancing_cost_percent: refiParams.costPercent,
                    tax_rate: data.tax_rate || 0.25,
                    discount_rate: 0.10
                })
            });
            if (res.ok) {
                setRefiResult(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('lbo.step2_title')}</h3>
                <div className="flex gap-2 items-center">
                    {isHistoricalMode ? (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <select
                                value={selectedSnapshotId}
                                onChange={onSnapshotSelect}
                                className="text-sm border-gray-300 dark:border-white/20 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 bg-white dark:bg-white/10 dark:text-gray-200"
                            >
                                <option value="">{t('lbo.select_date')}</option>
                                {snapshots.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {new Date(s.date).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={toggleHistoricalMode}
                                className="text-xs text-gray-500 hover:text-gray-700 underline dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {t('lbo.switch_to_live')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={toggleHistoricalMode}
                                className="text-sm text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-white/10 px-2 py-1 rounded-lg transition-all"
                                title="Use historical market data"
                            >
                                <History size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={fetchMarketRates}
                                disabled={isFetchingMarketData}
                                className="text-sm bg-purple-500/10 text-purple-600 dark:text-purple-300 font-medium flex items-center gap-1 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20 transition-all"
                                title="Fetch live interest rates from FRED"
                            >
                                {isFetchingMarketData ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                {t('lbo.live_rates')}
                            </button>
                        </>
                    )}

                    {data.sector && !isHistoricalMode && (
                        <button
                            type="button"
                            onClick={fetchMarketLevMultiples}
                            disabled={isFetchingMarketData}
                            className="text-sm bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-medium flex items-center gap-1 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                            title={`Fetch typical leverage for ${data.sector}`}
                        >
                            <BarChart2 size={14} />
                            {t('lbo.sector_leverage')}
                        </button>
                    )}

                    {data.sector && !isHistoricalMode && (
                        <button
                            type="button"
                            onClick={fetchAdvisory}
                            disabled={isFetchingAdvice}
                            className="text-sm bg-blue-500/10 text-blue-600 dark:text-blue-300 font-medium flex items-center gap-1 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all"
                            title="Get AI Debt Structure Recommendation"
                        >
                            {isFetchingAdvice ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                            {t('lbo.ai_advice')}
                        </button>
                    )}

                    <button type="button" onClick={addTranche} className="text-sm bg-system-blue text-white font-medium flex items-center gap-1 hover:bg-blue-600 px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all">
                        <Plus size={16} /> {t('lbo.add_tranche')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowRefiOptimizer(true)}
                        className="text-sm bg-green-500/10 text-green-600 dark:text-green-400 font-medium flex items-center gap-1 hover:bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/20 transition-all"
                    >
                        <TrendingUp size={14} />
                        {t('lbo.refi_optimizer')}
                    </button>
                </div>
            </div>

            {showRefiOptimizer && (
                <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-xl border border-green-100 dark:border-green-500/20 mb-6 animate-fade-in relative shadow-sm">
                    <button
                        onClick={() => setShowRefiOptimizer(false)}
                        className="absolute top-4 right-4 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                    >
                        <Trash2 size={16} />
                    </button>
                    <h4 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} />
                        {t('lbo.refinancing_optimizer_title')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">{t('lbo.current_wa_rate')}</label>
                                <div className="text-xl font-bold text-green-900 dark:text-green-100">
                                    {(() => {
                                        const totalDebt = data.financing.tranches.reduce((sum, t) => sum + (t.amount || (t.leverage_multiple || 0) * data.entry_ebitda), 0);
                                        if (totalDebt === 0) return "0.0%";
                                        const weightedRate = data.financing.tranches.reduce((sum, t) => sum + ((t.amount || (t.leverage_multiple || 0) * data.entry_ebitda) * t.interest_rate), 0) / totalDebt;
                                        return (weightedRate * 100).toFixed(2) + "%";
                                    })()}
                                </div>
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label={`${t('lbo.new_interest_rate_percent')} (%)`}
                                    type="number"
                                    value={refiParams.newRate * 100}
                                    onChange={(e) => setRefiParams(p => ({ ...p, newRate: parseFloat(e.target.value) / 100 }))}
                                    step="0.1"
                                    className="bg-white dark:bg-black/20"
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label={`${t('lbo.refinancing_cost_percent')} (%)`}
                                    type="number"
                                    value={refiParams.costPercent * 100}
                                    onChange={(e) => setRefiParams(p => ({ ...p, costPercent: parseFloat(e.target.value) / 100 }))}
                                    step="0.1"
                                    className="bg-white dark:bg-black/20"
                                />
                            </div>
                            <button
                                onClick={calculateRefi}
                                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                            >
                                {t('lbo.analyze_savings')}
                            </button>
                        </div>

                        {refiResult ? (
                            <div className="col-span-2 bg-white/60 dark:bg-white/5 p-4 rounded-xl border border-green-200 dark:border-green-500/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm text-green-800 dark:text-green-300 font-medium">{t('lbo.recommendation')}</div>
                                        <div className={`text-xl font-bold ${refiResult.net_present_value > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {refiResult.recommendation}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-green-800 dark:text-green-300 font-medium">{t('lbo.npv')}</div>
                                        <div className={`text-xl font-bold ${refiResult.net_present_value > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            ${refiResult.net_present_value.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200 dark:border-green-900/50">
                                    <div>
                                        <div className="text-xs text-green-700 dark:text-green-400">{t('lbo.annual_savings_after_tax')}</div>
                                        <div className="font-semibold text-green-900 dark:text-green-100">${refiResult.annual_interest_savings.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-700 dark:text-green-400">{t('lbo.upfront_cost')}</div>
                                        <div className="font-semibold text-green-900 dark:text-green-100">${refiResult.upfront_cost.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-700 dark:text-green-400">{t('lbo.break_even')}</div>
                                        <div className="font-semibold text-green-900 dark:text-green-100">{refiResult.break_even_years} {t('lbo.years')}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="col-span-2 flex items-center justify-center text-green-700/50 dark:text-green-400/50 text-sm italic border-2 border-dashed border-green-200 dark:border-green-500/20 rounded-xl">
                                {t('lbo.enter_params_analyze')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {advisoryData && (
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 mb-6 animate-fade-in shadow-sm relative">
                    <button onClick={() => setAdvisoryData(null)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors"> <Trash2 size={14} /> </button>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{t('lbo.ai_recommendation_available')}</p>
                    <button onClick={() => applyAdvisory(advisoryData)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg mt-2 font-medium hover:bg-blue-700 transition-colors shadow-sm">{t('lbo.apply')}</button>
                </div>
            )}

            <div className="space-y-4">
                {data.financing.tranches.map((tranche, index) => (
                    <div key={index} className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 relative group hover:shadow-sm transition-all">
                        <button type="button" onClick={() => removeTranche(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1 md:col-span-3">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t('lbo.tranche_name')}</label>
                                <input
                                    className="glass-input w-full md:w-1/2"
                                    value={tranche.name}
                                    onChange={(e) => updateTranche(index, 'name', e.target.value)}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label={`${t('lbo.leverage_x_ebitda')} (x)`}
                                    type="number"
                                    step="0.1"
                                    value={tranche.leverage_multiple}
                                    onChange={(e) => updateTranche(index, 'leverage_multiple', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                {(() => {
                                    let applicableRate = undefined;
                                    const tName = tranche.name.toLowerCase();
                                    if (marketRates) {
                                        if (tName.includes('senior') || tranche.mandatory_cash_sweep_priority === 1) {
                                            applicableRate = marketRates.senior_debt_rate;
                                        } else if (tName.includes('mezz') || tName.includes('junior')) {
                                            applicableRate = marketRates.mezzanine_debt_rate;
                                        } else if (tName.includes('preferred')) {
                                            applicableRate = marketRates.preferred_equity_rate;
                                        }
                                    }

                                    return (
                                        <MarketRateInput
                                            label={`${t('lbo.interest_rate_percent')} (%)`}
                                            value={tranche.interest_rate * 100}
                                            onChange={(val) => updateTranche(index, 'interest_rate', val / 100)}
                                            marketRate={applicableRate ? applicableRate * 100 : undefined}
                                            autoUpdate={tranche.auto_update_rate || false}
                                            onAutoUpdateChange={(auto) => {
                                                if (auto && applicableRate !== undefined) {
                                                    const newTranches = [...data.financing.tranches];
                                                    newTranches[index] = {
                                                        ...newTranches[index],
                                                        interest_rate: applicableRate,
                                                        auto_update_rate: true
                                                    };
                                                    onChange({
                                                        ...data,
                                                        financing: { ...data.financing, tranches: newTranches }
                                                    });
                                                } else {
                                                    updateTranche(index, 'auto_update_rate', auto);
                                                }
                                            }}
                                            step={0.1}
                                        />
                                    );
                                })()}
                            </div>
                            <div className="flex items-center pt-8">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={tranche.cash_interest}
                                        onChange={(e) => updateTranche(index, 'cash_interest', e.target.checked)}
                                        className="rounded text-system-blue focus:ring-system-blue"
                                    />
                                    {t('lbo.cash_interest_vs_pik')}
                                </label>
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label={`${t('lbo.amortization_percent_yr')} (%)`}
                                    type="number"
                                    step="0.5"
                                    value={tranche.amortization_rate * 100}
                                    onChange={(e) => updateTranche(index, 'amortization_rate', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('lbo.sweep_priority')}</label>
                                <input
                                    type="number"
                                    className="glass-input w-full"
                                    value={tranche.mandatory_cash_sweep_priority}
                                    onChange={(e) => updateTranche(index, 'mandatory_cash_sweep_priority', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {data.financing.tranches.length === 0 && (
                    <div className="text-center p-8 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/10">
                        <p className="text-gray-500 dark:text-gray-400">{t('lbo.no_tranches_defined')}</p>
                    </div>
                )}

                {/* REFINANCING SECTION */}
                <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">{t('lbo.refinancing_strategy')}</h4>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => updateField('solve_for', data.solve_for === 'optimal_refinancing' ? 'entry_price' : 'optimal_refinancing')}
                                className={`text-xs px-2 py-1 rounded border transition-all ${data.solve_for === 'optimal_refinancing' ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold' : 'border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 font-medium'}`}
                                title={t('lbo.auto_optimize_timing')}
                            >
                                {data.solve_for === 'optimal_refinancing' ? t('lbo.optimization_active') : t('lbo.auto_optimize_timing')}
                            </button>
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-system-blue transition-all">
                                <input
                                    type="checkbox"
                                    checked={data.refinancing_config?.enabled || false}
                                    onChange={(e) => updateField('refinancing_config', e.target.checked ? {
                                        enabled: true,
                                        refinance_year: 3,
                                        new_interest_rate: 0.06,
                                        refinance_amount_pct: 1.0,
                                        penalty_fee_percent: 0.01
                                    } : { ...data.refinancing_config, enabled: false })}
                                    className="rounded text-system-blue focus:ring-system-blue"
                                />
                                {t('lbo.enable_refinancing')}
                            </label>
                        </div>
                    </div>

                    {data.refinancing_config?.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-xl border border-blue-100 dark:border-white/10 shadow-inner">
                            <div>
                                <EnhancedFormInput
                                    label={t('lbo.refinance_year')}
                                    type="number"
                                    value={data.refinancing_config.refinance_year}
                                    onChange={(e) => updateField('refinancing_config', { ...data.refinancing_config, refinance_year: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <EnhancedFormInput
                                    label={t('lbo.new_interest_rate_percent')}
                                    type="number" step="0.1"
                                    value={data.refinancing_config.new_interest_rate * 100}
                                    onChange={(e) => updateField('refinancing_config', { ...data.refinancing_config, new_interest_rate: parseFloat(e.target.value) / 100 })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
