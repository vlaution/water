import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ComparisonProject, ValuationNode } from '../types/comparison';

// --- Plugin Architecture ---
export interface AnalysisPlugin {
    id: string;
    label: string;
    component: React.FC<{ data: ValuationNode }>; // Simplified for now
    isApplicable: (data: ValuationNode) => boolean;
}

// --- Context Definition ---
interface ComparisonContextType {
    project: ComparisonProject | null;
    loadProject: (project: ComparisonProject) => void;

    // Plugin Registry
    registerPlugin: (plugin: AnalysisPlugin) => void;
    availablePlugins: AnalysisPlugin[];

    // Settings
    setCommonSizeMode: (mode: 'revenue' | 'ebitda' | 'none') => void;

    // Interaction
    hoveredMetricId: string | null;
    setHoveredMetricId: (id: string | null) => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [project, setProject] = useState<ComparisonProject | null>(null);
    const [plugins, setPlugins] = useState<AnalysisPlugin[]>([]);
    const [hoveredMetricId, setHoveredMetricId] = useState<string | null>(null);

    const loadProject = useCallback((newProject: ComparisonProject) => {
        setProject(newProject);
    }, []);

    const registerPlugin = useCallback((plugin: AnalysisPlugin) => {
        setPlugins(prev => {
            if (prev.find(p => p.id === plugin.id)) return prev;
            return [...prev, plugin];
        });
    }, []);

    const setCommonSizeMode = useCallback((mode: 'revenue' | 'ebitda' | 'none') => {
        setProject(prev => prev ? ({ ...prev, settings: { ...prev.settings, commonSizeMode: mode } }) : null);
    }, []);

    return (
        <ComparisonContext.Provider value={{
            project,
            loadProject,
            registerPlugin,
            availablePlugins: plugins,
            setCommonSizeMode,
            hoveredMetricId,
            setHoveredMetricId
        }}>
            {children}
        </ComparisonContext.Provider>
    );
};

export const useComparison = () => {
    const context = useContext(ComparisonContext);
    if (!context) throw new Error("useComparison must be used within ComparisonProvider");
    return context;
};
