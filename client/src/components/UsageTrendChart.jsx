import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Area, AreaChart, ComposedChart, Bar
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(17,24,39,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
        }}>
            <p style={{ color: 'var(--gray-400)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color, margin: '2px 0' }}>
                    {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
                    {p.name.includes('Error') ? '%' : ''}
                </p>
            ))}
        </div>
    );
};

export default function UsageTrendChart({ logs }) {
    if (!logs || logs.length === 0) {
        return (
            <div className="glass-card chart-card">
                <div className="section-header">
                    <span className="section-title">
                        <span className="icon">📊</span>
                        7-Day Usage Trend
                    </span>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)', fontSize: 13 }}>
                    No data — run analysis to populate
                </div>
            </div>
        );
    }

    const data = logs.map((log) => ({
        date: log.timestamp?.slice(5, 10) || log.date,
        'API Calls': log.api_calls,
        '5xx Errors (%)': log.error_rate_5xx,
        '4xx Errors (%)': log.error_rate_4xx,
    }));

    return (
        <div className="glass-card chart-card">
            <div className="section-header">
                <span className="section-title">
                    <span className="icon">📊</span>
                    7-Day Usage Trend
                </span>
                <span style={{ fontSize: 11, color: 'var(--gray-600)', fontFamily: 'var(--font-mono)' }}>
                    index: usage_logs-2026.*
                </span>
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="apiGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: 'var(--gray-600)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="calls"
                            orientation="left"
                            tick={{ fill: 'var(--gray-600)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                            width={40}
                        />
                        <YAxis
                            yAxisId="errors"
                            orientation="right"
                            tick={{ fill: 'var(--gray-600)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                            width={36}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                            formatter={(value) => <span style={{ color: 'var(--gray-400)' }}>{value}</span>}
                        />
                        <Area
                            yAxisId="calls"
                            type="monotone"
                            dataKey="API Calls"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="url(#apiGradient)"
                            dot={{ fill: '#8b5cf6', r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            yAxisId="errors"
                            type="monotone"
                            dataKey="5xx Errors (%)"
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="4 2"
                            dot={{ fill: '#ef4444', r: 2 }}
                        />
                        <Line
                            yAxisId="errors"
                            type="monotone"
                            dataKey="4xx Errors (%)"
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            strokeDasharray="2 2"
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
