import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl transition-all duration-200 
                     bg-white/50 dark:bg-slate-800/50 
                     hover:bg-white/80 dark:hover:bg-slate-700/80 
                     text-gray-800 dark:text-gray-200
                     shadow-sm border border-white/20 dark:border-slate-700/30
                     backdrop-blur-sm"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
            ) : (
                <Moon className="w-5 h-5" />
            )}
        </button>
    );
};
