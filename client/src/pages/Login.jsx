import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sigma, LogIn, Target, Route as RouteIcon, BookOpen } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth, ErrorBox } from '../components/ui.jsx';
import { LegalLinks } from '../components/Layout.jsx';

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
      <header className="flex min-h-[62px] items-center border-b border-slate-200 bg-white px-[var(--gutter)]">
        <div className="flex items-center gap-3 py-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c2b39] text-white"><Sigma size={20} strokeWidth={2.4} /></span>
          <span className="leading-tight">
            <span className="block text-[1.06rem] font-bold text-slate-900">Mathematik-Prüfungstrainer</span>
            <span className="block text-[.74rem] text-slate-500">Fit für die Abschlussprüfung</span>
          </span>
        </div>
      </header>
      <div className="mx-auto grid max-w-[80rem] items-start gap-x-14 gap-y-10 px-[var(--gutter)] py-[clamp(28px,4vw,64px)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div>
          <h1 className="text-[clamp(2.4rem,1.6rem+2.8vw,4rem)] font-bold leading-[1.02] tracking-[-.025em] text-slate-900 max-w-[14ch]">
            Fit für die Mathe-Prüfung.
          </h1>
          <p className="mt-4 mb-8 max-w-[58ch] text-[1.05rem] leading-relaxed text-slate-500">Dein persönlicher Lernplan, passende Übungen und ein Skript zum Nachschlagen. Alles an einem Ort.</p>
          <ol className="grid border-t-2 border-slate-900 sm:grid-cols-3">
            {[
              [Target, 'Einstiegstest', 'Ein kurzer Test zeigt, womit du am besten startest.'],
              [RouteIcon, 'Lernplan', 'Dein Lernplan sagt dir, was als Nächstes dran ist.'],
              [BookOpen, 'Skript', 'Zu jeder Aufgabe gibt es Erklärungen zum Nachlesen.'],
            ].map(([I, h, t], i) => (
              <li key={h} className="flex flex-col gap-1 border-slate-200 py-4 sm:pr-5 sm:[&+li]:border-l sm:[&+li]:pl-5 max-sm:[&+li]:border-t">
                <span className="font-mono text-[.76rem] font-medium text-brand-600">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex items-center gap-2 text-[1.2rem] font-bold text-slate-900"><I size={18} className="text-slate-500" /> {h}</span>
                <span className="text-[.92rem] text-slate-500">{t}</span>
              </li>
            ))}
          </ol>
        </div>
        <form onSubmit={submit} className="night-card order-first space-y-4 p-6 md:order-last">
          <div>
            <h2 className="text-[1.25rem] font-bold">Anmelden</h2>
            <p className="mt-1 text-[.9rem] text-night-muted">Deine Kennung und dein Passwort bekommst du von deiner Lehrkraft.</p>
          </div>
          <div className="border-t border-night-line pt-4">
            <label className="label text-night-ink" htmlFor="u">Kennung</label>
            <input id="u" className="input border-night-line bg-night-2 text-night-ink" autoComplete="username" autoCapitalize="none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="label text-night-ink" htmlFor="p">Passwort</label>
            <input id="p" type="password" className="input border-night-line bg-night-2 text-night-ink" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <ErrorBox error={error} />
          <button className="btn min-h-11 w-full border-brand-400 bg-brand-400 text-base font-bold text-[#1b0c03] hover:brightness-105" disabled={busy}><LogIn size={18} /> Anmelden</button>
        </form>
      </div>
      <LegalLinks className="pb-8" />
    </div>
  );
}
