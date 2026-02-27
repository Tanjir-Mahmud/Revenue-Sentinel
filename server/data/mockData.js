// Synthetic Elasticsearch Indices — Revenue Sentinel Demo
// All data is open-source/synthetic. No real customer PII.

const { v4: uuidv4 } = require('uuid');

// ─── Customers ────────────────────────────────────────────────────────────────
const customers = [
  {
    id: 'CUST-001',
    name: 'Acme Corp',
    tier: 'Enterprise',
    tierLimit: 500000,
    accountManager: 'Sarah Chen',
    amSlack: '@sarah.chen',
    salesRep: 'Marcus Webb',
    scenario: 'critical', // health score will be < 40
  },
  {
    id: 'CUST-002',
    name: 'Nexus Cloud',
    tier: 'Professional',
    tierLimit: 100000,
    accountManager: 'James Okafor',
    amSlack: '@james.okafor',
    salesRep: 'Lisa Park',
    scenario: 'expansion', // health score will be > 85
  },
  {
    id: 'CUST-003',
    name: 'Prometheus AI',
    tier: 'Enterprise',
    tierLimit: 1000000,
    accountManager: 'Riya Patel',
    amSlack: '@riya.patel',
    salesRep: 'Tom Bradley',
    scenario: 'at_risk', // health score 20-39
  },
  {
    id: 'CUST-004',
    name: 'StratosBuild',
    tier: 'Starter',
    tierLimit: 20000,
    accountManager: 'Nina Johansson',
    amSlack: '@nina.johansson',
    salesRep: 'Alex Turner',
    scenario: 'healthy', // health score 60-84
  },
  {
    id: 'CUST-005',
    name: 'Vertex Systems',
    tier: 'Professional',
    tierLimit: 150000,
    accountManager: 'Carlos Mendez',
    amSlack: '@carlos.mendez',
    salesRep: 'Priya Sharma',
    scenario: 'recovering', // health score 40-59
  },
];

// ─── Usage Logs Index ─────────────────────────────────────────────────────────
// 7 days of data per customer. Mimics ES index: usage_logs-*
const usageLogsIndex = {};

const usagePatterns = {
  critical: {
    // Dramatic decline + high 500 errors
    apiCalls: [82000, 71000, 58000, 44000, 31000, 22000, 9800],
    errorRate5xx: [1.2, 2.8, 5.9, 8.4, 11.2, 14.7, 18.3],
    errorRate4xx: [2.1, 3.0, 4.5, 6.1, 7.8, 9.2, 10.5],
    features: ['api-core', 'webhooks'],
  },
  expansion: {
    // Steady growth approaching tier limit
    apiCalls: [78000, 82000, 86000, 89000, 92000, 95000, 97800],
    errorRate5xx: [0.3, 0.2, 0.4, 0.3, 0.2, 0.3, 0.2],
    errorRate4xx: [0.8, 0.7, 0.9, 0.8, 0.7, 0.6, 0.5],
    features: ['api-core', 'analytics', 'webhooks', 'ml-inference', 'batch-jobs'],
  },
  at_risk: {
    // Moderate decline + some 500 errors
    apiCalls: [45000, 42000, 38000, 35000, 31000, 28000, 24000],
    errorRate5xx: [1.0, 2.1, 3.4, 4.8, 5.2, 6.1, 7.0],
    errorRate4xx: [1.5, 2.0, 2.8, 3.5, 4.0, 4.5, 5.0],
    features: ['api-core', 'analytics'],
  },
  healthy: {
    // Stable usage
    apiCalls: [15200, 15800, 16100, 15900, 16300, 15700, 16000],
    errorRate5xx: [0.2, 0.3, 0.2, 0.4, 0.3, 0.2, 0.3],
    errorRate4xx: [0.6, 0.7, 0.5, 0.8, 0.6, 0.7, 0.6],
    features: ['api-core', 'analytics', 'webhooks'],
  },
  recovering: {
    // Was declining, now stabilizing
    apiCalls: [30000, 27000, 25000, 24500, 25100, 26000, 27200],
    errorRate5xx: [6.0, 5.2, 4.1, 3.0, 2.1, 1.8, 1.6],
    errorRate4xx: [4.0, 3.5, 3.0, 2.8, 2.5, 2.2, 2.0],
    features: ['api-core', 'webhooks'],
  },
};

const today = new Date('2026-02-26T21:46:00+06:00');

customers.forEach((cust) => {
  const pattern = usagePatterns[cust.scenario];
  usageLogsIndex[cust.id] = pattern.apiCalls.map((calls, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return {
      log_id: `LOG-${cust.id}-${date.toISOString().slice(0, 10).replace(/-/g, '')}`,
      customer_id: cust.id,
      timestamp: date.toISOString(),
      api_calls: calls,
      error_rate_5xx: pattern.errorRate5xx[i],
      error_rate_4xx: pattern.errorRate4xx[i],
      active_features: pattern.features,
      tier_limit: cust.tierLimit,
      tier_utilization_pct: parseFloat(((calls / cust.tierLimit) * 100).toFixed(1)),
    };
  });
});

