import React, { useState, useEffect } from 'react';
import { Search, Moon, LayoutDashboard, Activity, LogOut, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface CommandItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
    category: 'Navigation' | 'System' | 'Admin';
}

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0); // Track selection
    const navigate = useNavigate();

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, isOpen]);

    // Commands Registry
    const commands: CommandItem[] = [
        {
            id: 'home',
            label: 'Go to Dashboard',
            icon: <LayoutDashboard size={14} />,
            category: 'Navigation',
            action: () => navigate('/', { state: { setStep: 'dashboard' } })
        },
        {
            id: 'new-valuation',
            label: 'New Valuation',
            icon: <FileText size={14} />,
            category: 'Navigation',
            shortcut: '⌘N',
            action: () => navigate('/', { state: { setStep: 'mode-selection' } })
        },
        { id: 'sensitivity', label: 'Sensitivity Analysis (Pro)', icon: <Activity size={14} />, category: 'Navigation', shortcut: 'S', action: () => navigate('/sensitivity') },
        { id: 'compare', label: 'Comparison Engine', icon: <FileText size={14} />, category: 'Navigation', action: () => navigate('/compare') },

        { id: 'theme', label: 'Toggle Dark Mode', icon: <Moon size={14} />, category: 'System', shortcut: '⌘D', action: () => console.log('Theme Toggled') },
        { id: 'logout', label: 'Log Out', icon: <LogOut size={14} />, category: 'System', action: () => console.log('Logout') },

        { id: 'health', label: 'System Health Check', icon: <Activity size={14} />, category: 'Admin', action: () => alert('Systems Nominal. Latency: 12ms') },
    ];

    const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

    // Key Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (!isOpen) return;

            if (e.key === 'Escape') setIsOpen(false);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filtered.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    filtered[selectedIndex].action();
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filtered, selectedIndex]);

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
                        className="relative w-full max-w-lg bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Search Bar */}
                        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
                            <Search className="text-gray-500" size={18} />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                            />
                            <div className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400 font-mono">ESC</div>
                        </div>

                        {/* List */}
                        <div className="max-h-[300px] overflow-y-auto py-2">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-500 text-sm">No results found.</div>
                            ) : (
                                <div className="flex flex-col gap-1 px-2">
                                    {/* Group by Category logic omitted for brevity, just plain list */}
                                    {filtered.map((cmd, i) => (
                                        <button
                                            key={cmd.id}
                                            onClick={() => { cmd.action(); setIsOpen(false); }}
                                            onMouseEnter={() => setSelectedIndex(i)} // Sync mouse hover
                                            className={`
                                                flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left group
                                                ${i === selectedIndex ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/5'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                {cmd.icon}
                                                <span>{cmd.label}</span>
                                            </div>
                                            {cmd.shortcut && (
                                                <span className={`text-[10px] font-mono ${i === selectedIndex ? 'text-blue-200' : 'text-gray-500'}`}>
                                                    {cmd.shortcut}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-2 bg-black/20 border-t border-white/5 text-[10px] text-gray-500 flex justify-between">
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
