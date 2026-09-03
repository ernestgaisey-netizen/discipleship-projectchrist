import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect } from 'react';
import courseService from '../services/courseService';
import examService from '../services/examService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const TYPE_LABELS = { mcq: 'MCQ', true_false: 'True/False', short_answer: 'Short Answer' };
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const EMPTY_MANUAL = {
  type: 'mcq', question_text: '', options: ['', '', '', ''], correct_answer: null,
  keywords: '', explanation: '', points: 1, difficulty: 'medium', topic: '',
};

export default function AdminQuestionsPage({ user }) {
  const [courses, setCourses]     = useState([]);
  const [modules, setModules]     = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courseId, setCourseId]   = useState('');
  const [moduleId, setModuleId]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [alert, setAlert]         = useState(null);
  const [genCount, setGenCount]   = useState(5);
  const [examId, setExamId]       = useState(null);
  const [topics, setTopics]       = useState([]);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual]       = useState(EMPTY_MANUAL);
  const [manualSaving, setManualSaving] = useState(false);

  useEffect(() => {
    courseService.list()
      .then(d => setCourses(Array.isArray(d) ? d : (d.data || [])))
      .catch(() => {});
  }, []);

  const handleCourseChange = async (id) => {
    setCourseId(id); setModuleId(''); setQuestions([]);
    if (!id) { setModules([]); return; }
    const detail = await courseService.get(id).catch(() => null);
    setModules(detail?.modules || []);
  };

  const handleModuleChange = async (id) => {
    setModuleId(id); setQuestions([]); setExamId(null); setTopics([]); setShowManual(false);
    if (!id) return;
    setLoading(true);
    examService.questionBank(id)
      .then(d => {
        setQuestions(Array.isArray(d) ? d : (d.questions || []));
        setExamId(d.exam?.id || null);
        setTopics(d.topics || []);
        setManual({ ...EMPTY_MANUAL, topic: d.topics?.[0] || '' });
      })
      .catch(e => setAlert({ type: 'error', msg: e.message }))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (q) => {
    try {
      await (q.status === 'approved' ? examService.rejectQuestion(q.id) : examService.approveQuestion(q.id));
      setQuestions(prev => prev.map(x => x.id === q.id
        ? { ...x, status: x.status === 'approved' ? 'pending' : 'approved' } : x));
    } catch (e) { setAlert({ type: 'error', msg: e.message }); }
  };

  const handleTagChange = async (id, field, value) => {
    setQuestions(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
    try {
      await examService.updateQuestion(id, { [field]: value });
    } catch (e) { setAlert({ type: 'error', msg: e.message }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await examService.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (e) { setAlert({ type: 'error', msg: e.message }); }
  };

  const handleCreateManual = async () => {
    if (!examId || !manual.question_text.trim()) {
      setAlert({ type: 'error', msg: 'Question text is required.' }); return;
    }
    if (manual.type !== 'short_answer' && (manual.correct_answer === null || manual.correct_answer === undefined)) {
      setAlert({ type: 'error', msg: 'Select the correct answer.' }); return;
    }

    const payload = {
      exam_id:        examId,
      type:           manual.type,
      question_text:  manual.question_text.trim(),
      explanation:    manual.explanation.trim() || null,
      points:         manual.points || 1,
      difficulty:     manual.difficulty,
      topic:          manual.topic || null,
    };
    if (manual.type === 'mcq') {
      payload.options = manual.options.map(o => o.trim());
      payload.correct_answer = manual.correct_answer;
    } else if (manual.type === 'true_false') {
      payload.correct_answer = manual.correct_answer;
    } else {
      payload.correct_answer = manual.keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    setManualSaving(true);
    try {
      await examService.createQuestion(payload);
      setAlert({ type: 'success', msg: 'Question added.' });
      setManual({ ...EMPTY_MANUAL, topic: topics[0] || '' });
      setShowManual(false);
      handleModuleChange(moduleId);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally { setManualSaving(false); }
  };

  const handleGenerate = async () => {
    if (!moduleId) return;
    setGenLoading(true);
    try {
      const res = await examService.generateQuestions(moduleId, genCount);
      setAlert({ type: 'success', msg: `${res.count || genCount} questions generated — review and approve below.` });
      handleModuleChange(moduleId);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally { setGenLoading(false); }
  };

  const approved = questions.filter(q => q.status === 'approved').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Selectors */}
      <div className="dp-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="dp-form-group" style={{ margin: 0 }}>
            <label className="dp-label">Course</label>
            <select className="dp-select" value={courseId} onChange={e => handleCourseChange(e.target.value)}>
              <option value="">— Select a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="dp-form-group" style={{ margin: 0 }}>
            <label className="dp-label">Module</label>
            <select className="dp-select" value={moduleId} onChange={e => handleModuleChange(e.target.value)} disabled={!modules.length}>
              <option value="">— Select a module —</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.order_index}. {m.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* AI generate */}
      {moduleId && (
        <div className="dp-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, background: '#f0f7ff' }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <span style={{ flex: 1, fontSize: 14 }}>Generate questions with AI</span>
          <input
            type="number" min={1} max={30} value={genCount}
            onChange={e => setGenCount(+e.target.value)}
            className="dp-input" style={{ width: 64 }}
          />
          <span style={{ fontSize: 13, color: 'var(--dp-gray)' }}>questions</span>
          <button
            className="dp-btn dp-btn--primary dp-btn--sm"
            onClick={handleGenerate} disabled={genLoading}
          >{genLoading ? 'Generating…' : 'Generate'}</button>
        </div>
      )}

      {/* Manual add */}
      {moduleId && !showManual && (
        <button className="dp-btn dp-btn--secondary dp-btn--sm" style={{ marginBottom: 20 }}
          onClick={() => setShowManual(true)}>
          ✏️ Add Question Manually
        </button>
      )}

      {moduleId && showManual && (
        <div className="dp-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>✏️ Add Question Manually</h3>
            <button className="dp-btn dp-btn--ghost dp-btn--sm" onClick={() => setShowManual(false)}>✕</button>
          </div>

          <div className="dp-form-group">
            <label className="dp-label">Type</label>
            <select className="dp-select" value={manual.type}
              onChange={e => setManual(m => ({ ...m, type: e.target.value, correct_answer: null }))}>
              <option value="mcq">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>

          <div className="dp-form-group">
            <label className="dp-label">Question Text</label>
            <textarea className="dp-textarea" rows={2} value={manual.question_text}
              onChange={e => setManual(m => ({ ...m, question_text: e.target.value }))}
              placeholder="Type the question…" />
          </div>

          {manual.type === 'mcq' && (
            <div className="dp-form-group">
              <label className="dp-label">Options — click the radio next to the correct one</label>
              {manual.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input type="radio" name="mcq-correct" checked={manual.correct_answer === i}
                    onChange={() => setManual(m => ({ ...m, correct_answer: i }))} />
                  <input className="dp-input" value={opt}
                    onChange={e => setManual(m => ({ ...m, options: m.options.map((o, idx) => idx === i ? e.target.value : o) }))}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                </div>
              ))}
            </div>
          )}

          {manual.type === 'true_false' && (
            <div className="dp-form-group">
              <label className="dp-label">Correct Answer</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[[true, 'True'], [false, 'False']].map(([val, label]) => (
                  <button key={label} type="button"
                    className={`dp-btn dp-btn--sm ${manual.correct_answer === val ? 'dp-btn--success' : 'dp-btn--ghost'}`}
                    onClick={() => setManual(m => ({ ...m, correct_answer: val }))}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {manual.type === 'short_answer' && (
            <div className="dp-form-group">
              <label className="dp-label">Expected Keywords (comma-separated)</label>
              <input className="dp-input" value={manual.keywords}
                onChange={e => setManual(m => ({ ...m, keywords: e.target.value }))}
                placeholder="e.g. grace, faith, redemption" />
            </div>
          )}

          <div className="dp-form-group">
            <label className="dp-label">Explanation (optional)</label>
            <textarea className="dp-textarea" rows={2} value={manual.explanation}
              onChange={e => setManual(m => ({ ...m, explanation: e.target.value }))}
              placeholder="Why this is the correct answer…" />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div className="dp-form-group" style={{ flex: 1 }}>
              <label className="dp-label">Points</label>
              <input type="number" min={1} className="dp-input" value={manual.points}
                onChange={e => setManual(m => ({ ...m, points: +e.target.value }))} />
            </div>
            <div className="dp-form-group" style={{ flex: 1 }}>
              <label className="dp-label">Difficulty</label>
              <select className="dp-select" value={manual.difficulty}
                onChange={e => setManual(m => ({ ...m, difficulty: e.target.value }))}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="dp-form-group" style={{ flex: 2 }}>
              <label className="dp-label">Topic</label>
              <input className="dp-input" list="topic-suggestions" value={manual.topic}
                onChange={e => setManual(m => ({ ...m, topic: e.target.value }))} />
              <datalist id="topic-suggestions">
                {topics.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>

          <button className="dp-btn dp-btn--primary" style={{ marginTop: 8 }}
            onClick={handleCreateManual} disabled={manualSaving}>
            {manualSaving ? 'Saving…' : '💾 Save Question'}
          </button>
        </div>
      )}

      {/* Question list */}
      {loading ? <Loader /> : questions.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--dp-gray)' }}>
              {questions.length} questions · <strong style={{ color: 'var(--dp-green)' }}>{approved} approved</strong>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.map((q, i) => (
              <div key={q.id} className="dp-card" style={{ padding: '14px 18px', borderLeft: `3px solid ${q.status === 'approved' ? 'var(--dp-green)' : 'var(--dp-border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--dp-gray)', flexShrink: 0, paddingTop: 2 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span className="dp-badge dp-badge--blue">{TYPE_LABELS[q.type] || q.type}</span>
                      <span className={`dp-badge dp-badge--${q.status === 'approved' ? 'green' : 'gray'}`}>{q.status}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{q.question_text}</p>
                    {q.options && (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--dp-gray)' }}>
                        {q.options.map((opt, idx) => (
                          <span key={idx} style={{ marginRight: 12 }}>{String.fromCharCode(65 + idx)}. {opt}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <label style={{ fontSize: 11, color: 'var(--dp-gray)' }}>Difficulty</label>
                      <select className="dp-select" style={{ padding: '3px 8px', fontSize: 12, width: 'auto' }}
                        value={q.difficulty || 'medium'}
                        onChange={e => handleTagChange(q.id, 'difficulty', e.target.value)}>
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <label style={{ fontSize: 11, color: 'var(--dp-gray)', marginLeft: 8 }}>Topic</label>
                      <input className="dp-input" style={{ padding: '3px 8px', fontSize: 12, width: 180 }}
                        placeholder="e.g. God's love — breadth"
                        defaultValue={q.topic || ''}
                        onBlur={e => { if (e.target.value !== (q.topic || '')) handleTagChange(q.id, 'topic', e.target.value || null); }}
                        title="Questions sharing a topic can be picked as a follow-up to one another during the exam" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className={`dp-btn dp-btn--sm ${q.status === 'approved' ? 'dp-btn--ghost' : 'dp-btn--success'}`}
                      onClick={() => handleApprove(q)}
                    >{q.status === 'approved' ? 'Revoke' : 'Approve'}</button>
                    <button className="dp-btn dp-btn--danger dp-btn--sm" onClick={() => handleDelete(q.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : moduleId ? (
        <p style={{ color: 'var(--dp-gray)', textAlign: 'center', padding: 32 }}>No questions for this module yet. Use AI generate above.</p>
      ) : (
        <p style={{ color: 'var(--dp-gray)', textAlign: 'center', padding: 32 }}>Select a course and module to view its question bank.</p>
      )}
      </div>
    </div>
  );
}
