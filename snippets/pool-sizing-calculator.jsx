const { useState, useEffect, useRef } = React;
const { Card, Columns } = MintlifyComponents;

export const PoolSizingCalculator = () => {
    const defaults = { tasksPerHour: 600, sessionDurationMinutes: 5, burstMode: 'steady', fillRate: 25 };

    const [tasksPerHour, setTasksPerHour] = useState(defaults.tasksPerHour);
    const [sessionDurationMinutes, setSessionDurationMinutes] = useState(defaults.sessionDurationMinutes);
    const [burstMode, setBurstMode] = useState(defaults.burstMode);
    const [fillRate, setFillRate] = useState(defaults.fillRate);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [flash, setFlash] = useState(false);
    const prevResultRef = useRef(null);
    const hasInteracted = useRef(false);

    useEffect(() => {
        if (!hasInteracted.current) return;
        var url = new URL(window.location);
        url.searchParams.set('tasksPerHour', tasksPerHour);
        url.searchParams.set('sessionDuration', sessionDurationMinutes);
        url.searchParams.set('burstMode', burstMode);
        url.searchParams.set('fillRate', fillRate);
        url.hash = 'pool-sizing-calculator';
        window.history.replaceState(null, '', url);
    }, [tasksPerHour, sessionDurationMinutes, burstMode, fillRate]);

    const safety = 1.25;
    const burstMultiplier = burstMode === 'bursty' ? 2 : 1;
    const tasks = Number.isFinite(tasksPerHour) && tasksPerHour > 0 ? tasksPerHour : 0;
    const duration = Number.isFinite(sessionDurationMinutes) && sessionDurationMinutes > 0 ? sessionDurationMinutes : 0;
    const rate = Number.isFinite(fillRate) && fillRate > 0 ? Math.min(fillRate, 25) : 1;

    const lambda = (tasks / 60) * burstMultiplier;
    const refillFloor = Math.ceil((100 * lambda) / rate);
    const concurrencyFloor = Math.ceil(lambda * duration * safety);
    const poolSize = Math.max(refillFloor, concurrencyFloor);
    const bindingConstraint = concurrencyFloor >= refillFloor ? 'concurrency' : 'refill';

    useEffect(() => {
        var prev = prevResultRef.current;
        if (prev !== null && prev.poolSize !== poolSize) {
            setFlash(true);
            var t = setTimeout(() => setFlash(false), 300);
            return () => clearTimeout(t);
        }
        prevResultRef.current = { poolSize };
    }, [poolSize]);

    const labelStyle = { fontWeight: 600, fontSize: '0.875rem', minWidth: '10rem', flexShrink: 0, maxWidth: '10rem' };
    const rowStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '2.25rem', flexWrap: 'wrap' };
    const inputStyle = { minWidth: 0, flex: 1, maxWidth: '100%', boxSizing: 'border-box', background: 'transparent' };
    const numberInputStyle = { borderBottom: '1px solid #81b300', textAlign: 'right' };
    const flashStyle = { background: flash ? '#81b300' : 'transparent', transition: 'background 0.5s ease', marginLeft: 'auto' };
    const btnStyle = (active) => ({
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        border: `1px solid ${active ? '#81b300' : 'var(--btn-border)'}`,
        fontSize: '0.875rem',
        background: active ? 'var(--btn-selected-bg)' : undefined,
    });
    const disclosureStyle = {
        background: 'none', border: 'none', padding: 0, fontSize: '0.8rem',
        color: '#81b300', cursor: 'pointer', textAlign: 'left',
    };

    const setRate = (v) => {
        hasInteracted.current = true;
        const n = parseInt(v);
        if (Number.isNaN(n)) { setFillRate(0); return; }
        setFillRate(Math.max(1, Math.min(25, n)));
    };

    return (
        <Columns cols={2}>
            <Card title="Workload" icon="calculator">
                <div style={rowStyle}>
                    <label style={labelStyle}>Tasks per hour</label>
                    <input type="number" min="0" style={{...inputStyle, ...numberInputStyle}} value={tasksPerHour}
                        onChange={(e) => { hasInteracted.current = true; setTasksPerHour(parseFloat(e.target.value)); }} />
                </div>
                <div style={rowStyle}>
                    <label style={labelStyle}>Avg session duration (min)</label>
                    <input type="number" min="0" step="0.5" style={{...inputStyle, ...numberInputStyle}} value={sessionDurationMinutes}
                        onChange={(e) => { hasInteracted.current = true; setSessionDurationMinutes(parseFloat(e.target.value)); }} />
                </div>
                <div style={rowStyle}>
                    <label style={labelStyle}>Traffic pattern</label>
                    <button class="btn btn-primary dark:text-white" style={btnStyle(burstMode === 'steady')}
                        onClick={() => { hasInteracted.current = true; setBurstMode('steady'); }}>Steady</button>
                    <button class="btn btn-primary dark:text-white" style={btnStyle(burstMode === 'bursty')}
                        onClick={() => { hasInteracted.current = true; setBurstMode('bursty'); }}>Bursty (2×)</button>
                </div>
                <div style={rowStyle}>
                    <button style={disclosureStyle} onClick={() => setShowAdvanced(!showAdvanced)}>
                        {showAdvanced ? '▾' : '▸'} Advanced
                    </button>
                </div>
                {showAdvanced && (
                    <div style={rowStyle}>
                        <label style={labelStyle}>Fill rate (% / min, max 25)</label>
                        <input type="number" min="1" max="25" style={{...inputStyle, ...numberInputStyle}} value={fillRate}
                            onChange={(e) => setRate(e.target.value)} />
                    </div>
                )}
                <div style={rowStyle}>
                    <span style={{ width: '100%', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Assumes <code>reuse: false</code> on release. Bursty mode applies a 2× multiplier to handle peaks above the hourly average.
                    </span>
                </div>
            </Card>
            <Card title="Recommended pool size" icon="layer-group">
                <div style={rowStyle}>
                    <span style={labelStyle}>Concurrency floor:</span>
                    <span style={flashStyle}>{concurrencyFloor}</span>
                </div>
                <div style={rowStyle}>
                    <span style={labelStyle}>Refill floor:</span>
                    <span style={flashStyle}>{refillFloor}</span>
                </div>
                <div style={rowStyle}>
                    <span style={labelStyle}>Pool size:</span>
                    <span style={{...flashStyle, fontWeight: 600}}>{poolSize}</span>
                </div>
                <div style={rowStyle}>
                    <span style={{ width: '100%', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Binding constraint: <strong>{bindingConstraint}</strong>.
                        {bindingConstraint === 'refill'
                            ? ' Shorter sessions or higher throughput push refill above concurrency — the 25% fill ceiling sets the floor.'
                            : ' Longer-held browsers dominate — pool size scales with throughput × duration.'}
                    </span>
                </div>
            </Card>
        </Columns>
    );
};
