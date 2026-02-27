const express = require('express');
const cors = require('cors');
const { customers } = require('./data/mockData');
const { runAgentPipeline } = require('./agent');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── GET /api/customers ────────────────────────────────────────────────────────
app.get('/api/customers', (req, res) => {
    res.json(
        customers.map((c) => ({
            id: c.id,
            name: c.name,
            tier: c.tier,
            accountManager: c.accountManager,
            scenario: c.scenario,
        }))
    );
});

// ── GET /api/analyze/:customerId (SSE Stream) ─────────────────────────────────
app.get('/api/analyze/:customerId', async (req, res) => {
    const { customerId } = req.params;

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
        return res.status(404).json({ error: `Customer ${customerId} not found` });
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const emit = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    emit('connected', { customer_id: customerId, customer_name: customer.name, timestamp: new Date().toISOString() });

    try {
        await runAgentPipeline(customerId, emit);
    } catch (err) {
        emit('error', { message: err.message });
    } finally {
        res.end();
    }
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Revenue Sentinel API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🛡️  Revenue Sentinel API running on http://localhost:${PORT}`);
    console.log(`   GET /api/customers`);
    console.log(`   GET /api/analyze/:customerId  (SSE stream)`);
    console.log(`   GET /api/health\n`);
});
