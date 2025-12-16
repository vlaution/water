import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { Activity, Server, Database, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SystemStats {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
    uptime_seconds: number;
    active_connections: number;
}

interface RequestLog {
    timestamp: string;
    method: string;
    endpoint: string;
    status_code: number;
    duration_ms: number;
}

interface HealthMetrics {
    system: SystemStats;
    requests: {
        total: number;
        success: number;
        error: number;
    };
    recent_logs: RequestLog[];
}

export const SystemHealthDashboard: React.FC = () => {
    const { token } = useAuth();
    const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchMetrics = async () => {
        try {
            const res = await fetch(api.url('/api/admin/system-health'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMetrics(await res.json());
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch system health:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const getStatusColor = (code: number) => {
        if (code >= 500) return 'text-red-600 bg-red-50';
        if (code >= 400) return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };

    if (loading && !metrics) {
        return <div className="flex justify-center items-center h-64">Loading system metrics...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="text-system-blue" />
                        System Health Monitor
                    </h1>
                    <p className="text-gray-500 text-sm">Real-time performance metrics and logs</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Clock size={16} />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                    <button onClick={fetchMetrics} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-gray-500 text-sm font-medium">CPU Usage</div>
                        <Server size={18} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics?.system.cpu_percent}%</div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${metrics?.system.cpu_percent}%` }} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-gray-500 text-sm font-medium">Memory Usage</div>
                        <Database size={18} className="text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics?.system.memory_percent}%</div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${metrics?.system.memory_percent}%` }} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-gray-500 text-sm font-medium">System Uptime</div>
                        <CheckCircle size={18} className="text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatUptime(metrics?.system.uptime_seconds || 0)}</div>
                    <div className="text-xs text-gray-400 mt-1">Since last restart</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-gray-500 text-sm font-medium">Error Rate</div>
                        <AlertTriangle size={18} className="text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {metrics?.requests.total ? ((metrics.requests.error / metrics.requests.total) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{metrics?.requests.error} errors / {metrics?.requests.total} reqs</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Logs */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-800">
                        Recent API Requests
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Method</th>
                                    <th className="px-6 py-3">Endpoint</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {metrics?.recent_logs.map((log, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-700">{log.method}</td>
                                        <td className="px-6 py-3 text-gray-600 font-mono text-xs truncate max-w-[200px]" title={log.endpoint}>
                                            {log.endpoint}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(log.status_code)}`}>
                                                {log.status_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right text-gray-500 font-mono">
                                            {log.duration_ms.toFixed(0)}ms
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Request Volume Chart (Simplified) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">Request Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Success', value: metrics?.requests.success || 0, fill: '#10B981' },
                                { name: 'Error', value: metrics?.requests.error || 0, fill: '#EF4444' },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
