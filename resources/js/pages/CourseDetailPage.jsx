import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';
import progressService from '../services/progressService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import ProgressBar from '../components/common/ProgressBar';

export default function CourseDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse]     = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [alert, setAlert]       = useState(null);

  useEffect(() => {
    Promise.all([
      courseService.get(id),
      user ? progressService.courseProgress(id).catch(() => null) : Promise.resolve(null),
    ]).then(([c, p]) => {
      setCourse(c);
      setProgress(p);
    }).catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) { navigate('/login', { state: { from: `/courses/${id}` } }); return; }
    setEnrolling(true); setAlert(null);
    try {
      await enrollmentService.enroll(id);
      const [c, p] = await Promise.all([courseService.get(id), progressService.courseProgress(id).catch(() => null)]);
      setCourse(c); setProgress(p);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="dp-main"><Loader /></div>;
  if (!course)  return <div className="dp-main"><Alert type="error">Course not found.</Alert></div>;

  const enrolled   = !!course.enrollment;
  const percentage = progress?.percentage || 0;

  return (
    <div>
      {/* Course hero */}
      <div style={{ background: course.gradient || 'var(--dp-navy)', padding: '48px 24px 40px', color: 'white' }}>
        <div className="dp-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 64 }}>{course.emoji || '📖'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span className="dp-badge dp-badge--blue" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{course.level}</span>
                {course.category && <span className="dp-badge" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>{course.category}</span>}
                {course.certificate_enabled && <span className="dp-badge" style={{ background: 'rgba(217,119,6,0.3)', color: '#FCD34D' }}>🏆 Certificate</span>}
              </div>
              <h1 style={{ color: 'white', fontFamily: 'var(--font-title)', margin: '0 0 8px' }}>{course.title}</h1>
              {course.subtitle && <p style={{ opacity: 0.85, fontFamily: 'var(--font-serif)', fontSize: '1.05rem', margin: '0 0 12px' }}>{course.subtitle}</p>}
              <div style={{ display: 'flex', gap: 20, fontSize: 13, opacity: 0.8, flexWrap: 'wrap' }}>
                {course.instructor_name && <span>👤 {course.instructor_name}</span>}
                {course.duration_weeks  && <span>📅 {course.duration_weeks} weeks</span>}
                <span>📚 {course.modules?.length || 0} modules</span>
                <span>👥 {course.enrollments_count || 0} enrolled</span>
              </div>
            </div>
            <div>
              {enrolled
                ? <div style={{ textAlign: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 24px', marginBottom: 12 }}>
                      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-title)' }}>{percentage}%</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Complete</div>
                    </div>
                    <button className="dp-btn dp-btn--success" onClick={() => {
                      const next = course.modules?.find(m => !m.is_completed && !m.is_locked);
                      if (next) navigate(`/modules/${next.id}`);
                    }}>▶ Continue Learning</button>
                  </div>
                : <button className="dp-btn dp-btn--primary dp-btn--lg" onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? 'Enrolling…' : 'Enroll Free →'}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="dp-container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        <div className="dp-grid-2" style={{ gap: 40, alignItems: 'start' }}>
          {/* Left: modules list */}
          <div>
            <h2>Course Modules</h2>
            {enrolled && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dp-gray)', marginBottom: 6 }}>
                  <span>Your Progress</span>
                  <span style={{ fontWeight: 700, color: percentage === 100 ? 'var(--dp-green)' : 'var(--dp-sky)' }}>
                    {progress?.completed_modules || 0}/{progress?.total_modules || 0} modules · {percentage}%
                  </span>
                </div>
                <ProgressBar value={progress?.completed_modules || 0} max={progress?.total_modules || 1} showPercent={false} />
              </div>
            )}

            {course.modules?.map((module, idx) => (
              <div key={module.id}
                className={`dp-module-item ${module.is_locked ? 'locked' : ''} ${module.is_completed ? 'completed' : ''} ${module.is_current ? 'current' : ''}`}
                onClick={() => !module.is_locked && navigate(`/modules/${module.id}`)}
              >
                <div className="dp-module-icon">
                  {module.is_completed ? '✅' : module.is_locked ? '🔒' : module.is_current ? '▶' : `${idx + 1}`}
                </div>
                <div className="dp-module-info">
                  <div className="dp-module-title">{module.title}</div>
                  <div className="dp-module-meta">
                    {module.duration_minutes && <span>⏱ {module.duration_minutes} min</span>}
                    {module.is_locked && <span style={{ color: 'var(--dp-red)' }}> · Complete previous exam to unlock</span>}
                    {module.is_completed && <span style={{ color: 'var(--dp-green)' }}> · Completed</span>}
                  </div>
                </div>
                {!module.is_locked && <span style={{ color: 'var(--dp-sky)', fontSize: 18 }}>›</span>}
              </div>
            ))}
          </div>

          {/* Right: info */}
          <div>
            {course.description && (
              <div className="dp-card" style={{ marginBottom: 24 }}>
                <div className="dp-card__body">
                  <h3>About This Course</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}>{course.description}</p>
                </div>
              </div>
            )}
            {course.objectives?.length > 0 && (
              <div className="dp-card" style={{ marginBottom: 24 }}>
                <div className="dp-card__body">
                  <h3>What You'll Learn</h3>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {course.objectives.map((obj, i) => <li key={i} style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>{obj}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {course.target_audience?.length > 0 && (
              <div className="dp-card">
                <div className="dp-card__body">
                  <h3>Who Is This For?</h3>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {course.target_audience.map((t, i) => <li key={i} style={{ fontSize: 14, marginBottom: 6 }}>{t}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