// ─── Support Tickets Index ────────────────────────────────────────────────────
// Mimics ES index: support_tickets-*
const ticketTemplates = {
  critical: [
    { priority: 'P1', sentiment: 'negative', status: 'open', subject: 'Production API returning 503 — complete outage for 4+ hours', category: '500-error' },
    { priority: 'P1', sentiment: 'negative', status: 'open', subject: 'Authentication tokens invalidated across all endpoints', category: 'auth-failure' },
    { priority: 'P2', sentiment: 'negative', status: 'pending', subject: 'Webhook delivery failures causing data pipeline collapse', category: '500-error' },
    { priority: 'P2', sentiment: 'negative', status: 'open', subject: 'SLA breach imminent — escalating to executive team', category: 'sla' },
    { priority: 'P3', sentiment: 'negative', status: 'open', subject: 'Rate limit errors despite being under quota', category: 'quota' },
  ],
  expansion: [
    { priority: 'P3', sentiment: 'positive', status: 'resolved', subject: 'Question about ML Inference batch limits for scale-up', category: 'quota' },
    { priority: 'P4', sentiment: 'positive', status: 'resolved', subject: 'Requesting enterprise tier pricing — usage near cap', category: 'billing' },
  ],
  at_risk: [
    { priority: 'P1', sentiment: 'negative', status: 'open', subject: 'Intermittent 500 errors on analytics endpoints', category: '500-error' },
    { priority: 'P2', sentiment: 'negative', status: 'open', subject: 'API latency spikes above 4000ms threshold', category: 'performance' },
    { priority: 'P3', sentiment: 'neutral', status: 'pending', subject: 'Documentation unclear for new auth flow changes', category: 'docs' },
  ],
  healthy: [
    { priority: 'P3', sentiment: 'neutral', status: 'resolved', subject: 'Minor UI inconsistency in dashboard export', category: 'ui' },
    { priority: 'P4', sentiment: 'positive', status: 'resolved', subject: 'Feature request: CSV export pagination', category: 'feature-req' },
  ],
  recovering: [
    { priority: 'P2', sentiment: 'neutral', status: 'pending', subject: 'Error rate improving but still above baseline', category: '500-error' },
    { priority: 'P3', sentiment: 'neutral', status: 'pending', subject: 'Scheduled maintenance window needed for remediation validation', category: 'maintenance' },
  ],
};

const supportTicketsIndex = {};
customers.forEach((cust) => {
  const templates = ticketTemplates[cust.scenario];
  supportTicketsIndex[cust.id] = templates.map((t, i) => {
    const created = new Date(today);
    created.setDate(created.getDate() - Math.floor(Math.random() * 7));
    return {
      ticket_id: `TKT-${cust.id}-${String(1000 + i).padStart(4, '0')}`,
      customer_id: cust.id,
      created_at: created.toISOString(),
      priority: t.priority,
      sentiment: t.sentiment,
      status: t.status,
      subject: t.subject,
      category: t.category,
      assignee: cust.accountManager,
    };
  });
});

// ─── Remedies Vector Index ────────────────────────────────────────────────────
// Past successful resolutions with mock cosine similarity scores
const remediesIndex = [
  {
    remedy_id: 'REM-2025-0442',
    error_pattern: '500-error + api-core + auth-failure',
    resolution: 'Rotated API gateway certificates; updated OAuth token expiry policy to 24h. Re-provisioned load balancer health checks.',
    customer_segment: 'Enterprise',
    time_to_resolve_hrs: 2.5,
    outcome: 'Churn prevented — customer renewed 3-year contract',
    similarity_score: 0.94,
  },
  {
    remedy_id: 'REM-2025-0391',
    error_pattern: '500-error + webhooks + pipeline-failure',
    resolution: 'Identified misconfigured retry logic in webhook dispatcher. Deployed hotfix v2.14.3. Enabled dead-letter queue for zero data loss.',
    customer_segment: 'Enterprise',
    time_to_resolve_hrs: 1.8,
    outcome: 'NPS recovered from 3 → 9 within 30 days',
    similarity_score: 0.87,
  },
  {
    remedy_id: 'REM-2024-1204',
    error_pattern: 'declining-api-calls + negative-sentiment + P1-ticket',
    resolution: 'Emergency account review call with C-suite. Offered 3-month credit. Dedicated SRE assigned for 30 days.',
    customer_segment: 'Enterprise',
    time_to_resolve_hrs: 4.0,
    outcome: 'Account stabilized; upsell to Enterprise+ 6 months later',
    similarity_score: 0.81,
  },
];

module.exports = {
  customers,
  usageLogsIndex,
  supportTicketsIndex,
  remediesIndex,
};
