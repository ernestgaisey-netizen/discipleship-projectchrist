import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Alert from '../components/common/Alert';
import PasswordInput from '../components/common/PasswordInput';
import ScriptureParticles from '../components/common/ScriptureParticles';

export default function RegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirmation: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); setAlert(null); setLoading(true);
    if (form.password !== form.passwordConfirmation) {
      setErrors({ password: ['Passwords do not match.'] });
      setLoading(false);
      return;
    }
    try {
      const res = await authService.register(form.name, form.email, form.password, form.passwordConfirmation);
      onLogin?.(res.data.user);
      navigate('/my-learning');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setAlert({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dp-auth-page">
      <ScriptureParticles />
      <div className="dp-auth-card">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img src="/images/project-christ-logo.png" alt="Project Christ" style={{ height: 64, width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', color: 'var(--dp-navy)', marginTop: 6 }}>Project Christ Discipleship</div>
        </div>
        <h2 className="dp-auth-title">Create Your Account</h2>
        <p className="dp-auth-sub">Start your discipleship journey — it's free</p>

        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        <form onSubmit={handleSubmit}>
          {[
            { key: 'name',                 label: 'Full Name',        type: 'text',     placeholder: 'John Believer' },
            { key: 'email',                label: 'Email Address',    type: 'email',    placeholder: 'you@example.com' },
            { key: 'password',             label: 'Password',         type: 'password', placeholder: 'Min 6 characters' },
            { key: 'passwordConfirmation', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} className="dp-form-group">
              <label className="dp-label">{label}</label>
              {type === 'password'
                ? <PasswordInput placeholder={placeholder}
                    value={form[key]} onChange={e => set(key, e.target.value)} required />
                : <input className="dp-input" type={type} placeholder={placeholder}
                    value={form[key]} onChange={e => set(key, e.target.value)} required />
              }
              {errors[key === 'passwordConfirmation' ? 'password_confirmation' : key] &&
                <div className="dp-form-error">{errors[key === 'passwordConfirmation' ? 'password_confirmation' : key][0]}</div>}
            </div>
          ))}
          <button type="submit" className="dp-btn dp-btn--primary dp-btn--full dp-btn--lg" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--dp-sky)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
