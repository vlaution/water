import React, { useEffect } from 'react';
import { useCommandRegistry } from '../../context/CommandRegistryContext';
import { api } from '../../config/api';
import { Calculator } from 'lucide-react';
import type { Action } from '../../types/commandPalette';

interface BackendSearchControllerProps {
    setStep: (step: any) => void;
}

export const BackendSearchController: React.FC<BackendSearchControllerProps> = ({ setStep }) => {
    const { registerSearchProvider } = useCommandRegistry();

    useEffect(() => {
        const provider = async (query: string): Promise<Action[]> => {
            if (query.length < 2) return [];

            try {
                const response = await fetch(api.url(`/api/search?q=${encodeURIComponent(query)}`));
                if (!response.ok) return [];
                const data = await response.json();

                return data.results.map((company: any) => ({
                    id: `company-${company.ticker}`,
                    title: `${company.name} (${company.ticker})`,
                    subtitle: `Start Valuation for ${company.ticker} (${company.sector})`,
                    keywords: [company.ticker, company.name, 'valuation', 'analyze'],
                    section: 'Companies',
                    icon: <Calculator size={18} />,
                    perform: () => {
                        // Hack: Pass data via localStorage because ManualEntryForm is hard to inject into
                        localStorage.setItem('pending_valuation_ticker', company.ticker);
                        setStep('manual-entry');
                    }
                }));
            } catch (e) {
                console.error("Backend search failed", e);
                return [];
            }
        };

        registerSearchProvider(provider);
        // Note: No unregister logic for providers yet, assuming this component lives forever in ProtectedApp
    }, [registerSearchProvider, setStep]);

    return null;
};
