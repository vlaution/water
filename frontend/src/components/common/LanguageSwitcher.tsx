import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="p-2 gap-2 flex items-center rounded-xl transition-all duration-200 
                     bg-white/50 dark:bg-slate-800/50 
                     hover:bg-white/80 dark:hover:bg-slate-700/80 
                     text-gray-800 dark:text-gray-200
                     shadow-sm border border-white/20 dark:border-slate-700/30
                     backdrop-blur-sm"
            aria-label="Toggle language"
        >
            <Globe className="w-4 h-4" />
            <span className="font-bold text-xs">{i18n.language.toUpperCase()}</span>
        </button>
    );
};
