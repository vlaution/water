
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType, duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto transform transition-all duration-300 ease-in-out animate-fade-in-up
              flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md
              ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : ''}
              ${toast.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-800' : ''}
            `}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                        </div>

                        <p className="flex-1 text-sm font-medium leading-tight">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
