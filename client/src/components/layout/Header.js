import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <nav className="glass-navbar py-2 px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center text-decoration-none" to="/" style={{ overflow: 'visible', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="brand-name">EXPENZO</span>
            <span className="brand-tagline">Track • Analyze • Grow</span>
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Header;