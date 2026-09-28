import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Plus, Save, Trash2, CopyPlus, FlaskConical, CheckCircle2, XCircle, Info } from 'lucide-react';
import { PROFILES, DIFFICULTIES, LEVELS } from '../../../../shared/constants.js';
import { checkAnswer, publicAnswerSpec, parseNumber } from '../../../../shared/checker.js';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, toast, MathContent, Modal } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';
import MarkdownEditor from '../../components/MarkdownEditor.jsx';
import AnswerInput from '../../components/AnswerInput.jsx';

// Eingaben (evtl. mit Komma, als Text) in saubere Zahlen umwandeln
const toNum = (x) => (typeof x === 'number' ? x : parseNumber(x));
function normalizeSpec(spec) {
  if (spec?.type !== 'fields') return spec;
  return {
    ...spec,
    parts: spec.parts.map((p) => {
      const alts = Array.isArray(p.alternatives) ? p.alternatives : String(p.alternatives || '').split(';').map((a) => a.trim()).filter(Boolean);
      if (p.kind === 'text') return { ...p, value: String(p.value ?? ''), tolerance: 0, alternatives: alts.map(String) };
      return { ...p, value: toNum(p.value), tolerance: toNum(p.tolerance) || 0, alternatives: alts.map(toNum).filter((n) => !Number.isNaN(n)) };
    }),
  };
}
const showNum = (x) => (typeof x === 'number' ? String(x).replace('.', ',') : x ?? '');

const emptyVariant = () => ({ prompt: '', answer: { type: 'fields', parts: [{ label: '', kind: 'number', value: 0, tolerance: 0, unit: '', alternatives: [] }] }, solution: '', hint: '' });

