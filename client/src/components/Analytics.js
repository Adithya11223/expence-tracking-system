import React, { useState, useEffect } from 'react';
import { Progress } from 'antd';
import useIsMobile from '../hooks/useIsMobile';

const C = {
    glass: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)',
    text: 'rgba(255,255,255,0.90)',
    muted: 'rgba(255,255,255,0.45)',
    income: '#4ade80',
    expense: '#fb923c',
    purple: '#818cf8',
};

/* A clean glass card that clips its content — fixes visual bleeding */
const GlassCard = ({ title, children, titleColor = C.text }) => (
    <div style={{
        background: C.glass,
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        overflow: 'hidden',      /* ← key: clips child elements at border-radius */
        boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
        position: 'relative',
    }}>
        {/* Shimmer line */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent)' }} />
        {/* Header */}
        <div style={{
            padding: '12px 18px',
            borderBottom: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,0.03)',
        }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: titleColor, letterSpacing: '0.04em' }}>
                {title}
            </span>
        </div>
        {/* Body */}
        <div style={{ padding: '16px 18px' }}>
            {children}
        </div>
    </div>
);

const Analytics = ({ allTransaction }) => {
    const [currencySymbol, setCurrencySymbol] = useState('₹');
    const isMobile = useIsMobile();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const symbols = { INR: '₹', USD: '$', EUR: '€' };
        if (user?.currency) setCurrencySymbol(symbols[user.currency] || '₹');
    }, []);

    const incomeList = allTransaction.filter(t => t.type === 'income');
    const expenseList = allTransaction.filter(t => t.type === 'expense');
    const totalIncome = incomeList.reduce((a, t) => a + t.amount, 0);
    const totalExpense = expenseList.reduce((a, t) => a + t.amount, 0);
    const totalTxn = allTransaction.length;
    const cashFlow = totalIncome + totalExpense;
    const netBalance = totalIncome - totalExpense;
    const categories = [...new Set(allTransaction.map(t => t.category))];

    const countIncomePct = totalTxn > 0 ? +(incomeList.length / totalTxn * 100).toFixed(0) : 0;
    const countExpensePct = totalTxn > 0 ? +(expenseList.length / totalTxn * 100).toFixed(0) : 0;
    const flowInPct = cashFlow > 0 ? +(totalIncome / cashFlow * 100).toFixed(0) : 0;
    const flowOutPct = cashFlow > 0 ? +(totalExpense / cashFlow * 100).toFixed(0) : 0;

    /* Circle format helper */
    const circleLabel = (color, label) => p => (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: C.text }}>{p}%</div>
            <div style={{ fontSize: '10px', color: C.muted, marginTop: 1 }}>{label}</div>
        </div>
    );

    const noData = lbl => (
        <p style={{ color: C.muted, textAlign: 'center', padding: '24px 0', margin: 0, fontSize: '0.86rem' }}>
            No {lbl} records
        </p>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Row 1: 3 summary cards ── */}
            <div className="analytics-summary-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14 }}>

                {/* Transactions count */}
                <GlassCard title="TRANSACTIONS">
                    <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 4 }}>
                        <Progress type="circle" size={72}
                            strokeColor={{ '0%': '#10b981', '100%': '#059669' }}
                            trailColor="rgba(74,222,128,0.10)"
                            percent={countIncomePct}
                            format={circleLabel(C.income, 'Income')}
                        />
                        <Progress type="circle" size={72}
                            strokeColor={{ '0%': '#fb923c', '100%': '#f59e0b' }}
                            trailColor="rgba(251,146,60,0.10)"
                            percent={countExpensePct}
                            format={circleLabel(C.expense, 'Expense')}
                        />
                    </div>
                </GlassCard>

                {/* Cash flow */}
                <GlassCard title={
                    <span>
                        <span style={{ color: C.muted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.10em' }}>Cash Flow  </span>
                        <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: '0.90rem' }}>{currencySymbol}{cashFlow.toLocaleString()}</span>
                    </span>
                }>
                    <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 4 }}>
                        <Progress type="circle" size={72}
                            strokeColor={{ '0%': '#10b981', '100%': '#059669' }}
                            trailColor="rgba(74,222,128,0.10)"
                            percent={flowInPct}
                            format={circleLabel(C.income, 'In')}
                        />
                        <Progress type="circle" size={72}
                            strokeColor={{ '0%': '#fb923c', '100%': '#f59e0b' }}
                            trailColor="rgba(251,146,60,0.10)"
                            percent={flowOutPct}
                            format={circleLabel(C.expense, 'Out')}
                        />
                    </div>
                </GlassCard>

                {/* Net balance */}
                <GlassCard title={netBalance >= 0 ? '✦ Profit' : '▼ Loss'} titleColor={netBalance >= 0 ? C.income : C.expense}>
                    <div style={{ textAlign: 'center', paddingTop: 8 }}>
                        <div style={{
                            fontSize: '1.90rem', fontWeight: 900, letterSpacing: '-1px',
                            color: netBalance >= 0 ? C.income : C.expense,
                            textShadow: netBalance >= 0 ? '0 0 20px rgba(74,222,128,0.28)' : '0 0 20px rgba(251,146,60,0.28)',
                        }}>
                            {currencySymbol}{Math.abs(netBalance).toLocaleString()}
                        </div>
                        <div style={{ color: C.muted, fontSize: '0.76rem', marginTop: 4 }}>
                            {netBalance >= 0 ? 'Net savings' : 'Over budget'}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* ── Row 2: Category breakdown ── */}
            <div className="analytics-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>

                {/* Income Sources */}
                <GlassCard title="↑ Income Sources" titleColor={C.income}>
                    {categories.filter(cat => allTransaction.some(t => t.type === 'income' && t.category === cat)).length === 0
                        ? noData('income')
                        : categories.map(cat => {
                            const amt = allTransaction.filter(t => t.type === 'income' && t.category === cat).reduce((a, t) => a + t.amount, 0);
                            if (!amt) return null;
                            const pct = totalIncome > 0 ? +(amt / totalIncome * 100).toFixed(0) : 0;
                            return (
                                <div key={`in-${cat}`} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ color: 'rgba(255,255,255,0.70)', fontSize: '0.84rem', textTransform: 'capitalize' }}>
                                            {cat} <span style={{ color: C.muted, fontSize: '0.74rem' }}>({pct}%)</span>
                                        </span>
                                        <strong style={{ color: C.income, fontSize: '0.84rem' }}>{currencySymbol}{amt.toLocaleString()}</strong>
                                    </div>
                                    <Progress percent={pct} strokeColor={{ '0%': '#4ade80', '100%': '#059669' }}
                                        trailColor="rgba(74,222,128,0.10)" showInfo={false} strokeWidth={5} />
                                </div>
                            );
                        })
                    }
                </GlassCard>

                {/* Expense Breakdown */}
                <GlassCard title="↓ Expense Breakdown" titleColor={C.expense}>
                    {categories.filter(cat => allTransaction.some(t => t.type === 'expense' && t.category === cat)).length === 0
                        ? noData('expenses')
                        : categories.map(cat => {
                            const amt = allTransaction.filter(t => t.type === 'expense' && t.category === cat).reduce((a, t) => a + t.amount, 0);
                            if (!amt) return null;
                            const pct = totalExpense > 0 ? +(amt / totalExpense * 100).toFixed(0) : 0;
                            return (
                                <div key={`ex-${cat}`} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ color: 'rgba(255,255,255,0.70)', fontSize: '0.84rem', textTransform: 'capitalize' }}>
                                            {cat} <span style={{ color: C.muted, fontSize: '0.74rem' }}>({pct}%)</span>
                                        </span>
                                        <strong style={{ color: C.expense, fontSize: '0.84rem' }}>{currencySymbol}{amt.toLocaleString()}</strong>
                                    </div>
                                    <Progress percent={pct} strokeColor={{ '0%': '#fb923c', '100%': '#f59e0b' }}
                                        trailColor="rgba(251,146,60,0.10)" showInfo={false} strokeWidth={5} />
                                </div>
                            );
                        })
                    }
                </GlassCard>
            </div>
        </div>
    );
};

export default Analytics;
