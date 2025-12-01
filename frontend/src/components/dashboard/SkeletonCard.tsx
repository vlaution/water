import React from 'react';

interface SkeletonCardProps {
    className?: string;
    height?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = "", height = "h-64" }) => {
    return (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse ${className}`}>
            <div className="flex justify-between items-center mb-6">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className={`w-full bg-gray-100 rounded-xl ${height}`}></div>
            <div className="mt-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
    );
};
