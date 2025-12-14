import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';

interface Annotation {
    id: string;
    date: string;
    label: string;
    type: string;
}

interface TimelineItem {
    date: string;
    total_ev: number;
    annotation?: Annotation;
}

interface ValuationTimelineProps {
    data: TimelineItem[];
}

export const ValuationTimeline: React.FC<ValuationTimelineProps> = ({ data }) => {
    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280' }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Total EV']}
                    />
                    <Line
                        type="monotone"
                        dataKey="total_ev"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                    />
                    {data.map((item) => (
                        item.annotation ? (
                            <ReferenceLine key={item.annotation.id} x={item.date} stroke="#EF4444" strokeDasharray="3 3">
                                <Label value={item.annotation.label} position="top" fill="#EF4444" fontSize={10} />
                            </ReferenceLine>
                        ) : null
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
