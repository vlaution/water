import React from 'react';
import { ShieldCheck, AlertOctagon, TrendingUp } from 'lucide-react';

interface InvestorViewProps {
    data: any;
}

export const InvestorView: React.FC<InvestorViewProps> = ({ data }) => {
    if (!data) return <div>Loading...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Deal Readiness Score</h3>
                        <ShieldCheck className={`w-6 h-6 ${data.deal_readiness_score > 80 ? 'text-green-500' : 'text-yellow-500'}`} />
                    </div>
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                    Score
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-blue-600">
                                    {data.deal_readiness_score}/100
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div style={{ width: `${data.deal_readiness_score}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Upside Potential</h3>
                        <TrendingUp className="w-6 h-6 text-system-blue" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">+{(data.upside_potential * 100).toFixed(1)}%</h2>
                    <p className="text-sm text-gray-500 mt-2">Based on Bull Case scenarios</p>
                </div>
            </div>

            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Risks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.key_risks.map((risk: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{risk}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
