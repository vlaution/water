import React, { useState, useEffect } from 'react';
import { api } from '../config/api';

export const ConnectivityTest: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('');
    const [apiUrl, setApiUrl] = useState<string>('');

    useEffect(() => {
        setApiUrl(api.baseURL);
        checkConnectivity();
    }, []);

    const checkConnectivity = async () => {
        setStatus('loading');
        try {
            const response = await fetch(api.url('/'));
            const data = await response.json();
            setStatus('success');
            setMessage(JSON.stringify(data, null, 2));
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unknown error occurred');
            console.error('Connectivity test failed:', error);
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded-lg my-4">
            <h3 className="text-lg font-bold mb-2">API Connectivity Test</h3>
            <div className="space-y-2">
                <div>
                    <span className="font-semibold">Configured API URL: </span>
                    <code className="bg-gray-200 px-1 rounded">{apiUrl}</code>
                </div>
                <div>
                    <span className="font-semibold">Status: </span>
                    <span className={`font-bold ${status === 'success' ? 'text-green-600' :
                            status === 'error' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                        {status.toUpperCase()}
                    </span>
                </div>
                {message && (
                    <div className="mt-2">
                        <span className="font-semibold">Response/Error:</span>
                        <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto max-h-40 border">
                            {message}
                        </pre>
                    </div>
                )}
                <button
                    onClick={checkConnectivity}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                >
                    Retry Connection
                </button>
            </div>
        </div>
    );
};
