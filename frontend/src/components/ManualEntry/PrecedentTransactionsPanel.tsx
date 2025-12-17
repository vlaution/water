import React, { useState } from 'react';

interface PrecedentTransactionsPanelProps {
    data: {
        transactions: any[];
        target_revenue: number;
        target_ebitda: number;
        use_median: boolean;
    };
    onChange: (newData: any) => void;
}

export const PrecedentTransactionsPanel: React.FC<PrecedentTransactionsPanelProps> = ({ data, onChange }) => {
    const [newTransaction, setNewTransaction] = useState({
        target_name: '',
        acquirer_name: '',
        announcement_date: '',
        deal_value: '',
        revenue: '',
        ebitda: ''
    });

    const addTransaction = () => {
        if (!newTransaction.target_name || !newTransaction.deal_value) return;

        const txn = {
            ...newTransaction,
            deal_value: parseFloat(newTransaction.deal_value),
            revenue: parseFloat(newTransaction.revenue),
            ebitda: parseFloat(newTransaction.ebitda)
        };

        onChange({
            ...data,
            transactions: [...data.transactions, txn]
        });

        setNewTransaction({
            target_name: '',
            acquirer_name: '',
            announcement_date: '',
            deal_value: '',
            revenue: '',
            ebitda: ''
        });
    };

    const removeTransaction = (index: number) => {
        const newTxns = [...data.transactions];
        newTxns.splice(index, 1);
        onChange({ ...data, transactions: newTxns });
    };

    return (
        <div className="glass-panel p-8 animate-fade-in-up">
            {/* Target Metrics Section */}
            <div className="mb-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Target Company Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Target Revenue ($M)</label>
                        <input
                            type="number"
                            value={data.target_revenue}
                            onChange={(e) => onChange({ ...data, target_revenue: parseFloat(e.target.value) })}
                            className="glass-input w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Target EBITDA ($M)</label>
                        <input
                            type="number"
                            value={data.target_ebitda}
                            onChange={(e) => onChange({ ...data, target_ebitda: parseFloat(e.target.value) })}
                            className="glass-input w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 shadow-sm bg-white/40 dark:bg-black/20 backdrop-blur-sm mb-8">
                <table className="min-w-full divide-y divide-gray-200/50 dark:divide-white/10">
                    <thead className="bg-gray-50/50 dark:bg-white/5">
                        <tr>
                            {['Target', 'Acquirer', 'Date', 'Deal Value', 'Revenue', 'EBITDA', 'EV/Rev', 'EV/EBITDA', ''].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                        {data.transactions.map((txn, idx) => {
                            const evRev = txn.deal_value / txn.revenue;
                            const evEbitda = txn.deal_value / txn.ebitda;
                            return (
                                <tr key={idx} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{txn.target_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{txn.acquirer_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{txn.announcement_date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">${txn.deal_value}M</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">${txn.revenue}M</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">${txn.ebitda}M</td>
                                    <td className="px-6 py-4 text-sm font-mono text-blue-600 dark:text-blue-400">{evRev.toFixed(1)}x</td>
                                    <td className="px-6 py-4 text-sm font-mono text-purple-600 dark:text-purple-400">{evEbitda.toFixed(1)}x</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => removeTransaction(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            &times;
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add Transaction Form */}
            <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200/50 dark:border-white/10">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Add Comparable Transaction</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                    <input
                        placeholder="Target Name"
                        value={newTransaction.target_name}
                        onChange={e => setNewTransaction({ ...newTransaction, target_name: e.target.value })}
                        className="glass-input text-sm md:col-span-1"
                    />
                    <input
                        placeholder="Acquirer Name"
                        value={newTransaction.acquirer_name}
                        onChange={e => setNewTransaction({ ...newTransaction, acquirer_name: e.target.value })}
                        className="glass-input text-sm md:col-span-1"
                    />
                    <input
                        type="date"
                        value={newTransaction.announcement_date}
                        onChange={e => setNewTransaction({ ...newTransaction, announcement_date: e.target.value })}
                        className="glass-input text-sm"
                    />
                    <input
                        type="number"
                        placeholder="Deal Value ($M)"
                        value={newTransaction.deal_value}
                        onChange={e => setNewTransaction({ ...newTransaction, deal_value: e.target.value })}
                        className="glass-input text-sm"
                    />
                    <input
                        type="number"
                        placeholder="Revenue ($M)"
                        value={newTransaction.revenue}
                        onChange={e => setNewTransaction({ ...newTransaction, revenue: e.target.value })}
                        className="glass-input text-sm"
                    />
                    <input
                        type="number"
                        placeholder="EBITDA ($M)"
                        value={newTransaction.ebitda}
                        onChange={e => setNewTransaction({ ...newTransaction, ebitda: e.target.value })}
                        className="glass-input text-sm"
                    />
                </div>
                <div className="flex justify-end">
                    <button onClick={addTransaction} className="glass-button-primary px-6 py-2 text-sm">
                        Add Transaction
                    </button>
                </div>
            </div>
        </div>
    );
};
