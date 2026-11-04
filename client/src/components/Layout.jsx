import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LifeBuoy, LogOut, Sigma, LayoutDashboard, Users, ClipboardList, BookOpen, Layers, CalendarDays, Settings, Shapes, KeyRound, Flag } from 'lucide-react';
import { MIN_STUDENT_PASSWORD } from '../../../shared/constants.js';
import { useAuth, toast, Modal } from './ui.jsx';
import { api } from '../lib/api.js';

// "Benötigst du Hilfe?" – auf allen Seiten gleich, oben rechts.
export function LegalLinks({ className = '' }) {
  return (
    <nav className={`flex justify-center gap-4 text-xs text-slate-500 ${className}`}>
      <Link className="hover:text-slate-800 hover:underline" to="/impressum">Impressum</Link>
      <Link className="hover:text-slate-800 hover:underline" to="/datenschutz">Datenschutz</Link>
    </nav>
  );
}

export function HelpButton() {
  const { chatbotUrl } = useAuth();
  const onClick = (e) => {
    if (!chatbotUrl) {
      e.preventDefault();
      toast('Der Hilfe-Chat wurde noch nicht eingerichtet. Frag deine Lehrkraft.', 'error');
    }
  };
  return (
    <a
      href={chatbotUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="btn border-brand-500 bg-brand-500 px-3.5 font-bold text-white hover:bg-brand-600"
    >
      <LifeBuoy size={18} />
      <span className="hidden sm:inline">Benötigst du Hilfe?</span>
      <span className="sm:hidden">Hilfe</span>
    </a>
  );
}

function Logo({ to = '/', wrap = false }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1c2b39] text-white">
        <Sigma size={20} strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className={`block text-[.95rem] font-bold text-slate-900 ${wrap ? '' : 'sm:whitespace-nowrap'} sm:text-[1.06rem]`}>Mathematik-<wbr />Prüfungstrainer</span>
        <span className="hidden text-[.74rem] text-slate-500 sm:block">Fit für die Abschlussprüfung</span>
      </span>
    </Link>
  );
}

function useLogout() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  return async () => {
    await api.post('/logout');
    setUser(null);
    navigate('/login');
  };
}

export function StudentLayout() {
  const { user } = useAuth();
  const logout = useLogout();
  const [pwOpen, setPwOpen] = useState(false);
  // Hilfe gibt es erst nach abgegebenem Einstiegstest (und nie währenddessen, auch nicht beim Wiederholungstest).
  const inDiagnose = useLocation().pathname.startsWith('/diagnose');
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex min-h-[62px] items-center gap-x-7 gap-y-1 px-[var(--gutter)]">
          <div className="mr-auto min-w-0"><Logo /></div>
          {user?.onboarded && (
            <nav className="hidden self-stretch md:flex" aria-label="Bereiche">
              <NavLink to="/" end className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>Mein Lernplan</NavLink>
            </nav>
          )}
          <div className="flex shrink-0 items-center gap-2 py-2.5">
            <button onClick={() => setPwOpen(true)} className="icon-btn" title="Passwort ändern" aria-label="Passwort ändern"><KeyRound size={17} /></button>
            <button onClick={logout} className="icon-btn" title="Abmelden" aria-label="Abmelden"><LogOut size={17} /></button>
            {user?.diagDone && !inDiagnose && <HelpButton />}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[80rem] px-[var(--gutter)] pt-[clamp(24px,3.4vw,48px)] pb-16">
        <Outlet />
      </main>
      <LegalLinks className="pb-6" />
      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function ChangePassword({ onClose }) {
  const [oldPassword, setOld] = useState('');
  const [newPassword, setNew] = useState('');
  const [repeat, setRepeat] = useState('');
  const [err, setErr] = useState(null);
  const mismatch = repeat && newPassword !== repeat;
  const save = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.put('/student/password', { oldPassword, newPassword });
      toast('Dein Passwort wurde geändert');
      onClose();
    } catch (ex) {
      setErr(ex.message);
    }
  };
  return (
    <Modal open onClose={onClose} title="Passwort ändern">
      <form onSubmit={save} className="space-y-4">
        <div><label className="label">Bisheriges Passwort</label><input type="password" className="input" value={oldPassword} onChange={(e) => setOld(e.target.value)} autoComplete="current-password" autoFocus /></div>
        <div><label className="label">Neues Passwort</label><input type="password" className="input" value={newPassword} onChange={(e) => setNew(e.target.value)} placeholder={`mind. ${MIN_STUDENT_PASSWORD} Zeichen`} autoComplete="new-password" /></div>
        <div>
          <label className="label">Neues Passwort wiederholen</label>
          <input type="password" className="input" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" />
          {mismatch && <p className="mt-1 text-xs text-red-600">Die beiden Passwörter sind nicht gleich.</p>}
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" disabled={!oldPassword || newPassword.length < MIN_STUDENT_PASSWORD || newPassword !== repeat}>Speichern</button>
        </div>
      </form>
    </Modal>
  );
}

const adminNav = [
  { to: '/admin', label: 'Übersicht', icon: LayoutDashboard, end: true },
  { to: '/admin/kurse', label: 'Kurse & Kinder', icon: Users },
  { to: '/admin/diagnose', label: 'Diagnosetest', icon: ClipboardList },
  { to: '/admin/uebungen', label: 'Übungsaufgaben', icon: Layers },
  { to: '/admin/skript', label: 'Skript', icon: BookOpen },
  { to: '/admin/themen', label: 'Themenbereiche', icon: Shapes },
  { to: '/admin/termine', label: 'Termine', icon: CalendarDays },
  { to: '/admin/rueckmeldungen', label: 'Rückmeldungen', icon: Flag },
  { to: '/admin/einstellungen', label: 'Einstellungen', icon: Settings },
];

export function AdminLayout() {
  const logout = useLogout();
  return (
    <div className="min-h-screen">
      {/* Kopfleiste mit Reitern wie in der 3D-Druck Werkstatt */}
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-7 border-b border-slate-200 bg-white px-[var(--gutter)]">
        <div className="mr-auto min-w-0"><Logo to="/admin" /></div>
        <div className="flex items-center gap-2 py-2.5 2xl:order-last">
          <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-[.74rem] font-bold text-brand-600">Lehrkraft</span>
          <button onClick={logout} className="icon-btn" title="Abmelden" aria-label="Abmelden"><LogOut size={17} /></button>
        </div>
        <nav className="order-last -mx-[var(--gutter)] flex basis-[calc(100%+2*var(--gutter))] gap-1 self-stretch overflow-x-auto border-t border-slate-200 px-[calc(var(--gutter)-10px)] [scrollbar-width:none] 2xl:order-none 2xl:m-0 2xl:basis-auto 2xl:border-t-0 2xl:p-0" aria-label="Bereiche">
          {adminNav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto min-w-0 max-w-[92rem] px-[var(--gutter)] pt-[clamp(24px,3.4vw,48px)] pb-16">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, children, back }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0 flex-[1_1_30rem]">
        {back && <Link to={back.to} className="mb-2 inline-block text-sm font-semibold text-brand-600 underline-offset-4 hover:underline">← {back.label}</Link>}
        <h1 className="display mb-[.3em] text-slate-900">{title}</h1>
        {subtitle && <p className="max-w-[58ch] text-[1.05rem] leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
