import React from 'react';

interface ScenarioToggleProps {
    currentScenario: 'base' | 'bull' | 'bear';
    onChange: (scenario: 'base' | 'bull' | 'bear') => void;
}

export const ScenarioToggle: React.FC<ScenarioToggleProps> = ({ currentScenario, onChange }) => {
    return (
        <div className="bg-white/40 backdrop-blur-md p-1 rounded-xl border border-white/20 flex inline-flex">
            {['Bear', 'Base', 'Bull'].map((s) => (
                <button
                    key={s}
                    onClick={() => onChange(s.toLowerCase() as any)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${currentScenario === s.toLowerCase()
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    {s}
                </button>
            ))}
        </div>
    );
};
