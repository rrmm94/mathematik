import { useRef, useState } from 'react';
import { Bold, Image, Sigma, Table, Divide, Superscript, Radical, Loader2, Eye, Pencil, Columns2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { MathContent, toast } from './ui.jsx';

// Textfeld für Freitext + LaTeX ($…$) + Bilder/SVG mit Live-Vorschau.
export default function MarkdownEditor({ value, onChange, rows = 8, placeholder, label }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('split');

  const insert = (before, after = '', fallback = '') => {
    const el = ref.current;
    const v = value || '';
    const start = el ? el.selectionStart : v.length;
    const end = el ? el.selectionEnd : v.length;
    const sel = v.slice(start, end) || fallback;
    const next = v.slice(0, start) + before + sel + after + v.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + sel.length);
    });
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, name } = await api.upload(file);
      insert(`\n![${name.replace(/\.[a-z]+$/i, '')}](${url})\n`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const tools = [
    { icon: Bold, title: 'Fett', fn: () => insert('**', '**', 'Text') },
    { icon: Sigma, title: 'Formel im Text  $…$', fn: () => insert('$', '$', 'x^2') },
    { icon: Columns2, title: 'Formel abgesetzt  $$…$$', fn: () => insert('\n$$', '$$\n', 'a^2 + b^2 = c^2') },
    { icon: Divide, title: 'Bruch', fn: () => insert('$\\frac{', '}{4}$', '3') },
    { icon: Superscript, title: 'Potenz', fn: () => insert('$', '^{2}$', 'x') },
    { icon: Radical, title: 'Wurzel', fn: () => insert('$\\sqrt{', '}$', '2') },
    { icon: Table, title: 'Tabelle', fn: () => insert('\n| $x$ | 1 | 2 | 3 |\n|---|---|---|---|\n| $y$ | 2 | 4 | 6 |\n') },
  ];

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1">
          {tools.map((t) => (
            <button key={t.title} type="button" title={t.title} onClick={t.fn} className="rounded-md p-1.5 text-slate-600 hover:bg-white hover:text-slate-900"><t.icon size={16} /></button>
          ))}
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <button type="button" title="Bild oder GeoGebra-SVG hochladen" onClick={() => fileRef.current?.click()} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Image size={15} />} Bild / SVG
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.svg" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          <div className="ml-auto flex rounded-md bg-slate-200/70 p-0.5">
            {[['edit', Pencil], ['split', Columns2], ['preview', Eye]].map(([m, I]) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`rounded p-1 ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} title={m === 'edit' ? 'Nur Text' : m === 'split' ? 'Text + Vorschau' : 'Nur Vorschau'}><I size={14} /></button>
            ))}
          </div>
        </div>
        <div className={`grid ${mode === 'split' ? 'md:grid-cols-2' : ''}`}>
          {mode !== 'preview' && (
            <textarea
              ref={ref}
              rows={rows}
              value={value || ''}
              placeholder={placeholder || 'Text eingeben … Formeln mit $…$, z. B. $\\frac{3}{4}$ oder $a^2 + b^2 = c^2$'}
              onChange={(e) => onChange(e.target.value)}
              onPaste={(e) => {
                const f = [...(e.clipboardData?.files || [])][0];
                if (f && f.type.startsWith('image/')) { e.preventDefault(); upload(f); }
              }}
              onDrop={(e) => {
                const f = e.dataTransfer?.files?.[0];
                if (f) { e.preventDefault(); upload(f); }
              }}
              className="block w-full resize-y border-0 bg-white px-3 py-2.5 font-mono text-[13px] leading-relaxed text-slate-800 outline-none"
            />
          )}
          {mode !== 'edit' && (
            <div className={`min-h-24 overflow-auto bg-slate-50/40 px-4 py-2 ${mode === 'split' ? 'border-t border-slate-200 md:border-l md:border-t-0' : ''}`}>
              {value?.trim() ? <MathContent md={value} /> : <p className="py-2 text-sm text-slate-400">Vorschau</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
