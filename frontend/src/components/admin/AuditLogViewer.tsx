import React, { useEffect, useState } from 'react';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface AuditLog {
    id: number;
    timestamp: string;
    user_id: number;
    action_type: string;
    resource_type: string;
    resource_id: string;
    ip_address: string;
    details: string;
}

export const AuditLogViewer: React.FC = () => {
    const { token } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch(api.url('/audit/logs'), {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch audit logs');
                }

                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [token]);

    if (loading) return <div className="p-4">Loading audit logs...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6 bg-white/50 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Audit Logs</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">User ID</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Resource</th>
                            <th className="px-6 py-3">IP Address</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50/30">
                                <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4">{log.user_id}</td>
                                <td className="px-6 py-4 font-medium text-blue-600">{log.action_type}</td>
                                <td className="px-6 py-4">{log.resource_type} {log.resource_id ? `(${log.resource_id})` : ''}</td>
                                <td className="px-6 py-4 font-mono text-xs">{log.ip_address}</td>
                                <td className="px-6 py-4 max-w-xs truncate" title={log.details}>{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
