import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../config/api';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, Server, Clock, AlertTriangle, RefreshCw, Download, Calendar, Users } from 'lucide-react';

interface SystemSummary {
    total_requests: number;
    avg_response_time: number;
    p95_response_time: number;
    error_rate: number;
    active_users: number;
    avg_actions_per_user: number;
    top_endpoints: any[];
    timestamp: string;
}

interface ValuationSummary {
    total_valuations: number;
    avg_duration: number;
    cache_hit_rate: number;
    avg_complexity: number;
    method_popularity: Record<string, number>;
    timestamp: string;
}

export const PerformanceDashboard: React.FC = () => {
    const [systemMetrics, setSystemMetrics] = useState<SystemSummary | null>(null);
    const [valuationMetrics, setValuationMetrics] = useState<ValuationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            // In a real app, pass date range params
            const query = dateRange.start ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
            const res = await apiFetch(`/api/performance/summary${query}`, {
                method: 'GET'
            }, localStorage.getItem('token'));

            if (res.ok) {
                const data = await res.json();
                setSystemMetrics(data.system);
                setValuationMetrics(data.valuation);
                setError(null);
            } else {
                setError("Failed to load metrics. Ensure you have admin permissions.");
            }
        } catch (err) {
            setError("Network error loading metrics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [dateRange]);

    const handleExport = () => {
        if (!systemMetrics) return;

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Metric,Value\n"
            + `Total Requests,${systemMetrics.total_requests}\n`
            + `Avg Response Time,${systemMetrics.avg_response_time}\n`
            + `P95 Response Time,${systemMetrics.p95_response_time}\n`
            + `Error Rate,${systemMetrics.error_rate}\n`
            + `Valuations,${valuationMetrics?.total_valuations}\n`
            + `Avg Valuation Duration,${valuationMetrics?.avg_duration}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "performance_metrics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && !systemMetrics) {
        return <div className="p-8 text-center">Loading Performance Metrics...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                {error}
                <button onClick={fetchData} className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Retry</button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Activity className="w-8 h-8 text-system-blue" />
                    System Performance
                </h1>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <input
                            type="date"
                            className="text-sm outline-none"
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            className="text-sm outline-none"
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>

                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all text-gray-700">
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-system-blue text-white rounded-lg hover:bg-blue-600 shadow-sm transition-all">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Avg Response Time"
                    value={`${systemMetrics?.avg_response_time.toFixed(0)}ms`}
                    subValue={`P95: ${systemMetrics?.p95_response_time.toFixed(0)}ms`}
                    icon={Clock}
                    color="blue"
                />
                <MetricCard
                    title="Error Rate"
                    value={`${((systemMetrics?.error_rate || 0) * 100).toFixed(2)}%`}
                    subValue={`${systemMetrics?.total_requests} Total Requests`}
                    icon={AlertTriangle}
                    color={systemMetrics?.error_rate && systemMetrics.error_rate > 0.01 ? "red" : "green"}
                />
                <MetricCard
                    title="Valuation Duration"
                    value={`${valuationMetrics?.avg_duration.toFixed(0)}ms`}
                    subValue={`${valuationMetrics?.total_valuations} Runs`}
                    icon={Activity}
                    color="purple"
                />
                <MetricCard
                    title="Cache Hit Rate"
                    value={`${((valuationMetrics?.cache_hit_rate || 0) * 100).toFixed(1)}%`}
                    subValue="Efficiency"
                    icon={Server}
                    color="indigo"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Activity Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-system-blue" />
                        User Engagement
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Active Users (24h)</p>
                            <p className="text-2xl font-bold text-blue-700">{systemMetrics?.active_users || 0}</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Avg Actions / User</p>
                            <p className="text-2xl font-bold text-indigo-700">{systemMetrics?.avg_actions_per_user.toFixed(1) || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Method Popularity Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">Method Popularity</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.entries(valuationMetrics?.method_popularity || {}).map(([name, value]) => ({ name, value }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {Object.entries(valuationMetrics?.method_popularity || {}).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Endpoints Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">Top Endpoints (Traffic)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={systemMetrics?.top_endpoints || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="endpoint" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Requests" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Endpoint Latency Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">Endpoint Latency</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={systemMetrics?.top_endpoints || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="endpoint" tick={false} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avg_time" fill="#8B5CF6" name="Avg Time (ms)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subValue, icon: Icon, color }: any) => {
    const colorClasses: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        purple: "bg-purple-50 text-purple-600",
        indigo: "bg-indigo-50 text-indigo-600",
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between transition-all hover:shadow-md">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                <p className="text-xs text-gray-400 mt-1">{subValue}</p>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color] || "bg-gray-50 text-gray-600"}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
};
