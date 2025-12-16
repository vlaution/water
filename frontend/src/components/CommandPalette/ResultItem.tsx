import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Action } from '../../types/commandPalette';
import { Globe, Command, Calculator, FileText } from 'lucide-react';
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
            default: return <Command size={18} />;
        }
    }

    return (
        <motion.li
            ref={ref}
            layout // for smooth list reordering
            onClick={onSelect}
            onMouseEnter={onMouseEnter}
            className={clsx(
                "cursor-pointer px-4 h-[48px] flex items-center justify-between rounded-xl transition-all duration-200",
                isActive
                    ? "text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-0.5 ring-white/10"
                    : "text-white/60 hover:bg-white/5"
            )}
            style={{
                background: isActive ? "rgba(255, 255, 255, 0.15)" : "transparent",
                backdropFilter: isActive ? "blur(12px)" : "none",
            }}
        >
            <div className="flex items-center gap-3.5 overflow-hidden">
                <div className={clsx(
                    "flex items-center justify-center transition-opacity",
                    isActive ? "text-white opacity-100" : "text-white/50 opacity-70"
                )}>
                    {React.cloneElement(getIcon() as React.ReactElement<any>, { size: 18, strokeWidth: 2 })}
                </div>
                <div className="flex flex-col truncate">
                    <span className={clsx("text-[15px] leading-tight font-medium tracking-tight", isActive ? "text-white" : "text-white/80")}>
                        {action.title}
                    </span>
                    {action.subtitle && (
                        <span className="text-[12px] leading-tight text-white/40 truncate mt-0.5 font-normal">
                            {action.subtitle}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {action.shortcut?.map(key => (
                    <kbd key={key} className={clsx(
                        "hidden group-hover:inline-block text-[11px] font-sans px-1.5 py-0.5 rounded bg-white/10 text-white/50 min-w-[20px] text-center",
                        isActive && "!inline-block text-white/70 bg-white/20"
                    )}>
                        {key}
                    </kbd>
                ))}
                {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] ml-2"></span>
                )}
            </div>
        </motion.li>
    );
};
