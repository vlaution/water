import React from 'react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
    const { preferences, updatePreferences, resetPreferences } = useUserPreferences();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>⚙️</span> AI Copilot Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Master Switch */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-gray-900">Enable AI Features</div>
                            <div className="text-sm text-gray-500">Turn off all AI suggestions and validation</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={preferences.aiEnabled}
                                onChange={(e) => updatePreferences({ aiEnabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Auto-Validate */}
                    <div className={`space-y-6 ${!preferences.aiEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Real-time Validation</div>
                                <div className="text-sm text-gray-500">Analyze inputs automatically as you type</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={preferences.autoValidate}
                                    onChange={(e) => updatePreferences({ autoValidate: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Show Badges */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Show Suggestion Badges</div>
                                <div className="text-sm text-gray-500">Display dots inside input fields</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={preferences.showBadges}
                                    onChange={(e) => updatePreferences({ showBadges: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Confidence Threshold */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <div className="font-medium text-gray-900">Confidence Threshold</div>
                                <div className="text-sm font-bold text-indigo-600">{(preferences.confidenceThreshold * 100).toFixed(0)}%</div>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="0.95"
                                step="0.05"
                                value={preferences.confidenceThreshold}
                                onChange={(e) => updatePreferences({ confidenceThreshold: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>More Suggestions</span>
                                <span>Higher Accuracy</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between">
                    <button
                        onClick={resetPreferences}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
