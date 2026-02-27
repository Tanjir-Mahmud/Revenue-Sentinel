const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
    node: process.env.ES_URL,
    auth: {
        apiKey: process.env.ES_API_KEY
    }
});

module.exports = client;
