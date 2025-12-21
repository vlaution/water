import React from 'react';
import type { LeadTimeAnalysis } from '../../services/SimulationService';
import { Calendar, AlertOctagon } from 'lucide-react';

interface Props {
  data: LeadTimeAnalysis;
}

export const LeadTimeTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/20">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Predictive Lead Time Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quantifying "How Early" the Decision Engine detected risks before real-world events occurred.
                </p>
            </div>
            <div className="text-right hidden sm:block">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Top Insight</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.max(...data.top_lead_times.map(d => d.lead_time_days))} Days
                </div>
            </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-6 py-3">Decision Signal</th>
              <th className="px-6 py-3">First Fired</th>
              <th className="px-6 py-3">Real-World Event</th>
              <th className="px-6 py-3 text-right">Lead Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.top_lead_times.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                        {item.severity === 'CRITICAL' && <AlertOctagon className="w-4 h-4 text-red-500" />}
                        <span className="uppercase">{item.signal.replace('_', ' ')}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {item.entity}
                    </div>
                </td>
                <td className="px-6 py-4">
                    {item.first_fired}
                </td>
                <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        {item.real_world_event}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                         Observed: {item.event_date}
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                         +{item.lead_time_days} Days
                    </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
