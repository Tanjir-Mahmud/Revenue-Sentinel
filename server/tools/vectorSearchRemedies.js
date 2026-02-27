const { remediesIndex } = require('../data/mockData');

/**
 * Tool: vector_search_remedies
 * Simulates ES kNN / dense_vector cosine similarity search.
 * In production this would use text-embedding-3-small embeddings.
 * Returns top-3 most similar past resolutions.
 */
function vectorSearchRemedies(riskFactors) {
    // In production: embed riskFactors string → query kNN on remedy vectors
    // Mock: filter and rank by pre-computed similarity scores
    const errorCategories = riskFactors.map((f) => f.factor.toLowerCase());

    const scored = remediesIndex.map((remedy) => {
        let boost = remedy.similarity_score;
        // Boost score if pattern keywords match current risk factors
        if (errorCategories.some((c) => remedy.error_pattern.includes('500-error')) && errorCategories.some((c) => c.includes('5xx'))) {
            boost = Math.min(boost + 0.05, 1.0);
        }
        if (errorCategories.some((c) => c.includes('decline'))) {
            if (remedy.error_pattern.includes('declining-api-calls')) boost = Math.min(boost + 0.04, 1.0);
        }
        return { ...remedy, similarity_score: parseFloat(boost.toFixed(3)) };
    });

    scored.sort((a, b) => b.similarity_score - a.similarity_score);

    return {
        index: 'remedies-vector-store',
        query_type: 'kNN cosine similarity',
        embedding_model: 'text-embedding-3-small (mock)',
        hits: scored.slice(0, 3),
        total: scored.length,
    };
}

module.exports = { vectorSearchRemedies };
