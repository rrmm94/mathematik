import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, FileText, Image, Link2, Plus, Save, Trash2, Video, Upload, Loader2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, toast, Empty } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';
import MarkdownEditor from '../../components/MarkdownEditor.jsx';
import ScriptBlocks, { youtubeId } from '../../components/ScriptBlocks.jsx';

export default function ScriptEditor() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topics = useLoad(() => api.get('/admin/topics'));
  const current = Number(topicId) || topics.data?.[0]?.id;
  const script = useLoad(() => (current ? api.get(`/admin/topics/${current}/script`) : Promise.resolve(null)), [current]);

  if (topics.loading) return <PageLoader />;
  if (topics.error) return <ErrorBox error={topics.error} />;

  const addSection = async () => {
    await api.post('/admin/script-sections', { topicId: current, title: 'Neuer Abschnitt', blocks: [{ type: 'text', md: '' }] });
    script.reload();
  };
  const move = async (idx, dir) => {
    const ids = script.data.sections.map((s) => s.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await api.put('/admin/script-order', { ids });
    script.reload();
  };

  return (
    <div className="max-w-7xl">
      <PageHeader title="Skript" subtitle="Erklärungen zu jedem Themenbereich – mit Text, LaTeX-Formeln, Bildern, GeoGebra-SVGs, Videos und Links mit QR-Code." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="card h-fit p-2">
          {topics.data.map((t) => (
            <button key={t.id} onClick={() => navigate(`/admin/skript/${t.id}`)} className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm ${t.id === current ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <TopicIcon topic={t} size="sm" /> <span className="flex-1 truncate">{t.title}</span> <span className="text-xs text-slate-400">{t.counts.sections}</span>
            </button>
          ))}
        </nav>
        <div className="space-y-4">
          {script.loading && !script.data ? <PageLoader /> : script.error ? <ErrorBox error={script.error} /> : script.data && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3"><TopicIcon topic={script.data.topic} /><h2 className="text-lg font-bold text-slate-900">{script.data.topic.title}</h2></div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={addSection}><Plus size={16} /> Abschnitt hinzufügen</button>
                </div>
              </div>
              {script.data.sections.length === 0 && <div className="card"><Empty title="Noch keine Abschnitte" /></div>}
              {script.data.sections.map((s, i) => (
                <SectionEditor key={s.id} section={s} index={i} count={script.data.sections.length} onMove={(d) => move(i, d)} onChanged={script.reload} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const BLOCK_TYPES = [
  { type: 'text', label: 'Text / LaTeX', icon: FileText, make: () => ({ type: 'text', md: '' }) },
  { type: 'image', label: 'Bild / SVG', icon: Image, make: () => ({ type: 'image', url: '', caption: '' }) },
  { type: 'video', label: 'YouTube-Video', icon: Video, make: () => ({ type: 'video', url: '', title: '' }) },
  { type: 'link', label: 'Link + QR-Code', icon: Link2, make: () => ({ type: 'link', url: '', title: '', qr: true }) },
];

function SectionEditor({ section, index, count, onMove, onChanged }) {
  const [title, setTitle] = useState(section.title);
  const [blocks, setBlocks] = useState(section.blocks);
  const [preview, setPreview] = useState(false);
  useEffect(() => { setTitle(section.title); setBlocks(section.blocks); }, [section]);
  const dirty = title !== section.title || JSON.stringify(blocks) !== JSON.stringify(section.blocks);

  const save = async () => {
    await api.put(`/admin/script-sections/${section.id}`, { title, blocks });
    toast('Abschnitt gespeichert');
    onChanged();
  };
  const remove = async () => {
    if (!confirm(`Abschnitt „${section.title}“ löschen?`)) return;
    await api.del(`/admin/script-sections/${section.id}`);
    onChanged();
  };
  const setB = (i, patch) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const moveB = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };

  return (
    <div className={`card overflow-hidden ${dirty ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <span className="text-sm font-bold text-brand-600">{index + 1}.</span>
        <input className="input max-w-md flex-1 font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="ml-auto flex items-center gap-1">
          <button className="btn-ghost btn-sm" disabled={index === 0} onClick={() => onMove(-1)} title="Nach oben"><ArrowUp size={14} /></button>
          <button className="btn-ghost btn-sm" disabled={index === count - 1} onClick={() => onMove(1)} title="Nach unten"><ArrowDown size={14} /></button>
          <button className={`btn-ghost btn-sm ${preview ? 'text-brand-700' : ''}`} onClick={() => setPreview(!preview)}><Eye size={14} /> Vorschau</button>
          <button className="btn-ghost btn-sm text-red-600" onClick={remove}><Trash2 size={14} /></button>
          <button className="btn-primary btn-sm" disabled={!dirty} onClick={save}><Save size={14} /> Speichern</button>
        </div>
      </div>
      {preview ? (
        <div className="p-6"><ScriptBlocks blocks={blocks} /></div>
      ) : (
        <div className="space-y-4 p-4">
          {blocks.map((b, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                {BLOCK_TYPES.find((t) => t.type === b.type)?.label}
                <div className="ml-auto flex gap-1">
                  <button className="btn-ghost btn-sm" disabled={i === 0} onClick={() => moveB(i, -1)}><ArrowUp size={12} /></button>
                  <button className="btn-ghost btn-sm" disabled={i === blocks.length - 1} onClick={() => moveB(i, 1)}><ArrowDown size={12} /></button>
                  <button className="btn-ghost btn-sm text-red-600" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
                </div>
              </div>
              <BlockEditor block={b} onChange={(patch) => setB(i, patch)} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((t) => (
              <button key={t.type} className="btn-secondary btn-sm" onClick={() => setBlocks([...blocks, t.make()])}><t.icon size={14} /> {t.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockEditor({ block, onChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  if (block.type === 'text') return <MarkdownEditor value={block.md} onChange={(md) => onChange({ md })} rows={8} />;
  if (block.type === 'image') {
    const upload = async (f) => {
      if (!f) return;
      setBusy(true);
      try {
        const { url } = await api.upload(f);
        onChange({ url });
      } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
    };
    return (
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-32 w-48 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
          {block.url ? <img src={block.url} alt="" className="max-h-full max-w-full object-contain" /> : <Image className="text-slate-300" />}
        </div>
        <div className="min-w-60 flex-1 space-y-2">
          <button className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Bild oder GeoGebra-SVG hochladen</button>
          <input ref={fileRef} type="file" className="hidden" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.svg" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          <input className="input" placeholder="Bildunterschrift (optional)" value={block.caption || ''} onChange={(e) => onChange({ caption: e.target.value })} />
          <input className="input" placeholder="Breite, z. B. 320px oder 60% (optional)" value={block.width || ''} onChange={(e) => onChange({ width: e.target.value })} />
          <p className="text-xs text-slate-500">GeoGebra: „Datei → Exportieren → Grafik (SVG)“ und die Datei hier hochladen.</p>
        </div>
      </div>
    );
  }
  if (block.type === 'video') {
    const ok = youtubeId(block.url);
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder="YouTube-Link, z. B. https://youtu.be/…" value={block.url} onChange={(e) => onChange({ url: e.target.value })} />
        <input className="input" placeholder="Titel (optional)" value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
        {block.url && <p className={`text-xs sm:col-span-2 ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{ok ? 'Video erkannt – es wird datenschutzfreundlich über youtube-nocookie.com eingebettet.' : 'Kein YouTube-Link erkannt – es wird als normaler Link angezeigt.'}</p>}
      </div>
    );
  }
  if (block.type === 'link') {
    return (
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input" placeholder="https://…" value={block.url} onChange={(e) => onChange({ url: e.target.value })} />
        <input className="input" placeholder="Linktext" value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={!!block.qr} onChange={(e) => onChange({ qr: e.target.checked })} /> QR-Code</label>
      </div>
    );
  }
  return null;
}
