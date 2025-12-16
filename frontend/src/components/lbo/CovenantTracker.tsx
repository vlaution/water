
import React from 'react';
import { Shield, ShieldAlert, CheckCircle } from 'lucide-react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CovenantTrackerProps {
    schedule: any[];
    covenants: any[];
}

export const CovenantTracker: React.FC<CovenantTrackerProps> = ({ schedule, covenants }) => {
    if (!covenants || covenants.length === 0) return null;

    // Filter schedule to only years relevant to covenants (simplified)
    const data = schedule.map(s => {
        const debtEbitda = s.ebitda > 0 ? s.total_debt_balance / s.ebitda : 0;
        const intCov = s.interest_expense > 0 ? s.ebitda / s.interest_expense : 0;
        return {
            year: `Year ${s.year}`,
            debtEbitda: parseFloat(debtEbitda.toFixed(2)),
            intCov: parseFloat(intCov.toFixed(2)),
            covenantStatus: s.covenant_status,
            breaches: s.breaches
        };
    });

    const maxDebtRule = covenants.find((c: any) => c.covenant_type === 'max_debt_ebitda');
    const minIntRule = covenants.find((c: any) => c.covenant_type === 'min_interest_coverage');

    return (
        <div className="bg-white/50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Shield size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Covenant Compliance</h3>
                    <p className="text-sm text-gray-500">Tracking Debt/EBITDA and Interest Coverage</p>
                </div>
            </div>

            <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" label={{ value: 'Debt / EBITDA (x)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Interest Cov. (x)', angle: 90, position: 'insideRight' }} />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const dataPoint = payload[0].payload;
                                    return (
                                        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                                            <p className="font-bold mb-2">{label}</p>
                                            <p className="text-sm text-purple-600">Debt/EBITDA: {dataPoint.debtEbitda}x</p>
                                            <p className="text-sm text-green-600">Int. Coverage: {dataPoint.intCov}x</p>
                                            {dataPoint.breaches && dataPoint.breaches.length > 0 && (
                                                <div className="mt-2 text-xs text-red-500 font-medium border-t pt-1">
                                                    Breach: {dataPoint.breaches.join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />

                        {/* Debt / EBITDA Line */}
                        <Line yAxisId="left" type="monotone" dataKey="debtEbitda" stroke="#8884d8" name="Debt / EBITDA" strokeWidth={2} />
                        {maxDebtRule && (
                            <ReferenceLine yAxisId="left" y={maxDebtRule.limit} stroke="red" strokeDasharray="3 3" label="Max Limit" />
                        )}

                        {/* Interest Coverage Line */}
                        <Line yAxisId="right" type="monotone" dataKey="intCov" stroke="#82ca9d" name="Interest Coverage" strokeWidth={2} />
                        {minIntRule && (
                            <ReferenceLine yAxisId="right" y={minIntRule.limit} stroke="orange" strokeDasharray="3 3" label="Min Limit" />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.some(s => s.covenant_status === 'breached') ? (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                        <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-bold text-red-700">Covenant Breach Detected</p>
                            <p className="text-xs text-red-600 mt-1">
                                Compliance failures found in projection period. Review debt sizing or operational assumptions.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={18} />
                        <span className="text-sm font-medium text-green-700">All Covenants Compliant</span>
                    </div>
                )}
            </div>
        </div>
    );
};
