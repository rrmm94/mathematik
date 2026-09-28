// Prüft Schülerantworten gegen die Antwort-Spezifikation einer Aufgabenvariante.
//
// Formate:
//  { type: 'fields', parts: [{ label, kind: 'number'|'text', value, tolerance, unit, alternatives: [] }] }
//  { type: 'choice', multiple: bool, options: [{ text, correct }] }
//  { type: 'free', sample: '...' }   -> keine automatische Prüfung (correct = null)

export function parseNumber(input) {
  if (input == null) return NaN;
  let s = String(input).trim().toLowerCase();
  if (!s) return NaN;
  s = s.replace(/\s+/g, '').replace(/−/g, '-');
  // Einheiten/Prozentzeichen am Ende entfernen
  s = s.replace(/(€|%|°|[a-zäöüß²³]+)$/i, '');
  // Brüche wie 3/4
  const frac = s.match(/^(-?\d+(?:[.,]\d+)?)\/(-?\d+(?:[.,]\d+)?)$/);
  if (frac) return toNum(frac[1]) / toNum(frac[2]);
  return toNum(s);
}

function toNum(s) {
  // Tausenderpunkte (1.234.567 oder 1.234,5) erkennen
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '');
  s = s.replace(',', '.');
  if (!/^-?\d*\.?\d+(e-?\d+)?$/.test(s)) return NaN;
  return Number(s);
}

const normText = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!]+$/, '');

function checkPart(part, given) {
  if ((part.kind || 'number') === 'number') {
    const n = parseNumber(given);
    if (Number.isNaN(n)) return false;
    const values = [part.value, ...(part.alternatives || [])].map(Number).filter((v) => !Number.isNaN(v));
    const tol = Number(part.tolerance) || 1e-9;
    return values.some((v) => Math.abs(n - v) <= tol + 1e-9);
  }
  const accepted = [part.value, ...(part.alternatives || [])].map(normText);
  return accepted.includes(normText(given));
}

/**
 * @returns {{ correct: boolean|null, parts?: boolean[] }}
 */
export function checkAnswer(spec, given) {
  if (!spec || !spec.type) return { correct: null };
  if (spec.type === 'fields') {
    const arr = Array.isArray(given) ? given : [given];
    let parts;
    if (spec.unordered) {
      // Reihenfolge egal (z. B. x1/x2): jede Eingabe darf zu einem noch freien Teil passen
      const free = [...(spec.parts || [])];
      parts = arr.slice(0, free.length).map((g) => {
        const i = free.findIndex((p) => p && checkPart(p, g));
        if (i < 0) return false;
        free[i] = null;
        return true;
      });
      while (parts.length < (spec.parts || []).length) parts.push(false);
    } else {
      parts = (spec.parts || []).map((p, i) => checkPart(p, arr[i]));
    }
    return { correct: parts.length > 0 && parts.every(Boolean), parts };
  }
  if (spec.type === 'choice') {
    const chosen = new Set((Array.isArray(given) ? given : [given]).filter((x) => x !== null && x !== undefined && x !== '').map(Number));
    const right = new Set((spec.options || []).map((o, i) => (o.correct ? i : null)).filter((x) => x !== null));
    const correct = chosen.size === right.size && [...right].every((i) => chosen.has(i));
    return { correct };
  }
  if (spec.type === 'free') {
    // Platzhalter für eine spätere KI-Bewertung (siehe server/ai.js)
    return { correct: null };
  }
  return { correct: null };
}

// Entfernt Lösungen aus der Spezifikation, bevor sie an den Browser geht.
export function publicAnswerSpec(spec) {
  if (!spec) return { type: 'free' };
  if (spec.type === 'fields') {
    return { type: 'fields', parts: (spec.parts || []).map((p) => ({ label: p.label || '', unit: p.unit || '', kind: p.kind || 'number' })) };
  }
  if (spec.type === 'choice') {
    return { type: 'choice', multiple: !!spec.multiple, options: (spec.options || []).map((o) => ({ text: o.text })) };
  }
  return { type: 'free' };
}

// Lesbare Musterlösung für die Anzeige nach "Lösung zeigen".
export function answerSummary(spec) {
  if (!spec) return '';
  if (spec.type === 'fields') {
    return (spec.parts || []).map((p) => `${p.label ? p.label + ' ' : ''}${formatValue(p.value)}${p.unit ? ' ' + p.unit : ''}`).join('   ·   ');
  }
  if (spec.type === 'choice') {
    return (spec.options || []).filter((o) => o.correct).map((o) => o.text).join('; ');
  }
  return spec.sample || '';
}

function formatValue(v) {
  if (typeof v === 'number') return String(Math.round(v * 1e6) / 1e6).replace('.', ',');
  return String(v ?? '');
}
