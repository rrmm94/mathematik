import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Clock, Eye, MessageSquarePlus, Pencil, RotateCcw, Save, Trash2, Unlock, X, Minus, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { LEVELS, PROFILES, DIFFICULTIES } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, ProgressBar, toast, formatDate, formatDuration, MathContent, Empty } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';
import { EditStudent } from './CourseDetail.jsx';

export function LevelBadge({ level, small }) {
  if (level == null) return <span className="text-xs text-slate-400">–</span>;
  const l = LEVELS[level];
  return (
    <span className={`chip font-semibold text-white ${small ? 'px-2 text-[11px]' : ''}`} style={{ background: l.color }}>{l.short}</span>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.get(`/admin/students/${id}`), api.get('/admin/courses')]), [id]);
  const [tab, setTab] = useState('plan');
  const [edit, setEdit] = useState(null);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const [detail, courses] = data;
  const { student: s } = detail;
  const course = courses.find((c) => c.id === s.courseId);

  const unlock = async () => {
    await api.post(`/admin/students/${s.id}/unlock-diagnose`, { unlock: !s.diagUnlocked });
    toast(s.diagUnlocked ? 'Freigabe zurückgenommen' : 'Diagnosetest freigegeben');
    reload();
  };
  const reset = async () => {
    if (!confirm(`Alles von ${s.displayName} zurücksetzen (Diagnosetests, Lernplan, Fortschritt)? Das kann nicht rückgängig gemacht werden.`)) return;
    await api.post(`/admin/students/${s.id}/reset`);
    toast('Zurückgesetzt');
    reload();
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={s.displayName}
        subtitle={[s.username, s.grade && `${s.grade}. Jahrgang`, s.profile && PROFILES[s.profile]?.label, s.geCourse && `${s.geCourse}-Kurs`, course?.name].filter(Boolean).join(' · ')}
        back={course ? { to: `/admin/kurse/${course.id}`, label: course.name } : { to: '/admin/kurse', label: 'Kurse' }}
      >
        <button className="btn-secondary" onClick={() => setEdit(s)}><Pencil size={16} /> Bearbeiten</button>
        {s.diagnose?.count > 0 && (
          <button className={s.diagUnlocked ? 'btn-secondary border-sky-300 text-sky-700' : 'btn-secondary'} onClick={unlock}>
            <Unlock size={16} /> {s.diagUnlocked ? 'Test-Freigabe zurücknehmen' : 'Test erneut freigeben'}
          </button>
        )}
        <button className="btn-danger" onClick={reset}><RotateCcw size={16} /> Zurücksetzen</button>
      </PageHeader>
      {s.note && <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">📝 {s.note}</div>}

      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 sm:inline-flex">
        {[['plan', 'Lernplan & Fortschritt'], ['diag', `Diagnosetests (${detail.runs.length})`], ['feedback', `Feedback (${detail.feedback.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'plan' && <PlanEditor student={s} plan={detail.plan} onSaved={reload} />}
      {tab === 'diag' && <DiagnoseView student={s} runs={detail.runs} plan={detail.plan} onChanged={reload} />}
      {tab === 'feedback' && <FeedbackView student={s} plan={detail.plan} feedback={detail.feedback} onChanged={reload} />}

      <EditStudent student={edit} courses={courses} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />
    </div>
  );
}

// ---------------------------------------------------------------- Lernplan
function PlanEditor({ student, plan, onSaved }) {
  const [items, setItems] = useState(plan);
  const [open, setOpen] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  useEffect(() => setItems(plan), [plan]);
  const dirty = JSON.stringify(items.map((i) => [i.topicId, i.levels])) !== JSON.stringify(plan.map((i) => [i.topicId, i.levels]));

  if (!plan.length) {
    return <div className="card"><Empty title="Noch kein Lernplan">Der Lernplan wird erstellt, sobald {student.displayName} den Diagnosetest abgeschlossen hat.</Empty></div>;
  }

  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setItems(next);
  };
  const toggleLevel = (idx, lvl) => {
    setItems(items.map((it, i) => {
      if (i !== idx) return it;
      const has = it.levels.includes(lvl);
      const levels = has ? it.levels.filter((l) => l !== lvl) : [...it.levels, lvl].sort();
      return { ...it, levels: levels.length ? levels : it.levels };
    }));
  };
  const save = async () => {
    await api.put(`/admin/students/${student.id}/plan`, { items: items.map((i) => ({ topicId: i.topicId, levels: i.levels })) });
    toast('Lernplan gespeichert');
    onSaved();
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Reihenfolge per Ziehen oder Pfeilen ändern. Klicke Niveaustufen an, um Übungspakete freizuschalten – mehrere Stufen gleichzeitig sind möglich.</p>
        <div className="flex gap-2">
          {dirty && <button className="btn-secondary" onClick={() => setItems(plan)}>Verwerfen</button>}
          <button className="btn-primary" disabled={!dirty} onClick={save}><Save size={16} /> Speichern</button>
        </div>
      </div>
      <div className="card divide-y divide-slate-100 overflow-hidden">
        {items.map((it, idx) => (
          <div
            key={it.topicId}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { move(dragIdx, idx); setDragIdx(idx); } }}
            onDragEnd={() => setDragIdx(null)}
            className={`${dragIdx === idx ? 'bg-brand-50/60' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="flex w-14 shrink-0 cursor-grab items-center gap-1 text-slate-400 active:cursor-grabbing">
                <span className="w-5 text-right text-sm font-bold text-slate-700">{idx + 1}.</span>
                <div className="flex flex-col">
                  <button className="hover:text-slate-800" onClick={() => move(idx, idx - 1)} aria-label="Nach oben"><ArrowUp size={14} /></button>
                  <button className="hover:text-slate-800" onClick={() => move(idx, idx + 1)} aria-label="Nach unten"><ArrowDown size={14} /></button>
                </div>
              </div>
              <TopicIcon topic={{ icon: it.icon, color: it.color }} size="sm" />
              <div className="min-w-44 flex-1">
                <div className="font-semibold text-slate-900">{it.title}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">Diagnose: <LevelBadge level={it.diagLevel} small /></div>
              </div>
              <div className="flex flex-wrap gap-1">
                {LEVELS.map((l) => {
                  const on = it.levels.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLevel(idx, l.id)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${on ? 'border-transparent text-white' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-700'}`}
                      style={on ? { background: l.color } : undefined}
                      title={l.label}
                    >
                      {on && <Check size={11} className="-ml-0.5 mr-0.5 inline" strokeWidth={3} />}{l.short}
                    </button>
                  );
                })}
              </div>
              <div className="flex w-36 items-center gap-2">
                <ProgressBar value={it.progress.percent} color={it.color} />
                <span className="w-16 text-right text-xs text-slate-500">{it.progress.solved}/{it.progress.total}</span>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setOpen(open === it.topicId ? null : it.topicId)} title="Bearbeitete Aufgaben">
                {open === it.topicId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
            {open === it.topicId && (
              <div className="bg-slate-50/70 px-4 pb-4 pt-1">
                {it.tasks.length === 0 ? <p className="py-3 text-sm text-slate-500">Noch keine Aufgaben bearbeitet.</p> : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-slate-500">
                      <tr><th className="py-2">Aufgabe</th><th>Stufe</th><th>Versuche</th><th>Zeit</th><th>Status</th><th>Zuletzt</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {it.tasks.map((t) => (
                        <tr key={t.id}>
                          <td className="py-2 pr-3"><div className="font-medium text-slate-800">{t.title}</div><div className="text-xs text-slate-500">{t.package_title}</div></td>
                          <td><LevelBadge level={t.level} small /></td>
                          <td className="tabular-nums">{t.attempts}×</td>
                          <td className="tabular-nums">{formatDuration(t.time_ms)}</td>
                          <td>
                            {t.solved ? <span className="chip bg-emerald-100 text-emerald-700"><Check size={12} /> gelöst</span> : <span className="chip bg-slate-200 text-slate-600">offen</span>}
                            {t.solution_viewed ? <span className="chip ml-1 bg-amber-100 text-amber-800"><Eye size={12} /> Lösung angesehen</span> : null}
                          </td>
                          <td className="text-xs text-slate-500">{formatDate(t.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {LEVELS.map((l) => <span key={l.id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />{l.label}</span>)}
        <span>· Für das Kind sind die Stufen nicht sichtbar.</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Diagnose
function DiagnoseView({ student, runs, plan, onChanged }) {
  const [sel, setSel] = useState(runs.length ? runs[runs.length - 1].id : null);
  const [openItem, setOpenItem] = useState(null);
  const run = runs.find((r) => r.id === sel);
  const prev = run ? runs.filter((r) => r.number < run.number && r.status === 'done').pop() : null;

  const byTopic = useMemo(() => {
    if (!run) return [];
    const map = new Map();
    for (const it of run.items) {
      if (!map.has(it.topicId)) map.set(it.topicId, { topicId: it.topicId, title: it.topicTitle, items: [] });
      map.get(it.topicId).items.push(it);
    }
    return [...map.values()];
  }, [run]);

  if (!runs.length) return <div className="card"><Empty title="Noch kein Diagnosetest">{student.displayName} hat den Einstiegstest noch nicht begonnen.</Empty></div>;

  const apply = async (mode) => {
    const msg = mode === 'rebuild'
      ? 'Lernplan komplett aus diesem Test neu erstellen? Reihenfolge und Stufen werden überschrieben (Fortschritt bleibt erhalten).'
      : 'Die Stufen aus diesem Test zusätzlich freischalten? Bestehende Freischaltungen und die Reihenfolge bleiben erhalten.';
    if (!confirm(msg)) return;
    await api.post(`/admin/students/${student.id}/plan/from-run/${run.id}`, { mode });
    toast('Lernplan angepasst');
    onChanged();
  };

  const totalTime = run.items.reduce((s, i) => s + (i.timeMs || 0), 0);
  const correct = run.items.filter((i) => i.correct === 1).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {runs.map((r) => (
          <button key={r.id} onClick={() => setSel(r.id)} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${sel === r.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {r.number === 1 ? 'Einstiegstest' : `Wiederholung ${r.number - 1}`}
            <span className="ml-2 text-xs font-normal text-slate-500">{r.status === 'done' ? formatDate(r.finished_at) : 'läuft'}</span>
          </button>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-6 p-5">
        <div><div className="text-xs uppercase text-slate-500">Richtig</div><div className="text-xl font-bold text-slate-900">{correct} / {run.items.length}</div></div>
        <div><div className="text-xs uppercase text-slate-500">Bearbeitungszeit</div><div className="text-xl font-bold text-slate-900">{formatDuration(totalTime)}</div></div>
        <div><div className="text-xs uppercase text-slate-500">Profil</div><div className="text-xl font-bold text-slate-900">{PROFILES[run.profile]?.short}</div></div>
        {run.status === 'done' && run.number > 1 && (
          <div className="ml-auto flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => apply('merge')}>Stufen zusätzlich freischalten</button>
            <button className="btn-primary" onClick={() => apply('rebuild')}>Lernplan neu erstellen</button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-sm text-slate-600">
          So wurde der Lernplan berechnet: <b>0 richtig → Basis</b>, <b>1 → Mindest</b>, <b>2 → Regel</b>, <b>3 → Experte</b>. Themen mit dem geringsten Anteil richtiger Antworten stehen oben.
        </div>
        <div className="divide-y divide-slate-100">
          {byTopic.map((t) => {
            const sc = run.scores[t.topicId];
            const pv = prev?.scores?.[t.topicId];
            const planItem = plan.find((p) => p.topicId === t.topicId);
            const delta = pv && sc ? sc.correct - pv.correct : null;
            return (
              <div key={t.topicId} className="px-5 py-4">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <div className="min-w-48 flex-1 font-semibold text-slate-900">{t.title}</div>
                  <span className="text-sm text-slate-600">{sc?.correct ?? 0}/{sc?.total ?? 0} richtig</span>
                  <LevelBadge level={sc?.level} />
                  {delta !== null && (
                    <span className={`chip ${delta > 0 ? 'bg-emerald-100 text-emerald-700' : delta < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      {delta > 0 ? <ArrowUpRight size={12} /> : delta < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />} vorher {pv.correct}/{pv.total}
                    </span>
                  )}
                  {planItem && <span className="text-xs text-slate-500">Plan-Position {plan.indexOf(planItem) + 1}</span>}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {t.items.map((i) => (
                    <button key={i.id} onClick={() => setOpenItem(openItem === i.id ? null : i.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition hover:border-slate-300 ${openItem === i.id ? 'border-brand-400 bg-brand-50/50' : 'border-slate-200'}`}>
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${i.correct === 1 ? 'bg-emerald-500 text-white' : i.correct === 0 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {i.correct === 1 ? <Check size={14} strokeWidth={3} /> : i.correct === 0 ? <X size={14} strokeWidth={3} /> : <Minus size={14} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-800">{DIFFICULTIES[(i.difficulty || 1) - 1]?.label}: {i.taskTitle}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={11} /> {formatDuration(i.timeMs)} · Var. {i.variant}{!i.answeredAt && ' · nicht bearbeitet'}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {t.items.filter((i) => i.id === openItem).map((i) => (
                  <div key={i.id} className="mt-3 grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
                    <div><div className="label">Aufgabe</div><MathContent md={i.prompt} /></div>
                    <div>
                      <div className="label">Antwort des Kindes</div>
                      <div className="rounded-lg bg-white p-3 font-mono text-sm">{formatGiven(i.answer, i.spec)}</div>
                      <div className="label mt-3">Erwartet</div>
                      <div className="rounded-lg bg-white p-3 font-mono text-sm">{formatExpected(i.spec)}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatGiven(answer, spec) {
  if (answer == null) return '— (keine Antwort)';
  if (spec?.type === 'choice') return (Array.isArray(answer) ? answer : [answer]).map((i) => spec.options?.[i]?.text ?? i).join(', ');
  if (Array.isArray(answer)) return answer.map((a, i) => `${spec?.parts?.[i]?.label || ''} ${a ?? '—'}`).join('   ');
  return String(answer);
}
function formatExpected(spec) {
  if (!spec) return '';
  if (spec.type === 'fields') return spec.parts.map((p) => `${p.label || ''} ${String(p.value).replace('.', ',')}${p.unit ? ' ' + p.unit : ''}`).join('   ');
  if (spec.type === 'choice') return spec.options.filter((o) => o.correct).map((o) => o.text).join(', ');
  return spec.sample || '(Freitext)';
}

// ---------------------------------------------------------------- Feedback
function FeedbackView({ student, plan, feedback, onChanged }) {
  const [topicId, setTopicId] = useState(plan[0]?.topicId || '');
  const [text, setText] = useState('');
  const send = async () => {
    await api.post(`/admin/students/${student.id}/feedback`, { topicId: topicId || null, text });
    setText('');
    toast('Feedback gesendet');
    onChanged();
  };
  const remove = async (f) => {
    if (!confirm('Feedback löschen?')) return;
    await api.del(`/admin/feedback/${f.id}`);
    onChanged();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="card h-fit space-y-4 p-5">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><MessageSquarePlus size={18} className="text-rose-500" /> Neues Feedback</h3>
        <div>
          <label className="label">Themenbereich</label>
          <select className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">Allgemein</option>
            {plan.map((p) => <option key={p.topicId} value={p.topicId}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nachricht</label>
          <textarea className="input" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Achte bei der Prozentrechnung darauf, was der Grundwert ist." />
        </div>
        <button className="btn-primary w-full" disabled={!text.trim()} onClick={send}>Senden</button>
        <p className="text-xs text-slate-500">Das Kind sieht auf der Startseite, dass es neues Feedback gibt.</p>
      </div>
      <div className="card divide-y divide-slate-100">
        {feedback.length === 0 ? <Empty title="Noch kein Feedback gegeben" /> : feedback.map((f) => (
          <div key={f.id} className="flex gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{f.topic_title || 'Allgemein'}</span>
                <span>{formatDate(f.created_at)}</span>
                {f.read_at ? <span className="chip bg-emerald-100 text-emerald-700">gelesen</span> : <span className="chip bg-slate-100 text-slate-500">ungelesen</span>}
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{f.text}</p>
            </div>
            <button className="btn-ghost btn-sm text-red-600" onClick={() => remove(f)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
