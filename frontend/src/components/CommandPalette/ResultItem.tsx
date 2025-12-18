import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Action } from '../../types/commandPalette';
import { Globe, Command, Calculator, FileText, Shield, TrendingUp, Search } from 'lucide-react';
import clsx from 'clsx';

interface ResultItemProps {
    action: Action;
    isActive: boolean;
    onSelect: () => void;
    onMouseEnter: () => void;
}

export const ResultItem: React.FC<ResultItemProps> = ({ action, isActive, onSelect, onMouseEnter }) => {
    const ref = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (isActive && ref.current) {
            ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isActive]);

    const getIcon = () => {
        if (action.icon) return action.icon;
        switch (action.section) {
            case 'Navigation': return <Globe size={18} />;
            case 'System': return <Command size={18} />;
            case 'Valuation': return <Calculator size={18} />;
            case 'Data': return <FileText size={18} />;
            case 'Admin': return <Shield size={18} />;
            case 'Companies': return <TrendingUp size={18} />;
            default: return <Search size={18} />;
        }
    }

    return (
        <motion.li
            ref={ref}
            layout // for smooth list reordering
            onClick={onSelect}
            onMouseEnter={onMouseEnter}
            className={clsx(
                "cursor-pointer px-4 h-[56px] flex items-center justify-between rounded-xl transition-all duration-200 mb-1",
                isActive
                    ? "text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] ring-1 ring-white/20 dark:ring-white/10 translation-z-10 bg-system-blue" // Highlight
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3.5 overflow-hidden">
                <div className={clsx(
                    "flex items-center justify-center transition-opacity w-8 h-8 rounded-lg",
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                )}>
                    {React.isValidElement(getIcon()) ? React.cloneElement(getIcon() as React.ReactElement<any>, { size: 18, strokeWidth: 2 }) : <Command size={18} />}
                </div>
                <div className="flex flex-col truncate">
                    <span className={clsx("text-[14px] leading-tight font-semibold tracking-tight", isActive ? "text-white" : "text-gray-900 dark:text-gray-100")}>
                        {action.title}
                    </span>
                    {action.subtitle && (
                        <span className={clsx("text-[12px] leading-tight truncate mt-0.5 font-medium", isActive ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>
                            {action.subtitle}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className={clsx("text-[10px] uppercase tracking-wider font-bold opacity-60", isActive ? "text-white" : "text-gray-400")}>
                    {action.section}
                </span>
                {action.shortcut?.map(key => (
                    <kbd key={key} className={clsx(
                        "hidden group-hover:inline-block text-[11px] font-sans px-1.5 py-0.5 rounded min-w-[20px] text-center border",
                        isActive
                            ? "bg-white/20 text-white border-white/20"
                            : "bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10"
                    )}>
                        {key}
                    </kbd>
                ))}
            </div>
        </motion.li>
    );
};
