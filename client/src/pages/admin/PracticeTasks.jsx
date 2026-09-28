import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, ChevronRight, Layers, Trash2, PackagePlus } from 'lucide-react';
import { LEVELS, PROFILES, PROFILE_KEYS } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, Modal, toast, Empty } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';

export default function PracticeTasks() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const topics = useLoad(() => api.get('/admin/topics'));
  const topicId = Number(params.get('topic')) || topics.data?.[0]?.id;
  const pkgs = useLoad(() => (topicId ? api.get(`/admin/topics/${topicId}/packages`) : Promise.resolve([])), [topicId]);
  const [edit, setEdit] = useState(null);

  if (topics.loading) return <PageLoader />;
  if (topics.error) return <ErrorBox error={topics.error} />;
  const topic = topics.data.find((t) => t.id === topicId);

  const savePkg = async () => {
    const body = { ...edit, topicId };
    if (edit.id) await api.put(`/admin/packages/${edit.id}`, body);
    else await api.post('/admin/packages', body);
    toast('Übungspaket gespeichert');
    setEdit(null);
    pkgs.reload();
  };
  const delPkg = async (p) => {
    if (!confirm(`Übungspaket „${p.title}“ mit allen Aufgaben löschen?`)) return;
    await api.del(`/admin/packages/${p.id}`);
    pkgs.reload();
  };
  const addTask = async (p) => {
    const r = await api.post('/admin/tasks', { kind: 'practice', topicId, packageId: p.id, title: 'Neue Übungsaufgabe' });
    navigate(`/admin/aufgabe/${r.id}`);
  };

  return (
    <div className="max-w-7xl">
      <PageHeader title="Übungsaufgaben" subtitle="Übungspakete je Themenbereich und Niveaustufe. Die Kinder sehen nur die Pakete ihrer freigeschalteten Stufen – ohne Stufenangabe." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="card h-fit p-2">
          {topics.data.map((t) => (
            <button key={t.id} onClick={() => setParams({ topic: t.id })} className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm ${t.id === topicId ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <TopicIcon topic={t} size="sm" /> <span className="flex-1 truncate">{t.title}</span> <span className="text-xs text-slate-400">{t.counts.practice}</span>
            </button>
          ))}
        </nav>
        <div>
          {topic && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><TopicIcon topic={topic} /><h2 className="text-lg font-bold text-slate-900">{topic.title}</h2></div>
              <button className="btn-primary" onClick={() => setEdit({ title: '', description: '', level: 1, profiles: topic.profiles })}><PackagePlus size={16} /> Neues Übungspaket</button>
            </div>
          )}
          {pkgs.loading && !pkgs.data ? <PageLoader /> : pkgs.error ? <ErrorBox error={pkgs.error} /> : (
            <div className="grid gap-4 xl:grid-cols-2">
              {LEVELS.map((l) => {
                const list = pkgs.data.filter((p) => p.level === l.id);
                return (
                  <div key={l.id} className="card overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: l.color }} />
                      <span className="font-semibold text-slate-900">{l.label}</span>
                      <span className="ml-auto text-xs text-slate-500">{list.length} Pakete</span>
                    </div>
                    {list.length === 0 ? <Empty title="Keine Pakete" /> : (
                      <div className="divide-y divide-slate-100">
                        {list.map((p) => (
                          <div key={p.id} className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-800">{p.title}</div>
                                <div className="mt-0.5 flex flex-wrap gap-1">
                                  {(p.profiles.length ? p.profiles : PROFILE_KEYS).map((k) => <span key={k} className="chip bg-slate-100 text-[10px] text-slate-600">{PROFILES[k]?.short}</span>)}
                                </div>
                              </div>
                              <button className="btn-ghost btn-sm" onClick={() => setEdit({ ...p })}><Pencil size={14} /></button>
                              <button className="btn-ghost btn-sm text-red-600" onClick={() => delPkg(p)}><Trash2 size={14} /></button>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {p.tasks.map((t) => (
                                <li key={t.id}>
                                  <Link to={`/admin/aufgabe/${t.id}`} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-700">
                                    <span className="flex-1 truncate">{t.title}</span>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><Layers size={11} /> {t.variants}</span>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-600" />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            <button className="mt-1 flex items-center gap-1 px-2 text-xs font-medium text-brand-600 hover:underline" onClick={() => addTask(p)}><Plus size={12} /> Aufgabe hinzufügen</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Übungspaket bearbeiten' : 'Neues Übungspaket'}>
        {edit && (
          <div className="space-y-4">
            <div><label className="label">Titel (für Kinder sichtbar)</label><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="z. B. Grundwert berechnen" autoFocus /></div>
            <div><label className="label">Beschreibung</label><input className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            <div>
              <label className="label">Niveaustufe (nur für dich sichtbar)</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LEVELS.map((l) => (
                  <button key={l.id} type="button" onClick={() => setEdit({ ...edit, level: l.id })} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${edit.level === l.id ? 'border-transparent text-white' : 'border-slate-200 text-slate-600'}`} style={edit.level === l.id ? { background: l.color } : undefined}>{l.short}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Für welche Abschlüsse?</label>
              <div className="flex flex-wrap gap-2">
                {PROFILE_KEYS.map((k) => {
                  const on = (edit.profiles || []).includes(k);
                  return (
                    <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${on ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                      <input type="checkbox" checked={on} onChange={() => setEdit({ ...edit, profiles: on ? edit.profiles.filter((x) => x !== k) : [...(edit.profiles || []), k] })} /> {PROFILES[k].short}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-slate-500">Keine Auswahl = für alle.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEdit(null)}>Abbrechen</button>
              <button className="btn-primary" disabled={!edit.title.trim()} onClick={savePkg}>Speichern</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
