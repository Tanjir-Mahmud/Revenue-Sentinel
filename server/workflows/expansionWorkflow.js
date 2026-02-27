const { v4: uuidv4 } = require('uuid');
const { customers } = require('../data/mockData');

/**
 * Workflow: expansion_workflow
 * Triggered when Health Score > 85.
 * Mocks: Salesforce opportunity creation + Slack notification to Sales Rep.
 */
function expansionWorkflow(customerId, healthScore, tierUtilization) {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error(`Customer ${customerId} not found`);

    const opportunityId = `OPP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date('2026-02-26T21:46:00+06:00').toISOString();

    // Suggest next tier
    const tierMap = { Starter: 'Professional', Professional: 'Enterprise', Enterprise: 'Enterprise+' };
    const suggestedTier = tierMap[customer.tier] || 'Enterprise+';
    const revenueImpact = customer.tier === 'Starter' ? 33000 : customer.tier === 'Professional' ? 75000 : 140000;

    // Mock Salesforce opportunity
    const salesforceOpportunity = {
        id: opportunityId,
        object: 'Opportunity',
        name: `${customer.name} — Tier Expansion to ${suggestedTier}`,
        stage: 'Expansion — Customer-Led Signal',
        close_date: (() => {
            const d = new Date('2026-02-26T21:46:00+06:00');
            d.setDate(d.getDate() + 30);
            return d.toISOString().slice(0, 10);
        })(),
        amount: revenueImpact,
        probability: 72,
        account_id: customerId,
        owner: customer.salesRep,
        created_at: timestamp,
        signals: [
            `Tier utilization at ${tierUtilization.toFixed(1)}% — approaching limit`,
            `Health Score: ${healthScore}/100 — fully engaged`,
            'Feature adoption: ML Inference + Batch Jobs active',
        ],
        url: `https://crm.revenuesentinel.io/opportunities/${opportunityId}`,
    };

    // Mock Slack notification to Sales Rep
    const slackNotification = {
        channel: '#sales-expansion-signals',
        dm_to: `@${customer.salesRep.toLowerCase().replace(' ', '.')}`,
        sent_at: timestamp,
        message: {
            text: `💰 *Expansion Signal Detected: ${customer.name}*`,
            blocks: [
                {
                    type: 'header',
                    text: `💰 Upsell Opportunity: ${customer.name}`,
                },
                {
                    type: 'section',
                    fields: [
                        { label: 'Current Tier', value: customer.tier },
                        { label: 'Suggested Tier', value: suggestedTier },
                        { label: 'Tier Utilization', value: `${tierUtilization.toFixed(1)}%` },
                        { label: 'Health Score', value: `${healthScore}/100` },
                        { label: 'Estimated ARR Impact', value: `$${revenueImpact.toLocaleString()}` },
                        { label: 'Win Probability', value: '72%' },
                    ],
                },
                {
                    type: 'action',
                    text: `View Opportunity → ${salesforceOpportunity.url}`,
                },
            ],
        },
    };

    return {
        workflow: 'expansion_workflow',
        triggered_at: timestamp,
        opportunity_id: opportunityId,
        customer_id: customerId,
        customer_name: customer.name,
        health_score: healthScore,
        salesforce_opportunity: salesforceOpportunity,
        slack_notification: slackNotification,
        estimated_additional_arr: revenueImpact,
        next_steps: [
            `Sales Rep ${customer.salesRep} notified via Slack`,
            `Salesforce opportunity ${opportunityId} created`,
            `Suggest upgrade pitch within 48 hours`,
            `Prepare ROI report for ${suggestedTier} tier value`,
        ],
    };
}

module.exports = { expansionWorkflow };
