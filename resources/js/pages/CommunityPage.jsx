import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/apiClient';
import Loader from '../components/common/Loader';

const CATS = ['all', 'general', 'question', 'discussion', 'announcement', 'resource', 'prayer', 'testimony'];
const CAT_COLORS = {
  general: '#7A96B4', question: '#1B4F8A', discussion: '#0EA5A0',
  announcement: '#DC2626', resource: '#16A34A', prayer: '#7C3AED', testimony: '#F59E0B',
};

const EMPTY_FORM = { title: '', body: '', category: 'general', visibility: 'members' };

function timeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CommunityPage({ user }) {
  const navigate                    = useNavigate();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');
  const [page, setPage]             = useState(1);

  const fetchPosts = useCallback(async (p = 1, cat = filter, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (cat === 'mine') params.set('mine', '1');
      else if (cat !== 'all') params.set('category', cat);
      if (q.trim()) params.set('search', q.trim());
      const d = await api.get(`/community/posts?${params}`);
      // Laravel paginator wraps rows in .data.data
      const rows = d.data?.data || d.data || [];
      if (p === 1) setPosts(Array.isArray(rows) ? rows : []);
      else setPosts(prev => [...prev, ...(Array.isArray(rows) ? rows : [])]);
    } catch {}
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchPosts(1, filter, search); }, [filter]);

  const createPost = async () => {
    if (!form.title.trim() || !form.body.trim()) { setErr('Title and body are required.'); return; }
    setSaving(true); setErr('');
    try {
      await api.post('/community/posts', form);
      setCreating(false);
      setForm(EMPTY_FORM);
      fetchPosts(1, filter, search);
    } catch (e) {
      setErr(e.message || 'Failed to post. Please try again.');
    } finally { setSaving(false); }
  };

  const toggleLike = async (postId) => {
    if (!user) { navigate('/login'); return; }
    setPosts(p => p.map(post => post.id === postId
      ? { ...post, user_liked: !post.user_liked, likes_count: (post.likes_count || 0) + (post.user_liked ? -1 : 1) }
      : post));
    api.post(`/community/post/${postId}/like`).catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>

      {/* ── Gradient header ──────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '22px 24px 20px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#fff', marginBottom: 4 }}>💬 Community</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Connect, ask questions, and grow together</p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>

        {/* Search + New Post */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="dp-input"
            style={{ flex: 1, minWidth: 200, maxWidth: 340 }}
            placeholder="Search discussions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPosts(1, filter, search.trim())}
          />
          {user && (
            <button className="dp-btn dp-btn--success" onClick={() => setCreating(true)}>+ New Post</button>
          )}
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize',
                border: `1.5px solid ${filter === c ? '#16A34A' : '#D5E3F3'}`,
                background: filter === c ? '#16A34A' : '#fff',
                color: filter === c ? '#fff' : '#3D5A80',
              }}>
              {c === 'all' ? 'All Posts' : c}
            </button>
          ))}
          {user && (
            <>
              <span style={{ width: 1, height: 20, background: '#D5E3F3', margin: '0 4px' }} />
              <button onClick={() => setFilter('mine')}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  border: `1.5px solid ${filter === 'mine' ? '#2D7DD2' : '#D5E3F3'}`,
                  background: filter === 'mine' ? '#2D7DD2' : '#fff',
                  color: filter === 'mine' ? '#fff' : '#3D5A80',
                }}>
                📝 My Posts
              </button>
            </>
          )}
        </div>

        {/* Post list */}
        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#7A96B4' }}><Loader /></div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, background: '#fff', borderRadius: 16, border: '1.5px solid #E5EAF0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{filter === 'mine' ? '📝' : '💬'}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#0D1F35', marginBottom: 6 }}>
              {filter === 'mine' ? "You haven't posted yet" : 'Be the first to post!'}
            </div>
            <div style={{ color: '#7A96B4', fontSize: 14, marginBottom: 16 }}>
              {filter === 'mine' ? 'Everything you post — including anything still pending review — will show up here.' : 'Start a conversation, ask a question, or share a testimony.'}
            </div>
            {user && <button className="dp-btn dp-btn--success" onClick={() => setCreating(true)}>+ Create {filter === 'mine' ? 'a' : 'First'} Post</button>}
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <div key={post.id} className="dp-card"
                style={{ padding: 18, marginBottom: 12, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onClick={() => navigate(`/community/${post.id}`)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,31,53,.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {!!post.is_pinned && (
                        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>📌 Pinned</span>
                      )}
                      {!!post.is_featured && (
                        <span style={{ background: '#E0E7F0', color: '#1B4F8A', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>⭐ Featured</span>
                      )}
                      {filter === 'mine' && post.status !== 'approved' && (
                        <span style={{
                          background: post.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: post.status === 'rejected' ? '#991B1B' : '#92400E',
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        }}>
                          {post.status === 'rejected' ? '❌ Rejected' : '⏳ Pending Review'}
                        </span>
                      )}
                      <span style={{
                        background: `${CAT_COLORS[post.category] || '#7A96B4'}20`,
                        color: CAT_COLORS[post.category] || '#7A96B4',
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize',
                      }}>{post.category}</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#0D1F35', margin: '0 0 6px' }}>{post.title}</h3>
                    <div style={{ fontSize: 13, color: '#7A96B4', lineHeight: 1.4 }}>
                      {post.body?.slice(0, 160)}{post.body?.length > 160 ? '…' : ''}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#7A96B4' }}>
                    {post.author_name || post.author?.name || 'Member'} · {timeAgo(post.created_at)}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span
                      style={{ fontSize: 13, color: post.user_liked ? '#DC2626' : '#7A96B4', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); toggleLike(post.id); }}
                    >
                      {post.user_liked ? '❤️' : '🤍'} {post.likes_count || 0}
                    </span>
                    <span style={{ fontSize: 13, color: '#7A96B4' }}>💬 {post.comments_count || 0}</span>
                    <span style={{ fontSize: 13, color: '#7A96B4' }}>👁 {post.views || 0}</span>
                  </span>
                </div>
              </div>
            ))}

            {/* Load more */}
            {!loading && posts.length >= 20 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="dp-btn dp-btn--outline dp-btn--sm"
                  onClick={() => { const next = page + 1; setPage(next); fetchPosts(next, filter, search); }}>
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create post modal ─────────────────────────────────────────────── */}
      {creating && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setCreating(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#0D1F35', marginBottom: 18 }}>New Post</h3>

            {err && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="dp-label">Title *</label>
              <input className="dp-input" placeholder="What's on your mind?"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="dp-label">Category</label>
              <select className="dp-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['general', 'question', 'discussion', 'announcement', 'resource', 'prayer', 'testimony'].map(c => (
                  <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="dp-label">Visibility</label>
              <select className="dp-select" value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}>
                <option value="members">Enrolled students</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="dp-label">Body *</label>
              <textarea className="dp-textarea" rows={6}
                placeholder="Share your thoughts, questions, or encouragements…"
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="dp-btn dp-btn--ghost" onClick={() => { setCreating(false); setErr(''); }}>Cancel</button>
              <button className="dp-btn dp-btn--success" onClick={createPost} disabled={saving}>
                {saving ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
