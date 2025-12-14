import React, { useEffect } from 'react';
import { useRealTime } from '../../context/RealTimeContext';
import { useToast } from '../../context/ToastContext';

export const RealTimeAlerts: React.FC = () => {
    const { lastMessage } = useRealTime();
    const { showToast } = useToast();

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'alert' && lastMessage.data) {
            const { title, message, severity } = lastMessage.data;
            // Map 'info'/'warning' to toast types 'success'/'warning'/'error'
            // ToastContext supports: 'success' | 'error' | 'warning' | 'info'
            // Check ToastContext definition. Assuming it usually supports info/warning/success/error.
            // If severity is 'info', mapping to 'success' (blue/green usually) or checking if 'info' exists.

            // Safe mapping
            let toastType: 'success' | 'warning' | 'error' = 'warning';
            if (severity === 'error') toastType = 'error';
            if (severity === 'success') toastType = 'success';

            showToast(`${title}: ${message}`, toastType);
        }
    }, [lastMessage, showToast]);

    return null; // Headless component
};
