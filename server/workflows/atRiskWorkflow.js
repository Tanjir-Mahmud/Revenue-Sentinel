const { v4: uuidv4 } = require('uuid');
const { customers } = require('../data/mockData');

/**
 * Workflow: at_risk_workflow
 * Triggered when Health Score < 40.
 * Mocks: Jira ticket creation + Slack DM to Account Manager.
 */
function atRiskWorkflow(customerId, healthScore, riskFactors, remedies) {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error(`Customer ${customerId} not found`);

    const jiraTicketId = `CSRE-${Math.floor(Math.random() * 9000) + 1000}`;
    const incidentId = `INC-${uuidv4().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date('2026-02-26T21:46:00+06:00').toISOString();

    // Mock Jira ticket
    const jiraTicket = {
        id: jiraTicketId,
        project: 'Customer Success & Revenue Engineering',
        type: 'Churn Risk Incident',
        priority: healthScore < 20 ? 'Critical' : 'High',
        status: 'Open',
        created_at: timestamp,
        title: `[CHURN RISK] ${customer.name} — Health Score ${healthScore}/100`,
        description: [
            `Customer: ${customer.name} (${customerId})`,
            `Health Score: ${healthScore}/100 — ${healthScore < 20 ? 'CRITICAL' : 'HIGH'} Risk`,
            '',
            '**Risk Factors Detected:**',
            ...riskFactors
                .filter((f) => f.delta < 0)
                .map((f) => `• ${f.factor}: ${f.detail}`),
            '',
            '**Recommended Remediation:**',
            ...(remedies?.hits?.slice(0, 2).map((r, i) => `${i + 1}. [${r.remedy_id}] ${r.resolution.slice(0, 100)}...`) || []),
        ].join('\n'),
        labels: ['churn-risk', customer.tier.toLowerCase(), `health-${healthScore}`],
        assignee: customer.accountManager,
        url: `https://jira.revenuesentinel.io/browse/${jiraTicketId}`,
    };

    // Mock Slack notification
    const slackNotification = {
        channel: `#cs-alerts-${customer.tier.toLowerCase()}`,
        dm_to: customer.amSlack,
        sent_at: timestamp,
        message: {
            text: `🚨 *Revenue Sentinel Alert — ${healthScore < 20 ? 'CRITICAL' : 'HIGH'} Churn Risk*`,
            blocks: [
                {
                    type: 'header',
                    text: `🚨 Churn Risk Detected: ${customer.name}`,
                },
                {
                    type: 'section',
                    fields: [
                        { label: 'Health Score', value: `${healthScore}/100` },
                        { label: 'Risk Level', value: healthScore < 20 ? 'CRITICAL' : 'HIGH' },
                        { label: 'Account Manager', value: customer.accountManager },
                        { label: 'Jira Ticket', value: jiraTicketId },
                    ],
                },
                {
                    type: 'action',
                    text: `View Full Report → ${jiraTicket.url}`,
                },
            ],
        },
    };

    return {
        workflow: 'at_risk_workflow',
        triggered_at: timestamp,
        incident_id: incidentId,
        customer_id: customerId,
        customer_name: customer.name,
        health_score: healthScore,
        jira_ticket: jiraTicket,
        slack_notification: slackNotification,
        estimated_arr_at_risk: customer.tier === 'Enterprise' ? 120000 : customer.tier === 'Professional' ? 45000 : 12000,
        next_steps: [
            `Account Manager ${customer.accountManager} notified via Slack ${customer.amSlack}`,
            `Jira ticket ${jiraTicketId} created and assigned`,
            'Emergency call scheduled within 24 hours',
            'SRE on-call paged for technical remediation',
        ],
    };
}

module.exports = { atRiskWorkflow };
