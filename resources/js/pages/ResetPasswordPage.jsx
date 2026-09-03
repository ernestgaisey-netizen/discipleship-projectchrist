import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import Alert from '../components/common/Alert';
import PasswordInput from '../components/common/PasswordInput';
import ScriptureParticles from '../components/common/ScriptureParticles';

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get('token') || '';
  const email                   = searchParams.get('email') || '';

  const [password, setPassword]                         = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading]                           = useState(false);
  const [alert, setAlert]                               = useState(null);
  const [done, setDone]                                 = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setAlert({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }
    setLoading(true); setAlert(null);
    try {
      await authService.resetPassword(token, email, password, passwordConfirmation);
      setDone(true);
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="dp-auth-page">
        <ScriptureParticles />
        <div className="dp-auth-card">
          <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <h2 className="dp-auth-title">Invalid Link</h2>
          <p className="dp-auth-sub">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="dp-btn dp-btn--primary dp-btn--full"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Request a New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-auth-page">
      <ScriptureParticles />
      <div className="dp-auth-card">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img src="/images/project-christ-logo.png" alt="Project Christ"
            style={{ height: 64, width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', color: 'var(--dp-navy)', marginTop: 6 }}>
            Project Christ Discipleship
          </div>
        </div>
        <h2 className="dp-auth-title">Set New Password</h2>
        <p className="dp-auth-sub">Resetting password for <strong>{email}</strong></p>

        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        {done
          ? <div>
              <div className="dp-alert dp-alert--success">
                ✅ Password reset successfully! You can now sign in with your new password.
              </div>
              <Link to="/login" className="dp-btn dp-btn--primary dp-btn--full"
                style={{ marginTop: 16, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>
          : <form onSubmit={handleSubmit}>
              <div className="dp-form-group">
                <label className="dp-label">New Password</label>
                <PasswordInput
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="dp-form-group">
                <label className="dp-label">Confirm New Password</label>
                <PasswordInput
                  placeholder="Repeat password"
                  value={passwordConfirmation}
                  onChange={e => setPasswordConfirmation(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="dp-btn dp-btn--primary dp-btn--full dp-btn--lg" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
        }

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--dp-sky)' }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
