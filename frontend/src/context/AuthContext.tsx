import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../config/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    demoLogin: () => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
            loadUser(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async (authToken: string) => {
        try {
            const response = await fetch(api.url(api.endpoints.auth.me), {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setToken(authToken);
            } else {
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            localStorage.removeItem('auth_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await fetch(api.url(api.endpoints.auth.login), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        setUser(data.user);
        setToken(data.access_token);
        localStorage.setItem('auth_token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
    };

    const demoLogin = async () => {
        const response = await fetch(api.url('/auth/demo-login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Demo login failed');
        }

        const data = await response.json();
        setUser(data.user);
        setToken(data.access_token);
        localStorage.setItem('auth_token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        const response = await fetch(api.url(api.endpoints.auth.signup), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, full_name: name })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Signup failed');
        }

        const data = await response.json();
        setUser(data.user);
        setToken(data.access_token);
        localStorage.setItem('auth_token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, demoLogin, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
