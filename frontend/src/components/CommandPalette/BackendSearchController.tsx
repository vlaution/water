import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandRegistry } from '../../context/CommandRegistryContext';
import { api } from '../../config/api';
import { Calculator } from 'lucide-react';
import type { Action } from '../../types/commandPalette';

interface BackendSearchControllerProps {
    setStep?: (step: any) => void;
}

export const BackendSearchController: React.FC<BackendSearchControllerProps> = ({ setStep }) => {
    const { registerSearchProvider } = useCommandRegistry();
    const navigate = useNavigate();

    // Helper to handle step changes universally
    const handleSetStep = (targetStep: string) => {
        if (setStep) {
            setStep(targetStep);
        } else {
            // If setStep is not available (we're on a sub-page), navigate to root with step in state
            navigate('/', { state: { setStep: targetStep } });
        }
    };

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
                        handleSetStep('manual-entry');
                    }
                }));
            } catch (e) {
                console.error("Backend search failed", e);
                return [];
            }
        };

        registerSearchProvider(provider);
        // Note: No unregister logic for providers yet
    }, [registerSearchProvider, setStep, navigate]);

    return null;
};
