import { useState } from 'react';
import { FilePlus2, CopyPlus } from 'lucide-react';
import { PROFILES, DIFFICULTIES } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useLoad, toast, Modal } from '../../components/ui.jsx';

const plain = (md) => String(md || '').replace(/[$*_`#>|]|!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);

// Kopiert die aktuelle Variante in eine andere Aufgabe (als weitere Variante) oder als neue Aufgabe in eine Gruppe.
export default function CopyVariantModal({ open, onClose, variant, currentTask, topics, onDone }) {
  const [topicId, setTopicId] = useState(currentTask.topic_id);
  const [busy, setBusy] = useState(false);
  const { data: targets } = useLoad(() => api.get('/admin/task-targets'), []);
  const { data: packages } = useLoad(() => api.get(`/admin/topics/${topicId}/packages`), [topicId]);
  if (!open) return null;

  const clean = () => { const { id: _id, task_id: _t, ...rest } = variant; return rest; };
  const run = async (fn, label) => {
    setBusy(true);
    try {
      await fn();
      toast(`Variante kopiert nach: ${label}`);
      onDone?.();
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const here = (targets || []).filter((t) => t.topic_id === Number(topicId));
  const groups = [
    ...Object.entries(PROFILES).flatMap(([profile, p]) => DIFFICULTIES.map((d) => ({
      key: `d-${profile}-${d.id}`, title: `Diagnosetest · ${p.short} · ${d.label}`,
      tasks: here.filter((t) => t.kind === 'diagnose' && t.profile === profile && t.difficulty === d.id),
      create: { kind: 'diagnose', profile, difficulty: d.id },
    }))),
    ...(packages || []).map((pk) => ({
      key: `p-${pk.id}`, title: `Übung · ${pk.title}`,
      tasks: here.filter((t) => t.kind === 'practice' && t.package_id === pk.id),
      create: { kind: 'practice', packageId: pk.id },
    })),
  ];

  return (
    <Modal open onClose={onClose} title="Variante kopieren nach …" wide>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Kopiert die aktuelle Variante (so wie sie gerade im Editor steht). Du kannst sie als weitere Variante an eine bestehende Aufgabe hängen oder als neue Aufgabe in einer Gruppe anlegen. Die Originalvariante bleibt unverändert.</p>
        <div>
          <label className="label">Thema</label>
          <select className="input" value={topicId} onChange={(e) => setTopicId(Number(e.target.value))}>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {groups.map((g) => (
            <section key={g.key} className="rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                <h3 className="text-sm font-semibold text-slate-800">{g.title}</h3>
                <button
                  className="btn-secondary btn-sm" disabled={busy}
                  onClick={() => run(async () => {
                    await api.post('/admin/tasks', { ...g.create, topicId, title: currentTask.title || 'Neue Aufgabe', variants: [clean()] });
                  }, `${g.title} (neue Aufgabe)`)}
                ><FilePlus2 size={14} /> Als neue Aufgabe</button>
              </div>
              {g.tasks.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400">Noch keine Aufgaben in dieser Gruppe.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {g.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">{t.title || 'Aufgabe'} <span className="font-normal text-slate-400">· {t.variants} Variante{t.variants === 1 ? '' : 'n'}</span></div>
                        <div className="truncate text-xs text-slate-500">{plain(t.preview)}</div>
                      </div>
                      <button
                        className="btn-secondary btn-sm shrink-0" disabled={busy || t.variants >= 8 || t.id === currentTask.id}
                        title={t.id === currentTask.id ? 'Das ist die aktuelle Aufgabe. Dafür gibt es „kopieren“ neben den Varianten' : t.variants >= 8 ? 'Schon 8 Varianten' : undefined}
                        onClick={() => run(() => api.post(`/admin/tasks/${t.id}/variants`, { variant: clean() }), t.title || 'Aufgabe')}
                      ><CopyPlus size={14} /> Als Variante</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
