import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, Sparkles, Check } from 'lucide-react';
import { GOAL_OPTIONS } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useAuth, ErrorBox } from '../../components/ui.jsx';

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const save = async () => {
    try {
      const { user: u } = await api.post('/student/onboarding', { profile });
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
        <p className="mt-2 text-slate-600">Bevor es losgeht, brauchen wir eine kurze Angabe. So bekommst du genau die Aufgaben, die zu deiner Prüfung passen.</p>
      </div>

      <div className="space-y-3">
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
          <button className="btn-primary px-6" disabled={!profile} onClick={save}>Los geht’s <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
