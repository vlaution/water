import React from 'react';
import type { SimulationSummary } from '../../services/SimulationService';
import { AlertCircle, Activity, TrendingUp, Layers } from 'lucide-react';

interface Props {
  summary: SimulationSummary;
}

export const SimulationOverview: React.FC<Props> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Total Decisions */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Decisions</h3>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {summary.total_decisions_fired.toLocaleString()}
        </div>
        <p className="text-xs text-gray-500 mt-1">Across period {summary.period_analyzed}</p>
      </div>

      {/* Critical Alerts */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Alerts</h3>
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {summary.breakdown_by_severity.CRITICAL.toLocaleString()}
        </div>
        <p className="text-xs text-red-500 mt-1 font-medium">Requires immediate board action</p>
      </div>

      {/* High Severity */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">High Severity</h3>
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {summary.breakdown_by_severity.HIGH.toLocaleString()}
        </div>
        <p className="text-xs text-orange-500 mt-1">Warning thresholds breached</p>
      </div>

      {/* Primary Risk */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dominant Signal</h3>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {Object.keys(summary.signal_breakdown).reduce((a, b) => summary.signal_breakdown[a] > summary.signal_breakdown[b] ? a : b)}
        </div>
        <p className="text-xs text-gray-500 mt-1">Most frequent trigger type</p>
      </div>
    </div>
  );
};
