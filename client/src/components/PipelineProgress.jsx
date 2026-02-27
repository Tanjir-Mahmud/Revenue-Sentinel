import { useEffect, useRef } from 'react';

const PHASE_INFO = [
    { num: 1, label: 'Data Retrieval', short: 'Phase 1' },
    { num: 2, label: 'Analysis', short: 'Phase 2' },
    { num: 3, label: 'Vector Search', short: 'Phase 3' },
    { num: 4, label: 'Execution', short: 'Phase 4' },
];

export default function PipelineProgress({ phaseStates, isRunning }) {
    const getStatus = (phaseNum) => {
        const state = phaseStates[phaseNum];
        if (!state) return 'idle';
        return state.status; // 'active' | 'complete' | 'skipped'
    };

    const getConnectorStatus = (afterPhase) => {
        const thisStatus = getStatus(afterPhase);
        const nextStatus = getStatus(afterPhase + 1);
        if (thisStatus === 'complete' && (nextStatus === 'complete' || nextStatus === 'active')) return 'complete';
        if (thisStatus === 'complete') return 'active';
        return 'idle';
    };

    return (
        <div className="glass-card pipeline-card">
            <div className="section-header">
                <span className="section-title">
                    <span className="icon">🤖</span>
                    Agent Pipeline Progress
                </span>
                {isRunning && (
                    <span className="badge badge-medium" style={{ animation: 'blink 1.5s ease infinite' }}>
                        ⚡ Running
                    </span>
                )}
            </div>
            <div className="pipeline-steps">
                {PHASE_INFO.map((phase, idx) => {
                    const status = getStatus(phase.num);
                    return (
                        <div key={phase.num} className="pipeline-step">
                            <div className="step-content">
                                <div className={`step-circle ${status === 'active' ? 'active' : status === 'complete' ? 'complete' : status === 'skipped' ? 'skipped' : ''}`}>
                                    {status === 'complete' ? '✓' : status === 'skipped' ? '⊘' : status === 'active' ? (
                                        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                                    ) : phase.num}
                                </div>
                                <span className={`step-label ${status === 'active' ? 'active' : status === 'complete' ? 'complete' : ''}`}>
                                    {phase.label}
                                </span>
                            </div>
                            {idx < PHASE_INFO.length - 1 && (
                                <div className={`step-connector ${getConnectorStatus(phase.num)}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
