import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../services/courseService';

// ── Evangelism steps ────────────────────────────────────────────────────────

const STEPS = [
  {
    n: 1, icon: '❤️', color: '#DC2626', bg: '#FEF2F2', bdr: '#FECACA',
    title: "God's Love Revealed in Christ",
    body: "God's love is not first seen in what you do for Him, but in what He has done for you in Christ. Before you ever knew Him, God loved you and demonstrated that love by giving His Son. Jesus is the perfect revelation of the Father's heart toward humanity.\n\nGod is not waiting for you to become perfect before He loves you. His love has already been proven in Christ.",
    verse: '"For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life."',
    ref: 'John 3:16',
  },
  {
    n: 2, icon: '⚠️', color: '#D97706', bg: '#FFFBEB', bdr: '#FDE68A',
    title: 'The Real Problem: Sin and Spiritual Death',
    body: "The problem of man is not merely bad behaviour. The deeper issue is spiritual death caused by sin. Man needed more than advice, motivation, or religion. Man needed life.\n\nSin brought separation, guilt, condemnation, and death. But God did not leave man helpless. From the beginning, God's answer to man's condition was Christ.",
    verse: '"For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord."',
    ref: 'Romans 6:23',
  },
  {
    n: 3, icon: '✝️', color: '#1B4F8A', bg: '#EFF6FF', bdr: '#BFDBFE',
    title: "Jesus Is God's Solution",
    body: "Jesus did not come to start another religion. He came as God's answer to the problem of sin and death. Through His death, burial, and resurrection, He paid the price, defeated death, and made salvation available to all who believe.\n\nSalvation is not achieved by human effort. It is received by faith in the finished work of Christ. Jesus is not one of many ways to God — He is the way, the truth, and the life.",
    verse: '"Christ died for our sins according to the Scriptures, and He was buried, and He rose again the third day." — 1 Cor 15:3–4\n"I am the way, the truth, and the life. No one comes to the Father except through Me." — John 14:6',
    ref: '1 Corinthians 15:3–4 | John 14:6',
  },
  {
    n: 4, icon: '🙏', color: '#16A34A', bg: '#F0FDF4', bdr: '#BBF7D0',
    title: 'Your Response: Believe the Gospel',
    body: "Your response to the gospel is not to try harder, clean yourself up first, or earn God's acceptance. Your response is to believe.\n\nWhen you believe in your heart that Jesus died and rose again, and you confess Him as Lord, you receive salvation. You are forgiven, made righteous, accepted in Christ, and given eternal life.",
    verse: '"If you confess with your mouth the Lord Jesus and believe in your heart that God raised Him from the dead, you will be saved." — Romans 10:9\n"For by grace you have been saved through faith… it is the gift of God." — Ephesians 2:8',
    ref: 'Romans 10:9 | Ephesians 2:8',
  },
  {
    n: 5, icon: '📿', color: '#7C3AED', bg: '#F5F3FF', bdr: '#DDD6FE',
    title: 'Prayer of Salvation',
    body: 'Pray this sincerely from your heart right now:\n\n"Lord Jesus, I believe the gospel: that You died for my sins, You were buried, and You rose again for my justification. I receive the gift of salvation by faith — not by my works, but by Your finished work. I confess that I am saved, forgiven, accepted, and made righteous in Christ. Thank You, Father, for giving me eternal life through Jesus Christ. Amen."',
    verse: '"Everyone who calls on the name of the Lord will be saved."',
    ref: 'Romans 10:13',
  },
  {
    n: 6, icon: '🌱', color: '#0EA5A0', bg: '#F0FDFA', bdr: '#99F6E4',
    title: 'Next Steps: Grow in Christ',
    body: "Congratulations! You are now in Christ — a new creation, saved by grace and made alive through His finished work. Now grow in the knowledge of what Christ has already done in you through the Word, prayer, fellowship with a local church family, and discipleship.\n\nThe Project Christ Discipleship courses below will guide you step by step in understanding your new life in Christ.",
    verse: '"If anyone is in Christ, he is a new creation. Old things have passed away; behold, all things have become new."',
    ref: '2 Corinthians 5:17',
  },
];

// ── Scripture particles (floating background texts) ─────────────────────────

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

function ScriptureParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {PARTICLES.map((txt, i) => (
        <div
          key={i}
          className="scripture-particle"
          style={{
            top:             `${(i * 14 + 6) % 88}%`,
            left:            0,
            animationDuration:`${28 + (i * 3) % 22}s`,
            animationDelay:  `${(i * 3.4) % 20}s`,
            fontSize:        `${11 + (i * 2) % 5}px`,
          }}
        >
          {txt}
        </div>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function HomePage({ user }) {
  const [courses, setCourses]   = useState([]);
  const [siteStats, setSiteStats] = useState(null);
  const [openStep, setOpenStep] = useState(null);

  useEffect(() => {
    courseService.list()
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch live platform numbers for the stats bar
    fetch('/api/v1/stats', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(d => d.success && setSiteStats(d.data))
      .catch(() => {});
  }, []);

  const disciples = siteStats?.active_disciples ?? courses.reduce((a, c) => a + (c.enrollments_count || 0), 0);
  const modules   = siteStats?.total_modules    ?? courses.reduce((a, c) => a + (c.modules_count    || 0), 0);
  const questions = siteStats?.exam_questions   ?? 0;

  const stats = [
    { num: disciples  > 0 ? `${disciples.toLocaleString()}+`  : '—', label: 'Active Disciples' },
    { num: courses.length > 0 ? String(courses.length)        : '—', label: 'Courses' },
    { num: modules    > 0 ? `${modules}+`                     : '—', label: 'Modules' },
    { num: questions  > 0 ? `${questions}+`                   : '—', label: 'Exam Questions' },
  ];

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="dp-hero" style={{ padding: '72px 24px 64px' }}>
        <ScriptureParticles />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Bouncing logo */}
          <div style={{ marginBottom: -20, display: 'inline-block', perspective: 600 }}>
            <div style={{
              display: 'inline-block',
              transformStyle: 'preserve-3d',
              animation: 'logo3d 4s cubic-bezier(.45,0,.55,1) infinite',
              willChange: 'transform',
            }}>
              <img
                src="/images/project-christ-logo.png"
                alt="Project Christ"
                style={{ width: 160, height: 160, objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>

          <h1 className="dp-hero__title" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
            Project Christ Discipleship
          </h1>

          <p className="dp-hero__sub" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            "Go therefore and make disciples of all nations" — Matthew 28:19
          </p>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.75 }}>
            A structured, exam-gated discipleship learning platform delivering transformative Christian education.
            Learn, grow, and be equipped for Kingdom impact.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            {user
              ? <Link to="/my-learning" className="dp-btn dp-btn--success dp-btn--lg">▶ Continue Learning</Link>
              : <>
                  <Link to="/register" className="dp-btn dp-btn--success dp-btn--lg">🌱 Begin Your Journey</Link>
                  <Link to="/courses"  className="dp-btn dp-btn--lg" style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.55)' }}>Browse Courses</Link>
                </>
            }
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 36, justifyContent: 'center', flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--dp-mint)' }}>{s.num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Way of Salvation ─────────────────────────────────────────────── */}
      <section style={{ padding: '72px 0', background: 'var(--dp-bg)' }}>
        <div className="dp-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--dp-green)', background: 'var(--dp-lightgreen)', padding: '5px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 14 }}>
              🙏 How to Know God Personally
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', marginBottom: 12 }}>
              The Way of Salvation
            </h2>
            <p style={{ color: 'var(--dp-text2)', maxWidth: 520, margin: '0 auto', fontSize: 15, lineHeight: 1.7 }}>
              God has a wonderful plan for your life. Follow these steps to begin your journey of faith and receive eternal life.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 840, margin: '0 auto' }}>
            {STEPS.map(s => (
              <div key={s.n}
                onClick={() => setOpenStep(openStep === s.n ? null : s.n)}
                style={{
                  border: `2px solid ${openStep === s.n ? s.color : s.bdr}`,
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: openStep === s.n ? `0 6px 28px ${s.color}22` : 'none',
                }}
              >
                {/* Header row */}
                <div style={{ background: s.bg, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    background: s.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: s.color, letterSpacing: 1.5, marginBottom: 2 }}>STEP {s.n}</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--dp-navy)' }}>{s.title}</div>
                  </div>
                  <span style={{ color: s.color, fontSize: 18, transition: 'transform 0.25s', transform: openStep === s.n ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</span>
                </div>

                {/* Expanded body */}
                {openStep === s.n && (
                  <div style={{ padding: '18px 20px', background: 'white', borderTop: `1px solid ${s.bdr}` }}>
                    <p style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--dp-text2)', marginBottom: 16, whiteSpace: 'pre-line' }}>
                      {s.body}
                    </p>
                    <div style={{
                      background: s.bg, borderLeft: `3px solid ${s.color}`,
                      padding: '12px 16px', borderRadius: '0 8px 8px 0',
                      fontStyle: 'italic', fontSize: 13, color: 'var(--dp-text2)',
                      lineHeight: 1.7, whiteSpace: 'pre-line', fontFamily: 'var(--font-serif)',
                    }}>
                      {s.verse}
                      <div style={{ fontWeight: 700, color: s.color, fontStyle: 'normal', fontSize: 11, marginTop: 6 }}>— {s.ref}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--dp-text3)', fontSize: 12, marginTop: 16 }}>
            ↑ Click each step to expand
          </p>
        </div>
      </section>

      {/* ── Contact / Pastoral counselling ───────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: '#fff', marginBottom: 14 }}>
            Need Guidance or Pastoral Counseling?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Our pastoral team is available to answer questions, walk you through your decision for Christ, or support you in your faith journey.
          </p>

          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              ['📞', 'CALL / WHATSAPP', '+233 (0) 548 607 030 test123'],
              ['📧', 'EMAIL',           'admin@projectchrist.org'],
              ['⏰', 'HOURS',           'Mon–Sat, 8am – 6pm'],
            ].map(([icon, label, val]) => (
              <div key={label} style={{
                padding: '20px 28px',
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                minWidth: 190,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 5, fontWeight: 700, letterSpacing: 1 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>

          <Link to={user ? '/courses' : '/register'} className="dp-btn dp-btn--success dp-btn--lg">
            🚀 Begin Your Discipleship Journey
          </Link>
        </div>
      </div>

    </div>
  );
}
