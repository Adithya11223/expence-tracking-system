import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import {
    UserOutlined, PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
    SearchOutlined, PhoneOutlined, FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import useIsMobile from '../hooks/useIsMobile';

/* ── colour tokens ── */
const C = {
    gave: '#fb923c',
    got: '#4ade80',
    purple: '#818cf8',
    glass: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)',
    text: 'rgba(255,255,255,0.90)',
    muted: 'rgba(255,255,255,0.45)',
};

const darkInput = {
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.14)',
    borderRadius: 12, color: '#fff', padding: '10px 14px', fontSize: '0.90rem',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const onFocus = e => { e.target.style.borderColor = 'rgba(129,140,248,0.65)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; };
const onBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.14)'; e.target.style.boxShadow = 'none'; };

export default function KhataBook({ currencySymbol = '₹' }) {
    const isMobile = useIsMobile();
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState(null);  // selected contact object
    const [entries, setEntries] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Add contact form
    const [showAddContact, setShowAddContact] = useState(false);
    const [cName, setCName] = useState('');
    const [cPhone, setCPhone] = useState('');

    // Add entry form
    const [showAddEntry, setShowAddEntry] = useState(null); // 'gave' | 'got' | null
    const [eAmount, setEAmount] = useState('');
    const [eDesc, setEDesc] = useState('');
    const [eDate, setEDate] = useState(moment().format('YYYY-MM-DD'));

    const user = JSON.parse(localStorage.getItem('user'));

    /* ── Fetch contacts ── */
    const fetchContacts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.post('/api/v1/khatabook/get-contacts', { userid: user._id });
            setContacts(res.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [user._id]);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    /* ── Fetch entries for selected contact ── */
    const fetchEntries = useCallback(async (contactId) => {
        try {
            const res = await axios.post('/api/v1/khatabook/get-entries', { contactId });
            setEntries(res.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        if (selected) fetchEntries(selected._id);
        else setEntries([]);
    }, [selected, fetchEntries]);

    /* ── Add contact ── */
    const handleAddContact = async () => {
        if (!cName.trim()) { message.warning('Enter contact name'); return; }
        try {
            await axios.post('/api/v1/khatabook/add-contact', { userid: user._id, name: cName.trim(), phone: cPhone.trim() });
            setCName(''); setCPhone(''); setShowAddContact(false);
            message.success('Contact added');
            fetchContacts();
        } catch { message.error('Failed to add contact'); }
    };

    /* ── Delete contact ── */
    const handleDeleteContact = async (contactId) => {
        try {
            await axios.post('/api/v1/khatabook/delete-contact', { contactId });
            if (selected?._id === contactId) { setSelected(null); setEntries([]); }
            message.success('Contact deleted');
            fetchContacts();
        } catch { message.error('Failed to delete contact'); }
    };

    /* ── Add entry ── */
    const handleAddEntry = async () => {
        if (!eAmount || Number(eAmount) <= 0) { message.warning('Enter a valid amount'); return; }
        try {
            await axios.post('/api/v1/khatabook/add-entry', {
                userid: user._id, contactId: selected._id,
                amount: Number(eAmount), type: showAddEntry,
                description: eDesc.trim(), date: eDate,
            });
            setEAmount(''); setEDesc(''); setEDate(moment().format('YYYY-MM-DD'));
            setShowAddEntry(null);
            message.success('Entry added');
            fetchEntries(selected._id);
            fetchContacts(); // refresh balance
        } catch { message.error('Failed to add entry'); }
    };

    /* ── Delete entry ── */
    const handleDeleteEntry = async (entryId) => {
        try {
            await axios.post('/api/v1/khatabook/delete-entry', { entryId });
            message.success('Entry deleted');
            fetchEntries(selected._id);
            fetchContacts();
        } catch { message.error('Failed to delete entry'); }
    };

    /* ── Filtered contacts ── */
    const visible = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    /* ── Balance helpers ── */
    const balanceLabel = (bal) => {
        if (bal > 0) return { text: `Will get ${currencySymbol}${Math.abs(bal).toLocaleString()}`, color: C.got };
        if (bal < 0) return { text: `Will give ${currencySymbol}${Math.abs(bal).toLocaleString()}`, color: C.gave };
        return { text: 'Settled', color: C.muted };
    };

    // Net totals
    const netYouGave = contacts.reduce((s, c) => s + (c.totalGave || 0), 0);
    const netYouGot = contacts.reduce((s, c) => s + (c.totalGot || 0), 0);

    return (
        <div className="khatabook-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: 18, alignItems: 'start', minHeight: 500 }}>

            {/* ═══ LEFT PANEL — Contact list ═══ */}
            <div style={{
                background: C.glass, backdropFilter: 'blur(32px)',
                border: `1px solid ${C.border}`, borderRadius: 20,
                padding: '16px 14px', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: C.text }}>📒 Khatabook</h2>
                    <button onClick={() => setShowAddContact(v => !v)} style={{
                        padding: '6px 12px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg,#6366f1,#38bdf8)',
                        color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                    }}>
                        <PlusOutlined /> Add
                    </button>
                </div>

                {/* Net summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.got, marginBottom: 2 }}>You'll Get</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: C.got }}>{currencySymbol}{netYouGot.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.20)', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.gave, marginBottom: 2 }}>You Gave</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: C.gave }}>{currencySymbol}{netYouGave.toLocaleString()}</div>
                    </div>
                </div>

                {/* Add contact form */}
                {showAddContact && (
                    <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.20)', borderRadius: 14, padding: 12, marginBottom: 12 }}>
                        <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Contact name *"
                            style={{ ...darkInput, marginBottom: 8 }} onFocus={onFocus} onBlur={onBlur} />
                        <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="Phone (optional)"
                            style={{ ...darkInput, marginBottom: 8 }} onFocus={onFocus} onBlur={onBlur} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleAddContact} style={{
                                flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                                background: 'linear-gradient(135deg,#6366f1,#38bdf8)', color: '#fff',
                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                            }}>Save</button>
                            <button onClick={() => setShowAddContact(false)} style={{
                                padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                                background: 'transparent', color: C.muted, fontWeight: 600, fontSize: '0.82rem',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 10 }}>
                    <SearchOutlined style={{ position: 'absolute', left: 12, top: 11, color: C.muted, fontSize: '0.82rem' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
                        style={{ ...darkInput, paddingLeft: 34, padding: '9px 14px 9px 34px' }} onFocus={onFocus} onBlur={onBlur} />
                </div>

                {/* Contact list */}
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {visible.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: C.muted, fontSize: '0.84rem' }}>
                            {contacts.length === 0 ? 'No contacts yet. Tap + Add to begin.' : 'No matches found.'}
                        </div>
                    )}
                    {visible.map(c => {
                        const bl = balanceLabel(c.balance);
                        const isActive = selected?._id === c._id;
                        return (
                            <div key={c._id} onClick={() => setSelected(c)} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px',
                                borderRadius: 12, cursor: 'pointer', marginBottom: 4,
                                background: isActive ? 'rgba(129,140,248,0.14)' : 'transparent',
                                border: isActive ? '1px solid rgba(129,140,248,0.35)' : '1px solid transparent',
                                transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.30)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: C.purple, fontSize: '0.82rem', fontWeight: 700,
                                }}>
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.70rem', color: bl.color, fontWeight: 600 }}>{bl.text}</div>
                                </div>
                                <button onClick={e => { e.stopPropagation(); handleDeleteContact(c._id); }} title="Delete"
                                    style={{
                                        width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(251,146,60,0.25)',
                                        background: 'rgba(251,146,60,0.08)', color: '#fb923c',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.72rem', transition: 'all 0.15s', outline: 'none', flexShrink: 0,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.20)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.08)'; }}
                                >
                                    <DeleteOutlined />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══ RIGHT PANEL — Ledger ═══ */}
            <div style={{
                background: C.glass, backdropFilter: 'blur(32px)',
                border: `1px solid ${C.border}`, borderRadius: 20,
                padding: '20px 22px', position: 'relative', overflow: 'hidden', minHeight: 400,
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />

                {!selected ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: C.muted }}>
                        <div style={{ fontSize: '3rem', marginBottom: 14 }}>📖</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Select a contact to view their ledger</div>
                        <div style={{ fontSize: '0.80rem', marginTop: 6, color: 'rgba(255,255,255,0.30)' }}>
                            Track money given and received easily
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Contact header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: C.text }}>{selected.name}</h2>
                                {selected.phone && (
                                    <div style={{ fontSize: '0.76rem', color: C.muted, marginTop: 2 }}>
                                        <PhoneOutlined /> {selected.phone}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 2 }}>Balance</div>
                                <div style={{ fontSize: '1.10rem', fontWeight: 800, color: balanceLabel(selected.balance).color }}>
                                    {selected.balance > 0 ? '+' : ''}{currencySymbol}{Math.abs(selected.balance).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: balanceLabel(selected.balance).color, fontWeight: 600 }}>
                                    {balanceLabel(selected.balance).text}
                                </div>
                            </div>
                        </div>

                        {/* Gave / Got summary boxes */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                            <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.20)', borderRadius: 14, padding: '10px 14px' }}>
                                <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.gave, marginBottom: 2 }}>You Gave</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: C.gave }}>{currencySymbol}{(selected.totalGave || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)', borderRadius: 14, padding: '10px 14px' }}>
                                <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.got, marginBottom: 2 }}>You Got</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: C.got }}>{currencySymbol}{(selected.totalGot || 0).toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                            <button onClick={() => setShowAddEntry(showAddEntry === 'gave' ? null : 'gave')} style={{
                                flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                                background: showAddEntry === 'gave' ? 'rgba(251,146,60,0.25)' : 'rgba(251,146,60,0.12)',
                                color: C.gave, fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}>
                                <ArrowUpOutlined /> I Gave
                            </button>
                            <button onClick={() => setShowAddEntry(showAddEntry === 'got' ? null : 'got')} style={{
                                flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                                background: showAddEntry === 'got' ? 'rgba(74,222,128,0.25)' : 'rgba(74,222,128,0.12)',
                                color: C.got, fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}>
                                <ArrowDownOutlined /> I Got
                            </button>
                        </div>

                        {/* Add entry form */}
                        {showAddEntry && (
                            <div style={{
                                background: showAddEntry === 'gave' ? 'rgba(251,146,60,0.06)' : 'rgba(74,222,128,0.06)',
                                border: `1px solid ${showAddEntry === 'gave' ? 'rgba(251,146,60,0.20)' : 'rgba(74,222,128,0.20)'}`,
                                borderRadius: 14, padding: 14, marginBottom: 16,
                            }}>
                                <div style={{
                                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                                    color: showAddEntry === 'gave' ? C.gave : C.got, marginBottom: 10
                                }}>
                                    {showAddEntry === 'gave' ? '💸 Money Given' : '💰 Money Received'}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input type="number" value={eAmount} onChange={e => setEAmount(e.target.value)}
                                        placeholder="Amount *" style={darkInput} onFocus={onFocus} onBlur={onBlur} />
                                    <input type="date" value={eDate} onChange={e => setEDate(e.target.value)}
                                        style={{ ...darkInput, colorScheme: 'dark' }} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                                <input value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Description (optional)"
                                    style={{ ...darkInput, marginBottom: 10 }} onFocus={onFocus} onBlur={onBlur} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={handleAddEntry} style={{
                                        flex: 1, padding: '9px', borderRadius: 10, border: 'none',
                                        background: showAddEntry === 'gave' ? 'linear-gradient(135deg,#f97316,#fb923c)' : 'linear-gradient(135deg,#22c55e,#4ade80)',
                                        color: '#fff', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit',
                                    }}>Save Entry</button>
                                    <button onClick={() => setShowAddEntry(null)} style={{
                                        padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'transparent', color: C.muted, fontWeight: 600, fontSize: '0.82rem',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {/* Entries list */}
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
                            <FileTextOutlined /> Transaction History
                        </div>
                        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                            {entries.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: C.muted, fontSize: '0.84rem' }}>
                                    No entries yet. Tap <strong>I Gave</strong> or <strong>I Got</strong> to add one.
                                </div>
                            ) : (
                                entries.map(e => (
                                    <div key={e._id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.12s',
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                            background: e.type === 'gave' ? 'rgba(251,146,60,0.12)' : 'rgba(74,222,128,0.12)',
                                            border: `1px solid ${e.type === 'gave' ? 'rgba(251,146,60,0.25)' : 'rgba(74,222,128,0.25)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: e.type === 'gave' ? C.gave : C.got, fontSize: '0.78rem',
                                        }}>
                                            {e.type === 'gave' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: C.text }}>
                                                {e.description || (e.type === 'gave' ? 'Gave money' : 'Got money')}
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: C.muted }}>
                                                {moment(e.date).format('DD MMM YYYY')}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontWeight: 700, fontSize: '0.88rem',
                                            color: e.type === 'gave' ? C.gave : C.got,
                                        }}>
                                            {e.type === 'gave' ? '-' : '+'}{currencySymbol}{Number(e.amount).toLocaleString()}
                                        </div>
                                        <button onClick={() => handleDeleteEntry(e._id)} title="Delete" style={{
                                            width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.10)',
                                            background: 'rgba(255,255,255,0.04)', color: C.muted,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.68rem', transition: 'all 0.15s', outline: 'none', flexShrink: 0,
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.15)'; e.currentTarget.style.color = '#fb923c'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
                                        >
                                            <DeleteOutlined />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
