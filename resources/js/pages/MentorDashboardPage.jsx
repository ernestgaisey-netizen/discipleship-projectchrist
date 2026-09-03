import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/apiClient';
import Loader from '../components/common/Loader';
import MessageThread from '../components/common/MessageThread';

const TABS = [
  { k: 'overview',  l: '📊 Overview' },
  { k: 'mentees',   l: '👥 My Mentees' },
  { k: 'sessions',  l: '📅 Sessions' },
  { k: 'profile',   l: '🧑 My Profile' },
  { k: 'schedule',  l: '➕ Schedule Session' },
];

export default function MentorDashboardPage({ user }) {
  const [mtab, setMtab]               = useState('overview');
  const [sessions, setSessions]       = useState([]);
  const [mentees, setMentees]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [profile, setProfile]         = useState({ bio: '', expertise: '', availability_status: 'available', meeting_mode: 'online', meeting_link: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: '', description: '', scheduled_at: '', meeting_link: '' });
  const [sessionErr, setSessionErr]   = useState('');
  const [sessionSaving, setSessionSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'mentor') return;
    Promise.all([
      api.get('/mentorship/sessions').then(d => d.data || []).catch(() => []),
      api.get(`/mentors`).then(d => {
        const me = (d.data || []).find(m => m.id === user.id || m.user_id === user.id);
        return me || null;
      }).catch(() => null),
      api.get('/mentorship/my-mentees').then(d => d.data || []).catch(() => []),
    ]).then(([s, p, mn]) => {
      setSessions(s);
      if (p) setProfile({ bio: p.bio || '', expertise: p.expertise || '', availability_status: p.availability_status || 'available', meeting_mode: p.meeting_mode || 'online', meeting_link: p.meeting_link || '' });
      setMentees(mn);
      setLoading(false);
    });
  }, [user]);

  const saveProfile = async () => {
    await api.put('/mentorship/my-profile', profile).catch(() => {});
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const createSession = async () => {
    if (!sessionForm.title.trim() || !sessionForm.scheduled_at) {
      setSessionErr('Title and date/time are required.'); return;
    }
    setSessionSaving(true); setSessionErr('');
    try {
      await api.post('/mentorship/sessions', sessionForm);
      setSessionForm({ title: '', description: '', scheduled_at: '', meeting_link: '' });
      const s = await api.get('/mentorship/sessions').then(d => d.data || []).catch(() => []);
      setSessions(s);
    } catch (e) {
      setSessionErr(e.message || 'Could not create session.');
    } finally { setSessionSaving(false); }
  };

  const completeSession = async (id) => {
    await api.post(`/mentorship/sessions/${id}/complete`).catch(() => {});
    const s = await api.get('/mentorship/sessions').then(d => d.data || []).catch(() => []);
    setSessions(s);
  };

  if (!user || user.role !== 'mentor') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>Mentor access required</h2>
          <Link to="/dashboard" className="dp-btn dp-btn--primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const upcoming = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.scheduled_at || s.start_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at || a.start_at) - new Date(b.scheduled_at || b.start_at));
  const completed = sessions.filter(s => s.status === 'completed');
  const overdue   = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at || s.start_at) < new Date());

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      {/* Gradient header */}
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '22px 24px 0' }}>
          <div style={{ marginBottom: 3 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#fff', margin: 0 }}>🤝 Mentor Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>Welcome back, {user.name}</p>
          </div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: 'none', marginTop: 14 }}>
            {TABS.map(t => (
              <div key={t.k} onClick={() => setMtab(t.k)}
                style={{ padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', color: mtab === t.k ? '#4ADE80' : 'rgba(255,255,255,0.6)', borderBottom: `2px solid ${mtab === t.k ? '#4ADE80' : 'transparent'}`, marginBottom: -1, transition: 'all 0.2s' }}>
                {t.l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 24px' }}>
        {loading ? <Loader /> : (<>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {mtab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 26 }}>
                {[
                  { label: 'Total Sessions', v: sessions.length,   c: '#1B4F8A' },
                  { label: 'Upcoming',       v: upcoming.length,   c: '#16A34A' },
                  { label: 'Completed',      v: completed.length,  c: '#0EA5A0' },
                ].map(s => (
                  <div key={s.label} className="dp-card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: '#7A96B4', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {overdue.length > 0 && (
                <div className="dp-card" style={{ padding: '14px 20px', marginBottom: 18, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                    ⚠️ {overdue.length} session{overdue.length > 1 ? 's' : ''} past its scheduled time and not marked complete
                  </div>
                  <div style={{ fontSize: 12, color: '#7A96B4' }}>
                    Mark them complete from the <span style={{ color: 'var(--dp-sky)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setMtab('sessions')}>Sessions tab →</span>
                  </div>
                </div>
              )}

              <div className="dp-card" style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', marginBottom: 12 }}>Upcoming Sessions</h3>
                {upcoming.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#7A96B4', fontSize: 13 }}>
                    No upcoming sessions. <span style={{ color: 'var(--dp-sky)', cursor: 'pointer' }} onClick={() => setMtab('schedule')}>Schedule one →</span>
                  </div>
                ) : upcoming.slice(0, 5).map(s => (
                  <div key={s.id} style={{ borderBottom: '1px solid var(--dp-border)', paddingBottom: 10, marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0D1F35' }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#7A96B4' }}>{new Date(s.scheduled_at || s.start_at).toLocaleString()}</div>
                    {s.meeting_link && <a href={s.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--dp-sky)' }}>🔗 Join Meeting</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MY MENTEES ───────────────────────────────────────────────── */}
          {mtab === 'mentees' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#0D1F35', marginBottom: 18 }}>My Mentees</h2>
              {mentees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#7A96B4' }}>No mentees assigned yet.</div>
              ) : mentees.map(m => (
                <div key={m.request_id} className="dp-card" style={{ padding: 20, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0D1F35' }}>{m.student_name}</div>
                      {m.assigned_at && <div style={{ fontSize: 12, color: '#7A96B4' }}>Mentoring since {new Date(m.assigned_at).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  {m.goals && (
                    <div style={{ fontSize: 13, color: '#3D5A80', background: '#F4F8FF', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                      <strong>Goals:</strong> {m.goals}
                    </div>
                  )}
                  {m.courses.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#7A96B4' }}>Not enrolled in any course yet.</div>
                  ) : m.courses.map(c => (
                    <div key={c.course_id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>{c.course_emoji} {c.course_title}</span>
                        <span style={{ fontWeight: 700, color: c.is_completed ? '#16A34A' : '#1B4F8A' }}>
                          {c.is_completed ? '✅ Completed' : `${c.completed_modules}/${c.total_modules} modules · ${c.percentage}%`}
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#E5EAF0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.percentage}%`, background: c.is_completed ? '#16A34A' : 'linear-gradient(90deg,#1B4F8A,#2D7DD2)', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                  <MessageThread requestId={m.request_id} currentUserId={user?.id} />
                </div>
              ))}
            </div>
          )}

          {/* ── SESSIONS ─────────────────────────────────────────────────── */}
          {mtab === 'sessions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#0D1F35', margin: 0 }}>All Sessions</h2>
                <button className="dp-btn dp-btn--primary dp-btn--sm" onClick={() => setMtab('schedule')}>+ Schedule Session</button>
              </div>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#7A96B4' }}>No sessions yet.</div>
              ) : sessions.map(s => (
                <div key={s.id} className="dp-card" style={{ padding: '16px 18px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0D1F35', marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: '#7A96B4' }}>{s.student_name || s.mentee_name || '(Group)'} · {new Date(s.scheduled_at || s.start_at).toLocaleString()}</div>
                      {s.description && <div style={{ fontSize: 13, color: '#3D5A80', marginTop: 4 }}>{s.description}</div>}
                      {s.meeting_link && <a href={s.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--dp-sky)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>🔗 Join</a>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: s.status === 'scheduled' ? '#DBEAFE' : s.status === 'completed' ? '#DCFCE7' : '#F0F4F8', color: s.status === 'scheduled' ? '#1D4ED8' : s.status === 'completed' ? '#15803D' : '#7A96B4', textTransform: 'capitalize' }}>
                        {s.status}
                      </span>
                      {s.status === 'scheduled' && (
                        <button className="dp-btn dp-btn--sm" onClick={() => completeSession(s.id)}
                          style={{ background: '#16A34A', color: '#fff', border: 'none' }}>
                          ✓ Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MY PROFILE ───────────────────────────────────────────────── */}
          {mtab === 'profile' && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#0D1F35', marginBottom: 18 }}>My Mentor Profile</h2>
              {profileSaved && <div style={{ background: '#DCFCE7', color: '#15803D', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>✅ Profile saved!</div>}

              {[['Bio', 'bio', 'textarea'], ['Areas of Expertise', 'expertise', 'text']].map(([label, key, type]) => (
                <div key={key} className="dp-form-group">
                  <label className="dp-label">{label}</label>
                  {type === 'textarea'
                    ? <textarea className="dp-textarea" rows={4} value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={`${label}…`} />
                    : <input className="dp-input" value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={`e.g. Bible study, prayer, discipleship`} />
                  }
                </div>
              ))}

              <div className="dp-form-group">
                <label className="dp-label">Availability</label>
                <select className="dp-select" value={profile.availability_status} onChange={e => setProfile(p => ({ ...p, availability_status: e.target.value }))}>
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="dp-form-group">
                <label className="dp-label">Meeting Mode</label>
                <select className="dp-select" value={profile.meeting_mode} onChange={e => setProfile(p => ({ ...p, meeting_mode: e.target.value }))}>
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="dp-form-group">
                <label className="dp-label">Meeting Link</label>
                <input className="dp-input" value={profile.meeting_link} onChange={e => setProfile(p => ({ ...p, meeting_link: e.target.value }))} placeholder="https://meet.google.com/…" />
              </div>
              <button className="dp-btn dp-btn--primary" onClick={saveProfile}>Save Profile</button>
            </div>
          )}

          {/* ── SCHEDULE SESSION ─────────────────────────────────────────── */}
          {mtab === 'schedule' && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#0D1F35', marginBottom: 18 }}>Schedule a Session</h2>
              {sessionErr && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{sessionErr}</div>}

              <div className="dp-form-group">
                <label className="dp-label">Session Title *</label>
                <input className="dp-input" value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 1 Check-in" />
              </div>
              <div className="dp-form-group">
                <label className="dp-label">Description</label>
                <textarea className="dp-textarea" rows={3} value={sessionForm.description} onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="dp-form-group">
                <label className="dp-label">Date &amp; Time *</label>
                <input className="dp-input" type="datetime-local" value={sessionForm.scheduled_at} onChange={e => setSessionForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <div className="dp-form-group">
                <label className="dp-label">Meeting Link</label>
                <input className="dp-input" value={sessionForm.meeting_link} onChange={e => setSessionForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/…" />
              </div>
              <button className="dp-btn dp-btn--primary" onClick={createSession} disabled={sessionSaving}>
                {sessionSaving ? 'Scheduling…' : '📅 Schedule Session'}
              </button>
            </div>
          )}

        </>)}
      </div>
    </div>
  );
}
