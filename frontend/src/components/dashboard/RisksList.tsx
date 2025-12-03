import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface RisksListProps {
    risks: string[];
}

export const RisksList: React.FC<RisksListProps> = ({ risks }) => {
    return (
        <div className="glass-panel p-6 bg-red-50/30 border-red-100">
            <h3 className="text-sm font-medium text-red-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risks & Alerts
            </h3>

            {risks.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">No critical risks detected.</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {risks.map((risk, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-red-100">
                            <div className="min-w-[6px] h-[6px] rounded-full bg-red-500 mt-2" />
                            <p className="text-sm text-gray-700 leading-relaxed">{risk}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
