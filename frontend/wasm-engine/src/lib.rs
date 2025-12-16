use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct SimulationInput {
    pub mean: f64,
    pub std_dev: f64,
    pub iterations: i32,
}

#[derive(Serialize, Deserialize)]
pub struct SimulationResult {
    pub p10: f64,
    pub p50: f64,
    pub p90: f64,
}

#[wasm_bindgen]
pub fn run_monte_carlo(val: JsValue) -> JsValue {
    let input: SimulationInput = serde_wasm_bindgen::from_value(val).unwrap();
    
    // Quick Box-Muller transform for normal distribution
    // Note: In real app we'd use 'rand' crate but for minimal wasm size we do this
    let mut results: Vec<f64> = Vec::with_capacity(input.iterations as usize);
    
    for _ in 0..input.iterations {
        let u1: f64 = js_sys::Math::random();
        let u2: f64 = js_sys::Math::random();
        
        // Z0 = sqrt(-2 ln U1) * cos(2 pi U2)
        let z0 = (-2.0 * u1.ln()).sqrt() * (2.0 * std::f64::consts::PI * u2).cos();
        
        let sim_val = input.mean + (z0 * input.std_dev);
        results.push(sim_val);
    }
    
    results.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let p10_idx = (input.iterations as f64 * 0.1) as usize;
    let p50_idx = (input.iterations as f64 * 0.5) as usize;
    let p90_idx = (input.iterations as f64 * 0.9) as usize;
    
    let res = SimulationResult {
        p10: results[p10_idx],
        p50: results[p50_idx],
        p90: results[p90_idx],
    };
    
    serde_wasm_bindgen::to_value(&res).unwrap()
}
