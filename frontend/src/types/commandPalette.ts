
export interface Action {
    id: string;
    title: string;
    subtitle?: string; // e.g. "Navigation", "System"
    keywords?: string[];
    icon?: React.ReactNode;
    section: string; // "Navigation", "Actions", "Valuation", "Recent"
    perform: () => void;
    context?: string; // 'global' | 'valuation' | 'dashboard'
    shortcut?: string[]; // e.g. ['g', 'h'] for Go Home
}

export interface CommandRegistryContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    toggle: () => void;
    registerAction: (action: Action) => void;
    unregisterAction: (id: string) => void;
    actions: Action[];
    results: Action[]; // Combined results
    setQuery: (query: string) => void;
    query: string;
    boostAction: (id: string) => void; // Call this when action is executed
    registerSearchProvider: (provider: (query: string) => Promise<Action[]>) => void;
}
