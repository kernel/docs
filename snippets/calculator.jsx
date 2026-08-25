const { useState, useEffect, useRef } = React;
const { Card, Columns } = MintlifyComponents;

export const PricingCalculator = () => {
    const defaults = { plan: 'free', browserType: 'headless', avgSessionLength: 30, numSessions: 100 };
    const planPrices = { free: 0, hobbyist: 30, startup: 200 };
    const usagePrices = 0.0000166667;
    const browserMultipliers = { headless: 1, headful: 8, gpu: 48 };

    const [plan, setPlan] = useState(defaults.plan);
    const [browserType, setBrowserType] = useState(defaults.browserType);
    const [headful16, setHeadful16] = useState(false);
    const [avgSessionLength, setAvgSessionLength] = useState(defaults.avgSessionLength);
    const [numSessions, setNumSessions] = useState(defaults.numSessions);
    const [flash, setFlash] = useState(false);
    const prevPriceRef = useRef(null);
    const hasInteracted = useRef(false);

    useEffect(() => {
        if (!hasInteracted.current) return;
        var url = new URL(window.location);
        url.searchParams.set('plan', plan);
        url.searchParams.set('browserType', browserType);
        url.searchParams.set('headful16', headful16);
        url.searchParams.set('duration', avgSessionLength);
        url.searchParams.set('sessions', numSessions);
        url.hash = 'pricing-calculator';
        window.history.replaceState(null, '', url);
    }, [plan, browserType, headful16, avgSessionLength, numSessions]);

    const handleBrowserTypeChange = (type) => {
        hasInteracted.current = true;
        setBrowserType(type);
        if (type === 'gpu' && plan !== 'startup') {
            setPlan('startup');
        }
    };

    const handleMemoryChange = (is16) => {
        hasInteracted.current = true;
        setHeadful16(is16);
        setBrowserType('headful');
    };

    const handlePlanChange = (newPlan) => {
        hasInteracted.current = true;
        if (browserType === 'gpu' && newPlan !== 'startup') {
            return;
        }
        setPlan(newPlan);
    };

    var price = planPrices[plan];
    var multiplier = browserType === 'headful' ? 8 * (headful16 ? 2 : 1) : browserMultipliers[browserType];
    var usageCost = usagePrices * multiplier * numSessions * avgSessionLength;

    var includedUsageCredits = 5;
    if (plan === 'hobbyist') {
        includedUsageCredits = 10;
    } else if (plan === 'startup') {
        includedUsageCredits = 50;
    }
    if (usageCost > includedUsageCredits) {
        price += Math.max(0, usageCost - includedUsageCredits);
    }
    useEffect(() => {
        var prev = prevPriceRef.current;
        if (prev !== null && (prev.usageCost !== usageCost || prev.includedUsageCredits !== includedUsageCredits || prev.price !== price)) {
            setFlash(true);
            var t = setTimeout(() => setFlash(false), 300);
            return () => clearTimeout(t);
        }
        prevPriceRef.current = { usageCost, includedUsageCredits, price };
    }, [usageCost, includedUsageCredits, price]);
    const labelStyle = { fontWeight: 600, fontSize: '0.875rem', minWidth: '10rem', flexShrink: 0, maxWidth: '10rem' };
    const rowStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '2.25rem' };
    const inputStyle = { minWidth: 0, flex: 1, maxWidth: '100%', boxSizing: 'border-box', background: 'transparent' };
    const selectStyle = {
        ...inputStyle,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.5rem center',
        backgroundSize: '0.75rem',
        paddingRight: '1.5rem',
    };
    const btnStyle = (active) => ({
        padding: '0.375rem 0.75rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--btn-border)',
        fontSize: '0.875rem',
        whiteSpace: 'nowrap',
        background: active ? 'var(--btn-selected-bg)' : undefined,
        cursor: 'pointer',
    });
    const memStyle = (active) => ({
        padding: '0.375rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        whiteSpace: 'nowrap',
        background: active ? 'var(--btn-selected-bg)' : 'transparent',
        cursor: 'pointer',
    });
    return (
        <Columns cols={2}>
            <Card title="Controls" icon="calculator">
                <div style={rowStyle}>
                    <label style={labelStyle}>Plan</label>
                    <select style={selectStyle} value={plan} onChange={(e) => handlePlanChange(e.target.value)}>
                        <option value="free">Free</option>
                        <option value="hobbyist">Hobbyist</option>
                        <option value="startup">Startup</option>
                    </select>
                </div>
                <div style={rowStyle}>
                    <label style={labelStyle}>Session length (seconds)</label>
                    <input type="number" style={{...inputStyle}} value={avgSessionLength} onChange={(e) => { hasInteracted.current = true; setAvgSessionLength(parseInt(e.target.value)); }} />
                </div>
                <div style={rowStyle}>
                    <label style={labelStyle}>Number of sessions</label>
                    <input type="number" style={{...inputStyle}} value={numSessions} onChange={(e) => { hasInteracted.current = true; setNumSessions(parseInt(e.target.value)); }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button class="btn btn-primary dark:text-white" style={btnStyle(browserType === 'headless')} onClick={() => handleBrowserTypeChange('headless')}>Headless</button>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--btn-border)', borderRadius: '0.375rem', overflow: 'hidden' }}>
                        <button class="btn btn-primary dark:text-white" style={btnStyle(browserType === 'headful')} onClick={() => handleBrowserTypeChange('headful')}>Headful</button>
                        <span style={{ padding: '0 0.25rem', fontSize: '0.75rem', opacity: 0.6 }}>GB:</span>
                        <div style={{ display: 'flex' }}>
                            <button class="btn btn-primary dark:text-white" style={memStyle(!headful16)} onClick={() => handleMemoryChange(false)}>8</button>
                            <button class="btn btn-primary dark:text-white" style={memStyle(headful16)} onClick={() => handleMemoryChange(true)}>16</button>
                        </div>
                    </div>
                    <button class="btn btn-primary dark:text-white" style={btnStyle(browserType === 'gpu')} onClick={() => handleBrowserTypeChange('gpu')}>Headful + GPU</button>
                </div>
                <div style={rowStyle}>
                    <span style={{ width: '100%', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        ${(usagePrices * multiplier).toFixed(8)}/second
                        {browserType === 'headful' && <span style={{ marginLeft: '0.5rem' }}>({headful16 ? '16GB' : '8GB'})</span>}
                        {browserType === 'gpu' && <span style={{ marginLeft: '0.5rem' }}>(Startup tier required)</span>}
                    </span>
                </div>
            </Card>
            <Card title="Price" icon="circle-dollar">
                <div style={rowStyle}><span style={labelStyle}>Base plan:</span> <span style={{ background: flash ? '#CAB168' : 'transparent', transition: 'background 0.5s ease', marginLeft: 'auto' }}>${planPrices[plan].toFixed(2)}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Usage:</span> <span style={{ background: flash ? '#CAB168' : 'transparent', transition: 'background 0.5s ease', marginLeft: 'auto' }}>+${usageCost.toFixed(2)}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Free credits:</span> <span style={{ background: flash ? '#CAB168' : 'transparent', transition: 'background 0.5s ease', marginLeft: 'auto' }}>-${includedUsageCredits.toFixed(2)}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Total cost:</span> <span style={{ background: flash ? '#CAB168' : 'transparent', transition: 'background 0.5s ease', marginLeft: 'auto' }}>${price.toFixed(2)}</span></div>
            </Card>
        </Columns>
    );
};
