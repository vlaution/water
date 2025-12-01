import React from 'react';
import { AuditAlert, type AuditIssue } from './AuditAlert';

interface ActionItem {
    id: string;
    task: string;
    status: 'pending' | 'urgent';
}

interface ActionCenterProps {
    actions: ActionItem[];
    auditIssues?: AuditIssue[];
    onGenerateReport: (type: 'pdf' | 'excel' | 'word' | 'ppt') => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ actions, auditIssues, onGenerateReport }) => {
    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Action Center</h3>

            {auditIssues && auditIssues.length > 0 && (
                <div className="mb-6">
                    <AuditAlert issues={auditIssues} />
                </div>
            )}

            <div className="flex-1 mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending Tasks</h4>
                <div className="space-y-2">
                    {actions.map((action) => (
                        <div key={action.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/40 transition-colors cursor-pointer group">
                            <div className={`w-2 h-2 rounded-full ${action.status === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.task}</span>
                            <button className="ml-auto text-xs text-system-blue opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                Resolve
                            </button>
                        </div>
                    ))}
                    {actions.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No pending actions.</p>
                    )}
                </div>
            </div>

            <div className="border-t border-white/30 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Generate Reports</h4>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onGenerateReport('excel')}
                        className="glass-button text-xs py-2 flex items-center justify-center gap-2 text-system-green hover:bg-green-50/50"
                    >
                        <span className="font-bold">XLS</span> Excel
                    </button>
                    <button
                        onClick={() => onGenerateReport('pdf')}
                        className="glass-button text-xs py-2 flex items-center justify-center gap-2 text-system-red hover:bg-red-50/50"
                    >
                        <span className="font-bold">PDF</span> Summary
                    </button>
                    <button
                        onClick={() => onGenerateReport('word')}
                        className="glass-button text-xs py-2 flex items-center justify-center gap-2 text-system-blue hover:bg-blue-50/50"
                    >
                        <span className="font-bold">DOC</span> Report
                    </button>
                    <button
                        onClick={() => onGenerateReport('ppt')}
                        className="glass-button text-xs py-2 flex items-center justify-center gap-2 text-system-orange hover:bg-orange-50/50"
                    >
                        <span className="font-bold">PPT</span> Deck
                    </button>
                </div>
            </div>
        </div>
    );
};
