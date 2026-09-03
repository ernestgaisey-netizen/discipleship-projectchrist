const PARTICLES = [
  "John 3:16 — For God so loved the world that He gave His only Son",
  "Matthew 28:19 — Go therefore and make disciples of all nations",
  "Romans 8:28 — All things work together for good to those who love God",
  "Philippians 4:13 — I can do all things through Christ who strengthens me",
  "Jeremiah 29:11 — Plans to prosper you and not to harm you",
  "Isaiah 40:31 — Those who wait on the Lord shall renew their strength",
  "2 Timothy 3:16 — All Scripture is breathed out by God",
  "Romans 10:9 — Confess with your mouth that Jesus is Lord",
  "Ephesians 2:8 — By grace you have been saved through faith",
  "Joshua 1:9 — Be strong and courageous, do not be afraid",
  "Psalm 23:1 — The Lord is my shepherd, I shall not want",
  "Galatians 2:20 — It is no longer I who live but Christ who lives in me",
  "Mark 16:15 — Go into all the world and proclaim the gospel",
  "Romans 12:2 — Be transformed by the renewing of your mind",
  "Proverbs 22:6 — Train up a child in the way he should go",
  "Micah 6:8 — Do justice, love kindness, walk humbly with God",
  "Colossians 3:23 — Whatever you do, work heartily as unto the Lord",
  "Hebrews 11:1 — Faith is the substance of things hoped for",
  "1 John 4:19 — We love because He first loved us",
  "Acts 1:8 — You will receive power when the Holy Spirit comes on you",
];

export default function ScriptureParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {PARTICLES.map((txt, i) => (
        <div
          key={i}
          className="scripture-particle"
          style={{
            top:              `${(i * 14 + 6) % 88}%`,
            left:             0,
            animationDuration:`${28 + (i * 3) % 22}s`,
            animationDelay:   `${(i * 3.4) % 20}s`,
            fontSize:         `${11 + (i * 2) % 5}px`,
          }}
        >
          {txt}
        </div>
      ))}
    </div>
  );
}
