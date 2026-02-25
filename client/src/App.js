import { Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import Register from "./pages/Register";
import Login from "./pages/Login";

/* ─── Ant Design v6 global token override ─── */
const antdTheme = {

  token: {
    colorPrimary: '#7c3aed',   // violet
    colorPrimaryHover: '#6d28d9',
    colorPrimaryActive: '#5b21b6',
    colorLink: '#7c3aed',
    colorLinkHover: '#06b6d4',
    colorBorder: 'rgba(124,58,237,0.18)',
    colorBorderSecondary: 'rgba(124,58,237,0.10)',
    colorBgContainer: 'rgba(255,255,255,0.78)',
    colorBgElevated: 'rgba(255,255,255,0.94)',
    colorBgLayout: 'transparent',
    colorText: '#1e1b4b',
    colorTextSecondary: '#4b5563',
    colorTextPlaceholder: '#9ca3af',
    colorTextDisabled: '#9ca3af',
    borderRadius: 20,
    borderRadiusLG: 28,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    controlHeight: 42,
    controlHeightLG: 50,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    fontSize: 15,
    boxShadow: '0 4px 20px rgba(124,58,237,0.10), 0 1px 4px rgba(0,0,0,0.05)',
    // Dropdown / popup
    colorBgSpotlight: 'rgba(255,255,255,0.94)',
  },
  components: {
    Select: {
      optionSelectedBg: 'rgba(124,58,237,0.10)',
      optionActiveBg: 'rgba(124,58,237,0.06)',
      optionSelectedColor: '#7c3aed',
      selectorBg: 'rgba(255,255,255,0.80)',
    },
    Table: {
      headerBg: 'rgba(124,58,237,0.07)',
      headerColor: '#7c3aed',
      rowHoverBg: 'rgba(124,58,237,0.05)',
      borderColor: 'rgba(124,58,237,0.10)',
      bodySortBg: 'transparent',
    },
    Modal: {
      contentBg: 'rgba(255,255,255,0.92)',
      headerBg: 'transparent',
      footerBg: 'transparent',
    },
    Button: {
      primaryShadow: '0 4px 18px rgba(124,58,237,0.35)',
      borderRadiusLG: 999,
      borderRadius: 999,
      borderRadiusSM: 999,
    },
    Input: {
      activeBorderColor: '#7c3aed',
      hoverBorderColor: 'rgba(124,58,237,0.40)',
      activeShadow: '0 0 0 4px rgba(124,58,237,0.12)',
    },
    DatePicker: {
      activeBorderColor: '#7c3aed',
      hoverBorderColor: 'rgba(124,58,237,0.40)',
    },
    Pagination: {
      itemActiveBg: 'rgba(124,58,237,0.12)',
    },
    Message: {
      contentBg: 'rgba(255,255,255,0.94)',
    },
  },
};


function App() {

  /* ── iOS real-time scroll effects ── */
  useEffect(() => {
    // Inject scroll-progress bar element
    const bar = document.createElement('div');
    bar.className = 'scroll-progress-bar';
    document.body.appendChild(bar);

    const root = document.documentElement;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

      // 1. Real-time navbar blur (24px at top → 56px when scrolled)
      const blur = Math.round(24 + pct * 32);
      root.style.setProperty('--scroll-blur', `${blur}px`);

      // 2. Navbar background opacity (0.45 → 0.80)
      const opacity = (0.45 + pct * 0.35).toFixed(3);
      root.style.setProperty('--scroll-nav-opacity', opacity);

      // 3. Scroll progress bar width
      root.style.setProperty('--scroll-progress', `${(pct * 100).toFixed(1)}%`);

      // 4. Parallax factor for orbs (0 → 1)
      root.style.setProperty('--scroll-pct', pct.toFixed(3));

      // 5. Body .scrolled class for depth layers
      if (scrollY > 20) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }

      // 6. Rubber-band orb parallax — offset body::before & ::after slowly
      const orbOffsetA = (scrollY * 0.08).toFixed(1);
      const orbOffsetB = (scrollY * 0.05).toFixed(1);
      root.style.setProperty('--orb-a-offset', `${orbOffsetA}px`);
      root.style.setProperty('--orb-b-offset', `${orbOffsetB}px`);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // init

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (document.body.contains(bar)) document.body.removeChild(bar);
    };
  }, []);

  const activeTheme = antdTheme;

  return (
    <ConfigProvider theme={activeTheme}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <HomePage />
            </ProtectedRoutes>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </ConfigProvider>
  );
}

export function ProtectedRoutes(props) {
  if (localStorage.getItem("user")) {
    return props.children;
  } else {
    return <Navigate to="/login" />;
  }
}

export default App;