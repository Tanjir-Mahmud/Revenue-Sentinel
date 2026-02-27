const client = require('../lib/es.js');
const { customers, usageLogsIndex, supportTicketsIndex, remediesIndex } = require('../data/mockData');

async function seed() {
    console.log('🚀 Starting Elasticsearch seeding...');

    try {
        // 1. Create/Recreate Indices
        const indices = ['customers', 'usage_logs', 'support_tickets', 'remedies'];

        for (const index of indices) {
            const exists = await client.indices.exists({ index });
            if (exists) {
                console.log(`🗑️ Deleting existing index: ${index}`);
                await client.indices.delete({ index });
            }
            console.log(`📁 Creating index: ${index}`);
            await client.indices.create({ index });
        }

        // 2. Index Customers
        console.log('👤 Indexing customers...');
        for (const cust of customers) {
            await client.index({
                index: 'customers',
                id: cust.id,
                document: cust
            });
        }

        // 3. Index Usage Logs
        console.log('📊 Indexing usage logs...');
        for (const customerId in usageLogsIndex) {
            const logs = usageLogsIndex[customerId];
            const body = logs.flatMap(doc => [{ index: { _index: 'usage_logs' } }, doc]);
            await client.bulk({ refresh: true, operations: body });
        }

        // 4. Index Support Tickets
        console.log('🎫 Indexing support tickets...');
        for (const customerId in supportTicketsIndex) {
            const tickets = supportTicketsIndex[customerId];
            const body = tickets.flatMap(doc => [{ index: { _index: 'support_tickets' } }, doc]);
            await client.bulk({ refresh: true, operations: body });
        }

        // 5. Index Remedies
        console.log('🔍 Indexing remedies...');
        const remedyBody = remediesIndex.flatMap(doc => [{ index: { _index: 'remedies' } }, doc]);
        await client.bulk({ refresh: true, operations: remedyBody });

        console.log('✅ Seeding complete! All synthetic data is now in Elastic Cloud.');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
