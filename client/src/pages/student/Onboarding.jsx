import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, GraduationCap, School, Sparkles, Check } from 'lucide-react';
import { GOAL_OPTIONS } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useAuth, ErrorBox } from '../../components/ui.jsx';

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const step = grade ? 2 : 1;

  const save = async () => {
    try {
      const { user: u } = await api.post('/student/onboarding', { grade, profile });
      setUser(u);
      navigate('/');
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-4 ring-brand-100"><Sparkles size={26} /></div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hallo {user?.displayName?.split(' ')[0]}! 👋</h1>
        <p className="mt-2 text-slate-600">Bevor es losgeht, brauchen wir zwei kurze Angaben. So bekommst du genau die Aufgaben, die zu deiner Prüfung passen.</p>
      </div>

      <div className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-brand-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>1 · Jahrgang</span>
        <span className="h-px w-8 bg-slate-300" />
        <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>2 · Ziel</span>
      </div>

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[9, 10].map((g) => (
            <button key={g} onClick={() => { setGrade(g); setProfile(null); }} className="card group p-6 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><School size={24} /></div>
              <div className="text-3xl font-extrabold text-slate-900">{g}. Klasse</div>
              <div className="mt-1 text-sm text-slate-500">Ich bin im {g}. Jahrgang.</div>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-600">Auswählen <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-center text-lg font-semibold text-slate-800">Welchen Abschluss strebst du an?</h2>
          {GOAL_OPTIONS[grade].map((o) => (
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
          <div className="flex items-center justify-between pt-3">
            <button className="btn-ghost" onClick={() => setGrade(null)}><ArrowLeft size={16} /> Zurück</button>
            <button className="btn-primary px-6" disabled={!profile} onClick={save}>Los geht’s <ArrowRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
