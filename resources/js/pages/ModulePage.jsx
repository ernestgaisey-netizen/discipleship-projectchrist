import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import courseService from '../services/courseService';
import progressService from '../services/progressService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

export default function ModulePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [module, setModule]         = useState(null);
  const [course, setCourse]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState(false);
  const [alert, setAlert]           = useState(null);
  const [notes, setNotes]           = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showNotes, setShowNotes]   = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    courseService.getModule(id)
      .then(async (mod) => {
        setModule(mod);
        progressService.start(id).catch(() => {});
        const cid = mod.course_id || mod.course?.id;
        if (cid) {
          const c = await courseService.get(cid).catch(() => null);
          if (c) setCourse(c);
        }
      })
      .catch(e => setAlert({ type: 'error', msg: e.message || 'Module not found.' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNotes = useCallback(async () => {
    try {
      await progressService.saveNotes(id, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {}
  }, [id, notes]);

  const handleGoToExam = () => {
    // Modules with exams: do NOT pre-mark as complete here.
    // The ExamGradingService marks the module complete only when the student PASSES.
    // Pre-marking would unlock the next module even on exam failure.
    navigate(`/exam/${id}`);
  };

  const handleCompleteNoExam = async () => {
    // Only for modules without an exam — mark complete immediately.
    setCompleting(true);
    try {
      await progressService.complete(id, Math.round((Date.now() - startRef.current) / 1000));
      setModule(m => ({ ...m, progress: { status: 'completed' } }));
      setAlert({ type: 'success', msg: '✅ Module marked as complete!' });
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally { setCompleting(false); }
  };

  if (loading) return <div className="dp-main"><Loader /></div>;
  if (!module && alert) return (
    <div className="dp-main" style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
      <Alert type="error">{alert.msg}</Alert>
      <Link to="/courses" className="dp-btn dp-btn--ghost dp-btn--sm" style={{ marginTop: 16 }}>← Browse Courses</Link>
    </div>
  );
  if (!module) return null;

  const allMods        = course?.modules || [];
  const courseGrad     = course?.gradient || 'linear-gradient(135deg,#0D1F35,#1B4F8A)';
  const isDone         = module.progress?.status === 'completed';
  const hasExam        = module.has_exam;
  const hasSidebar     = allMods.length > 0;
  const completedCount = allMods.filter(m => m.is_completed).length;
  const progressPct    = allMods.length > 0 ? Math.round((completedCount / allMods.length) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#EEF4FB' }}>
      <div className="dp-module-layout" style={{
        maxWidth: 1200, margin: '0 auto', padding: '22px 20px',
        display: 'grid',
        gridTemplateColumns: hasSidebar ? '260px 1fr' : '1fr',
        gap: 22, alignItems: 'start',
      }}>

        {/* ── Sidebar ── */}
        {hasSidebar && (
          <div className="dp-card dp-module-sidebar" style={{ padding: 18, position: 'sticky', top: 78 }}>
            <Link to={`/courses/${course?.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7A96B4', fontSize: 13, marginBottom: 14, textDecoration: 'none' }}>
              ← {course?.title}
            </Link>

            {/* Overall course progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7A96B4', marginBottom: 5 }}>
                <span>Course Progress</span>
                <span style={{ fontWeight: 700, color: progressPct === 100 ? '#16A34A' : '#1B4F8A' }}>
                  {completedCount}/{allMods.length} modules
                </span>
              </div>
              <div style={{ height: 6, background: '#E5EAF0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, transition: 'width .5s',
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? 'linear-gradient(90deg,#16A34A,#4ADE80)'
                    : 'linear-gradient(90deg,#1B4F8A,#2D7DD2)',
                }} />
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: '#0D1F35', marginBottom: 10 }}>Course Modules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {allMods.map(m => {
                const active = m.id === module.id;
                const done   = m.is_completed;
                const locked = m.is_locked;
                return (
                  <div key={m.id}
                    onClick={() => !locked && navigate(`/modules/${m.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '9px 11px', borderRadius: 9,
                      cursor: locked ? 'default' : 'pointer',
                      background: active
                        ? 'linear-gradient(135deg,#0D1F35,#1B4F8A)'
                        : done ? '#F0FDF4' : locked ? '#F9FAFB' : '#F4F8FF',
                      border: `1.5px solid ${active ? 'transparent' : done ? '#BBF7D0' : '#E5EAF0'}`,
                      transition: 'background .15s',
                    }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>
                      {done ? '✅' : active ? '▶' : locked ? '🔒' : '○'}
                    </span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 1,
                        color: active ? 'rgba(255,255,255,.6)' : done ? '#16A34A' : '#7A96B4' }}>
                        MOD {m.order_index || m.order}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3,
                        color: active ? '#fff' : done ? '#166534' : '#0D1F35' }}>
                        {m.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div>
          {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

          {/* Gradient module header */}
          <div className="dp-card" style={{ padding: '18px 22px', marginBottom: 18, background: courseGrad, color: '#fff', border: 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .65, marginBottom: 3, letterSpacing: .6 }}>
              MODULE {module.order_index || module.order} OF {allMods.length || '—'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8, color: '#fff' }}>{module.title}</h1>
            <div style={{ display: 'flex', gap: 14, fontSize: 13, opacity: .8, flexWrap: 'wrap', alignItems: 'center' }}>
              {module.duration_minutes && <span>⏱ {module.duration_minutes} min</span>}
              {course && <span>📍 {course.title}</span>}
              {isDone && (
                <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10 }}>
                  ✅ Completed
                </span>
              )}
            </div>
          </div>

          {/* KEY SCRIPTURES — dark header card, refs as flowing text */}
          {module.scripture_refs?.length > 0 && (
            <div className="dp-scripture-card">
              <div className="dp-scripture-card__header">📖 KEY SCRIPTURES</div>
              <div className="dp-scripture-card__body">
                {module.scripture_refs.join('; ')}.
              </div>
            </div>
          )}

          {/* Video */}
          {module.video_url && (
            <div style={{ marginBottom: 18, borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
              <iframe src={module.video_url} width="100%" height="100%" allowFullScreen title={module.title} style={{ display: 'block', border: 'none' }} />
            </div>
          )}

          {/* HTML content — .dp-content provides prose styling for h2/h3/p/ul/blockquote */}
          {module.content_html && (
            <div className="dp-card" style={{ padding: '28px 30px', marginBottom: 18 }}>
              <div className="dp-content" dangerouslySetInnerHTML={{ __html: module.content_html }} />
            </div>
          )}

          {/* Material */}
          {module.material_path && (
            <div className="dp-card" style={{ padding: '14px 18px', marginBottom: 18 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>📎 Study Material</h3>
              <a href={`/api/v1/materials/${module.material_path.split('/').pop()}`}
                className="dp-btn dp-btn--outline dp-btn--sm" download>
                Download Material
              </a>
            </div>
          )}

          {/* Notes */}
          <div className="dp-card" style={{ padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showNotes ? 14 : 0 }}
              onClick={() => setShowNotes(p => !p)}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', margin: 0 }}>📝 My Notes</h3>
              <span style={{ color: '#7A96B4', fontSize: 13 }}>{showNotes ? '▲ Hide' : '▼ Show'}</span>
            </div>
            {showNotes && (
              <div>
                <textarea rows={5}
                  placeholder="Write your personal notes, reflections, or key insights from this module…"
                  value={notes} onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D5E3F3', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.65 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}>
                  <button className="dp-btn dp-btn--sm" onClick={handleSaveNotes}
                    style={{ background: '#F59E0B', color: '#fff', border: 'none' }}>
                    💾 Save Notes
                  </button>
                  {notesSaved && <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✅ Saved!</span>}
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', gap: 11, justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 8 }}>
            <Link to={`/courses/${course?.id || module.course_id}`} className="dp-btn dp-btn--ghost dp-btn--sm">
              ← Back to Course
            </Link>

            {hasExam ? (
              /* Module has an exam — navigate to it; grader marks module complete on pass */
              <button className="dp-btn dp-btn--success" style={{ padding: '12px 26px', fontSize: 15 }}
                onClick={handleGoToExam}>
                {isDone ? '🔄 Retake Exam' : '📝 Take Module Exam →'}
              </button>
            ) : (
              /* No exam — mark complete directly */
              isDone
                ? <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 700, alignSelf: 'center' }}>✅ Module Completed</span>
                : <button className="dp-btn dp-btn--success" style={{ padding: '12px 26px', fontSize: 15 }}
                    onClick={handleCompleteNoExam} disabled={completing}>
                    {completing ? 'Saving…' : '✅ Mark Complete'}
                  </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
