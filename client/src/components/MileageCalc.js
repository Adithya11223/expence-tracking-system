import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

const C_glass = 'rgba(255,255,255,0.07)';
const C_border = 'rgba(255,255,255,0.12)';
const C_text = 'rgba(255,255,255,0.90)';
const C_muted = 'rgba(255,255,255,0.45)';
const C_purple = '#818cf8';
const C_amber = '#fb923c';
const C_green = '#4ade80';

const card = {
    background: C_glass,
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: `1px solid ${C_border}`,
    borderRadius: 20,
    padding: '20px 22px',
    position: 'relative',
    overflow: 'hidden',
};

const label = { display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C_muted, marginBottom: 7 };

const input = (extra = {}) => ({
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1.5px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.07)',
    color: C_text, fontSize: '0.92rem', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box', ...extra,
});

const onFocus = e => { e.target.style.borderColor = 'rgba(129,140,248,0.65)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; };
const onBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.14)'; e.target.style.boxShadow = 'none'; };

const ResultRow = ({ label: lbl, value, color = C_text, big }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: C_muted, fontSize: big ? '0.90rem' : '0.84rem' }}>{lbl}</span>
        <span style={{ color, fontWeight: big ? 800 : 600, fontSize: big ? '1.10rem' : '0.90rem' }}>{value}</span>
    </div>
);

export default function MileageCalc({ currencySymbol = '₹' }) {
    const isMobile = useIsMobile();
    /* ── State ── */
    const [fuelPrice, setFuelPrice] = useState('');
    const [mileage, setMileage] = useState('');   // km per litre
    const [distance, setDistance] = useState('');   // km
    const [passengers, setPassengers] = useState('1');
    const [mode, setMode] = useState('cost'); // 'cost' | 'range'
    const [result, setResult] = useState(null);

    const calculate = () => {
        const price = parseFloat(fuelPrice);
        const mpg = parseFloat(mileage);
        const dist = parseFloat(distance);
        const pax = parseInt(passengers) || 1;

        if (!price || !mpg) return;

        if (mode === 'cost' && dist) {
            const litresUsed = dist / mpg;
            const totalCost = litresUsed * price;
            const perKm = totalCost / dist;
            const perPerson = totalCost / pax;
            setResult({ mode: 'cost', dist, litresUsed, totalCost, perKm, perPerson });
        } else if (mode === 'range') {
            // How far can I go with a full tank?
            const tankSize = parseFloat(distance); // reuse "distance" field as tank size (litres)
            if (!tankSize) return;
            const range = tankSize * mpg;
            const fullTankCost = tankSize * price;
            setResult({ mode: 'range', range, fullTankCost, tankSize });
        }
    };

    const fmt = (n, decimals = 2) => Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

    return (
        <div className="mileage-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18, alignItems: 'start' }}>

            {/* ── Left: Input card ── */}
            <div style={card}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />

                <h2 style={{ margin: '0 0 18px', fontSize: '1.05rem', fontWeight: 800, color: C_text }}>
                    🚗 Fuel Cost Calculator
                </h2>

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                    {[
                        { key: 'cost', label: '💸 Trip Cost' },
                        { key: 'range', label: '🗺 Range Check' },
                    ].map(({ key, label: lbl }) => (
                        <button key={key} onClick={() => { setMode(key); setResult(null); setDistance(''); }} style={{
                            flex: 1, padding: '8px', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: '0.82rem',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                            background: mode === key ? 'rgba(129,140,248,0.22)' : 'transparent',
                            color: mode === key ? C_purple : C_muted,
                            boxShadow: mode === key ? '0 2px 8px rgba(99,102,241,0.20)' : 'none',
                        }}>{lbl}</button>
                    ))}
                </div>

                {/* Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                        <span style={label}>Fuel Price ({currencySymbol}/L)</span>
                        <input type="number" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)}
                            placeholder="e.g. 106.00" style={input()} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div>
                        <span style={label}>Mileage (km/L)</span>
                        <input type="number" value={mileage} onChange={e => setMileage(e.target.value)}
                            placeholder="e.g. 15.0" style={input()} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <span style={label}>{mode === 'cost' ? 'Trip Distance (km)' : 'Tank Size (litres)'}</span>
                    <input type="number" value={distance} onChange={e => setDistance(e.target.value)}
                        placeholder={mode === 'cost' ? 'e.g. 250' : 'e.g. 40'} style={input()} onFocus={onFocus} onBlur={onBlur} />
                </div>

                {mode === 'cost' && (
                    <div style={{ marginBottom: 16 }}>
                        <span style={label}>Passengers (for split)</span>
                        <input type="number" value={passengers} onChange={e => setPassengers(e.target.value)}
                            min="1" placeholder="1" style={input()} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                )}

                <button onClick={calculate} style={{
                    width: '100%', padding: '13px', borderRadius: 13,
                    background: 'linear-gradient(135deg,#6366f1,#38bdf8)', border: 'none',
                    color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(99,102,241,0.40)', fontFamily: 'inherit',
                    transition: 'transform 0.16s',
                }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Calculate →
                </button>
            </div>

            {/* ── Right: Result card ── */}
            <div style={card}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />

                <h2 style={{ margin: '0 0 18px', fontSize: '1.05rem', fontWeight: 800, color: C_text }}>
                    📊 Results
                </h2>

                {!result ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: C_muted }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⛽</div>
                        <div style={{ fontSize: '0.88rem' }}>Fill in the details and hit <strong style={{ color: C_purple }}>Calculate</strong></div>
                    </div>
                ) : result.mode === 'cost' ? (
                    <>
                        <ResultRow label="Trip Distance" value={`${fmt(result.dist, 0)} km`} />
                        <ResultRow label="Fuel Used" value={`${fmt(result.litresUsed)} L`} />
                        <ResultRow label="Cost per km" value={`${currencySymbol}${fmt(result.perKm)}`} color={C_muted} />
                        {parseInt(passengers) > 1 && (
                            <ResultRow label={`Per Person (÷${passengers})`} value={`${currencySymbol}${fmt(result.perPerson)}`} color={C_purple} />
                        )}
                        <ResultRow label="Total Fuel Cost" value={`${currencySymbol}${fmt(result.totalCost)}`} color={C_amber} big />
                    </>
                ) : (
                    <>
                        <ResultRow label="Tank Size" value={`${fmt(result.tankSize, 0)} L`} />
                        <ResultRow label="Full Tank Cost" value={`${currencySymbol}${fmt(result.fullTankCost)}`} color={C_amber} />
                        <ResultRow label="Estimated Range" value={`${fmt(result.range, 0)} km`} color={C_green} big />
                        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)' }}>
                            <p style={{ margin: 0, fontSize: '0.80rem', color: 'rgba(74,222,128,0.80)' }}>
                                💡 With a full {fmt(result.tankSize, 0)} L tank at {currencySymbol}{fmt(parseFloat(fuelPrice))} /L, you can travel approximately <strong>{fmt(result.range, 0)} km</strong>.
                            </p>
                        </div>
                    </>
                )}

                {/* Tip section */}
                <div style={{ marginTop: 24, padding: '14px', borderRadius: 14, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.18)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C_purple, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>💡 Tip</div>
                    <p style={{ margin: 0, fontSize: '0.79rem', color: C_muted, lineHeight: 1.5 }}>
                        Maintain tyre pressure at the recommended level — it can improve fuel efficiency by up to 3%.
                        Highway driving is typically more fuel-efficient than city traffic.
                    </p>
                </div>
            </div>
        </div>
    );
}
