import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface DashboardStats {
    status_checks: {
        asc_820: string;
        sox_404: string;
        audit_integrity: string;
        data_privacy: string;
    };
    risk_heatmap: {
        high: number;
        medium: number;
        low: number;
    };
    remediation_progress: number;
    doc_completeness: number;
}

const ComplianceDashboard: React.FC<{ valuationId: string }> = ({ valuationId }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Assuming base URL is configured in axios or relative proxy
                const response = await axios.get(`http://localhost:8000/api/compliance/dashboard-stats/${valuationId}`);
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch compliance stats", err);
                setError("Failed to load compliance data.");
            } finally {
                setLoading(false);
            }
        };

        if (valuationId) {
            fetchStats();
        }
    }, [valuationId]);

    if (loading) return <div>Loading Compliance Status...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!stats) return <div>No data available.</div>;

    const getStatusColor = (status: string) => {
        if (status === 'Compliant' || status === 'Verified') return 'text-green-600';
        if (status === 'Issue Detected' || status === 'Compromised') return 'text-red-600';
        return 'text-yellow-600';
    }

    return (
        <div className="p-6 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Compliance Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status List */}
                <div className="border p-4 rounded-md">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Live Compliance Status</h3>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center">
                            <span>ASC 820 Fair Value Hierarchy</span>
                            <span className={`font-bold ${getStatusColor(stats.status_checks.asc_820)}`}>
                                {stats.status_checks.asc_820} ●
                            </span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span>SOX 404 Internal Controls</span>
                            <span className={`font-bold ${getStatusColor(stats.status_checks.sox_404)}`}>
                                {stats.status_checks.sox_404} ●
                            </span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span>Data Privacy (GDPR/CCPA)</span>
                            <span className={`font-bold ${getStatusColor(stats.status_checks.data_privacy)}`}>
                                {stats.status_checks.data_privacy} ●
                            </span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span>Audit Trail Integrity</span>
                            <span className={`font-bold ${getStatusColor(stats.status_checks.audit_integrity)}`}>
                                {stats.status_checks.audit_integrity} ●
                            </span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span>Documentation Completeness</span>
                            <span className="font-bold text-blue-600">
                                {stats.doc_completeness}% ●
                            </span>
                        </li>
                    </ul >
                </div >

                {/* Risk Heatmap */}
                < div className="border p-4 rounded-md" >
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Risk Heatmap</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <span className="font-medium text-red-800">High Risk Issues</span>
                            <span className="text-2xl font-bold text-red-600">{stats.risk_heatmap.high}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                            <span className="font-medium text-yellow-800">Medium Risk Issues</span>
                            <span className="text-2xl font-bold text-yellow-600">{stats.risk_heatmap.medium}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="font-medium text-green-800">Low Risk Issues</span>
                            <span className="text-2xl font-bold text-green-600">{stats.risk_heatmap.low}</span>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Remediation Progress</span>
                                <span className="text-sm font-medium text-blue-700">{stats.remediation_progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${stats.remediation_progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div >
                </div >
            </div >
        </div >
    );
};

export default ComplianceDashboard;
