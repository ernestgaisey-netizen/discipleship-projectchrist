export default function ProgressBar({ value = 0, max = 100, label, showPercent = true, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dp-gray)', marginBottom: 6 }}>
          {label && <span>{label}</span>}
          {showPercent && <span>{pct}%</span>}
        </div>
      )}
      <div className="dp-progress">
        <div className="dp-progress__bar" style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }} />
      </div>
    </div>
  );
}
