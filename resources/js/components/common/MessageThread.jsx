import { useState, useEffect, useRef } from 'react';
import mentorshipService from '../../services/mentorshipService';

// Simple async thread between a student and their mentor, scoped to one
// mentorship request. Loads on open, not real-time — reopen or resend to refresh.
export default function MessageThread({ requestId, currentUserId }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef(null);

  const load = () => {
    setLoading(true);
    mentorshipService.messages(requestId)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, open]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const msg = await mentorshipService.sendMessage(requestId, body.trim());
      setMessages(m => [...m, msg]);
      setBody('');
    } catch {
      /* keep the draft on failure so nothing typed is lost */
    } finally { setSending(false); }
  };

  if (!open) {
    return (
      <button className="dp-btn dp-btn--outline dp-btn--sm" onClick={() => setOpen(true)}>
        💬 Messages
      </button>
    );
  }

  return (
    <div style={{ border: '1.5px solid #D5E3F3', borderRadius: 10, marginTop: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F4F8FF', borderBottom: '1px solid #D5E3F3' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#3D5A80' }}>💬 Messages</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A96B4', fontSize: 13 }}>✕</button>
      </div>

      <div style={{ maxHeight: 220, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#7A96B4', padding: 10 }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#7A96B4', padding: 10 }}>No messages yet — say hello!</div>
        ) : messages.map(m => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                background: mine ? '#1B4F8A' : '#F4F8FF', color: mine ? '#fff' : '#0D1F35',
                padding: '7px 11px', borderRadius: 10, fontSize: 13, lineHeight: 1.4,
              }}>
                {m.body}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: mine ? 'right' : 'left' }}>
                {mine ? 'You' : m.sender?.name || 'Them'} · {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: '1px solid #D5E3F3' }}>
        <input className="dp-input" style={{ flex: 1, fontSize: 13 }} placeholder="Type a message…"
          value={body} onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()} />
        <button className="dp-btn dp-btn--primary dp-btn--sm" onClick={send} disabled={sending || !body.trim()}>
          {sending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
