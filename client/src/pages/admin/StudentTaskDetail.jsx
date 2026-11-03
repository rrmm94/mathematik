import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Eye, Flag, Lightbulb, MessageSquarePlus, Minus, Pencil, PenLine, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Modal, MathContent, TaskContext, formatDate, formatDuration, toast } from '../../components/ui.jsx';
import { TaskBody } from '../../components/AnswerInput.jsx';

const noop = () => {};

// Aufgabe so, wie das Kind sie gesehen hat, mit seiner Eingabe (grün/rot markiert).
export function AnswerReview({ prompt, context, spec, answer, correct, parts }) {
  const status = correct == null && !parts ? null : { correct: correct == null ? null : !!correct, parts };
  return (
    <div className="pointer-events-none space-y-5 select-text">
      <TaskContext md={context} />
      <TaskBody prompt={prompt} spec={spec} value={answer} onChange={noop} status={status} disabled />
    </div>
  );
}

export function CorrectBadge({ correct, answered = true }) {
  if (!answered) return <span className="chip bg-slate-100 text-slate-500"><Minus size={12} /> nicht bearbeitet</span>;
  if (correct === 1) return <span className="chip bg-emerald-100 text-emerald-700"><Check size={12} strokeWidth={3} /> richtig</span>;
  if (correct === 0) return <span className="chip bg-red-100 text-red-700"><X size={12} strokeWidth={3} /> falsch</span>;
  return <span className="chip bg-sky-100 text-sky-700">nicht automatisch bewertet</span>;
}

export function SolutionBox({ summary, solution, hint }) {
  return (
    <div className="space-y-3">
      {summary && (
        <div>
          <div className="label">Richtige Lösung</div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-900">{summary}</div>
        </div>
      )}
      {solution && (
        <div>
          <div className="label">Lösungsweg</div>
          <div className="rounded-lg border border-slate-200 bg-white p-3"><MathContent md={solution} /></div>
        </div>
      )}
      {hint && (
        <div className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"><Lightbulb size={16} className="shrink-0" /> Tipp: {hint}</div>
      )}
    </div>
  );
}

