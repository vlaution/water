import React, { useEffect, useState } from 'react';
import { api } from '../config/api';

interface Run {
    id: string;
    company_name: string;
    mode: string;
    created_at: string;
    enterprise_value: number;
}

interface RecentRunsProps {
    onSelectRun: (runId: string) => void;
    token: string | null;
}

export const RecentRuns: React.FC<RecentRunsProps> = ({ onSelectRun, token }) => {
    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRuns();
    }, []);



    const fetchRuns = async () => {
        try {
            const response = await fetch(api.url('/runs'), {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            const data = await response.json();
            setRuns(data);
        } catch (error) {
            console.error('Error fetching runs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel p-6 animate-fade-in">
                <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 animate-fade-in mt-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Runs</h3>

            {runs.length === 0 ? (
                <p className="text-gray-500 text-sm">No valuation runs yet</p>
            ) : (
                <div className="space-y-3">
                    {runs.map((run) => (
                        <button
                            key={run.id}
                            onClick={() => onSelectRun(run.id)}
                            className="w-full text-left p-4 bg-white/40 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:shadow-md group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-system-blue dark:group-hover:text-blue-400 transition-colors">
                                    {run.company_name}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${run.mode === 'upload'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                    }`}>
                                    {run.mode}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {new Date(run.created_at).toLocaleDateString()}
                                </span>
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                    ${(run.enterprise_value / 1000000).toFixed(1)}M
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
