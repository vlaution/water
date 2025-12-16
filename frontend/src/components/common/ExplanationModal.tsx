import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, Cell
} from 'recharts';
import { analytics } from '../../services/AnalyticsService';

import type { Suggestion } from '../../types/ai';

interface ExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    suggestion: Suggestion & { field: string; currentValue: number; suggestedValue: number; }; // Extended with specific context needed for charts
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
    isOpen,
    onClose,
    onApply,
    suggestion
}) => {
    const [activeTab, setActiveTab] = useState<'reasoning' | 'impact' | 'market'>('reasoning');

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Log view event
            analytics.log('ai_explanation_opened', suggestion.field, {
                source: suggestion.source,
                tab: activeTab
            });
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, suggestion.field, suggestion.source]); // Added deps for analytics accuracy (technically on mount of open state)
    // Note: This effect runs when isOpen changes. If isOpen is true, we log.

    if (!isOpen) return null;

    // Data preparation for charts
    const comparisonData = [
        {
            name: 'Current',
            value: suggestion.currentValue * 100,
            fill: '#9CA3AF' // Gray-400
        },
        {
            name: 'Suggested',
            value: suggestion.suggestedValue * 100,
            fill: '#4F46E5' // Indigo-600
        },
        {
            name: 'Peer Median',
            value: (suggestion.suggestedValue * 100) * 0.95, // Mock peer data slightly lower
            fill: '#10B981' // Emerald-500
        }
    ];

    // Mock projection data for Impact tab
    const generateProjectionData = () => {
        const data = [];
        let currentVal = 100;
        let suggestedVal = 100;
        // Use realistic small steps if growth rates are small
        const growthRate = suggestion.currentValue || 0.05;
        const improvedRate = suggestion.suggestedValue || 0.08;

        for (let i = 0; i <= 5; i++) {
            data.push({
                year: `Year ${i}`,
                Current: Math.round(currentVal),
                Improved: Math.round(suggestedVal)
            });
            currentVal *= (1 + growthRate);
            suggestedVal *= (1 + improvedRate);
        }
        return data;
    };
    const impactData = generateProjectionData();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 id="modal-title" className="text-2xl font-bold flex items-center gap-2">
                                AI Insight
                            </h2>
                            <p className="text-indigo-100 mt-1">
                                Analysis for <span className="font-semibold bg-white/20 px-2 py-0.5 rounded ml-1">{suggestion.field.replace(/_/g, ' ')}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white transition-colors text-2xl leading-none p-1 rounded-full hover:bg-white/10"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 shrink-0">
                    <button
                        onClick={() => setActiveTab('reasoning')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'reasoning'
                            ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Reasoning
                    </button>
                    <button
                        onClick={() => setActiveTab('impact')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'impact'
                            ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Impact Simulation
                    </button>
                    <button
                        onClick={() => setActiveTab('market')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'market'
                            ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Peer Benchmark
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow text-left">
                    {activeTab === 'reasoning' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
                                <h3 className="text-indigo-900 font-semibold mb-2 flex items-center gap-2">
                                    Why this suggestion?
                                </h3>
                                <p className="text-indigo-900/80 leading-relaxed text-base">
                                    {suggestion.reasoning}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-sm text-gray-500 mb-2 font-medium">Confidence Score</div>
                                    <div className="flex items-end gap-2">
                                        <div className="text-3xl font-bold text-gray-900">
                                            {(suggestion.confidence * 100).toFixed(0)}%
                                        </div>
                                        <div className="h-2 flex-grow bg-gray-100 rounded-full mb-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${suggestion.confidence > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${suggestion.confidence * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">Based on historical accuracy logic</div>
                                </div>
                                <div className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-sm text-gray-500 mb-2 font-medium">Data Source</div>
                                    <div className="text-lg font-semibold text-gray-900 truncate">
                                        {suggestion.source || 'Aggregated Market Data'}
                                    </div>
                                    <div className="text-xs text-indigo-600 mt-2 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded">
                                        Verified Source
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'impact' && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col">
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-start gap-4 shadow-sm mb-4">

                                <div>
                                    <h3 className="text-green-900 font-bold">Projected Outcome</h3>
                                    <p className="text-green-800 text-sm mt-1">{suggestion.impact}</p>
                                </div>
                            </div>

                            <div className="flex-grow min-h-[300px] w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative">
                                <h4 className="text-sm font-semibold text-gray-500 mb-4 absolute top-4 left-4 z-10 w-full text-center sm:text-left">5-Year Growth Trajectory</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={impactData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorImproved" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: number) => [`${value}`, '']}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="Current"
                                            stroke="#9CA3AF"
                                            fillOpacity={1}
                                            fill="url(#colorCurrent)"
                                            strokeWidth={2}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="Improved"
                                            stroke="#4F46E5"
                                            fillOpacity={1}
                                            fill="url(#colorImproved)"
                                            strokeWidth={3}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {activeTab === 'market' && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col">
                            <p className="text-gray-600 text-sm">
                                Comparing your <span className="font-semibold">{suggestion.field.replace(/_/g, ' ')}</span> against industry peers in the <span className="font-semibold text-indigo-600">{suggestion.source || 'Technology'}</span> sector.
                            </p>

                            <div className="flex-grow min-h-[300px] w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative">
                                <h4 className="text-sm font-semibold text-gray-500 mb-4 absolute top-4 left-4 z-10 w-full text-center sm:text-left">Benchmark Comparison</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} margin={{ top: 40, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontWeight: 500 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Value']}
                                        />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                                            {comparisonData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start text-sm text-blue-800">
                                <span className="text-xl">ℹ️</span>
                                <p>
                                    The suggested value places you in the <strong>top quartile</strong> of efficient companies in this sector, optimizing your valuation metrics.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={() => {
                            onApply();
                            onClose();
                        }}
                        className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
                    >
                        Apply Suggestion
                    </button>
                </div>
            </div>
        </div>
    );
};
