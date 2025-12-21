import React from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedFormInput } from '../../common/EnhancedFormInput';
import type { LBOInputState } from '../../../types/lbo';

interface LBOStep5Props {
    data: LBOInputState;
    onChange: (newData: LBOInputState) => void;
}

export const LBOStep5_Exit: React.FC<LBOStep5Props> = ({ data, onChange }) => {
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-white/10 pb-2">{t('lbo.step5_title')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <EnhancedFormInput
                        label={t('lbo.revenue_growth_rate')}
                        type="number"
                        step="0.1"
                        value={data.revenue_growth_rate * 100}
                        onChange={(e) => updateField('revenue_growth_rate', parseFloat(e.target.value) / 100)}
                    />
                </div>
                <div>
                    <EnhancedFormInput
                        label={t('lbo.ebitda_margin')}
                        type="number"
                        step="0.1"
                        value={data.ebitda_margin * 100}
                        onChange={(e) => updateField('ebitda_margin', parseFloat(e.target.value) / 100)}
                    />
                </div>
                <div>
                    <EnhancedFormInput
                        label={t('lbo.capex_percent_rev')}
                        type="number"
                        step="0.1"
                        value={data.capex_percentage * 100}
                        onChange={(e) => updateField('capex_percentage', parseFloat(e.target.value) / 100)}
                    />
                </div>
                <div>
                    <EnhancedFormInput
                        label={t('lbo.nwc_percent_rev')}
                        type="number"
                        step="0.1"
                        value={data.nwc_percentage * 100}
                        onChange={(e) => updateField('nwc_percentage', parseFloat(e.target.value) / 100)}
                    />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-white/10">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('lbo.exit_assumptions')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <EnhancedFormInput
                                label={t('lbo.holding_period_years')}
                                type="number"
                                value={data.holding_period}
                                onChange={(e) => updateField('holding_period', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <EnhancedFormInput
                                label={t('lbo.exit_multiple_x_ebitda')}
                                type="number"
                                step="0.1"
                                value={data.exit_ev_ebitda_multiple}
                                onChange={(e) => updateField('exit_ev_ebitda_multiple', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-white/10">
                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('lbo.waterfall')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <EnhancedFormInput
                                        label={`${t('lbo.hurdle_rate_percent')} (%)`}
                                        type="number" step="0.5"
                                        value={(data.assumptions.hurdle_rate || 0.08) * 100}
                                        onChange={(e) => updateAssumption('hurdle_rate', parseFloat(e.target.value) / 100)}
                                    />
                                </div>
                                <div>
                                    <EnhancedFormInput
                                        label={`${t('lbo.carry_percent')} (%)`}
                                        type="number" step="1"
                                        value={(data.assumptions.carry_percent || 0.20) * 100}
                                        onChange={(e) => updateAssumption('carry_percent', parseFloat(e.target.value) / 100)}
                                    />
                                </div>
                                <div className="flex items-center pt-8">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={data.assumptions.catchup_active !== false} // Default true
                                            onChange={(e) => onChange({ ...data, assumptions: { ...data.assumptions, catchup_active: e.target.checked } })}
                                            className="rounded text-system-blue focus:ring-system-blue"
                                        />
                                        {t('lbo.gp_catchup_active')}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
