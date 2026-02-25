import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../components/Spinner';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const nameRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('user')) navigate('/');
    else if (nameRef.current) nameRef.current.focus();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAlert({ type: 'error', msg: 'Please fill in all fields.' });
      return;
    }
    if (password.length < 6) {
      setAlert({ type: 'error', msg: 'Password must be at least 6 characters.' });
      return;
    }
    try {
      setLoading(true);
      setAlert(null);
      await axios.post('/users/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setAlert({ type: 'success', msg: 'Account created! Redirecting to login…' });
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. That email may already be in use.';
      setAlert({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  /* shared input style */
  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.07)',
    color: '#fff', fontSize: '0.93rem', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  };
  const onFocus = e => { e.target.style.borderColor = 'rgba(129,140,248,0.70)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.14)'; };
  const onBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.16)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {loading && <Spinner />}

      {/* ── LEFT — 4K photo with Ken Burns ── */}
      <div className="auth-left-panel" style={{ '--auth-bg': "url('/auth-bg.png')" }}>
        <div className="auth-left-inner">
          <div style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '0.14em', color: '#fff', marginBottom: 6, textShadow: '0 4px 24px rgba(0,0,0,0.60)' }}>
            EXPENZO
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 44, textShadow: '0 2px 8px rgba(0,0,0,0.50)' }}>
            Track · Analyze · Grow
          </div>
          {[
            { icon: '🚀', title: 'Quick Setup', desc: 'Start tracking in under a minute' },
            { icon: '🔒', title: 'Secure', desc: 'Your data is private and encrypted' },
            { icon: '🌟', title: 'Beautiful UI', desc: 'Premium glassmorphism design' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(0,0,0,0.30)',
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.90rem', textShadow: '0 2px 8px rgba(0,0,0,0.50)' }}>
                  {f.title}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.78rem', marginTop: 2, textShadow: '0 1px 4px rgba(0,0,0,0.40)' }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT — frosted glass form ── */}
      <div className="auth-right-panel">
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Header */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{
                fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.14em',
                background: 'linear-gradient(135deg,#818cf8,#38bdf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>EXPENZO</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Create account</div>
            <div style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.48)', marginTop: 6 }}>Start tracking your finances today</div>
          </div>

          {/* Alert banner */}
          {alert && (
            <div style={{
              padding: '11px 16px', borderRadius: 12, marginBottom: 18,
              fontSize: '0.84rem', fontWeight: 600, lineHeight: 1.4,
              background: alert.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              border: `1px solid ${alert.type === 'error' ? 'rgba(239,68,68,0.45)' : 'rgba(16,185,129,0.45)'}`,
              color: alert.type === 'error' ? '#fca5a5' : '#6ee7b7',
            }}>
              {alert.type === 'error' ? '⚠ ' : '✓ '}{alert.msg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 7, letterSpacing: '0.04em' }}>
                Full Name
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 7, letterSpacing: '0.04em' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 7, letterSpacing: '0.04em' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                background: loading ? 'rgba(99,102,241,0.50)' : 'linear-gradient(135deg,#6366f1,#38bdf8)',
                border: 'none', color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
                transition: 'opacity 0.2s, transform 0.18s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => !loading && (e.target.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: '0.86rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.40)' }}>Already have an account? </span>
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.6 }}>
            By creating an account, you agree to our <span style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline', cursor: 'pointer' }}>Terms &amp; Conditions</span>
            <br />Support: <a href="mailto:adithya70755@gmail.com" style={{ color: '#818cf8', textDecoration: 'none' }}>adithya70755@gmail.com</a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;