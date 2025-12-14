import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, X } from 'lucide-react';
import { useGlobalConfig } from '../../context/GlobalConfigContext';

// Remove local interface, import or rely on context type if exported, 
// for now define partial or use shared if possible. Ideally move interface to types.ts
// But simpler here:

export const GlobalAssumptionsPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    // Use Context
    const { config: globalConfig, updateConfig, loading: contextLoading } = useGlobalConfig();

    // Local state for editing form before save? 
    // Actually user wants "Live" changes. 
    // Option A: Edit local state, Save -> updates Global.
    // Option B: Edit directly updates Global (too many API calls).
    // Let's stick to: Edit Local -> Click Save -> Update Global Context.

    const [localConfig, setLocalConfig] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Sync local config with global when opened or global changes (if not editing?)
    useEffect(() => {
        if (globalConfig) {
            setLocalConfig(globalConfig);
        }
    }, [globalConfig, isOpen]);

    const handleSave = async () => {
        if (!localConfig) return;
        setSaving(true);
        try {
            await updateConfig(localConfig);
            // Optional: Trigger a global refresh or toast
        } catch (err) {
            console.error("Failed to save config", err);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: number) => {
        if (localConfig) {
            setLocalConfig({ ...localConfig, [field]: value });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 left-0 z-50 flex">
            <div className="w-80 min-h-screen bg-white/40 backdrop-blur-xl border-r border-white/20 p-6 shadow-glass animate-slide-in-left overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Settings size={20} />
                        <h2 className="text-lg font-bold">Global Settings</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={20} />
                    </button>
                </div>

                {(contextLoading && !localConfig) ? (
                    <div className="flex justify-center p-8">
                        <RefreshCw className="animate-spin text-gray-400" />
                    </div>
                ) : localConfig && (
                    <div className="space-y-8">
                        {/* Section 1: General Rates */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Rates</h3>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Tax Rate (%)</label>
                                <input
                                    type="number" step="1"
                                    className="glass-input w-full"
                                    value={localConfig.default_tax_rate * 100}
                                    onChange={e => updateField('default_tax_rate', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Discount Rate (WACC) (%)</label>
                                <input
                                    type="number" step="0.5"
                                    className="glass-input w-full"
                                    value={localConfig.default_discount_rate * 100}
                                    onChange={e => updateField('default_discount_rate', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                        </div>

                        {/* Section 2: Operational Defaults */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operational Defaults</h3>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Rev Growth (%)</label>
                                <input
                                    type="number" step="0.5"
                                    className="glass-input w-full"
                                    value={localConfig.default_revenue_growth * 100}
                                    onChange={e => updateField('default_revenue_growth', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">EBITDA Margin (%)</label>
                                <input
                                    type="number" step="0.5"
                                    className="glass-input w-full"
                                    value={localConfig.default_ebitda_margin * 100}
                                    onChange={e => updateField('default_ebitda_margin', parseFloat(e.target.value) / 100)}
                                />
                            </div>
                        </div>

                        {/* Section 3: Working Capital */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Working Capital (Days)</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">DSO</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full px-2"
                                        value={localConfig.default_dso}
                                        onChange={e => updateField('default_dso', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">DIO</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full px-2"
                                        value={localConfig.default_dio}
                                        onChange={e => updateField('default_dio', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">DPO</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full px-2"
                                        value={localConfig.default_dpo}
                                        onChange={e => updateField('default_dpo', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: LBO Defaults */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">LBO Defaults</h3>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Entry Multiple (x)</label>
                                <input
                                    type="number" step="0.5"
                                    className="glass-input w-full"
                                    value={localConfig.default_entry_multiple}
                                    onChange={e => updateField('default_entry_multiple', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Default Leverage (x)</label>
                                <input
                                    type="number" step="0.5"
                                    className="glass-input w-full"
                                    value={localConfig.default_leverage}
                                    onChange={e => updateField('default_leverage', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Section 5: Simulation */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Simulation</h3>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Monte Carlo Iterations</label>
                                <input
                                    type="number" step="100"
                                    className="glass-input w-full"
                                    value={localConfig.simulation_iterations}
                                    onChange={e => updateField('simulation_iterations', parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-gray-200/50">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-2.5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                {saving ? 'Saving...' : 'Sync Live'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* Backdrop click to close */}
            <div className="flex-1 bg-black/5" onClick={onClose} />
        </div>
    );
};
