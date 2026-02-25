import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar, message, Upload, Select } from 'antd';
import {
  EditOutlined, DeleteOutlined, UserOutlined, PlusOutlined,
  CarOutlined, UnorderedListOutlined, AreaChartOutlined,
  FilePdfOutlined, CameraOutlined, LogoutOutlined, BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import Layout from '../components/layout/Layout';
import Analytics from '../components/Analytics';
import MileageCalc from '../components/MileageCalc';
import KhataBook from '../components/KhataBook';
import axios from 'axios';
import Spinner from '../components/Spinner';
import moment from 'moment';
import useIsMobile from '../hooks/useIsMobile';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CURRENCY_LABELS = { INR: '₹ INR', USD: '$ USD', EUR: '€ EUR' };

/* ── colour tokens ──────────────────────────────── */
const C = {
  income: '#4ade80',
  expense: '#fb923c',
  purple: '#818cf8',
  glass: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)',
  text: 'rgba(255,255,255,0.90)',
  muted: 'rgba(255,255,255,0.45)',
};

/* ── dark styled input ──────────────────────────── */
const darkInput = {
  width: '100%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.14)',
  borderRadius: 12, color: '#fff', padding: '10px 14px', fontSize: '0.90rem',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

/* ── sidebar items ──────────────────────────────── */
const navItems = [
  { key: 'table', icon: <UnorderedListOutlined />, label: 'Transactions' },
  { key: 'analytics', icon: <AreaChartOutlined />, label: 'Analytics' },
  { key: 'khatabook', icon: <BookOutlined />, label: 'Khatabook' },
  { key: 'mileage', icon: <CarOutlined />, label: 'Mileage' },
];

const HomePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allTransaction, setAllTransaction] = useState([]);
  const [frequency, setFrequency] = useState('all');
  const [selectedDates, setSelectedDates] = useState([]);
  const [type, setType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewData, setViewData] = useState('table');
  const [editable, setEditable] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [loginUser, setLoginUser] = useState(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const navigate = useNavigate();

  /* modal form state */
  const [mAmount, setMAmount] = useState('');
  const [mType, setMType] = useState('');
  const [mCategory, setMCategory] = useState('');
  const [mDate, setMDate] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mAlert, setMAlert] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [longPressInfo, setLongPressInfo] = useState(null); // { key, x, y }
  const longPressTimer = useRef(null);

  const getLongPressContent = (key) => {
    if (key === 'table') {
      const recent = [...allTransaction].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
      if (!recent.length) return { title: 'Transactions', items: ['No transactions yet'] };
      return {
        title: 'Recent Transactions',
        items: recent.map(t => `${t.type === 'income' ? '▲' : '▼'} ${currencySymbol}${Number(t.amount).toLocaleString()} · ${t.category} · ${moment(t.date).format('DD MMM')}`),
      };
    }
    if (key === 'analytics') {
      const inc = allTransaction.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = allTransaction.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        title: 'Analytics Summary',
        items: [
          `Total Income: ${currencySymbol}${inc.toLocaleString()}`,
          `Total Expense: ${currencySymbol}${exp.toLocaleString()}`,
          `Balance: ${currencySymbol}${(inc - exp).toLocaleString()}`,
        ],
      };
    }
    if (key === 'khatabook') {
      return { title: 'Khatabook', items: ['Track money given & received', 'Add contacts & manage ledger', 'View net balances'] };
    }
    if (key === 'mileage') {
      return { title: 'Mileage Calculator', items: ['Calculate trip fuel costs', 'Check vehicle range', 'Split costs per passenger'] };
    }
    return { title: '', items: [] };
  };

  const startLongPress = (key) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressInfo(key);
    }, 2500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const symbols = { INR: '₹', USD: '$', EUR: '€' };
    if (user) { setCurrencySymbol(symbols[user.currency] || '₹'); setLoginUser(user); }
  }, []);

  /* Sync from/to date inputs with frequency/selectedDates */
  useEffect(() => {
    if (frequency === 'custom' && fromDate && toDate) {
      setSelectedDates([fromDate, toDate]);
    } else if (frequency !== 'custom') {
      setSelectedDates([]);
    }
  }, [fromDate, toDate, frequency]);

  const handleFrequencyChange = (val) => {
    setFrequency(val);
    if (val !== 'custom') {
      setFromDate('');
      setToDate('');
      setSelectedDates([]);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const res = await axios.post('/users/update-profile', {
        userId: loginUser._id, updateData: { [key]: value }
      });
      if (res.data.success) {
        const updated = { ...loginUser, [key]: value };
        localStorage.setItem('user', JSON.stringify(updated));
        setLoginUser(updated);
        message.success(`${key} updated`);
        if (key === 'currency') window.location.reload();
      }
    } catch { message.error('Update failed'); }
  };

  const logoutHandler = () => {
    localStorage.removeItem('user');
    message.success('Logged out');
    navigate('/login');
  };

  const getAllTransaction = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      setLoading(true);
      const res = await axios.post('/api/v1/transaction/get-transaction', {
        userid: user._id, frequency, selectedDates, type,
      });
      setAllTransaction(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [frequency, selectedDates, type]);

  useEffect(() => { getAllTransaction(); }, [getAllTransaction]);

  const openAdd = () => { resetModal(); setEditable(null); setShowModal(true); };

  /* ── Download statement PDF ── */
  const downloadStatement = async () => {
    try {
      if (!loginUser) return;
      const hide = message.loading('Generating PDF…', 0);
      const res = await axios.post('/api/v1/transaction/get-transaction', {
        userid: loginUser._id, frequency, selectedDates, type,
      });
      hide();
      const data = res.data;
      if (!data?.length) { message.warning('No transactions found'); return; }
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Expense Statement', 14, 20);
      if (fromDate && toDate) {
        doc.setFontSize(10);
        doc.text(`Period: ${moment(fromDate).format('DD MMM YYYY')} – ${moment(toDate).format('DD MMM YYYY')}`, 14, 28);
      }
      autoTable(doc, {
        head: [['Date', 'Amount', 'Type', 'Category', 'Description']],
        body: data.map(t => [moment(t.date).format('YYYY-MM-DD'), `${currencySymbol}${Number(t.amount).toLocaleString()}`, t.type.toUpperCase(), t.category, t.description || '—']),
        startY: fromDate && toDate ? 34 : 28, theme: 'striped', headStyles: { fillColor: [124, 58, 237] },
      });
      doc.save(`Expenzo_Statement_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Downloaded!');
    } catch { message.error('PDF Download Failed'); }
  };
  const openEdit = (record) => {
    setEditable(record);
    setMAmount(record.amount); setMType(record.type); setMCategory(record.category);
    setMDate(moment(record.date).format('YYYY-MM-DD')); setMDesc(record.description || '');
    setMAlert(null); setShowModal(true);
  };

  const resetModal = () => {
    setMAmount(''); setMType(''); setMCategory(''); setMDate(''); setMDesc(''); setMAlert(null);
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      await axios.post('/api/v1/transaction/delete-transaction', { transactionId: record._id });
      getAllTransaction();
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!mAmount || !mType || !mCategory || !mDate) {
      setMAlert({ type: 'error', msg: 'Please fill in all required fields.' }); return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      setLoading(true);
      const payload = {
        amount: Number(mAmount), type: mType, category: mCategory,
        date: mDate, description: mDesc, userid: user._id,
      };
      if (editable) {
        await axios.post('/api/v1/transaction/edit-transaction', { payload, transactionId: editable._id });
      } else {
        await axios.post('/api/v1/transaction/add-transaction', payload);
      }
      setShowModal(false); resetModal(); getAllTransaction();
    } catch (err) {
      setMAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to save transaction.' });
    } finally { setLoading(false); }
  };

  /* ── Derived stats ── */
  const totalIncome = allTransaction.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = allTransaction.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const todayCount = allTransaction.filter(t => moment(t.date).isSame(moment(), 'day')).length;

  /* ── Stat tiles ── */
  const statTiles = [
    { label: 'Income', value: totalIncome, icon: '↑', color: C.income, glow: 'rgba(74,222,128,0.20)', bg: 'rgba(74,222,128,0.10)' },
    { label: 'Expense', value: totalExpense, icon: '↓', color: C.expense, glow: 'rgba(251,146,60,0.20)', bg: 'rgba(251,146,60,0.10)' },
    { label: 'Balance', value: totalIncome - totalExpense, icon: '◎', color: C.purple, glow: 'rgba(129,140,248,0.20)', bg: 'rgba(129,140,248,0.10)' },
  ];

  /* ── Table columns ── */
  const columns = [
    {
      title: 'Date', dataIndex: 'date', width: 110,
      render: v => <span style={{ color: C.muted, fontSize: '0.83rem' }}>{moment(v).format('DD MMM YY')}</span>,
    },
    {
      title: 'Amount', dataIndex: 'amount', width: 105,
      render: (v, r) => (
        <span style={{ fontWeight: 700, fontSize: '0.90rem', color: r.type === 'income' ? C.income : C.expense }}>
          {r.type === 'expense' ? '-' : '+'}{currencySymbol}{Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Type', dataIndex: 'type', width: 100,
      render: t => (
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 999,
          fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em',
          color: t === 'income' ? C.income : C.expense,
          background: t === 'income' ? 'rgba(74,222,128,0.13)' : 'rgba(251,146,60,0.13)',
        }}>
          {t === 'income' ? '▲' : '▼'} {t.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Category', dataIndex: 'category', width: 120,
      render: v => <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.86rem', textTransform: 'capitalize' }}>{v}</span>,
    },
    {
      title: 'Description', dataIndex: 'description',
      render: v => <span style={{ color: C.muted, fontSize: '0.84rem' }}>{v || '—'}</span>,
    },
    {
      title: '', width: 90, align: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={() => openEdit(record)} title="Edit" style={{
            width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(129,140,248,0.30)',
            background: 'rgba(129,140,248,0.10)', color: '#818cf8',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.88rem', transition: 'all 0.18s', outline: 'none',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.22)'; e.currentTarget.style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.10)'; e.currentTarget.style.transform = 'scale(1)'; }}
          ><EditOutlined /></button>

          <button onClick={() => handleDelete(record)} title="Delete" style={{
            width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(251,146,60,0.30)',
            background: 'rgba(251,146,60,0.08)', color: '#fb923c',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.88rem', transition: 'all 0.18s', outline: 'none',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.22)'; e.currentTarget.style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
          ><DeleteOutlined /></button>
        </div>
      ),
    },
  ];

  /* ── Input focus helpers ── */
  const onFocus = e => { e.target.style.borderColor = 'rgba(129,140,248,0.65)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; };
  const onBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.14)'; e.target.style.boxShadow = 'none'; };

  const categories = ['Salary', 'Food', 'Bills', 'Entertainment', 'Transport', 'Health', 'Shopping', 'Investment', 'Other'];

  return (
    <Layout>
      {loading && <Spinner />}

      {/* ══ 2-column wrapper ══════════════════════════════════ */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', gap: 0 }}>

        {/* Mobile hamburger button */}
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(v => !v)} style={{
          display: 'none', position: 'fixed', top: 8, left: 10, zIndex: 9995,
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(129,140,248,0.18)', border: '1px solid rgba(129,140,248,0.35)',
          color: '#818cf8', fontSize: '1.2rem', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
          backdropFilter: 'blur(16px)',
        }}>
          {sidebarOpen ? '✕' : '☰'}
        </button>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}
            style={{ display: 'none' }} />
        )}

        {/* ── LEFT SIDEBAR ──────────────────────────────────── */}
        <aside className={`home-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
          width: 260, flexShrink: 0, padding: '24px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column', gap: 4,
          position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto',
        }}>

          {/* ── Profile Card (top of sidebar) ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '16px 12px 12px', marginBottom: 12,
          }}>
            {/* Avatar with upload */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
              <Avatar size={72} src={loginUser?.profilePic} icon={!loginUser?.profilePic && <UserOutlined />}
                style={{ border: '2px solid rgba(129,140,248,0.40)', boxShadow: '0 0 20px rgba(124,58,237,0.25)' }} />
              {/* Hidden file input for profile pic */}
              <input type="file" accept="image/*" id="profilePicInput" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const img = new Image();
                    img.onload = () => {
                      // Auto center-crop to square + compress
                      const size = Math.min(img.width, img.height);
                      const sx = (img.width - size) / 2;
                      const sy = (img.height - size) / 2;
                      const canvas = document.createElement('canvas');
                      canvas.width = 200; canvas.height = 200;
                      canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
                      const compressed = canvas.toDataURL('image/jpeg', 0.75);
                      updatePreference('profilePic', compressed);
                    };
                    img.src = reader.result;
                  };
                  reader.readAsDataURL(file);
                  e.target.value = ''; // reset so same file can be re-selected
                }}
              />
              <div onClick={() => document.getElementById('profilePicInput').click()} style={{
                position: 'absolute', bottom: 0, right: -2, width: 24, height: 24,
                borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(124,58,237,0.45)', cursor: 'pointer',
                border: '2px solid rgba(10,8,32,0.9)',
              }}>
                <CameraOutlined style={{ fontSize: 11, color: '#fff' }} />
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: C.text, lineHeight: 1.2, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {loginUser?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.76rem', color: C.muted, marginTop: 2 }}>{loginUser?.email || ''}</div>
          </div>

          {/* ── Currency Selector ── */}
          <div style={{ padding: '0 4px', marginBottom: 4 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.18em', color: C.muted, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>
              Currency
            </div>
            <button onClick={() => setShowCurrencyPicker(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '9px 12px', borderRadius: 12,
              background: showCurrencyPicker ? 'rgba(129,140,248,0.14)' : 'rgba(255,255,255,0.05)',
              border: showCurrencyPicker ? '1px solid rgba(129,140,248,0.35)' : '1px solid rgba(255,255,255,0.10)',
              color: C.text, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', outline: 'none', transition: 'all 0.18s',
            }}>
              <span style={{ fontSize: '0.9rem' }}>💰</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{CURRENCY_LABELS[loginUser?.currency || 'INR']}</span>
              <span style={{ fontSize: '0.6rem', color: C.muted, transform: showCurrencyPicker ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}>▶</span>
            </button>
            {showCurrencyPicker && (
              <div style={{ padding: '8px 0 0' }}>
                <Select value={loginUser?.currency || 'INR'} style={{ width: '100%' }}
                  onChange={val => { updatePreference('currency', val); setShowCurrencyPicker(false); }}
                  popupClassName="sidebar-currency-dropdown">
                  <Select.Option value="INR">🇮🇳 INR — Indian Rupee (₹)</Select.Option>
                  <Select.Option value="USD">🇺🇸 USD — US Dollar ($)</Select.Option>
                  <Select.Option value="EUR">🇪🇺 EUR — Euro (€)</Select.Option>
                </Select>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 8px' }} />

          {/* Sidebar nav label */}
          <div style={{ paddingLeft: 8, paddingBottom: 8, marginBottom: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.18em', color: C.muted, textTransform: 'uppercase' }}>
              Navigation
            </div>
          </div>

          {/* Nav items */}
          {navItems.map(({ key, icon, label }) => (
            <button key={key}
              onClick={() => { if (!longPressInfo) { setViewData(key); setSidebarOpen(false); } setLongPressInfo(null); }}
              onTouchStart={() => startLongPress(key)}
              onTouchEnd={cancelLongPress}
              onTouchCancel={cancelLongPress}
              onMouseDown={() => startLongPress(key)}
              onMouseUp={cancelLongPress}
              onMouseLeave={() => { cancelLongPress(); if (viewData !== key) { /* reset hover style handled below */ } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 13,
                border: viewData === key ? '1px solid rgba(129,140,248,0.35)' : '1px solid transparent',
                background: viewData === key ? 'rgba(129,140,248,0.14)' : 'transparent',
                color: viewData === key ? '#818cf8' : 'rgba(255,255,255,0.60)',
                fontSize: '0.88rem', fontWeight: viewData === key ? 700 : 500,
                cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'all 0.18s', outline: 'none',
                fontFamily: 'inherit', position: 'relative',
              }}
              onMouseEnter={e => { if (viewData !== key) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
              {label}
            </button>
          ))}

          {/* ── Long Press Info Tooltip ── */}
          {longPressInfo && (() => {
            const info = getLongPressContent(longPressInfo);
            return (
              <div onClick={() => setLongPressInfo(null)} style={{
                position: 'absolute', left: 12, right: 12, bottom: 80,
                background: 'rgba(20,16,50,0.95)', backdropFilter: 'blur(24px)',
                border: '1px solid rgba(129,140,248,0.30)', borderRadius: 16,
                padding: '14px 16px', zIndex: 10000,
                boxShadow: '0 8px 32px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06)',
                animation: 'fadeIn 0.2s ease-out',
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 8 }}>
                  {info.title}
                </div>
                {info.items.map((item, i) => (
                  <div key={i} style={{
                    fontSize: '0.80rem', color: 'rgba(255,255,255,0.75)', padding: '5px 0',
                    borderBottom: i < info.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    {item}
                  </div>
                ))}
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.30)', marginTop: 8, textAlign: 'center' }}>
                  Tap to dismiss
                </div>
              </div>
            );
          })()}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* ── Logout ── */}
          <button onClick={logoutHandler} style={{
            margin: '0 4px 8px', padding: '11px', borderRadius: 14,
            background: 'rgba(225,29,72,0.08)', border: '1.5px solid rgba(225,29,72,0.22)',
            color: '#e11d48', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit', transition: 'background 0.2s, transform 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.08)'; }}
          >
            <LogoutOutlined style={{ fontSize: 14 }} /> Sign Out
          </button>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────── */}
        <main className="home-main" style={{ flex: 1, padding: '24px 24px 100px', minWidth: 0 }}>

          {/* ── Welcome Greeting ── */}
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.45rem', color: C.text, lineHeight: 1.3 }}>
              {(() => {
                const h = new Date().getHours();
                if (h < 12) return 'Good morning';
                if (h < 17) return 'Good afternoon';
                return 'Good evening';
              })()}, {loginUser?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '0.84rem' }}>
              {moment().format('dddd, MMMM D YYYY')} · Here's your financial overview
            </p>
          </div>

          {/* ── Overview heading ── */}
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.15em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>Overview</div>

          {/* ── Stat Tiles (Income / Expense / Balance) ── */}
          <div className="stat-tiles-grid" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 14, marginBottom: 22,
          }}>
            {statTiles.map(({ label, value, icon, color, glow, bg }, idx) => (
              <div key={label} className="stat-tile" style={{
                background: C.glass, backdropFilter: 'blur(32px)',
                border: `1px solid ${C.border}`, borderRadius: 20, padding: isMobile ? '14px 14px' : '16px 18px',
                boxShadow: `0 4px 20px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.05)`,
                position: 'relative', overflow: 'hidden',
                ...(isMobile && idx === 2 ? { gridColumn: '1 / -1' } : {}),
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: bg,
                    border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', color, flexShrink: 0, boxShadow: `0 0 14px ${glow}`,
                  }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: isMobile ? '1.05rem' : '1.20rem', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
                      {currencySymbol}{Number(value).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Page Heading (selected navigation option) ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.55rem', color: C.text }}>
                {viewData === 'table' ? 'Transactions' : viewData === 'analytics' ? 'Analytics' : viewData === 'khatabook' ? 'Khatabook' : 'Mileage Calculator'}
              </h1>
              <p style={{ margin: '3px 0 0', color: C.muted, fontSize: '0.83rem' }}>
                {moment().format('ddd, MMM D YYYY')} · {allTransaction.length} records
              </p>
            </div>
          </div>

          {/* ── Filters ── */}
          {(viewData === 'table') && (
            <div style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'flex-end',
              background: C.glass, backdropFilter: 'blur(20px)',
              border: `1px solid ${C.border}`, borderRadius: 16, padding: '12px 16px',
            }}>
              {/* Row 1: Period + Type side by side */}
              <div style={{ display: 'flex', gap: 10, flex: isMobile ? 'unset' : 1 }}>
                {/* Period */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 5 }}>Period</div>
                  <select value={frequency} onChange={e => handleFrequencyChange(e.target.value)}
                    style={{ ...darkInput, width: '100%', padding: '8px 12px' }}>
                    <option value="all">All Time</option>
                    <option value="7">Last 1 Week</option>
                    <option value="30">Last 1 Month</option>
                    <option value="365">Last 1 Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                {/* Type */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 5 }}>Type</div>
                  <select value={type} onChange={e => setType(e.target.value)}
                    style={{ ...darkInput, width: '100%', padding: '8px 12px' }}>
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>

              {/* Custom date range — only shown when period is Custom */}
              {frequency === 'custom' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 5 }}>From</div>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                      style={{ ...darkInput, width: '100%', padding: '8px 12px', colorScheme: 'dark' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 5 }}>To</div>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                      style={{ ...darkInput, width: '100%', padding: '8px 12px', colorScheme: 'dark' }} />
                  </div>
                </div>
              )}

              {/* Spacer — desktop only */}
              {!isMobile && <div style={{ flex: 1 }} />}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Download Statement — always visible */}
                <button onClick={downloadStatement} style={{
                  flex: isMobile ? 1 : 'unset',
                  padding: '9px 16px', borderRadius: 12, border: '1px solid rgba(52,211,153,0.35)',
                  background: 'rgba(52,211,153,0.12)', color: '#34d399',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit', transition: 'all 0.18s', outline: 'none',
                  whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.22)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.12)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <FilePdfOutlined /> Download Statement
                </button>

                {/* Add Transaction — desktop only (mobile uses FAB) */}
                {!isMobile && (
                  <button onClick={openAdd} style={{
                    padding: '9px 16px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#6366f1,#38bdf8)',
                    color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 4px 16px rgba(99,102,241,0.40)', fontFamily: 'inherit',
                    transition: 'all 0.18s', outline: 'none', whiteSpace: 'nowrap',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <PlusOutlined /> Add Transaction
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── View Content ── */}
          {viewData === 'table' && (
            <div style={{
              background: C.glass, backdropFilter: 'blur(32px)',
              border: `1px solid ${C.border}`, borderRadius: 20,
              overflowX: 'auto', overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 650 : 'unset' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Date', 'Amount', 'Type', 'Category', 'Description', 'Actions'].map((h, i) => (
                      <th key={i} style={{
                        padding: '12px 16px', textAlign: h === 'Actions' ? 'right' : 'left',
                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap',
                        background: 'rgba(255,255,255,0.03)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allTransaction.length === 0 ? (
                    <tr><td colSpan={6} style={{
                      padding: isMobile ? '32px 16px' : '48px',
                      textAlign: 'center', color: C.muted, fontSize: '0.90rem',
                      wordWrap: 'break-word', whiteSpace: 'normal',
                    }}>
                      No transactions yet. Click <strong style={{ color: C.purple }}>+ Add Transaction</strong> to get started.
                    </td></tr>
                  ) : allTransaction.map((t, idx) => (
                    <tr key={t._id} style={{
                      borderBottom: idx < allTransaction.length - 1 ? `1px solid rgba(255,255,255,0.06)` : 'none',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 16px', color: C.muted, fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                        {moment(t.date).format('DD MMM YYYY')}
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.91rem', color: t.type === 'income' ? C.income : C.expense }}>
                          {t.type === 'expense' ? '−' : '+'}{currencySymbol}{Number(t.amount).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                          color: t.type === 'income' ? C.income : C.expense,
                          background: t.type === 'income' ? 'rgba(74,222,128,0.13)' : 'rgba(251,146,60,0.13)',
                        }}>
                          {t.type === 'income' ? '▲' : '▼'} {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: 'rgba(255,255,255,0.65)', fontSize: '0.86rem', textTransform: 'capitalize' }}>
                        {t.category}
                      </td>
                      <td style={{ padding: '13px 16px', color: C.muted, fontSize: '0.84rem' }}>
                        {t.description || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {[
                            { icon: <EditOutlined />, color: C.purple, bg: 'rgba(129,140,248,0.10)', bc: 'rgba(129,140,248,0.28)', action: () => openEdit(t) },
                            { icon: <DeleteOutlined />, color: C.expense, bg: 'rgba(251,146,60,0.08)', bc: 'rgba(251,146,60,0.28)', action: () => handleDelete(t) },
                          ].map(({ icon, color, bg, bc, action }, bi) => (
                            <button key={bi} onClick={action} style={{
                              width: 30, height: 30, borderRadius: 9, border: `1px solid ${bc}`,
                              background: bg, color, cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontSize: '0.84rem',
                              transition: 'all 0.16s', outline: 'none',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.3)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                            >{icon}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewData === 'analytics' && <Analytics allTransaction={allTransaction} />}
          {viewData === 'mileage' && <MileageCalc currencySymbol={currencySymbol} />}
          {viewData === 'khatabook' && <KhataBook currencySymbol={currencySymbol} />}
        </main>
      </div>

      {/* ── Mobile FAB: + Add Transaction (only on Transactions view) ── */}
      {isMobile && viewData === 'table' && (
        <button onClick={openAdd} style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 9000,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg,#6366f1,#38bdf8)',
          color: '#fff', fontSize: '1.4rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(99,102,241,0.50), 0 2px 8px rgba(0,0,0,0.30)',
          transition: 'all 0.2s', outline: 'none',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <PlusOutlined />
        </button>
      )}

      {/* ── Custom Dark Modal Overlay ── */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); resetModal(); } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,8,0.70)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 500,
            background: 'linear-gradient(160deg, rgba(20,20,45,0.98) 0%, rgba(12,12,28,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 24,
            boxShadow: '0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.10)',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 22px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontWeight: 800, fontSize: '1.0rem', color: 'rgba(255,255,255,0.92)' }}>
                {editable ? '✏️ Edit Transaction' : '✦ New Transaction'}
              </span>
              <button onClick={() => { setShowModal(false); resetModal(); }} style={{
                width: 30, height: 30, borderRadius: 9, border: 'none',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)',
                cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; }}
              >✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 22px 22px' }}>

              {/* Alert */}
              {mAlert && (
                <div style={{
                  padding: '10px 14px', borderRadius: 12, marginBottom: 16, fontSize: '0.84rem', fontWeight: 600,
                  background: mAlert.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                  border: `1px solid ${mAlert.type === 'error' ? 'rgba(239,68,68,0.40)' : 'rgba(16,185,129,0.40)'}`,
                  color: mAlert.type === 'error' ? '#fca5a5' : '#6ee7b7',
                }}>
                  {mAlert.type === 'error' ? '⚠ ' : '✓ '}{mAlert.msg}
                </div>
              )}

              {/* Amount + Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.40)', marginBottom: 6, letterSpacing: '0.10em' }}>AMOUNT *</label>
                  <input type="number" value={mAmount} onChange={e => setMAmount(e.target.value)}
                    placeholder="0.00" style={darkInput} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.40)', marginBottom: 6, letterSpacing: '0.10em' }}>TYPE *</label>
                  <select value={mType} onChange={e => setMType(e.target.value)} style={darkInput} onFocus={onFocus} onBlur={onBlur}>
                    <option value="" disabled>Select type</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.40)', marginBottom: 6, letterSpacing: '0.10em' }}>CATEGORY *</label>
                <select value={mCategory} onChange={e => setMCategory(e.target.value)} style={darkInput} onFocus={onFocus} onBlur={onBlur}>
                  <option value="" disabled>Select category</option>
                  {categories.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>

              {/* Date */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.40)', marginBottom: 6, letterSpacing: '0.10em' }}>DATE *</label>
                <input type="date" value={mDate} onChange={e => setMDate(e.target.value)}
                  style={{ ...darkInput, colorScheme: 'dark' }} onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.40)', marginBottom: 6, letterSpacing: '0.10em' }}>DESCRIPTION</label>
                <textarea value={mDesc} onChange={e => setMDesc(e.target.value)}
                  placeholder="Optional note…" rows={2}
                  style={{ ...darkInput, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowModal(false); resetModal(); }} style={{
                  padding: '11px 22px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)', fontWeight: 600,
                  fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>Cancel</button>
                <button onClick={handleSubmit} disabled={loading} style={{
                  padding: '11px 28px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#6366f1,#38bdf8)', color: '#fff', fontWeight: 700,
                  fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 18px rgba(99,102,241,0.45)', fontFamily: 'inherit',
                  opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
                }}>
                  {loading ? 'Saving…' : editable ? 'Update' : 'Save Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HomePage;