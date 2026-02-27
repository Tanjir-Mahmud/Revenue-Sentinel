import { useEffect, useRef } from 'react';

const EVENT_CONFIG = {
    connected: { emoji: '🔗', label: 'Connected', color: 'var(--cyan-400)' },
    phase_start: { emoji: '▶', label: 'Phase Started', color: 'var(--purple-400)' },
    phase_complete: { emoji: '✓', label: 'Phase Complete', color: 'var(--green-400)' },
    phase_skip: { emoji: '⊘', label: 'Phase Skipped', color: 'var(--gray-600)' },
    tool_result: { emoji: '⚙', label: 'Tool Result', color: 'var(--blue-400)' },
    pipeline_complete: { emoji: '🏁', label: 'Pipeline Complete', color: 'var(--green-400)' },
    error: { emoji: '✕', label: 'Error', color: 'var(--red-400)' },
};

function formatLogDetail(event, data) {
    switch (event) {
        case 'connected':
            return `Customer: ${data.customer_name} (${data.customer_id})`;
        case 'phase_start':
            return `[Phase ${data.phase}] ${data.name}: ${data.description}`;
        case 'phase_complete':
            return `[Phase ${data.phase}] Completed${data.score !== undefined ? ` — Score: ${data.score}` : ''}`;
        case 'phase_skip':
            return data.reason;
        case 'tool_result':
            if (data.tool === 'search_usage_logs') {
                return `Tool: ${data.tool} | Index: ${data.index} | Hits: ${data.hits_count}\nLatest: ${data.preview?.slice(-1)[0]?.api_calls?.toLocaleString()} API calls, ${data.preview?.slice(-1)[0]?.error_5xx}% 5xx errors`;
            }
            if (data.tool === 'search_support_tickets') {
                const sentiment = data.sentiment_agg ? Object.entries(data.sentiment_agg).map(([k, v]) => `${k}:${v}`).join(', ') : '';
                return `Tool: ${data.tool} | Index: ${data.index} | Tickets: ${data.hits_count}\nSentiment → ${sentiment}`;
            }
            if (data.tool === 'calculate_health_score') {
                return `Tool: ${data.tool}\nScore: ${data.score}/100 — ${data.riskLevel} (${data.riskLabel})\nFactors: ${data.breakdown?.length || 0} signals detected`;
            }
            if (data.tool === 'vector_search_remedies') {
                return `Tool: ${data.tool} | ${data.query_type}\n${data.hits?.map(h => `${h.remedy_id} (${(h.similarity_score * 100).toFixed(0)}% match)`).join(', ')}`;
            }
            if (data.tool === 'at_risk_workflow') {
                return `Workflow: at_risk_workflow\nJira: ${data.jira_ticket_id} | Slack DM → ${data.slack_dm}\nARR at risk: $${data.estimated_arr_at_risk?.toLocaleString()}`;
            }
            if (data.tool === 'expansion_workflow') {
                return `Workflow: expansion_workflow\nSalesforce Opp: ${data.opportunity_id} | Slack DM → ${data.slack_dm}\nAdditional ARR: $${data.estimated_additional_arr?.toLocaleString()} (${data.win_probability}% win prob)`;
            }
            return JSON.stringify(data, null, 2);
        case 'pipeline_complete':
            return `Pipeline finished. Health Score: ${data.health_score}/100 — ${data.risk_level}`;
        case 'error':
            return `Error: ${data.message}`;
        default:
            return JSON.stringify(data);
    }
}

function LogEntry({ entry, index }) {
    const cfg = EVENT_CONFIG[entry.event] || { emoji: '•', label: entry.event, color: 'var(--gray-400)' };
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });

    return (
        <div className={`log-entry ${entry.event}`} style={{ animationDelay: `${index * 0.02}s` }}>
            <span className="log-time">{time}</span>
            <div className="log-content">
                <div className="log-event-type" style={{ color: cfg.color }}>
                    {cfg.emoji} {cfg.label}
                </div>
                <pre className="log-detail">{formatLogDetail(entry.event, entry.data)}</pre>
            </div>
        </div>
    );
}

export default function WorkflowLog({ entries, isRunning }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [entries]);

    return (
        <div className="glass-card workflow-card">
            <div className="section-header">
                <span className="section-title">
                    <span className="icon">📡</span>
                    Live Agent Log
                </span>
                {isRunning && (
                    <span style={{ fontSize: 11, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 4, animation: 'blink 1.5s ease infinite' }}>
                        ● Streaming from Elasticsearch
                    </span>
                )}
            </div>

            <div className="workflow-log">
                {entries.length === 0 ? (
                    <div className="empty-log">
                        <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📋</span>
                        Agent events will stream here in real-time
                    </div>
                ) : (
                    entries.map((entry, i) => (
                        <LogEntry key={i} entry={entry} index={i} />
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
