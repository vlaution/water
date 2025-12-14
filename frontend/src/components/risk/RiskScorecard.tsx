import React, { useEffect, useState } from 'react';
import { apiFetch, api } from '../../config/api';

interface CompanyHealthResult {
    company_name: string;
    runway_months: number;
    data_quality_score: number;
    red_flags: string[];
}

interface PortfolioHealthResponse {
    avg_runway_months: number;
    avg_data_quality: number;
    total_companies: number;
    healthy_companies: number;
    at_risk_companies: number;
    company_results: CompanyHealthResult[];
}

export const RiskScorecard: React.FC = () => {
    const [data, setData] = useState<PortfolioHealthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await apiFetch(api.endpoints.risk.health, {}, token);
                if (response.ok) {
                    setData(await response.json());
                }
            } catch (error) {
                console.error("Failed to fetch health data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading health scorecard...</div>;
    if (!data) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Health Scorecard</h3>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 font-medium">Avg Runway</div>
                    <div className="text-2xl font-bold text-blue-800">
                        {data.avg_runway_months.toFixed(1)} <span className="text-sm font-normal">months</span>
                    </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="text-sm text-purple-600 font-medium">Data Quality</div>
                    <div className="text-2xl font-bold text-purple-800">
                        {data.avg_data_quality.toFixed(0)}%
                    </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-sm text-green-600 font-medium">Healthy Companies</div>
                    <div className="text-2xl font-bold text-green-800">
                        {data.healthy_companies}
                    </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-sm text-red-600 font-medium">At Risk</div>
                    <div className="text-2xl font-bold text-red-800">
                        {data.at_risk_companies}
                    </div>
                </div>
            </div>

            {/* Red Flags List */}
            {data.at_risk_companies > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-red-700 mb-3 uppercase tracking-wider">Risk Alerts</h4>
                    <div className="space-y-3">
                        {data.company_results
                            .filter(c => c.red_flags.length > 0)
                            .map((company, idx) => (
                                <div key={idx} className="flex items-start p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">{company.company_name}</h3>
                                        <div className="mt-1 text-sm text-red-700">
                                            <ul className="list-disc list-inside">
                                                {company.red_flags.map((flag, i) => (
                                                    <li key={i}>{flag}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Full List (Collapsible or simple table) */}
            <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Company Details</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Runway</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Data Quality</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.company_results.map((company, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{company.company_name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 text-right">
                                        {company.runway_months >= 99 ? '> 24m' : `${company.runway_months.toFixed(1)}m`}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500 text-right">
                                        <div className="flex items-center justify-end">
                                            <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                                <div
                                                    className={`h-1.5 rounded-full ${company.data_quality_score > 80 ? 'bg-green-500' : company.data_quality_score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${company.data_quality_score}%` }}
                                                ></div>
                                            </div>
                                            {company.data_quality_score.toFixed(0)}%
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {company.red_flags.length === 0 ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Healthy
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                {company.red_flags.length} Risks
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
