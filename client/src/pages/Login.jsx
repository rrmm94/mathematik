import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sigma, LogIn, Target, Route as RouteIcon, BookOpen } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth, ErrorBox } from '../components/ui.jsx';
import { HelpButton } from '../components/Layout.jsx';

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.post('/login', form);
      setUser(user);
      navigate(user.role === 'admin' ? '/admin' : user.onboarded ? '/' : '/start');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-4"><HelpButton /></div>
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Sigma size={30} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-slate-900">Mathematik-Prüfungstrainer</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Fit für die <span className="text-brand-600">Mathe-Prüfung</span>.
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-600">Dein persönlicher Lernplan, passende Übungen und ein Skript zum Nachschlagen – alles an einem Ort.</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-600">
            {[
              [Target, 'Ein kurzer Einstiegstest zeigt, womit du am besten startest.'],
              [RouteIcon, 'Dein Lernplan sagt dir, was als Nächstes dran ist.'],
              [BookOpen, 'Zu jeder Aufgabe gibt es Erklärungen im Skript.'],
            ].map(([I, t]) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-slate-200"><I size={16} /></span>{t}</li>
            ))}
          </ul>
        </div>
        <form onSubmit={submit} className="card order-first space-y-4 p-7 sm:p-8 md:order-last">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Anmelden</h2>
            <p className="text-sm text-slate-500">Deine Kennung und dein Passwort bekommst du von deiner Lehrkraft.</p>
          </div>
          <div>
            <label className="label" htmlFor="u">Kennung</label>
            <input id="u" className="input py-2.5 text-base" autoComplete="username" autoCapitalize="none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="p">Passwort</label>
            <input id="p" type="password" className="input py-2.5 text-base" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <ErrorBox error={error} />
          <button className="btn-primary w-full py-3 text-base" disabled={busy}><LogIn size={18} /> Anmelden</button>
        </form>
      </div>
    </div>
  );
}
