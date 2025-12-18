use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

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
