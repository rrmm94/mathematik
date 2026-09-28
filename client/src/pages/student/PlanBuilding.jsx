import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Loader2, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { TopicIcon } from '../../components/ui.jsx';

const STEPS_INITIAL = [
  'Deine Antworten werden ausgewertet',
  'Stärken und Übungsfelder werden erkannt',
  'Passende Übungsaufgaben werden ausgewählt',
  'Die Reihenfolge deiner Themen wird festgelegt',
  'Dein persönlicher Lernplan wird erstellt',
];
const STEPS_RETEST = [
  'Deine Antworten werden ausgewertet',
  'Vergleich mit deinem letzten Test',
  'Deine Fortschritte werden zusammengestellt',
];

// Visualisierung: "Dein individueller Lernplan wird erstellt"
export default function PlanBuilding() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const retest = state?.kind === 'retest';
  const steps = retest ? STEPS_RETEST : STEPS_INITIAL;
  const total = retest ? 4500 : 8000;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const h = setInterval(() => setElapsed(Math.min(total, Date.now() - t0)), 50);
    return () => clearInterval(h);
  }, [total]);

  // leicht "ungleichmäßiger" Fortschritt wirkt echter
  const raw = elapsed / total;
  const progress = Math.round(100 * (raw < 0.5 ? raw * 1.2 : 0.6 + (raw - 0.5) * 0.8));
  const current = Math.min(steps.length - 1, Math.floor(raw * steps.length));
  const done = elapsed >= total;

  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="card overflow-hidden p-8 text-center">
        <div className="relative mx-auto mb-6 h-24 w-24">
          <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#eef2ff" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="#4f46e5" strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset .2s linear' }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            {done ? <Sparkles className="animate-pop text-brand-600" size={34} /> : <span className="text-xl font-bold tabular-nums text-slate-900">{progress}%</span>}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {done ? (retest ? 'Auswertung fertig!' : 'Dein Lernplan ist fertig!') : retest ? 'Dein Test wird ausgewertet …' : 'Dein individueller Lernplan wird erstellt …'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{done ? (retest ? 'Schau dir an, was sich getan hat.' : 'Er passt genau zu dir und deinem Ziel.') : 'Einen Moment bitte – wir suchen die besten Aufgaben für dich heraus.'}</p>

        <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
          {steps.map((s, i) => {
            const isDone = done || i < current;
            const active = !done && i === current;
            return (
              <li key={s} className={`flex items-center gap-3 text-sm transition ${isDone ? 'text-slate-700' : active ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${isDone ? 'bg-emerald-500 text-white' : active ? 'bg-brand-100 text-brand-600' : 'bg-slate-100'}`}>
                  {isDone ? <Check size={14} strokeWidth={3} /> : active ? <Loader2 size={14} className="animate-spin" /> : null}
                </span>
                {s}
              </li>
            );
          })}
        </ul>

        {done && retest && (
          <div className="animate-pop mt-8 rounded-2xl bg-emerald-50 p-5 text-left">
            {state.improved?.length ? (
              <>
                <div className="flex items-center gap-2 font-semibold text-emerald-800"><TrendingUp size={18} /> Hier hast du dich verbessert:</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {state.improved.map((t) => <span key={t.id} className="chip bg-white py-1 pl-1 pr-3 text-slate-700 ring-1 ring-emerald-200"><TopicIcon topic={t} size="sm" /> {t.title}</span>)}
                </div>
              </>
            ) : (
              <div className="font-semibold text-emerald-800">Danke fürs Mitmachen! Bleib dran – jede Übung zählt.</div>
            )}
            <p className="mt-3 text-sm text-slate-600">Deine Lehrkraft sieht dein Ergebnis und kann dir bei Bedarf auch schwierigere Aufgaben freischalten.</p>
          </div>
        )}

        {done && (
          <button className="btn-primary animate-pop mt-8 px-8 py-3 text-base" onClick={() => navigate('/', { replace: true })}>
            {retest ? 'Zur Startseite' : 'Zu meinem Lernplan'} <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
