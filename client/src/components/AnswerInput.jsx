import { Check, RotateCcw, X } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown.js';
import { MathContent } from './ui.jsx';
import { CoordinateInput, LivePlot } from './GraphWidgets.jsx';

const Inline = ({ md, className = '' }) => (
  <span className={`prose-math inline [&_p]:my-0 [&_p]:inline ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(md || '') }} />
);

const stateClass = (status, i) => {
  if (!status?.parts) return '';
  return status.parts[i]
    ? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500'
    : 'border-red-300 bg-red-50 focus:border-red-400';
};

const Mark = ({ status, i }) => (status?.parts ? (
  <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${status.parts[i] ? 'text-emerald-600' : 'text-red-500'}`}>
    {status.parts[i] ? <Check size={16} /> : <X size={16} />}
  </span>
) : null);

// Ein einzelnes Eingabefeld je nach Art (Zahl, Text, Term, a·10ⁿ, Auswahl).
function PartField({ part, i, value, onChange, status, disabled, onSubmit, compact }) {
  const kind = part.kind || 'number';
  const state = stateClass(status, i);
  const common = {
    disabled, autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false, autoComplete: 'off',
    onKeyDown: (e) => e.key === 'Enter' && onSubmit?.(),
  };

  if (kind === 'select') {
    return (
      <span className="relative">
        <select className={`input ${compact ? 'w-auto' : 'w-auto min-w-44 max-w-full'} pr-8 font-medium ${state}`} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">– wählen –</option>
          {(part.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Mark status={status} i={i} />
      </span>
    );
  }

  if (kind === 'sci') {
    const [a = '', n = ''] = String(value ?? '').split('e');
    const set = (na, nn) => onChange(na === '' && nn === '' ? '' : `${na}e${nn}`);
    return (
      <span className="relative inline-flex items-center gap-1.5">
        <input className={`input w-24 text-center text-base font-medium tabular-nums ${state}`} value={a} placeholder="a" inputMode="decimal" {...common} onChange={(e) => set(e.target.value.replace(/e/gi, ''), n)} />
        <span className="font-medium text-slate-600">· 10</span>
        <input className={`input w-16 -translate-y-2 text-center text-sm font-medium tabular-nums ${state}`} value={n} placeholder="n" inputMode="numeric" {...common} onChange={(e) => set(a, e.target.value.replace(/e/gi, ''))} />
        <Mark status={status} i={i} />
      </span>
    );
  }

  const placeholder = part.placeholder || (kind === 'expr' ? 'z. B. 2x + 5' : '?');
  return (
    <span className="relative">
      <input
        className={`input ${compact ? 'w-20 px-1 text-center' : kind === 'expr' ? 'w-52 pr-8' : 'w-36 pr-8'} text-base font-medium tabular-nums ${state}`}
        value={value ?? ''}
        placeholder={placeholder}
        inputMode={kind === 'number' ? 'decimal' : undefined}
        {...common}
        onChange={(e) => onChange(e.target.value)}
      />
      {!compact && <Mark status={status} i={i} />}
    </span>
  );
}

function FieldsInput({ spec, value, onChange, status, disabled, onSubmit }) {
  const vals = Array.isArray(value) ? value : [];
  const setAt = (i) => (v) => {
    const next = [...vals];
    next[i] = v;
    onChange(next);
  };
  const layout = spec.layout;
  const from = layout ? layout.from || 0 : spec.parts.length;
  const cells = layout ? layout.rows.length * layout.cols.length : 0;

  const renderPart = (p, i) => (
    <label key={i} className="flex flex-wrap items-center gap-2">
      {p.label && <span className="text-sm font-medium text-slate-600"><Inline md={p.label} /></span>}
      <PartField part={p} i={i} value={vals[i]} onChange={setAt(i)} status={status} disabled={disabled} onSubmit={onSubmit} />
      {p.unit && <span className="text-sm text-slate-500">{p.unit}</span>}
    </label>
  );

  // Gleiche Werte in einer Spalte hervorheben (z. B. beim Lösen von Gleichungssystemen mit Wertetabelle)
  const colMatch = (c) => {
    if (!layout.highlightEqual || layout.rows.length < 2) return false;
    const col = layout.rows.map((_, r) => String(vals[from + r * layout.cols.length + c] ?? '').trim());
    return col.every((v) => v !== '') && col.every((v) => v.replace(',', '.') === col[0].replace(',', '.'));
  };

  return (
    <div className="space-y-4">
      {spec.parts.slice(0, from).length > 0 && (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">{spec.parts.slice(0, from).map((p, i) => renderPart(p, i))}</div>
      )}
      {layout && (
        <>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th className="px-2 text-left text-xs font-semibold text-slate-500">{layout.corner}</th>
                  {layout.cols.map((c, ci) => (
                    <th key={ci} className={`min-w-16 rounded-lg px-2 py-1.5 text-center font-semibold ${colMatch(ci) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}><Inline md={String(c)} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {layout.rows.map((rl, r) => (
                  <tr key={r}>
                    <th className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-left font-semibold text-slate-700"><Inline md={String(rl)} /></th>
                    {layout.cols.map((_, c) => {
                      const i = from + r * layout.cols.length + c;
                      return (
                        <td key={c} className="p-0 text-center">
                          <PartField part={spec.parts[i]} i={i} value={vals[i]} onChange={setAt(i)} status={status} disabled={disabled} onSubmit={onSubmit} compact />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {layout.plot && <LivePlot plot={layout.plot} rows={layout.rows} values={vals.slice(from, from + cells)} />}
        </>
      )}
      {spec.parts.slice(from + cells).length > 0 && (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">{spec.parts.slice(from + cells).map((p, k) => renderPart(p, from + cells + k))}</div>
      )}
    </div>
  );
}

function OrderInput({ spec, value, onChange, status, disabled }) {
  const picked = (Array.isArray(value) ? value : []).map(Number);
  const rest = spec.items.map((_, i) => i).filter((i) => !picked.includes(i));
  const tone = status ? (status.correct ? 'border-emerald-400 bg-emerald-50' : 'border-red-300 bg-red-50') : 'border-slate-200 bg-slate-50';
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Tippe die Karten in der richtigen Reihenfolge an. Eine gesetzte Karte kannst du wieder antippen, um sie zu entfernen.</p>
      <div className="flex flex-wrap gap-2">
        {rest.map((i) => (
          <button key={i} type="button" disabled={disabled} onClick={() => onChange([...picked, i])} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-800 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 active:scale-95">
            <Inline md={spec.items[i]} />
          </button>
        ))}
        {rest.length === 0 && <span className="py-2 text-sm text-slate-400">Alle Karten sind gesetzt.</span>}
      </div>
      <div className={`flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 ${tone}`}>
        {picked.length === 0 && <span className="text-sm text-slate-400">Hier entsteht deine Reihenfolge …</span>}
        {picked.map((i, pos) => (
          <span key={i} className="flex items-center gap-2">
            {pos > 0 && <span className="text-slate-400">{spec.relation || '<'}</span>}
            <button type="button" disabled={disabled} onClick={() => onChange(picked.filter((x) => x !== i))} className="rounded-xl border border-brand-300 bg-white px-3 py-2 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-red-50 hover:text-red-600">
              <span className="mr-1.5 text-xs text-slate-400">{pos + 1}</span><Inline md={spec.items[i]} />
            </button>
          </span>
        ))}
        {picked.length > 0 && !disabled && (
          <button type="button" className="btn-ghost btn-sm ml-auto" onClick={() => onChange([])}><RotateCcw size={14} /> Neu</button>
        )}
      </div>
    </div>
  );
}

// Eingabe je nach Antworttyp. value: Array (fields/choice/order/graph) oder String (free).
// status: null | { correct, parts } für farbige Rückmeldung.
// Lückentexte (spec.inline) werden von <TaskBody> direkt im Text dargestellt.
export default function AnswerInput({ spec, value, onChange, status, disabled, onSubmit }) {
  if (!spec) return null;

  if (spec.type === 'fields') return <FieldsInput {...{ spec, value, onChange, status, disabled, onSubmit }} />;
  if (spec.type === 'order') return <OrderInput {...{ spec, value, onChange, status, disabled }} />;
  if (spec.type === 'graph') return <CoordinateInput {...{ spec, value, onChange, status, disabled }} />;

  if (spec.type === 'choice') {
    const chosen = new Set((Array.isArray(value) ? value : []).map(Number));
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {spec.options.map((o, i) => {
          const active = chosen.has(i);
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => {
                if (spec.multiple) {
                  const next = new Set(chosen);
                  next.has(i) ? next.delete(i) : next.add(i);
                  onChange([...next]);
                } else onChange([i]);
              }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                active ? 'border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-500/10' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              } ${status && active ? (status.correct ? '!border-emerald-400 !bg-emerald-50 !text-emerald-800' : '!border-red-300 !bg-red-50 !text-red-700') : ''}`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${spec.multiple ? 'rounded-md' : 'rounded-full'} ${active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                {active && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="font-medium"><Inline md={o.text} /></span>
            </button>
          );
        })}
        {spec.multiple && <p className="text-xs text-slate-500 sm:col-span-2">Mehrere Antworten können richtig sein.</p>}
      </div>
    );
  }

  return (
    <textarea
      className="input min-h-28 text-[15px]"
      placeholder="Schreibe deine Antwort bzw. Begründung hier hinein …"
      value={typeof value === 'string' ? value : ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function isEmptyAnswer(spec, value) {
  if (!spec) return true;
  if (spec.type === 'free') return !String(value || '').trim();
  if (spec.type === 'choice') return !(Array.isArray(value) && value.length);
  if (spec.type === 'order') return !(Array.isArray(value) && value.length === spec.items.length);
  if (spec.type === 'graph') return !(Array.isArray(value) && value.length >= spec.need);
  return !(Array.isArray(value) && value.some((v) => String(v ?? '').trim()));
}

// Aufgabentext + Antwortfelder. Bei Lückentexten stehen die Felder direkt im Text.
export function TaskBody({ prompt, spec, value, onChange, status, disabled, onSubmit }) {
  const gaps = (String(prompt || '').match(/⟦\d+⟧/g) || []).length;
  if (spec?.type === 'fields' && spec.inline && gaps >= spec.parts.length) {
    const vals = Array.isArray(value) ? value : [];
    const slot = (i) => {
      const part = spec.parts[i];
      if (!part) return null;
      return (
        <span className="mx-1 inline-flex items-center gap-1.5 align-middle">
          <PartField part={part} i={i} value={vals[i]} status={status} disabled={disabled} onSubmit={onSubmit} compact
            onChange={(v) => { const next = [...vals]; next[i] = v; onChange(next); }} />
          {part.unit && <span className="text-sm text-slate-500">{part.unit}</span>}
        </span>
      );
    };
    return <MathContent md={prompt} slots={slot} />;
  }
  return (
    <>
      <MathContent md={String(prompt || '').replace(/⟦\d+⟧/g, '…')} />
      <AnswerInput spec={spec} value={value} onChange={onChange} status={status} disabled={disabled} onSubmit={onSubmit} />
    </>
  );
}
