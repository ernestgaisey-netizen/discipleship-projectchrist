import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

export default function Navbar({ user, onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [unread, setUnread]     = useState(0);
  const [menu, setMenu]         = useState(false);       // desktop user dropdown
  const [mobileOpen, setMobileOpen] = useState(false);  // mobile drawer
  const drawerRef = useRef(null);

  useEffect(() => {
    if (user) notificationService.unreadCount().then(setUnread).catch(() => {});
  }, [user, location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); setMenu(false); }, [location.pathname]);

  // Close mobile drawer on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await authService.logout();
    onLogout?.();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NAV_LINKS = [
    { to: '/courses',     label: 'Courses',     always: true },
    { to: '/my-learning', label: 'My Learning',  auth: true },
    { to: '/community',   label: 'Community',    always: true },
    { to: '/mentorship',  label: 'Mentorship',   auth: true },
    { to: '/mentor',      label: 'Mentor Hub',   role: 'mentor' },
    { to: '/admin',       label: 'Admin',        role: ['admin','pastor'] },
  ].filter(l => {
    if (l.role) return Array.isArray(l.role) ? l.role.includes(user?.role) : user?.role === l.role;
    if (l.auth) return !!user;
    return true;
  });

  return (
    <>
      <nav style={{
        background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)',
        boxShadow: '0 2px 20px rgba(13,31,53,.3)',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', padding: '0 16px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Brand */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <img src="/images/project-christ-logo.png" alt="Project Christ"
              style={{ width: 52, height: 44, objectFit: 'contain', display: 'block' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14, color: 'white', lineHeight: 1.1 }}>Project Christ</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>CHRIST OUR MESSAGE</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="dp-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} className={`dp-nav__link ${isActive(l.to) ? 'active' : ''}`}>{l.label}</Link>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="dp-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {user ? (
              <>
                <button className="dp-notif-btn" onClick={() => navigate('/notifications')} title="Notifications">
                  🔔
                  {unread > 0 && <span className="dp-notif-dot" />}
                </button>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenu(!menu)}
                    style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600 }}>
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                      : <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--dp-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{user.name?.[0]}</span>
                    }
                    {user.name?.split(' ')[0]} ▾
                  </button>
                  {menu && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 200, zIndex: 300 }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dp-border)', fontSize: 12, color: 'var(--dp-gray)' }}>{user.email}</div>
                      {[
                        { label: '👤 Profile', to: '/profile' },
                        { label: '📚 My Courses', to: '/my-learning' },
                        { label: '🏆 Certificates', to: '/certificates' },
                      ].map(({ label, to }) => (
                        <Link key={to} to={to} onClick={() => setMenu(false)}
                          style={{ display: 'block', padding: '11px 16px', color: 'var(--dp-navy)', fontSize: 14, textDecoration: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--dp-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >{label}</Link>
                      ))}
                      <div style={{ borderTop: '1px solid var(--dp-border)' }}>
                        <button onClick={handleLogout} style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', color: 'var(--dp-red)', fontSize: 14, textAlign: 'left', cursor: 'pointer' }}>
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="dp-btn dp-btn--success dp-btn--sm" style={{ marginLeft: 6 }}>Sign In</Link>
            )}
          </div>

          {/* Mobile: notification bell + hamburger */}
          <div className="dp-nav-mobile" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            {user && (
              <button className="dp-notif-btn" onClick={() => navigate('/notifications')} title="Notifications">
                🔔
                {unread > 0 && <span className="dp-notif-dot" />}
              </button>
            )}
            <button onClick={() => setMobileOpen(o => !o)}
              aria-label="Open navigation menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'white', fontSize: 22, lineHeight: 1, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 250 }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div ref={drawerRef} style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 280,
        background: 'white', zIndex: 300, boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Drawer header */}
        <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/images/project-christ-logo.png" alt="" style={{ width: 36, height: 30, objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-title)', color: 'white', fontSize: 13, fontWeight: 700 }}>Project Christ</span>
          </div>
          <button onClick={() => setMobileOpen(false)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* User pill */}
        {user && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--dp-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--dp-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'white', fontWeight: 700, flexShrink: 0 }}>
              {user.name?.[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--dp-navy)' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--dp-gray)' }}>{user.email}</div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <div style={{ flex: 1, padding: '8px 0' }}>
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}
              style={{
                display: 'flex', alignItems: 'center', padding: '14px 20px', color: isActive(l.to) ? 'var(--dp-sky)' : 'var(--dp-navy)',
                textDecoration: 'none', fontSize: 15, fontWeight: isActive(l.to) ? 700 : 500,
                background: isActive(l.to) ? 'var(--dp-light)' : 'transparent',
                borderLeft: isActive(l.to) ? '3px solid var(--dp-sky)' : '3px solid transparent',
              }}>
              {l.label}
            </Link>
          ))}

          {user && (
            <>
              <div style={{ height: 1, background: 'var(--dp-border)', margin: '8px 20px' }} />
              {[
                { to: '/profile',       label: '👤 My Profile' },
                { to: '/my-learning',   label: '📚 My Courses' },
                { to: '/certificates',  label: '🏆 Certificates' },
                { to: '/notifications', label: `🔔 Notifications${unread > 0 ? ` (${unread})` : ''}` },
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  style={{ display: 'flex', alignItems: 'center', padding: '13px 20px', color: 'var(--dp-navy)', textDecoration: 'none', fontSize: 14 }}>
                  {label}
                </Link>
              ))}
            </>
          )}

          {!user && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/login"    className="dp-btn dp-btn--primary dp-btn--full">Sign In</Link>
              <Link to="/register" className="dp-btn dp-btn--outline dp-btn--full">Create Account</Link>
            </div>
          )}
        </div>

        {/* Sign out */}
        {user && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--dp-border)' }}>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '13px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: 'var(--dp-red)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              🚪 Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
