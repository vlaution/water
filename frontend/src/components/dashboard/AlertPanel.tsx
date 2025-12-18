import React from 'react';

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
}

interface AlertPanelProps {
    alerts: Alert[];
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                Strategic Alerts
                <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full">{alerts.length} Active</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`p-3 rounded-xl border text-sm flex items-start gap-3 transition-all hover:scale-[1.02] cursor-pointer
                            ${alert.type === 'critical' ? 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200' : ''}
                            ${alert.type === 'warning' ? 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50 text-orange-800 dark:text-orange-200' : ''}
                            ${alert.type === 'info' ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-200' : ''}
                        `}
                    >
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0
                            ${alert.type === 'critical' ? 'bg-red-500' : ''}
                            ${alert.type === 'warning' ? 'bg-orange-500' : ''}
                            ${alert.type === 'info' ? 'bg-blue-500' : ''}
                        `}></div>
                        <p className="leading-snug">{alert.message}</p>
                    </div>
                ))}
            </div>

            <button className="mt-4 w-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border-t border-white/30 dark:border-white/10 pt-3">
                View All Alerts →
            </button>
        </div>
    );
};