export default function TaskEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(async () => {
    const d = await api.get(`/admin/tasks/${id}`);
    const packages = d.task.kind === 'practice' ? await api.get(`/admin/topics/${d.task.topic_id}/packages`) : [];
    return { ...d, packages };
  }, [id]);
  const [task, setTask] = useState(null);
  const [variants, setVariants] = useState([]);
  const [active, setActive] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTask(data.task);
    setVariants(data.variants.length ? data.variants : [emptyVariant()]);
    setActive(0);
    setDirty(false);
  }, [data]);

  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  if (!task) return <PageLoader />;

  const upd = (patch) => { setTask({ ...task, ...patch }); setDirty(true); };
  const updV = (patch) => { setVariants(variants.map((v, i) => (i === active ? { ...v, ...patch } : v))); setDirty(true); };
  const v = variants[active];

  const save = async () => {
    await api.put(`/admin/tasks/${task.id}`, {
      title: task.title, difficulty: task.difficulty, profile: task.profile, packageId: task.package_id,
      scriptSectionId: task.script_section_id || null, variants: variants.map((x) => ({ ...x, answer: normalizeSpec(x.answer) })),
    });
    toast('Aufgabe gespeichert');
    reload();
  };
  const duplicate = async () => {
    const r = await api.post(`/admin/tasks/${task.id}/duplicate`);
    toast('Kopie angelegt');
    navigate(`/admin/aufgabe/${r.id}`);
  };
  const remove = async () => {
    if (!confirm('Diese Aufgabe mit allen Varianten löschen?')) return;
    await api.del(`/admin/tasks/${task.id}`);
    navigate(task.kind === 'diagnose' ? `/admin/diagnose?profile=${task.profile}` : `/admin/uebungen?topic=${task.topic_id}`);
  };
  const addVariant = (copy) => {
    const nv = copy ? { ...structuredClone(v), id: undefined } : emptyVariant();
    setVariants([...variants, nv]);
    setActive(variants.length);
    setDirty(true);
  };
  const removeVariant = () => {
    if (variants.length <= 1) return;
    if (!confirm(`Variante ${active + 1} löschen?`)) return;
    setVariants(variants.filter((_, i) => i !== active));
    setActive(Math.max(0, active - 1));
    setDirty(true);
  };

  const back = task.kind === 'diagnose'
    ? { to: `/admin/diagnose?profile=${task.profile}`, label: 'Diagnosetest' }
    : { to: `/admin/uebungen?topic=${task.topic_id}`, label: 'Übungsaufgaben' };

  return (
    <div className="max-w-6xl pb-20">
      <PageHeader title={task.title || 'Aufgabe'} subtitle={`${data.topic.title} · ${task.kind === 'diagnose' ? `Diagnose · ${PROFILES[task.profile]?.short}` : `Übung · ${data.package?.title || ''}`}`} back={back}>
        <button className="btn-secondary" onClick={() => setPreview(true)}><FlaskConical size={16} /> Als Kind testen</button>
        <button className="btn-secondary" onClick={duplicate}><Copy size={16} /> Duplizieren</button>
        <button className="btn-danger" onClick={remove}><Trash2 size={16} /></button>
        <button className="btn-primary" disabled={!dirty} onClick={save}><Save size={16} /> Speichern</button>
      </PageHeader>

      <div className="card mb-5 grid gap-4 p-5 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="label">Titel (intern & für Kinder sichtbar)</label>
          <input className="input" value={task.title || ''} onChange={(e) => upd({ title: e.target.value })} />
        </div>
        {task.kind === 'diagnose' ? (
          <>
            <div>
              <label className="label">Abschluss / Profil</label>
              <select className="input" value={task.profile} onChange={(e) => upd({ profile: e.target.value })}>
                {Object.entries(PROFILES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Schwierigkeit</label>
              <select className="input" value={task.difficulty} onChange={(e) => upd({ difficulty: Number(e.target.value) })}>
                {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="md:col-span-2">
            <label className="label">Übungspaket</label>
            <select className="input" value={task.package_id || ''} onChange={(e) => upd({ package_id: Number(e.target.value) })}>
              {data.packages.map((p) => <option key={p.id} value={p.id}>{LEVELS[p.level]?.short} · {p.title}</option>)}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="label">„Skript“-Button springt zu …</label>
          <select className="input" value={task.script_section_id || ''} onChange={(e) => upd({ script_section_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">– kein Skript-Abschnitt –</option>
            {data.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        {data.stats?.attempts > 0 && (
          <div className="flex items-end gap-4 text-sm text-slate-600 md:col-span-2">
            <span><b>{data.stats.attempts}</b> Versuche</span>
            <span><b>{Math.round(((data.stats.correct || 0) / data.stats.attempts) * 100)} %</b> richtig</span>
            <span>Ø <b>{Math.round((data.stats.avg_ms || 0) / 1000)} s</b></span>
          </div>
        )}
      </div>

      {/* Varianten */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 pt-3">
          {variants.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={`rounded-t-lg border border-b-0 px-4 py-2 text-sm font-semibold transition ${active === i ? 'border-slate-200 bg-white text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              Variante {i + 1}
            </button>
          ))}
          {variants.length < 8 && (
            <>
              <button onClick={() => addVariant(true)} className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800" title="Aktuelle Variante kopieren"><CopyPlus size={14} /> kopieren</button>
              <button onClick={() => addVariant(false)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800"><Plus size={14} /> leer</button>
            </>
          )}
          {variants.length > 1 && <button onClick={removeVariant} className="ml-auto mb-1 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 size={14} /> Variante löschen</button>}
        </div>
        <div className="space-y-6 p-5">
          <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">
            <Info size={14} className="mt-0.5 shrink-0" />
            Jedes Kind bekommt zufällig eine der Varianten (z. B. mit anderen Zahlen). Bei den Übungen kann das Kind mit „Neue Zahlen“ eine andere Variante ziehen.
          </p>
          <MarkdownEditor label="Aufgabenstellung" value={v.prompt} onChange={(prompt) => updV({ prompt })} rows={9} />
          <AnswerSpecEditor spec={v.answer} onChange={(answer) => updV({ answer })} />
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <MarkdownEditor label="Lösungsweg / Musterlösung" value={v.solution} onChange={(solution) => updV({ solution })} rows={6} />
            <div>
              <label className="label">Tipp (optional)</label>
              <textarea className="input" rows={4} value={v.hint || ''} onChange={(e) => updV({ hint: e.target.value })} placeholder="Wird auf Wunsch vor der Lösung angezeigt." />
            </div>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="fixed bottom-5 right-5 z-40">
          <button className="btn-primary px-6 py-3 shadow-xl" onClick={save}><Save size={18} /> Änderungen speichern</button>
        </div>
      )}

      <Modal open={preview} onClose={() => setPreview(false)} title={`Vorschau – Variante ${active + 1}`} wide>
        <PreviewTask variant={{ ...v, answer: normalizeSpec(v.answer) }} />
      </Modal>
    </div>
  );
}

function PreviewTask({ variant }) {
  const [val, setVal] = useState(null);
  const [res, setRes] = useState(null);
  const spec = publicAnswerSpec(variant.answer);
  return (
    <div className="space-y-5">
      <MathContent md={variant.prompt} />
      <AnswerInput spec={spec} value={val} onChange={(x) => { setVal(x); setRes(null); }} status={spec.type === 'free' ? null : res} onSubmit={() => setRes(checkAnswer(variant.answer, val))} />
      {res && variant.answer.type !== 'free' && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${res.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {res.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />} {res.correct ? 'Würde als richtig gewertet.' : 'Würde als falsch gewertet.'}
        </div>
      )}
      {res && variant.answer.type === 'free' && <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">Freitext wird nicht automatisch bewertet – das Kind sieht die Musterlösung.</div>}
      <div className="flex justify-end"><button className="btn-primary" onClick={() => setRes(checkAnswer(variant.answer, val))}>Prüfen</button></div>
      {variant.solution && <div className="rounded-xl bg-brand-50/50 p-4"><div className="label">Lösungsweg</div><MathContent md={variant.solution} /></div>}
    </div>
  );
}

// Editor für die Musterlösung
function AnswerSpecEditor({ spec, onChange }) {
  const type = spec?.type || 'fields';
  const setType = (t) => {
    if (t === type) return;
    if (t === 'fields') onChange({ type: 'fields', parts: [{ label: '', kind: 'number', value: 0, tolerance: 0, unit: '', alternatives: [] }] });
    if (t === 'choice') onChange({ type: 'choice', multiple: false, options: [{ text: '', correct: true }, { text: '', correct: false }] });
    if (t === 'free') onChange({ type: 'free', sample: '' });
  };
  const types = [
    ['fields', 'Zahl / Eingabefelder', 'Ein oder mehrere Felder (a, b, x₁ …), automatisch geprüft'],
    ['choice', 'Multiple Choice', 'Eine oder mehrere richtige Antworten'],
    ['free', 'Freitext / Begründung', 'Keine automatische Prüfung, Musterlösung zum Vergleich'],
  ];
  return (
    <div>
      <label className="label">Antwort & Musterlösung</label>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {types.map(([k, l, d]) => (
          <button key={k} type="button" onClick={() => setType(k)} className={`rounded-xl border p-3 text-left transition ${type === k ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className={`text-sm font-semibold ${type === k ? 'text-brand-700' : 'text-slate-800'}`}>{l}</div>
            <div className="text-xs text-slate-500">{d}</div>
          </button>
        ))}
      </div>

      {type === 'fields' && (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_110px_1fr_90px_80px_1fr_32px] gap-2 px-1 text-[11px] font-semibold uppercase text-slate-500 md:grid">
            <span>Beschriftung</span><span>Typ</span><span>Lösung</span><span>Toleranz ±</span><span>Einheit</span><span>weitere Lösungen</span><span />
          </div>
          {spec.parts.map((p, i) => {
            const setP = (patch) => onChange({ ...spec, parts: spec.parts.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-2 md:grid-cols-[1fr_110px_1fr_90px_80px_1fr_32px] md:border-0 md:p-0">
                <input className="input" placeholder="z. B. a) oder x =" value={p.label || ''} onChange={(e) => setP({ label: e.target.value })} />
                <select className="input" value={p.kind || 'number'} onChange={(e) => setP({ kind: e.target.value })}>
                  <option value="number">Zahl</option><option value="text">Text</option>
                </select>
                <input className="input font-mono" placeholder="Lösung" value={showNum(p.value)} onChange={(e) => setP({ value: e.target.value })} />
                <input className="input font-mono" placeholder="0" disabled={p.kind === 'text'} value={showNum(p.tolerance ?? 0)} onChange={(e) => setP({ tolerance: e.target.value })} />
                <input className="input" placeholder="z. B. cm²" value={p.unit || ''} onChange={(e) => setP({ unit: e.target.value })} />
                <input className="input font-mono" placeholder="z. B. 0,75; 3/4" value={Array.isArray(p.alternatives) ? p.alternatives.map(showNum).join('; ') : p.alternatives || ''} onChange={(e) => setP({ alternatives: e.target.value })} />
                <button type="button" className="btn-ghost btn-sm text-red-600" disabled={spec.parts.length <= 1} onClick={() => onChange({ ...spec, parts: spec.parts.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button type="button" className="btn-secondary btn-sm" onClick={() => onChange({ ...spec, parts: [...spec.parts, { label: '', kind: 'number', value: 0, tolerance: 0, unit: '', alternatives: [] }] })}><Plus size={14} /> Feld hinzufügen</button>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={!!spec.unordered} onChange={(e) => onChange({ ...spec, unordered: e.target.checked })} /> Reihenfolge egal (z. B. x₁ und x₂)
            </label>
          </div>
          <p className="text-xs text-slate-500">Komma oder Punkt werden akzeptiert, ebenso Brüche wie „3/4“. Toleranz z. B. 0,01 für auf zwei Stellen gerundete Ergebnisse.</p>
        </div>
      )}

      {type === 'choice' && (
        <div className="space-y-2">
          {spec.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <label className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${o.correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'}`}>
                <input type="checkbox" checked={!!o.correct} onChange={(e) => onChange({ ...spec, options: spec.options.map((x, j) => (j === i ? { ...x, correct: e.target.checked } : spec.multiple ? x : { ...x, correct: e.target.checked ? false : x.correct })) })} /> richtig
              </label>
              <input className="input" placeholder={`Antwort ${i + 1}`} value={o.text} onChange={(e) => onChange({ ...spec, options: spec.options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              <button type="button" className="btn-ghost btn-sm text-red-600" disabled={spec.options.length <= 2} onClick={() => onChange({ ...spec, options: spec.options.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button type="button" className="btn-secondary btn-sm" onClick={() => onChange({ ...spec, options: [...spec.options, { text: '', correct: false }] })}><Plus size={14} /> Antwort hinzufügen</button>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={!!spec.multiple} onChange={(e) => onChange({ ...spec, multiple: e.target.checked })} /> Mehrere Antworten richtig</label>
          </div>
        </div>
      )}

      {type === 'free' && (
        <div className="space-y-2">
          <textarea className="input" rows={3} placeholder="Musterantwort (wird dem Kind nach dem Abgeben zum Vergleich gezeigt)" value={spec.sample || ''} onChange={(e) => onChange({ ...spec, sample: e.target.value })} />
          <p className="flex items-start gap-2 text-xs text-slate-500"><Info size={14} className="mt-0.5 shrink-0" /> Eine automatische Bewertung per KI ist vorbereitet und kann später in den Einstellungen aktiviert werden. Im Diagnosetest zählen Freitext-Aufgaben nicht für die Niveaustufe.</p>
        </div>
      )}
    </div>
  );
}
