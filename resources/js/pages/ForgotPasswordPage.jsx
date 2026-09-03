import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import Alert from '../components/common/Alert';
import ScriptureParticles from '../components/common/ScriptureParticles';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setAlert(null);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dp-auth-page">
      <ScriptureParticles />
      <div className="dp-auth-card">
        <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 8 }}>🔑</div>
        <h2 className="dp-auth-title">Reset Password</h2>
        <p className="dp-auth-sub">Enter your email and we'll send a reset link.</p>

        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        {sent
          ? <div className="dp-alert dp-alert--success">If that email exists, a reset link has been sent. Check your inbox.</div>
          : (
            <form onSubmit={handleSubmit}>
              <div className="dp-form-group">
                <label className="dp-label">Email Address</label>
                <input className="dp-input" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="dp-btn dp-btn--primary dp-btn--full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )
        }
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--dp-sky)' }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
