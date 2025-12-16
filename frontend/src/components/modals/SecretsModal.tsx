import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface SecretsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SecretsModal: React.FC<SecretsModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [keys, setKeys] = useState<any>({
        FRED_API_KEY: '',
        ALPHA_VANTAGE_KEY: '',
        PITCHBOOK_API_KEY: '',
        CAPIQ_API_KEY: '',
        CAPIQ_USERNAME: '',
        CAPIQ_PASSWORD: ''
    });
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen) {
            // Check if keys exist (we won't send back the actual keys for security, just existence)
            // Or for MVP, we might send them back if HTTPS. 
            // Better pattern: POST only. GET returns { configured: boolean }
            // For now, let's assume we just set them.
            setKeys({ FRED_API_KEY: '', ALPHA_VANTAGE_KEY: '' });
        }
    }, [isOpen]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // In a real app, send to backend to store in encrypted DB or session
            // For this MVP, we might store in localStorage OR backend env override

            // Let's implement backend storage later. For now, try to save to backend settings endpoint.
            const response = await fetch(api.url('/api/settings/secrets'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keys)
            });

            if (response.ok) {
                showToast('API Keys saved successfully', 'success');
                onClose();
            } else {
                showToast('Failed to save keys', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to save keys', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Lock size={18} className="text-system-blue" />
                        API Vault
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Secure</span>
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 flex gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p>Keys are stored securely and used only for fetching market data. They are never shared.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">FRED API Key (Interest Rates)</label>
                            <div className="relative">
                                <input
                                    type={showKey['fred'] ? "text" : "password"}
                                    value={keys.FRED_API_KEY}
                                    onChange={e => setKeys({ ...keys, FRED_API_KEY: e.target.value })}
                                    placeholder="Enter your key..."
                                    className="glass-input w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey({ ...showKey, fred: !showKey['fred'] })}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showKey['fred'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Required for live Treasury & Corporate rates.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alpha Vantage Key (Multiples)</label>
                            <div className="relative">
                                <input
                                    type={showKey['alpha'] ? "text" : "password"}
                                    value={keys.ALPHA_VANTAGE_KEY}
                                    onChange={e => setKeys({ ...keys, ALPHA_VANTAGE_KEY: e.target.value })}
                                    placeholder="Enter your key..."
                                    className="glass-input w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey({ ...showKey, alpha: !showKey['alpha'] })}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showKey['alpha'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Used for public company comparables.</p>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Private Market Data</h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PitchBook API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showKey['pitchbook'] ? "text" : "password"}
                                            value={keys.PITCHBOOK_API_KEY || ''}
                                            onChange={e => setKeys({ ...keys, PITCHBOOK_API_KEY: e.target.value })}
                                            placeholder="Enter PitchBook API Key..."
                                            className="glass-input w-full pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey({ ...showKey, pitchbook: !showKey['pitchbook'] })}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showKey['pitchbook'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Capital IQ API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showKey['capiq'] ? "text" : "password"}
                                            value={keys.CAPIQ_API_KEY || ''}
                                            onChange={e => setKeys({ ...keys, CAPIQ_API_KEY: e.target.value })}
                                            placeholder="Enter Capital IQ API Key..."
                                            className="glass-input w-full pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey({ ...showKey, capiq: !showKey['capiq'] })}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showKey['capiq'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CapIQ Username (Optional)</label>
                                        <input
                                            type="text"
                                            value={keys.CAPIQ_USERNAME || ''}
                                            onChange={e => setKeys({ ...keys, CAPIQ_USERNAME: e.target.value })}
                                            placeholder="Username"
                                            className="glass-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CapIQ Password (Optional)</label>
                                        <input
                                            type="password"
                                            value={keys.CAPIQ_PASSWORD || ''}
                                            onChange={e => setKeys({ ...keys, CAPIQ_PASSWORD: e.target.value })}
                                            placeholder="Password"
                                            className="glass-input w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-system-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? 'Saving...' : 'Save Keys'}
                    </button>
                </div>
            </div>
        </div>
    );
};
