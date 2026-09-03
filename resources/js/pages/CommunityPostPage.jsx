import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/apiClient';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const CAT_COLORS = {
  general: '#7A96B4', question: '#1B4F8A', discussion: '#0EA5A0',
  announcement: '#DC2626', resource: '#16A34A', prayer: '#7C3AED',
  testimonial: '#F59E0B', testimony: '#F59E0B',
};

function timeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CommunityPostPage({ user }) {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [post, setPost]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    api.get(`/community/posts/${id}`)
      .then(d => {
        const p = d.data;
        setPost(p);
        setLiked(!!p.user_liked);
        setLikeCount(p.likes_count ?? p.like_count ?? 0);
      })
      .catch(e => setAlert({ type: 'error', msg: e.message || 'Post not found.' }))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleLike = () => {
    if (!user) { navigate('/login'); return; }
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
    api.post(`/community/post/${id}/like`).catch(() => {});
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/community/posts/${id}/comments`, { body: comment });
      const newComment = res.data;
      setPost(p => ({ ...p, comments: [...(p.comments || []), newComment] }));
      setComment('');
      if (newComment.status === 'pending') {
        setAlert({ type: 'success', msg: 'Comment submitted — it\'ll be visible to others once approved.' });
      }
    } catch (e) {
      setAlert({ type: 'error', msg: e.message || 'Failed to post comment.' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader /></div>;

  if (!post) return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px' }}>
      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}
      <Link to="/community" className="dp-btn dp-btn--ghost dp-btn--sm">← Back to Community</Link>
    </div>
  );

  const comments = post.comments || [];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 64px' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--dp-gray)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to="/community" style={{ color: 'var(--dp-sky)' }}>Community</Link>
        <span>›</span>
        <span style={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</span>
      </div>

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Post card */}
      <div className="dp-card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        {/* Category + meta */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          {post.is_pinned && <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>📌 Pinned</span>}
          <span style={{ background: `${CAT_COLORS[post.category] || '#7A96B4'}20`, color: CAT_COLORS[post.category] || '#7A96B4', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize' }}>
            {post.category}
          </span>
          <span style={{ fontSize: 12, color: 'var(--dp-gray)', marginLeft: 'auto' }}>
            {post.author?.name || post.author_name || 'Member'} · {timeAgo(post.created_at)}
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--dp-navy)', marginBottom: 16 }}>{post.title}</h1>

        <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: '#2D3748', whiteSpace: 'pre-wrap' }}>
          {post.body}
        </div>

        {/* Reactions */}
        <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--dp-border)', alignItems: 'center' }}>
          <button onClick={toggleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: liked ? '#DC2626' : 'var(--dp-gray)', fontWeight: liked ? 700 : 400 }}>
            {liked ? '❤️' : '🤍'} {likeCount}
          </button>
          <span style={{ fontSize: 14, color: 'var(--dp-gray)' }}>💬 {comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Comments */}
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--dp-navy)', marginBottom: 14 }}>
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {comments.length === 0 && (
        <div style={{ background: '#fff', border: '1.5px solid var(--dp-border)', borderRadius: 12, padding: '24px', textAlign: 'center', color: 'var(--dp-gray)', marginBottom: 20 }}>
          No comments yet. Be the first to respond!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {comments.map((c, i) => (
          <div key={c.id || i} className="dp-card" style={{ padding: '14px 18px', opacity: c.status === 'pending' ? 0.75 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dp-navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.author?.name || 'Member'}
                {c.status === 'pending' && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '2px 8px', borderRadius: 10 }}>
                    ⏳ Pending review
                  </span>
                )}
              </span>
              <span style={{ fontSize: 12, color: 'var(--dp-gray)' }}>{timeAgo(c.created_at)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#2D3748', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{c.body}</p>
          </div>
        ))}
      </div>

      {/* Add comment */}
      {user ? (
        <div className="dp-card" style={{ padding: '18px 20px' }}>
          <label className="dp-label" style={{ marginBottom: 8, display: 'block' }}>Add a Comment</label>
          <textarea
            className="dp-textarea"
            rows={4}
            placeholder="Share your thoughts or encouragement…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ resize: 'vertical', marginBottom: 10 }}
          />
          <button className="dp-btn dp-btn--primary" onClick={submitComment} disabled={submitting || !comment.trim()}>
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      ) : (
        <div className="dp-card" style={{ padding: 20, textAlign: 'center', color: 'var(--dp-gray)' }}>
          <Link to="/login" className="dp-btn dp-btn--success">Sign In to Comment</Link>
        </div>
      )}
    </div>
  );
}
