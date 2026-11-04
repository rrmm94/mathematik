import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, PenLine, X, Minus } from 'lucide-react';
import { MathContent, TaskContext } from './ui.jsx';
import { TaskBody } from './AnswerInput.jsx';

const noop = () => {};
export const fmtPts = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
export const ptsLabel = (n) => `${fmtPts(n)} ${n === 1 ? 'Punkt' : 'Punkte'}`;

// Auswertung einer Prüfung: Punkte je Teil, je Aufgabe die eigene Antwort, Musterlösung und
// (bei Aufgaben auf Papier) die Selbsteinschätzung. readOnly: Ansicht der Lehrkraft.
export function ExamReview({ data, onSelf, readOnly = false }) {
  const { score, review, answers } = data;
  return (
    <div className="space-y-6">
      {Object.entries(review).map(([pk, part]) => {
        const sp = score.parts[pk];
        return (
          <section key={pk}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">{part.title}</h2>
              <span className="text-sm font-semibold text-slate-600">{fmtPts(sp.score)} von {fmtPts(sp.max)} Punkten</span>
            </div>
            <div className="space-y-3">
              {part.groups.map((g) => {
                const sg = sp.groups.find((x) => x.no === g.no);
                return <GroupReview key={g.no} pk={pk} g={g} sg={sg} answers={answers} onSelf={onSelf} readOnly={readOnly} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GroupReview({ pk, g, sg, answers, onSelf, readOnly }) {
  const name = pk === 'wahl' ? `Wahlaufgabe ${g.no}` : `Aufgabe ${g.no}`;
  const selfOpen = sg.counted && sg.items.some((i) => i.selfPoints && i.self == null);
  // Aufgeklappt: wo das Kind noch Punkte selbst eintragen muss (die Lehrkraft klappt selbst auf)
  const [open, setOpen] = useState(selfOpen && !readOnly);
  const full = sg.score >= sg.max;
  return (
    <div data-selfopen={selfOpen ? '1' : undefined} className={`card scroll-mt-24 overflow-hidden ${sg.counted ? '' : 'opacity-70'}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50">
        {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        <span className="font-semibold text-slate-900">{name}</span>
        {!sg.counted && <span className="chip bg-slate-100 text-slate-500">nicht gewertet</span>}
        {selfOpen && !readOnly && <span className="chip bg-amber-100 text-amber-800"><PenLine size={12} /> Punkte selbst eintragen</span>}
        <span className={`ml-auto text-sm font-semibold tabular-nums ${full ? 'text-emerald-700' : 'text-slate-700'}`}>{full && <Check size={14} className="mr-1 inline" strokeWidth={3} />}{fmtPts(sg.score)} / {fmtPts(sg.max)}</span>
      </button>
      {open && (
        <div className="space-y-5 border-t border-slate-100 px-5 py-4">
          <TaskContext md={g.context} />
          {g.items.map((it) => {
            const s = sg.items.find((x) => x.id === it.id);
            return <ItemReview key={it.id} it={it} s={s} answer={answers[it.id]} onSelf={sg.counted && !readOnly ? onSelf : null} />;
          })}
        </div>
      )}
    </div>
  );
}

function ItemReview({ it, s, answer, onSelf }) {
  const hasAuto = it.autoPoints > 0;
  const status = hasAuto && answer != null ? { correct: !!s.correct, parts: s.parts } : null;
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-sm">
        {it.label && <span className="font-bold text-slate-800">{it.label}</span>}
        {hasAuto && <AutoBadge s={s} answered={answer != null} />}
        {it.selfPoints > 0 && <span className="chip bg-sky-50 text-sky-700 ring-1 ring-sky-200"><PenLine size={12} /> {it.selfLabel || 'auf Papier'}: selbst einschätzen</span>}
        <span className="ml-auto font-semibold tabular-nums text-slate-700">{fmtPts(s.score)} / {fmtPts(it.points)} P.</span>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="pointer-events-none min-w-0 select-text space-y-3">
          {it.spec.type === 'free' ? (
            <>
              <MathContent md={it.prompt} />
              {String(answer || '').trim() && (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="text-xs font-semibold uppercase text-slate-400">Deine Notiz: </span><span className="whitespace-pre-wrap">{answer}</span></div>
              )}
            </>
          ) : (
            <TaskBody prompt={it.prompt} spec={it.spec} value={answer ?? null} onChange={noop} status={status} disabled />
          )}
        </div>
        <div className="min-w-0 space-y-3">
          {it.summary && hasAuto && !it.solution && (
            <div>
              <div className="label">Richtige Lösung</div>
              <div className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-900"><MathContent md={it.summary} /></div>
            </div>
          )}
          {it.solution && (
            <div>
              <div className="label">Musterlösung</div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm"><MathContent md={it.solution} /></div>
            </div>
          )}
          {it.selfPoints > 0 && <SelfScore it={it} value={s.self} onSelf={onSelf} />}
        </div>
      </div>
    </div>
  );
}

function AutoBadge({ s, answered }) {
  if (!answered) return <span className="chip bg-slate-100 text-slate-500"><Minus size={12} /> nicht beantwortet</span>;
  if (s.correct) return <span className="chip bg-emerald-100 text-emerald-700"><Check size={12} strokeWidth={3} /> richtig</span>;
  if (s.auto > 0) return <span className="chip bg-amber-100 text-amber-800">teilweise richtig</span>;
  return <span className="chip bg-red-100 text-red-700"><X size={12} strokeWidth={3} /> falsch</span>;
}

// Punkte für eine auf Papier bearbeitete Teilaufgabe selbst eintragen (0 … max)
function SelfScore({ it, value, onSelf }) {
  const opts = Array.from({ length: it.selfPoints + 1 }, (_, i) => i);
  return (
    <div className="rounded-lg bg-sky-50/70 p-3 ring-1 ring-sky-100">
      <div className="mb-2 text-sm font-medium text-slate-700">
        {onSelf ? 'Vergleiche mit der Musterlösung: Wie viele Punkte hättest du bekommen?' : 'Selbsteinschätzung des Kindes'}
        {it.selfLabel && <span className="text-slate-500"> ({it.selfLabel})</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((p) => (
          <button
            key={p}
            type="button"
            disabled={!onSelf}
            onClick={() => onSelf?.(it.id, value === p ? null : p)}
            className={`min-w-11 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${value === p ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-600 enabled:hover:border-sky-300'}`}
          >
            {p}
          </button>
        ))}
        {value == null && <span className="self-center text-xs text-slate-500">{onSelf ? 'noch offen' : 'nicht eingetragen'}</span>}
      </div>
    </div>
  );
}
