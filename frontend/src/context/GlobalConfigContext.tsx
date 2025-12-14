import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../config/api';

interface GlobalConfig {
    default_tax_rate: number;
    default_discount_rate: number;
    default_dso: number;
    default_dio: number;
    default_dpo: number;
    default_revenue_growth: number;
    default_ebitda_margin: number;
    default_terminal_growth: number;
    default_entry_multiple: number;
    default_leverage: number;
    default_interest_rate: number;
    simulation_iterations: number;
    sensitivity_range: number;
}

interface GlobalConfigContextType {
    config: GlobalConfig | null;
    loading: boolean;
    refreshConfig: () => Promise<void>;
    updateConfig: (newConfig: GlobalConfig) => Promise<void>;
}

const GlobalConfigContext = createContext<GlobalConfigContextType | undefined>(undefined);

export const GlobalConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<GlobalConfig | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const res = await fetch(api.url('/api/settings/global'));
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (err) {
            console.error("Failed to load global config context", err);
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = async (newConfig: GlobalConfig) => {
        // Optimistic update
        setConfig(newConfig);
        try {
            await fetch(api.url('/api/settings/global'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
        } catch (err) {
            console.error("Failed to save global config", err);
            // Revert on failure (optional, simplified here)
            fetchConfig();
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <GlobalConfigContext.Provider value={{ config, loading, refreshConfig: fetchConfig, updateConfig }}>
            {children}
        </GlobalConfigContext.Provider>
    );
};

export const useGlobalConfig = () => {
    const context = useContext(GlobalConfigContext);
    if (context === undefined) {
        throw new Error('useGlobalConfig must be used within a GlobalConfigProvider');
    }
    return context;
};
