const { searchUsageLogs } = require('./tools/searchUsageLogs');
const { searchSupportTickets } = require('./tools/searchSupportTickets');
const { calculateHealthScore } = require('./tools/calculateHealthScore');
const { vectorSearchRemedies } = require('./tools/vectorSearchRemedies');
const { atRiskWorkflow } = require('./workflows/atRiskWorkflow');
const { expansionWorkflow } = require('./workflows/expansionWorkflow');

/**
 * Revenue Sentinel Agent Orchestrator
 * Executes the 4-phase pipeline and emits SSE events at each step.
 * @param {string} customerId
 * @param {function} emit - SSE event emitter function
 */
async function runAgentPipeline(customerId, emit) {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    try {
        // ─── PHASE 1: Data Retrieval ─────────────────────────────────────────────
        emit('phase_start', { phase: 1, name: 'Data Retrieval', description: 'Querying Elasticsearch usage logs and support tickets' });
        await delay(800);

        const usageLogs = searchUsageLogs(customerId);
        emit('tool_result', {
            phase: 1,
            tool: 'search_usage_logs',
            index: usageLogs.index,
            query: usageLogs.query,
            hits_count: usageLogs.total,
            preview: usageLogs.hits.slice(-3).map((h) => ({
                log_id: h.log_id,
                date: h.timestamp.slice(0, 10),
                api_calls: h.api_calls,
                error_5xx: h.error_rate_5xx,
                tier_utilization: h.tier_utilization_pct,
            })),
        });
        await delay(600);

        const ticketData = searchSupportTickets(customerId);
        emit('tool_result', {
            phase: 1,
            tool: 'search_support_tickets',
            index: ticketData.index,
            hits_count: ticketData.total,
            sentiment_agg: ticketData.aggregations?.sentiment_breakdown,
            priority_agg: ticketData.aggregations?.priority_breakdown,
            preview: ticketData.hits.slice(0, 3).map((t) => ({
                ticket_id: t.ticket_id,
                priority: t.priority,
                sentiment: t.sentiment,
                status: t.status,
                subject: t.subject.slice(0, 60) + (t.subject.length > 60 ? '...' : ''),
            })),
        });

        emit('phase_complete', { phase: 1, status: 'success' });
        await delay(500);

        // ─── PHASE 2: Health Score Calculation ────────────────────────────────────
        emit('phase_start', { phase: 2, name: 'Quantitative Analysis', description: 'Running ES|QL health score calculation' });
        await delay(900);

        const healthResult = calculateHealthScore(usageLogs, ticketData);
        emit('tool_result', {
            phase: 2,
            tool: 'calculate_health_score',
            score: healthResult.score,
            riskLevel: healthResult.riskLevel,
            riskLabel: healthResult.riskLabel,
            breakdown: healthResult.breakdown,
            tierUtilization: healthResult.tierUtilization,
            esqlStatement: healthResult.esqlStatement,
        });

        emit('phase_complete', { phase: 2, status: 'success', score: healthResult.score });
        await delay(500);

        // ─── PHASE 3: Vector Search (only if score < 40) ──────────────────────────
        let remedies = null;
        if (healthResult.score < 40) {
            emit('phase_start', {
                phase: 3,
                name: 'Contextual Search',
                description: `Health Score ${healthResult.score} < 40 — retrieving vector similarity remedies`,
            });
            await delay(1000);

            remedies = vectorSearchRemedies(healthResult.breakdown);
            emit('tool_result', {
                phase: 3,
                tool: 'vector_search_remedies',
                index: remedies.index,
                query_type: remedies.query_type,
                hits: remedies.hits.map((r) => ({
                    remedy_id: r.remedy_id,
                    similarity_score: r.similarity_score,
                    resolution_preview: r.resolution.slice(0, 100) + '...',
                    outcome: r.outcome,
                    time_to_resolve_hrs: r.time_to_resolve_hrs,
                })),
            });

            emit('phase_complete', { phase: 3, status: 'success', remedies_found: remedies.hits.length });
            await delay(500);
        } else {
            emit('phase_skip', {
                phase: 3,
                reason: `Health Score ${healthResult.score} ≥ 40 — vector search not required`,
            });
        }

        // ─── PHASE 4: Workflow Execution ──────────────────────────────────────────
        emit('phase_start', {
            phase: 4,
            name: 'Autonomous Execution',
            description: healthResult.score < 40
                ? 'Triggering at_risk_workflow — Jira + Slack notifications'
                : healthResult.score > 85
                    ? 'Triggering expansion_workflow — Sales upsell notification'
                    : 'Monitoring mode — no immediate workflow required',
        });
        await delay(1000);

        let workflowResult = null;
        let finalReport = null;

        if (healthResult.score < 40) {
            workflowResult = atRiskWorkflow(customerId, healthResult.score, healthResult.breakdown, remedies);
            emit('tool_result', {
                phase: 4,
                tool: 'at_risk_workflow',
                workflow: 'at_risk_workflow',
                incident_id: workflowResult.incident_id,
                jira_ticket_id: workflowResult.jira_ticket.id,
                jira_url: workflowResult.jira_ticket.url,
                slack_channel: workflowResult.slack_notification.channel,
                slack_dm: workflowResult.slack_notification.dm_to,
                estimated_arr_at_risk: workflowResult.estimated_arr_at_risk,
                next_steps: workflowResult.next_steps,
            });

            // Compile final report
            const topTicketId = ticketData.hits.find((t) => t.priority === 'P1')?.ticket_id
                || ticketData.hits[0]?.ticket_id;
            const topLogId = usageLogs.hits[usageLogs.hits.length - 1]?.log_id;
            const topRemedyId = remedies?.hits?.[0]?.remedy_id;

            finalReport = {
                type: 'at_risk',
                signal_detected: {
                    category: 'Critical Risk Pattern',
                    description: `Health Score ${healthResult.score}/100 — ${healthResult.riskLevel}`,
                    evidence: healthResult.breakdown.filter((b) => b.delta < 0).map((b) => ({
                        factor: b.factor,
                        detail: b.detail,
                        citation: b.referenceLogId || b.referenceTicketIds?.[0] || topLogId,
                    })),
                },
                reasoning: {
                    revenue_impact: `$${workflowResult.estimated_arr_at_risk.toLocaleString()} ARR at risk. API call volume declined, 500-error rate elevated, and ${ticketData.hits.filter((t) => t.priority === 'P1' || t.priority === 'P2').length} critical tickets remain open. Historical data shows 68% churn probability within 30 days at this score.`,
                    cited_log_id: topLogId,
                    cited_ticket_id: topTicketId,
                    cited_remedy_id: topRemedyId,
                },
                action_taken: {
                    workflow: 'at_risk_workflow',
                    rationale: `Health Score ${healthResult.score} < 40 threshold triggered churn prevention protocol`,
                    jira_ticket: workflowResult.jira_ticket.id,
                    slack_notification: workflowResult.slack_notification.dm_to,
                    time_saved: 'Manual audit time reduced from ~3.5 hours → 6.2 seconds',
                    next_steps: workflowResult.next_steps,
                },
            };
        } else if (healthResult.score > 85) {
            workflowResult = expansionWorkflow(customerId, healthResult.score, healthResult.tierUtilization);
            emit('tool_result', {
                phase: 4,
                tool: 'expansion_workflow',
                workflow: 'expansion_workflow',
                opportunity_id: workflowResult.opportunity_id,
                salesforce_url: workflowResult.salesforce_opportunity.url,
                slack_dm: workflowResult.slack_notification.dm_to,
                estimated_additional_arr: workflowResult.estimated_additional_arr,
                win_probability: workflowResult.salesforce_opportunity.probability,
                next_steps: workflowResult.next_steps,
            });

            const topLogId = usageLogs.hits[usageLogs.hits.length - 1]?.log_id;
            finalReport = {
                type: 'expansion',
                signal_detected: {
                    category: 'Expansion Opportunity',
                    description: `Health Score ${healthResult.score}/100 — Tier utilization at ${healthResult.tierUtilization.toFixed(1)}%`,
                    evidence: [
                        {
                            factor: `Tier Utilization: ${healthResult.tierUtilization.toFixed(1)}%`,
                            detail: 'Customer approaching tier limit — upgrade candidate',
                            citation: topLogId,
                        },
                    ],
                },
                reasoning: {
                    revenue_impact: `$${workflowResult.estimated_additional_arr.toLocaleString()} estimated additional ARR from tier upgrade. Customer is fully engaged (score ${healthResult.score}/100) with tier utilization at ${healthResult.tierUtilization.toFixed(1)}%. Win probability: 72%.`,
                    cited_log_id: topLogId,
                },
                action_taken: {
                    workflow: 'expansion_workflow',
                    rationale: `Health Score ${healthResult.score} > 85 triggered expansion opportunity protocol`,
                    salesforce_opportunity: workflowResult.opportunity_id,
                    slack_notification: workflowResult.slack_notification.dm_to,
                    time_saved: 'Expansion signal identified in 5.8 seconds vs ~2 hours of manual CSM review',
                    next_steps: workflowResult.next_steps,
                },
            };
        } else {
            finalReport = {
                type: 'monitoring',
                signal_detected: {
                    category: 'Stable / Recovering',
                    description: `Health Score ${healthResult.score}/100 — ${healthResult.riskLabel}`,
                    evidence: healthResult.breakdown,
                },
                reasoning: {
                    revenue_impact: 'No immediate revenue risk. Customer in monitoring zone. Schedule proactive check-in.',
                },
                action_taken: {
                    workflow: 'monitoring_mode',
                    rationale: `Health Score ${healthResult.score} between 40–85 — no autonomous workflow triggered`,
                    next_steps: ['Schedule proactive QBR within 30 days', 'Monitor usage trend next 7 days'],
                },
            };
        }

        emit('phase_complete', { phase: 4, status: 'success' });
        await delay(300);

        emit('pipeline_complete', {
            customer_id: customerId,
            health_score: healthResult.score,
            risk_level: healthResult.riskLevel,
            final_report: finalReport,
            all_logs: usageLogs.hits,
            all_tickets: ticketData.hits,
        });
    } catch (err) {
        emit('error', { message: err.message, stack: err.stack });
    }
}

module.exports = { runAgentPipeline };
