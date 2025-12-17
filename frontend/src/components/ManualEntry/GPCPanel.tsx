import React, { useState } from 'react';

interface GPCPanelProps {
    data: {
        target_ticker: string;
        peer_tickers: string[];
        metrics: {
            "LTM Revenue": number;
            "LTM EBITDA": number;
        };
        ev_revenue_multiple?: number;
        ev_ebitda_multiple?: number;
    };
    onChange: (newData: any) => void;
    onFindPeers: (ticker: string) => void;
}

export const GPCPanel: React.FC<GPCPanelProps> = ({ data, onChange, onFindPeers }) => {
    const [newPeer, setNewPeer] = useState('');

    const handleAddPeer = () => {
        if (!newPeer) return;
        onChange({
            ...data,
            peer_tickers: [...data.peer_tickers, newPeer.toUpperCase()]
        });
        setNewPeer('');
    };

    const handleRemovePeer = (ticker: string) => {
        onChange({
            ...data,
            peer_tickers: data.peer_tickers.filter(t => t !== ticker)
        });
    };

    return (
        <div className="glass-panel p-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Target Info */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </span>
                        Target Company
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Subject Ticker / Symbol</label>
                        <div className="flex gap-2">
                            <input
                                placeholder="e.g. AAPL"
                                value={data.target_ticker}
                                onChange={(e) => onChange({ ...data, target_ticker: e.target.value.toUpperCase() })}
                                className="glass-input flex-1 font-mono uppercase"
                            />
                            <button
                                onClick={() => onFindPeers(data.target_ticker)}
                                className="glass-button bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40"
                            >
                                Auto-Find Peers
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">LTM Revenue ($M)</label>
                            <input
                                type="number"
                                value={data.metrics["LTM Revenue"]}
                                onChange={(e) => onChange({ ...data, metrics: { ...data.metrics, "LTM Revenue": parseFloat(e.target.value) } })}
                                className="glass-input w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">LTM EBITDA ($M)</label>
                            <input
                                type="number"
                                value={data.metrics["LTM EBITDA"]}
                                onChange={(e) => onChange({ ...data, metrics: { ...data.metrics, "LTM EBITDA": parseFloat(e.target.value) } })}
                                className="glass-input w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Peer Group */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </span>
                        Peer Group
                    </h3>

                    <div className="min-h-[160px] bg-white/40 dark:bg-black/20 rounded-xl p-4 border border-white/50 dark:border-white/10">
                        {data.peer_tickers.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 italic text-sm text-center mt-10">No peers added yet.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {data.peer_tickers.map(ticker => (
                                    <span key={ticker} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {ticker}
                                        <button onClick={() => handleRemovePeer(ticker)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">&times;</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            placeholder="Add Peer Ticker..."
                            value={newPeer}
                            onChange={(e) => setNewPeer(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPeer()}
                            className="glass-input flex-1 font-mono uppercase text-sm"
                        />
                        <button
                            onClick={handleAddPeer}
                            className="glass-button-primary px-4"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Derived Multiples Display */}
            <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Applied Multiples</h4>
                <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-500/10">
                        <span className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">EV / Revenue</span>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                            {data.ev_revenue_multiple ? `${data.ev_revenue_multiple.toFixed(2)}x` : '-'}
                        </div>
                    </div>
                    <div className="flex-1 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-500/10">
                        <span className="block text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">EV / EBITDA</span>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                            {data.ev_ebitda_multiple ? `${data.ev_ebitda_multiple.toFixed(2)}x` : '-'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
