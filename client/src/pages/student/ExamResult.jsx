import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, GraduationCap, PenLine, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, formatDate, toast } from '../../components/ui.jsx';
import { ExamReview, fmtPts } from '../../components/ExamReview.jsx';

// Auswertung direkt nach der Abgabe: automatisch bewertete Punkte sofort, Aufgaben auf Papier per Selbsteinschätzung.
export default function ExamResult() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(() => api.get(`/student/pruefung/attempts/${id}`), [id]);
  const [state, setState] = useState(null);
  useEffect(() => { if (data) setState(data); }, [data]);
  if (error) return <ErrorBox error={error} />;
  if ((loading && !data) || !state) return <PageLoader />;
  if (state.attempt.status !== 'done') return <ErrorBox error={new Error('Diese Prüfung ist noch nicht abgegeben.')} />;

  const { score, attempt } = state;
  const setSelf = async (itemId, points) => {
    const prev = state;
    setState((s) => ({ ...s, self: { ...s.self, [itemId]: points } }));
    try {
      const r = await api.put(`/student/pruefung/attempts/${id}/self`, { itemId, points });
      setState((s) => ({ ...s, self: r.self, score: r.score }));
    } catch (e) {
      setState(prev);
      toast(e.message, 'error');
    }
  };
  const pct = score.max ? Math.round((score.total / score.max) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/pruefung" className="text-sm font-medium text-brand-600 hover:underline">← Zurück zu den Prüfungen</Link>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-2 text-sm text-indigo-100"><GraduationCap size={18} /> {state.exam.title} · abgegeben am {formatDate(attempt.finishedAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <div className="text-5xl font-extrabold tabular-nums leading-none">{fmtPts(score.total)}<span className="text-2xl font-bold text-indigo-200"> / {score.max}</span></div>
              <div className="mt-1 text-sm text-indigo-100">Punkte{score.selfOpen > 0 ? ' bisher' : ''} · {pct} %</div>
            </div>
            <div className="mb-1 min-w-48 flex-1">
              <div className="h-3 overflow-hidden rounded-full bg-white/20">
                <div className="h-3 rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {Object.entries(score.parts).map(([pk, p]) => (
            <div key={pk} className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{p.title}</div>
              <div className="text-xl font-bold tabular-nums text-slate-900">{fmtPts(p.score)} <span className="text-sm font-medium text-slate-500">/ {fmtPts(p.max)}</span></div>
              {pk === 'wahl' && <div className="text-xs text-slate-500">gewertet: Wahlaufgabe {attempt.choice.join(' und ')}</div>}
            </div>
          ))}
        </div>
        {score.selfOpen > 0 ? (
          <div className="flex items-start gap-3 border-t border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <PenLine size={18} className="mt-0.5 shrink-0" />
            <span><b>{score.selfOpen} Teilaufgaben</b> hast du auf Papier bearbeitet (Zeichnungen, Begründungen, Rechenwege). Vergleiche sie unten mit der Musterlösung und trage ein, wie viele Punkte du bekommen hättest. Dann ist deine Punktzahl vollständig.</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 border-t border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <Sparkles size={18} className="shrink-0" /> Fertig ausgewertet! Schau dir unten an, wo du noch Punkte verschenkt hast.
          </div>
        )}
      </div>

      <ExamReview data={state} onSelf={setSelf} />

      <div className="flex justify-end">
        <Link to="/pruefung" className="btn-primary">Zu den Prüfungen <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
