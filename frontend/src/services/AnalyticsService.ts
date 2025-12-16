import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SensitivityRequest {
    lbo_input: any; // Using any for LBOInput to avoid duplicating complex types here for now
    row_config: { variable: string, label: string, range: number[] };
    col_config: { variable: string, label: string, range: number[] };
    output_metric: "irr" | "moic";
}

export interface SensitivityResult {
    row_label: string;
    col_label: string;
    row_values: number[];
    col_values: number[];
    matrix: { row_value: number, values: (number | null)[] }[];
}

export const AnalyticsService = {
    async runSensitivityAnalysis(request: SensitivityRequest): Promise<SensitivityResult> {
        const response = await axios.post(`${API_URL}/api/analytics/sensitivity`, request);
        return response.data;
    }
};

// Legacy analytics logger for backward compatibility with other hooks/components
export const analytics = {
    log: (eventType: string, field?: string, payload?: Record<string, any>) => {
        console.log(`[Analytics] ${eventType}`, { field, ...payload });
        // In production, this would send to an analytics backend
    }
};

