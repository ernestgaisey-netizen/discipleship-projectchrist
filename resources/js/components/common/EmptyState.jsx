export default function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="dp-empty">
      <div className="dp-empty__icon">{icon}</div>
      <div className="dp-empty__title">{title}</div>
      {subtitle && <p style={{ fontSize: 14, marginTop: 4 }}>{subtitle}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