// Detailansicht einer Übungsaufgabe eines Kindes: Aufgabe, Verlauf aller Eingaben, Lösung, Feedback.
export default function StudentTaskDetail({ student, taskId, onClose, onChanged }) {
  const { data, error, loading, reload } = useLoad(
    () => (taskId ? api.get(`/admin/students/${student.id}/tasks/${taskId}`) : Promise.resolve(null)),
    [taskId],
  );
  const [sel, setSel] = useState(null); // gewählter Versuch ('draft' oder Versuch-ID)
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSel(data.attempts.length ? data.attempts[data.attempts.length - 1].id : data.draft ? 'draft' : null);
  }, [data]);
  useEffect(() => setText(''), [taskId]);

  const sendFeedback = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/students/${student.id}/feedback`, { taskId, text });
      setText('');
      toast('Feedback zur Aufgabe gesendet');
      reload();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const title = data ? `Aufgabe ${data.task.no}: ${data.task.title}` : 'Aufgabe';
  let body;
  if (!taskId) body = null;
  else if (loading && !data) body = <PageLoader />;
  else if (error) body = <ErrorBox error={error} />;
  else if (data) {
    const shown = sel === 'draft' ? data.draft : data.attempts.find((a) => a.id === sel);
    const variant = data.variants.find((v) => v.id === (shown?.variantId ?? data.progress?.variantId)) || data.variants[0];
    const multiVariant = data.variants.length > 1;
    const tries = data.attempts.length;
    const wrong = data.attempts.filter((a) => a.correct === 0).length;
    body = (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>{data.topic.title} · {data.package.title}</span>
          {data.progress?.solved ? <span className="chip bg-emerald-100 text-emerald-700"><Check size={12} /> gelöst</span> : <span className="chip bg-slate-200 text-slate-600">offen</span>}
          {data.progress?.solutionViewed && <span className="chip bg-amber-100 text-amber-800"><Eye size={12} /> Lösung angesehen</span>}
          <span className="chip bg-slate-100 text-slate-600">{tries} {tries === 1 ? 'Versuch' : 'Versuche'}, davon {wrong} falsch</span>
          {data.progress && <span className="chip bg-slate-100 text-slate-600"><Clock size={12} /> {formatDuration(data.progress.timeMs)}</span>}
          {data.rating && (
            data.rating.value > 0
              ? <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><ThumbsUp size={12} /> fand die Aufgabe gut</span>
              : <span className="chip bg-rose-50 text-rose-700 ring-1 ring-rose-200"><ThumbsDown size={12} /> fand die Aufgabe nicht so gut</span>
          )}
          <Link to={`/admin/aufgabe/${data.task.id}`} className="btn-ghost btn-sm ml-auto"><Pencil size={14} /> Aufgabe bearbeiten</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {shown ? (sel === 'draft' ? 'Aktuelle Eingabe (noch nicht geprüft)' : `Versuch ${data.attempts.indexOf(shown) + 1}`) : 'Aufgabe'}
                </span>
                {shown && sel !== 'draft' && <CorrectBadge correct={shown.correct} />}
                {multiVariant && variant && <span className="chip bg-slate-100 text-slate-500">Zahlen-Variante {variant.no}</span>}
              </div>
              {variant && (
                <AnswerReview prompt={variant.prompt} context={variant.context} spec={variant.publicSpec} answer={shown?.answer ?? null} correct={sel === 'draft' ? null : shown?.correct} parts={sel === 'draft' ? null : shown?.parts} />
              )}
            </div>
            {variant && <SolutionBox summary={variant.summary} solution={variant.solution} hint={variant.hint} />}
            {variant?.source && <p className="text-xs text-slate-400">Herkunft: {variant.source}</p>}
          </div>

          <div className="space-y-4">
            <div>
              <div className="label">Verlauf der Eingaben</div>
              {tries === 0 && !data.draft ? (
                <p className="text-sm text-slate-500">Noch keine Antwort geprüft.</p>
              ) : (
                <ol className="space-y-1.5">
                  {data.attempts.map((a, i) => {
                    const prevVariant = i > 0 && data.attempts[i - 1].variantId !== a.variantId;
                    const vno = data.variants.find((v) => v.id === a.variantId)?.no;
                    return (
                      <li key={a.id}>
                        {multiVariant && (i === 0 || prevVariant) && <div className="mb-1 mt-2 text-[11px] font-semibold uppercase text-slate-400">Variante {vno ?? '?'}</div>}
                        <button onClick={() => setSel(a.id)} className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${sel === a.id ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${a.correct === 1 ? 'bg-emerald-500' : a.correct === 0 ? 'bg-red-500' : 'bg-sky-400'}`}>
                            {a.correct === 1 ? <Check size={13} strokeWidth={3} /> : a.correct === 0 ? <X size={13} strokeWidth={3} /> : <PenLine size={12} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-slate-800">{i + 1}. Versuch</span>
                            <span className="block truncate text-xs text-slate-500">{formatDate(a.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {formatDuration(a.timeMs)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {data.draft && (
                    <li>
                      <button onClick={() => setSel('draft')} className={`flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-sm transition ${sel === 'draft' ? 'border-brand-400 bg-brand-50/60' : 'border-slate-300 hover:bg-slate-50'}`}>
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-500"><PenLine size={12} /></span>
                        <span className="font-medium text-slate-700">Aktuelle Eingabe</span>
                      </button>
                    </li>
                  )}
                </ol>
              )}
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><MessageSquarePlus size={16} className="text-rose-500" /> Feedback zu dieser Aufgabe</div>
              <textarea className="input text-sm" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Schau dir diese Aufgabe noch einmal genau an. Achte auf den Grundwert und bearbeite sie bitte noch einmal." />
              <button className="btn-primary btn-sm mt-2 w-full" disabled={busy || !text.trim()} onClick={sendFeedback}>Senden</button>
              <p className="mt-1.5 text-[11px] text-slate-500">Das Kind sieht das Feedback auf der Startseite mit einem Link direkt zu dieser Aufgabe.</p>
              {data.feedback.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-rose-100 pt-3">
                  {data.feedback.map((f) => (
                    <li key={f.id} className="text-sm">
                      <div className="text-[11px] text-slate-500">{formatDate(f.created_at)} · {f.read_at ? 'gelesen' : 'ungelesen'}</div>
                      <p className="whitespace-pre-wrap text-slate-700">{f.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {data.reports.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><Flag size={15} className="text-amber-600" /> Gemeldete Probleme</div>
                <ul className="space-y-2">
                  {data.reports.map((r) => (
                    <li key={r.id} className="text-sm">
                      <div className="text-[11px] text-slate-500">{formatDate(r.created_at)}{r.resolved_at ? ' · erledigt' : ''}</div>
                      <p className="whitespace-pre-wrap text-slate-700">{r.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal open={!!taskId} onClose={onClose} title={title} wide="xl">
      {body}
    </Modal>
  );
}
