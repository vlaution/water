import React from 'react';

interface ModeSelectionProps {
    onSelectMode: (mode: 'upload' | 'manual' | 'dashboard') => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
    return (
        <div className="max-w-4xl mx-auto mt-20 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Choose Your Workflow</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Upload Mode Card */}
                <button
                    onClick={() => onSelectMode('upload')}
                    className="group relative p-8 bg-white/60 rounded-3xl border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-left"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Excel</h3>
                        <p className="text-gray-500">
                            Upload your existing valuation model. We'll parse the sheets and run the numbers for you.
                        </p>
                    </div>
                </button>

                {/* Manual Mode Card */}
                <button
                    onClick={() => onSelectMode('manual')}
                    className="group relative p-8 bg-white/60 rounded-3xl border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-left"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Entry</h3>
                        <p className="text-gray-500">
                            Input your historicals and assumptions directly into our interactive form.
                        </p>
                    </div>
                </button>

                {/* Dashboard Mode Card */}
                <button
                    onClick={() => onSelectMode('dashboard')}
                    className="group relative p-8 bg-white/60 rounded-3xl border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-left md:col-span-2 lg:col-span-1"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard</h3>
                        <p className="text-gray-500">
                            View your valuation history, compare runs, and manage your portfolio.
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
};
