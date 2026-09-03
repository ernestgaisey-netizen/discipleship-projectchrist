import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const B = { border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)', borderRadius: 7 };

export default function AdminMentorshipPage({ user }) {
  const [stats, setStats]               = useState(null);
  const [requests, setRequests]         = useState([]);
  const [allMentors, setAllMentors]     = useState([]);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [sessions, setSessions]         = useState([]);
  const [sessFilter, setSessFilter]     = useState('');
  const [loading, setLoading]           = useState(true);
  const [busy, setBusy]                 = useState(false);
  const [alert, setAlert]               = useState(null);
  const [msg, setMsg]                   = useState('');
  const [msgErr, setMsgErr]             = useState(false);
  const [mtab, setMtab]                 = useState('overview');
  const [pickedMentor, setPickedMentor] = useState({});
  const [adminNotes, setAdminNotes]     = useState({});

  const flash = (text, err = false) => {
    setMsg(text); setMsgErr(err);
    setTimeout(() => setMsg(''), 3500);
  };

  const loadSessions = async () => {
    adminService.allSessions()
      .then(d => setSessions(Array.isArray(d) ? d : (d.data || [])))
      .catch(() => {});
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, mentors] = await Promise.all([
        adminService.allMentorshipRequests().then(d => d.data || d).catch(() => []),
        adminService.allMentors().then(d => d.data || d).catch(() => []),
      ]);
      const reqArr    = Array.isArray(reqs)    ? reqs    : [];
      const mentorArr = Array.isArray(mentors) ? mentors : [];

      setRequests(reqArr.filter(r => ['pending', 'approved'].includes(r.status)));
      setAllMentors(mentorArr.filter(m => m.approval_status === 'approved' || !m.approval_status));
      setPendingMentors(mentorArr.filter(m => m.approval_status === 'pending'));
      setStats({
        total_mentors:      mentorArr.filter(m => m.approval_status === 'approved' || !m.approval_status).length,
        available_mentors:  mentorArr.filter(m => m.availability_status === 'available').length,
        active_mentorships: reqArr.filter(r => r.status === 'assigned').length,
        completed_sessions: reqArr.filter(r => r.status === 'completed').length,
        avg_mentor_rating:  null,
      });
    } catch { flash('Failed to load data', true); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); loadSessions(); }, []);

  const approveMentor = async (userId, action) => {
    setBusy(true);
    const ok = await adminService.approveMentor(userId, action).catch(() => null);
    ok ? flash(`Mentor ${action}d successfully`) : flash('Action failed', true);
    setBusy(false);
    loadData();
  };

  const handleRequest = async (reqId, action, mentorId = null) => {
    setBusy(true);
    try {
      if (action === 'assign' && mentorId) {
        await adminService.assignMentor(reqId, mentorId);
        flash('Mentor assigned successfully');
      } else if (action === 'approved') {
        await adminService.approveRequest(reqId, adminNotes[reqId]);
        flash('Request approved');
      } else {
        await adminService.rejectRequest(reqId);
        flash('Request rejected');
      }
      setRequests(p => p.filter(x => x.id !== reqId));
      setPickedMentor(p => { const n = { ...p }; delete n[reqId]; return n; });
      setAdminNotes(p => { const n = { ...p }; delete n[reqId]; return n; });
    } catch { flash('Action failed — please try again', true); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: '#0D1F35', marginBottom: 18 }}>
          Mentorship Management
        </h2>

        {msg && (
          <div style={{ background: msgErr ? '#FEE2E2' : '#DCFCE7', color: msgErr ? '#991B1B' : '#15803D', padding: '10px 16px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {/* Internal tab bar */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid var(--dp-border)', gap: 2, marginBottom: 20, overflowX: 'auto' }}>
          {[
            { k: 'overview',  l: '📊 Overview' },
            { k: 'requests',  l: `📋 Requests (${requests.length})` },
            { k: 'sessions',  l: `📅 All Sessions (${sessions.length})` },
            { k: 'mentors',   l: `🤝 Pending Mentors (${pendingMentors.length})` },
          ].map(({ k, l }) => (
            <div key={k} onClick={() => setMtab(k)}
              style={{
                padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
                color: mtab === k ? 'var(--dp-navy)' : 'var(--dp-text3)',
                borderBottom: `2px solid ${mtab === k ? 'var(--dp-green)' : 'transparent'}`,
                marginBottom: -1.5, transition: 'all 0.2s',
              }}>
              {l}
            </div>
          ))}
        </div>

        {loading ? <Loader /> : (<>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {mtab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
                {[
                  { label: 'Active Mentors',     v: stats?.total_mentors ?? 0,      c: '#1B4F8A', click: null },
                  { label: 'Available',          v: stats?.available_mentors ?? 0,  c: '#16A34A', click: null },
                  { label: 'Pending Requests',   v: requests.filter(r => r.status === 'pending').length,  c: '#DC2626', click: () => setMtab('requests') },
                  { label: 'Awaiting Mentor',    v: requests.filter(r => r.status === 'approved').length, c: '#D97706', click: () => setMtab('requests') },
                  { label: 'Active Mentorships', v: stats?.active_mentorships ?? 0, c: '#0EA5A0', click: null },
                  { label: 'Completed Sessions', v: stats?.completed_sessions ?? 0, c: '#7C3AED', click: null },
                  { label: 'Avg Rating',         v: stats?.avg_mentor_rating ? `${stats.avg_mentor_rating}★` : '—', c: '#F59E0B', click: null },
                ].map(s => (
                  <div key={s.label} onClick={s.click || undefined}
                    style={{ background: 'white', borderRadius: 12, padding: 16, textAlign: 'center', cursor: s.click ? 'pointer' : 'default', border: '1px solid var(--dp-border)', boxShadow: '0 2px 12px rgba(13,31,53,.06)', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => { if (s.click) e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,31,53,.06)'; }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: '#7A96B4', marginTop: 3 }}>{s.label}</div>
                    {s.click && <div style={{ fontSize: 10, color: s.c, marginTop: 3, fontWeight: 600 }}>click to review →</div>}
                  </div>
                ))}
              </div>

              {requests.length > 0 ? (
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1.5px solid #FECACA', boxShadow: '0 2px 12px rgba(13,31,53,.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#DC2626', margin: 0 }}>
                      🤝 Requests Needing Action ({requests.length})
                    </h3>
                    <button onClick={() => setMtab('requests')}
                      style={{ ...B, fontSize: 12, padding: '5px 12px', background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA' }}>
                      Manage All →
                    </button>
                  </div>
                  {requests.map(r => {
                    const isPending = r.status === 'pending';
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: isPending ? '#FFF7F7' : '#EFF6FF', borderRadius: 8, marginBottom: 8, gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#0D1F35' }}>{r.student_name || r.student?.name || 'Student'}</span>
                            {r.requester_is_mentor && (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: '#F3E8FF', color: '#7C3AED' }} title="This requester is themselves an approved mentor">
                                🤝 Mentor
                              </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: isPending ? '#FEF3C7' : '#DBEAFE', color: isPending ? '#92400E' : '#1E40AF' }}>
                              {isPending ? '⏳ Pending' : '✓ Approved — needs mentor'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#3D5A80', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(r.reason || r.message)?.slice(0, 120)}
                          </div>
                        </div>
                        <button onClick={() => setMtab('requests')}
                          style={{ ...B, fontSize: 11, padding: '5px 11px', background: isPending ? '#DC2626' : '#2D7DD2', color: '#fff', flexShrink: 0 }}>
                          {isPending ? 'Review' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: 'white', borderRadius: 12, padding: 22, textAlign: 'center', color: '#7A96B4', fontSize: 13, border: '1px solid var(--dp-border)' }}>
                  ✅ No pending requests — all caught up!
                </div>
              )}
            </div>
          )}

          {/* ── REQUESTS ─────────────────────────────────────────────────── */}
          {mtab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 12, padding: 28, textAlign: 'center', color: '#7A96B4', fontSize: 13, border: '1px solid var(--dp-border)' }}>
                  No pending or approved requests
                </div>
              ) : requests.map(r => {
                const isPending = r.status === 'pending';
                const selMentor = pickedMentor[r.id] || '';
                return (
                  <div key={r.id} style={{ border: `1.5px solid ${isPending ? '#FDE68A' : '#BFDBFE'}`, borderRadius: 10, padding: '16px 18px', marginBottom: 12, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#0D1F35' }}>{r.student_name || r.student?.name || 'Student'}</span>
                          {r.requester_is_mentor && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#F3E8FF', color: '#7C3AED' }} title="This requester is themselves an approved mentor">
                              🤝 Mentor
                            </span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isPending ? '#FEF3C7' : '#DBEAFE', color: isPending ? '#92400E' : '#1E40AF' }}>
                            {isPending ? '⏳ Pending' : '✓ Approved — awaiting mentor'}
                          </span>
                        </div>
                        {r.course_title && <div style={{ fontSize: 12, color: '#7A96B4', marginBottom: 2 }}>Course: {r.course_title}</div>}
                        {r.preferred_mentor_name && <div style={{ fontSize: 12, color: '#7A96B4', marginBottom: 2 }}>Preferred mentor: {r.preferred_mentor_name}</div>}
                        <div style={{ fontSize: 13, color: '#3D5A80', marginTop: 6, lineHeight: 1.5 }}>
                          {(r.reason || r.message)?.slice(0, 250)}{(r.reason || r.message)?.length > 250 ? '…' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Assign mentor */}
                    <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#3D5A80', display: 'block', marginBottom: 6 }}>Assign a Mentor</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={selMentor}
                          onChange={e => setPickedMentor(p => ({ ...p, [r.id]: e.target.value }))}
                          style={{ flex: 1, minWidth: 180, padding: '7px 10px', border: '1.5px solid #D5E3F3', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-body)' }}>
                          <option value="">— Select a mentor —</option>
                          {allMentors.map(m => (
                            <option key={m.id || m.user_id} value={m.id || m.user_id}>
                              {m.name}{m.expertise ? ` · ${m.expertise}` : ''}
                            </option>
                          ))}
                          {allMentors.length === 0 && <option disabled>No approved mentors yet</option>}
                        </select>
                        <button disabled={busy || !selMentor} onClick={() => handleRequest(r.id, 'assign', selMentor)}
                          style={{ ...B, padding: '7px 14px', background: selMentor ? '#2D7DD2' : '#D5E3F3', color: selMentor ? '#fff' : '#7A96B4', cursor: selMentor && !busy ? 'pointer' : 'not-allowed', fontSize: 12 }}>
                          🔗 Assign Mentor
                        </button>
                      </div>
                      <textarea
                        placeholder="Admin notes (optional — sent to student)"
                        value={adminNotes[r.id] || ''}
                        onChange={e => setAdminNotes(p => ({ ...p, [r.id]: e.target.value }))}
                        rows={2}
                        style={{ width: '100%', marginTop: 8, padding: '7px 10px', border: '1.5px solid #D5E3F3', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {isPending && (
                        <button disabled={busy} onClick={() => handleRequest(r.id, 'approved')}
                          style={{ ...B, background: '#DCFCE7', color: '#15803D', padding: '7px 14px', fontSize: 12 }}>
                          ✓ Approve Only
                        </button>
                      )}
                      <button disabled={busy} onClick={() => handleRequest(r.id, 'rejected')}
                        style={{ ...B, background: '#FEE2E2', color: '#991B1B', padding: '7px 14px', fontSize: 12 }}>
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ALL SESSIONS ─────────────────────────────────────────────── */}
          {mtab === 'sessions' && (
            <div>
              {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

              {/* Filter bar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                <select className="dp-select" style={{ width: 160 }} value={sessFilter}
                  onChange={e => { setSessFilter(e.target.value); }}>
                  <option value="">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="dp-btn dp-btn--ghost dp-btn--sm"
                  onClick={() => loadSessions()}>↻ Refresh</button>
                <span style={{ fontSize: 13, color: 'var(--dp-gray)', marginLeft: 'auto' }}>
                  {(sessFilter
                    ? sessions.filter(s => s.status === sessFilter)
                    : sessions
                  ).length} session(s)
                </span>
              </div>

              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total',     v: sessions.length,                                      c: '#1B4F8A', bg: '#EFF6FF' },
                  { label: 'Scheduled', v: sessions.filter(s => s.status === 'scheduled').length, c: '#D97706', bg: '#FFFBEB' },
                  { label: 'Completed', v: sessions.filter(s => s.status === 'completed').length, c: '#16A34A', bg: '#F0FDF4' },
                  { label: 'Cancelled', v: sessions.filter(s => s.status === 'cancelled').length, c: '#DC2626', bg: '#FEF2F2' },
                ].map(s => (
                  <div key={s.label} className="dp-card"
                    style={{ padding: '14px 16px', background: s.bg, border: `1px solid ${s.c}22`, textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => setSessFilter(s.label === 'Total' ? '' : s.label.toLowerCase())}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: '#7A96B4', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Session rows */}
              {(() => {
                const visible = sessFilter
                  ? sessions.filter(s => s.status === sessFilter)
                  : sessions;
                if (visible.length === 0) return (
                  <div style={{ textAlign: 'center', padding: 48, color: 'var(--dp-gray)', fontSize: 13 }}>
                    No sessions found.
                  </div>
                );
                return visible.map(s => {
                  const statusColor = s.status === 'completed' ? '#16A34A'
                    : s.status === 'scheduled' ? '#D97706'
                    : '#DC2626';
                  const statusBg = s.status === 'completed' ? '#DCFCE7'
                    : s.status === 'scheduled' ? '#FFFBEB'
                    : '#FEE2E2';
                  return (
                    <div key={s.id} className="dp-card" style={{ padding: '16px 18px', marginBottom: 10, borderLeft: `4px solid ${statusColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0D1F35', marginBottom: 4 }}>{s.title}</div>
                          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--dp-gray)', flexWrap: 'wrap', marginBottom: 4 }}>
                            <span>👤 Mentor: <strong style={{ color: '#0D1F35' }}>{s.mentor?.name ?? `#${s.mentor_id}`}</strong></span>
                            {s.student && s.student.id !== s.mentor_id && (
                              <span>🎓 Student: <strong style={{ color: '#0D1F35' }}>{s.student.name}</strong></span>
                            )}
                            <span>📅 {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}</span>
                          </div>
                          {s.description && (
                            <div style={{ fontSize: 13, color: '#3D5A80', marginTop: 4, lineHeight: 1.5 }}>
                              {s.description.slice(0, 160)}{s.description.length > 160 ? '…' : ''}
                            </div>
                          )}
                          {s.meeting_link && (
                            <a href={s.meeting_link} target="_blank" rel="noreferrer"
                              style={{ fontSize: 12, color: 'var(--dp-sky)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                              🔗 {s.meeting_link.slice(0, 50)}{s.meeting_link.length > 50 ? '…' : ''}
                            </a>
                          )}
                          {s.notes && (
                            <div style={{ fontSize: 12, color: '#7A96B4', marginTop: 6, fontStyle: 'italic' }}>
                              Notes: {s.notes.slice(0, 120)}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: statusBg, color: statusColor, flexShrink: 0, textTransform: 'capitalize' }}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* ── PENDING MENTORS ───────────────────────────────────────────── */}
          {mtab === 'mentors' && (
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid var(--dp-border)', boxShadow: '0 2px 12px rgba(13,31,53,.06)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', marginBottom: 14 }}>Mentor Applications</h3>
              {pendingMentors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#7A96B4', fontSize: 13 }}>
                  No pending mentor applications
                </div>
              ) : pendingMentors.map(m => (
                <div key={m.user_id || m.id} style={{ border: '1.5px solid #E5EAF0', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0D1F35' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: '#7A96B4' }}>{m.email}</div>
                      {m.expertise && <div style={{ fontSize: 13, color: '#3D5A80', marginTop: 4 }}>Expertise: {m.expertise}</div>}
                      {m.bio && <div style={{ fontSize: 13, color: '#3D5A80', marginTop: 4, lineHeight: 1.4 }}>{m.bio?.slice(0, 160)}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
                      <button disabled={busy} onClick={() => approveMentor(m.user_id || m.id, 'approve')}
                        style={{ ...B, background: '#DCFCE7', color: '#15803D', padding: '7px 13px', fontSize: 12 }}>✓ Approve</button>
                      <button disabled={busy} onClick={() => approveMentor(m.user_id || m.id, 'reject')}
                        style={{ ...B, background: '#FEE2E2', color: '#991B1B', padding: '7px 13px', fontSize: 12 }}>✗ Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </>)}
      </div>
    </div>
  );
}
