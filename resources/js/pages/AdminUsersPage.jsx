import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';

export default function AdminUsersPage({ user }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]   = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = (params = {}) => {
    setLoading(true);
    adminService.users(params)
      .then(d => setUsers(d.data || []))
      .catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const p = {};
    if (search)     p.search = search;
    if (roleFilter) p.role   = roleFilter;
    const t = setTimeout(() => load(p), 350);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete "${u.name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await adminService.deactivateUser(user.id);
      } else {
        await adminService.reactivateUser(user.id);
      }
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u));
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminService.updateUser(editUser.id, {
        name: editUser.name, role: editUser.role, sub_role: editUser.sub_role,
      });
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...updated } : u));
      setEditUser(null);
      setAlert({ type: 'success', msg: 'User updated.' });
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="dp-flex dp-gap" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="dp-input" style={{ maxWidth: 280 }} placeholder="🔍 Search users…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="dp-select" style={{ maxWidth: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {['student', 'admin', 'pastor', 'mentor'].map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="dp-table-wrap">
          <table className="dp-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--dp-sky)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{u.name?.[0]}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--dp-gray)' }}>{u.email}</td>
                  <td><span className="dp-badge dp-badge--blue" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                  <td>
                    <span className={`dp-badge dp-badge--${u.is_active ? 'green' : 'red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--dp-gray)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="dp-btn dp-btn--sm dp-btn--outline" onClick={() => setEditUser({ ...u })}>Edit</button>
                      <button
                        className={`dp-btn dp-btn--sm ${u.is_active ? 'dp-btn--danger' : 'dp-btn--success'}`}
                        onClick={() => handleToggleActive(u)}
                      >{u.is_active ? 'Deactivate' : 'Reactivate'}</button>
                      <button
                        className="dp-btn dp-btn--sm dp-btn--danger"
                        onClick={() => handleDelete(u)}
                        title="Permanently delete user"
                      >🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User"
        footer={
          <><button className="dp-btn dp-btn--ghost" onClick={() => setEditUser(null)}>Cancel</button>
          <button className="dp-btn dp-btn--primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>
        }
      >
        {editUser && (
          <form onSubmit={handleSaveEdit}>
            <div className="dp-form-group">
              <label className="dp-label">Name</label>
              <input className="dp-input" value={editUser.name} onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))} />
            </div>
            <div className="dp-form-group">
              <label className="dp-label">Role</label>
              <select className="dp-select" value={editUser.role} onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}>
                {['student', 'admin', 'pastor', 'mentor'].map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
              </select>
            </div>
            <div className="dp-form-group">
              <label className="dp-label">Sub-role (admin only)</label>
              <select className="dp-select" value={editUser.sub_role || ''} onChange={e => setEditUser(u => ({ ...u, sub_role: e.target.value || null }))}>
                <option value="">None</option>
                {['super_admin', 'user_admin', 'content_admin', 'course_admin', 'community_admin', 'mentor_admin'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </form>
        )}
      </Modal>
      </div>
    </div>
  );
}
