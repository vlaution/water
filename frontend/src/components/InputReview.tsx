import React from 'react';

interface InputReviewProps {
    inputs: any;
}

export const InputReview: React.FC<InputReviewProps> = ({ inputs }) => {
    if (!inputs) return <div className="text-gray-500">No inputs available.</div>;

    const { dcf_input } = inputs;
    const historical = dcf_input?.historical;
    const projections = dcf_input?.projections;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Historical Financials */}
            <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Historical Financials</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3">Metric</th>
                                {historical?.years?.map((year: number) => (
                                    <th key={year} className="px-6 py-3">{year}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white/40 border-b border-gray-100">
                                <td className="px-6 py-4 font-medium text-gray-900">Revenue</td>
                                {historical?.revenue?.map((val: number, i: number) => (
                                    <td key={i} className="px-6 py-4">${val}M</td>
                                ))}
                            </tr>
                            <tr className="bg-white/40 border-b border-gray-100">
                                <td className="px-6 py-4 font-medium text-gray-900">EBITDA</td>
                                {historical?.ebitda?.map((val: number, i: number) => (
                                    <td key={i} className="px-6 py-4">${val}M</td>
                                ))}
                            </tr>
                            <tr className="bg-white/40 border-b border-gray-100">
                                <td className="px-6 py-4 font-medium text-gray-900">Net Income</td>
                                {historical?.net_income?.map((val: number, i: number) => (
                                    <td key={i} className="px-6 py-4">${val}M</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Projections */}
            <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Projection Assumptions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/60 p-6 rounded-xl border border-white/40">
                        <h4 className="font-medium text-gray-700 mb-3">Growth & Margins</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Revenue Growth (Start)</span>
                                <span className="font-medium text-gray-900">{(projections?.revenue_growth_start * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Revenue Growth (End)</span>
                                <span className="font-medium text-gray-900">{(projections?.revenue_growth_end * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">EBITDA Margin (Start)</span>
                                <span className="font-medium text-gray-900">{(projections?.ebitda_margin_start * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/60 p-6 rounded-xl border border-white/40">
                        <h4 className="font-medium text-gray-700 mb-3">Valuation Parameters</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Discount Rate (WACC)</span>
                                <span className="font-medium text-gray-900">{(projections?.discount_rate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Terminal Growth Rate</span>
                                <span className="font-medium text-gray-900">{(projections?.terminal_growth_rate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tax Rate</span>
                                <span className="font-medium text-gray-900">{(projections?.tax_rate * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
