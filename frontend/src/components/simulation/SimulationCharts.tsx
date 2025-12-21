import React from 'react';
import type { SimulationSummary } from '../../services/SimulationService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  summary: SimulationSummary;
}

const COLORS = {
  CRITICAL: '#ef4444', // red-500
  HIGH: '#f97316', // orange-500
  MEDIUM: '#eab308', // yellow-500
  LOW: '#3b82f6' // blue-500
};

const SIGNAL_COLORS = {
  forecast_miss: '#8b5cf6', // violet
  risk_concentration: '#ec4899', // pink
  cash_runway: '#14b8a6', // teal
  covenant_breach: '#f43f5e', // rose
  volatility_spike: '#84cc16' // lime
};

export const SimulationCharts: React.FC<Props> = ({ summary }) => {
  const severityData = Object.entries(summary.breakdown_by_severity).map(([name, value]) => ({
    name,
    value
  })).filter(d => d.value > 0);

  const signalData = Object.entries(summary.signal_breakdown).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value,
    originalKey: name
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Severity Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 w-full text-left">Severity Distribution</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || '#ccc'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                itemStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 w-full text-left">Trigger Type Frequency</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signalData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={150} 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                 cursor={{ fill: 'transparent' }}
                 contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {signalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(SIGNAL_COLORS as any)[entry.originalKey] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
