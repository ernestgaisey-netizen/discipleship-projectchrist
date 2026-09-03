import { useState, useEffect } from 'react';
import mentorshipService from '../services/mentorshipService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import MessageThread from '../components/common/MessageThread';

const MEETING_MODE_LABELS = { online: 'Online', in_person: 'In Person', both: 'Online or In Person' };
// Mirrors the backend's own-engagement guard (MentorshipController::requestMentorship) —
// a live request blocks a new one, but a past rejected/completed one doesn't.
const LIVE_STATUSES = ['pending', 'approved', 'active'];

export default function MentorshipPage({ user }) {
  const [mentors, setMentors]   = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm]   = useState({ preferred_mentor_id: '', message: '', goals: '' });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab]           = useState('mentors');

  useEffect(() => {
    Promise.all([
      mentorshipService.mentors(),
      mentorshipService.myRequests().catch(() => []),
    ]).then(([m, r]) => { setMentors(m); setMyRequests(r); })
      .catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mentorshipService.request({
        preferred_mentor_id: reqForm.preferred_mentor_id || null,
        message: reqForm.message,
        goals:   reqForm.goals,
      });
      setAlert({ type: 'success', msg: 'Mentorship request submitted. You\'ll be notified when assigned.' });
      setShowRequest(false);
      setMyRequests(await mentorshipService.myRequests().catch(() => []));
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const hasLiveRequest = myRequests.some(r => LIVE_STATUSES.includes(r.status));
  // Don't list a mentor as a bookable option on their own account — this page is the
  // student-facing "browse/request" flow, not a mentor's own dashboard (that's Mentor Hub).
  const bookableMentors = mentors.filter(m => (m.user?.id ?? m.user_id) !== user?.id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '22px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#fff', marginBottom: 4 }}>🤝 Mentorship</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Connect with experienced believers who can guide your discipleship journey</p>
          </div>
          {!loading && !hasLiveRequest && (
            <button className="dp-btn dp-btn--success" onClick={() => setShowRequest(true)}>Request a Mentor</button>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      {loading ? <Loader /> : null}

      {user?.role === 'mentor' && (
        <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1B4F8A' }}>
          This page is for finding <em>your own</em> mentor. To see your mentees and their progress, go to{' '}
          <a href="/mentor" style={{ color: '#2D7DD2', fontWeight: 700 }}>Mentor Hub</a>.
        </div>
      )}

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--dp-border)', marginBottom: 28 }}>
        {[['mentors', '👥 Our Mentors'], ['my', '📋 My Mentorship']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              borderBottom: tab === key ? '2px solid var(--dp-sky)' : '2px solid transparent',
              color: tab === key ? 'var(--dp-sky)' : 'var(--dp-gray)', marginBottom: -2 }}
          >{label}</button>
        ))}
      </div>

      {tab === 'mentors' && (
        bookableMentors.length === 0
          ? <EmptyState icon="👤" title="No mentors available" subtitle="Check back soon — mentors are being added." />
          : (
            <div className="dp-grid-3">
              {bookableMentors.map(m => (
                <div key={m.id} className="dp-card">
                  <div className="dp-card__body" style={{ textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--dp-sky)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 12px' }}>
                      {m.user?.avatar_url
                        ? <img src={m.user.avatar_url} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : m.user?.name?.[0]}
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.user?.name}</div>
                    {m.expertise?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                        {m.expertise.map((s, i) => <span key={i} className="dp-badge dp-badge--blue">{s}</span>)}
                      </div>
                    )}
                    {m.bio && <p style={{ fontSize: 13, color: 'var(--dp-gray)', lineHeight: 1.6, margin: '0 0 12px', WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.bio}</p>}
                    <div style={{ fontSize: 12, color: 'var(--dp-gray)' }}>
                      {m.meeting_mode && <span>📍 {MEETING_MODE_LABELS[m.meeting_mode] || m.meeting_mode}</span>}
                    </div>
                  </div>
                  <div className="dp-card__footer">
                    <button className="dp-btn dp-btn--outline dp-btn--sm dp-btn--full"
                      disabled={hasLiveRequest}
                      title={hasLiveRequest ? 'You already have an active or pending mentorship engagement' : ''}
                      onClick={() => { setReqForm(f => ({ ...f, preferred_mentor_id: m.user?.id || '' })); setShowRequest(true); }}>
                      {hasLiveRequest ? 'Already Requested' : 'Request Mentorship'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {tab === 'my' && (
        myRequests.length === 0
          ? <EmptyState icon="🌱" title="No mentorship yet"
              subtitle="Request a mentor to begin your guided discipleship journey."
              action={<button className="dp-btn dp-btn--primary" onClick={() => setShowRequest(true)}>Request a Mentor</button>}
            />
          : (
            <div>
              {myRequests.map(r => (
                <div key={r.id} className="dp-card" style={{ marginBottom: 16 }}>
                  <div className="dp-card__body">
                    <div className="dp-flex-between">
                      <div>
                        <div style={{ fontWeight: 700 }}>{r.assigned_mentor ? `Mentor: ${r.assigned_mentor.name}` : 'Pending Assignment'}</div>
                        <div style={{ fontSize: 13, color: 'var(--dp-gray)', marginTop: 4 }}>Status: <span className={`dp-badge dp-badge--${r.status === 'active' ? 'green' : 'gray'}`}>{r.status}</span></div>
                        {r.learning_goals && <p style={{ fontSize: 13, marginTop: 8, color: '#374151' }}><strong>Goals:</strong> {r.learning_goals}</p>}
                        {r.reason && <p style={{ fontSize: 13, marginTop: 4, color: '#374151' }}><strong>Message:</strong> {r.reason}</p>}
                      </div>
                      {r.status === 'active' && (
                        <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--dp-gray)' }}>
                          Assigned {r.assigned_at ? new Date(r.assigned_at).toLocaleDateString() : ''}
                        </div>
                      )}
                    </div>
                    {r.status === 'active' && r.assigned_mentor_id && (
                      <MessageThread requestId={r.id} currentUserId={user?.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* Request modal */}
      <Modal isOpen={showRequest} onClose={() => setShowRequest(false)} title="Request a Mentor"
        footer={
          <><button className="dp-btn dp-btn--ghost" onClick={() => setShowRequest(false)}>Cancel</button>
          <button className="dp-btn dp-btn--primary" onClick={handleRequest} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Request'}</button></>
        }
      >
        <div className="dp-form-group">
          <label className="dp-label">Preferred Mentor (optional)</label>
          <select className="dp-select" value={reqForm.preferred_mentor_id}
            onChange={e => setReqForm(f => ({ ...f, preferred_mentor_id: e.target.value }))}>
            <option value="">No preference — assign me anyone</option>
            {bookableMentors.map(m => <option key={m.user?.id} value={m.user?.id}>{m.user?.name}</option>)}
          </select>
        </div>
        <div className="dp-form-group">
          <label className="dp-label">Your Goals</label>
          <textarea className="dp-textarea" rows={3} placeholder="What do you hope to grow in through this mentorship?"
            value={reqForm.goals} onChange={e => setReqForm(f => ({ ...f, goals: e.target.value }))} />
        </div>
        <div className="dp-form-group" style={{ marginBottom: 0 }}>
          <label className="dp-label">Message to Mentor (optional)</label>
          <textarea className="dp-textarea" rows={3} placeholder="Introduce yourself and share your heart…"
            value={reqForm.message} onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))} />
        </div>
      </Modal>
      </div>
    </div>
  );
}
