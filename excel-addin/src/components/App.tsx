import React, { useState } from 'react';
import Login from './Login';
import ValuationList from './ValuationList';
import ValuationSync from './ValuationSync';

const App: React.FC = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);

    const handleLogin = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
    };

    const handleLogout = () => {
        setToken(null);
        setSelectedValuationId(null);
        localStorage.removeItem('token');
    };

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    if (!selectedValuationId) {
        return (
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Valuations</h2>
                    <button onClick={handleLogout} className="text-sm text-red-500">Logout</button>
                </div>
                <ValuationList
                    token={token}
                    onSelect={(id) => setSelectedValuationId(id)}
                />
            </div>
        );
    }

    return (
        <div className="p-4">
            <button
                onClick={() => setSelectedValuationId(null)}
                className="mb-4 text-blue-500 text-sm"
            >
                &larr; Back to List
            </button>
            <ValuationSync
                token={token}
                valuationId={selectedValuationId}
            />
        </div>
    );
};

export default App;
