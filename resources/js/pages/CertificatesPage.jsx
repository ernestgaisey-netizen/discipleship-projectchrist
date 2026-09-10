import { useState, useEffect } from 'react';
import api from '../services/apiClient';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Alert from '../components/common/Alert';

export default function CertificatesPage() {
  const [certs, setCerts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);

  useEffect(() => {
    api.get('/certificates')
      .then(r => setCerts(r.data || []))
      .catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '22px 24px 20px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#fff', marginBottom: 4 }}>🏆 My Certificates</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Certificates issued upon course completion — permanently verifiable</p>
        </div>
      </div>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '24px' }}>
        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        {loading ? <Loader /> : certs.length === 0 ? (
          <EmptyState icon="🎓" title="No certificates yet"
            subtitle="Complete a course with a certificate enabled to earn one." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,320px))', gap: 24 }}>
            {certs.map(c => (
              <div key={c.id} className="dp-card">
                <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)', padding: '32px 24px', textAlign: 'center', color: 'white' }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>🏆</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>{c.course?.title}</div>
                </div>
                <div className="dp-card__body">
                  <div style={{ fontSize: 13, color: 'var(--dp-text3)', marginBottom: 4 }}>
                    Issued: {new Date(c.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--dp-text3)', letterSpacing: 1, background: 'var(--dp-light)', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 14 }}>
                    {c.certificate_code}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={`/api/v1/certificates/${c.id}/download`} className="dp-btn dp-btn--primary dp-btn--sm" download>
                      ⬇ Download PDF
                    </a>
                    <a href={`/certificates/verify/${c.certificate_code}`} target="_blank" rel="noreferrer" className="dp-btn dp-btn--outline dp-btn--sm">
                      🔗 Verify
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
