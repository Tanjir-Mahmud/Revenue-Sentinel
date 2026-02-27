/**
 * Tool: calculate_health_score
 * ES|QL-inspired scoring logic for customer health.
 * Score range: 0–100
 *
 * Deductions:
 *  -30  API calls declined > 20% week-over-week (comparing day 1→7)
 *  -20  Latest 500-error rate > 5%
 *  -15  Per open P1 or P2 ticket (max -30)
 *  -10  Negative sentiment ratio > 40%
 *  -5   4xx error rate > 8% (warning)
 *
 * Bonuses:
 *  +20  Tier utilization > 90% (expansion signal)
 *  +10  All tickets resolved and positive sentiment ratio > 60%
 */
function calculateHealthScore(usageLogs, ticketData) {
    let score = 100;
    const breakdown = [];

    // ── API Call Decline ───────────────────────────────────────────────────────
    const firstWeekCalls = usageLogs.hits[0]?.api_calls ?? 0;
    const lastDayCalls = usageLogs.hits[usageLogs.hits.length - 1]?.api_calls ?? 0;
    const declineRatio = firstWeekCalls > 0
        ? (firstWeekCalls - lastDayCalls) / firstWeekCalls
        : 0;

    if (declineRatio > 0.20) {
        const penalty = 30;
        score -= penalty;
        breakdown.push({
            factor: 'API Call Decline',
            delta: -penalty,
            detail: `${(declineRatio * 100).toFixed(1)}% decline over 7 days (${firstWeekCalls.toLocaleString()} → ${lastDayCalls.toLocaleString()})`,
            esql: `FROM usage_logs-* | STATS start=FIRST(api_calls), end=LAST(api_calls) | EVAL decline=(start-end)/start`,
        });
    } else if (declineRatio < -0.05) {
        // Growing — positive signal
        breakdown.push({
            factor: 'API Call Growth',
            delta: 0,
            detail: `${(Math.abs(declineRatio) * 100).toFixed(1)}% growth over 7 days`,
            esql: `FROM usage_logs-* | STATS start=FIRST(api_calls), end=LAST(api_calls) | EVAL growth=(end-start)/start`,
        });
    }

    // ── 500 Error Rate ─────────────────────────────────────────────────────────
    const latest5xxRate = usageLogs.hits[usageLogs.hits.length - 1]?.error_rate_5xx ?? 0;
    if (latest5xxRate > 5) {
        const penalty = 20;
        score -= penalty;
        breakdown.push({
            factor: 'High 5xx Error Rate',
            delta: -penalty,
            detail: `Current 500-error rate: ${latest5xxRate.toFixed(1)}% (threshold: 5%)`,
            esql: `FROM usage_logs-* | WHERE error_rate_5xx > 5 | STATS AVG(error_rate_5xx)`,
            referenceLogId: usageLogs.hits[usageLogs.hits.length - 1]?.log_id,
        });
    }

    // ── 4xx Error Rate ─────────────────────────────────────────────────────────
    const latest4xxRate = usageLogs.hits[usageLogs.hits.length - 1]?.error_rate_4xx ?? 0;
    if (latest4xxRate > 8) {
        const penalty = 5;
        score -= penalty;
        breakdown.push({
            factor: 'Elevated 4xx Error Rate',
            delta: -penalty,
            detail: `Current 400-error rate: ${latest4xxRate.toFixed(1)}% (warning threshold: 8%)`,
            esql: `FROM usage_logs-* | WHERE error_rate_4xx > 8 | COUNT()`,
        });
    }

    // ── Open P1/P2 Tickets ─────────────────────────────────────────────────────
    const openCriticalTickets = ticketData.hits.filter(
        (t) => (t.priority === 'P1' || t.priority === 'P2') && t.status !== 'resolved'
    );
    const ticketPenalty = Math.min(openCriticalTickets.length * 15, 30);
    if (ticketPenalty > 0) {
        score -= ticketPenalty;
        breakdown.push({
            factor: 'Open Critical Tickets',
            delta: -ticketPenalty,
            detail: `${openCriticalTickets.length} open P1/P2 tickets (-15 each, max -30)`,
            esql: `FROM support_tickets-* | WHERE priority IN ("P1","P2") AND status != "resolved" | COUNT()`,
            referenceTicketIds: openCriticalTickets.map((t) => t.ticket_id),
        });
    }

    // ── Negative Sentiment ─────────────────────────────────────────────────────
    const totalTickets = ticketData.hits.length;
    const negativeTickets = ticketData.hits.filter((t) => t.sentiment === 'negative').length;
    const positiveTickets = ticketData.hits.filter((t) => t.sentiment === 'positive').length;
    const negRatio = totalTickets > 0 ? negativeTickets / totalTickets : 0;
    const posRatio = totalTickets > 0 ? positiveTickets / totalTickets : 0;

    if (negRatio > 0.40) {
        const penalty = 10;
        score -= penalty;
        breakdown.push({
            factor: 'Negative Sentiment Spike',
            delta: -penalty,
            detail: `${(negRatio * 100).toFixed(0)}% of tickets express negative sentiment (threshold: 40%)`,
            esql: `FROM support_tickets-* | WHERE sentiment=="negative" | STATS ratio=COUNT()/TOTAL()`,
        });
    }

    // ── Tier Utilization Bonus ─────────────────────────────────────────────────
    const latestUtilization = usageLogs.hits[usageLogs.hits.length - 1]?.tier_utilization_pct ?? 0;
    if (latestUtilization > 90) {
        const bonus = 20;
        score += bonus;
        breakdown.push({
            factor: 'Tier Limit Approaching (Expansion Signal)',
            delta: +bonus,
            detail: `Tier utilization at ${latestUtilization.toFixed(1)}% — upgrade candidate`,
            esql: `FROM usage_logs-* | WHERE tier_utilization_pct > 90 | LATEST(api_calls, tier_limit)`,
        });
    }

    // ── Positive Sentiment Bonus ───────────────────────────────────────────────
    if (posRatio > 0.60 && openCriticalTickets.length === 0) {
        const bonus = 10;
        score += bonus;
        breakdown.push({
            factor: 'Positive Engagement Signal',
            delta: +bonus,
            detail: `${(posRatio * 100).toFixed(0)}% positive sentiment with no critical open tickets`,
            esql: `FROM support_tickets-* | WHERE sentiment=="positive" AND status=="resolved" | STATS ratio=COUNT()/TOTAL()`,
        });
    }

    score = Math.max(0, Math.min(100, score));

    // ── Risk Classification ────────────────────────────────────────────────────
    let riskLevel, riskLabel;
    if (score < 20) {
        riskLevel = 'CRITICAL';
        riskLabel = 'Immediate action required';
    } else if (score < 40) {
        riskLevel = 'HIGH';
        riskLabel = 'At-risk — churn likely within 30 days';
    } else if (score < 60) {
        riskLevel = 'MEDIUM';
        riskLabel = 'Recovering — monitor closely';
    } else if (score < 85) {
        riskLevel = 'LOW';
        riskLabel = 'Healthy — routine engagement';
    } else {
        riskLevel = 'EXPANSION';
        riskLabel = 'Expansion opportunity detected';
    }

    return {
        score: Math.round(score),
        riskLevel,
        riskLabel,
        breakdown,
        tierUtilization: latestUtilization,
        esqlStatement: `FROM usage_logs-*,support_tickets-* | WHERE customer_id == "${usageLogs.hits[0]?.customer_id}" | EVAL health=100 - decline_penalty - error_penalty - ticket_penalty + utilization_bonus`,
    };
}

module.exports = { calculateHealthScore };
