import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, GraduationCap, Sparkles, Check } from 'lucide-react';
import { GOAL_OPTIONS } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useAuth, ErrorBox, PageLoader, TopicIcon, MathContent } from '../../components/ui.jsx';

// Erster Login: 1. Abschluss wählen (entfällt, wenn die Lehrkraft ihn vorgegeben hat),
// 2. Themen anhaken, die bisher leichtgefallen sind (freiwillig).
export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(user?.onboarded ? 2 : 1);
  const [choseGoal, setChoseGoal] = useState(false);
  const first = user?.displayName?.split(' ')[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-4 ring-brand-100"><Sparkles size={26} /></div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hallo {first}! 👋</h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">Bevor es losgeht, brauchen wir kurz deine Einschätzung. So bekommst du genau die Aufgaben, die zu dir und deiner Prüfung passen.</p>
      </div>

      {(choseGoal || !user?.onboarded) && (
        <div className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-brand-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>1 · Abschluss</span>
          <span className="h-px w-8 bg-slate-300" />
          <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>2 · Deine Themen</span>
        </div>
      )}

      {step === 1
        ? <GoalStep initial={user?.profile} onDone={(u) => { setUser(u); setChoseGoal(true); setStep(2); }} />
        : <TopicsStep onBack={choseGoal ? () => setStep(1) : null} onDone={setUser} />}
    </div>
  );
}

function GoalStep({ initial, onDone }) {
  const [profile, setProfile] = useState(initial || null);
  const [error, setError] = useState(null);
  const save = async () => {
    try {
      const { user } = await api.post('/student/onboarding', { profile });
      onDone(user);
    } catch (e) {
      setError(e);
    }
  };
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h2 className="text-center text-lg font-semibold text-slate-800">Welchen Abschluss strebst du an?</h2>
      {GOAL_OPTIONS.map((o) => (
        <button
          key={o.profile}
          onClick={() => setProfile(o.profile)}
          className={`card flex w-full items-center gap-4 p-5 text-left transition hover:border-brand-300 ${profile === o.profile ? 'border-brand-500 ring-4 ring-brand-500/15' : ''}`}
        >
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${profile === o.profile ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {profile === o.profile ? <Check size={22} /> : <GraduationCap size={22} />}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{o.title}</div>
            <div className="text-sm text-slate-500">{o.text}</div>
          </div>
        </button>
      ))}
      <ErrorBox error={error} />
      <div className="flex justify-end pt-3">
        <button className="btn-primary px-6" disabled={!profile} onClick={save}>Weiter <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

function TopicsStep({ onBack, onDone }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/student/onboarding/topics')
      .then((d) => { setData(d); setSelected(new Set(d.selected)); })
      .catch(setError);
  }, []);

  if (error && !data) return <ErrorBox error={error} />;
  if (!data) return <PageLoader />;

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const save = async () => {
    setBusy(true);
    try {
      const { user } = await api.put('/student/onboarding/topics', { topicIds: [...selected] });
      onDone(user);
      navigate('/');
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-800">Welche Themen sind dir bisher leichtgefallen?</h2>
        <p className="mt-1 text-sm text-slate-500">Hake alle Themen an, die du gut kannst. Du kannst auch keins anhaken – kein Problem.</p>
      </div>
      {!data.editable && <p className="rounded-xl bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">Du hast den Test schon gestartet – die Auswahl kann jetzt nicht mehr geändert werden.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.topics.map((t) => {
          const on = selected.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!data.editable}
              onClick={() => toggle(t.id)}
              aria-pressed={on}
              className={`card flex items-start gap-3 p-4 text-left transition hover:border-brand-300 ${on ? 'border-brand-500 bg-brand-50/40 ring-4 ring-brand-500/15' : ''}`}
            >
              <TopicIcon topic={t} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-snug text-slate-900">{t.title}</div>
                {t.keywords && <MathContent md={t.keywords} className="mt-0.5 text-xs text-slate-500 [&_p]:m-0" />}
                {t.example && (
                  <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200/70">
                    <span className="mr-1 font-semibold text-slate-500">z. B.</span>
                    <MathContent md={t.example} className="inline [&_p]:m-0 [&_p]:inline" />
                  </div>
                )}
              </div>
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'}`}>
                {on && <Check size={16} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <ErrorBox error={error} />
      <div className="flex items-center justify-between gap-3 pt-2">
        {onBack ? <button className="btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Zurück</button> : <span />}
        <button className="btn-primary px-6" disabled={busy || !data.editable} onClick={save}>
          {selected.size ? `Weiter (${selected.size} ${selected.size === 1 ? 'Thema' : 'Themen'})` : 'Weiter ohne Auswahl'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
