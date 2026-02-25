import React, { useState, useEffect } from 'react';
import { Progress, Card } from 'antd';

const Analytics = ({ allTransaction }) => {
    const [currencySymbol, setCurrencySymbol] = useState('₹');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€' };
        if (user && user.currency) setCurrencySymbol(symbols[user.currency] || '₹');
    }, []);

    const totalTransaction = allTransaction.length;
    const totalIncomeTransactions = allTransaction.filter((t) => t.type === 'income');
    const totalExpenseTransactions = allTransaction.filter((t) => t.type === 'expense');

    const totalIncomePercent = totalTransaction > 0 ? (totalIncomeTransactions.length / totalTransaction) * 100 : 0;
    const totalExpensePercent = totalTransaction > 0 ? (totalExpenseTransactions.length / totalTransaction) * 100 : 0;

    const totalIncomeTurnover = totalIncomeTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalExpenseTurnover = totalExpenseTransactions.reduce((acc, t) => acc + t.amount, 0);

    const totalCashFlow = totalIncomeTurnover + totalExpenseTurnover;
    const netBalance = totalIncomeTurnover - totalExpenseTurnover;

    const totalIncomeTurnoverPercent = totalCashFlow > 0 ? (totalIncomeTurnover / totalCashFlow) * 100 : 0;
    const totalExpenseTurnoverPercent = totalCashFlow > 0 ? (totalExpenseTurnover / totalCashFlow) * 100 : 0;

    const categories = [...new Set(allTransaction.map((t) => t.category))];

    // Light-theme label renderer for Progress circles
    const circleLabel = (color, label) => (p) => (
        <div style={{ color, textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{p}%</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
        </div>
    );

    return (
        <div className="analytics-container">
            {/* Top Row — Summary Cards */}
            <div className="row mb-4 g-3">

                {/* Volume */}
                <div className="col-md-4">
                    <Card title={
                        <span>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Volume • </span>
                            <span style={{ color: '#7c3aed', fontWeight: 800 }}>{totalTransaction} Items</span>
                        </span>
                    }>
                        <div className="d-flex justify-content-around py-2">
                            <Progress
                                type="circle"
                                strokeColor={{ '0%': '#10b981', '100%': '#059669' }}
                                trailColor="rgba(124,58,237,0.07)"
                                percent={totalIncomePercent.toFixed(0)}
                                format={circleLabel('#059669', 'Income')}
                            />
                            <Progress
                                type="circle"
                                strokeColor={{ '0%': '#e11d48', '100%': '#be123c' }}
                                trailColor="rgba(124,58,237,0.07)"
                                percent={totalExpensePercent.toFixed(0)}
                                format={circleLabel('#e11d48', 'Expense')}
                            />
                        </div>
                    </Card>
                </div>

                {/* Cash Flow */}
                <div className="col-md-4">
                    <Card title={
                        <span>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Cash Flow • </span>
                            <span style={{ color: '#06b6d4', fontWeight: 800 }}>{currencySymbol}{totalCashFlow.toLocaleString()}</span>
                        </span>
                    }>
                        <div className="d-flex justify-content-around py-2">
                            <Progress
                                type="circle"
                                strokeColor={{ '0%': '#10b981', '100%': '#059669' }}
                                trailColor="rgba(124,58,237,0.07)"
                                percent={totalIncomeTurnoverPercent.toFixed(0)}
                                format={circleLabel('#059669', 'In')}
                            />
                            <Progress
                                type="circle"
                                strokeColor={{ '0%': '#e11d48', '100%': '#be123c' }}
                                trailColor="rgba(124,58,237,0.07)"
                                percent={totalExpenseTurnoverPercent.toFixed(0)}
                                format={circleLabel('#e11d48', 'Out')}
                            />
                        </div>
                    </Card>
                </div>

                {/* Net Balance */}
                <div className="col-md-4">
                    <Card title={
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>
                            {netBalance >= 0 ? '✦ Net Profit' : '▼ Net Loss'}
                        </span>
                    }>
                        <div className="text-center py-3">
                            <div style={{
                                fontSize: '2.2rem',
                                fontWeight: 900,
                                color: netBalance >= 0 ? '#059669' : '#e11d48',
                                textShadow: netBalance >= 0
                                    ? '0 0 20px rgba(16,185,129,0.30)'
                                    : '0 0 20px rgba(225,29,72,0.25)',
                                letterSpacing: '-1px'
                            }}>
                                {currencySymbol}{Math.abs(netBalance).toLocaleString()}
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '8px', marginBottom: 0 }}>
                                Available funds after expenses
                            </p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom Row — Category Breakdown */}
            <div className="row g-3">

                {/* Income Sources */}
                <div className="col-md-6">
                    <Card title={
                        <span>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Income </span>
                            <span style={{ color: '#059669', fontWeight: 800 }}>Sources</span>
                        </span>
                    }>
                        {categories.map((category) => {
                            const amount = allTransaction
                                .filter((t) => t.type === 'income' && t.category === category)
                                .reduce((acc, t) => acc + t.amount, 0);
                            const percent = ((amount / totalIncomeTurnover) * 100).toFixed(0);
                            return amount > 0 && (
                                <div className="mb-3" key={`income-${category}`}>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span style={{ color: '#4b5563', fontSize: '0.88rem' }}>
                                            {category} <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>({percent}%)</span>
                                        </span>
                                        <strong style={{ color: '#059669', fontSize: '0.9rem' }}>{currencySymbol}{amount.toLocaleString()}</strong>
                                    </div>
                                    <Progress
                                        percent={percent}
                                        strokeColor={{ '0%': '#34d399', '100%': '#059669' }}
                                        trailColor="rgba(124,58,237,0.07)"
                                        showInfo={false}
                                    />
                                </div>
                            );
                        })}
                        {categories.filter(cat =>
                            allTransaction.some(t => t.type === 'income' && t.category === cat && t.amount > 0)
                        ).length === 0 && (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No income records</p>
                            )}
                    </Card>
                </div>

                {/* Expense Breakdown */}
                <div className="col-md-6">
                    <Card title={
                        <span>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Expense </span>
                            <span style={{ color: '#e11d48', fontWeight: 800 }}>Breakdown</span>
                        </span>
                    }>
                        {categories.map((category) => {
                            const amount = allTransaction
                                .filter((t) => t.type === 'expense' && t.category === category)
                                .reduce((acc, t) => acc + t.amount, 0);
                            const percent = ((amount / totalExpenseTurnover) * 100).toFixed(0);
                            return amount > 0 && (
                                <div className="mb-3" key={`expense-${category}`}>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span style={{ color: '#4b5563', fontSize: '0.88rem' }}>
                                            {category} <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>({percent}%)</span>
                                        </span>
                                        <strong style={{ color: '#e11d48', fontSize: '0.9rem' }}>{currencySymbol}{amount.toLocaleString()}</strong>
                                    </div>
                                    <Progress
                                        percent={percent}
                                        strokeColor={{ '0%': '#fb7185', '100%': '#e11d48' }}
                                        trailColor="rgba(124,58,237,0.07)"
                                        showInfo={false}
                                    />
                                </div>
                            );
                        })}
                        {categories.filter(cat =>
                            allTransaction.some(t => t.type === 'expense' && t.category === cat && t.amount > 0)
                        ).length === 0 && (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No expense records</p>
                            )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
