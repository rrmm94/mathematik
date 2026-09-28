import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ChevronRight, Layers, Info } from 'lucide-react';
import { PROFILES, DIFFICULTIES } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, toast } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';

export const plain = (md = '') => md.replace(/!\[[^\]]*\]\([^)]*\)/g, '[Bild]').replace(/\$\$?([^$]*)\$\$?/g, '$1').replace(/[*#>|`\\]/g, '').replace(/\s+/g, ' ').trim();

const DIFF_STYLE = ['bg-emerald-50 text-emerald-700', 'bg-amber-50 text-amber-700', 'bg-rose-50 text-rose-700'];

export default function DiagnoseTasks() {
  const [params, setParams] = useSearchParams();
  const profile = params.get('profile') || 'HS9';
  const navigate = useNavigate();
  const { data, error, loading } = useLoad(() => api.get(`/admin/diagnose-tasks?profile=${profile}`), [profile]);

  const create = async (topicId, difficulty) => {
    const r = await api.post('/admin/tasks', { kind: 'diagnose', topicId, profile, difficulty, title: `Neue Aufgabe (${DIFFICULTIES[difficulty - 1].label})` });
    toast('Aufgabe angelegt');
    navigate(`/admin/aufgabe/${r.id}`);
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="Diagnosetest" subtitle="Pro Abschluss und Thema gibt es drei Aufgaben: leicht, mittel und schwer. Daraus ergibt sich die Niveaustufe." />
      <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {Object.entries(PROFILES).map(([k, p]) => (
          <button key={k} onClick={() => setParams({ profile: k })} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${profile === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{p.short}</button>
        ))}
      </div>
      <p className="mb-4 flex items-start gap-2 text-sm text-slate-500"><Info size={16} className="mt-0.5 shrink-0" /> {PROFILES[profile].label}. Welche Themen zu welchem Abschluss gehören, stellst du unter „Themenbereiche“ ein.</p>

      {loading && !data ? <PageLoader /> : error ? <ErrorBox error={error} /> : (
        <div className="space-y-4">
          {data.topics.map((t) => {
            const active = t.profiles.length === 0 || t.profiles.includes(profile);
            if (!active && t.tasks.length === 0) return null;
            return (
              <div key={t.id} className={`card overflow-hidden ${active ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
                  <TopicIcon topic={t} size="sm" />
                  <div className="flex-1 font-semibold text-slate-900">{t.title}</div>
                  {!active && <span className="chip bg-slate-100 text-slate-500">nicht für dieses Profil aktiv</span>}
                  <span className="text-xs text-slate-500">{t.tasks.length} Aufgaben</span>
                </div>
                <div className="grid gap-3 p-4 md:grid-cols-3">
                  {DIFFICULTIES.map((d) => {
                    const tasks = t.tasks.filter((x) => x.difficulty === d.id);
                    return (
                      <div key={d.id} className="space-y-2">
                        <div className={`chip ${DIFF_STYLE[d.id - 1]}`}>{d.label}</div>
                        {tasks.map((x) => (
                          <Link key={x.id} to={`/admin/aufgabe/${x.id}`} className="group block rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/30">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-semibold text-slate-800">{x.title}</div>
                              <ChevronRight size={16} className="shrink-0 text-slate-400 group-hover:text-brand-600" />
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs text-slate-500">{plain(x.preview)}</div>
                            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-500"><Layers size={12} /> {x.variants} Varianten</div>
                          </Link>
                        ))}
                        {tasks.length === 0 && (
                          <button onClick={() => create(t.id, d.id)} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-700">
                            <Plus size={14} /> Aufgabe anlegen
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
