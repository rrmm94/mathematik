import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { Loader2, AlertCircle, X, Check } from 'lucide-react';
import { ICONS } from '../lib/icons.js';
import { renderMarkdown } from '../lib/markdown.js';

// ---------- Auth-Kontext ----------
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ---------- Daten laden ----------
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return loader()
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })) };
}

// ---------- Mathe-Inhalt ----------
export function MathContent({ md, className = '' }) {
  return <div className={`prose-math ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(md || '') }} />;
}

// ---------- Themen-Symbole und Farben ----------
export const COLOR = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100', bar: 'bg-indigo-500', solid: 'bg-indigo-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100', bar: 'bg-sky-500', solid: 'bg-sky-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', bar: 'bg-emerald-500', solid: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100', bar: 'bg-amber-500', solid: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100', bar: 'bg-rose-500', solid: 'bg-rose-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100', bar: 'bg-violet-500', solid: 'bg-violet-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-100', bar: 'bg-teal-500', solid: 'bg-teal-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-100', bar: 'bg-orange-500', solid: 'bg-orange-500' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-100', bar: 'bg-cyan-500', solid: 'bg-cyan-500' },
  fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', ring: 'ring-fuchsia-100', bar: 'bg-fuchsia-500', solid: 'bg-fuchsia-500' },
  lime: { bg: 'bg-lime-50', text: 'text-lime-700', ring: 'ring-lime-100', bar: 'bg-lime-500', solid: 'bg-lime-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100', bar: 'bg-blue-500', solid: 'bg-blue-500' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', ring: 'ring-pink-100', bar: 'bg-pink-500', solid: 'bg-pink-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100', bar: 'bg-red-500', solid: 'bg-red-500' },
};
export const colorOf = (c) => COLOR[c] || COLOR.indigo;

export function Icon({ name, ...props }) {
  const C = ICONS[name] || ICONS.Sigma;
  return <C {...props} />;
}

export function TopicIcon({ topic, size = 'md' }) {
  const c = colorOf(topic?.color);
  const dims = size === 'lg' ? 'h-14 w-14 rounded-2xl' : size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-11 w-11 rounded-xl';
  const icon = size === 'lg' ? 28 : size === 'sm' ? 16 : 22;
  return (
    <div className={`${dims} ${c.bg} ${c.text} ring-4 ${c.ring} grid shrink-0 place-items-center`}>
      <Icon name={topic?.icon} size={icon} strokeWidth={2} />
    </div>
  );
}

export function ProgressBar({ value = 0, color = 'indigo', className = '', height = 'h-2' }) {
  const c = colorOf(color);
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height} ${className}`}>
      <div className={`${height} rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-brand-600 ${className}`} size={22} />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner />
    </div>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{error.message || String(error)}</span>
    </div>
  );
}

export function Empty({ icon = 'Inbox', title, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-slate-500">
      <Icon name={icon} size={28} className="text-slate-300" />
      <div className="font-medium text-slate-600">{title}</div>
      {children && <div className="text-sm">{children}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div className={`card animate-pop w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Schließen"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function formatDate(iso, opts = { weekday: 'short', day: '2-digit', month: '2-digit' }) {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso.replace(' ', 'T') + (iso.includes('Z') || iso.includes('+') ? '' : 'Z'));
  return d.toLocaleDateString('de-DE', opts);
}

export function formatDuration(ms) {
  if (!ms) return '–';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}:${String(s % 60).padStart(2, '0')} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

// Kleine Toast-Meldung
let toastSetter = null;
export function toast(msg, type = 'ok') {
  toastSetter?.({ msg, type, id: Date.now() });
}
export function Toaster() {
  const [t, setT] = useState(null);
  useEffect(() => {
    toastSetter = setT;
    return () => { toastSetter = null; };
  }, []);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), 2800);
    return () => clearTimeout(h);
  }, [t]);
  if (!t) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
      <div className={`animate-pop flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${t.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
        {t.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
        {t.msg}
      </div>
    </div>
  );
}
