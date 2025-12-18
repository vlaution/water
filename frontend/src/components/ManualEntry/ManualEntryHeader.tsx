import React from 'react';
import { AISuggestionsButton } from '../common/AISuggestionsButton';

interface ManualEntryHeaderProps {
    companyName: string;
    isLoading: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onSubmit: () => void;
}

export const ManualEntryHeader: React.FC<ManualEntryHeaderProps> = ({
    companyName,
    isLoading,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onSubmit
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Valuation Analysis</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Configure parameters for {companyName || 'Target Company'}</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onUndo} disabled={!canUndo}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                    title="Undo"
                >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                </button>
                <button
                    onClick={onRedo} disabled={!canRedo}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                    title="Redo"
                >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 01-8 8v2M21 10l-6 6m0-6l-6-6" /></svg>
                </button>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

                <AISuggestionsButton
                    suggestions={null}
                    onApplyAll={() => { }}
                    onReview={() => { }}
                    isLoading={false}
                />

                <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    className="glass-button-primary px-6 py-2.5 shadow-lg shadow-blue-500/20"
                >
                    {isLoading ? 'Processing...' : 'Calculate Valuation'}
                </button>
            </div>
        </div>
    );
};
