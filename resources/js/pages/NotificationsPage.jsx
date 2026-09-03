import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const TYPE_ICONS = {
  success: '✅', warning: '⚠️', error: '❌',
  info: 'ℹ️', announcement: '📢', default: 'ℹ️',
};

const AUDIENCES = [
  { value: 'all',      label: 'All Users' },
  { value: 'students', label: 'Students Only' },
  { value: 'admins',   label: 'Admins Only' },
  { value: 'mentors',  label: 'Mentors Only' },
];

export default function NotificationsPage({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alert, setAlert]                 = useState(null);

  // Compose form (admin only)
  const [compose, setCompose]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [form, setForm]           = useState({ title: '', body: '', type: 'info', audience: 'all' });

  const isAdmin = ['admin', 'pastor'].includes(user?.role);

  const load = () => {
    setLoading(true);
    notificationService.list()
      .then(data => setNotifications(Array.isArray(data) ? data : (data?.data || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    await notificationService.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const remove = async (id) => {
    await notificationService.remove(id).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setAlert({ type: 'error', msg: 'Title and message are required.' });
      return;
    }
    setSending(true);
    try {
      await notificationService.broadcast(form);
      setAlert({ type: 'success', msg: `📢 Notification sent to ${AUDIENCES.find(a => a.value === form.audience)?.label.toLowerCase()}.` });
      setForm({ title: '', body: '', type: 'info', audience: 'all' });
      setCompose(false);
      setTimeout(load, 800); // reload after brief delay so broadcast shows
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to send notification.' });
    } finally { setSending(false); }
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '22px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#fff', margin: 0 }}>🔔 Notifications</h1>
            {unread > 0 && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4, display: 'block' }}>{unread} unread</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {unread > 0 && <button className="dp-btn dp-btn--outline dp-btn--sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={markAllRead}>✓ Mark all read</button>}
            {isAdmin && <button className={`dp-btn dp-btn--sm ${compose ? 'dp-btn--secondary' : 'dp-btn--success'}`} onClick={() => setCompose(p => !p)}>{compose ? '✕ Cancel' : '📢 Send Notification'}</button>}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px' }}>

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* ── Admin compose panel ───────────────────────────────────────────── */}
      {isAdmin && compose && (
        <div style={{
          background: 'linear-gradient(135deg, #0D1F35, #1B4F8A)',
          borderRadius: 14, padding: 24, marginBottom: 24,
          boxShadow: '0 4px 20px rgba(13,31,53,0.2)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', color: 'white', marginBottom: 20, fontSize: 16 }}>
            📢 Send Notification to Users
          </h3>
          <form onSubmit={handleSend}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {/* Audience */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Audience</label>
                <select
                  value={form.audience}
                  onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, fontFamily: 'var(--font-body)' }}>
                  {AUDIENCES.map(a => <option key={a.value} value={a.value} style={{ background: '#1B4F8A' }}>{a.label}</option>)}
                </select>
              </div>
              {/* Type */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, fontFamily: 'var(--font-body)' }}>
                  {[['info', 'ℹ️ Info'], ['success', '✅ Success'], ['warning', '⚠️ Warning'], ['announcement', '📢 Announcement']].map(([v, l]) => (
                    <option key={v} value={v} style={{ background: '#1B4F8A' }}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notification title…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
              />
            </div>

            {/* Body */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Message *</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Write your message here…"
                rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCompose(false)}
                style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Cancel
              </button>
              <button type="submit" disabled={sending}
                style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#16A34A,#0D8A3A)', color: '#fff', cursor: sending ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Sending…' : '📤 Send Now'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Notification list ─────────────────────────────────────────────── */}
      {loading ? <Loader /> : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'white', borderRadius: 14, border: '1px solid var(--dp-border)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--dp-navy)', marginBottom: 6 }}>No notifications</h3>
          <p style={{ color: 'var(--dp-text3)', margin: 0 }}>You're all caught up!</p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                background: n.is_read ? 'white' : 'rgba(45,125,210,0.04)',
                border: `1px solid ${n.is_read ? 'var(--dp-border)' : 'rgba(45,125,210,0.22)'}`,
                borderRadius: 10, padding: '14px 18px', marginBottom: 10,
                display: 'flex', alignItems: 'flex-start', gap: 12,
                cursor: n.is_read ? 'default' : 'pointer',
                transition: 'all 0.2s',
                borderLeft: n.is_read ? undefined : '3px solid var(--dp-sky)',
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>
                {TYPE_ICONS[n.type] || TYPE_ICONS.default}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 14, color: 'var(--dp-navy)', marginBottom: 2 }}>
                  {n.title}
                  {!n.is_read && (
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--dp-sky)', marginLeft: 8, verticalAlign: 'middle' }} />
                  )}
                </div>
                {n.body && (
                  <div style={{ fontSize: 13, color: 'var(--dp-text2)', lineHeight: 1.55 }}>{n.body}</div>
                )}
                <div style={{ fontSize: 11, color: 'var(--dp-text3)', marginTop: 6 }}>
                  {new Date(n.created_at).toLocaleString()}
                  {!n.user_id && (
                    <span style={{ marginLeft: 10, fontSize: 10, background: '#EFF6FF', color: '#2D7DD2', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                      Broadcast
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); remove(n.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text3)', fontSize: 18, opacity: 0.5, padding: 0, flexShrink: 0, lineHeight: 1 }}
                title="Delete"
              >×</button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
