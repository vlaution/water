
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
    Layout, // Added Layout icon
    PanelLeft // Added Sidebar icon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

interface CommandControllerProps {
    setStep?: (step: any) => void;
    toggleSidebar?: () => void;
}

export const CommandController: React.FC<CommandControllerProps> = ({ setStep, toggleSidebar }) => {
    const { registerAction, unregisterAction } = useCommandRegistry();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { showToast } = useToast();
    const { theme, setTheme } = useTheme();

    // Helper to handle step changes universally
    const handleSetStep = (targetStep: string) => {
        if (setStep) {
            setStep(targetStep);
        } else {
            // If setStep is not available (we're on a sub-page), navigate to root with step in state
            navigate('/', { state: { setStep: targetStep } });
        }
    };

    // Register Actions
    useEffect(() => {
        // Navigation Actions
        const navActions = [
            {
                id: 'nav-portfolio',
                title: 'Valuation Portfolio',
                subtitle: 'View recent valuations and analytics',
                keywords: ['home', 'main', 'start'],
                section: 'Navigation',
                icon: <LayoutDashboard size={18} />,
                perform: () => handleSetStep('portfolio-home'),
                shortcut: ['g', 'd']
            },
            {
                id: 'nav-new-valuation',
                title: 'New Valuation',
                subtitle: 'Start a new DCF or comparable analysis',
                keywords: ['create', 'valuation', 'dcf', 'add'],
                section: 'Actions',
                icon: <Calculator size={18} />,
                perform: () => handleSetStep('mode-selection'),
                shortcut: ['c', 'v']
            },
            {
                id: 'nav-risk',
                title: 'Risk Dashboard',
                subtitle: 'View portfolio risk metrics',
                keywords: ['risk', 'management', 'var'],
                section: 'Navigation',
                icon: <Shield size={18} />,
                perform: () => handleSetStep('risk-dashboard'),
            },
            {
                id: 'nav-fund',
                title: 'Fund Simulator',
                subtitle: 'Simulate fund performance',
                keywords: ['fund', 'simulation', 'monte carlo'],
                section: 'Navigation',
                icon: <TrendingUp size={18} />,
                perform: () => handleSetStep('fund-simulator'),
            },
            {
                id: 'nav-deal',
                title: 'Deal Sourcing',
                subtitle: 'Find new investment opportunities',
                keywords: ['deal', 'source', 'find'],
                section: 'Navigation',
                icon: <Zap size={18} />,
                perform: () => handleSetStep('deal-sourcing'),
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
                perform: () => {
                    const next = theme === 'dark' ? 'light' : 'dark';
                    setTheme(next);
                    showToast(`Switched to ${next} mode`, "success");
                }
            },
            {
                id: 'sys-toggle-sidebar',
                title: 'Toggle Sidebar',
                subtitle: 'Expand or collapse the navigation menu',
                keywords: ['sidebar', 'menu', 'navigation', 'hide', 'show'],
                section: 'System',
                icon: <PanelLeft size={18} />,
                perform: () => {
                    if (toggleSidebar) {
                        toggleSidebar();
                    } else {
                        showToast("Sidebar can only be toggled from the Dashboard", "warning");
                    }
                }
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
                icon: <Zap className="w-4 h-4 text-yellow-500" />,
                section: 'Navigation',
                keywords: ['sensitivity', 'matrix', 'what-if', 'scenario'],
                shortcut: ['S'],
                perform: () => navigate('/sensitivity'),
            },
            {
                id: 'logout',
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
    }, [registerAction, unregisterAction, setStep, navigate, logout, showToast, theme, setTheme, toggleSidebar]);

    return null; // Logic only component
};
