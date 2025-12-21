import React, { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react';

export const PartnerCommandCenter: React.FC = () => {
    const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
    const [rationales, setRationales] = useState<{[key: string]: string}>({});




    const [criticalDecisions, setCriticalDecisions] = useState<any[]>([]);
    const [lastLoginDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Demo: 7 days ago
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCriticalDecisions();
    }, []);

    const loadCriticalDecisions = async () => {
        try {
            const sinceIso = lastLoginDate.toISOString();
            // In a real app, use a dedicated API client. Using fetch for expediency as per User Request style.
            const res = await fetch(`/api/decisions/critical?since=${sinceIso}`);
            const data = await res.json();
            setCriticalDecisions(data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch critical decisions", e);
            setLoading(false);
        }
    };

    const handleAcknowledge = async (id: string, action: string, rationale: string) => {
         try {
            await fetch(`/api/decisions/${id}/acknowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: "partner_demo",
                    user_role: "PARTNER",
                    action: action,
                    rationale: rationale
                })
            });
            setAcknowledgedIds(prev => new Set(prev).add(id));
            // Reload to update state? Or just trust local state
        } catch (e) {
            alert("Failed to acknowledge. See console.");
            console.error(e);
        }
    };
    
    // Mapping for UI compat (The API returns DecisionResponse, UI expects slightly different shape or we render directly)
    // We'll adapt the API response to the UI needed
    
    const activeDecisions = criticalDecisions.filter(d => !acknowledgedIds.has(d.decision_id));

    if (loading) return <div className="p-8 text-center">Loading Partner Center...</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Advisory Banner */}
                <div className="bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg flex items-center justify-center text-sm gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    SHADOW MODE - ADVISORY ONLY • Data delayed by 24-48 hours • No automated actions enabled
                </div>

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-t-xl border-x border-t border-gray-300 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        PARTNER COMMAND CENTER
                    </h1>
                    <span className="text-sm font-mono text-gray-500">
                        [Last Login: 1 wk ago]
                    </span>
                </div>

                {/* Critical Section */}
                <div className="bg-white dark:bg-gray-800 rounded-b-xl border border-gray-300 dark:border-gray-700 shadow-xl overflow-hidden">
                    <div className="bg-red-600 px-6 py-3 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                        <h2 className="text-white font-bold text-lg tracking-wide">
                            NEW CRITICAL DECISIONS ({activeDecisions.length})
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {activeDecisions.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">All Clear</h3>
                                <p>No new critical actions required.</p>
                            </div>
                        ) : (
                            activeDecisions.map((d, i) => (
                                <div key={d.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Number */}
                                        <div className="text-2xl font-black text-gray-300 dark:text-gray-600 font-mono">
                                            {i + 1}.
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span className="text-red-600 uppercase tracking-wider text-sm font-black">[{d.type}]</span>
                                                        <span className="font-serif italic text-gray-700 dark:text-gray-200">"{d.company}"</span>
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold whitespace-nowrap">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    Lead Time: {d.lead_time}
                                                </div>
                                            </div>

                                            <div className="space-y-1 pl-1 border-l-2 border-gray-200 dark:border-gray-600">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 pl-3">
                                                    {/* Detail Logic */}
                                                    {d.metadata?.summary || "Critical threshold breach detected."}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 pl-3 flex items-center gap-2">
                                                    → Historical FP Rate for this signal: 
                                                    <span className={`font-bold text-emerald-600`}>
                                                        {/* Hardcoded 8% for demo or fetch from metadata */}
                                                        8% (Low)
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Counterfactual / "What If" Engine */}
                                            {/* (API doesn't return counterfactual structure perfectly yet, assuming metadata has it or hardcoding visualization for pilot) */}
                                            {d.metadata?.counterfactual && (
                                                <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3">
                                                   <div className="flex items-start gap-2">
                                                      <AlertOctagon className="w-4 h-4 text-amber-600 mt-1 shrink-0" />
                                                      <div className="space-y-1">
                                                          <p className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest">
                                                              What-If Analysis (Counterfactual)
                                                          </p>
                                                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 italic">
                                                              "{d.metadata.counterfactual.summary} <span className="font-bold border-b border-amber-400">{d.metadata.counterfactual.most_likely.probability}% probability of {d.metadata.counterfactual.most_likely.impact}</span>"
                                                          </p>
                                                          <p className="text-[10px] text-gray-400 font-mono">
                                                              Source: {d.metadata.counterfactual.source}
                                                          </p>
                                                      </div>
                                                   </div>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-4 mt-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-emerald-500">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase text-xs tracking-wider block mb-0.5">Recommended Action</span>
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{d.action}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter rationale for decision record..."
                                                        className="flex-1 text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                                                        value={rationales[d.decision_id] || ""}
                                                        onChange={(e) => setRationales(prev => ({...prev, [d.decision_id]: e.target.value}))}
                                                    />
                                                    <button 
                                                        onClick={() => handleAcknowledge(d.decision_id, "ACKNOWLEDGED", rationales[d.decision_id] || "No rationale provided")}
                                                        disabled={!rationales[d.decision_id]}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-bold rounded shadow-sm hover:shadow transition-all whitespace-nowrap active:scale-95"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer / Context */}
                <div className="text-center text-xs text-gray-400">
                    <p>System Confidence calibrated via 2008 Historical Replay (Epoch 2).</p>
                    <p>Precision Analysis: Active (Shadow Mode)</p>
                </div>

            </div>
        </div>
    );
};
