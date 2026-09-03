import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect, useCallback } from 'react';
import adminService from '../services/adminService';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import Loader from '../components/common/Loader';

const EMPTY = { name: '', description: '', icon: '🏅', color: '#1B4F8A', criteria: '', course_id: '' };

export default function AdminBadgesPage({ user }) {
  const [badges, setBadges]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.badges();
      // badges() returns r.data which is the array directly
      setBadges(Array.isArray(res) ? res : (res.data || []));
    } catch {
      setAlert({ type: 'error', msg: 'Failed to load badges.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (b) => { setEditing(b); setForm({ name: b.name, description: b.description || '', icon: b.icon || '🏅', color: b.color || '#1B4F8A', criteria: b.criteria || '', course_id: b.course_id || '' }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateBadge(editing.id, form);
        setAlert({ type: 'success', msg: 'Badge updated.' });
      } else {
        await adminService.createBadge(form);
        setAlert({ type: 'success', msg: 'Badge created.' });
      }
      setModal(false);
      load();
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this badge?')) return;
    try {
      await adminService.deleteBadge(id);
      setAlert({ type: 'success', msg: 'Badge deleted.' });
      load();
    } catch {
      setAlert({ type: 'error', msg: 'Delete failed.' });
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>
      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--dp-navy)', margin: 0 }}>🏅 Badges</h2>
        <button className="dp-btn dp-btn--primary" onClick={openCreate}>+ New Badge</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {badges.map(b => (
          <div key={b.id} className="dp-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: (b.color || '#1B4F8A') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              {b.icon || '🏅'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--dp-navy)', fontSize: 15 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: 'var(--dp-gray)', marginTop: 2 }}>{b.description}</div>
              {b.criteria && <div style={{ fontSize: 11, color: 'var(--dp-sky)', marginTop: 4 }}>{b.criteria}</div>}
              <div style={{ fontSize: 11, color: 'var(--dp-gray)', marginTop: 4 }}>Awarded: {b.user_badges_count ?? 0} time(s)</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="dp-btn dp-btn--secondary" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => openEdit(b)}>Edit</button>
                <button className="dp-btn" style={{ fontSize: 12, padding: '4px 12px', background: 'var(--dp-red)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }} onClick={() => handleDelete(b.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {badges.length === 0 && <p style={{ color: 'var(--dp-gray)' }}>No badges yet.</p>}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Badge' : 'New Badge'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="dp-label">Name *</label>
            <input className="dp-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="dp-label">Description</label>
            <input className="dp-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="dp-label">Icon (emoji)</label>
              <input className="dp-input" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={{ fontSize: 22 }} />
            </div>
            <div>
              <label className="dp-label">Colour</label>
              <input type="color" className="dp-input" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ height: 42, cursor: 'pointer' }} />
            </div>
          </div>
          <div>
            <label className="dp-label">Criteria (description)</label>
            <input className="dp-input" placeholder="e.g. Complete all modules in a course" value={form.criteria} onChange={e => setForm(p => ({ ...p, criteria: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="dp-btn dp-btn--secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="dp-btn dp-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save Badge'}</button>
          </div>
        </form>
      </Modal>
      </div>
    </div>
  );
}
