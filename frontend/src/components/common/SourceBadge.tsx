import React from 'react';
import { Info } from 'lucide-react';

interface SourceBadgeProps {
  source: string;
  timestamp: Date | string;
  authority: "REGULATORY" | "MARKET" | "INTERNAL" | string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, timestamp, authority }) => {
  const getColor = () => {
    switch(authority) {
      case "REGULATORY": return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case "INTERNAL": return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "MARKET": return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const dateStr = typeof timestamp === 'string' ? new Date(timestamp).toLocaleDateString() : timestamp.toLocaleDateString();
  
  return (
    <div className="text-xs inline-flex items-center group relative cursor-help">
      <span className={`px-2 py-1 rounded font-medium ${getColor()}`}>
        {source} • {dateStr}
      </span>
      <Info className="ml-1 w-3 h-3 text-gray-400" />
      
      {/* Simple Pure CSS Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg z-50">
        Authority Level: {authority}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};
