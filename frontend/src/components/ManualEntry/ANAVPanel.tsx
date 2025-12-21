import React, { useState } from 'react';

interface ANAVPanelProps {
    data: {
        assets: Record<string, number>;
        liabilities: Record<string, number>;
        adjustments: Record<string, number>;
    };
    onChange: (newData: any) => void;
}

export const ANAVPanel: React.FC<ANAVPanelProps> = ({ data, onChange }) => {
    const [newItem, setNewItem] = useState({ category: 'assets' as 'assets' | 'liabilities' | 'adjustments', name: '', value: '' });

    const handleAddItem = () => {
        if (!newItem.name || !newItem.value) return;
        const category = newItem.category;
        const currentCategoryData = data[category] || {};

        onChange({
            ...data,
            [category]: {
                ...currentCategoryData,
                [newItem.name]: parseFloat(newItem.value)
            }
        });
        setNewItem(prev => ({ ...prev, name: '', value: '' }));
    };

    const handleRemoveItem = (category: 'assets' | 'liabilities' | 'adjustments', name: string) => {
        const newCategoryData = { ...data[category] };
        delete newCategoryData[name];
        onChange({
            ...data,
            [category]: newCategoryData
        });
    };

    return (
        <div className="glass-panel p-8 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Adjusted Net Asset Value</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {(['assets', 'liabilities', 'adjustments'] as const).map(category => (
                    <div key={category} className="space-y-4">
                        <h4 className="text-lg font-semibold capitalize text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                            {category}
                        </h4>

                        <div className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-white/50 dark:border-white/10 min-h-[200px]">
                            {Object.entries(data[category] || {}).length === 0 ? (
                                <p className="text-center text-gray-400 text-sm mt-8 italic">No items added</p>
                            ) : (
                                <ul className="space-y-2">
                                    {Object.entries(data[category]).map(([name, value]) => (
                                        <li key={name} className="flex justify-between items-center text-sm p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg group">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">{name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-gray-900 dark:text-gray-100">${(value as number).toLocaleString()}M</span>
                                                <button
                                                    onClick={() => handleRemoveItem(category, name)}
                                                    className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Add Manual Item</h4>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                            className="w-full glass-input text-sm p-2"
                        >
                            <option value="assets">Asset</option>
                            <option value="liabilities">Liability</option>
                            <option value="adjustments">Adjustment</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Item Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Real Estate Holdings"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className="w-full glass-input text-sm p-2"
                        />
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Value ($M)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={newItem.value}
                            onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                            className="w-full glass-input text-sm p-2"
                        />
                    </div>
                    <button
                        onClick={handleAddItem}
                        className="glass-button-primary px-6 py-2 h-[40px] flex items-center gap-2"
                    >
                        <span>+</span> Add
                    </button>
                </div>
            </div>
        </div>
    );
};
