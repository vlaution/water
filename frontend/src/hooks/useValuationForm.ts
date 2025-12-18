import { useEffect } from 'react';
import { useChangeHistory } from './useChangeHistory';
import { api } from '../config/api';

export const useValuationForm = (initialTicker?: string | null) => {
    const { state: formData, pushState, undo, redo, canUndo, canRedo } = useChangeHistory({
        company_name: "New Company",
        currency: "USD",
        ticker: "",
        industry: "",
        sector: "",
        description: "",
        address: "",
        employees: "",
        fiscal_year_end: "",
        dcf_input: {
            historical: {
                years: [2020, 2021, 2022],
                revenue: [100, 110, 120],
                ebitda: [20, 22, 25],
                ebit: [15, 17, 20],
                net_income: [10, 12, 15],
                capex: [5, 5, 6],
                nwc: [2, 2, 3]
            },
            projections: {
                revenue_growth_start: 0.05,
                revenue_growth_end: 0.03,
                ebitda_margin_start: 0.20,
                ebitda_margin_end: 0.22,
                tax_rate: 0.25,
                discount_rate: 0.10,
                terminal_growth_rate: 0.02,
                terminal_exit_multiple: 12.0,
                depreciation_rate: 0.03,
                working_capital: { dso: 45, dio: 60, dpo: 30 }
            },
            shares_outstanding: 1000000,
            net_debt: 5000000
        },
        gpc_input: {
            target_ticker: "TARGET",
            peer_tickers: ["PEER1", "PEER2"],
            metrics: { "LTM Revenue": 120, "LTM EBITDA": 25 },
            ev_revenue_multiple: undefined as number | undefined,
            ev_ebitda_multiple: undefined as number | undefined
        },
        dcfe_input: {
            historical: {
                years: [2020, 2021, 2022],
                revenue: [100, 110, 120],
                ebitda: [20, 22, 25],
                ebit: [15, 17, 20],
                net_income: [10, 12, 15],
                capex: [5, 5, 6],
                nwc: [2, 2, 3]
            },
            projections: {
                revenue_growth_start: 0.05,
                revenue_growth_end: 0.03,
                ebitda_margin_start: 0.20,
                ebitda_margin_end: 0.22,
                tax_rate: 0.25,
                discount_rate: 0.10,
                terminal_growth_rate: 0.025
            },
            debt_schedule: [
                { beginning_debt: 50, new_borrowing: 10, debt_repayment: 5, interest_rate: 0.05 },
                { beginning_debt: 55, new_borrowing: 5, debt_repayment: 5, interest_rate: 0.05 },
                { beginning_debt: 55, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 },
                { beginning_debt: 45, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 },
                { beginning_debt: 35, new_borrowing: 0, debt_repayment: 10, interest_rate: 0.05 }
            ],
            cost_of_equity: 0.12,
            terminal_growth_rate: 0.025,
            shares_outstanding: 1000000
        },
        precedent_transactions_input: {
            transactions: [
                { target_name: "Company A", acquirer_name: "Buyer 1", announcement_date: "2023-01-15", deal_value: 500, revenue: 200, ebitda: 50 },
                { target_name: "Company B", acquirer_name: "Buyer 2", announcement_date: "2023-03-20", deal_value: 800, revenue: 300, ebitda: 80 }
            ],
            target_revenue: 220,
            target_ebitda: 55,
            use_median: true
        },
        anav_input: {
            assets: { "Cash": 10, "Inventory": 20, "PP&E": 100 },
            liabilities: { "Debt": 50, "Payables": 10 },
            adjustments: { "PP&E": 20, "Inventory": -5 }
        },
        sensitivity_analysis: {
            variable_1: "discount_rate",
            range_1: [0.08, 0.10, 0.12],
            variable_2: "terminal_growth_rate",
            range_2: [0.01, 0.02, 0.03]
        },
        method_weights: { dcf: 0.4, fcfe: 0.0, gpc: 0.3, precedent: 0.3, anav: 0.0, lbo: 0.0 },
        lbo_input: {
            solve_for: 'entry_price' as any,
            entry_revenue: 100,
            entry_ebitda: 20,
            entry_ev_ebitda_multiple: 10.0,
            target_irr: 0.20,
            financing: {
                tranches: [
                    { name: "Senior Debt", amount: undefined, leverage_multiple: 4.0, interest_rate: 0.08, cash_interest: true, amortization_rate: 0.05, maturity: 5, mandatory_cash_sweep_priority: 1 },
                    { name: "Mezzanine", amount: undefined, leverage_multiple: 1.0, interest_rate: 0.12, cash_interest: false, amortization_rate: 0.0, maturity: 7, mandatory_cash_sweep_priority: 2 }
                ],
                total_leverage_ratio: 5.0,
                equity_contribution_percent: 0.40
            },
            assumptions: { transaction_fees_percent: 0.02, synergy_benefits: 0.0 },
            revenue_growth_rate: 0.05,
            ebitda_margin: 0.25,
            capex_percentage: 0.03,
            nwc_percentage: 0.05,
            tax_rate: 0.25,
            holding_period: 5,
            exit_ev_ebitda_multiple: 10.0
        }
    });

    const setFormData = (newStateOrUpdater: any) => {
        if (typeof newStateOrUpdater === 'function') {
            pushState(newStateOrUpdater(formData));
        } else {
            pushState(newStateOrUpdater);
        }
    };

    // Initialize from Ticker
    useEffect(() => {
        if (initialTicker) {
            setFormData((prev: any) => ({ ...prev, ticker: initialTicker }));
        }
    }, [initialTicker]);

    const handleUpdateGPC = (newData: any) => setFormData((prev: any) => ({ ...prev, gpc_input: newData }));

    const handleFindPeers = async (ticker: string, token: string) => {
        if (!ticker) {
            alert("Please enter a target ticker first.");
            return;
        }

        try {
            const response = await fetch(api.url(`/api/peers/${ticker}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to find peers");

            const peersData: any[] = await response.json();
            const peerTickers = peersData.map(p => p.ticker);
            let medianEvRev = 0;
            let medianEvEbitda = 0;

            if (peersData.length > 0) {
                const evRevs = peersData.map(p => p.ev_revenue).filter(v => v > 0).sort((a, b) => a - b);
                const evEbitdas = peersData.map(p => p.ev_ebitda).filter(v => v > 0).sort((a, b) => a - b);
                if (evRevs.length > 0) medianEvRev = evRevs[Math.floor(evRevs.length / 2)];
                if (evEbitdas.length > 0) medianEvEbitda = evEbitdas[Math.floor(evEbitdas.length / 2)];
            }

            handleUpdateGPC({
                ...formData.gpc_input,
                peer_tickers: peerTickers,
                ev_revenue_multiple: medianEvRev > 0 ? medianEvRev : undefined,
                ev_ebitda_multiple: medianEvEbitda > 0 ? medianEvEbitda : undefined
            });

        } catch (error) {
            console.error("Error finding peers:", error);
            handleUpdateGPC({
                ...formData.gpc_input,
                peer_tickers: [...formData.gpc_input.peer_tickers, "MOCK1", "MOCK2"] // Fallback
            });
        }
    };

    return {
        formData,
        setFormData,
        undo,
        redo,
        canUndo,
        canRedo,
        handleFindPeers
    };
};
