import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from '../config/api';

interface RealTimeContextType {
    isConnected: boolean;
    lastMessage: any;
    connect: () => void;
    disconnect: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const connect = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        // Robust URL construction
        let baseUrl = api.baseURL || 'http://localhost:8000'; // Fallback
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
        baseUrl = baseUrl.replace(/^http/, 'ws');

        const wsUrl = `${baseUrl}/ws/market-data`;

        console.log(`[RealTime] Connecting to: ${wsUrl}`);

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("[RealTime] Connected");
            setIsConnected(true);
            // Request initial data immediately if needed
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
            } catch (e) {
                console.error("Failed to parse WebSocket message", e);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
            socketRef.current = null;

            // Auto reconnect after 5s
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            socket.close();
        };

        socketRef.current = socket;
    };

    const disconnect = () => {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        socketRef.current?.close();
    };

    useEffect(() => {
        connect();
        return () => disconnect();
    }, []);

    return (
        <RealTimeContext.Provider value={{ isConnected, lastMessage, connect, disconnect }}>
            {children}
        </RealTimeContext.Provider>
    );
};

export const useRealTime = () => {
    const context = useContext(RealTimeContext);
    if (context === undefined) {
        throw new Error('useRealTime must be used within a RealTimeProvider');
    }
    return context;
};
