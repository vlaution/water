import React from 'react';
import { useTranslation } from 'react-i18next';

interface SourcesUsesTableProps {
    sources: Record<string, number>;
    uses: Record<string, number>;
}

export const SourcesUsesTable: React.FC<SourcesUsesTableProps> = ({ sources, uses }) => {
    const { t } = useTranslation();

    // Calculate totals
    const totalSources = Object.values(sources).reduce((a, b) => a + b, 0);
    const totalUses = Object.values(uses).reduce((a, b) => a + b, 0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: "compact" }).format(val);

    return (
        <div className="bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('lbo.sources_uses')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sources Column */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200 dark:border-white/10">{t('lbo.sources')}</h4>
                    <div className="space-y-3">
                        {Object.entries(sources).map(([name, value]) => (
                            <div key={name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 dark:text-gray-300">{name}</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between items-center font-bold text-gray-900 dark:text-gray-100">
                            <span>{t('lbo.total_sources')}</span>
                            <span>{formatCurrency(totalSources)}</span>
                        </div>
                    </div>
                </div>

                {/* Uses Column */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200 dark:border-white/10">{t('lbo.uses')}</h4>
                    <div className="space-y-3">
                        {Object.entries(uses).map(([name, value]) => (
                            <div key={name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 dark:text-gray-300">{name}</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between items-center font-bold text-gray-900 dark:text-gray-100">
                            <span>{t('lbo.total_uses')}</span>
                            <span>{formatCurrency(totalUses)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
