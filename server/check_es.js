const client = require('./lib/es.js');

async function check() {
    try {
        const info = await client.info();
        console.log('ES Info:', JSON.stringify(info, null, 2));

        const clusterPrivs = await client.security.hasPrivileges({
            body: {
                cluster: ['monitor', 'manage'],
                index: [
                    {
                        names: ['*'],
                        privileges: ['read', 'create_index', 'index', 'delete_index']
                    }
                ]
            }
        });
        console.log('Privileges:', JSON.stringify(clusterPrivs, null, 2));
    } catch (err) {
        console.error('Check failed:', err);
    }
}

check();
