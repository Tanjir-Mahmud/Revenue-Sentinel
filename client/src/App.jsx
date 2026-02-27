import { useState, useEffect, useRef, useCallback } from 'react';
import PipelineProgress from './components/PipelineProgress.jsx';
import HealthScoreGauge from './components/HealthScoreGauge.jsx';
import UsageTrendChart from './components/UsageTrendChart.jsx';
import TicketPanel from './components/TicketPanel.jsx';
import RemediesPanel from './components/RemediesPanel.jsx';
import WorkflowLog from './components/WorkflowLog.jsx';
import FinalReport from './components/FinalReport.jsx';

const SCENARIO_LABELS = {
    critical: '🔴 Critical Risk',
    at_risk: '🟠 At Risk',
    recovering: '🟡 Recovering',
    healthy: '🟢 Healthy',
    expansion: '💜 Expansion Ready',
};

export default function App() {
    const [customers, setCustomers] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [logEntries, setLogEntries] = useState([]);
    const [phaseStates, setPhaseStates] = useState({});
    const [healthData, setHealthData] = useState({ score: null, riskLevel: null, riskLabel: null, breakdown: null });
    const [usageLogs, setUsageLogs] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [sentimentAgg, setSentimentAgg] = useState(null);
    const [remedies, setRemedies] = useState([]);
    const [finalReport, setFinalReport] = useState(null);
    const [workflowResult, setWorkflowResult] = useState(null);
    const sseRef = useRef(null);

    // Load customers on mount
    useEffect(() => {
        fetch('/api/customers')
            .then((r) => r.json())
            .then((data) => {
                setCustomers(data);
                if (data.length > 0) setSelectedId(data[0].id);
            })
            .catch(() => {
                // Fallback demo customers
                const fallback = [
                    { id: 'CUST-001', name: 'Acme Corp', tier: 'Enterprise', scenario: 'critical' },
                    { id: 'CUST-002', name: 'Nexus Cloud', tier: 'Professional', scenario: 'expansion' },
                    { id: 'CUST-003', name: 'Prometheus AI', tier: 'Enterprise', scenario: 'at_risk' },
                    { id: 'CUST-004', name: 'StratosBuild', tier: 'Starter', scenario: 'healthy' },
                    { id: 'CUST-005', name: 'Vertex Systems', tier: 'Professional', scenario: 'recovering' },
                ];
                setCustomers(fallback);
                setSelectedId(fallback[0].id);
            });
    }, []);

    const addLog = useCallback((event, data) => {
        setLogEntries((prev) => [...prev, { event, data, timestamp: new Date().toISOString() }]);
    }, []);

    const handleAnalyze = useCallback(() => {
        if (!selectedId || isRunning) return;

        // Reset state
        setIsRunning(true);
        setLogEntries([]);
        setPhaseStates({});
        setHealthData({ score: null, riskLevel: null, riskLabel: null, breakdown: null });
        setUsageLogs([]);
        setTickets([]);
        setSentimentAgg(null);
        setRemedies([]);
        setFinalReport(null);
        setWorkflowResult(null);

        if (sseRef.current) sseRef.current.close();

        const es = new EventSource(`/api/analyze/${selectedId}`);
        sseRef.current = es;

        const handlers = {
            connected: (data) => addLog('connected', data),
            phase_start: (data) => {
                addLog('phase_start', data);
                setPhaseStates((prev) => ({ ...prev, [data.phase]: { status: 'active', name: data.name } }));
            },
            phase_complete: (data) => {
                addLog('phase_complete', data);
                setPhaseStates((prev) => ({ ...prev, [data.phase]: { status: 'complete' } }));
                if (data.score !== undefined) {
                    setHealthData((prev) => ({ ...prev, score: data.score }));
                }
            },
            phase_skip: (data) => {
                addLog('phase_skip', data);
                setPhaseStates((prev) => ({ ...prev, [data.phase]: { status: 'skipped' } }));
            },
            tool_result: (data) => {
                addLog('tool_result', data);
                // Distribute data to components
                if (data.tool === 'search_usage_logs') {
                    // Store preview logs for chart; full logs come from pipeline_complete
                }
                if (data.tool === 'search_support_tickets') {
                    setSentimentAgg(data.sentiment_agg);
                    setTickets(data.preview?.map((p) => ({
                        ticket_id: p.ticket_id,
                        priority: p.priority,
                        sentiment: p.sentiment,
                        status: p.status,
                        subject: p.subject,
                    })) || []);
                }
                if (data.tool === 'calculate_health_score') {
                    setHealthData({
                        score: data.score,
                        riskLevel: data.riskLevel,
                        riskLabel: data.riskLabel,
                        breakdown: data.breakdown,
                    });
                }
                if (data.tool === 'vector_search_remedies') {
                    setRemedies(data.hits || []);
                }
                if (data.tool === 'at_risk_workflow' || data.tool === 'expansion_workflow') {
                    setWorkflowResult(data);
                }
            },
            pipeline_complete: (data) => {
                addLog('pipeline_complete', data);
                setFinalReport(data.final_report);
                setUsageLogs(data.all_logs || []);
                setTickets(data.all_tickets || []);
                setIsRunning(false);
                es.close();
            },
            error: (data) => {
                addLog('error', data);
                setIsRunning(false);
                es.close();
            },
        };

        // Register all handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            es.addEventListener(event, (e) => {
                try {
                    handler(JSON.parse(e.data));
                } catch (err) {
                    console.error('SSE parse error', err);
                }
            });
        });

        es.onerror = () => {
            if (es.readyState === EventSource.CLOSED) {
                setIsRunning(false);
            }
        };
    }, [selectedId, isRunning, addLog]);

    const selectedCustomer = customers.find((c) => c.id === selectedId);

    return (
        <div className="app">
            {/* ─── Header ─────────────────────────────────────────────────────────── */}
            <header className="header">
                <div className="header-brand">
                    <div className="header-logo">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                            <circle cx="10" cy="10" r="3" fill="white" opacity="0.9" />
                        </svg>
                    </div>
                    <div>
                        <div className="header-title">Revenue Sentinel</div>
                        <div className="header-subtitle">Autonomous Customer Success &amp; Revenue Protection</div>
                    </div>
                </div>
                <div className="header-status">
                    <div className="status-dot" />
                    <span>Elasticsearch Connected</span>
                    <span style={{ color: 'var(--border-normal)', margin: '0 4px' }}>|</span>
                    <span className="mono" style={{ fontSize: 11 }}>
                        {new Date('2026-02-26T21:46:00+06:00').toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* ─── Main ───────────────────────────────────────────────────────────── */}
            <main className="main-content">
                {/* Control Panel */}
                <div className="control-panel">
                    <div className="select-wrapper">
                        <label className="select-label" htmlFor="customer-select">Customer Account</label>
                        <select
                            id="customer-select"
                            className="customer-select"
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            disabled={isRunning}
                        >
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} — {c.tier} {SCENARIO_LABELS[c.scenario] ? `(${SCENARIO_LABELS[c.scenario]})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        id="analyze-btn"
                        className="analyze-btn"
                        onClick={handleAnalyze}
                        disabled={isRunning || !selectedId}
                    >
                        {isRunning ? (
                            <>
                                <div className="spinner" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L14 8L8 15M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Run Analysis
                            </>
                        )}
                    </button>

                    {selectedCustomer && !isRunning && !finalReport && (
                        <div className="customer-info-chip">
                            <span>👤</span>
                            <span>{selectedCustomer.accountManager}</span>
                            <span style={{ color: 'var(--border-normal)' }}>|</span>
                            <span>{selectedCustomer.tier} Tier</span>
                        </div>
                    )}
                </div>

                {/* Pipeline Progress — always visible */}
                <PipelineProgress phaseStates={phaseStates} isRunning={isRunning} />

                {/* Dashboard Grid */}
                {(isRunning || finalReport || usageLogs.length > 0) ? (
                    <div className="dashboard-grid" style={{ marginTop: 20 }}>
                        {/* Column 1: Health Score Gauge */}
                        <HealthScoreGauge
                            score={healthData.score}
                            riskLevel={healthData.riskLevel}
                            riskLabel={healthData.riskLabel}
                            breakdown={healthData.breakdown}
                        />

                        {/* Column 2: Usage Trend Chart + Tickets */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <UsageTrendChart logs={usageLogs} />
                            <TicketPanel tickets={tickets} sentimentAgg={sentimentAgg} />
                        </div>

                        {/* Column 3: Remedies */}
                        <RemediesPanel remedies={remedies} />

                        {/* Full Width: Agent Log */}
                        <WorkflowLog entries={logEntries} isRunning={isRunning} />

                        {/* Full Width: Final Report */}
                        {finalReport && (
                            <FinalReport report={finalReport} workflowResult={workflowResult} />
                        )}
                    </div>
                ) : (
                    <div className="glass-card" style={{ marginTop: 20 }}>
                        <div className="idle-state">
                            <span className="idle-icon">🛡️</span>
                            <h2 className="idle-title">Revenue Sentinel Standing By</h2>
                            <p className="idle-subtitle">
                                Select a customer account and click <strong>Run Analysis</strong> to execute the 4-phase AI pipeline. The agent will autonomously detect churn signals and trigger remediation workflows.
                            </p>
                            <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { icon: '📊', label: 'Usage Logs', sub: 'search_usage_logs' },
                                    { icon: '🎫', label: 'Support Tickets', sub: 'search_support_tickets' },
                                    { icon: '❤️', label: 'Health Score', sub: 'calculate_health_score' },
                                    { icon: '🔍', label: 'Vector Remedies', sub: 'vector_search_remedies' },
                                ].map((tool) => (
                                    <div key={tool.label} style={{ textAlign: 'center', opacity: 0.7 }}>
                                        <div style={{ fontSize: 28, marginBottom: 6 }}>{tool.icon}</div>
                                        <div style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>{tool.label}</div>
                                        <div style={{ fontSize: 10, color: 'var(--gray-600)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{tool.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ─── Footer ─────────────────────────────────────────────────────────── */}
            <footer style={{
                borderTop: '1px solid var(--border-subtle)',
                padding: '12px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--gray-600)',
            }}>
                <span>Revenue Sentinel v1.0 — Powered by Elasticsearch Observability Complete</span>
                <span className="mono">COMPLIANCE: Synthetic data only · No real customer PII</span>
            </footer>
        </div>
    );
}
