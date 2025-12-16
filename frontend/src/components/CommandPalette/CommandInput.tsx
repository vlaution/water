import React from 'react';
import { Search } from 'lucide-react';

interface CommandInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const CommandInput: React.FC<CommandInputProps> = ({ value, onChange, placeholder = "Type a command or search..." }) => {
    return (
        <div className="flex items-center px-4 h-[52px] shrink-0">
            <Search className="w-5 h-5 text-white/50 mr-3" strokeWidth={2} />
            <input
                autoFocus
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-[17px] text-white placeholder:text-white/30 focus:outline-none font-normal tracking-wide"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            />
        </div>
    );
};
