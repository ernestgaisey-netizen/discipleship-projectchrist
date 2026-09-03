export default function Alert({ type = 'info', children, onDismiss }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  return (
    <div className={`dp-alert dp-alert--${type}`}>
      <span>{icons[type]}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.6 }}>×</button>}
    </div>
  );
}
