import React, { useEffect } from 'react';
import { ComparisonProvider, useComparison } from '../context/ComparisonContext';
import { ComparisonGrid } from '../components/Comparison/ComparisonGrid';
import type { ComparisonProject } from '../types/comparison';
import { SummaryPlugin } from '../components/Comparison/plugins/SummaryPlugin';
import { FinancialsPlugin } from '../components/Comparison/plugins/FinancialsPlugin';
import { DCFPlugin } from '../components/Comparison/plugins/DCFPlugin';

// Main Page wrapper
const ComparisonContent: React.FC = () => {
    const { project, loadProject, registerPlugin, setCommonSizeMode } = useComparison();

    // Register Plugins
    useEffect(() => {
        registerPlugin(SummaryPlugin);
        registerPlugin(FinancialsPlugin);
        registerPlugin(DCFPlugin);
    }, [registerPlugin]);

    // Load Mock Data
    useEffect(() => {
        const mockProject: ComparisonProject = {
            id: 'proj_001',
            title: 'SaaS Valuation Comp',
            settings: { currency: 'USD', baseSlotId: 'AAPL' },
            slots: [
                {
                    id: 'AAPL',
                    name: 'Apple Inc.',
                    color: '#60A5FA', // Blue
                    data: { id: 'root_aapl', label: 'Root', type: 'group', value: 0 }
                },
                {
                    id: 'MSFT',
                    name: 'Microsoft',
                    color: '#34D399', // Green
                    data: { id: 'root_msft', label: 'Root', type: 'group', value: 0 }
                },
                {
                    id: 'GOOGL',
                    name: 'Alphabet',
                    color: '#F87171', // Red
                    data: { id: 'root_googl', label: 'Root', type: 'group', value: 0 }
                }
            ]
        };
        loadProject(mockProject);
    }, [loadProject]);

    if (!project) return <div className="text-white p-10">Loading Project...</div>;

    return (
        <div className="flex flex-col h-screen w-full bg-[#050505] text-white">
            {/* Toolbar / Header */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-black/40 backdrop-blur-md">
                <h1 className="text-lg font-semibold tracking-tight">{project.title}</h1>
                <div className="ml-auto flex gap-4 text-sm text-gray-400">
                    <button
                        onClick={() => setCommonSizeMode(project.settings.commonSizeMode === 'none' ? 'revenue' : 'none')}
                        className={`transition-colors ${project.settings.commonSizeMode !== 'none' ? 'text-blue-400' : 'hover:text-white'}`}
                    >
                        {project.settings.commonSizeMode !== 'none' ? 'Common Size: ON' : 'Common Size: OFF'}
                    </button>
                    <span>Currency: {project.settings.currency}</span>
                    <button className="hover:text-white transition-colors">Settings</button>
                    <button className="hover:text-white transition-colors">Export</button>
                </div>
            </div>

            {/* Stage Manager Grid */}
            <ComparisonGrid slots={project.slots} />
        </div>
    );
};

// Route Entry Point
export const ComparisonPage: React.FC = () => {
    return (
        <ComparisonProvider>
            <ComparisonContent />
        </ComparisonProvider>
    );
};
