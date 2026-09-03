import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import Alert from '../components/common/Alert';
import PasswordInput from '../components/common/PasswordInput';
import ScriptureParticles from '../components/common/ScriptureParticles';

export default function LoginPage({ onLogin }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/my-learning';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  // MFA state
  const [mfaStep, setMfaStep]   = useState(false);
  const [mfaUserId, setMfaUserId] = useState(null);
  const [mfaCode, setMfaCode]   = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({}); setAlert(null); setLoading(true);
    try {
      const res = await authService.login(form.email, form.password);
      if (res.mfa_required) {
        setMfaStep(true);
        setMfaUserId(res.mfa_user_id);
      } else {
        onLogin?.(res.data.user);
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setAlert({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e) => {
    e.preventDefault();
    setLoading(true); setAlert(null);
    try {
      const res = await authService.verifyMfa(mfaUserId, mfaCode);
      onLogin?.(res.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (mfaStep) {
    return (
      <div className="dp-auth-page">
        <ScriptureParticles />
        <div className="dp-auth-card">
          <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h2 className="dp-auth-title">Two-Factor Auth</h2>
          <p className="dp-auth-sub">Enter the 6-digit code from your authenticator app.</p>
          {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}
          <form onSubmit={handleMfa}>
            <div className="dp-form-group">
              <input
                className="dp-input" type="text" inputMode="numeric" maxLength={6}
                placeholder="000000" value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
                autoFocus required
              />
            </div>
            <button type="submit" className="dp-btn dp-btn--primary dp-btn--full dp-btn--lg" disabled={loading || mfaCode.length !== 6}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-auth-page">
      <ScriptureParticles />
      <div className="dp-auth-card">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img src="/images/project-christ-logo.png" alt="Project Christ" style={{ height: 64, width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', color: 'var(--dp-navy)', marginTop: 6 }}>Project Christ Discipleship</div>
        </div>
        <h2 className="dp-auth-title">Welcome Back</h2>
        <p className="dp-auth-sub">Sign in to continue your discipleship journey</p>

        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        <form onSubmit={handleLogin}>
          <div className="dp-form-group">
            <label className="dp-label">Email Address</label>
            <input className="dp-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} required autoFocus />
            {errors.email && <div className="dp-form-error">{errors.email[0]}</div>}
          </div>
          <div className="dp-form-group">
            <div className="dp-flex-between" style={{ marginBottom: 6 }}>
              <label className="dp-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--dp-sky)' }}>Forgot password?</Link>
            </div>
            <PasswordInput placeholder="Your password"
              value={form.password} onChange={e => set('password', e.target.value)} required />
            {errors.password && <div className="dp-form-error">{errors.password[0]}</div>}
          </div>
          <button type="submit" className="dp-btn dp-btn--primary dp-btn--full dp-btn--lg" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--dp-sky)', fontWeight: 600 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
