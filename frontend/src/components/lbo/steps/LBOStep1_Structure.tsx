import React from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedFormInput } from '../../common/EnhancedFormInput';
import { SectorMultiplesHeatmap } from '../../common/SectorMultiplesHeatmap';
import type { LBOInputState, BenchmarkData } from '../../../types/lbo';
import type { MarketScenarios } from '../../../services/MarketDataService';

interface LBOStep1Props {
    data: LBOInputState;
    onChange: (newData: LBOInputState) => void;
    benchmarks: BenchmarkData | null;
    scenarios: MarketScenarios | null;
    selectedScenario: string;
    onSelectScenario: (key: string, scenario: any) => void;
    onSelectSector: (sector: string) => void;
}

export const LBOStep1_Structure: React.FC<LBOStep1Props> = ({
    data, onChange, benchmarks, scenarios, selectedScenario, onSelectScenario, onSelectSector
}) => {
    const { t } = useTranslation();

    const updateField = (field: keyof LBOInputState, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const updateAssumption = (field: string, value: number) => {
        onChange({
            ...data,
            assumptions: { ...data.assumptions, [field]: value }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('lbo.step1_title')}</h3>
                <div className="flex items-center gap-4">
                    {scenarios && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('lbo.market_scenario')}:</span>
                            <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                                {Object.keys(scenarios).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => onSelectScenario(key, scenarios[key])}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selectedScenario === key
                                            ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-300 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                        title={scenarios[key].description}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('lbo.quick_start')}:</span>
                        <select
                            className="text-sm border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 bg-white dark:bg-white/10 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) => {
                                const type = e.target.value;
                                if (!type) return;

                                // Template Logic (Could be extracted to helper, but fine here for now)
                                const base = { ...data };
                                if (type === 'aggressive') {
                                    base.revenue_growth_rate = 0.10;
                                    base.ebitda_margin = 0.30;
                                    base.exit_ev_ebitda_multiple = 12.0;
                                    if (base.financing.tranches.length > 0) base.financing.tranches[0].leverage_multiple = 6.0;
                                } else if (type === 'conservative') {
                                    base.revenue_growth_rate = 0.03;
                                    base.ebitda_margin = 0.20;
                                    base.exit_ev_ebitda_multiple = 8.0;
                                    if (base.financing.tranches.length > 0) base.financing.tranches[0].leverage_multiple = 3.5;
                                } else if (type === 'distressed') {
                                    base.revenue_growth_rate = -0.05;
                                    base.ebitda_margin = 0.10;
                                    base.exit_ev_ebitda_multiple = 6.0;
                                    if (base.financing.tranches.length > 0) base.financing.tranches[0].leverage_multiple = 2.5;
                                } else { // Standard
                                    base.revenue_growth_rate = 0.05;
                                    base.ebitda_margin = 0.25;
                                    base.exit_ev_ebitda_multiple = 10.0;
                                    if (base.financing.tranches.length > 0) base.financing.tranches[0].leverage_multiple = 4.5;
                                }
                                onChange(base);
                            }}
                        >
                            <option value="">{t('lbo.select_template')}</option>
                            <option value="standard">{t('lbo.standard_lbo')}</option>
                            <option value="aggressive">{t('lbo.aggressive_growth')}</option>
                            <option value="conservative">{t('lbo.conservative_downside')}</option>
                            <option value="distressed">{t('lbo.distressed_turnaround')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Benchmarks Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <SectorMultiplesHeatmap
                        currentSector={data.sector}
                        onSelectSector={(sector) => {
                            updateField('sector', sector);
                            onSelectSector(sector);
                        }}
                    />
                    {benchmarks && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-sm border border-blue-100 dark:border-blue-500/20 grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('lbo.avg_ev_ebitda')}</div>
                                <div className="font-bold text-blue-700 dark:text-blue-300">{benchmarks.ev_ebitda.mean.toFixed(1)}x</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('lbo.max_leverage')}</div>
                                <div className="font-bold text-blue-700 dark:text-blue-300">{benchmarks.leverage.max.toFixed(1)}x</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('lbo.success_rate')}</div>
                                <div className="font-bold text-blue-700 dark:text-blue-300">{(benchmarks.success_rate * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Inputs continued */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('lbo.solve_for')}</label>
                        <select
                            value={data.solve_for}
                            onChange={(e) => updateField('solve_for', e.target.value)}
                            className="glass-input w-full"
                        >
                            <option value="entry_price">{t('lbo.solve_for_entry_price')}</option>
                            <option value="target_irr">{t('lbo.solve_for_target_irr')}</option>
                        </select>
                    </div>

                    {data.solve_for === 'target_irr' && (
                        <div>
                            <EnhancedFormInput
                                label={`${t('lbo.entry_ev_ebitda_multiple')} (x)`}
                                type="number"
                                value={data.entry_ev_ebitda_multiple}
                                onChange={(e) => updateField('entry_ev_ebitda_multiple', parseFloat(e.target.value))}
                                step="0.1"
                            />
                        </div>
                    )}

                    {data.solve_for === 'entry_price' && (
                        <div>
                            <EnhancedFormInput
                                label={`${t('lbo.target_irr_percent')} (%)`}
                                type="number"
                                value={data.target_irr ? data.target_irr * 100 : 20}
                                onChange={(e) => updateField('target_irr', parseFloat(e.target.value) / 100)}
                                step="0.1"
                            />
                        </div>
                    )}

                    <div>
                        <EnhancedFormInput
                            label={`${t('lbo.ltm_revenue')} ($M)`}
                            type="number"
                            value={data.entry_revenue}
                            onChange={(e) => updateField('entry_revenue', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <EnhancedFormInput
                            label={`${t('lbo.ltm_ebitda')} ($M)`}
                            type="number"
                            value={data.entry_ebitda}
                            onChange={(e) => updateField('entry_ebitda', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <EnhancedFormInput
                            label={`${t('lbo.transaction_fees_percent')} (%)`}
                            type="number"
                            value={data.assumptions.transaction_fees_percent * 100}
                            onChange={(e) => updateAssumption('transaction_fees_percent', parseFloat(e.target.value) / 100)}
                            step="0.1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
