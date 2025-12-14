import React, { useEffect, useState } from 'react';

interface ValuationRun {
    id: string;
    company_name: string;
    mode: string;
    created_at: string;
    enterprise_value?: number;
}

interface Props {
    token: string;
    onSelect: (id: string) => void;
}

const ValuationList: React.FC<Props> = ({ token, onSelect }) => {
    const [runs, setRuns] = useState<ValuationRun[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRuns = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/runs?limit=20', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setRuns(data);
                }
            } catch (error) {
                console.error('Failed to fetch runs', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRuns();
    }, [token]);

    if (loading) return <div className="text-center p-4">Loading valuations...</div>;

    return (
        <div className="space-y-2">
            {runs.map(run => (
                <div
                    key={run.id}
                    onClick={() => onSelect(run.id)}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                    <div className="font-semibold">{run.company_name}</div>
                    <div className="text-xs text-gray-500 flex justify-between">
                        <span>{new Date(run.created_at).toLocaleDateString()}</span>
                        <span className="uppercase bg-gray-100 px-1 rounded">{run.mode}</span>
                    </div>
                </div>
            ))}
            {runs.length === 0 && (
                <div className="text-gray-500 text-center">No recent valuations found.</div>
            )}
        </div>
    );
};

export default ValuationList;
