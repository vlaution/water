import React, { useEffect, useState } from 'react';
import { wasmCompute } from '../services/WasmComputeService';
import type { LBOInput } from '../services/WasmComputeService';

// Golden Data manually embedded from backend output (golden_lbo_data.json)
const GOLDEN_DATA = {
    "input": {
        "solve_for": "entry_price",
        "entry_revenue": 100.0,
        "entry_ebitda": 20.0,
        "entry_ev_ebitda_multiple": 10.0,
        "financing": {
            "tranches": [
                {
                    "name": "Senior Term Loan",
                    "amount": null,
                    "leverage_multiple": 4.0,
                    "interest_rate": 0.05,
                    "cash_interest": true,
                    "amortization_rate": 0.01,
                    "maturity": 7,
                    "mandatory_cash_sweep_priority": 1
                },
                {
                    "name": "Mezzanine",
                    "amount": null,
                    "leverage_multiple": 1.0,
                    "interest_rate": 0.12,
                    "cash_interest": false,
                    "amortization_rate": 0.0,
                    "maturity": 8,
                    "mandatory_cash_sweep_priority": 1
                }
            ],
            "total_leverage_ratio": null,
            "equity_contribution_percent": null
        },
        "assumptions": {
            "transaction_fees_percent": 0.01,
            "synergy_benefits": 2.0,
            "hurdle_rate": 0.08,
            "carry_percent": 0.2,
            "catchup_active": true
        },
        "revenue_growth_rate": 0.05,
        "ebitda_margin": 0.2,
        "capex_percentage": 0.02,
        "nwc_percentage": 0.1,
        "tax_rate": 0.25,
        "holding_period": 5,
        "exit_ev_ebitda_multiple": 10.0,
        "target_irr": 0.2,
        "include_sensitivity": true,
        "refinancing_config": null,
        "covenants": [],
        "mip_assumptions": null,
        "tax_assumptions": {
            "enable_nol": true,
            "initial_nol_balance": 5.0,
            "nol_annual_limit": 1.0,
            "interest_deductibility_cap": 0.3,
            "step_up_percent": 0.0,
            "depreciation_years": 15
        }
    },
    "output": {
        "implied_entry_multiple": 9.65,
        "implied_entry_ev": 192968891.80,
        "irr": 0.2,
        "moic": 2.49
    }
};

const ParityVerifier: React.FC = () => {
    const [status, setStatus] = useState<"IDLE" | "RUNNING" | "PASS" | "FAIL">("IDLE");
    const [actual, setActual] = useState<any>(null);
    const [diff, setDiff] = useState<string[]>([]);

    useEffect(() => {
        runVerification();
    }, []);

    const runVerification = async () => {
        setStatus("RUNNING");
        try {
            console.log("Starting Wasm Verification...");
            const input: LBOInput = GOLDEN_DATA.input as any;

            // Execute Wasm Logic
            const result = await wasmCompute.calculateLBO(input);
            setActual(result);

            // Compare
            const failures: string[] = [];

            // Tolerance Check
            if (Math.abs(result.irr - GOLDEN_DATA.output.irr) > 0.005) { // 0.5% tolerance for Newton vs CAGR differences if any
                failures.push(`IRR Mismatch: Expected ${GOLDEN_DATA.output.irr.toFixed(4)}, Got ${result.irr.toFixed(4)}`);
            }
            if (Math.abs(result.moic - GOLDEN_DATA.output.moic) > 0.05) { // Allow for slight rounding diffs
                failures.push(`MOIC Mismatch: Expected ${GOLDEN_DATA.output.moic.toFixed(2)}, Got ${result.moic.toFixed(2)}`);
            }

            // Normalization: Golden is in absolute $, Wasm is in same units as input (Millions)
            // Let's normalize both to "Millions"
            const goldenValMillion = GOLDEN_DATA.output.implied_entry_ev / 1000000;
            const actualVal = result.entry_valuation;

            const valDiffPct = Math.abs(actualVal - goldenValMillion) / goldenValMillion;

            if (valDiffPct > 0.01) { // 1% tolerance for complex waterfall parity
                failures.push(`Valuation Mismatch: Expected ${goldenValMillion.toFixed(2)}M, Got ${actualVal.toFixed(2)}M (Diff: ${(valDiffPct * 100).toFixed(2)}%)`);
            }

            setDiff(failures);
            setStatus(failures.length === 0 ? "PASS" : "FAIL");

        } catch (e) {
            console.error(e);
            setDiff([`Exception: ${e}`]);
            setStatus("FAIL");
        }
    };

    return (
        <div className="p-4 bg-gray-900 text-white font-mono rounded-lg">
            <h2 className="text-xl font-bold mb-4">Wasm LBO Parity Check</h2>

            <div className="mb-4">
                <span className={`px-2 py-1 rounded ${status === 'PASS' ? 'bg-green-500' :
                    status === 'FAIL' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                    {status}
                </span>
            </div>

            {diff.length > 0 && (
                <div className="bg-red-900/50 p-4 rounded mb-4">
                    <h3 className="font-bold text-red-300">Failures:</h3>
                    <ul className="list-disc pl-5">
                        {diff.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-2 rounded">
                    <h3 className="text-gray-400">Golden (Python)</h3>
                    <pre className="text-xs">{JSON.stringify(GOLDEN_DATA.output, null, 2)}</pre>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                    <h3 className="text-gray-400">Actual (Wasm)</h3>
                    <pre className="text-xs">{actual ? JSON.stringify({
                        irr: actual.irr,
                        moic: actual.moic,
                        entry_valuation: actual.entry_valuation,
                        exit_valuation: actual.exit_valuation,
                        equity_check: actual.equity_check
                    }, null, 2) : "..."}</pre>
                </div>
            </div>
        </div>
    );
};

export default ParityVerifier;
