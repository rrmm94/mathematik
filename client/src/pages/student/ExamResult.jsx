import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, Award, GraduationCap, PartyPopper, PenLine, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, formatDate, toast } from '../../components/ui.jsx';
import { ExamReview, fmtPts } from '../../components/ExamReview.jsx';
import { GRADE_SCALE, gradeFor, gradeRange } from '../../../../shared/grades.js';

// Farben je Note (1 grün … 6 rot)
export const GRADE_TONE = {
  1: 'bg-emerald-500', 2: 'bg-lime-500', 3: 'bg-sky-500', 4: 'bg-amber-500', 5: 'bg-orange-500', 6: 'bg-rose-500',
};

// Auswertung direkt nach der Abgabe: automatisch bewertete Punkte sofort, Aufgaben auf Papier per Selbsteinschätzung.
// Sind alle Punkte eingetragen, gibt es das Gesamtergebnis mit Note.
export default function ExamResult() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(() => api.get(`/student/pruefung/attempts/${id}`), [id]);
  const [state, setState] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const finalRef = useRef(null);
  useEffect(() => {
    if (!data) return;
    setState(data);
    if (data.score?.selfOpen === 0) setRevealed(true); // schon vollständig: Ergebnis gleich zeigen
  }, [data]);
  if (error) return <ErrorBox error={error} />;
  if ((loading && !data) || !state) return <PageLoader />;
  if (state.attempt.status !== 'done') return <ErrorBox error={new Error('Diese Prüfung ist noch nicht abgegeben.')} />;

  const { score, attempt } = state;
  const complete = score.selfOpen === 0;
  const grade = complete ? gradeFor(score.total, score.max) : null;
  const partial = attempt.sections.length < 2;

  const setSelf = async (itemId, points) => {
    const prev = state;
    setState((s) => ({ ...s, self: { ...s.self, [itemId]: points } }));
    try {
      const r = await api.put(`/student/pruefung/attempts/${id}/self`, { itemId, points });
      setState((s) => ({ ...s, self: r.self, score: r.score }));
      if (r.score.selfOpen > 0) setRevealed(false);
    } catch (e) {
      setState(prev);
      toast(e.message, 'error');
    }
  };
  const nextOpen = () => document.querySelector('[data-selfopen="1"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const reveal = () => {
    setRevealed(true);
    setTimeout(() => finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const pct = score.max ? Math.round((score.total / score.max) * 1000) / 10 : 0; // wie im Notenspiegel: eine Nachkommastelle
  const pctText = String(pct).replace('.', ',');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/pruefung" className="text-sm font-medium text-brand-600 hover:underline">← Zurück zu den Prüfungen</Link>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-2 text-sm text-indigo-100"><GraduationCap size={18} /> {state.exam.title} · abgegeben am {formatDate(attempt.finishedAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <div className="text-5xl font-extrabold tabular-nums leading-none">{fmtPts(score.total)}<span className="text-2xl font-bold text-indigo-200"> / {score.max}</span></div>
              <div className="mt-1 text-sm text-indigo-100">{complete ? 'Punkte' : 'Punkte bisher'} · {pctText} %</div>
            </div>
            <div className="mb-1 min-w-48 flex-1">
              <div className="h-3 overflow-hidden rounded-full bg-white/20">
                <div className="h-3 rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {grade && revealed && (
              <div className="animate-pop flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-2 ring-1 ring-white/25">
                <span className={`grid h-11 w-11 place-items-center rounded-xl text-2xl font-extrabold text-white ${GRADE_TONE[grade.grade]}`}>{grade.grade}</span>
                <span className="text-sm leading-tight"><span className="block text-indigo-100">Note</span><span className="font-semibold">{grade.label}</span></span>
              </div>
            )}
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
        {!complete ? (
          <div className="flex flex-col gap-3 border-t border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900 sm:flex-row sm:items-center">
            <PenLine size={18} className="shrink-0" />
            <span className="flex-1">Noch <b>{score.selfOpen} {score.selfOpen === 1 ? 'Teilaufgabe' : 'Teilaufgaben'}</b> selbst einschätzen: Du hast sie auf Papier bearbeitet (Zeichnungen, Begründungen, Rechenwege). Vergleiche mit der Musterlösung und trage ein, wie viele Punkte du bekommen hättest. Danach siehst du dein Gesamtergebnis und deine Note.</span>
            <button className="btn-secondary btn-sm shrink-0" onClick={nextOpen}><ArrowDown size={14} /> Zur nächsten offenen Aufgabe</button>
          </div>
        ) : !revealed ? (
          <div className="flex flex-col gap-3 border-t border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 sm:flex-row sm:items-center">
            <Sparkles size={18} className="shrink-0" />
            <span className="flex-1"><b>Alles eingetragen!</b> Jetzt kannst du dir dein Gesamtergebnis und deine Note anzeigen lassen.</span>
            <button className="btn-primary btn-sm shrink-0" onClick={reveal}><Award size={14} /> Gesamtergebnis anzeigen</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 border-t border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <Sparkles size={18} className="shrink-0" /> Fertig ausgewertet! Unten siehst du, wo du noch Punkte verschenkt hast.
          </div>
        )}
      </div>

      <ExamReview data={state} onSelf={setSelf} />

      {/* Gesamtergebnis mit Note */}
      <div ref={finalRef} className="scroll-mt-24">
        {!complete ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <Award size={32} className="text-slate-300" />
            <div className="font-semibold text-slate-700">Dein Gesamtergebnis und deine Note</div>
            <p className="max-w-md text-sm text-slate-500">Trage zuerst bei {score.selfOpen === 1 ? 'der letzten Teilaufgabe' : `den ${score.selfOpen} offenen Teilaufgaben`} ein, wie viele Punkte du bekommen hättest.</p>
            <button className="btn-secondary btn-sm" onClick={nextOpen}><ArrowDown size={14} /> Zur nächsten offenen Aufgabe</button>
          </div>
        ) : !revealed ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <Award size={36} className="text-brand-500" />
            <div className="text-lg font-bold text-slate-900">Alle Punkte sind eingetragen</div>
            <button className="btn-primary px-6 py-3 text-base" onClick={reveal}><Award size={18} /> Gesamtergebnis und Note anzeigen</button>
          </div>
        ) : (
          <FinalResult score={score} grade={grade} partial={partial} sections={attempt.sections} />
        )}
      </div>

      <div className="flex justify-end">
        <Link to="/pruefung" className="btn-primary">Zu den Prüfungen <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}

