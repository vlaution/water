
import React from 'react';
import { TrendingUp, DollarSign, Percent, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReturnsAnalysisProps {
    data: {
        moic: number;
        irr: number;
        entry_equity: number;
        exit_equity: number;
        profit: number;
        gp_carry?: number;
        lp_profit?: number;
        lp_moic?: number;
        // Detailed Waterfall
        dist_capital?: number;
        dist_pref?: number;
        gp_catchup?: number;
        dist_carry?: number;
        hurdle_rate?: number;
    };
}

export const ReturnsAnalysisTable: React.FC<ReturnsAnalysisProps> = ({ data }) => {
    const { t } = useTranslation();

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: "compact" }).format(val);

    const formatPercent = (val: number) =>
        (val * 100).toFixed(1) + '%';

    return (
        <div className="bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('lbo.returns')}</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('lbo.moic')}</div>
                    <div className="text-2xl font-bold text-system-blue dark:text-blue-400 flex items-center gap-1">
                        {data.moic.toFixed(2)}x
                        <TrendingUp size={16} />
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('lbo.irr')}</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                        {formatPercent(data.irr)}
                        <Percent size={16} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('lbo.invested_capital')}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(data.entry_equity)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <PieChart size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('lbo.exit_equity')}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(data.exit_equity)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-white/5 rounded-lg border-t-2 border-green-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <TrendingUp size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('lbo.net_profit')}</span>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400">+{formatCurrency(data.profit)}</span>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('lbo.waterfall')}</h4>

                    {(data.dist_pref !== undefined && data.gp_catchup !== undefined) && (
                        <div className="space-y-2 mb-3 pb-3 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 p-2 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">1. {t('lbo.return_of_capital')}</span>
                                <span className="text-xs font-medium dark:text-gray-300">{formatCurrency(data.dist_capital || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">2. {t('lbo.pref_return')} ({(data.hurdle_rate || 0.08) * 100}%)</span>
                                <span className="text-xs font-medium dark:text-gray-300">{formatCurrency(data.dist_pref || 0)}</span>
                            </div>
                            {(data.gp_catchup || 0) > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">3. {t('lbo.gp_catchup')}</span>
                                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{formatCurrency(data.gp_catchup || 0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">4. {t('lbo.carried_interest')}</span>
                                <span className="text-xs font-medium dark:text-gray-300">{formatCurrency(data.dist_carry || 0)}</span>
                            </div>
                        </div>
                    )}

                    {/* GP Carry Total */}
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('lbo.total_gp_carry')}</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(data.gp_carry || 0)}</span>
                    </div>
                    {/* LP Profit */}
                    <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('lbo.net_lp_profit')}</span>
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-300">{formatCurrency(data.lp_profit || 0)}</span>
                    </div>
                    {/* LP MOIC */}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('lbo.net_lp_moic')}</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{data.lp_moic ? data.lp_moic.toFixed(2) : '0.00'}x</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
