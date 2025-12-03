import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface CredibilityScoreProps {
    score: number;
    rating: string;
}

export const CredibilityScore: React.FC<CredibilityScoreProps> = ({ score, rating }) => {
    const getIcon = () => {
        if (score >= 80) return <ShieldCheck className="w-8 h-8 text-green-500" />;
        if (score >= 50) return <Shield className="w-8 h-8 text-yellow-500" />;
        return <ShieldAlert className="w-8 h-8 text-red-500" />;
    };

    const getColor = () => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-100';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    return (
        <div className="glass-panel p-6 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Credibility Score</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold text-gray-900">{score}</h2>
                    <span className="text-sm text-gray-400">/ 100</span>
                </div>
            </div>
            <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${getColor()}`}>
                {getIcon()}
                <span className="text-xs font-bold mt-1 uppercase">{rating}</span>
            </div>
        </div>
    );
};
