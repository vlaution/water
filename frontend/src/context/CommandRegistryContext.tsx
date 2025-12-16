import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import type { Action, CommandRegistryContextType } from '../types/commandPalette';

const CommandRegistryContext = createContext<CommandRegistryContextType | undefined>(undefined);

export const CommandRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [actions, setActions] = useState<Action[]>([]);
    const [frequency, setFrequency] = useState<Record<string, number>>({});

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Action[]>([]);
    const [searchProviders, setSearchProviders] = useState<((query: string) => Promise<Action[]>)[]>([]);

    // Load frequency
    useEffect(() => {
        try {
            const stored = localStorage.getItem('command_frequency');
            if (stored) {
                setFrequency(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load command frequency", e);
        }
    }, []);

    const registerAction = useCallback((action: Action) => {
        setActions(prev => {
            if (prev.find(a => a.id === action.id)) return prev;
            return [...prev, action];
        });
    }, []);

    const unregisterAction = useCallback((id: string) => {
        setActions(prev => prev.filter(a => a.id !== id));
    }, []);

    const registerSearchProvider = useCallback((provider: (query: string) => Promise<Action[]>) => {
        setSearchProviders(prev => [...prev, provider]);
    }, []);

    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    const boostAction = useCallback((id: string) => {
        setFrequency(prev => {
            const newFreq = { ...prev, [id]: (prev[id] || 0) + 1 };
            localStorage.setItem('command_frequency', JSON.stringify(newFreq));
            return newFreq;
        });
    }, []);

    // Fuse instance
    const fuse = useMemo(() => {
        return new Fuse(actions, {
            keys: [
                { name: 'title', weight: 0.7 },
                { name: 'keywords', weight: 0.5 },
                { name: 'subtitle', weight: 0.3 },
                { name: 'section', weight: 0.1 }
            ],
            threshold: 0.4,
            includeScore: true
        });
    }, [actions]);

    // Search Logic
    useEffect(() => {
        let active = true;

        const performSearch = async () => {
            if (!query) {
                // Recent/Boosted
                const defaults = [...actions].sort((a, b) => {
                    const freqA = frequency[a.id] || 0;
                    const freqB = frequency[b.id] || 0;
                    return freqB - freqA;
                }).slice(0, 20);
                if (active) setResults(defaults);
                return;
            }

            // 1. Local Search
            const localResults = fuse.search(query).map(r => r.item);

            // 2. Async Providers
            let externalResults: Action[] = [];
            try {
                const promises = searchProviders.map(p => p(query));
                const providerResults = await Promise.all(promises);
                externalResults = providerResults.flat();
            } catch (e) {
                console.error("Search provider failed", e);
            }

            if (active) {
                setResults([...localResults, ...externalResults]);
            }
        };

        const timeoutId = setTimeout(performSearch, 200); // 200ms debounce
        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, [query, actions, fuse, frequency, searchProviders]);


    // Global Keyboard Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggle]);

    return (
        <CommandRegistryContext.Provider value={{
            isOpen,
            setIsOpen,
            toggle,
            registerAction,
            unregisterAction,
            results,
            query,
            setQuery,
            boostAction,
            registerSearchProvider,
            actions,
        }}>
            {children}
        </CommandRegistryContext.Provider>
    );
};

export const useCommandRegistry = () => {
    const context = useContext(CommandRegistryContext);
    if (!context) {
        throw new Error('useCommandRegistry must be used within a CommandRegistryProvider');
    }
    return context;
};
