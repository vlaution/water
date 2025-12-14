import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserPreferences {
    aiEnabled: boolean;
    autoValidate: boolean;
    confidenceThreshold: number; // 0.0 to 1.0
    showBadges: boolean;
}

interface UserPreferencesContextType {
    preferences: UserPreferences;
    updatePreferences: (updates: Partial<UserPreferences>) => void;
    resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
    aiEnabled: false, // Disabled by default for stability
    autoValidate: false,
    confidenceThreshold: 0.6,
    showBadges: false,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preferences, setPreferences] = useState<UserPreferences>(() => {
        const saved = localStorage.getItem('ai_preferences');
        return saved ? JSON.parse(saved) : defaultPreferences;
    });

    useEffect(() => {
        // EMERGENCY: Force disable AI for stability
        setPreferences(prev => ({ ...prev, aiEnabled: false, autoValidate: false }));
        localStorage.setItem('ai_preferences', JSON.stringify({ ...preferences, aiEnabled: false, autoValidate: false }));
    }, []);

    useEffect(() => {
        localStorage.setItem('ai_preferences', JSON.stringify(preferences));
    }, [preferences]);

    const updatePreferences = (updates: Partial<UserPreferences>) => {
        setPreferences(prev => ({ ...prev, ...updates }));
    };

    const resetPreferences = () => {
        setPreferences(defaultPreferences);
    };

    return (
        <UserPreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
            {children}
        </UserPreferencesContext.Provider>
    );
};

export const useUserPreferences = () => {
    const context = useContext(UserPreferencesContext);
    if (context === undefined) {
        throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
    }
    return context;
};
