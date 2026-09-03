import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import courseService from '../services/courseService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const TABS = [
  { key: 'overview',    label: '📊 Overview',      to: '/admin' },
  { key: 'courses',     label: '📚 Courses',        to: '/admin/courses' },
  { key: 'users',       label: '👥 Users & Roles',  to: '/admin/users' },
  { key: 'community',   label: '💬 Community',      to: '/admin/community' },
  { key: 'mentorship',  label: '🤝 Mentorship',     to: '/admin/mentorship' },
  { key: 'audit',       label: '🗒 Audit Trail',    to: '/admin/logs' },
  { key: 'analytics',   label: '📈 Analytics',      to: '/admin/analytics' },
  { key: 'badges',      label: '🏅 Badges',         to: '/admin/badges' },
];

// Shared gradient header + tab bar — used by every admin page
export function AdminHeader({ user, activeTab }) {
  const location = useLocation();
  const current  = activeTab || TABS.find(t => t.to === location.pathname)?.key || 'overview';

  return (
    <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 3 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#fff', margin: 0 }}>⚙️ Admin Console</h1>
          {user?.sub_role === 'super_admin' && (
            <span style={{ fontSize: 10, background: '#2176AE', border: '1px solid #5BAADC', color: '#fff', borderRadius: 4, padding: '3px 9px', fontWeight: 700, letterSpacing: 1 }}>
              SUPER ADMIN
            </span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 14 }}>
          Project Christ Discipleship Management Dashboard
        </p>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: 'none' }}>
          {TABS.map(t => (
            <Link key={t.key} to={t.to} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: current === t.key ? '#4ADE80' : 'rgba(255,255,255,0.6)',
                borderBottom: `2px solid ${current === t.key ? '#4ADE80' : 'transparent'}`,
                marginBottom: -1,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}>
                {t.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard overview page ───────────────────────────────────────────────────

export default function AdminDashboardPage({ user }) {
  const [stats, setStats]           = useState(null);
  const [courses, setCourses]       = useState([]);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [alert, setAlert]           = useState(null);
  const navigate                    = useNavigate();

  useEffect(() => {
    Promise.all([
      adminService.dashboard().catch(() => ({})),
      adminService.stats().catch(() => ({})),
      courseService.list().catch(() => []),
      adminService.pendingMentorshipRequests().then(d => d.data || d).catch(() => []),
    ]).then(([dash, st, crs, reqs]) => {
      setStats({ ...dash, ...st });
      setCourses(Array.isArray(crs) ? crs : (crs.data || []));
      setPendingReqs(Array.isArray(reqs) ? reqs : []);
    }).catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  }, []);

  // Derived from course list — matches original exactly
  const total        = courses.reduce((a, c) => a + (c.enrollment_count || 0), 0) || 1;
  const totalModules = courses.reduce((a, c) => a + (c.modules_count || 0), 0);

  const statCards = [
    { icon: '📚', val: courses.length,                  label: 'Total Courses',      color: '#1B4F8A', bg: '#EFF6FF' },
    { icon: '📋', val: totalModules,                    label: 'Total Modules',      color: '#16A34A', bg: '#DCFCE7' },
    { icon: '👥', val: total.toLocaleString(),          label: 'Total Students',     color: '#0EA5A0', bg: '#F0FDFA' },
    { icon: '✅', val: stats?.pass_rate ? `${stats.pass_rate}%` : '—', label: 'Platform Pass Rate', color: '#D97706', bg: '#FFFBEB' },
    { icon: '🤝', val: pendingReqs.length,              label: 'Pending Mentorship', color: '#DC2626', bg: '#FEF2F2', to: '/admin/mentorship' },
  ];

  // Exact original labels and colors
  const quickActions = [
    { label: '📚 Create New Course',          color: '#1B4F8A', to: '/admin/courses' },
    { label: '📋 Add Module',                  color: '#16A34A', to: '/admin/courses' },
    { label: '📝 Build Exam',                  color: '#2D7DD2', to: '/admin/questions' },
    { label: '📊 Export Analytics',            color: '#D97706', to: '/admin/logs' },
    { label: '📧 Send Notifications',          color: '#7C3AED', to: '/admin/exceptions' },
    { label: '🤝 Review Mentorship Requests',  color: '#DC2626', to: '/admin/mentorship' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)', display: 'flex', flexDirection: 'column' }}>
      <AdminHeader user={user} activeTab="overview" />

      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>
        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        {loading ? <Loader /> : (
          <div>
            {/* ── Stat cards ─────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 14, marginBottom: 26 }}>
              {statCards.map(s => (
                <div key={s.label}
                  onClick={s.to ? () => navigate(s.to) : undefined}
                  style={{
                    padding: 18, background: s.bg,
                    border: `1px solid ${s.color}22`,
                    borderRadius: 12, boxShadow: '0 2px 12px rgba(13,31,53,0.08)',
                    cursor: s.to ? 'pointer' : 'default',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { if (s.to) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,31,53,0.08)'; }}
                >
                  <div style={{ fontSize: 26, marginBottom: 5 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: '#7A96B4', marginTop: 2 }}>{s.label}</div>
                  {s.to && <div style={{ fontSize: 11, color: s.color, marginTop: 4, fontWeight: 600 }}>Click to review →</div>}
                </div>
              ))}
            </div>

            {/* ── Two-column: enrollment + quick actions ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

              {/* Course enrollment */}
              <div style={{ background: 'white', borderRadius: 12, padding: 22, boxShadow: '0 2px 12px rgba(13,31,53,0.08)', border: '1px solid var(--dp-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#0D1F35', marginBottom: 14 }}>📊 Course Enrollment</h3>
                {courses.length === 0
                  ? <p style={{ color: '#7A96B4', fontSize: 13 }}>No courses yet.</p>
                  : courses.map(c => (
                    <div key={c.id} style={{ marginBottom: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, color: '#0D1F35' }}>{c.emoji || '📖'} {c.title}</span>
                        <span style={{ color: '#16A34A', fontWeight: 700 }}>{(c.enrollment_count || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 7, background: '#D5E3F3', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg,#16A34A,#4ADE80)',
                          borderRadius: 4,
                          width: `${Math.round(((c.enrollment_count || 0) / total) * 100)}%`,
                          transition: 'width 0.9s ease',
                        }} />
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Quick actions */}
              <div style={{ background: 'white', borderRadius: 12, padding: 22, boxShadow: '0 2px 12px rgba(13,31,53,0.08)', border: '1px solid var(--dp-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#0D1F35', marginBottom: 14 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {quickActions.map(({ label, color, to }) => (
                    <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                      <button style={{
                        background: `${color}11`, color, border: `1px solid ${color}33`,
                        textAlign: 'left', padding: '10px 14px', fontSize: 13,
                        borderRadius: 8, cursor: 'pointer', width: '100%',
                        fontFamily: 'var(--font-body)', fontWeight: 600,
                      }}>
                        {label}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Pending mentorship ──────────────────────────────────────── */}
            {pendingReqs.length > 0 && (
              <div style={{ background: 'white', borderRadius: 12, padding: 22, border: '1.5px solid #FECACA', boxShadow: '0 2px 12px rgba(13,31,53,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#DC2626', margin: 0 }}>
                    🤝 Pending Mentorship Requests ({pendingReqs.length})
                  </h3>
                  <Link to="/admin/mentorship" style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 6,
                    border: '1.5px solid #FECACA', background: '#FEF2F2',
                    color: '#DC2626', textDecoration: 'none', fontWeight: 700,
                  }}>View All →</Link>
                </div>
                {pendingReqs.slice(0, 4).map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#FFF7F7', borderRadius: 8, marginBottom: 8, gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0D1F35' }}>
                        {r.student_name || r.student?.name || r.user?.name || 'Student'}
                      </span>
                      {(r.course_title) && (
                        <span style={{ fontSize: 12, color: '#7A96B4', marginLeft: 8 }}>{r.course_title}</span>
                      )}
                      <div style={{ fontSize: 12, color: '#3D5A80', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(r.reason || r.message)?.slice(0, 100)}
                      </div>
                    </div>
                    <Link to="/admin/mentorship" style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: '#DC2626', color: '#fff', textDecoration: 'none', fontWeight: 700, flexShrink: 0 }}>
                      Review
                    </Link>
                  </div>
                ))}
                {pendingReqs.length > 4 && (
                  <div style={{ fontSize: 12, color: '#7A96B4', textAlign: 'center', paddingTop: 4 }}>
                    +{pendingReqs.length - 4} more — <Link to="/admin/mentorship" style={{ color: '#DC2626', fontWeight: 600 }}>view all</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