function FinalResult({ score, grade, partial, sections }) {
  return (
    <div className="card animate-pop overflow-hidden">
      <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-slate-900 to-brand-900 px-6 py-8 text-center text-white">
        <PartyPopper size={28} className="text-amber-300" />
        <div className="text-sm font-medium uppercase tracking-wider text-indigo-200">Dein Gesamtergebnis</div>
        <div className="text-5xl font-extrabold tabular-nums">{fmtPts(score.total)} <span className="text-2xl font-bold text-indigo-300">von {score.max} Punkten</span></div>
        <div className="text-indigo-100">{String(grade.percent).replace('.', ',')} %</div>
        <div className="mt-3 flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-4 ring-1 ring-white/20">
          <span className={`grid h-16 w-16 place-items-center rounded-2xl text-4xl font-extrabold text-white shadow-lg ${GRADE_TONE[grade.grade]}`}>{grade.grade}</span>
          <span className="text-left">
            <span className="block text-sm text-indigo-200">{partial ? 'Das wäre ungefähr die Note' : 'Damit hättest du die Note'}</span>
            <span className="text-2xl font-bold">{grade.label}</span>
          </span>
        </div>
        {partial && (
          <p className="mt-2 max-w-md text-xs text-indigo-200">
            Du hast nur {sections[0] === 'teil1' ? 'Hauptteil 1' : 'Hauptteil 2 und den Wahlteil'} bearbeitet. Die Note bezieht sich auf diesen Teil und ist nur eine Orientierung.
          </p>
        )}
      </div>
      <div className="p-5">
        <div className="label">Notenspiegel</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {GRADE_SCALE.map((g) => {
            const on = g.grade === grade.grade;
            return (
              <div key={g.grade} className={`rounded-xl border px-3 py-2.5 text-center transition ${on ? 'border-transparent text-white shadow-md ' + GRADE_TONE[g.grade] : 'border-slate-200 text-slate-600'}`}>
                <div className="text-xl font-extrabold">{g.grade}</div>
                <div className={`text-xs font-semibold ${on ? '' : 'text-slate-700'}`}>{g.label}</div>
                <div className={`text-[11px] ${on ? 'text-white/90' : 'text-slate-400'}`}>{gradeRange(g.grade)}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">Die Punkte bei Aufgaben auf Papier hast du selbst eingeschätzt. In der echten Prüfung bewertet deine Lehrkraft, deshalb kann die Note dort etwas anders ausfallen.</p>
      </div>
    </div>
  );
}
