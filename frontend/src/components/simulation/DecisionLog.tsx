import React, { useState } from 'react';
import type { DetailedDecision } from '../../services/SimulationService';
import { ChevronRight, ChevronDown, AlertTriangle, Info } from 'lucide-react';

interface Props {
  decisions: DetailedDecision[];
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles = {
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${(styles as any)[severity] || styles.LOW}`}>
      {severity}
    </span>
  );
};

export const DecisionLog: React.FC<Props> = ({ decisions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Decision Audit Log ({decisions.length})
        </h3>
        <p className="text-sm text-gray-500 mt-1">Sample of decisions generated during simulation</p>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
        {decisions.map((decision, index) => (
          <div key={index} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div 
                className="px-6 py-4 cursor-pointer flex items-center justify-between"
                onClick={() => toggleExpand(decision.decision_id || String(index))}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                    decision.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                        decision.severity === 'CRITICAL' ? 'text-red-600' : 'text-gray-500'
                    }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {decision.signal.replace(/_/g, ' ')}
                    </span>
                    <SeverityBadge severity={decision.severity} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 font-mono text-xs">ID: {decision.decision_id?.slice(0, 8)}...</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Confidence</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {Math.round(decision.confidence * 100)}%
                    </div>
                </div>
                {expandedId === (decision.decision_id || String(index)) ? 
                    <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                }
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === (decision.decision_id || String(index)) && (
                <div className="px-6 pb-4 ml-16 mr-6 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Why Now?
                            </h4>
                            <ul className="space-y-1">
                                {decision.why_now.map((reason, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Recommended Actions
                            </h4>
                            <ul className="space-y-1">
                                {decision.actions.map((action, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                        {action}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Missing Import fix
import { Activity } from 'lucide-react';
