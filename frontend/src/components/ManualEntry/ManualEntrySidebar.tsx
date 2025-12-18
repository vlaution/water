import React from 'react';
import { CompanyInputPanel } from './CompanyInputPanel';

interface ManualEntrySidebarProps {
    formData: any;
    setFormData: (data: any) => void;
    activeMethod: string;
    setActiveMethod: (method: any) => void;
    token?: string | null;
}

export const ManualEntrySidebar: React.FC<ManualEntrySidebarProps> = ({
    formData,
    setFormData,
    activeMethod,
    setActiveMethod,
    token
}) => {

    // Helper to render Icons
    const renderIcon = (iconName: string, isActive: boolean) => {
        const className = `w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`;

        switch (iconName) {
            case 'chart': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
            case 'cash': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'building': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
            case 'deal': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
            case 'lock': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
            case 'cube': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-8-4v-10l8 4m0 0v10" /></svg>;
            case 'scale': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
            default: return null;
        }
    };

    const methods = [
        { id: 'dcf', label: 'DCF (Unlevered)', icon: 'chart' },
        { id: 'fcfe', label: 'DCF (Levered / FCFE)', icon: 'cash' },
        { id: 'gpc', label: 'Public Comps (GPC)', icon: 'building' },
        { id: 'precedent', label: 'Precedent Transactions', icon: 'deal' },
        { id: 'lbo', label: 'LBO Analysis', icon: 'lock' },
        { id: 'anav', label: 'Net Asset Value', icon: 'cube' },
        { id: 'weights', label: 'Method Weights', icon: 'scale' },
    ];

    return (
        <div className="lg:col-span-1 space-y-4">
            <CompanyInputPanel
                formData={formData}
                setFormData={setFormData}
                token={token}
            />

            <nav className="space-y-1">
                {methods.map((method) => {
                    const isActive = activeMethod === method.id;
                    return (
                        <button
                            key={method.id}
                            onClick={() => setActiveMethod(method.id)}
                            className={`
                                w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-system-blue text-white shadow-lg shadow-blue-500/30 translate-x-1'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:translate-x-1 hover:text-gray-900 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            <span className="mr-3">
                                {renderIcon(method.icon, isActive)}
                            </span>
                            {method.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
