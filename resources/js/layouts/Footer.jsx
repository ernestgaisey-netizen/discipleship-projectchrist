export default function Footer() {
  return (
    <footer style={{
      background: '#060E1A',
      padding: '20px 24px',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.35)',
      fontSize: 13,
    }}>
      © {new Date().getFullYear()} Project Christ Discipleship
    </footer>
  );
}
