import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, Eye, Flag, Lightbulb, RefreshCw, SendHorizonal, PartyPopper, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAutosave } from '../../lib/autosave.js';
import { useLoad, PageLoader, ErrorBox, MathContent, TaskContext, TopicIcon, ProgressBar, Modal, toast, colorOf } from '../../components/ui.jsx';
import { TaskBody, isEmptyAnswer } from '../../components/AnswerInput.jsx';

export default function Practice() {
  const { id } = useParams();
  const { hash } = useLocation();
  const { data, error, loading, setData } = useLoad(() => api.get(`/student/packages/${id}`), [id]);
  const [report, setReport] = useState(null); // { taskId } beim Melden eines Problems
  const scrolled = useRef(false);

  // Beim Öffnen dorthin springen, wo das Kind zuletzt war (bzw. zur Aufgabe aus einem Feedback-Link).
  useEffect(() => {
    if (!data || scrolled.current) return;
    scrolled.current = true;
    let target = hash.startsWith('#aufgabe-') ? hash.slice(1) : null;
    if (!target) {
      const started = data.tasks.some((t) => t.solved || t.attempts || t.draft != null);
      const open = data.tasks.find((t) => !t.solved);
      if (started && open && open !== data.tasks[0]) target = `aufgabe-${open.id}`;
    }
    if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [data, hash]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { package: pkg, topic, tasks } = data;
  const solved = tasks.filter((t) => t.solved).length;
  const c = colorOf(topic.color);
  const highlight = hash.startsWith('#aufgabe-') ? Number(hash.slice(9)) : null;

  const updateTask = (task) => setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)) }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={`/thema/${topic.id}`} className="text-sm font-medium text-brand-600 hover:underline">← {topic.title}</Link>
      <div className="card sticky top-[72px] z-30 flex items-center gap-4 p-4">
        <TopicIcon topic={topic} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-slate-900">{pkg.title}</div>
          <div className="flex items-center gap-3">
            <ProgressBar value={tasks.length ? (solved / tasks.length) * 100 : 0} color={topic.color} />
            <span className={`shrink-0 text-xs font-semibold ${c.text}`}>{solved}/{tasks.length}</span>
          </div>
        </div>
        <button className="btn-ghost btn-sm shrink-0" onClick={() => setReport({ taskId: '' })} title="Ein Problem mit diesem Paket melden">
          <Flag size={15} /> <span className="hidden sm:inline">Problem melden</span>
        </button>
      </div>

      {solved === tasks.length && tasks.length > 0 && (
        <div className="card animate-pop flex items-center gap-4 border-emerald-200 bg-emerald-50 p-5">
          <PartyPopper className="text-emerald-600" size={28} />
          <div className="flex-1">
            <div className="font-semibold text-emerald-900">Paket geschafft, super gemacht!</div>
            <div className="text-sm text-emerald-800">Mit „Neue Zahlen“ kannst du jede Aufgabe noch einmal üben.</div>
          </div>
          <Link to={`/thema/${topic.id}`} className="btn-secondary">Weiter</Link>
        </div>
      )}

      {tasks.map((t, i) => (
        <TaskCard key={t.id} task={t} index={i} topicId={topic.id} onUpdate={updateTask} highlight={highlight === t.id} onReport={() => setReport({ taskId: t.id })} />
      ))}

      <ReportModal open={!!report} preset={report} pkg={pkg} tasks={tasks} onClose={() => setReport(null)} />
    </div>
  );
}

