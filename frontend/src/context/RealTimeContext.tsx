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
        // Prevent multiple connections if one is already open or connecting
        if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        // Robust URL construction
        let baseUrl = api.baseURL || 'http://localhost:8000'; // Fallback
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
        baseUrl = baseUrl.replace(/^http/, 'ws');

        const wsUrl = `${baseUrl}/ws/market-data`;

        console.log(`[RealTime] Connecting to: ${wsUrl}`);

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            if (socket !== socketRef.current) return;
            console.log("[RealTime] Connected");
            setIsConnected(true);
            // Request initial data immediately if needed
        };

        socket.onmessage = (event) => {
            if (socket !== socketRef.current) return;
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
            } catch (e) {
                console.error("Failed to parse WebSocket message", e);
            }
        };

        socket.onclose = () => {
            // Ignore close events from old/replaced sockets
            if (socket !== socketRef.current) return;

            console.log("WebSocket disconnected");
            setIsConnected(false);
            socketRef.current = null;

            // Auto reconnect after 5s
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        socket.onerror = (error) => {
            if (socket !== socketRef.current) return;
            console.error("WebSocket error:", error);
            socket.close();
        };
    };

    const disconnect = () => {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        const socket = socketRef.current;
        if (socket) {
            // Prevent auto-reconnect logic if we are intentionally disconnecting
            socket.onclose = null;
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                socket.close();
            }
            socketRef.current = null;
            setIsConnected(false);
        }
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
