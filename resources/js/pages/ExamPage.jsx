import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import examService from '../services/examService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function ExamPage() {
  const { moduleId } = useParams();
  const navigate     = useNavigate();

  const [exam, setExam]               = useState(null);   // meta: title, pass_mark, time_limit, etc.
  const [question, setQuestion]       = useState(null);    // current question, no correct_answer
  const [currentIndex, setCurrentIndex] = useState(0);      // 0-based — also "questions completed so far"
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState(null);
  const [alert, setAlert]             = useState(null);
  const [timeLeft, setTimeLeft]       = useState(null);
  const [started, setStarted]         = useState(false);
  const timerRef                      = useRef(null);
  const startTime                     = useRef(null);

  const loadExam = useCallback(() => {
    setLoading(true);
    return examService.getForModule(moduleId)
      .then(data => {
        setExam(data);
        setQuestion(data.question);
        setCurrentIndex(data.current_index || 0);
        setSelectedAnswer(null);
        setTimeLeft(data.time_limit || null);
      })
      .catch(e => setAlert({ type: 'error', msg: e.message || 'Could not load exam.' }))
      .finally(() => setLoading(false));
  }, [moduleId]);

  useEffect(() => { loadExam(); }, [loadExam]);

  const handleFinish = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await examService.finish(exam.exam_id);
      setResult(res);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
      setSubmitting(false);
    }
  }, [exam]);

  useEffect(() => {
    if (!started || !timeLeft) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleFinish(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, handleFinish]);

  const startExam = () => { setStarted(true); startTime.current = Date.now(); };
  const pick = (val) => { if (submitting) return; setSelectedAnswer(val); };

  const handleNext = async () => {
    if (selectedAnswer === null || selectedAnswer === undefined || submitting) return;
    setSubmitting(true);
    try {
      const res = await examService.answer(exam.exam_id, question.id, selectedAnswer);
      if (res.done) {
        if (timerRef.current) clearInterval(timerRef.current);
        setResult(res);
      } else {
        setQuestion(res.question);
        setCurrentIndex(res.current_index);
        setSelectedAnswer(null);
      }
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = async () => {
    if (currentIndex === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await examService.back(exam.exam_id);
      setQuestion(res.question);
      setCurrentIndex(res.current_index);
      setSelectedAnswer(res.previous_answer ?? null);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="dp-main"><Loader /></div>;
  if (alert && !exam) return <div className="dp-main" style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}><Alert type="error">{alert.msg}</Alert></div>;
  if (!exam) return null;

  const total       = exam.total_questions;
  const timerColor  = timeLeft === null ? '#16A34A' : timeLeft < 60 ? '#DC2626' : timeLeft < 120 ? '#D97706' : '#4ADE80';

  // ── Results view ────────────────────────────────────────────────────────────
  if (result) {
    const passed       = result.passed;
    const score        = Math.round(result.score);
    const scoreColor   = passed ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626';
    const attemptsLeft = (exam.max_attempts || 3) - (result.attempt_number || 1);

    return (
      <div style={{ minHeight: '100vh', background: '#EEF4FB' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px 64px' }}>

          {/* Score card */}
          <div className="dp-card" style={{
            padding: '40px 32px', textAlign: 'center', marginBottom: 22,
            background: passed ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : 'linear-gradient(135deg,#FFF1F2,#FEE2E2)',
            border: `1.5px solid ${passed ? '#BBF7D0' : '#FECACA'}`,
          }}>
            <div style={{ fontSize: 60, marginBottom: 14 }}>{passed ? '🎉' : '📚'}</div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 64, fontWeight: 700, color: scoreColor, lineHeight: 1, marginBottom: 8 }}>{score}%</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#0D1F35', marginBottom: 8 }}>
              {passed ? 'Congratulations! You Passed!' : 'Not Quite — Keep Studying!'}
            </div>
            <p style={{ color: '#3D5A80', fontSize: 14, marginBottom: 18 }}>
              {passed ? `${score - exam.pass_mark}% above` : `${exam.pass_mark - score}% below`} pass mark ({exam.pass_mark}%)
            </p>
            <div style={{ display: 'inline-flex', gap: 24, background: 'rgba(13,31,53,.06)', borderRadius: 12, padding: '12px 24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[[`${score}%`, 'Score'], [`${exam.pass_mark}%`, 'Pass Mark'], [`#${result.attempt_number || 1}`, 'Attempt']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 700, color: scoreColor }}>{v}</div>
                  <div style={{ fontSize: 12, color: '#7A96B4' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What's next */}
          <div className="dp-card" style={{ padding: 22 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#0D1F35', marginBottom: 14 }}>What's Next?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {passed && result.next_module_id && (
                <button className="dp-btn dp-btn--success" style={{ width: '100%', padding: 13, fontSize: 15 }}
                  onClick={() => navigate(`/modules/${result.next_module_id}`)}>
                  ▶ Start Next Module
                </button>
              )}
              {passed && result.course_completed && (
                <div style={{ padding: 12, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', borderRadius: 9, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
                  🏆 Course Complete! Certificate is being issued.
                </div>
              )}
              {!passed && attemptsLeft > 0 && (
                <button className="dp-btn dp-btn--primary" style={{ width: '100%', padding: 13, fontSize: 15 }}
                  onClick={() => { setResult(null); setStarted(false); loadExam(); }}>
                  🔄 Retry Exam ({result.attempt_number}/{exam.max_attempts} attempts used)
                </button>
              )}
              {!passed && attemptsLeft <= 0 && (
                <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 9, border: '1px solid #FECACA', fontSize: 14, color: '#991B1B', textAlign: 'center' }}>
                  Maximum attempts reached. Please review the module content and contact your pastor for support.
                </div>
              )}
              <button className="dp-btn dp-btn--ghost" style={{ width: '100%', padding: 11 }}
                onClick={() => navigate(`/modules/${moduleId}`)}>
                📖 Review Module Content
              </button>
              {result.course_id && (
                <button className="dp-btn dp-btn--ghost" style={{ width: '100%', padding: 11 }}
                  onClick={() => navigate(`/courses/${result.course_id}`)}>
                  ← Back to Course
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Start screen ────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: '#EEF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="dp-card" style={{ maxWidth: 520, width: '100%', textAlign: 'center', padding: '48px 36px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📝</div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', color: '#0D1F35', marginBottom: 8 }}>{exam.title}</h1>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', margin: '20px 0 28px', color: '#7A96B4', fontSize: 14 }}>
            <span>✏️ {total} questions</span>
            {exam.time_limit && <span>⏱ {Math.round(exam.time_limit / 60)} minutes</span>}
            <span>🎯 Pass mark: {exam.pass_mark}%</span>
            <span>🔁 {(exam.max_attempts || 3) - (exam.attempts_used || 0)} attempts left</span>
          </div>
          {exam.already_passed && (
            <div className="dp-alert dp-alert--success" style={{ marginBottom: 20 }}>
              You already passed this exam. You can retake it to review.
            </div>
          )}
          {alert && <Alert type="error" onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="dp-btn dp-btn--primary dp-btn--lg" onClick={startExam}>Begin Exam →</button>
            <button className="dp-btn dp-btn--ghost" onClick={() => navigate(`/modules/${moduleId}`)}>
              ← Not Now, Return to Module
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam in progress — one question at a time, next depends on the last answer ──
  const q = question;
  if (!q) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#EEF4FB', display: 'flex', flexDirection: 'column' }}>

      {/* Gradient header */}
      <div style={{ background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginBottom: 2, fontWeight: 600, letterSpacing: .6 }}>MODULE EXAM</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#fff' }}>{exam.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {timeLeft !== null && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, color: timerColor, fontWeight: 700, transition: 'color .4s', lineHeight: 1 }}>{fmt(timeLeft)}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>TIME LEFT</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, color: '#4ADE80', fontWeight: 700, lineHeight: 1 }}>{currentIndex}/{total}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>ANSWERED</div>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ maxWidth: 820, margin: '10px auto 0' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,.15)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#16A34A,#4ADE80)', width: `${((currentIndex + 1) / total) * 100}%`, transition: 'width .3s' }} />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div style={{ flex: 1, maxWidth: 820, margin: '0 auto', width: '100%', padding: '28px 20px' }}>
        {alert && <Alert type="error" onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        <div className="dp-card" style={{ padding: 30, marginBottom: 18 }}>
          {/* Question header badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 8 }}>
            <span className="dp-badge dp-badge--blue">Question {currentIndex + 1} of {total}</span>
            <span className="dp-badge" style={{ background: q.type === 'true_false' ? '#DBEAFE' : '#DCFCE7', color: q.type === 'true_false' ? '#1D4ED8' : '#15803D' }}>
              {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'true_false' ? 'True / False' : 'Short Answer'}
            </span>
          </div>

          {/* Question text */}
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(16px,2.5vw,20px)', color: '#0D1F35', lineHeight: 1.6, marginBottom: 26 }}>
            {q.question_text}
          </h2>

          {/* MCQ options */}
          {q.type === 'mcq' && q.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map((opt, i) => (
                <div key={i}
                  onClick={() => pick(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    borderRadius: 10, border: `1.5px solid ${selectedAnswer === i ? '#16A34A' : '#D5E3F3'}`,
                    background: selectedAnswer === i ? '#F0FDF4' : '#fff',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                  onMouseEnter={e => { if (selectedAnswer !== i) e.currentTarget.style.borderColor = '#7A96B4'; }}
                  onMouseLeave={e => { if (selectedAnswer !== i) e.currentTarget.style.borderColor = '#D5E3F3'; }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, transition: 'all .2s',
                    background: selectedAnswer === i ? '#16A34A' : '#E5E7EB',
                    color: selectedAnswer === i ? '#fff' : '#7A96B4',
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ flex: 1, lineHeight: 1.5, fontSize: 14, color: '#0D1F35', fontWeight: selectedAnswer === i ? 600 : 400 }}>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* True / False */}
          {q.type === 'true_false' && (
            <div style={{ display: 'flex', gap: 14 }}>
              {[true, false].map(val => (
                <div key={String(val)}
                  onClick={() => pick(val)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '24px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s',
                    border: `1.5px solid ${selectedAnswer === val ? '#16A34A' : '#D5E3F3'}`,
                    background: selectedAnswer === val ? '#F0FDF4' : '#fff',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{val ? '✅' : '❌'}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: selectedAnswer === val ? '#15803D' : '#0D1F35' }}>
                    {val ? 'True' : 'False'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Short answer */}
          {q.type === 'short_answer' && (
            <textarea className="dp-textarea" rows={4}
              placeholder="Type your answer here…"
              value={selectedAnswer || ''}
              onChange={e => pick(e.target.value)}
            />
          )}
        </div>

        {/* Navigation row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="dp-btn dp-btn--ghost dp-btn--sm"
            onClick={handleBack}
            disabled={currentIndex === 0 || submitting} style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}>
            ← Previous
          </button>

          {/* Progress dots — reflect what's happened, not clickable (later questions aren't decided yet) */}
          <div className="dp-exam-dots" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i}
                style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, transition: 'all .2s',
                  background: i === currentIndex ? '#0D1F35' : i < currentIndex ? '#16A34A' : '#D5E3F3',
                  color: i <= currentIndex ? '#fff' : '#7A96B4',
                }}>
                {i + 1}
              </div>
            ))}
          </div>

          <button className={currentIndex < total - 1 ? 'dp-btn dp-btn--primary dp-btn--sm' : 'dp-btn dp-btn--success dp-btn--sm'}
            onClick={handleNext}
            disabled={submitting || selectedAnswer === null || selectedAnswer === undefined}
            style={{ opacity: (selectedAnswer === null || selectedAnswer === undefined) ? 0.55 : 1 }}>
            {submitting ? 'Saving…' : currentIndex < total - 1 ? 'Next →' : '✅ Submit Exam'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#7A96B4', fontSize: 13, marginTop: 14 }}>
          Pass mark: {exam.pass_mark}% · Attempt {(exam.attempts_used || 0) + 1} of {exam.max_attempts || 3}
        </p>
      </div>
    </div>
  );
}
