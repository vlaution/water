import React, { useState } from 'react';
import { X, ArrowRight, TrendingUp, DollarSign, Percent, Building2 } from 'lucide-react';

interface MergerAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AcquirerData {
    ticker: string;
    share_price: number;
    shares_outstanding: number;
    eps: number;
    pe_ratio: number;
    tax_rate: number;
    excess_cash: number;
}

interface TargetData {
    ticker: string;
    net_income: number;
    shares_outstanding?: number;
    current_share_price?: number;
    pre_tax_synergies: number;
    transaction_fees: number;
}

interface DealStructure {
    offer_price: number;
    percent_cash: number;
    percent_stock: number;
    percent_debt: number;
    interest_rate_on_debt: number;
    interest_rate_on_cash: number;
}

interface AnalysisResult {
    pro_forma_eps: number;
    accretion_dilution_amount: number;
    accretion_dilution_percent: number;
    pro_forma_pe: number;
    breakeven_synergies: number;
    total_purchase_price: number;
    new_shares_issued: number;
    debt_used: number;
    cash_used: number;
    interest_expense_impact: number;
    foregone_interest_impact: number;
}

export const MergerAnalysisModal: React.FC<MergerAnalysisModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const [acquirer, setAcquirer] = useState<AcquirerData>({
        ticker: '',
        share_price: 150.0,
        shares_outstanding: 1000,
        eps: 5.0,
        pe_ratio: 30.0,
        tax_rate: 0.21,
        excess_cash: 5000
    });

    const [target, setTarget] = useState<TargetData>({
        ticker: '',
        net_income: 200,
        shares_outstanding: 100,
        current_share_price: 40.0,
        pre_tax_synergies: 50,
        transaction_fees: 20
    });

    const [deal, setDeal] = useState<DealStructure>({
        offer_price: 50.0, // Per share if public, or total if private
        percent_cash: 0.5,
        percent_stock: 0.5,
        percent_debt: 0.0,
        interest_rate_on_debt: 0.06,
        interest_rate_on_cash: 0.02
    });

    // Auto-populate logic (mocked for now, but ready for API)
    const fetchCompanyData = async (ticker: string, type: 'acquirer' | 'target') => {
        setIsLoading(true);
        try {
            // In a real app, call /api/financials/{ticker}
            // For now, simulate a delay
            await new Promise(resolve => setTimeout(resolve, 500));
            if (type === 'acquirer') {
                setAcquirer(prev => ({ ...prev, ticker: ticker.toUpperCase() }));
            } else {
                setTarget(prev => ({ ...prev, ticker: ticker.toUpperCase() }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/merger/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    acquirer_data: acquirer,
                    target_data: target,
                    deal_structure: deal
                })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            setResult(data);
            setStep(4);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-white/10 flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-system-blue dark:text-blue-400" />
                            M&A Impact Analysis
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Accretion / Dilution Modeler</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5">
                    <div
                        className="bg-system-blue dark:bg-blue-500 h-1.5 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8 flex-1">

                    {/* Step 1: Company Inputs */}
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Acquirer */}
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs border border-blue-200 dark:border-blue-500/30">A</span>
                                        Acquirer
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ticker</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={acquirer.ticker}
                                                    onChange={(e) => setAcquirer({ ...acquirer, ticker: e.target.value })}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    placeholder="AAPL"
                                                />
                                                <button
                                                    onClick={() => fetchCompanyData(acquirer.ticker, 'acquirer')}
                                                    className="px-3 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                >
                                                    Load
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Share Price</label>
                                                <input type="number" value={acquirer.share_price} onChange={e => setAcquirer({ ...acquirer, share_price: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shares (M)</label>
                                                <input type="number" value={acquirer.shares_outstanding} onChange={e => setAcquirer({ ...acquirer, shares_outstanding: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">EPS ($)</label>
                                                <input type="number" value={acquirer.eps} onChange={e => setAcquirer({ ...acquirer, eps: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tax Rate</label>
                                                <input type="number" step="0.01" value={acquirer.tax_rate} onChange={e => setAcquirer({ ...acquirer, tax_rate: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Target */}
                                <div className="bg-green-50/50 dark:bg-green-900/10 p-6 rounded-xl border border-green-100 dark:border-green-500/20">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 flex items-center justify-center text-xs border border-green-200 dark:border-green-500/30">T</span>
                                        Target
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ticker (Optional)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={target.ticker}
                                                    onChange={(e) => setTarget({ ...target, ticker: e.target.value })}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/50"
                                                    placeholder="Private Co."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net Income (M)</label>
                                                <input type="number" value={target.net_income} onChange={e => setTarget({ ...target, net_income: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shares (M)</label>
                                                <input type="number" value={target.shares_outstanding} onChange={e => setTarget({ ...target, shares_outstanding: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Price</label>
                                                <input type="number" value={target.current_share_price} onChange={e => setTarget({ ...target, current_share_price: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Deal Structure */}
                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Offer Details</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Offer Price Per Share ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                value={deal.offer_price}
                                                onChange={e => setDeal({ ...deal, offer_price: parseFloat(e.target.value) })}
                                                className="w-full pl-10 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        {target.current_share_price && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                Premium: <span className="font-medium text-green-600 dark:text-green-400">{((deal.offer_price / target.current_share_price - 1) * 100).toFixed(1)}%</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consideration Mix</label>

                                        <div>
                                            <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-400">
                                                <span>Cash</span>
                                                <span className="font-medium">{(deal.percent_cash * 100).toFixed(0)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={deal.percent_cash}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setDeal({ ...deal, percent_cash: val, percent_stock: 1 - val - deal.percent_debt });
                                                }}
                                                className="w-full accent-green-500 dark:accent-green-400 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-400">
                                                <span>Stock</span>
                                                <span className="font-medium">{(deal.percent_stock * 100).toFixed(0)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={deal.percent_stock}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setDeal({ ...deal, percent_stock: val, percent_cash: 1 - val - deal.percent_debt });
                                                }}
                                                className="w-full accent-blue-500 dark:accent-blue-400 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-white/10">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Interest on Debt</label>
                                            <div className="relative mt-1">
                                                <input type="number" step="0.001" value={deal.interest_rate_on_debt} onChange={e => setDeal({ ...deal, interest_rate_on_debt: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Interest on Cash</label>
                                            <div className="relative mt-1">
                                                <input type="number" step="0.001" value={deal.interest_rate_on_cash} onChange={e => setDeal({ ...deal, interest_rate_on_cash: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Synergies */}
                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Synergies & Fees</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pre-Tax Synergies ($M)</label>
                                        <input
                                            type="number"
                                            value={target.pre_tax_synergies}
                                            onChange={e => setTarget({ ...target, pre_tax_synergies: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Annual run-rate cost and revenue synergies.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Fees ($M)</label>
                                        <input
                                            type="number"
                                            value={target.transaction_fees}
                                            onChange={e => setTarget({ ...target, transaction_fees: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Advisory, legal, and accounting fees (one-time).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {step === 4 && result && (
                        <div className="space-y-8 animate-fade-in-up">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className={`p-6 rounded-2xl border ${result.accretion_dilution_amount >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/20' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${result.accretion_dilution_amount >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        {result.accretion_dilution_amount >= 0 ? 'Accretion' : 'Dilution'}
                                    </h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-bold ${result.accretion_dilution_amount >= 0 ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
                                            {(result.accretion_dilution_percent * 100).toFixed(1)}%
                                        </span>
                                        <span className={`text-lg font-medium ${result.accretion_dilution_amount >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                            (${Math.abs(result.accretion_dilution_amount).toFixed(2)})
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pro Forma EPS</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">${result.pro_forma_eps.toFixed(2)}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">vs ${acquirer.eps.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Breakeven Synergies</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">${result.breakeven_synergies.toFixed(1)}M</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Metric</th>
                                            <th className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100 text-right">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        <tr>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Total Purchase Price</td>
                                            <td className="px-6 py-3 text-gray-900 dark:text-gray-100 text-right font-medium">${result.total_purchase_price.toLocaleString()}M</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">New Shares Issued</td>
                                            <td className="px-6 py-3 text-gray-900 dark:text-gray-100 text-right font-medium">{result.new_shares_issued.toFixed(1)}M</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Interest Expense (After-Tax)</td>
                                            <td className="px-6 py-3 text-red-600 dark:text-red-400 text-right font-medium">(${result.interest_expense_impact.toFixed(1)}M)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Foregone Interest (After-Tax)</td>
                                            <td className="px-6 py-3 text-red-600 dark:text-red-400 text-right font-medium">(${result.foregone_interest_impact.toFixed(1)}M)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex justify-between items-center sticky bottom-0 z-10 backdrop-blur-md">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-2 text-gray-600 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : step === 3 ? (
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="px-8 py-2 bg-system-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            {isLoading ? 'Analyzing...' : 'Run Analysis'}
                            {!isLoading && <TrendingUp className="w-4 h-4" />}
                        </button>
                    ) : (
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-2 bg-gray-900 dark:bg-white/10 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-white/20 transition-all border border-transparent dark:border-white/20"
                        >
                            New Analysis
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
