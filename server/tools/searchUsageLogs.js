const { usageLogsIndex } = require('../data/mockData');

// Tool: search_usage_logs
// Simulates ES query: GET /usage_logs-*/_search
// Filters by customer_id, returns last 7 days of activity.
function searchUsageLogs(customerId) {
    const logs = usageLogsIndex[customerId];
    if (!logs || logs.length === 0) {
        return { hits: [], total: 0 };
    }
    return {
        index: 'usage_logs-2026.*',
        query: `customer_id:"${customerId}" AND @timestamp:[now-7d TO now]`,
        hits: logs,
        total: logs.length,
        _shards: { total: 5, successful: 5, failed: 0 },
    };
}

module.exports = { searchUsageLogs };
