import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandRegistry } from '../../context/CommandRegistryContext';
import { ResultItem } from './ResultItem';

export const CommandPalette: React.FC = () => {
    // Connect to Registry
    const {
        isOpen,
        setIsOpen,
        query,
        setQuery,
        results,
        boostAction
    } = useCommandRegistry();

    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection when query changes or when opening
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, isOpen]);

    // Key Handler for Navigation within the open palette
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const selected = results[selectedIndex];
                if (selected) {
                    selected.perform();
                    boostAction(selected.id);
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, setIsOpen, boostAction]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-lg glass-panel overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Search Bar */}
                        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-white/10 gap-3">
                            <Search className="text-gray-400 dark:text-gray-500" size={18} />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm"
                            />
                            <div className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[10px] text-gray-500 dark:text-gray-400 font-mono">ESC</div>
                        </div>

                        {/* List */}
                        <div className="max-h-[350px] overflow-y-auto py-2 px-2 scrollbar-hide">
                            {results.length === 0 ? (
                                <div className="px-4 py-12 text-center">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                        <Search size={20} />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                        {query ? 'No matching commands found.' : 'Type a command to start...'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="flex flex-col">
                                    {results.map((cmd, i) => (
                                        <ResultItem
                                            key={cmd.id}
                                            action={cmd}
                                            isActive={i === selectedIndex}
                                            onSelect={() => {
                                                cmd.perform();
                                                boostAction(cmd.id);
                                                setIsOpen(false);
                                            }}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="px-4 py-2 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-white/5 text-[10px] text-gray-500 flex justify-between">
                            <span>Semantic OS v2.1</span>
                            <div className="flex gap-2">
                                <span>↑↓ to navigate</span>
                                <span>↵ to select</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
