import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import Alert from '../components/common/Alert';
import PasswordInput from '../components/common/PasswordInput';

export default function ProfilePage({ user, onUserUpdate }) {
  const [form, setForm]     = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [alert, setAlert]   = useState(null);
  const [pwAlert, setPwAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // MFA
  const [mfaData, setMfaData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaAlert, setMfaAlert] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setAlert(null);
    try {
      const updated = await authService.updateProfile(form);
      onUserUpdate?.(updated);
      setAlert({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaving(true); setPwAlert(null);
    try {
      await authService.changePassword(pwForm.current_password, pwForm.password, pwForm.password_confirmation);
      setPwAlert({ type: 'success', msg: 'Password changed successfully.' });
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setPwAlert({ type: 'error', msg: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  const handleMfaSetup = async () => {
    setMfaLoading(true); setMfaAlert(null);
    try {
      const res = await authService.mfaSetup();
      setMfaData(res.data);
    } catch (err) {
      setMfaAlert({ type: 'error', msg: err.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaEnable = async (e) => {
    e.preventDefault();
    setMfaLoading(true); setMfaAlert(null);
    try {
      await authService.mfaEnable(mfaCode);
      setMfaAlert({ type: 'success', msg: '2FA enabled successfully.' });
      setMfaData(null); setMfaCode('');
      onUserUpdate?.({ ...user, mfa_enabled: true });
    } catch (err) {
      setMfaAlert({ type: 'error', msg: err.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    const code = prompt('Enter your 6-digit authenticator code to disable 2FA:');
    if (!code) return;
    try {
      await authService.mfaDisable(code);
      setMfaAlert({ type: 'success', msg: '2FA disabled.' });
      onUserUpdate?.({ ...user, mfa_enabled: false });
    } catch (err) {
      setMfaAlert({ type: 'error', msg: err.message });
    }
  };

  const tabs = [
    { key: 'profile',  label: '👤 Profile' },
    { key: 'password', label: '🔑 Password' },
    { key: 'security', label: '🔐 Security (2FA)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '22px 24px 20px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#fff', marginBottom: 4 }}>👤 My Profile</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Manage your account, security and preferences</p>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--dp-border)', marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              borderBottom: activeTab === t.key ? '2px solid var(--dp-sky)' : '2px solid transparent',
              color: activeTab === t.key ? 'var(--dp-sky)' : 'var(--dp-gray)', marginBottom: -2 }}
          >{t.label}</button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="dp-card">
          <div className="dp-card__body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--dp-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
                {user?.avatar_url ? <img src={user.avatar_url} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} alt="" /> : user?.name?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
                <div style={{ color: 'var(--dp-gray)', fontSize: 13 }}>{user?.email}</div>
                <span className="dp-badge dp-badge--blue" style={{ marginTop: 6, textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
            </div>
            {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

            {/* 2FA status — surfaced here too since it lives under the Security tab
                and was easy to miss otherwise. */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px',
              borderRadius: 10, border: `1.5px solid ${user?.mfa_enabled ? '#BBF7D0' : '#FDE68A'}`,
              background: user?.mfa_enabled ? '#F0FDF4' : '#FFFBEB',
            }}>
              <span style={{ fontSize: 20 }}>{user?.mfa_enabled ? '✅' : '🔐'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  Two-Factor Authentication: {user?.mfa_enabled ? 'Enabled' : 'Not enabled'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--dp-gray)' }}>
                  {user?.mfa_enabled ? 'Your account has an extra layer of protection.' : 'Add an authenticator app for extra account security.'}
                </div>
              </div>
              <button type="button" className={`dp-btn dp-btn--sm ${user?.mfa_enabled ? 'dp-btn--ghost' : 'dp-btn--primary'}`}
                onClick={() => setActiveTab('security')}>
                {user?.mfa_enabled ? 'Manage' : 'Enable 2FA'}
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="dp-form-group">
                <label className="dp-label">Full Name</label>
                <input className="dp-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="dp-form-group">
                <label className="dp-label">Phone (optional)</label>
                <input className="dp-input" placeholder="+1 234 567 890" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="dp-form-group" style={{ marginBottom: 0 }}>
                <label className="dp-label">Email</label>
                <input className="dp-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
                <div className="dp-form-hint">Email cannot be changed here. Contact support.</div>
              </div>
              <div style={{ marginTop: 20 }}>
                <button type="submit" className="dp-btn dp-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password tab */}
      {activeTab === 'password' && (
        <div className="dp-card">
          <div className="dp-card__body">
            <h3>Change Password</h3>
            {pwAlert && <Alert type={pwAlert.type} onDismiss={() => setPwAlert(null)}>{pwAlert.msg}</Alert>}
            <form onSubmit={handleChangePassword}>
              {[
                { key: 'current_password',     label: 'Current Password' },
                { key: 'password',              label: 'New Password' },
                { key: 'password_confirmation', label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key} className="dp-form-group">
                  <label className="dp-label">{label}</label>
                  <PasswordInput value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} required />
                </div>
              ))}
              <button type="submit" className="dp-btn dp-btn--primary" disabled={pwSaving}>{pwSaving ? 'Changing…' : 'Change Password'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="dp-card">
          <div className="dp-card__body">
            <h3>Two-Factor Authentication</h3>
            <p style={{ color: 'var(--dp-gray)', fontSize: 14 }}>
              Add an extra layer of security to your account using an authenticator app (Google Authenticator, Authy, etc.).
            </p>
            {mfaAlert && <Alert type={mfaAlert.type} onDismiss={() => setMfaAlert(null)}>{mfaAlert.msg}</Alert>}

            {user?.mfa_enabled
              ? <>
                  <div className="dp-alert dp-alert--success">✅ 2FA is currently enabled on your account.</div>
                  <button className="dp-btn dp-btn--danger" onClick={handleMfaDisable}>Disable 2FA</button>
                </>
              : !mfaData
                ? <button className="dp-btn dp-btn--primary" onClick={handleMfaSetup} disabled={mfaLoading}>{mfaLoading ? 'Loading…' : 'Set Up 2FA'}</button>
                : <div>
                    <p style={{ fontSize: 14 }}>Scan this QR code with your authenticator app:</p>
                    <img src={mfaData.qr_url} alt="MFA QR Code" style={{ border: '4px solid var(--dp-border)', borderRadius: 8, marginBottom: 16 }} />
                    <p style={{ fontSize: 13, color: 'var(--dp-gray)' }}>Or enter manually: <code style={{ background: 'var(--dp-light)', padding: '2px 6px', borderRadius: 4 }}>{mfaData.secret}</code></p>
                    <form onSubmit={handleMfaEnable}>
                      <div className="dp-form-group">
                        <label className="dp-label">Verify code from app</label>
                        <input className="dp-input" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                          value={mfaCode} onChange={e => setMfaCode(e.target.value)} required />
                      </div>
                      <button type="submit" className="dp-btn dp-btn--success" disabled={mfaLoading || mfaCode.length !== 6}>{mfaLoading ? 'Verifying…' : 'Enable 2FA'}</button>
                    </form>
                  </div>
            }

            <div style={{ marginTop: 32, borderTop: '1px solid var(--dp-border)', paddingTop: 20 }}>
              <h3>Certificates</h3>
              <Link to="/certificates" className="dp-btn dp-btn--outline">View My Certificates</Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
