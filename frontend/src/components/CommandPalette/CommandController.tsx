
import React, { useEffect } from 'react';
import { useCommandRegistry } from '../../context/CommandRegistryContext';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calculator,
    TrendingUp,
    Zap,
    Shield,
    LogOut,
    Moon,
    Layout // Added Layout icon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CommandControllerProps {
    setStep: (step: any) => void;
}

export const CommandController: React.FC<CommandControllerProps> = ({ setStep }) => {
    const { registerAction, unregisterAction } = useCommandRegistry();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { showToast } = useToast();



    // Register Actions
    useEffect(() => {
        // Navigation Actions
        const navActions = [
            {
                id: 'nav-dashboard',
                title: 'Go to Dashboard',
                subtitle: 'View recent valuations and analytics',
                keywords: ['home', 'main', 'start'],
                section: 'Navigation',
                icon: <LayoutDashboard size={18} />,
                perform: () => setStep('dashboard-home'),
                shortcut: ['g', 'd']
            },
            {
                id: 'nav-new-valuation',
                title: 'New Valuation',
                subtitle: 'Start a new DCF or comparable analysis',
                keywords: ['create', 'valuation', 'dcf', 'add'],
                section: 'Actions',
                icon: <Calculator size={18} />,
                perform: () => setStep('mode-selection'),
                shortcut: ['c', 'v']
            },
            {
                id: 'nav-risk',
                title: 'Risk Dashboard',
                subtitle: 'View portfolio risk metrics',
                keywords: ['risk', 'management', 'var'],
                section: 'Navigation',
                icon: <Shield size={18} />,
                perform: () => setStep('risk-dashboard'),
            },
            {
                id: 'nav-fund',
                title: 'Fund Simulator',
                subtitle: 'Simulate fund performance',
                keywords: ['fund', 'simulation', 'monte carlo'],
                section: 'Navigation',
                icon: <TrendingUp size={18} />,
                perform: () => setStep('fund-simulator'),
            },
            {
                id: 'nav-deal',
                title: 'Deal Sourcing',
                subtitle: 'Find new investment opportunities',
                keywords: ['deal', 'source', 'find'],
                section: 'Navigation',
                icon: <Zap size={18} />,
                perform: () => setStep('deal-sourcing'),
            },
        ];

        // System Actions
        const systemActions = [
            {
                id: 'sys-toggle-theme',
                title: 'Toggle Dark Mode',
                subtitle: 'Switch between light and dark themes',
                keywords: ['dark', 'light', 'theme', 'mode'],
                section: 'System',
                icon: <Moon size={18} />,
                perform: () => showToast("Theme toggled (Simulation)", "success")
            },
            {
                id: 'compare-view',
                title: 'Compare Valuations',
                subtitle: 'Open Side-by-Side Analysis',
                icon: <Layout className="w-4 h-4" />,
                section: 'Navigation',
                shortcut: ['C'],
                perform: () => navigate('/compare'),
            },
            {
                id: 'nav-sensitivity',
                title: 'Sensitivity 2.0',
                subtitle: 'Pro-grade Scenario Analysis',
                icon: <Zap className="w-4 h-4 text-yellow-500" />, // Use confirmed existing icon to be safe
                section: 'Navigation',
                keywords: ['sensitivity', 'matrix', 'what-if', 'scenario'],
                shortcut: ['S'],
                perform: () => navigate('/sensitivity'),
            },
            {
                id: 'logout', // Changed from 'sys-logout'
                title: 'Log Out',
                subtitle: 'Sign out of your account',
                keywords: ['sign out', 'exit', 'leave'],
                section: 'System',
                icon: <LogOut size={18} />,
                perform: () => logout()
            }
        ];

        // Admin Actions
        const adminActions = [
            {
                id: 'adm-perf',
                title: 'Performance Analytics',
                subtitle: 'View system performance metrics',
                keywords: ['admin', 'performance', 'stats'],
                section: 'Admin',
                icon: <TrendingUp size={18} />,
                perform: () => navigate('/admin/performance')
            },
            {
                id: 'adm-health',
                title: 'System Health',
                subtitle: 'Monitor system status',
                keywords: ['admin', 'health', 'status'],
                section: 'Admin',
                icon: <Zap size={18} />,
                perform: () => navigate('/admin/health')
            }
        ];


        [...navActions, ...systemActions, ...adminActions].forEach(registerAction);

        return () => {
            [...navActions, ...systemActions, ...adminActions].forEach(a => unregisterAction(a.id));
        };
    }, [registerAction, unregisterAction, setStep, navigate, logout, showToast]);

    return null; // Logic only component
};
