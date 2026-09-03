import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const SEV_COLORS = { error: '#DC2626', warning: '#D97706', info: '#2D7DD2' };

export default function AdminExceptionsPage({ user }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);
  const [search, setSearch]   = useState('');
  const [severity, setSeverity] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [resolving, setResolving] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (search)   params.search   = search;
    if (severity) params.severity = severity;
    adminService.exceptionLogs(params)
      .then(d => setLogs(Array.isArray(d) ? d : (d.data || [])))
      .catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, severity]);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await adminService.resolveException(id);
      setLogs(prev => prev.filter(l => l.id !== id));
      setAlert({ type: 'success', msg: 'Exception marked as resolved.' });
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally { setResolving(null); }
  };

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
          placeholder="Search message, source…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="dp-select" style={{ width: 160 }} value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {loading ? <Loader /> : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--dp-gray)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p>No unresolved exceptions. System is clean.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map(log => (
            <div key={log.id} className="dp-card" style={{ padding: 0, borderLeft: `4px solid ${SEV_COLORS[log.severity] || '#7A96B4'}` }}>
              {/* Header row */}
              <div
                style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <span className="dp-badge" style={{ background: (SEV_COLORS[log.severity] || '#7A96B4') + '18', color: SEV_COLORS[log.severity] || '#7A96B4', flexShrink: 0 }}>
                  {log.severity || 'error'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>{log.message}</div>
                  <div style={{ fontSize: 12, color: 'var(--dp-gray)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>📁 {log.source || '—'}</span>
                    <span>🕐 {fmt(log.created_at)}</span>
                    {log.url && <span>🔗 {log.url}</span>}
                    {log.user?.name && <span>👤 {log.user.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="dp-btn dp-btn--success dp-btn--sm"
                    onClick={e => { e.stopPropagation(); handleResolve(log.id); }}
                    disabled={resolving === log.id}
                  >{resolving === log.id ? '…' : '✓ Resolve'}</button>
                  <span style={{ fontSize: 16, color: 'var(--dp-gray)', paddingTop: 2 }}>{expanded === log.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Stack trace */}
              {expanded === log.id && log.stack_trace && (
                <div style={{ borderTop: '1px solid var(--dp-border)', padding: '12px 18px', background: '#1a1a2e' }}>
                  <pre style={{ margin: 0, fontSize: 12, color: '#a8d8ea', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {log.stack_trace}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
