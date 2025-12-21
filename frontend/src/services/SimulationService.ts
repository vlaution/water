import { api } from '../config/api';

export interface SimulationSummary {
  period_analyzed: string;
  total_datapoints: number;
  total_decisions_fired: number;
  breakdown_by_severity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  signal_breakdown: Record<string, number>;
}

export interface KeyFinding {
  year: number;
  exporter: string;
  signal: string;
  insight: string;
  actions: string[];
}

export interface CounterfactualOutcome {
  probability: number;
  impact: string;
}

export interface Counterfactual {
  summary: string;
  most_likely: CounterfactualOutcome;
  all_outcomes: CounterfactualOutcome[];
  source: string;
  time_horizon: string;
}

export interface DetailedDecision {
  decision_id: string;
  signal: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  why_now: string[];
  actions: string[];
  confidence: number;
  timestamp: string;
  counterfactual?: Counterfactual;
}

export interface LeadTimeEntry {
  decision_id: string;
  signal: string;
  entity: string;
  first_fired: string;
  real_world_event: string;
  event_date: string;
  lead_time_days: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface LeadTimeAnalysis {
  description: string;
  generated_at: string;
  top_lead_times: LeadTimeEntry[];
}

export interface PrecisionEntry {
  signal: string;
  fired: number;
  confirmed: number;
  false_positive_rate: number;
  trust_level: string;
  recommended_action: string;
}

export interface PrecisionAnalysis {
  description: string;
  generated_at: string;
  calibration_matrix: PrecisionEntry[];
  status: string;
}

export interface HistoricalSimulationReport {
  simulation_summary: SimulationSummary;
  key_findings: KeyFinding[];
  detailed_decisions: DetailedDecision[];
  lead_time_analysis?: LeadTimeAnalysis;
  precision_analysis?: PrecisionAnalysis;
}

export const SimulationService = {
  getReport: async (): Promise<HistoricalSimulationReport> => {
    const response = await fetch(api.url('/api/reports/historical-simulation'), {
        headers: {
            // Add auth headers if needed, using a helper or context
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch simulation report: ${response.statusText}`);
    }
    return response.json();
  }
};
