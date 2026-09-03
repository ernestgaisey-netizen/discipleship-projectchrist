import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

function exportCSV(data) {
  const rows = [
    ['Metric', 'Value'],
    ['Overall Pass Rate', `${data.overall_pass_rate}%`],
    ['Total Exam Attempts', data.total_attempts],
    [],
    ['Course', 'Enrollments', 'Pass Rate'],
    ...(data.course_pass_rates || []).map(c => [c.title, c.enrollments, `${c.pass_rate}%`]),
    [],
    ['Month', 'Enrollments'],
    ...(data.monthly_enrollments || []).map(m => [m.month, m.count]),
  ];
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `discipleship-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAnalyticsPage({ user }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);

  useEffect(() => {
    adminService.stats()
      .then(d => setData(d))
      .catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const maxMonthly = data ? Math.max(...(data.monthly_enrollments || []).map(m => m.count), 1) : 1;
  const maxHeat    = data ? Math.max(...(data.activity_heatmap   || []).map(h => h.count), 1) : 1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>

        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: '#0D1F35', margin: 0 }}>📈 Platform Analytics</h2>
          {data && (
            <button className="dp-btn dp-btn--ghost dp-btn--sm" onClick={() => exportCSV(data)}>
              📥 Export CSV
            </button>
          )}
        </div>

        {loading ? <Loader /> : !data ? null : (
          <>
            {/* Top stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 26 }}>
              {[
                { icon: '🎯', label: 'Overall Pass Rate', value: `${data.overall_pass_rate}%`, color: '#16A34A', bg: '#DCFCE7' },
                { icon: '📝', label: 'Total Exam Attempts', value: (data.total_attempts || 0).toLocaleString(), color: '#1B4F8A', bg: '#EFF6FF' },
                { icon: '📚', label: 'Courses', value: (data.course_pass_rates || []).length, color: '#0EA5A0', bg: '#F0FDFA' },
                ...(data.users_by_role || []).map(r => ({
                  icon: r.role === 'admin' ? '⚙️' : r.role === 'mentor' ? '🤝' : '👤',
                  label: r.role.charAt(0).toUpperCase() + r.role.slice(1) + 's',
                  value: r.count,
                  color: '#D97706',
                  bg: '#FFFBEB',
                })),
              ].map(s => (
                <div key={s.label} className="dp-card" style={{ padding: '16px 18px', background: s.bg, border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#7A96B4', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>

              {/* Exam Pass Rates */}
              <div className="dp-card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', marginBottom: 16 }}>📈 Exam Pass Rates by Course</h3>
                {(data.course_pass_rates || []).length === 0
                  ? <p style={{ color: 'var(--dp-gray)', fontSize: 13 }}>No exam attempts yet.</p>
                  : (data.course_pass_rates || []).map(c => (
                    <div key={c.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: '#2a3a50', fontWeight: 500 }}>{c.emoji} {c.title}</span>
                        <span style={{ fontWeight: 700, color: c.pass_rate >= 70 ? '#16A34A' : c.pass_rate >= 50 ? '#D97706' : '#DC2626' }}>
                          {c.pass_rate}%
                        </span>
                      </div>
                      <div style={{ height: 8, background: '#EEF4FB', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4, transition: 'width .6s',
                          width: `${c.pass_rate}%`,
                          background: c.pass_rate >= 70
                            ? 'linear-gradient(90deg,#16A34A,#4ADE80)'
                            : c.pass_rate >= 50
                              ? 'linear-gradient(90deg,#D97706,#F59E0B)'
                              : 'linear-gradient(90deg,#DC2626,#F87171)',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#7A96B4', marginTop: 3 }}>
                        {c.enrollments} enrolled
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Monthly Enrollments */}
              <div className="dp-card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', marginBottom: 16 }}>📅 Monthly Enrollments</h3>
                {(data.monthly_enrollments || []).map(m => (
                  <div key={m.month} style={{ marginBottom: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#7A96B4', width: 30, flexShrink: 0 }}>{m.month}</span>
                    <div style={{ flex: 1, height: 22, background: '#F4F8FF', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 5, display: 'flex', alignItems: 'center', paddingLeft: 8,
                        background: 'linear-gradient(90deg,#1B4F8A,#2D7DD2)',
                        width: `${Math.round((m.count / maxMonthly) * 100)}%`,
                        minWidth: m.count > 0 ? 24 : 0,
                        transition: 'width .5s',
                      }}>
                        {m.count > 0 && <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{m.count}</span>}
                      </div>
                    </div>
                    {m.count === 0 && <span style={{ fontSize: 11, color: '#CBD5E1' }}>0</span>}
                  </div>
                ))}
              </div>

              {/* Activity Heatmap */}
              <div className="dp-card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', marginBottom: 14 }}>🗓 Activity Heatmap (last 35 days)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                  {(data.activity_heatmap || []).map((h, i) => {
                    const intensity = maxHeat > 0 ? h.count / maxHeat : 0;
                    const alpha     = Math.max(0.08, intensity * 0.92);
                    return (
                      <div key={i}
                        title={`${h.date}: ${h.count} activities`}
                        style={{ height: 22, borderRadius: 4, background: `rgba(22,163,74,${alpha})`, cursor: 'default' }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 10, fontSize: 11, color: '#7A96B4' }}>
                  <span>Less</span>
                  {[0.08, 0.3, 0.5, 0.7, 0.92].map(o => (
                    <div key={o} style={{ width: 15, height: 15, borderRadius: 3, background: `rgba(22,163,74,${o})` }} />
                  ))}
                  <span>More</span>
                </div>
                <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 8 }}>
                  Activities = enrollments + exam submissions
                </p>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
