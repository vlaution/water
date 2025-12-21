use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum LBOSolverMode {
    EntryPrice,
    TargetIrr,
    ExitMultiple,
    Moic,
    OptimalRefinancing,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DebtType {
    Senior,
    Mezzanine,
    Exchangeable,
    PreferredEquity,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DebtTranche {
    pub name: String,
    pub amount: Option<f64>,
    pub leverage_multiple: Option<f64>,
    pub interest_rate: f64,
    pub cash_interest: bool,
    pub amortization_rate: f64,
    pub maturity: i32,
    pub mandatory_cash_sweep_priority: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RefinancingConfig {
    pub enabled: bool,
    pub refinance_year: i32,
    pub new_interest_rate: f64,
    pub refinance_amount_pct: f64,
    pub penalty_fee_percent: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CovenantType {
    MaxDebtEbitda,
    MinInterestCoverage,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CovenantRule {
    pub covenant_type: CovenantType,
    pub limit: f64,
    pub start_year: i32,
    pub end_year: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MIPTranche {
    pub name: String,
    pub allocation_percent: f64,
    pub vesting_type: String,
    pub vesting_period_years: f64,
    pub cliff_years: f64,
    pub performance_target_moic: Option<f64>,
    pub strike_price: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MIPConfig {
    pub option_pool_percent: f64,
    pub strike_price_discount: f64,
    pub vesting_period: i32,
    pub cliff_years: i32,
    #[serde(default)]
    pub tranches: Vec<MIPTranche>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TaxConfig {
    pub enable_nol: bool,
    pub initial_nol_balance: f64,
    pub nol_annual_limit: f64,
    pub interest_deductibility_cap: f64,
    pub step_up_percent: f64,
    pub depreciation_years: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LBOFinancing {
    pub tranches: Vec<DebtTranche>,
    pub total_leverage_ratio: Option<f64>,
    pub equity_contribution_percent: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LBOAssumptions {
    pub transaction_fees_percent: f64,
    pub synergy_benefits: f64,
    pub hurdle_rate: f64,
    pub carry_percent: f64,
    pub catchup_active: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LBOInput {
    pub solve_for: LBOSolverMode,
    pub entry_revenue: f64,
    pub entry_ebitda: f64,
    pub entry_ev_ebitda_multiple: Option<f64>,
    pub financing: LBOFinancing,
    pub assumptions: LBOAssumptions,
    pub revenue_growth_rate: f64,
    pub ebitda_margin: f64,
    pub capex_percentage: f64,
    pub nwc_percentage: f64,
    pub tax_rate: f64,
    pub holding_period: i32,
    pub exit_ev_ebitda_multiple: Option<f64>,
    pub target_irr: Option<f64>,
    #[serde(default)]
    pub include_sensitivity: bool,
    pub refinancing_config: Option<RefinancingConfig>,
    #[serde(default)]
    pub covenants: Vec<CovenantRule>,
    pub mip_assumptions: Option<MIPConfig>,
    pub tax_assumptions: Option<TaxConfig>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LBOResult {
    pub irr: f64,
    pub moic: f64,
    pub entry_valuation: f64,
    pub exit_valuation: f64,
    pub equity_check: f64,
    pub created_at_ms: f64, 
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct FundModel {
    pub name: String,
    pub vintage_year: i32,
    pub committed_capital: f64,
    pub management_fee: f64,
    pub carried_interest: f64,
    pub hurdle_rate: f64,
    pub fund_term_years: i32,
    pub investment_period_years: i32,
}

#[derive(Serialize, Deserialize)]
pub struct FundStrategy {
    pub target_deal_count: i32,
    pub min_deal_size: f64,
    pub max_deal_size: f64,
    pub target_sectors: Vec<String>,
    pub target_irr_mean: f64,
    pub target_irr_std_dev: f64,
    pub hold_period_mean: f64,
    pub hold_period_std_dev: f64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CashFlow {
    pub year: i32,
    pub amount: f64,
    pub type_: String,
}

#[derive(Serialize, Deserialize)]
pub struct FundReturns {
    pub net_irr: f64,
    pub tvpi: f64,
    pub dpi: f64,
    pub moic: f64,
    pub cash_flows: Vec<CashFlow>,
    pub gross_returns: f64,
    pub total_invested: f64,
    pub total_distributed: f64,
    pub total_value: f64,
}

struct Deal {
    entry_year: i32,
    exit_year: i32,
    #[allow(dead_code)]
    investment: f64,
    exit_value: f64,
}

#[derive(Serialize, Deserialize)]
pub struct MonteCarloParams {
    pub mean: f64,
    pub std_dev: f64,
    pub iterations: i32,
}

#[derive(Serialize, Deserialize)]
pub struct MonteCarloResult {
    pub p10: f64,
    pub p50: f64,
    pub p90: f64,
}

// Simple LCG RNG
struct Rng {
    state: u64,
}

impl Rng {
    fn new(seed: u64) -> Self {
        Rng { state: seed }
    }

    fn next_f64(&mut self) -> f64 {
        // Simple LCG
        self.state = self.state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        let x = self.state >> 11;
        (x as f64) * 1.1102230246251565e-16
    }

    fn sample_normal(&mut self, mean: f64, std_dev: f64) -> f64 {
        let u1 = self.next_f64();
        let u2 = self.next_f64();
        let u1 = if u1 < 1e-10 { 1e-10 } else { u1 };
        
        // Added 1e-10 to prevent Infnity from ln(0)
        let r = (-2.0 * u1.ln()).sqrt();
        let theta = 2.0 * std::f64::consts::PI * u2;
        
        mean + (r * theta.cos() * std_dev)
    }
}

#[wasm_bindgen]
pub fn run_fund_simulation(fund_val: JsValue, strategy_val: JsValue) -> JsValue {
    // Deterministic seed for consistency or use Date in JS to pass seed
    let mut rng = Rng::new(12345);
    
    let fund: FundModel = serde_wasm_bindgen::from_value(fund_val).unwrap();
    let strategy: FundStrategy = serde_wasm_bindgen::from_value(strategy_val).unwrap();
    
    // 1. Generate Deals
    let mut deals: Vec<Deal> = Vec::new();
    let mut capital_deployed = 0.0;
    
    for _ in 0..strategy.target_deal_count {
        if capital_deployed >= fund.committed_capital {
            break;
        }
        
        let r_size = rng.next_f64();
        let mut size: f64 = strategy.min_deal_size + r_size * (strategy.max_deal_size - strategy.min_deal_size);
        
        if capital_deployed + size > fund.committed_capital {
            size = fund.committed_capital - capital_deployed;
        }
        
        let r_entry = rng.next_f64();
        let entry_year_offset = (r_entry * (fund.investment_period_years as f64)).floor() as i32;
        let entry_year = 1 + entry_year_offset;
        
        let hold_period_float = rng.sample_normal(strategy.hold_period_mean, strategy.hold_period_std_dev);
        let hold_period: i32 = std::cmp::max(1, hold_period_float as i32);
        
        let mut exit_year = entry_year + hold_period;
        if exit_year > fund.fund_term_years {
            exit_year = fund.fund_term_years;
        }
        
        let deal_irr = rng.sample_normal(strategy.target_irr_mean, strategy.target_irr_std_dev);
        let moic = (1.0 + deal_irr).powf((exit_year - entry_year) as f64);
        let exit_value = size * moic;
        
        deals.push(Deal {
            entry_year,
            exit_year,
            investment: size,
            exit_value,
        });
        
        capital_deployed += size;
    }
    
    // 2. Aggregate Flows
    let max_years = (fund.fund_term_years + 2) as usize;
    let mut raw_flows = vec![0.0; max_years];
    
    for deal in &deals {
        if (deal.entry_year as usize) < max_years {
            raw_flows[deal.entry_year as usize] -= deal.investment;
        }
        if (deal.exit_year as usize) < max_years {
            raw_flows[deal.exit_year as usize] += deal.exit_value;
        }
    }
    
    // 3. Waterfall
    let mut final_flows: Vec<CashFlow> = Vec::new();
    let mut total_invested = 0.0;
    let mut total_distributed = 0.0;
    let mut gross_distributions = 0.0;
    let mut unreturned_capital = 0.0;
    let mut accrued_pref = 0.0;
    
    for year in 1..fund.fund_term_years + 2 {
        let raw_amount = if (year as usize) < max_years { raw_flows[year as usize] } else { 0.0 };
        
        let fee = fund.committed_capital * fund.management_fee;
        let investment_call = if raw_amount < 0.0 { -raw_amount } else { 0.0 };
        let distribution = if raw_amount > 0.0 { raw_amount } else { 0.0 };
        
        let total_call = investment_call + fee;
        total_invested += total_call;
        unreturned_capital += total_call;
        
        let opening_balance = unreturned_capital - total_call; 
        accrued_pref += opening_balance * fund.hurdle_rate;
        
        let mut lp_distribution = 0.0;
        let mut gp_distribution = 0.0;
        
        if distribution > 0.0 {
            gross_distributions += distribution;
            let mut remaining_dist = distribution;
            
            let roc_payment = remaining_dist.min(unreturned_capital);
            unreturned_capital -= roc_payment;
            remaining_dist -= roc_payment;
            lp_distribution += roc_payment;
            
            let pref_payment = remaining_dist.min(accrued_pref);
            accrued_pref -= pref_payment;
            remaining_dist -= pref_payment;
            lp_distribution += pref_payment;
            
            let catchup_target = pref_payment * fund.carried_interest / (1.0 - fund.carried_interest);
            let catchup_payment = remaining_dist.min(catchup_target);
            remaining_dist -= catchup_payment;
            gp_distribution += catchup_payment;
            
            let gp_carry = remaining_dist * fund.carried_interest;
            let lp_carry = remaining_dist * (1.0 - fund.carried_interest);
            gp_distribution += gp_carry;
            lp_distribution += lp_carry;
            
            total_distributed += (lp_distribution + gp_distribution);
        }
        
        let net_flow = lp_distribution - total_call;
        final_flows.push(CashFlow {
            year,
            amount: net_flow,
            type_: "Net Flow".to_string(),
        });
    }
    
    let total_value = total_distributed;
    let tvpi = if total_invested > 0.0 { total_value / total_invested } else { 0.0 };
    let dpi = if total_invested > 0.0 { total_distributed / total_invested } else { 0.0 };
    let moic = tvpi;
    
    let amounts: Vec<f64> = final_flows.iter().map(|cf| cf.amount).collect();
    let net_irr = calculate_irr(&amounts);
    
    let returns = FundReturns {
        net_irr,
        tvpi,
        dpi,
        moic,
        cash_flows: final_flows,
        gross_returns: gross_distributions,
        total_invested,
        total_distributed,
        total_value,
    };
    
    serde_wasm_bindgen::to_value(&returns).unwrap()
}

#[wasm_bindgen]
pub fn run_monte_carlo(params_val: JsValue) -> JsValue {
    let params: MonteCarloParams = serde_wasm_bindgen::from_value(params_val).unwrap();
    let mut rng = Rng::new(98765);
    
    let mut results: Vec<f64> = Vec::with_capacity(params.iterations as usize);
    
    for _ in 0..params.iterations {
        results.push(rng.sample_normal(params.mean, params.std_dev));
    }
    
    // Sort
    results.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let p10_idx = (params.iterations as f64 * 0.1) as usize;
    let p50_idx = (params.iterations as f64 * 0.5) as usize;
    let p90_idx = (params.iterations as f64 * 0.9) as usize;
    
    let result = MonteCarloResult {
        p10: results[p10_idx],
        p50: results[p50_idx],
        p90: results[p90_idx],
    };
    
    serde_wasm_bindgen::to_value(&result).unwrap()
}

fn calculate_irr(cash_flows: &[f64]) -> f64 {
    let max_iterations = 100;
    let tolerance: f64 = 1e-7;
    let mut guess: f64 = 0.1;
    for _ in 0..max_iterations {
        let mut npv: f64 = 0.0;
        let mut d_npv: f64 = 0.0;
        for (t, &cf) in cash_flows.iter().enumerate() {
            let base: f64 = 1.0 + guess;
            let discount_factor = base.powi(t as i32);
            npv += cf / discount_factor;
            d_npv -= (t as f64) * cf * base.powi(-(t as i32) - 1);
        }
        if d_npv.abs() < tolerance { return guess; }
        let new_guess = guess - (npv / d_npv);
        if (new_guess - guess).abs() < tolerance { return new_guess; }
        guess = new_guess;
    }
    guess
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SensitivityInput {
    pub variable_1: String,
    pub range_1: Vec<f64>,
    pub variable_2: String,
    pub range_2: Vec<f64>,
}

#[wasm_bindgen]
pub fn calculate_lbo(input_val: JsValue) -> Result<JsValue, JsValue> {
    let input: LBOInput = serde_wasm_bindgen::from_value(input_val)?;
    
    let result = match input.solve_for {
        LBOSolverMode::EntryPrice => solve_for_entry_multiple(&input),
        LBOSolverMode::ExitMultiple => solve_for_exit_multiple(&input),
        _ => evaluate_lbo(&input, input.entry_ev_ebitda_multiple.unwrap_or(10.0)),
    };
    
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn calculate_sensitivity(lbo_input_val: JsValue, sens_input_val: JsValue) -> Result<JsValue, JsValue> {
    let base_input: LBOInput = serde_wasm_bindgen::from_value(lbo_input_val)?;
    let sens: SensitivityInput = serde_wasm_bindgen::from_value(sens_input_val)?;
    
    // Matrix of results (Returns IRR for now)
    let mut matrix: Vec<Vec<f64>> = Vec::new();
    
    for v1 in &sens.range_1 {
        let mut row: Vec<f64> = Vec::new();
        for v2 in &sens.range_2 {
            let mut run_input = base_input.clone();
            apply_override(&mut run_input, &sens.variable_1, *v1);
            apply_override(&mut run_input, &sens.variable_2, *v2);
            
            let res = evaluate_lbo(&run_input, run_input.entry_ev_ebitda_multiple.unwrap_or(10.0));
            row.push(res.irr);
        }
        matrix.push(row);
    }
    
    Ok(serde_wasm_bindgen::to_value(&matrix)?)
}
fn apply_override(input: &mut LBOInput, var: &str, val: f64) {
    match var {
        "entry_multiple" | "entry_ev_ebitda_multiple" => input.entry_ev_ebitda_multiple = Some(val),
        "exit_multiple" | "exit_ev_ebitda_multiple" => input.exit_ev_ebitda_multiple = Some(val),
        "leverage" | "total_leverage_ratio" => input.financing.total_leverage_ratio = Some(val),
        "revenue_growth" | "revenue_growth_rate" => input.revenue_growth_rate = val,
        "ebitda_margin" => input.ebitda_margin = val,
        "revenue" | "entry_revenue" => input.entry_revenue = val,
        _ => {}
    }
}

fn solve_for_entry_multiple(input: &LBOInput) -> LBOResult {
    let target_irr = input.target_irr.unwrap_or(0.20);
    
    // Secant Method
    let mut x0 = 8.0;
    let mut x1 = 12.0;
    
    let res0 = evaluate_lbo(input, x0);
    let mut f0 = res0.irr - target_irr;
    
    let res1 = evaluate_lbo(input, x1);
    let mut f1 = res1.irr - target_irr;
    
    let mut final_mult = x1;
    
    for _ in 0..10 {
        if f1.abs() < 0.0001 {
            final_mult = x1;
            break;
        }
        
        let denominator = f1 - f0;
        if denominator.abs() < 1e-9 { break; }
        
        let x2 = x1 - f1 * (x1 - x0) / denominator;
        let x2 = x2.max(1.0).min(50.0);
        
        x0 = x1;
        f0 = f1;
        x1 = x2;
        
        let res2 = evaluate_lbo(input, x1);
        f1 = res2.irr - target_irr;
        final_mult = x1;
    }
    
    evaluate_lbo(input, final_mult)
}

fn solve_for_exit_multiple(input: &LBOInput) -> LBOResult {
    let target_irr = input.target_irr.unwrap_or(0.20);
    
    // Secant Method for exit multiple
    let mut x0 = 8.0;
    let mut x1 = 12.0;
    
    let res0 = evaluate_lbo_with_exit(input, x0);
    let mut f0 = res0.irr - target_irr;
    
    let res1 = evaluate_lbo_with_exit(input, x1);
    let mut f1 = res1.irr - target_irr;
    
    let mut final_mult = x1;
    
    for _ in 0..10 {
        if f1.abs() < 0.0001 {
            final_mult = x1;
            break;
        }
        
        let denominator = f1 - f0;
        if denominator.abs() < 1e-9 { break; }
        
        let x2 = x1 - f1 * (x1 - x0) / denominator;
        let x2 = x2.max(1.0).min(50.0);
        
        x0 = x1;
        f0 = f1;
        x1 = x2;
        
        let res2 = evaluate_lbo_with_exit(input, x1);
        f1 = res2.irr - target_irr;
        final_mult = x1;
    }
    
    evaluate_lbo_with_exit(input, final_mult)
}

fn evaluate_lbo_with_exit(input: &LBOInput, exit_multiple: f64) -> LBOResult {
    let mut modified_input = input.clone();
    modified_input.exit_ev_ebitda_multiple = Some(exit_multiple);
    evaluate_lbo(&modified_input, modified_input.entry_ev_ebitda_multiple.unwrap_or(10.0))
}

fn evaluate_lbo(input: &LBOInput, entry_multiple: f64) -> LBOResult {
    // 1. Setup Deal Structure
    let entry_ev = input.entry_ebitda * entry_multiple;
    
    let mut total_debt = 0.0;
    let mut tranches: Vec<DebtTranche> = input.financing.tranches.clone();
    let mut tranche_balances: Vec<f64> = Vec::new();
    
    for t in &tranches {
        let amount = if let Some(a) = t.amount { a }
                     else if let Some(m) = t.leverage_multiple { m * input.entry_ebitda }
                     else { 0.0 };
        total_debt += amount;
        tranche_balances.push(amount);
    }
    
    let fees = entry_ev * input.assumptions.transaction_fees_percent;
    let initial_equity = entry_ev - total_debt + fees;
    
    // 2. Projection Loop
    let mut current_revenue = input.entry_revenue;
    let mut current_nol = if let Some(ref tax) = input.tax_assumptions {
        if tax.enable_nol { tax.initial_nol_balance } else { 0.0 }
    } else { 0.0 };

    let mut final_ebitda = input.entry_ebitda;

    for _year in 1..=input.holding_period {
        // Growth & Synergies
        current_revenue *= 1.0 + input.revenue_growth_rate;
        let synergy = input.assumptions.synergy_benefits;
        let yr_ebitda = current_revenue * input.ebitda_margin + synergy;
        final_ebitda = yr_ebitda;
        
        // Operations (3% D&A placeholder to match Python)
        let da = current_revenue * 0.03;
        let ebit = yr_ebitda - da;
        
        // Interest
        let mut total_cash_interest = 0.0;
        for i in 0..tranches.len() {
            let interest = tranche_balances[i] * tranches[i].interest_rate;
            if tranches[i].cash_interest {
                total_cash_interest += interest;
            } else {
                // PIK Accrual (Matches Python line 297)
                tranche_balances[i] += interest;
            }
        }

        // Tax Logic (Matches Python simplification: only cash interest is deductible)
        let mut deductible_interest = total_cash_interest;
        if let Some(ref tax) = input.tax_assumptions {
            if tax.interest_deductibility_cap > 0.0 {
                let cap = yr_ebitda * tax.interest_deductibility_cap;
                deductible_interest = total_cash_interest.min(cap);
            }
        }

        let pre_tax_income = ebit - deductible_interest;
        
        // Step-up (simplified)
        let mut step_up_deduction = 0.0;
        if let Some(ref tax) = input.tax_assumptions {
            if tax.step_up_percent > 0.0 {
                let basis = entry_ev * tax.step_up_percent;
                step_up_deduction = basis / (tax.depreciation_years as f64).max(1.0);
            }
        }

        let mut taxable_income = pre_tax_income - step_up_deduction;
        
        // NOLs
        if let Some(ref tax) = input.tax_assumptions {
            if tax.enable_nol && current_nol > 0.0 {
                let max_usage = (taxable_income * tax.nol_annual_limit).max(0.0);
                let actual_usage = current_nol.min(max_usage).min(taxable_income.max(0.0));
                taxable_income -= actual_usage;
                current_nol -= actual_usage;
            } else if pre_tax_income < 0.0 && tax.enable_nol {
                current_nol += pre_tax_income.abs();
                taxable_income = 0.0;
            }
        }

        let taxes = (taxable_income.max(0.0)) * input.tax_rate;
        
        // FCF available for debt (Matches Python line 341)
        let capex = current_revenue * input.capex_percentage;
        let prev_rev = current_revenue / (1.0 + input.revenue_growth_rate);
        let change_nwc = (current_revenue - prev_rev) * input.nwc_percentage;
        
        let fcf = yr_ebitda - taxes - capex - change_nwc - total_cash_interest;
        
        // Debt Payments
        let mut remaining_fcf = fcf.max(0.0);
        
        // 1. Mandatory Amortization
        for i in 0..tranches.len() {
            if tranches[i].amortization_rate > 0.0 {
                let original_amount = if let Some(a) = tranches[i].amount { a }
                                      else { tranches[i].leverage_multiple.unwrap_or(0.0) * input.entry_ebitda };
                let amort = original_amount * tranches[i].amortization_rate;
                let actual_amort = remaining_fcf.min(amort).min(tranche_balances[i]);
                tranche_balances[i] -= actual_amort;
                remaining_fcf -= actual_amort;
            }
        }

        // 2. Cash Sweep (Matches Python priority-based sweep)
        let mut sweep_indices: Vec<usize> = (0..tranches.len()).collect();
        sweep_indices.sort_by_key(|&i| tranches[i].mandatory_cash_sweep_priority);

        for &i in &sweep_indices {
            if tranches[i].cash_interest { // Usually only sweep cash tranches in this model
                let paydown = remaining_fcf.min(tranche_balances[i]);
                tranche_balances[i] -= paydown;
                remaining_fcf -= paydown;
            }
        }
    }
    
    // 3. Exit
    let exit_multiple = input.exit_ev_ebitda_multiple.unwrap_or(entry_multiple);
    let exit_ev = final_ebitda * exit_multiple;
    let ending_debt: f64 = tranche_balances.iter().sum();
    let exit_equity = exit_ev - ending_debt;
    
    // 4. Returns (CAGR for Parity with simplified Python model)
    let moic = if initial_equity > 0.0 { exit_equity / initial_equity } else { 0.0 };
    let irr = if initial_equity > 0.0 && exit_equity > 0.0 {
        (exit_equity / initial_equity).powf(1.0 / input.holding_period as f64) - 1.0
    } else if exit_equity <= 0.0 {
        -1.0
    } else {
        0.0
    };
    
    LBOResult {
        irr,
        moic,
        entry_valuation: entry_ev,
        exit_valuation: exit_ev,
        equity_check: initial_equity,
        created_at_ms: 0.0,
        error: None,
    }
}
