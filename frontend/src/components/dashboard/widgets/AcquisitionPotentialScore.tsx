import React from 'react';

interface AcquisitionPotentialItem {
    company_name: string;
    score: number;
    reason: string;
}

interface AcquisitionPotentialScoreProps {
    data: AcquisitionPotentialItem[];
}

export const AcquisitionPotentialScore: React.FC<AcquisitionPotentialScoreProps> = ({ data }) => {
    return (
        <div className="space-y-4">
            {data.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <p className="font-medium text-gray-900">{item.company_name}</p>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${item.score}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-bold text-indigo-700">{item.score.toFixed(0)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
