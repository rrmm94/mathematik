import { Check, X } from 'lucide-react';
import { MathContent, InlineMath } from './ui.jsx';

// Ein einzelnes Eingabefeld (frei unter der Aufgabe oder als Lücke im Text).
function FieldInput({ part, value, ok, checked, disabled, onChange, onSubmit, inline }) {
  const state = checked ? (ok ? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500' : 'border-red-300 bg-red-50 focus:border-red-400') : '';
  return (
    <span className={`inline-flex items-center gap-1.5 align-middle ${inline ? 'mx-1' : ''}`}>
      <span className="relative">
        <input
          className={`input ${inline ? 'w-24 py-1' : 'w-36'} pr-8 text-base font-medium tabular-nums ${state}`}
          value={value ?? ''}
          disabled={disabled}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoComplete="off"
          placeholder="?"
          aria-label={part.label || 'Lücke'}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        />
        {checked && (
          <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
            {ok ? <Check size={16} /> : <X size={16} />}
          </span>
        )}
      </span>
      {part.unit && <span className="text-sm text-slate-500">{part.unit}</span>}
    </span>
  );
}

// Eingabe je nach Antworttyp. value: Array (fields/choice) oder String (free).
// status: null | { correct, parts } für farbige Rückmeldung.
// Lückentexte (spec.inline) werden von <TaskBody> direkt im Text dargestellt.
export default function AnswerInput({ spec, value, onChange, status, disabled, onSubmit }) {
  if (!spec) return null;

  if (spec.type === 'fields') {
    const vals = Array.isArray(value) ? value : [];
    const set = (i, v) => { const next = [...vals]; next[i] = v; onChange(next); };
    return (
      <div className="flex flex-wrap items-end gap-3">
        {spec.parts.map((p, i) => (
          <label key={i} className="flex items-center gap-2">
            {p.label && <span className="text-sm font-medium text-slate-600">{p.label}</span>}
            <FieldInput part={p} value={vals[i]} ok={status?.parts?.[i]} checked={!!status?.parts} disabled={disabled} onChange={(v) => set(i, v)} onSubmit={onSubmit} />
          </label>
        ))}
      </div>
    );
  }

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
              <InlineMath md={o.text} className="font-medium" />
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

// Aufgabentext + Antwortfelder. Bei Lückentexten stehen die Felder direkt im Text.
export function TaskBody({ prompt, spec, value, onChange, status, disabled, onSubmit }) {
  const gaps = (String(prompt || '').match(/⟦\d+⟧/g) || []).length;
  if (spec?.type === 'fields' && spec.inline && gaps >= spec.parts.length) {
    const vals = Array.isArray(value) ? value : [];
    const slot = (i) => {
      const part = spec.parts[i];
      if (!part) return null;
      return (
        <FieldInput
          inline part={part} value={vals[i]} ok={status?.parts?.[i]} checked={!!status?.parts} disabled={disabled}
          onChange={(v) => { const next = [...vals]; next[i] = v; onChange(next); }} onSubmit={onSubmit}
        />
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

export function isEmptyAnswer(spec, value) {
  if (!spec) return true;
  if (spec.type === 'free') return !String(value || '').trim();
  if (spec.type === 'choice') return !(Array.isArray(value) && value.length);
  return !(Array.isArray(value) && value.some((v) => String(v ?? '').trim()));
}