function ReportModal({ open, preset, pkg, tasks, onClose }) {
  const [taskId, setTaskId] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setTaskId(preset?.taskId ?? ''); setText(''); } }, [open, preset]);
  const send = async () => {
    setBusy(true);
    try {
      await api.post(`/student/packages/${pkg.id}/report`, { taskId: taskId || null, text });
      toast('Danke! Deine Lehrkraft schaut sich das an.');
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Problem melden">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Ist dir etwas aufgefallen, z. B. ein Bild passt nicht, eine Aufgabe ist unklar oder deine richtige Antwort wird als falsch angezeigt? Schreib es deiner Lehrkraft.</p>
        <div>
          <label className="label">Welche Aufgabe?</label>
          <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">Das ganze Paket „{pkg.title}“</option>
            {tasks.map((t, i) => <option key={t.id} value={t.id}>Aufgabe {i + 1}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Was ist das Problem?</label>
          <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Bei Aufgabe 5 passt das Bild nicht zum Text." autoFocus />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" disabled={busy || !text.trim()} onClick={send}><SendHorizonal size={16} /> Senden</button>
        </div>
      </div>
    </Modal>
  );
}

function Rating({ task, onUpdate }) {
  const rate = async (v) => {
    const value = task.rating === v ? 0 : v;
    onUpdate({ id: task.id, rating: value });
    try {
      await api.post(`/student/tasks/${task.id}/rating`, { value });
    } catch {
      onUpdate({ id: task.id, rating: task.rating });
    }
  };
  const btn = (v, Icon, label, on) => (
    <button
      type="button"
      onClick={() => rate(v)}
      title={label}
      aria-label={label}
      aria-pressed={task.rating === v}
      className={`grid h-8 w-8 place-items-center rounded-lg border transition ${task.rating === v ? on : 'border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
    >
      <Icon size={16} />
    </button>
  );
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 hidden text-xs text-slate-500 md:inline">Wie fandest du die Aufgabe?</span>
      {btn(1, ThumbsUp, 'Fand ich gut', 'border-emerald-200 bg-emerald-50 text-emerald-600')}
      {btn(-1, ThumbsDown, 'Fand ich nicht so gut', 'border-rose-200 bg-rose-50 text-rose-600')}
    </div>
  );
}

function TaskCard({ task, index, topicId, onUpdate, highlight, onReport }) {
  const [value, setValue] = useState(task.draft ?? null);
  const [status, setStatus] = useState(task.lastResult);
  const [solution, setSolution] = useState(task.solution);
  const [unlocked, setUnlocked] = useState(task.solutionUnlocked);
  const [wrong, setWrong] = useState(task.wrong || 0);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const started = useRef(Date.now());
  const variant = useRef(task.variantId);
  const elapsed = () => { const ms = Date.now() - started.current; started.current = Date.now(); return ms; };

  // Eingaben zwischenspeichern, damit sie nach dem Schließen des Browsers wieder da sind.
  const autosave = useAutosave(({ variantId, answer }, keepalive) => (
    api.post(`/student/tasks/${task.id}/draft`, { variantId, answer, time_ms: elapsed() }, { keepalive })
  ));

  useEffect(() => {
    if (variant.current === task.variantId) return;
    variant.current = task.variantId;
    autosave.cancel();
    setValue(task.draft ?? null); setStatus(task.lastResult); setSolution(task.solution);
    setUnlocked(task.solutionUnlocked); setWrong(task.wrong || 0); setHint(false);
    started.current = Date.now();
  }, [task.variantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFree = task.spec.type === 'free';

  const change = (v) => {
    setValue(v);
    if (status && !isFree) setStatus(null);
    autosave.schedule({ variantId: task.variantId, answer: isEmptyAnswer(task.spec, v) ? null : v });
  };

  const check = async () => {
    if (isEmptyAnswer(task.spec, value)) return;
    setBusy(true);
    autosave.cancel();
    try {
      const res = await api.post(`/student/tasks/${task.id}/check`, { variantId: task.variantId, answer: value, time_ms: elapsed() });
      setStatus(res);
      setUnlocked(res.solutionUnlocked);
      setWrong(res.wrong || 0);
      if (res.solution !== undefined) setSolution({ solution: res.solution, summary: res.summary });
      if (res.correct === false) { setShake(true); setTimeout(() => setShake(false), 350); }
      onUpdate({ id: task.id, attempts: task.attempts + 1, solved: task.solved || res.correct === true || isFree });
    } finally {
      setBusy(false);
    }
  };

  const showSolution = async () => {
    try {
      const res = await api.post(`/student/tasks/${task.id}/solution`, { variantId: task.variantId });
      setSolution(res);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const newNumbers = async () => {
    await autosave.flush();
    const { task: t } = await api.post(`/student/tasks/${task.id}/new-variant`);
    onUpdate(t);
  };

  return (
    <div id={`aufgabe-${task.id}`} className={`card scroll-mt-40 overflow-hidden ${shake ? 'animate-shake' : ''} ${highlight ? 'ring-4 ring-rose-300/60' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
          <span className="hidden text-sm font-semibold text-slate-700 sm:inline">Aufgabe {index + 1}</span>
          {task.solved && <CheckCircle2 size={18} className="text-emerald-500" />}
          {task.points > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{task.points} {task.points === 1 ? 'Punkt' : 'Punkte'}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Rating task={task} onUpdate={onUpdate} />
          <span className="mx-1 h-5 w-px bg-slate-200" />
          {task.scriptSectionId && (
            <Link to={`/skript/${topicId}#abschnitt-${task.scriptSectionId}`} className="btn-ghost btn-sm" title="Im Skript nachlesen"><BookOpen size={15} /> <span className="hidden sm:inline">Skript</span></Link>
          )}
          {task.variantCount > 1 && (
            <button className="btn-ghost btn-sm" onClick={newNumbers} title="Gleiche Aufgabe mit neuen Zahlen"><RefreshCw size={15} /> <span className="whitespace-nowrap">Neue Zahlen</span></button>
          )}
        </div>
      </div>
      <div className="space-y-5 p-5">
        <TaskContext md={task.context} />
        <TaskBody prompt={task.prompt} spec={task.spec} value={value} onChange={change} status={isFree ? null : status} onSubmit={check} />

        {status && !isFree && (
          <div className={`animate-pop flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${status.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {status.correct ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
            <span>
              {status.correct ? 'Richtig! Sehr gut.' : 'Noch nicht ganz. Versuch es noch einmal oder schau dir einen Tipp an.'}
              {status.correct === false && !unlocked && wrong === 1 && <span className="block font-normal">Wenn es beim nächsten Versuch auch nicht klappt, kannst du dir die Lösung mit Erklärung anzeigen lassen.</span>}
            </span>
          </div>
        )}
        {status && isFree && (
          <div className="animate-pop rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">Danke! Vergleiche deine Antwort jetzt mit der Musterlösung.</div>
        )}

        {hint && task.hint && (
          <div className="animate-pop flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"><Lightbulb size={18} className="shrink-0" /> <span>{task.hint}</span></div>
        )}

        {solution && (
          <div className="animate-pop rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">Musterlösung</div>
            {solution.summary && !isFree && <div className="mb-2 font-semibold text-slate-900">{solution.summary}</div>}
            {isFree && solution.summary && <p className="mb-2 text-sm text-slate-700">{solution.summary}</p>}
            <MathContent md={solution.solution} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1">
            {task.hint && !hint && <button className="btn-ghost btn-sm" onClick={() => setHint(true)}><Lightbulb size={15} /> Tipp</button>}
            {!solution && unlocked && <button className="btn-ghost btn-sm" onClick={showSolution}><Eye size={15} /> Lösung + Erklärung anzeigen</button>}
            <button className="btn-ghost btn-sm text-slate-400 hover:text-slate-700" onClick={onReport} title="Problem mit dieser Aufgabe melden"><Flag size={14} /><span className="sr-only">Problem melden</span></button>
          </div>
          <button className="btn-primary" disabled={busy || isEmptyAnswer(task.spec, value)} onClick={check}>
            <SendHorizonal size={16} /> {isFree ? 'Antwort abgeben' : 'Prüfen'}
          </button>
        </div>
      </div>
    </div>
  );
}
