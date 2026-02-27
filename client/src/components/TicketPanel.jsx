const SENTIMENT_ICONS = {
    positive: { icon: '😊', label: 'Positive', cls: 'sentiment-positive' },
    neutral: { icon: '😐', label: 'Neutral', cls: 'sentiment-neutral' },
    negative: { icon: '😠', label: 'Negative', cls: 'sentiment-negative' },
};

const STATUS_CLASS = {
    open: 'status-open',
    pending: 'status-pending',
    resolved: 'status-resolved',
};

export default function TicketPanel({ tickets, sentimentAgg }) {
    if (!tickets || tickets.length === 0) {
        return (
            <div className="glass-card ticket-card">
                <div className="section-header">
                    <span className="section-title"><span className="icon">🎫</span> Support Tickets</span>
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                    No tickets — run analysis to populate
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card ticket-card">
            <div className="section-header">
                <span className="section-title"><span className="icon">🎫</span> Support Tickets</span>
                <span style={{ fontSize: 11, color: 'var(--gray-600)', fontFamily: 'var(--font-mono)' }}>
                    {tickets.length} total
                </span>
            </div>

            {sentimentAgg && (
                <div className="sentiment-row" style={{ marginBottom: 12 }}>
                    {Object.entries(sentimentAgg).map(([sentiment, count]) => {
                        const info = SENTIMENT_ICONS[sentiment] || { icon: '❓', cls: '' };
                        return (
                            <span key={sentiment} className={`sentiment-chip ${info.cls}`}>
                                {info.icon} {sentiment} ({count})
                            </span>
                        );
                    })}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                {tickets.map((ticket, i) => {
                    const sentiment = SENTIMENT_ICONS[ticket.sentiment] || SENTIMENT_ICONS.neutral;
                    const priorityCls = `priority-${ticket.priority?.toLowerCase()}`;
                    const statusCls = STATUS_CLASS[ticket.status] || '';
                    return (
                        <div key={ticket.ticket_id} className="ticket-item" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="ticket-header">
                                <span className={`badge ${priorityCls}`}>{ticket.priority}</span>
                                <span className={`ticket-id mono`}>{ticket.ticket_id}</span>
                                <span className={`mono ${statusCls}`} style={{ fontSize: 11, marginLeft: 'auto' }}>
                                    ● {ticket.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <p className="ticket-subject" style={{ flex: 1 }}>{ticket.subject}</p>
                                <span className="sentiment-icon" title={sentiment.label}>{sentiment.icon}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
