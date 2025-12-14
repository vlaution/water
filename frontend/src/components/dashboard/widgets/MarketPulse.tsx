import React, { useEffect, useState } from 'react';
import { useRealTime } from '../../../context/RealTimeContext';

interface MarketUpdate {
    ticker: string;
    price: number;
    change_percent: number;
}

export const MarketPulse: React.FC = () => {
    const { lastMessage, isConnected } = useRealTime();
    const [updates, setUpdates] = useState<MarketUpdate[]>([]);

    // Keep last 5 updates
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'market_update' && lastMessage.data) {
            const newUpdates = lastMessage.data as MarketUpdate[];
            setUpdates(prev => {
                const combined = [...newUpdates, ...prev];
                return combined.slice(0, 5); // Keep top 5
            });
        }
    }, [lastMessage]);

    const [connectionError, setConnectionError] = useState(false);

    // Monitor connection status
    useEffect(() => {
        let timeout: any;
        if (!isConnected) {
            timeout = setTimeout(() => setConnectionError(true), 5000); // Show error if not connected in 5s
        } else {
            setConnectionError(false);
        }
        return () => clearTimeout(timeout);
    }, [isConnected]);

    if (!isConnected) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className={`flex items-center gap-2 text-sm ${connectionError ? 'text-red-500' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                    {connectionError ? 'Connection Failed' : 'Connecting to Market Feed...'}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Live Market Pulse</h3>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>

            <div className="space-y-2">
                {updates.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">Waiting for ticks...</div>
                ) : (
                    updates.map((update, idx) => (
                        <div key={`${update.ticker}-${idx}`} className="flex justify-between items-center text-sm animate-fade-in-right">
                            <span className="font-medium text-gray-900">{update.ticker}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">${typeof update.price === 'number' ? update.price.toFixed(2) : '0.00'}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${update.change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {update.change_percent >= 0 ? '+' : ''}{typeof update.change_percent === 'number' ? update.change_percent.toFixed(2) : '0.00'}%
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
