export default function RemediesPanel({ remedies }) {
    if (!remedies || remedies.length === 0) {
        return (
            <div className="glass-card remedy-card">
                <div className="section-header">
                    <span className="section-title"><span className="icon">🔍</span> Vector Remedies</span>
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                    Triggered only when Health Score &lt; 40
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card remedy-card">
            <div className="section-header">
                <span className="section-title"><span className="icon">🔍</span> Vector Remedies</span>
                <span style={{ fontSize: 11, color: 'var(--gray-600)', fontFamily: 'var(--font-mono)' }}>
                    kNN cosine similarity
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {remedies.map((remedy, i) => (
                    <div key={remedy.remedy_id} className="remedy-item" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="remedy-header">
                            <span className="remedy-id">{remedy.remedy_id}</span>
                            <span style={{ fontSize: 11, color: 'var(--gray-500)', fontFamily: 'var(--font-mono)' }}>
                                {(remedy.similarity_score * 100).toFixed(0)}% match
                            </span>
                        </div>
                        <div className="similarity-bar-wrapper">
                            <div
                                className="similarity-bar"
                                style={{ width: `${remedy.similarity_score * 100}%` }}
                            />
                        </div>
                        <p className="remedy-resolution">{remedy.resolution_preview || remedy.resolution}</p>
                        {remedy.outcome && (
                            <p className="remedy-outcome">✓ {remedy.outcome}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>
                                ⏱ {remedy.time_to_resolve_hrs}h avg resolution
                            </span>
                            {remedy.customer_segment && (
                                <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>• {remedy.customer_segment}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
