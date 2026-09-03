export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="dp-loader">
      <div className="dp-spinner" />
      <span style={{ color: 'var(--dp-gray)', fontSize: 14 }}>{text}</span>
    </div>
  );
}
