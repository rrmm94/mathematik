// Hilfsfunktionen für die Beispielinhalte.

// Deterministischer Zufall, damit die Beispielaufgaben reproduzierbar sind.
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = next;
  r.int = (min, max) => min + Math.floor(next() * (max - min + 1));
  r.pick = (arr) => arr[Math.floor(next() * arr.length)];
  r.shuffle = (arr) => {
    const a2 = [...arr];
    for (let i = a2.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a2[i], a2[j]] = [a2[j], a2[i]];
    }
    return a2;
  };
  return r;
}

// Deutsche Zahldarstellung: 1234,5 -> "1 234,5"
export function de(n, digits = 2) {
  const f = Math.round(n * 10 ** digits) / 10 ** digits;
  const [i, d] = Math.abs(f).toString().split('.');
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
  return `${f < 0 ? '−' : ''}${int}${d ? ',' + d : ''}`;
}
// Ohne LaTeX-Leerzeichen (für Fließtext)
export const dt = (n, digits = 2) => de(n, digits).replace(/\\,/g, ' ');

export const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function num(value, { label = '', unit = '', tol, alt } = {}) {
  const tolerance = tol ?? (Number.isInteger(value) ? 0 : 0.011);
  return { label, kind: 'number', value: round(value, 6), tolerance, unit, alternatives: alt || [] };
}
export function txt(value, { label = '', alt = [] } = {}) {
  return { label, kind: 'text', value, alternatives: alt, unit: '' };
}
export const fields = (...parts) => ({ type: 'fields', parts });
export const unordered = (...parts) => ({ type: 'fields', unordered: true, parts });
export const choice = (options, correct, multiple = false) => ({
  type: 'choice',
  multiple,
  options: options.map((text, i) => ({ text, correct: Array.isArray(correct) ? correct.includes(i) : i === correct })),
});
export const free = (sample) => ({ type: 'free', sample });

// Relative Toleranz für Ergebnisse mit π oder Rundung
export const relTol = (v, rel = 0.004) => Math.max(0.011, Math.abs(v) * rel);
