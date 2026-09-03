import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const LEVELS = ['All', 'beginner', 'intermediate', 'advanced'];

export default function CoursesPage({ user }) {
  const navigate              = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [alert, setAlert]     = useState(null);
  const [search, setSearch]     = useState('');
  const [level, setLevel]       = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    courseService.list()
      .then(data => setCourses(Array.isArray(data) ? data : (data?.data || [])))
      .catch(e  => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (e, courseId) => {
    e.stopPropagation();
    if (!user) { navigate('/login', { state: { from: `/courses/${courseId}` } }); return; }
    setEnrolling(courseId); setAlert(null);
    try {
      await enrollmentService.enroll(courseId);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_enrolled: true } : c));
      setAlert({ type: 'success', msg: 'Enrolled! Start learning now.' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    } finally { setEnrolling(null); }
  };

  // Filter courses by search + level
  const filtered = courses.filter(c => {
    const matchLevel  = level === 'All' || c.level === level;
    const q           = search.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q);
    return matchLevel && matchSearch;
  });

  // Gradient for each level — falls back to course's own gradient or navy
  const cardGrad = (c) => c.gradient || c.grad || (
    c.level === 'beginner'     ? 'linear-gradient(135deg,#0D1F35,#1B4F8A)' :
    c.level === 'intermediate' ? 'linear-gradient(135deg,#1A0533,#6B21A8)' :
                                  'linear-gradient(135deg,#0F766E,#0EA5A0)'
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>

      {/* ── Gradient page header ─────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', padding: '36px 24px 52px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px,4vw,34px)', color: '#fff', marginBottom: 10 }}>
            Discipleship Courses
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>
            Structured learning tracks to grow your faith and equip you for Kingdom service
          </p>
        </div>
      </div>

      {/* ── Card grid — floats up into the header ────────────────────────── */}
      <div style={{ maxWidth: 1220, margin: '-18px auto 0', padding: '0 24px 48px' }}>

        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        {/* Search toggle — icon button, expands on click */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: showFilter ? 12 : 24 }}>
          <button
            onClick={() => { setShowFilter(p => !p); if (showFilter) { setSearch(''); setLevel('All'); } }}
            style={{
              background: showFilter ? 'var(--dp-navy)' : 'white',
              color: showFilter ? 'white' : 'var(--dp-navy)',
              border: '1.5px solid var(--dp-border)',
              borderRadius: 10, width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, boxShadow: '0 2px 8px rgba(13,31,53,.08)',
              transition: 'all 0.2s',
            }}
            title={showFilter ? 'Close search' : 'Search & filter'}
          >
            {showFilter ? '✕' : '🔍'}
          </button>
        </div>

        {/* Expandable filter panel */}
        {showFilter && (
          <div style={{
            background: 'white', borderRadius: 12, padding: '16px 18px',
            marginBottom: 24, border: '1px solid var(--dp-border)',
            boxShadow: '0 4px 16px rgba(13,31,53,.08)',
            display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <input
              className="dp-input"
              style={{ flex: 1, minWidth: 200 }}
              placeholder="Search courses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`dp-btn dp-btn--sm ${level === l ? 'dp-btn--secondary' : 'dp-btn--outline'}`}
                  style={{ textTransform: l !== 'All' ? 'capitalize' : undefined }}
                >{l}</button>
              ))}
            </div>
            {(search || level !== 'All') && (
              <span style={{ fontSize: 12, color: 'var(--dp-green)', fontWeight: 600 }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ paddingTop: 60 }}><Loader /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--dp-text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--dp-navy)' }}>
              {courses.length === 0 ? 'No courses yet' : 'No courses match your search'}
            </h3>
            <p>{courses.length === 0 ? 'Check back soon — courses are being added.' : 'Try a different keyword or level filter.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 22 }}>
            {filtered.map(c => {
              const grad       = cardGrad(c);
              const isEnrolled = c.is_enrolled;
              const prog       = c.progress || 0;

              return (
                <div key={c.id}
                  className="dp-card"
                  style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,31,53,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* Colored card header — emoji + badge + title + subtitle */}
                  <div style={{ background: grad, padding: '26px 22px', textAlign: 'center', position: 'relative', minHeight: 130, overflow: 'hidden' }}>
                    {c.thumbnail_url && (
                      <img src={`/uploads/public/${c.thumbnail_url}`} alt=""
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: 52, marginBottom: 9, filter: c.thumbnail_url ? 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' : 'none' }}>
                        {c.emoji || '📖'}
                      </div>
                      <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'capitalize', marginBottom: 7 }}>
                        {c.level}
                      </span>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: '#fff', marginBottom: 5, textShadow: '0 1px 4px rgba(0,0,0,.3)' }}>
                        {c.title}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                        {c.subtitle || c.sub || ''}
                      </p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px 18px' }}>
                    <p style={{ fontSize: 14, color: '#3D5A80', lineHeight: 1.65, marginBottom: 12,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description || c.desc || ''}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#7A96B4', marginBottom: 12, flexWrap: 'wrap' }}>
                      {c.duration_weeks && <span>📅 {c.duration_weeks} weeks</span>}
                      <span>📋 {c.modules_count || 0} modules</span>
                      <span>👥 {(c.enrollment_count || c.enrollments_count || 0).toLocaleString()}</span>
                    </div>

                    {/* Progress bar for enrolled */}
                    {isEnrolled && prog > 0 && (
                      <div style={{ marginBottom: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: '#7A96B4' }}>Progress</span>
                          <span style={{ color: 'var(--dp-green)', fontWeight: 700 }}>{prog}%</span>
                        </div>
                        <div style={{ height: 7, background: '#D5E3F3', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg,#16A34A,#4ADE80)', borderRadius: 4, width: `${prog}%`, transition: 'width 0.9s ease' }} />
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="dp-btn dp-btn--secondary"
                        style={{ flex: 1, padding: 10, fontSize: 13 }}
                        onClick={e => { e.stopPropagation(); navigate(`/courses/${c.id}`); }}
                      >
                        {isEnrolled ? '▶ Continue' : '🖼 View Course'}
                      </button>
                      {!isEnrolled && (
                        <button
                          className="dp-btn dp-btn--outline"
                          style={{ flex: 1, padding: 10, fontSize: 13 }}
                          onClick={e => handleEnroll(e, c.id)}
                          disabled={enrolling === c.id}
                        >
                          {enrolling === c.id ? 'Enrolling…' : '+ Enroll'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
