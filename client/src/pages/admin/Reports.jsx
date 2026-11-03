import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Flag, Pencil, RotateCcw, ThumbsDown, ThumbsUp, Trash2, User } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Empty, formatDate, toast } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';
import { LevelBadge } from './StudentDetail.jsx';

// Rückmeldungen der Kinder: gemeldete Probleme zu Übungspaketen und Daumen-Bewertungen der Aufgaben.
export default function Reports() {
  const { data, error, loading, reload } = useLoad(() => api.get('/admin/reports'));
  const [tab, setTab] = useState('reports');
  const [showDone, setShowDone] = useState(false);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const open = data.reports.filter((r) => !r.resolved_at);
  const list = showDone ? data.reports : open;

  const resolve = async (r, resolved) => {
    await api.put(`/admin/reports/${r.id}`, { resolved });
    toast(resolved ? 'Als erledigt markiert' : 'Wieder geöffnet');
    reload();
  };
  const remove = async (r) => {
    if (!confirm('Meldung löschen?')) return;
    await api.del(`/admin/reports/${r.id}`);
    reload();
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="Rückmeldungen der Kinder" subtitle="Gemeldete Probleme zu Übungspaketen und wie die Kinder die einzelnen Aufgaben bewertet haben." />
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 sm:inline-flex">
        {[['reports', `Gemeldete Probleme (${open.length} offen)`], ['ratings', `Bewertungen (${data.ratings.length} Aufgaben)`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'reports' && (
        <>
          <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Erledigte Meldungen anzeigen
          </label>
          <div className="card divide-y divide-slate-100">
            {list.length === 0 ? <Empty icon="Inbox" title={showDone ? 'Noch keine Meldungen' : 'Keine offenen Meldungen'} /> : list.map((r) => (
              <div key={r.id} className={`flex flex-wrap gap-4 px-5 py-4 ${r.resolved_at ? 'opacity-60' : ''}`}>
                <Flag size={18} className={`mt-0.5 shrink-0 ${r.resolved_at ? 'text-slate-400' : 'text-amber-500'}`} />
                <div className="min-w-60 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Link to={`/admin/kinder/${r.user_id}`} className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-brand-700 hover:underline"><User size={12} /> {r.display_name}</Link>
                    <span>{r.topic_title}</span>
                    <span className="font-semibold text-slate-700">{r.package_title || 'Paket gelöscht'}</span>
                    <LevelBadge level={r.level} small />
                    {r.task_no ? <span className="chip bg-slate-100 text-slate-600">Aufgabe {r.task_no}{r.task_title ? `: ${r.task_title}` : ''}</span> : <span className="chip bg-slate-100 text-slate-500">ganzes Paket</span>}
                    <span>{formatDate(r.created_at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-800">{r.text}</p>
                </div>
                <div className="flex items-start gap-1">
                  {r.task_id && <Link to={`/admin/aufgabe/${r.task_id}`} className="btn-ghost btn-sm" title="Aufgabe bearbeiten"><Pencil size={14} /> Aufgabe</Link>}
                  {!r.task_id && r.topic_id && <Link to={`/admin/uebungen?topic=${r.topic_id}`} className="btn-ghost btn-sm" title="Paket ansehen"><Pencil size={14} /> Paket</Link>}
                  {r.resolved_at
                    ? <button className="btn-ghost btn-sm" onClick={() => resolve(r, false)}><RotateCcw size={14} /> Wieder öffnen</button>
                    : <button className="btn-secondary btn-sm" onClick={() => resolve(r, true)}><Check size={14} /> Erledigt</button>}
                  <button className="btn-ghost btn-sm text-red-600" onClick={() => remove(r)} aria-label="Löschen"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'ratings' && (
        <div className="card overflow-x-auto">
          {data.ratings.length === 0 ? <Empty icon="Inbox" title="Noch keine Bewertungen">Die Kinder können jede Übungsaufgabe freiwillig mit Daumen hoch oder runter bewerten.</Empty> : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Aufgabe</th><th>Stufe</th><th className="text-center">Gut</th><th className="text-center">Nicht so gut</th><th className="px-3">Von</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.ratings.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">Aufgabe {t.no}: {t.title}</div>
                      <div className="text-xs text-slate-500">{t.topic_title} · {t.package_title}</div>
                    </td>
                    <td className="py-3"><LevelBadge level={t.level} small /></td>
                    <td className="py-3 text-center"><span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><ThumbsUp size={15} /> {t.up}</span></td>
                    <td className="py-3 text-center"><span className={`inline-flex items-center gap-1 font-semibold ${t.down ? 'text-rose-600' : 'text-slate-300'}`}><ThumbsDown size={15} /> {t.down}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.voters.map((v) => (
                          <Link key={v.id} to={`/admin/kinder/${v.id}`} className={`chip ${v.value > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} hover:underline`}>
                            {v.value > 0 ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />} {v.display_name}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right"><Link to={`/admin/aufgabe/${t.id}`} className="btn-ghost btn-sm"><Pencil size={14} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
