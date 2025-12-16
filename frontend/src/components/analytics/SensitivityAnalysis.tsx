import React, { useState } from 'react';
import { AnalyticsService, type SensitivityResult } from '../../services/AnalyticsService';
import { SensitivityTable } from './SensitivityTable';
import { RefreshCw, Play } from 'lucide-react';

interface SensitivityAnalysisProps {
    lboData: any; // The full LBO Model State
}

export const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({ lboData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SensitivityResult | null>(null);

    // Config State
    const [rowVar, setRowVar] = useState("exit_ev_ebitda_multiple");
    const [colVar, setColVar] = useState("entry_ev_ebitda_multiple");

    const runAnalysis = async () => {
        setIsLoading(true);
        try {
            // Determine Ranges automatically initially (simplification)
            // Center around current value
            // Ideally we allow user to configure range, but for MVP: +/- 2 steps

            const getRange = (variable: string) => {
                let base = 0;
                let step = 0;

                // Extract base value logic mirroring backend or frontend state
                // Simplified lookup
                if (variable === "exit_ev_ebitda_multiple") {
                    base = lboData.exit_ev_ebitda_multiple || 10;
                    step = 0.5;
                } else if (variable === "entry_ev_ebitda_multiple") {
                    base = lboData.entry_ev_ebitda_multiple || 10;
                    step = 0.5;
                } else if (variable === "revenue_growth_rate") {
                    base = lboData.revenue_growth_rate || 0.05;
                    step = 0.01;
                } else if (variable === "financing.tranches.0.leverage_multiple") {
                    // Tricky handling nested, maybe assume Senior Debt is first
                    base = lboData.financing.tranches[0].leverage_multiple || 4.0;
                    step = 0.5;
                }

                return [base - step * 2, base - step, base, base + step, base + step * 2].map(n => Number(n.toFixed(3)));
            };

            const getLabel = (v: string) => {
                const map: any = {
                    "exit_ev_ebitda_multiple": "Exit Multiple",
                    "entry_ev_ebitda_multiple": "Entry Multiple",
                    "revenue_growth_rate": "Revenue Growth",
                    "financing.tranches.0.leverage_multiple": "Senior Leverage"
                };
                return map[v] || v;
            };

            const req = {
                lbo_input: lboData,
                row_config: { variable: rowVar, label: getLabel(rowVar), range: getRange(rowVar) },
                col_config: { variable: colVar, label: getLabel(colVar), range: getRange(colVar) },
                output_metric: "irr" as any
            };

            const data = await AnalyticsService.runSensitivityAnalysis(req);
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Row Variable (Y-Axis)</label>
                        <select
                            value={rowVar}
                            onChange={(e) => setRowVar(e.target.value)}
                            className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        >
                            <option value="exit_ev_ebitda_multiple">Exit Multiple</option>
                            <option value="entry_ev_ebitda_multiple">Entry Multiple</option>
                            <option value="revenue_growth_rate">Revenue Growth</option>
                            <option value="financing.tranches.0.leverage_multiple">Senior Leverage</option>
                        </select>
                    </div>

                    <div className="pb-2 text-gray-400 font-bold">vs</div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Column Variable (X-Axis)</label>
                        <select
                            value={colVar}
                            onChange={(e) => setColVar(e.target.value)}
                            className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        >
                            <option value="entry_ev_ebitda_multiple">Entry Multiple</option>
                            <option value="exit_ev_ebitda_multiple">Exit Multiple</option>
                            <option value="revenue_growth_rate">Revenue Growth</option>
                            <option value="financing.tranches.0.leverage_multiple">Senior Leverage</option>
                        </select>
                    </div>

                    <button
                        onClick={runAnalysis}
                        disabled={isLoading}
                        className="bg-system-blue hover:bg-blue-600 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                        {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                        Run Sensitivity
                    </button>
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm animate-fade-in">
                    <SensitivityTable data={result} />
                </div>
            )}
        </div>
    );
};
