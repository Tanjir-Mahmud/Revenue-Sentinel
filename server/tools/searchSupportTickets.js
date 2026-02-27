const { supportTicketsIndex } = require('../data/mockData');

// Tool: search_support_tickets
// Simulates ES query: GET /support_tickets-*/_search
// Returns all tickets for customer with sentiment aggregation.
function searchSupportTickets(customerId) {
    const tickets = supportTicketsIndex[customerId];
    if (!tickets || tickets.length === 0) {
        return { hits: [], total: 0, sentiment_agg: {} };
    }

    const sentimentAgg = tickets.reduce((acc, t) => {
        acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
        return acc;
    }, {});

    const priorityAgg = tickets.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
    }, {});

    return {
        index: 'support_tickets-2026.*',
        query: `customer_id:"${customerId}"`,
        hits: tickets,
        total: tickets.length,
        aggregations: {
            sentiment_breakdown: sentimentAgg,
            priority_breakdown: priorityAgg,
        },
        _shards: { total: 3, successful: 3, failed: 0 },
    };
}

module.exports = { searchSupportTickets };
