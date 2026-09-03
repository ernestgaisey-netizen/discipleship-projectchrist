import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 24 }}>
      <img src="/images/project-christ-logo.png" alt="Project Christ" style={{ height: 80, width: 'auto', objectFit: 'contain', marginBottom: 16, opacity: 0.6 }} />
      <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '3rem', color: 'var(--dp-navy)', marginBottom: 8 }}>404</h1>
      <h2 style={{ color: 'var(--dp-gray)', fontWeight: 400, marginBottom: 24 }}>This path doesn't exist — yet</h2>
      <p style={{ color: 'var(--dp-gray)', maxWidth: 400, marginBottom: 32, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
        "Your word is a lamp for my feet, a light on my path." — Psalm 119:105
      </p>
      <Link to="/" className="dp-btn dp-btn--primary dp-btn--lg">← Return Home</Link>
    </div>
  );
}
