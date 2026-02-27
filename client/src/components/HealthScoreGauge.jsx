import { useEffect, useRef, useState } from 'react';

const SCORE_CIRCUMFERENCE = 502; // 2 * π * 80 (radius 80)

function getScoreColor(score) {
    if (score === null) return '#4b5563';
    if (score < 20) return '#ef4444';
    if (score < 40) return '#f87171';
    if (score < 60) return '#f59e0b';
    if (score < 85) return '#4ade80';
    return '#8b5cf6';
}

function getGlowColor(score) {
    if (score === null) return 'transparent';
    if (score < 40) return 'rgba(239,68,68,0.3)';
    if (score < 60) return 'rgba(245,158,11,0.3)';
    if (score < 85) return 'rgba(74,222,128,0.3)';
    return 'rgba(139,92,246,0.35)';
}

function getRiskBadgeClass(riskLevel) {
    if (!riskLevel) return '';
    const map = {
        CRITICAL: 'badge-critical',
        HIGH: 'badge-critical',
        MEDIUM: 'badge-medium',
        LOW: 'badge-low',
        EXPANSION: 'badge-expansion',
    };
    return `risk-level-badge badge ${map[riskLevel] || 'badge-medium'}`;
}

export default function HealthScoreGauge({ score, riskLevel, riskLabel, breakdown }) {
    const [displayScore, setDisplayScore] = useState(null);
    const animRef = useRef(null);

    useEffect(() => {
        if (score === null) {
            setDisplayScore(null);
            return;
        }
        // Animate score counter
        let start = 0;
        const duration = 1200;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayScore(Math.round(eased * score));
            if (progress < 1) animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animRef.current);
    }, [score]);

    const dashOffset = displayScore !== null
        ? SCORE_CIRCUMFERENCE - (displayScore / 100) * SCORE_CIRCUMFERENCE
        : SCORE_CIRCUMFERENCE;

    const color = getScoreColor(score);
    const glow = getGlowColor(score);

    return (
        <div className="glass-card gauge-card">
            <div className="section-header" style={{ width: '100%' }}>
                <span className="section-title">
                    <span className="icon">❤️</span>
                    Health Score
                </span>
            </div>

            <div className="gauge-wrapper">
                <svg className="gauge-svg" width="180" height="180" viewBox="0 0 180 180">
                    <circle className="gauge-track" cx="90" cy="90" r="80" />
                    <circle
                        className="gauge-fill"
                        cx="90"
                        cy="90"
                        r="80"
                        stroke={color}
                        style={{
                            strokeDashoffset: dashOffset,
                            filter: `drop-shadow(0 0 8px ${glow})`,
                        }}
                    />
                </svg>
                <div className="gauge-center">
                    <span className="gauge-score" style={{ color }}>
                        {displayScore !== null ? displayScore : '—'}
                    </span>
                    <span className="gauge-label">/ 100</span>
                </div>
            </div>

            {riskLevel && (
                <span className={getRiskBadgeClass(riskLevel)}>
                    {riskLevel === 'EXPANSION' ? '💰' : riskLevel === 'CRITICAL' ? '🚨' : riskLevel === 'HIGH' ? '⚠️' : '✓'}{' '}
                    {riskLevel}
                </span>
            )}
            {riskLabel && (
                <p style={{ fontSize: 12, color: 'var(--gray-500)', textAlign: 'center', lineHeight: 1.4 }}>{riskLabel}</p>
            )}

            {breakdown && breakdown.length > 0 && (
                <div className="score-breakdown" style={{ width: '100%' }}>
                    <p style={{ fontSize: 11, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>
                        Score Breakdown
                    </p>
                    {breakdown.map((item, i) => (
                        <div key={i} className="breakdown-item">
                            <span className="breakdown-factor">{item.factor}</span>
                            <span className={`breakdown-delta ${item.delta < 0 ? 'negative' : item.delta > 0 ? 'positive' : 'neutral'}`}>
                                {item.delta > 0 ? `+${item.delta}` : item.delta === 0 ? '—' : item.delta}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
