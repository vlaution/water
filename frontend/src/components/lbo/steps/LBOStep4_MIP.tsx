import React from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedFormInput } from '../../common/EnhancedFormInput';
import type { LBOInputState } from '../../../types/lbo';

interface LBOStep4Props {
    data: LBOInputState;
    onChange: (newData: LBOInputState) => void;
}

export const LBOStep4_MIP: React.FC<LBOStep4Props> = ({ data, onChange }) => {
    const { t } = useTranslation();

    const updateField = (field: keyof LBOInputState, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-white/10 pb-2">{t('lbo.step4_title')}</h3>

            <div className="bg-orange-50/50 dark:bg-orange-500/10 p-6 rounded-xl border border-orange-100 dark:border-orange-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <EnhancedFormInput
                            label={t('lbo.option_pool_size')}
                            type="number" step="0.1"
                            value={(data.mip_assumptions?.option_pool_percent || 0.1) * 100}
                            onChange={(e) => {
                                const currentMIP = data.mip_assumptions || { strike_price_discount: 0, vesting_period: 4, cliff_years: 1 };
                                updateField('mip_assumptions', { ...currentMIP, option_pool_percent: parseFloat(e.target.value) / 100 });
                            }}
                            className="dark:bg-black/20"
                        />
                    </div>
                    <div>
                        <EnhancedFormInput
                            label={t('lbo.vesting_period_years')}
                            type="number"
                            value={data.mip_assumptions?.vesting_period || 4}
                            onChange={(e) => {
                                const currentMIP = data.mip_assumptions || { option_pool_percent: 0.1, strike_price_discount: 0, cliff_years: 1 };
                                updateField('mip_assumptions', { ...currentMIP, vesting_period: parseFloat(e.target.value) });
                            }}
                            className="dark:bg-black/20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
