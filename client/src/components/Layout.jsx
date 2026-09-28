import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LifeBuoy, LogOut, Sigma, LayoutDashboard, Users, ClipboardList, BookOpen, Layers, CalendarDays, Settings, Home, Shapes } from 'lucide-react';
import { useAuth, toast } from './ui.jsx';
import { api } from '../lib/api.js';

// "Benötigst du Hilfe?" – auf allen Seiten gleich, oben rechts.
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
      className="btn bg-amber-400 px-3.5 py-2 text-amber-950 shadow-sm shadow-amber-500/30 hover:bg-amber-300"
    >
      <LifeBuoy size={18} />
      <span className="hidden sm:inline">Benötigst du Hilfe?</span>
      <span className="sm:hidden">Hilfe</span>
    </a>
  );
}

function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
        <Sigma size={20} strokeWidth={2.5} />
      </span>
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-[14px] font-bold text-slate-900 sm:text-[15px]">Mathe-Prüfungstrainer</span>
        <span className="hidden text-[11px] font-medium text-slate-500 sm:block">Fit für die Abschlussprüfung</span>
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
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
          <Logo />
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {user?.onboarded && (
              <Link to="/" className="btn-ghost hidden md:inline-flex"><Home size={17} /> Startseite</Link>
            )}
            <button onClick={logout} className="btn-ghost" title="Abmelden"><LogOut size={17} /><span className="hidden md:inline">Abmelden</span></button>
            <HelpButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
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
  { to: '/admin/einstellungen', label: 'Einstellungen', icon: Settings },
];

export function AdminLayout() {
  const logout = useLogout();
  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4">
          <Logo to="/admin" />
        </div>
        <div className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Lehrkraft</div>
        <nav className="flex flex-wrap gap-1 px-3 pb-3 lg:flex-col lg:flex-nowrap">
          {adminNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
          <button onClick={logout} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 lg:mt-4">
            <LogOut size={18} /> Abmelden
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, children, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link to={back.to} className="mb-1 inline-block text-sm font-medium text-brand-600 hover:underline">← {back.label}</Link>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
