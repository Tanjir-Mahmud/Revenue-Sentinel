export default function FinalReport({ report, workflowResult }) {
    if (!report) return null;

    const isAtRisk = report.type === 'at_risk';
    const isExpansion = report.type === 'expansion';
    const isMonitoring = report.type === 'monitoring';

    const headerColor = isAtRisk ? 'var(--red-400)' : isExpansion ? 'var(--purple-400)' : 'var(--blue-400)';
    const headerBg = isAtRisk ? 'rgba(239,68,68,0.08)' : isExpansion ? 'rgba(139,92,246,0.08)' : 'rgba(59,130,246,0.08)';
    const headerBorder = isAtRisk ? 'rgba(239,68,68,0.2)' : isExpansion ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)';

    return (
        <div className="glass-card report-card fade-in" style={{ gridColumn: '1 / -1' }}>
            {/* ─── Banner ─── */}
            <div style={{
                padding: '14px 20px',
                background: headerBg,
                border: `1px solid ${headerBorder}`,
                borderRadius: 10,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
            }}>
                <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: headerColor, marginBottom: 2 }}>
                        {isAtRisk ? '🚨 Revenue Sentinel Report — Critical Risk Detected' :
                            isExpansion ? '💰 Revenue Sentinel Report — Expansion Opportunity' :
                                '📊 Revenue Sentinel Report — Monitoring Mode'}
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {report.signal_detected?.description}
                    </p>
                </div>
                {report.action_taken?.time_saved && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: 8, fontSize: 12, color: 'var(--green-400)',
                    }}>
                        ⚡ {report.action_taken.time_saved}
                    </div>
                )}
            </div>

            <div className="report-sections">
                {/* ─── Signal Detected ─── */}
                <div className="report-section fade-in-delay-1">
                    <div className="report-section-header">
                        <div className={`report-section-icon ${isExpansion ? 'icon-expansion-signal' : 'icon-signal'}`}>
                            {isAtRisk ? '🚨' : isExpansion ? '💡' : '📊'}
                        </div>
                        <span className="report-section-title">Signal Detected</span>
                    </div>

                    <div className="report-field">
                        <div className="report-field-label">Category</div>
                        <div className="report-field-value" style={{ color: headerColor, fontWeight: 600 }}>
                            {report.signal_detected?.category}
                        </div>
                    </div>

                    {report.signal_detected?.evidence?.length > 0 && (
                        <div className="report-field">
                            <div className="report-field-label">Evidence</div>
                            {report.signal_detected.evidence.map((ev, i) => (
                                <div key={i} style={{ marginBottom: 8 }}>
                                    <div className="report-field-value" style={{ fontWeight: 500, fontSize: 12 }}>{ev.factor}</div>
                                    <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.4, marginTop: 2 }}>{ev.detail}</div>
                                    {ev.citation && (
                                        <span className="citation-id">{ev.citation}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Reasoning ─── */}
                <div className="report-section fade-in-delay-2">
                    <div className="report-section-header">
                        <div className="report-section-icon icon-reasoning">🧠</div>
                        <span className="report-section-title">Reasoning</span>
                    </div>

                    <div className="report-field">
                        <div className="report-field-label">Revenue Impact</div>
                        <div className="report-field-value">{report.reasoning?.revenue_impact}</div>
                    </div>

                    {report.reasoning?.cited_log_id && (
                        <div className="report-field">
                            <div className="report-field-label">Cited Log</div>
                            <span className="citation-id">📄 {report.reasoning.cited_log_id}</span>
                        </div>
                    )}
                    {report.reasoning?.cited_ticket_id && (
                        <div className="report-field">
                            <div className="report-field-label">Cited Ticket</div>
                            <span className="citation-id">🎫 {report.reasoning.cited_ticket_id}</span>
                        </div>
                    )}
                    {report.reasoning?.cited_remedy_id && (
                        <div className="report-field">
                            <div className="report-field-label">Cited Remedy</div>
                            <span className="citation-id">🔍 {report.reasoning.cited_remedy_id}</span>
                        </div>
                    )}
                </div>

                {/* ─── Action Taken ─── */}
                <div className="report-section fade-in-delay-3">
                    <div className="report-section-header">
                        <div className="report-section-icon icon-action">⚡</div>
                        <span className="report-section-title">Action Taken</span>
                    </div>

                    <div className="report-field">
                        <div className="report-field-label">Workflow Triggered</div>
                        <div className="report-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: headerColor }}>
                            {report.action_taken?.workflow}
                        </div>
                    </div>

                    <div className="report-field">
                        <div className="report-field-label">Rationale</div>
                        <div className="report-field-value">{report.action_taken?.rationale}</div>
                    </div>

                    {/* Notification cards */}
                    <div className="notification-cards" style={{ marginTop: 10 }}>
                        {report.action_taken?.jira_ticket && (
                            <div className="notif-card jira">
                                <div className="notif-service">🔵 Jira</div>
                                <div className="notif-detail">
                                    Ticket <strong>{report.action_taken.jira_ticket}</strong> created and assigned
                                </div>
                            </div>
                        )}
                        {report.action_taken?.slack_notification && (
                            <div className="notif-card slack">
                                <div className="notif-service">💬 Slack</div>
                                <div className="notif-detail">
                                    DM sent to <strong>{report.action_taken.slack_notification}</strong>
                                </div>
                            </div>
                        )}
                        {report.action_taken?.salesforce_opportunity && (
                            <div className="notif-card salesforce">
                                <div className="notif-service">☁ Salesforce</div>
                                <div className="notif-detail">
                                    Opportunity <strong>{report.action_taken.salesforce_opportunity}</strong> created
                                </div>
                            </div>
                        )}
                    </div>

                    {report.action_taken?.next_steps?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <div className="report-field-label" style={{ marginBottom: 6 }}>Next Steps</div>
                            <ul className="next-steps-list">
                                {report.action_taken.next_steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
