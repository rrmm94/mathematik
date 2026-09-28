import { Check, X } from 'lucide-react';

// Eingabe je nach Antworttyp. value: Array (fields/choice) oder String (free).
// status: null | { correct, parts } für farbige Rückmeldung.
export default function AnswerInput({ spec, value, onChange, status, disabled, onSubmit }) {
  if (!spec) return null;

  if (spec.type === 'fields') {
    const vals = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap items-end gap-3">
        {spec.parts.map((p, i) => {
          const ok = status?.parts?.[i];
          const state = status?.parts ? (ok ? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500' : 'border-red-300 bg-red-50 focus:border-red-400') : '';
          return (
            <label key={i} className="flex items-center gap-2">
              {p.label && <span className="text-sm font-medium text-slate-600">{p.label}</span>}
              <span className="relative">
                <input
                  className={`input w-36 pr-8 text-base font-medium tabular-nums ${state}`}
                  value={vals[i] ?? ''}
                  disabled={disabled}
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="?"
                  onChange={(e) => {
                    const next = [...vals];
                    next[i] = e.target.value;
                    onChange(next);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
                />
                {status?.parts && (
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
                    {ok ? <Check size={16} /> : <X size={16} />}
                  </span>
                )}
              </span>
              {p.unit && <span className="text-sm text-slate-500">{p.unit}</span>}
            </label>
          );
        })}
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
              <span className="font-medium">{o.text}</span>
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
  return !(Array.isArray(value) && value.some((v) => String(v ?? '').trim()));
}
