import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { PROFILES, PROFILE_KEYS, TOPIC_ICONS, TOPIC_COLORS } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, Modal, toast, Icon, colorOf, MathContent } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';

export default function Topics() {
  const { data, error, loading, reload } = useLoad(() => api.get('/admin/topics'));
  const [edit, setEdit] = useState(null);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;

  const move = async (i, d) => {
    const ids = data.map((t) => t.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api.put('/admin/topics-order', { ids });
    reload();
  };
  const save = async () => {
    if (edit.id) await api.put(`/admin/topics/${edit.id}`, edit);
    else await api.post('/admin/topics', edit);
    toast('Themenbereich gespeichert');
    setEdit(null);
    reload();
  };
  const remove = async (t) => {
    if (!confirm(`Themenbereich „${t.title}“ mit allen Aufgaben, Übungspaketen und dem Skript endgültig löschen?`)) return;
    await api.del(`/admin/topics/${t.id}`);
    reload();
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="Themenbereiche" subtitle="Lege Themen an, wähle ein Symbol und bestimme, für welche Abschlüsse sie gelten.">
        <button className="btn-primary" onClick={() => setEdit({ title: '', description: '', keywords: '', example: '', icon: 'Sigma', color: 'indigo', profiles: [...PROFILE_KEYS] })}><Plus size={16} /> Neuer Themenbereich</button>
      </PageHeader>
      <div className="card divide-y divide-slate-100 overflow-hidden">
        {data.map((t, i) => (
          <div key={t.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
            <div className="flex flex-col text-slate-400">
              <button disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-slate-800 disabled:opacity-30"><ArrowUp size={14} /></button>
              <button disabled={i === data.length - 1} onClick={() => move(i, 1)} className="hover:text-slate-800 disabled:opacity-30"><ArrowDown size={14} /></button>
            </div>
            <TopicIcon topic={t} />
            <div className="min-w-52 flex-1">
              <div className="font-semibold text-slate-900">{t.title}</div>
              <div className="text-xs text-slate-500">{t.description}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {PROFILE_KEYS.map((k) => (
                <span key={k} className={`chip text-[11px] ${t.profiles.includes(k) ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-300 line-through'}`}>{PROFILES[k].short}</span>
              ))}
            </div>
            <div className="w-56 text-xs text-slate-500">{t.counts.diagnose} Diagnose · {t.counts.packages} Pakete · {t.counts.practice} Übungen · {t.counts.sections} Skript-Abschn.</div>
            <button className="btn-ghost btn-sm" onClick={() => setEdit({ ...t })}><Pencil size={14} /></button>
            <button className="btn-ghost btn-sm text-red-600" onClick={() => remove(t)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Themenbereich bearbeiten' : 'Neuer Themenbereich'} wide>
        {edit && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Titel</label><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} autoFocus /></div>
              <div><label className="label">Kurzbeschreibung</label><input className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-700">Erster Login: „Welche Themen sind dir bisher leichtgefallen?“</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Stichworte</label>
                  <input className="input" value={edit.keywords || ''} onChange={(e) => setEdit({ ...edit, keywords: e.target.value })} placeholder="z. B. Rabatt, Mehrwertsteuer, Zinsen" />
                </div>
                <div>
                  <label className="label">Mini-Beispielaufgabe (LaTeX mit $…$)</label>
                  <input className="input font-mono text-sm" value={edit.example || ''} onChange={(e) => setEdit({ ...edit, example: e.target.value })} placeholder="z. B. $20\,\%$ von $50$ € $= \;?$" />
                </div>
              </div>
              {(edit.keywords || edit.example) && (
                <div className="mt-3 flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <TopicIcon topic={edit} size="sm" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{edit.title || 'Vorschau'}</div>
                    {edit.keywords && <MathContent md={edit.keywords} className="text-xs text-slate-500 [&_p]:m-0" />}
                    {edit.example && <div className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200/70"><span className="mr-1 font-semibold text-slate-500">z. B.</span><MathContent md={edit.example} className="inline [&_p]:m-0 [&_p]:inline" /></div>}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="label">Symbol</label>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_ICONS.map((ic) => (
                  <button key={ic} type="button" onClick={() => setEdit({ ...edit, icon: ic })} className={`grid h-10 w-10 place-items-center rounded-xl border transition ${edit.icon === ic ? `border-transparent ${colorOf(edit.color).bg} ${colorOf(edit.color).text} ring-2 ring-brand-400` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={ic}>
                    <Icon name={ic} size={18} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Farbe</label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEdit({ ...edit, color: c })} className={`h-8 w-8 rounded-full ${colorOf(c).solid} ${edit.color === c ? 'ring-4 ring-slate-300 ring-offset-2' : ''}`} title={c} />
                ))}
              </div>
            </div>
            <div>
              <label className="label">Gilt für</label>
              <div className="flex flex-wrap gap-2">
                {PROFILE_KEYS.map((k) => {
                  const on = edit.profiles.includes(k);
                  return (
                    <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${on ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                      <input type="checkbox" checked={on} onChange={() => setEdit({ ...edit, profiles: on ? edit.profiles.filter((x) => x !== k) : [...edit.profiles, k] })} /> {PROFILES[k].label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-3"><TopicIcon topic={edit} /><span className="font-semibold text-slate-800">{edit.title || 'Vorschau'}</span></div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setEdit(null)}>Abbrechen</button>
                <button className="btn-primary" disabled={!edit.title.trim()} onClick={save}>Speichern</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
