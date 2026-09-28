import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, Eye, Lightbulb, RefreshCw, SendHorizonal, PartyPopper, XCircle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, MathContent, TopicIcon, ProgressBar, colorOf } from '../../components/ui.jsx';
import AnswerInput, { isEmptyAnswer } from '../../components/AnswerInput.jsx';

export default function Practice() {
  const { id } = useParams();
  const { data, error, loading, setData } = useLoad(() => api.get(`/student/packages/${id}`), [id]);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { package: pkg, topic, tasks } = data;
  const solved = tasks.filter((t) => t.solved).length;
  const c = colorOf(topic.color);

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
      </div>

      {solved === tasks.length && tasks.length > 0 && (
        <div className="card animate-pop flex items-center gap-4 border-emerald-200 bg-emerald-50 p-5">
          <PartyPopper className="text-emerald-600" size={28} />
          <div className="flex-1">
            <div className="font-semibold text-emerald-900">Paket geschafft – super gemacht!</div>
            <div className="text-sm text-emerald-800">Mit „Neue Zahlen“ kannst du jede Aufgabe noch einmal üben.</div>
          </div>
          <Link to={`/thema/${topic.id}`} className="btn-secondary">Weiter</Link>
        </div>
      )}

      {tasks.map((t, i) => <TaskCard key={t.id} task={t} index={i} topicId={topic.id} onUpdate={updateTask} />)}
    </div>
  );
}

function TaskCard({ task, index, topicId, onUpdate }) {
  const [value, setValue] = useState(null);
  const [status, setStatus] = useState(null);
  const [solution, setSolution] = useState(null);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => {
    setValue(null); setStatus(null); setSolution(null); setHint(false);
    started.current = Date.now();
  }, [task.variantId]);

  const check = async () => {
    if (isEmptyAnswer(task.spec, value)) return;
    setBusy(true);
    try {
      const res = await api.post(`/student/tasks/${task.id}/check`, { variantId: task.variantId, answer: value, time_ms: Date.now() - started.current });
      started.current = Date.now();
      setStatus(res);
      if (res.solution !== undefined) setSolution({ solution: res.solution, summary: res.summary });
      if (res.correct === false) { setShake(true); setTimeout(() => setShake(false), 350); }
      onUpdate({ id: task.id, attempts: task.attempts + 1, solved: task.solved || res.correct === true || task.spec.type === 'free' });
    } finally {
      setBusy(false);
    }
  };

  const showSolution = async () => {
    const res = await api.post(`/student/tasks/${task.id}/solution`, { variantId: task.variantId });
    setSolution(res);
  };

  const newNumbers = async () => {
    const { task: t } = await api.post(`/student/tasks/${task.id}/new-variant`);
    onUpdate(t);
  };

  const isFree = task.spec.type === 'free';

  return (
    <div className={`card overflow-hidden ${shake ? 'animate-shake' : ''}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
          <span className="hidden text-sm font-semibold text-slate-700 sm:inline">Aufgabe {index + 1}</span>
          {task.solved && <CheckCircle2 size={18} className="text-emerald-500" />}
        </div>
        <div className="flex gap-1">
          {task.scriptSectionId && (
            <Link to={`/skript/${topicId}#abschnitt-${task.scriptSectionId}`} className="btn-ghost btn-sm" title="Im Skript nachlesen"><BookOpen size={15} /> <span className="hidden sm:inline">Skript</span></Link>
          )}
          {task.variantCount > 1 && (
            <button className="btn-ghost btn-sm" onClick={newNumbers} title="Gleiche Aufgabe mit neuen Zahlen"><RefreshCw size={15} /> <span className="whitespace-nowrap">Neue Zahlen</span></button>
          )}
        </div>
      </div>
      <div className="space-y-5 p-5">
        <MathContent md={task.prompt} />
        <AnswerInput spec={task.spec} value={value} onChange={(v) => { setValue(v); if (status && !isFree) setStatus(null); }} status={isFree ? null : status} onSubmit={check} />

        {status && !isFree && (
          <div className={`animate-pop flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${status.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {status.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {status.correct ? 'Richtig! Sehr gut.' : 'Noch nicht ganz. Versuch es noch einmal – oder schau dir einen Tipp an.'}
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
          <div className="flex gap-1">
            {task.hint && !hint && <button className="btn-ghost btn-sm" onClick={() => setHint(true)}><Lightbulb size={15} /> Tipp</button>}
            {!solution && <button className="btn-ghost btn-sm" onClick={showSolution}><Eye size={15} /> Lösung anzeigen</button>}
          </div>
          <button className="btn-primary" disabled={busy || isEmptyAnswer(task.spec, value)} onClick={check}>
            <SendHorizonal size={16} /> {isFree ? 'Antwort abgeben' : 'Prüfen'}
          </button>
        </div>
      </div>
    </div>
  );
}
