import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect } from 'react';
import api from '../services/apiClient';
import Loader from '../components/common/Loader';

export default function AdminCommunityPage({ user }) {
  const [stats, setStats]     = useState(null);
  const [queue, setQueue]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState('');

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const [s, q] = await Promise.all([
        api.get('/admin/community/stats').then(d => d.data || null).catch(() => null),
        api.get('/admin/community/pending').then(d => {
          // returns {posts: [...], comments: [...]}
          const posts = (d.data?.posts || []).map(p => ({ ...p, author_name: p.author?.name }));
          return posts;
        }).catch(() => []),
      ]);
      if (s) setStats(s);
      setQueue(Array.isArray(q) ? q : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const moderate = async (postId, action) => {
    setBusy(true);
    try {
      if (action === 'delete') {
        await api.delete(`/community/posts/${postId}`);
      } else {
        // backend accepts 'approve' or 'reject'; map 'hide' → 'reject'
        const backendAction = action === 'hide' ? 'reject' : action;
        await api.post(`/admin/community/posts/${postId}/moderate`, { action: backendAction });
      }
      setQueue(p => p.filter(x => x.id !== postId));
      flash(`Post ${action === 'hide' ? 'hidden' : action + 'd'}.`);
    } catch { flash('Action failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: '#0D1F35', marginBottom: 18 }}>
          Community Management
        </h2>

        {msg && (
          <div style={{ background: '#DCFCE7', color: '#15803D', padding: '10px 16px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {loading ? <Loader /> : (<>

          {/* Stat cards */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total Posts',     v: stats.total_posts,          c: '#1B4F8A' },
                { label: 'Comments',        v: stats.total_comments,       c: '#16A34A' },
                { label: 'Active Students', v: stats.active_students,      c: '#0EA5A0' },
                { label: 'Pending Reports', v: stats.pending_reports,      c: '#DC2626' },
                { label: 'Unanswered Qs',   v: stats.unanswered_questions, c: '#D97706' },
              ].map(s => (
                <div key={s.label} className="dp-card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#7A96B4', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Moderation queue */}
          <div className="dp-card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', marginBottom: 14 }}>
              🚨 Moderation Queue ({queue.length})
            </h3>

            {queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#7A96B4', fontSize: 13 }}>
                No posts pending moderation. The community is healthy!
              </div>
            ) : queue.map(p => (
              <div key={p.id} style={{ border: '1.5px solid #F0E6FF', borderRadius: 10, padding: '14px 16px', marginBottom: 10, background: '#FAFBFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0D1F35', marginBottom: 3 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: '#7A96B4' }}>
                      by {p.author_name || 'Unknown'} · {p.report_count} report{p.report_count !== 1 ? 's' : ''}
                    </div>
                    {p.body && (
                      <div style={{ fontSize: 13, color: '#3D5A80', marginTop: 6, lineHeight: 1.4 }}>
                        {p.body.slice(0, 160)}…
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button disabled={busy} onClick={() => moderate(p.id, 'approve')}
                      style={{ background: '#DCFCE7', color: '#15803D', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 12 }}>
                      ✓ Keep
                    </button>
                    <button disabled={busy} onClick={() => moderate(p.id, 'hide')}
                      style={{ background: '#FEF3C7', color: '#92400E', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 12 }}>
                      🙈 Hide
                    </button>
                    <button disabled={busy}
                      onClick={() => { if (window.confirm('Permanently delete this post?')) moderate(p.id, 'delete'); }}
                      style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 12 }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </>)}
      </div>
    </div>
  );
}
