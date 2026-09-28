import { Link } from 'react-router-dom';
import { Users, ClipboardList, Layers, Shapes, ArrowRight, Activity } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Empty, formatDate } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';

export default function AdminOverview() {
  const { data, error, loading } = useLoad(() => api.get('/admin/overview'));
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { counts, courses, recent } = data;
  const stats = [
    { label: 'Kinder', value: counts.students, icon: Users, to: '/admin/kurse', color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Themenbereiche', value: counts.topics, icon: Shapes, to: '/admin/themen', color: 'text-teal-600 bg-teal-50' },
    { label: 'Diagnoseaufgaben', value: counts.diagnose, icon: ClipboardList, to: '/admin/diagnose', color: 'text-amber-600 bg-amber-50' },
    { label: 'Übungsaufgaben', value: counts.practice, icon: Layers, to: '/admin/uebungen', color: 'text-rose-600 bg-rose-50' },
  ];
  return (
    <div className="max-w-6xl">
      <PageHeader title="Übersicht" subtitle="Alles Wichtige auf einen Blick." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card flex items-center gap-4 p-5 transition hover:border-slate-300">
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${s.color}`}><s.icon size={22} /></span>
            <div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="font-semibold text-slate-900">Kurse</h2>
            <Link to="/admin/kurse" className="text-sm font-medium text-brand-600 hover:underline">Alle verwalten</Link>
          </div>
          {courses.length === 0 ? <Empty title="Noch keine Kurse" /> : (
            <ul className="divide-y divide-slate-100">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/kurse/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                    <span className="font-medium text-slate-800">{c.name}</span>
                    <span className="flex items-center gap-2 text-sm text-slate-500">{c.students} Kinder <ArrowRight size={14} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <Activity size={18} className="text-emerald-600" />
            <h2 className="font-semibold text-slate-900">Aktiv in den letzten 7 Tagen</h2>
          </div>
          {recent.length === 0 ? <Empty title="Noch keine Aktivität" /> : (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link to={`/admin/kinder/${r.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                    <span className="font-medium text-slate-800">{r.display_name}</span>
                    <span className="text-sm text-slate-500">{r.n} Versuche · zuletzt {formatDate(r.last)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
