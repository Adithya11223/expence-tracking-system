import React, { useState } from 'react';

const Footer = () => {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <div className="glass-footer text-center">
        <h6 style={{ margin: 0, fontSize: '0.58rem' }}>© 2026 · Designed &amp; Developed by Ankunche Adithya</h6>
        <p style={{ margin: '3px 0 0', fontSize: '0.44rem', color: 'rgba(255,255,255,0.40)' }}>
          For support: <a href="mailto:adithya70755@gmail.com" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>adithya70755@gmail.com</a>
        </p>
        <p style={{ margin: '3px 0 0', fontSize: '0.40rem' }}>
          <button onClick={() => setShowTerms(true)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer', textDecoration: 'underline', fontSize: '0.40rem',
            fontFamily: 'inherit', padding: 0,
          }}>
            Terms &amp; Conditions
          </button>
          {' · '}
          <button onClick={() => setShowTerms(true)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer', textDecoration: 'underline', fontSize: '0.40rem',
            fontFamily: 'inherit', padding: 0,
          }}>
            Privacy Policy
          </button>
        </p>
      </div>

      {/* ── Terms & Conditions Modal ── */}
      {showTerms && (
        <div onClick={() => setShowTerms(false)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto',
            background: 'rgba(15,12,35,0.97)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, padding: '28px 30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.60)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.20rem', fontWeight: 800, color: '#fff' }}>Terms &amp; Conditions</h2>
              <button onClick={() => setShowTerms(false)} style={{
                width: 30, height: 30, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.72rem', marginBottom: 16 }}>Last updated: February 2026</p>

              <h3 style={{ color: '#818cf8', fontSize: '0.88rem', fontWeight: 700, marginTop: 18, marginBottom: 6 }}>1. Acceptance of Terms</h3>
              <p>By accessing and using Expenzo, you accept and agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use the application.</p>

              <h3 style={{ color: '#818cf8', fontSize: '0.88rem', fontWeight: 700, marginTop: 18, marginBottom: 6 }}>2. Description of Service</h3>
              <p>Expenzo is a personal expense tracking application that allows users to record income and expenses, view analytics, manage a digital ledger (Khatabook), and calculate mileage costs.</p>

              <h3 style={{ color: '#818cf8', fontSize: '0.88rem', fontWeight: 700, marginTop: 18, marginBottom: 6 }}>3. User Accounts</h3>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration.</p>

              <h3 style={{ color: '#818cf8', fontSize: '0.88rem', fontWeight: 700, marginTop: 18, marginBottom: 6 }}>4. Privacy &amp; Data</h3>
              <p>Your personal information and transaction data are stored securely. We do not sell, share, or distribute your personal data to third parties. Data is used solely to provide the service.</p>

              <h3 style={{ color: '#818cf8', fontSize: '0.88rem', fontWeight: 700, marginTop: 18, marginBottom: 6 }}>5. Acceptable Use</h3>
              <p>You agree not to misuse the service, attempt unauthorized access, or use automated tools to interact with the application in a manner that disrupts normal operation.</p>

              <h3 style={{ color: '#818cf8', fontSize: '0.88rem', fontWeight: 700, marginTop: 18, marginBottom: 6 }}>6. Disclaimer</h3>
              <p>Expenzo is provided "as is" without warranties of any kind. We are not responsible for any financial decisions made based on data displayed in the application.</p>

              <h3 style={{ color: '#818cf8', fontSize: '0.88rem', fontWeight: 700, marginTop: 18, marginBottom: 6 }}>7. Contact</h3>
              <p>For questions, support, or concerns regarding these terms, please contact us at <a href="mailto:adithya70755@gmail.com" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>adithya70755@gmail.com</a>.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;