import React from 'react';
import { Shield, ShieldAlert, CheckCircle } from 'lucide-react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface CovenantTrackerProps {
    schedule: any[];
    covenants: any[];
}

export const CovenantTracker: React.FC<CovenantTrackerProps> = ({ schedule, covenants }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (!covenants || covenants.length === 0) return null;

    // Filter schedule to only years relevant to covenants (simplified)
    const data = schedule.map(s => {
        const debtEbitda = s.ebitda > 0 ? s.total_debt_balance / s.ebitda : 0;
        const intCov = s.interest_expense > 0 ? s.ebitda / s.interest_expense : 0;
        return {
            year: `${t('lbo.year')} ${s.year}`,
            debtEbitda: parseFloat(debtEbitda.toFixed(2)),
            intCov: parseFloat(intCov.toFixed(2)),
            covenantStatus: s.covenant_status,
            breaches: s.breaches
        };
    });

    const maxDebtRule = covenants.find((c: any) => c.covenant_type === 'max_debt_ebitda');
    const minIntRule = covenants.find((c: any) => c.covenant_type === 'min_interest_coverage');

    // Chart Colors
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const axisTextColor = isDark ? "#9ca3af" : "#6b7280";
    const tooltipBg = isDark ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)";
    const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6";
    const tooltipText = isDark ? "#f3f4f6" : "#1f2937";

    return (
        <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-300">
                    <Shield size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('lbo.covenant_compliance')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('lbo.covenant_tracking_desc')}</p>
                </div>
            </div>

            <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="year" tick={{ fill: axisTextColor }} />
                        <YAxis yAxisId="left" label={{ value: `${t('lbo.debt_ebitda')} (x)`, angle: -90, position: 'insideLeft', fill: axisTextColor }} tick={{ fill: axisTextColor }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: `${t('lbo.interest_cov')} (x)`, angle: 90, position: 'insideRight', fill: axisTextColor }} tick={{ fill: axisTextColor }} />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const dataPoint = payload[0].payload;
                                    return (
                                        <div
                                            className="p-3 shadow-lg rounded-lg border backdrop-blur-md"
                                            style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }}
                                        >
                                            <p className="font-bold mb-2">{label}</p>
                                            <p className="text-sm text-purple-600 dark:text-purple-400">{t('lbo.debt_ebitda')}: {dataPoint.debtEbitda}x</p>
                                            <p className="text-sm text-green-600 dark:text-green-400">{t('lbo.interest_cov')}: {dataPoint.intCov}x</p>
                                            {dataPoint.breaches && dataPoint.breaches.length > 0 && (
                                                <div className="mt-2 text-xs text-red-500 font-medium border-t border-gray-200 dark:border-white/10 pt-1">
                                                    Breach: {dataPoint.breaches.join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend wrapperStyle={{ color: axisTextColor }} />

                        {/* Debt / EBITDA Line */}
                        <Line yAxisId="left" type="monotone" dataKey="debtEbitda" stroke="#8884d8" name={t('lbo.debt_ebitda')} strokeWidth={2} />
                        {maxDebtRule && (
                            <ReferenceLine yAxisId="left" y={maxDebtRule.limit} stroke="red" strokeDasharray="3 3" label={{ value: t('lbo.max_limit'), fill: "red" }} />
                        )}

                        {/* Interest Coverage Line */}
                        <Line yAxisId="right" type="monotone" dataKey="intCov" stroke="#82ca9d" name={t('lbo.interest_cov')} strokeWidth={2} />
                        {minIntRule && (
                            <ReferenceLine yAxisId="right" y={minIntRule.limit} stroke="orange" strokeDasharray="3 3" label={{ value: t('lbo.min_limit'), fill: "orange" }} />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.some(s => s.covenant_status === 'breached') ? (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                        <ShieldAlert className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">{t('lbo.breach_detected')}</p>
                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                {t('lbo.breach_desc')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                        <CheckCircle className="text-green-500 dark:text-green-400" size={18} />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">{t('lbo.all_compliant')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
