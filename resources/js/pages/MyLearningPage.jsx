import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import progressService from '../services/progressService';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const HEADER = { background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' };
const INNER  = { maxWidth: 1180, margin: '0 auto', padding: '22px 24px 20px' };
const H1     = { fontFamily: 'var(--font-serif)', fontSize: 24, color: '#fff', marginBottom: 4 };
const SUB    = { color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 };
const BODY   = { maxWidth: 1180, margin: '0 auto', padding: '24px' };

export default function MyLearningPage({ user }) {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressService.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const enrollments = data?.enrollments || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <div style={HEADER}>
        <div style={INNER}>
          <h1 style={H1}>📚 My Learning</h1>
          <p style={SUB}>Track your discipleship progress across all enrolled courses</p>
        </div>
      </div>
      <div style={BODY}>
        {loading ? <Loader /> : (
          <>
            <div className="dp-stat-bar" style={{ marginBottom: 36 }}>
              {[
                { num: data?.enrolled_courses  || 0, label: 'Courses Enrolled' },
                { num: data?.completed_courses || 0, label: 'Courses Completed' },
                { num: data?.modules_completed || 0, label: 'Modules Done' },
                { num: (user?.streak_days || 0) + ' days', label: 'Learning Streak' },
              ].map(s => (
                <div key={s.label} className="dp-stat">
                  <div className="dp-stat__num">{s.num}</div>
                  <div className="dp-stat__label">{s.label}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--dp-navy)', marginBottom: 18 }}>My Courses</h2>
            {enrollments.length === 0 ? (
              <EmptyState icon="📚" title="No courses yet"
                subtitle="Browse our discipleship courses and enroll to start your journey."
                action={<Link to="/courses" className="dp-btn dp-btn--primary">Browse Courses</Link>}
              />
            ) : (
              <div className="dp-grid-3">
                {enrollments.map(e => (
                  <div key={e.id} className="dp-card" onClick={() => navigate(`/courses/${e.course_id}`)}
                    style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
                    <div className="dp-card__hero" style={{ background: e.course?.gradient || 'var(--dp-navy)', height: 100 }}>
                      <span style={{ fontSize: 40 }}>{e.course?.emoji || '📖'}</span>
                    </div>
                    <div className="dp-card__body">
                      <h3 className="dp-card__title">{e.course?.title}</h3>
                      {e.completed_at
                        ? <span className="dp-badge dp-badge--green">🏆 Completed</span>
                        : <CourseProgress completed={e.completed_modules} total={e.total_modules} percentage={e.progress_percentage} />
                      }
                    </div>
                    <div className="dp-card__footer">
                      <button className="dp-btn dp-btn--primary dp-btn--sm dp-btn--full"
                        onClick={ev => { ev.stopPropagation(); navigate(`/courses/${e.course_id}`); }}>
                        {e.completed_at ? 'Review Course' : '▶ Continue'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CourseProgress({ completed = 0, total = 0, percentage = 0 }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dp-gray)', marginBottom: 5 }}>
        <span>Progress</span>
        <span style={{ fontWeight: 700, color: percentage === 100 ? 'var(--dp-green)' : 'var(--dp-sky)' }}>
          {completed}/{total} modules · {percentage}%
        </span>
      </div>
      <div className="dp-progress">
        <div className="dp-progress__bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
