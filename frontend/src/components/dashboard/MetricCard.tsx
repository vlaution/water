import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'blue' | 'green' | 'purple' | 'amber';
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subValue, icon: Icon, color = 'blue' }) => {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
    };

    return (
        <div className="glass-panel p-6 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
                {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
            </div>
            <div className={`p-3 rounded-xl border ${colorStyles[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
};
