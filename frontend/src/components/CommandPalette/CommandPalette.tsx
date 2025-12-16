import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCommandRegistry } from '../../context/CommandRegistryContext';
import { CommandInput } from './CommandInput';
import { ResultItem } from './ResultItem';


export const CommandPalette: React.FC = () => {
    const { isOpen, setIsOpen, boostAction, query, setQuery, results } = useCommandRegistry();
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, isOpen]);

    // Handle Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    const action = results[selectedIndex];
                    action.perform();
                    boostAction(action.id);
                    setIsOpen(false);
                    setQuery('');
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, boostAction, setIsOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start justify-center pt-[15vh]"
                    >
                        {/* Modal Container: Premium Dark Glass */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-[640px] rounded-2xl overflow-hidden flex flex-col max-h-[600px] shadow-2xl ring-1 ring-white/20"
                            style={{
                                background: "rgba(30, 30, 30, 0.60)", // Dark glass base
                                backdropFilter: "blur(24px) saturate(180%)",
                                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
                            }}
                        >
                            <div className="p-3 pb-0">
                                <CommandInput value={query} onChange={setQuery} />
                            </div>

                            <div className="flex flex-col overflow-hidden min-h-[100px] p-3">
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {results.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                            <p className="text-sm font-medium opacity-60">No results found</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-1">
                                            {results.map((action, index) => (
                                                <ResultItem
                                                    key={action.id}
                                                    action={action}
                                                    isActive={index === selectedIndex}
                                                    onSelect={() => {
                                                        action.perform();
                                                        boostAction(action.id);
                                                        setIsOpen(false);
                                                    }}
                                                    onMouseEnter={() => setSelectedIndex(index)}
                                                />
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Minimal Footer */}
                            <div className="px-5 py-3 flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 bg-white/5 backdrop-blur-[4px]">
                                <div className="flex gap-4">
                                    <span className="opacity-70">Search Projects, Actions, and Teams</span>
                                </div>
                                <div className="flex gap-3 text-white/40">
                                    <span className="flex items-center gap-1">Select <kbd className="font-sans">↵</kbd></span>
                                    <span className="flex items-center gap-1">Navigate <kbd className="font-sans">↑↓</kbd></span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
