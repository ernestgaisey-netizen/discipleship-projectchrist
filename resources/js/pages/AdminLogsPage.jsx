import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const SEV_COLORS = {
  info:     '#2D7DD2',
  warning:  '#D97706',
  critical: '#DC2626',
};

export default function AdminLogsPage({ user }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);
  const [search, setSearch]   = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback((reset = true) => {
    const p = page;
    setLoading(true);
    const params = { page: reset ? 1 : p, per_page: 50 };
    if (search)   params.search   = search;
    if (severity) params.severity = severity;

    adminService.auditLogs(params)
      .then(d => {
        const rows = Array.isArray(d) ? d : (d.data || []);
        setLogs(reset ? rows : prev => [...prev, ...rows]);
        setHasMore(rows.length === 50);
        if (reset) setPage(1);
      })
      .catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  }, [search, severity, page]);

  useEffect(() => { load(true); }, [search, severity]);

  const fmt = (ts) => ts ? new Date(ts).toLocaleString() : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="dp-input" style={{ flex: 1, minWidth: 200 }}
          placeholder="Search action, user, description…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="dp-select" style={{ width: 160 }} value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button className="dp-btn dp-btn--ghost dp-btn--sm" onClick={() => load(true)}>Refresh</button>
      </div>

      {/* Table */}
      <div className="dp-card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="dp-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Severity', 'Action', 'User', 'Description', 'IP', 'Time'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', background: 'var(--dp-light)', fontSize: 12, fontWeight: 700, color: 'var(--dp-gray)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0
              ? <tr><td colSpan={6} style={{ padding: 32 }}><Loader /></td></tr>
              : logs.length === 0
                ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--dp-gray)' }}>No audit entries found.</td></tr>
                : logs.map((log, i) => (
                  <tr key={log.id || i} style={{ borderTop: '1px solid var(--dp-border)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="dp-badge" style={{ background: (SEV_COLORS[log.severity] || '#7A96B4') + '18', color: SEV_COLORS[log.severity] || '#7A96B4' }}>
                        {log.severity || 'info'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{log.action}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{log.user?.name || log.user_id || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--dp-gray)', maxWidth: 320 }}>{log.description || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--dp-gray)', fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--dp-gray)', whiteSpace: 'nowrap' }}>{fmt(log.created_at)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="dp-btn dp-btn--ghost dp-btn--sm" onClick={() => { setPage(p => p + 1); load(false); }} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
