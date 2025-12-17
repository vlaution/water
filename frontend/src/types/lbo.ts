export interface DebtTranche {
    name: string;
    amount: number | undefined;
    leverage_multiple: number | undefined;
    interest_rate: number;
    cash_interest: boolean;
    amortization_rate: number;
    maturity: number;
    mandatory_cash_sweep_priority: number;
    auto_update_rate?: boolean;
}

export interface RefinancingConfig {
    enabled: boolean;
    refinance_year: number;
    new_interest_rate: number;
    refinance_amount_pct: number;
    penalty_fee_percent: number;
}

export interface CovenantRule {
    covenant_type: 'max_debt_ebitda' | 'min_interest_coverage';
    limit: number;
    start_year: number;
    end_year: number;
}

export interface MIPConfig {
    option_pool_percent: number;
    strike_price_discount: number;
    vesting_period: number;
    cliff_years: number;
}

export interface TaxConfig {
    enable_nol: boolean;
    initial_nol_balance: number;
    nol_annual_limit: number;
    interest_deductibility_cap: number;
    step_up_percent?: number;
    depreciation_years?: number;
}


export interface LBOInputState {
    solve_for: 'entry_price' | 'target_irr' | 'exit_multiple' | 'moic' | 'optimal_refinancing';
    entry_revenue: number;
    entry_ebitda: number;
    entry_ev_ebitda_multiple: number | undefined;
    target_irr: number | undefined;
    financing: {
        tranches: DebtTranche[];
        total_leverage_ratio: number | undefined;
        equity_contribution_percent: number | undefined;
    };
    assumptions: {
        transaction_fees_percent: number;
        synergy_benefits: number;
        hurdle_rate?: number;
        carry_percent?: number;
        catchup_active?: boolean;
    };
    revenue_growth_rate: number;
    ebitda_margin: number;
    capex_percentage: number;
    nwc_percentage: number;
    tax_rate: number;
    holding_period: number;
    exit_ev_ebitda_multiple: number | undefined;
    // Advanced
    refinancing_config?: RefinancingConfig;
    covenants?: CovenantRule[];
    mip_assumptions?: MIPConfig;
    tax_assumptions?: TaxConfig;
    sector?: string;
}

export interface BenchmarkData {
    ev_ebitda: { mean: number; min: number; max: number };
    leverage: { mean: number; max: number };
    irr: { mean: number; median: number };
    success_rate: number;
    count: number;
}
