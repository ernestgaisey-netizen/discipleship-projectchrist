import { AdminHeader } from './AdminDashboardPage';
import { useState, useEffect } from 'react';
import courseService from '../services/courseService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const DUR_OPTS = ['15 min', '30 min', '45 min', '60 min', '75 min', '90 min'];

const EMPTY_COURSE = {
  title: '', subtitle: '', description: '', level: 'beginner', emoji: '📖',
  duration_weeks: 4, is_published: false, category: '', instructor_name: '',
  intro_video_url: '', status: 'draft', visibility: 'public',
  objectives: '', target_audience: '', prerequisites: '',
  certificate_enabled: true,
  modules: [],  // inline module builder
};

const EMPTY_MOD = { title: '', dur: '45 min', scriptures: '', content: '', contentMode: 'text', objectives: '', instructor_notes: '', video_url: '' };

// Simple HTML → plain content renderer for preview
function renderContent(raw) {
  if (!raw?.trim()) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw.split(/\n{2,}/).map(b => {
    const t = b.trim();
    if (!t) return '';
    if (t.startsWith('## ') || t.startsWith('# ')) return `<h2>${t.replace(/^#+\s/, '')}</h2>`;
    if (t.startsWith('### ')) return `<h3>${t.slice(4)}</h3>`;
    if (t.startsWith('> ')) return `<blockquote>${t.slice(2)}</blockquote>`;
    if (/^[-*] /.test(t)) return `<ul>${t.split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('')}</ul>`;
    return `<p>${t.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

// Resolve module content to final stored HTML based on the text/html formatting toggle.
// 'text' (default) = auto-format plain writing into headings/paragraphs/lists.
// 'html' = trust the input as-is, no auto-formatting.
function toContentHtml(raw, mode) {
  if (!raw?.trim()) return null;
  return mode === 'html' ? raw : renderContent(raw);
}

// Guess a sensible default mode for content loaded from the backend (already-saved HTML).
const guessContentMode = (html) => (/<[a-z][\s\S]*>/i.test(html || '') ? 'html' : 'text');

// Snap an AI-suggested duration (minutes) to the nearest option in the DURATION select.
const nearestDur = (mins) => {
  const n = Number(mins) || 45;
  return DUR_OPTS.reduce((best, opt) => Math.abs(parseInt(opt) - n) < Math.abs(parseInt(best) - n) ? opt : best, DUR_OPTS[0]);
};

// Map an AI-generated course draft ({ title, ..., modules: [...] }) into the
// create-form shape (EMPTY_COURSE + EMPTY_MOD), so the admin can review/edit
// before saving — nothing here is persisted directly.
const mapAiCourseToForm = (course) => ({
  ...EMPTY_COURSE,
  title:           course.title || '',
  subtitle:        course.subtitle || '',
  description:     course.description || '',
  category:        course.category || '',
  level:           LEVELS.includes(course.level) ? course.level : 'beginner',
  duration_weeks:  course.duration_weeks || (course.modules?.length || 4),
  objectives:      course.objectives || '',
  target_audience: course.target_audience || '',
  prerequisites:   course.prerequisites || '',
  modules: (course.modules || []).map(m => ({
    ...EMPTY_MOD,
    title:            m.title || '',
    dur:              nearestDur(m.duration_minutes),
    scriptures:       Array.isArray(m.scripture_refs) ? m.scripture_refs.join(', ') : (m.scripture_refs || ''),
    content:          m.content || '',
    contentMode:      'html',
    objectives:       m.objectives || '',
    instructor_notes: m.instructor_notes || '',
  })),
});

export default function AdminCoursesPage({ user }) {
  const [courses, setCourses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [alert, setAlert]               = useState(null);
  const [selectedMods, setSelectedMods] = useState(new Set());
  const [bulkPublishing, setBulkPublishing] = useState(false);

  // Modals
  const [editCourse, setEditCourse]   = useState(null);
  const [createOpen, setCreateOpen]   = useState(false);
  const [newCourse, setNewCourse]     = useState(EMPTY_COURSE);
  const [statsCourse, setStatsCourse] = useState(null);
  const [deleteId, setDeleteId]       = useState(null);
  const [editMod, setEditMod]         = useState(null);   // { mod, courseId }
  const [saving, setSaving]           = useState(false);
  const [modSaving, setModSaving]     = useState(false);
  const [thumbnail, setThumbnail]     = useState(null);
  const [extractingMod, setExtractingMod] = useState(null); // module idx (number), 'edit', or null
  const [aiPrompt, setAiPrompt]       = useState('');
  const [aiModuleCount, setAiModuleCount] = useState(5);
  const [aiLoading, setAiLoading]     = useState(false);

  // ── PDF/DOCX → module content ────────────────────────────────────────────
  const extractFileInto = async (file, key, onResult) => {
    setExtractingMod(key);
    try {
      const { mode, content } = await courseService.extractContent(file);
      onResult(mode, content);
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Could not read that file.' });
    } finally {
      setExtractingMod(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Convert array → newline string for textareas; string stays as-is
  const toStr = (v) => Array.isArray(v) ? v.join('\n') : (v || '');

  // Sanitize course data before sending to API:
  // - Convert textarea strings → arrays for json columns
  // - Map status/is_published → is_published boolean
  // - Null-out empty URL fields (nullable, url validator rejects empty strings)
  const prepCourse = (data) => {
    const toArr = (v) => {
      if (Array.isArray(v)) return v.filter(Boolean);
      if (typeof v === 'string') return v.split('\n').map(s => s.trim()).filter(Boolean);
      return [];
    };
    return {
      title:               data.title,
      subtitle:            data.subtitle       || null,
      description:         data.description    || null,
      level:               data.level          || 'beginner',
      emoji:               data.emoji          || null,
      category:            data.category       || null,
      instructor_name:     data.instructor_name || null,
      intro_video_url:     data.intro_video_url?.trim() || null,
      duration_weeks:      data.duration_weeks  ? +data.duration_weeks : null,
      certificate_enabled: data.certificate_enabled ?? true,
      is_published:        data.status === 'published',
      objectives:          toArr(data.objectives),
      target_audience:     toArr(data.target_audience),
      prerequisites:       toArr(data.prerequisites),
    };
  };

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const list = await courseService.list();
      const arr  = Array.isArray(list) ? list : (list.data || []);
      const full = await Promise.all(arr.map(async c => {
        const detail = await courseService.get(c.id).catch(() => null);
        return { ...c, modules: detail?.modules || [] };
      }));
      setCourses(full);
    } catch (e) { setAlert({ type: 'error', msg: e.message }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Bulk ──────────────────────────────────────────────────────────────────

  const toggleMod    = (cId, mId, v) => setSelectedMods(p => { const n = new Set(p); v ? n.add(`${cId}:${mId}`) : n.delete(`${cId}:${mId}`); return n; });
  const toggleAll    = (c, v)        => setSelectedMods(p => { const n = new Set(p); c.modules.forEach(m => v ? n.add(`${c.id}:${m.id}`) : n.delete(`${c.id}:${m.id}`)); return n; });

  const bulkPublish = async (status) => {
    setBulkPublishing(true);
    await Promise.all([...selectedMods].map(k => {
      const mId = +k.split(':')[1];
      return courseService.updateModule(mId, { is_published: status === 'published' }).catch(() => {});
    }));
    setSelectedMods(new Set());
    setBulkPublishing(false);
    load();
  };

  // ── Course CRUD ───────────────────────────────────────────────────────────

  const handleSaveCourse = async (e) => {
    e?.preventDefault(); setSaving(true);
    try {
      if (editCourse?.id) {
        // Edit existing course — strip non-schema fields, convert array fields
        await courseService.update(editCourse.id, prepCourse(editCourse));
        if (thumbnail) await courseService.uploadThumbnail(editCourse.id, thumbnail).catch(() => {});
      } else {
        // Create new course + inline modules
        const saved = await courseService.create(prepCourse(newCourse));
        if (thumbnail && saved?.id) await courseService.uploadThumbnail(saved.id, thumbnail).catch(() => {});
        // Create each inline module in order
        const validMods = (newCourse.modules || []).filter(m => m.title.trim());
        for (let i = 0; i < validMods.length; i++) {
          const m = validMods[i];
          await courseService.createModule(saved.id, {
            title:            m.title.trim(),
            duration_minutes: parseInt(m.dur) || 45,
            content_html:     toContentHtml(m.content, m.contentMode),
            scriptures:       m.scriptures ? m.scriptures.split(',').map(s => s.trim()).filter(Boolean) : [],
            objectives:       m.objectives || null,
            instructor_notes: m.instructor_notes || null,
            video_url:        m.video_url || null,
            order_index:      i + 1,
            is_published:     false,
          }).catch(() => {});
        }
      }
      setEditCourse(null); setCreateOpen(false); setThumbnail(null); setNewCourse(EMPTY_COURSE); setAiPrompt('');
      load();
    } catch (err) { setAlert({ type: 'error', msg: err.message }); }
    finally { setSaving(false); }
  };

  const handleGenerateCourse = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const course = await courseService.generateWithAI(aiPrompt.trim(), aiModuleCount);
      setNewCourse(mapAiCourseToForm(course));
      setAlert({ type: 'success', msg: `AI drafted "${course.title}" with ${course.modules?.length || 0} modules — review and edit below, then Create Course.` });
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleTogglePublish = async (c) => {
    await courseService.update(c.id, { is_published: !c.is_published }).catch(e => setAlert({ type: 'error', msg: e.message }));
    load();
  };

  // ── Module actions ────────────────────────────────────────────────────────

  const handleReorder   = async (_cId, mId, dir) => { await courseService.reorderModule(mId, dir).catch(() => {}); load(); };
  const handleDuplicate = async (_cId, mId)      => { await courseService.duplicateModule(mId).catch(() => {}); load(); };
  const handleDeleteMod = async (_cId, mId)      => {
    if (!window.confirm('Delete this module?')) return;
    await courseService.deleteModule(mId).catch(e => setAlert({ type: 'error', msg: e.message }));
    load();
  };
  const handleSaveMod   = async (e) => {
    e.preventDefault(); setModSaving(true);
    const { contentMode, ...mod } = editMod.mod;
    const payload = { ...mod, content_html: toContentHtml(mod.content_html, contentMode) };
    await courseService.updateModule(editMod.mod.id, payload).catch(e => setAlert({ type: 'error', msg: e.message }));
    setEditMod(null); setModSaving(false); load();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setEC = (k, v) => setEditCourse(p => ({ ...p, [k]: v }));
  const setNC = (k, v) => setNewCourse(p => ({ ...p, [k]: v }));
  const setEM = (k, v) => setEditMod(p => ({ ...p, mod: { ...p.mod, [k]: v } }));

  const btnBase = { border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)', lineHeight: 1 };

  // ── Shared field style ────────────────────────────────────────────────────
  const fld = { width: '100%', padding: '9px 12px', border: '1.5px solid #D5E3F3', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--font-body)' };
  const lbl = { fontSize: 12, fontWeight: 700, color: '#7A96B4', display: 'block', marginBottom: 4 };

  // ── Edit Course Modal (simplified) ────────────────────────────────────────

  const EditCourseModal = () => !editCourse ? null : (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={() => setEditCourse(null)}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.3)' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#0D1F35', marginBottom: 20 }}>✏️ Edit Course</h3>
        <form onSubmit={handleSaveCourse}>
          {[['TITLE *','title',true],['SUBTITLE','subtitle'],['EMOJI','emoji'],['CATEGORY','category'],['INSTRUCTOR NAME','instructor_name'],['INTRO VIDEO URL','intro_video_url']].map(([label,key,req]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={lbl}>{label}</label>
              <input value={editCourse[key]||''} onChange={e=>setEC(key,e.target.value)} required={!!req} style={fld} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            {[['LEVEL','level',[['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']]],['STATUS','status',[['draft','Draft'],['published','Published']]],['VISIBILITY','visibility',[['public','Public'],['private','Private'],['restricted','Restricted']]]].map(([label,key,opts]) => (
              <div key={key} style={{ flex: 1, minWidth: 100 }}>
                <label style={lbl}>{label}</label>
                <select value={editCourse[key]||opts[0][0]} onChange={e=>setEC(key,e.target.value)} style={{ ...fld, padding: '9px 10px' }}>
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div style={{ flex: 1, minWidth: 80 }}>
              <label style={lbl}>DURATION (wks)</label>
              <input type="number" min={1} value={editCourse.duration_weeks||4} onChange={e=>setEC('duration_weeks',+e.target.value)} style={fld} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>CERTIFICATE</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[[true,'✅ Enabled'],[false,'✕ Disabled']].map(([val,l]) => (
                <button key={String(val)} type="button" onClick={()=>setEC('certificate_enabled',val)}
                  style={{ padding:'6px 14px', borderRadius:8, border:`1.5px solid ${editCourse.certificate_enabled===val?(val?'#16A34A':'#DC2626'):'#D5E3F3'}`, background: editCourse.certificate_enabled===val?(val?'#DCFCE7':'#FEF2F2'):'#fff', color: editCourse.certificate_enabled===val?(val?'#166534':'#DC2626'):'#9CA3AF', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:700, fontSize:12 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {[['DESCRIPTION','description',3],['COURSE OBJECTIVES','objectives',2],['TARGET AUDIENCE','target_audience',2],['PREREQUISITES','prerequisites',2]].map(([label,key,rows]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={lbl}>{label}</label>
              <textarea value={editCourse[key]||''} onChange={e=>setEC(key,e.target.value)} rows={rows} style={{ ...fld, resize:'vertical' }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={()=>setEditCourse(null)} style={{ padding:'9px 20px', borderRadius:8, border:'2px solid #D5E3F3', background:'transparent', cursor:'pointer', fontSize:14, fontWeight:600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#16A34A,#0D8A3A)', color:'#fff', cursor:saving?'not-allowed':'pointer', fontSize:14, fontWeight:700, opacity:saving?0.7:1 }}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Create Course Modal (full — matches original) ─────────────────────────

  const CreateCourseModal = () => !createOpen ? null : (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={()=>{ setCreateOpen(false); setNewCourse(EMPTY_COURSE); setAiPrompt(''); }}>
      <div style={{ background:'#fff', borderRadius:18, padding:32, width:'100%', maxWidth:620, boxShadow:'0 24px 80px rgba(0,0,0,.3)', maxHeight:'92vh', overflowY:'auto' }}
        onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'#0D1F35', marginBottom:20 }}>📚 Create New Course</h3>

        {/* AI course draft */}
        <div style={{ padding:'14px 16px', marginBottom:20, background:'#F0F7FF', border:'1.5px solid #BFDBFE', borderRadius:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>✨</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#0D1F35' }}>Generate Course with AI</span>
          </div>
          <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} rows={2}
            placeholder="e.g. A 6-week course on prayer and spiritual disciplines for new believers"
            style={{ ...fld, resize:'vertical', marginBottom:8, background:'#fff' }} />
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <label style={{ fontSize:12, color:'#7A96B4', fontWeight:600 }}>Modules</label>
            <input type="number" min={1} max={16} value={aiModuleCount} onChange={e=>setAiModuleCount(+e.target.value)}
              style={{ width:56, padding:'6px 8px', border:'1.5px solid #D5E3F3', borderRadius:7, fontSize:13 }} />
            <button type="button" disabled={!aiPrompt.trim() || aiLoading} onClick={handleGenerateCourse}
              style={{ padding:'7px 16px', borderRadius:8, border:'none', background:(!aiPrompt.trim()||aiLoading)?'#9CA3AF':'linear-gradient(135deg,#2176AE,#1B4F8A)', color:'#fff', cursor:(!aiPrompt.trim()||aiLoading)?'not-allowed':'pointer', fontSize:13, fontWeight:700 }}>
              {aiLoading ? '✨ Generating…' : '✨ Generate'}
            </button>
            <span style={{ fontSize:11, color:'#7A96B4' }}>Fills in the form below — review and edit before creating.</span>
          </div>
        </div>

        {/* Thumbnail */}
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>COURSE CARD IMAGE</label>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:72, height:52, borderRadius:8, background:'linear-gradient(135deg,#0D1F35,#1B4F8A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
              {newCourse.emoji||'📖'}
            </div>
            <label style={{ cursor:'pointer', background:'#EFF6FF', color:'#2176AE', border:'1.5px solid #BFDBFE', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700 }}>
              📷 Upload Image
              <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]) setThumbnail(e.target.files[0]); }} />
            </label>
            {thumbnail && <span style={{ fontSize:11, color:'#16A34A' }}>✅ {thumbnail.name}</span>}
          </div>
        </div>

        {/* Core text fields */}
        {[['COURSE TITLE *','title',true],['SUBTITLE','subtitle'],['DURATION (e.g. 4 weeks)','duration_weeks'],['CATEGORY','category'],['INSTRUCTOR NAME','instructor_name'],['INTRO VIDEO URL','intro_video_url']].map(([label,key,req]) => (
          <div key={key} style={{ marginBottom:12 }}>
            <label style={lbl}>{label.toUpperCase()}</label>
            <input value={newCourse[key]||''} onChange={e=>setNC(key,e.target.value)} required={!!req} style={fld} />
          </div>
        ))}

        {/* Level / Status / Visibility / Emoji row */}
        <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
          {[['LEVEL','level',[['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']]],['STATUS','status',[['draft','Draft'],['published','Published']]],['VISIBILITY','visibility',[['public','Public'],['private','Private'],['restricted','Restricted']]]].map(([label,key,opts]) => (
            <div key={key} style={{ flex:1, minWidth:100 }}>
              <label style={lbl}>{label}</label>
              <select value={newCourse[key]||opts[0][0]} onChange={e=>setNC(key,e.target.value)} style={{ ...fld, padding:'9px 10px' }}>
                {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <div style={{ flex:1, minWidth:80 }}>
            <label style={lbl}>EMOJI</label>
            <input value={newCourse.emoji} onChange={e=>setNC('emoji',e.target.value)} style={fld} />
          </div>
        </div>

        {/* Certificate */}
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>CERTIFICATE</label>
          <div style={{ display:'flex', gap:8 }}>
            {[[true,'✅ Enabled'],[false,'✕ Disabled']].map(([val,l]) => (
              <button key={String(val)} type="button" onClick={()=>setNC('certificate_enabled',val)}
                style={{ padding:'6px 14px', borderRadius:8, border:`1.5px solid ${newCourse.certificate_enabled===val?(val?'#16A34A':'#DC2626'):'#D5E3F3'}`, background:newCourse.certificate_enabled===val?(val?'#DCFCE7':'#FEF2F2'):'#fff', color:newCourse.certificate_enabled===val?(val?'#166534':'#DC2626'):'#9CA3AF', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:700, fontSize:12 }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Textareas */}
        {[['DESCRIPTION','description',2],['COURSE OBJECTIVES','objectives',2],['TARGET AUDIENCE','target_audience',2],['PREREQUISITES / REQUIREMENTS','prerequisites',2]].map(([label,key,rows]) => (
          <div key={key} style={{ marginBottom:12 }}>
            <label style={lbl}>{label}</label>
            <textarea value={newCourse[key]||''} onChange={e=>setNC(key,e.target.value)} rows={rows} style={{ ...fld, resize:'vertical' }} />
          </div>
        ))}

        {/* ── Inline module builder ── */}
        <div style={{ borderTop:'2px solid #EEF4FB', paddingTop:18, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:15, fontWeight:700, color:'#0D1F35' }}>📋 Modules</div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Add lessons for this course.</div>
            </div>
            <button type="button"
              onClick={()=>setNC('modules',[...newCourse.modules, { ...EMPTY_MOD }])}
              style={{ padding:'7px 14px', background:'#EFF6FF', color:'#2176AE', border:'1.5px solid #BFDBFE', borderRadius:8, cursor:'pointer', fontSize:13, fontFamily:'var(--font-body)', fontWeight:700 }}>
              + Add Module
            </button>
          </div>

          {newCourse.modules.length === 0 && (
            <div style={{ textAlign:'center', padding:20, background:'#F9FAFB', borderRadius:10, border:'1.5px dashed #D5E3F3', color:'#9CA3AF', fontSize:13 }}>
              No modules yet. Click <strong>+ Add Module</strong> to create the first lesson.
            </div>
          )}

          {newCourse.modules.map((mod, idx) => (
            <div key={idx} style={{ background:'#F4F8FF', borderRadius:10, border:'1.5px solid #D5E3F3', padding:'14px 16px', marginBottom:10 }}>
              {/* Header row */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'#2176AE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>{idx+1}</div>
                <div style={{ flex:1, fontWeight:700, fontSize:13, color:'#0D1F35' }}>Module {idx+1}</div>
                <button type="button" onClick={()=>setNC('modules', newCourse.modules.filter((_,i)=>i!==idx))}
                  style={{ background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', borderRadius:6, padding:'3px 9px', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                  ✕ Remove
                </button>
              </div>

              {/* Title + Duration */}
              <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                <div style={{ flex:3 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#7A96B4', display:'block', marginBottom:3 }}>MODULE TITLE *</label>
                  <input value={mod.title} onChange={e=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,title:e.target.value}:m))}
                    placeholder="e.g. Understanding God's Love"
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #D5E3F3', borderRadius:7, fontSize:13, fontFamily:'var(--font-body)', boxSizing:'border-box' }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#7A96B4', display:'block', marginBottom:3 }}>DURATION</label>
                  <select value={mod.dur} onChange={e=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,dur:e.target.value}:m))}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #D5E3F3', borderRadius:7, fontSize:13, fontFamily:'var(--font-body)' }}>
                    {DUR_OPTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Scripture refs */}
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#7A96B4', display:'block', marginBottom:3 }}>
                  SCRIPTURE REFERENCES <span style={{ fontWeight:400, color:'#B0BEC5' }}>(comma-separated)</span>
                </label>
                <input value={mod.scriptures} onChange={e=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,scriptures:e.target.value}:m))}
                  placeholder="e.g. John 3:16, Romans 8:28"
                  style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #D5E3F3', borderRadius:7, fontSize:13, fontFamily:'var(--font-body)', boxSizing:'border-box' }} />
              </div>

              {/* Learning objectives */}
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#7A96B4', display:'block', marginBottom:3 }}>LEARNING OBJECTIVES</label>
                <textarea value={mod.objectives||''} onChange={e=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,objectives:e.target.value}:m))}
                  rows={2} placeholder="What students will learn..."
                  style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #D5E3F3', borderRadius:7, fontSize:12, fontFamily:'var(--font-body)', resize:'vertical', boxSizing:'border-box' }} />
              </div>

              {/* Instructor notes */}
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#7A96B4', display:'block', marginBottom:3 }}>
                  INSTRUCTOR NOTES <span style={{ fontWeight:400, color:'#B0BEC5' }}>(admin-only)</span>
                </label>
                <textarea value={mod.instructor_notes||''} onChange={e=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,instructor_notes:e.target.value}:m))}
                  rows={2} placeholder="Private notes for instructors..."
                  style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #FDE68A', borderRadius:7, fontSize:12, fontFamily:'var(--font-body)', resize:'vertical', boxSizing:'border-box', background:'#FFFBEB' }} />
              </div>

              {/* Video URL */}
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#7A96B4', display:'block', marginBottom:3 }}>
                  VIDEO URL <span style={{ fontWeight:400, color:'#B0BEC5' }}>(YouTube / Vimeo)</span>
                </label>
                <input value={mod.video_url||''} onChange={e=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,video_url:e.target.value}:m))}
                  placeholder="https://youtube.com/watch?v=..."
                  style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #D5E3F3', borderRadius:7, fontSize:12, fontFamily:'var(--font-body)', boxSizing:'border-box' }} />
              </div>

              {/* Content + TEXT/HTML toggle + preview */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4, flexWrap:'wrap', gap:6 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#7A96B4' }}>MODULE CONTENT</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="file" accept=".pdf,.docx" id={`mod-upload-${idx}`} style={{ display:'none' }}
                      onChange={e => {
                        const file = e.target.files[0]; e.target.value = '';
                        if (!file) return;
                        extractFileInto(file, idx, (mode, content) =>
                          setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,content,contentMode:mode}:m)));
                      }} />
                    <label htmlFor={`mod-upload-${idx}`}
                      style={{ padding:'2px 10px', fontSize:11, fontWeight:700, borderRadius:5, border:'1.5px solid #D5E3F3', background:'#fff', color:'#7A96B4', cursor:'pointer' }}>
                      {extractingMod===idx ? '⏳ Reading…' : '📄 Upload PDF/DOCX'}
                    </label>
                    <div style={{ display:'flex', gap:4 }}>
                    {['text','html'].map(mode => (
                      <button key={mode} type="button"
                        onClick={()=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,contentMode:mode}:m))}
                        style={{ padding:'2px 10px', fontSize:11, fontWeight:700, borderRadius:5, border:`1.5px solid ${(mod.contentMode||'text')===mode?'#2176AE':'#D5E3F3'}`, background:(mod.contentMode||'text')===mode?'#EBF4FB':'#fff', color:(mod.contentMode||'text')===mode?'#2176AE':'#7A96B4', cursor:'pointer', textTransform:'uppercase' }}>
                        {mode}
                      </button>
                    ))}
                    </div>
                  </div>
                </div>
                <textarea value={mod.content||''} onChange={e=>setNC('modules', newCourse.modules.map((m,i)=>i===idx?{...m,content:e.target.value}:m))}
                  rows={4} placeholder={(mod.contentMode||'text')==='html' ? '<h2>Title</h2>\n<p>Content…</p>' : 'Write the lesson content here…'}
                  style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #D5E3F3', borderRadius:7, fontSize:12, fontFamily:(mod.contentMode||'text')==='html'?'monospace':'var(--font-body)', resize:'vertical', boxSizing:'border-box', lineHeight:1.55 }} />
                {(mod.content||'').trim() && (
                  <div style={{ marginTop:6, border:'1.5px solid #D5E3F3', borderRadius:7, overflow:'hidden' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#7A96B4', padding:'4px 10px', background:'#F4F8FF', borderBottom:'1px solid #D5E3F3', textTransform:'uppercase', letterSpacing:.5 }}>Preview</div>
                    <div style={{ padding:'10px 14px' }}>
                      <div className="dp-content" dangerouslySetInnerHTML={{ __html: renderContent(mod.content) }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4, flexWrap:'wrap' }}>
          <button type="button" onClick={()=>{ setCreateOpen(false); setNewCourse(EMPTY_COURSE); setAiPrompt(''); }}
            style={{ padding:'9px 20px', borderRadius:8, border:'2px solid #D5E3F3', background:'transparent', cursor:'pointer', fontSize:14, fontWeight:600 }}>
            Cancel
          </button>
          <button type="button" disabled={!newCourse.title.trim() || saving} onClick={handleSaveCourse}
            style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#16A34A,#0D8A3A)', color:'#fff', cursor:(!newCourse.title.trim()||saving)?'not-allowed':'pointer', fontSize:14, fontWeight:700, opacity:(!newCourse.title.trim()||saving)?0.5:1 }}>
            {saving ? 'Creating…' : `✅ Create Course${newCourse.modules.filter(m=>m.title.trim()).length>0 ? ` with ${newCourse.modules.filter(m=>m.title.trim()).length} module${newCourse.modules.filter(m=>m.title.trim()).length>1?'s':''}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dp-bg)' }}>
      <AdminHeader user={user} />
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '26px 24px', width: '100%' }}>

        {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 11 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: '#0D1F35', margin: 0 }}>Course Management</h2>
          <button onClick={() => { setCreateOpen(true); setThumbnail(null); }}
            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#16A34A,#0D8A3A)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            + Create New Course
          </button>
        </div>

        {/* Bulk action bar */}
        {selectedMods.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1B4F8A', flex: 1 }}>
              {selectedMods.size} module{selectedMods.size > 1 ? 's' : ''} selected
            </span>
            <button onClick={() => bulkPublish('published')} disabled={bulkPublishing}
              style={{ ...btnBase, background: '#DCFCE7', color: '#166534', border: '1.5px solid #86EFAC', padding: '6px 14px', fontSize: 12, opacity: bulkPublishing ? 0.6 : 1 }}>
              {bulkPublishing ? 'Publishing…' : '✅ Publish All'}
            </button>
            <button onClick={() => bulkPublish('draft')} disabled={bulkPublishing}
              style={{ ...btnBase, background: '#FEF3C7', color: '#92400E', border: '1.5px solid #FCD34D', padding: '6px 14px', fontSize: 12, opacity: bulkPublishing ? 0.6 : 1 }}>
              🟡 Set to Draft
            </button>
            <button onClick={() => setSelectedMods(new Set())}
              style={{ ...btnBase, background: '#F4F8FF', color: '#7A96B4', border: '1px solid #D5E3F3', padding: '6px 10px', fontSize: 12 }}>
              ✕ Clear
            </button>
          </div>
        )}

        {/* Course list */}
        {loading ? <Loader /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {courses.length === 0 && (
              <p style={{ textAlign: 'center', color: '#7A96B4', padding: 48 }}>No courses yet.</p>
            )}

            {courses.map(c => {
              const allKeys     = c.modules.map(m => `${c.id}:${m.id}`);
              const allSelected = allKeys.length > 0 && allKeys.every(k => selectedMods.has(k));

              return (
                <div key={c.id} className="dp-card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                  {/* Emoji / thumbnail icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 11, background: c.gradient || 'linear-gradient(135deg,#0D1F35,#1B4F8A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                    {c.thumbnail_url
                      ? <img src={`/uploads/public/${c.thumbnail_url}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : c.emoji || '📖'}
                  </div>

                  {/* Main content */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {/* Title + badges */}
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#0D1F35', margin: 0 }}>{c.title}</h3>
                      <span className="dp-badge dp-badge--blue">{c.level}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#7A96B4', marginBottom: 9, lineHeight: 1.5 }}>{c.description || c.subtitle || ''}</p>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#7A96B4', flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
                      <span>📋 {c.modules.length} modules</span>
                      <span>👥 {(c.enrollment_count || 0).toLocaleString()}</span>
                      {c.duration_weeks && <span>⏱ {c.duration_weeks} weeks</span>}
                      {c.modules.length > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 'auto', fontWeight: 600, color: '#2176AE', userSelect: 'none' }}>
                          <input type="checkbox" checked={allSelected} onChange={e => toggleAll(c, e.target.checked)}
                            style={{ width: 13, height: 13, accentColor: '#2176AE' }} />
                          Select all
                        </label>
                      )}
                    </div>

                    {/* Module rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {c.modules.map(m => {
                        const selKey    = `${c.id}:${m.id}`;
                        const isChecked = selectedMods.has(selKey);
                        const pub       = m.is_published;
                        return (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', background: isChecked ? '#EFF6FF' : '#F4F8FF', borderRadius: 8, fontSize: 12, border: isChecked ? '1.5px solid #BFDBFE' : '1.5px solid transparent', flexWrap: 'wrap' }}>
                            <input type="checkbox" checked={isChecked} onChange={e => toggleMod(c.id, m.id, e.target.checked)}
                              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#2176AE', flexShrink: 0 }} />
                            <span style={{ color: pub ? '#16A34A' : '#F59E0B' }}>▶</span>
                            <span style={{ flex: 1, color: '#0D1F35', fontWeight: 500 }}>Mod {m.order_index || m.order}: {m.title}</span>
                            {m.duration_minutes && <span style={{ color: '#7A96B4' }}>{m.duration_minutes}min</span>}
                            <span className="dp-badge" style={{ fontSize: 10, background: pub ? '#DCFCE7' : '#FEF3C7', color: pub ? '#166534' : '#92400E' }}>
                              {pub ? '✅ Live' : '🟡 Draft'}
                            </span>
                            <span className="dp-badge dp-badge--green" style={{ fontSize: 10 }}>
                              📝 {m.exam_questions_count || 0}Q bank
                            </span>
                            {/* Module action buttons */}
                            <button onClick={() => handleReorder(c.id, m.id, 'up')}   title="Move up"    style={{ ...btnBase, background: '#F4F8FF', color: '#7A96B4', border: '1px solid #D5E3F3', padding: '2px 6px', fontSize: 11 }}>▲</button>
                            <button onClick={() => handleReorder(c.id, m.id, 'down')} title="Move down"  style={{ ...btnBase, background: '#F4F8FF', color: '#7A96B4', border: '1px solid #D5E3F3', padding: '2px 6px', fontSize: 11 }}>▼</button>
                            <button onClick={() => setEditMod({ mod: { ...m, contentMode: guessContentMode(m.content_html) }, courseId: c.id })}
                              style={{ ...btnBase, background: '#EBF4FB', color: '#2176AE', border: '1px solid #BFDBFE', padding: '2px 8px', fontSize: 11, whiteSpace: 'nowrap' }}>✏️ Edit</button>
                            <button onClick={() => handleDuplicate(c.id, m.id)} title="Duplicate"
                              style={{ ...btnBase, background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC', padding: '2px 7px', fontSize: 11 }}>⧉</button>
                            <button onClick={() => handleDeleteMod(c.id, m.id)} title="Delete"
                              style={{ ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '2px 6px', fontSize: 11 }}>🗑</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right-side course actions — Edit · Stats · Delete (matches original) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
                    <button className="dp-btn dp-btn--secondary dp-btn--sm" onClick={() => {
                      setEditCourse({
                        ...c,
                        status:          c.is_published ? 'published' : 'draft',
                        objectives:      toStr(c.objectives),
                        target_audience: toStr(c.target_audience),
                        prerequisites:   toStr(c.prerequisites),
                      });
                      setThumbnail(null);
                    }}>✏️ Edit</button>
                    <button onClick={() => setStatsCourse(c)}
                      style={{ ...btnBase, padding: '6px 13px', background: '#EFF6FF', color: '#2D7DD2', border: '1px solid #BFDBFE', fontSize: 12, borderRadius: 8, fontWeight: 600 }}>📊 Stats</button>
                    <button onClick={() => setDeleteId(c.id)}
                      style={{ ...btnBase, padding: '6px 13px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 12, borderRadius: 8, fontWeight: 600 }}>🗑 Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Edit / Create Course Modals (called as functions, not components) ── */}
        {EditCourseModal()}
        {CreateCourseModal()}

        {/* ── Stats Modal ── */}
        {statsCourse && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setStatsCourse(null)}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,0,0,.3)', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: 'linear-gradient(135deg,#0D1F35,#1B4F8A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{statsCourse.emoji || '📖'}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#0D1F35', margin: 0 }}>{statsCourse.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#DBEAFE', color: '#1D4ED8', textTransform: 'capitalize' }}>{statsCourse.level}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['👥', 'Enrolled Students', (statsCourse.enrollment_count || 0).toLocaleString()],
                  ['📋', 'Total Modules',     statsCourse.modules?.length || 0],
                  ['⏱', 'Duration',          `${statsCourse.duration_weeks || '—'} weeks`],
                  ['📊', 'Pass Mark',         '70%'],
                  ['🏅', 'Status',            statsCourse.is_published ? 'Published' : 'Draft'],
                  ['📝', 'Level',             statsCourse.level],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ padding: 13, background: '#F4F8FF', borderRadius: 10, border: '1px solid #D5E3F3' }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                    <div style={{ fontSize: 11, color: '#7A96B4', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-title)', fontSize: 15, fontWeight: 700, color: '#0D1F35' }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12, fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600 }}>Module Breakdown</div>
              {(statsCourse.modules || []).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F4F8FF', borderRadius: 8, marginBottom: 5, fontSize: 13 }}>
                  <span style={{ color: '#0D1F35', fontWeight: 500 }}>Mod {m.order_index || m.order}: {m.title}</span>
                  <span style={{ color: '#7A96B4' }}>{m.duration_minutes}min</span>
                </div>
              ))}
              <button onClick={() => setStatsCourse(null)}
                style={{ marginTop: 20, width: '100%', padding: 10, borderRadius: 8, border: '2px solid #D5E3F3', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Delete Confirm ── */}
        {deleteId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setDeleteId(null)}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.3)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗑</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#0D1F35', marginBottom: 8 }}>Delete Course?</h3>
              <p style={{ color: '#7A96B4', fontSize: 14, marginBottom: 24 }}>
                Permanently remove <strong style={{ color: '#DC2626' }}>{courses.find(c => c.id === deleteId)?.title}</strong> and all its modules.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setDeleteId(null)}
                  style={{ padding: '10px 22px', borderRadius: 8, border: '2px solid #D5E3F3', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
                <button onClick={async () => {
                    try {
                      await courseService.remove(deleteId);
                      setDeleteId(null);
                      load();
                    } catch (e) {
                      setDeleteId(null);
                      setAlert({ type: 'error', msg: e.message || 'Delete failed.' });
                    }
                  }}
                  style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Module Modal ── */}
        {editMod && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setEditMod(null)}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.3)' }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#0D1F35', marginBottom: 20 }}>✏️ Edit Module</h3>
              <form onSubmit={handleSaveMod}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 3 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#7A96B4', display: 'block', marginBottom: 4 }}>TITLE *</label>
                    <input value={editMod.mod.title || ''} onChange={e => setEM('title', e.target.value)} required
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D5E3F3', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#7A96B4', display: 'block', marginBottom: 4 }}>DURATION (min)</label>
                    <input type="number" min={1} value={editMod.mod.duration_minutes || 30} onChange={e => setEM('duration_minutes', +e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D5E3F3', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#7A96B4', display: 'block', marginBottom: 6 }}>STATUS</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[['✅ Published', true], ['🟡 Draft', false]].map(([label, val]) => (
                      <button key={label} type="button" onClick={() => setEM('is_published', val)}
                        style={{ padding: '7px 18px', borderRadius: 8, border: `1.5px solid ${editMod.mod.is_published === val ? (val ? '#16A34A' : '#F59E0B') : '#D5E3F3'}`, background: editMod.mod.is_published === val ? (val ? '#DCFCE7' : '#FEF3C7') : '#fff', color: editMod.mod.is_published === val ? (val ? '#166534' : '#92400E') : '#7A96B4', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#7A96B4' }}>MODULE CONTENT</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="file" accept=".pdf,.docx" id="mod-upload-edit" style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files[0]; e.target.value = '';
                          if (!file) return;
                          extractFileInto(file, 'edit', (mode, content) => {
                            setEM('contentMode', mode);
                            setEM('content_html', content);
                          });
                        }} />
                      <label htmlFor="mod-upload-edit"
                        style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, borderRadius: 5, border: '1.5px solid #D5E3F3', background: '#fff', color: '#7A96B4', cursor: 'pointer' }}>
                        {extractingMod === 'edit' ? '⏳ Reading…' : '📄 Upload PDF/DOCX'}
                      </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['text', 'html'].map(mode => (
                        <button key={mode} type="button" onClick={() => setEM('contentMode', mode)}
                          style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, borderRadius: 5, border: `1.5px solid ${(editMod.mod.contentMode || 'text') === mode ? '#2176AE' : '#D5E3F3'}`, background: (editMod.mod.contentMode || 'text') === mode ? '#EBF4FB' : '#fff', color: (editMod.mod.contentMode || 'text') === mode ? '#2176AE' : '#7A96B4', cursor: 'pointer', textTransform: 'uppercase' }}>
                          {mode}
                        </button>
                      ))}
                    </div>
                    </div>
                  </div>
                  <textarea value={editMod.mod.content_html || ''} onChange={e => setEM('content_html', e.target.value)} rows={8}
                    placeholder={(editMod.mod.contentMode || 'text') === 'html' ? '<h2>Title</h2>\n<p>Content…</p>' : 'Write the lesson content here…'}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D5E3F3', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: (editMod.mod.contentMode || 'text') === 'html' ? 'monospace' : 'var(--font-body)', lineHeight: 1.55 }} />
                  {(editMod.mod.content_html || '').trim() && (
                    <div style={{ marginTop: 6, border: '1.5px solid #D5E3F3', borderRadius: 7, overflow: 'hidden' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#7A96B4', padding: '4px 10px', background: '#F4F8FF', borderBottom: '1px solid #D5E3F3', textTransform: 'uppercase', letterSpacing: .5 }}>Preview</div>
                      <div style={{ padding: '10px 14px' }}>
                        <div className="dp-content" dangerouslySetInnerHTML={{ __html: toContentHtml(editMod.mod.content_html, editMod.mod.contentMode) }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditMod(null)}
                    style={{ padding: '9px 20px', borderRadius: 8, border: '2px solid #D5E3F3', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={modSaving}
                    style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1B4F8A,#0D3A6A)', color: '#fff', cursor: modSaving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: modSaving ? 0.7 : 1 }}>
                    {modSaving ? 'Saving…' : '💾 Save Module'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
