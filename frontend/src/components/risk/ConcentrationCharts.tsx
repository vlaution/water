import React, { useEffect, useState } from 'react';
import { apiFetch, api } from '../../config/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ConcentrationData {
    labels: string[];
    values: number[];
    total_value: number;
}

interface PowerLawData {
    gini_coefficient: number;
    top_3_percent: number;
    is_power_law_compliant: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ConcentrationCharts: React.FC = () => {
    const [sectorData, setSectorData] = useState<ConcentrationData | null>(null);
    const [stageData, setStageData] = useState<ConcentrationData | null>(null);
    const [powerLawData, setPowerLawData] = useState<PowerLawData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');

                const [sectorRes, stageRes, powerLawRes] = await Promise.all([
                    apiFetch(api.endpoints.risk.concentration.sector, {}, token),
                    apiFetch(api.endpoints.risk.concentration.stage, {}, token),
                    apiFetch(api.endpoints.risk.concentration.powerLaw, {}, token)
                ]);

                if (sectorRes.ok) setSectorData(await sectorRes.json());
                if (stageRes.ok) setStageData(await stageRes.json());
                if (powerLawRes.ok) setPowerLawData(await powerLawRes.json());
            } catch (error) {
                console.error("Failed to fetch concentration data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading concentration metrics...</div>;

    const formatDataForChart = (data: ConcentrationData | null) => {
        if (!data) return [];
        return data.labels.map((label, i) => ({
            name: label,
            value: data.values[i]
        }));
    };

    const sectorChartData = formatDataForChart(sectorData);
    const stageChartData = formatDataForChart(stageData);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sector Concentration */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sector Concentration</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sectorChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sectorChartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {sectorChartData.map((entry, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            {entry.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stage Concentration */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Stage Concentration</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stageChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(value) => `$${value / 1000000}M`} />
                            <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} />
                            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Power Law Metrics */}
            {powerLawData && (
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Power Law Compliance</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Gini Coefficient</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {powerLawData.gini_coefficient.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: &gt; 0.60</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Top 3 Concentration</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {(powerLawData.top_3_percent * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">% of Portfolio Value</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${powerLawData.is_power_law_compliant ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            <div className={`text-sm ${powerLawData.is_power_law_compliant ? 'text-green-700' : 'text-yellow-700'}`}>Status</div>
                            <div className={`text-xl font-bold ${powerLawData.is_power_law_compliant ? 'text-green-800' : 'text-yellow-800'}`}>
                                {powerLawData.is_power_law_compliant ? 'Compliant' : 'Balanced'}
                            </div>
                            <div className="text-xs opacity-75 mt-1">
                                {powerLawData.is_power_law_compliant ? 'High potential for outliers' : 'Risk is distributed evenly'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
