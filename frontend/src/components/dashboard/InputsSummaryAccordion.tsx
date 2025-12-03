import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';

interface InputsSummaryAccordionProps {
    data: any;
}

export const InputsSummaryAccordion: React.FC<InputsSummaryAccordionProps> = ({ data }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="glass-panel overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-200 rounded-lg text-gray-600">
                        <Database className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-gray-900">Full Inputs Summary</h3>
                        <p className="text-xs text-gray-500">View all assumptions and parameters</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {isOpen && (
                <div className="p-6 border-t border-gray-100 bg-white/50 animate-fade-in">
                    <pre className="text-xs text-gray-600 font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto border border-gray-200">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
