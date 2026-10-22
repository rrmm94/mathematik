// Bausteine für die Aufgaben aus dem „Grundlagen-Training“ (Hauptschule Klasse 10).
import { rng, de as deBase, dt, round, num, txt, fields, choice, free, unordered } from '../helpers.js';

export { rng, dt, round, num, txt, fields, choice, free, unordered };
// Zahl für LaTeX: Dezimalkomma als {,} (sonst setzt KaTeX ein Leerzeichen dahinter)
export const de = (n, digits = 2) => deBase(n, digits).replace(/(?<!\\),/g, '{,}');
// Geldbeträge mit zwei Nachkommastellen (Text bzw. LaTeX)
const fixed2 = (n) => (Math.round(n * 100) / 100).toFixed(2);
export const eur = (n) => {
  const [i, d] = fixed2(Math.abs(n)).split('.');
  return `${n < 0 ? '−' : ''}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d}`;
};
export const eurm = (n) => eur(n).replace(/ /g, '\\,').replace(',', '{,}');
export const L = String.raw;

// Zehnerpotenz a·10ⁿ (Eingabe: Faktor und Exponent getrennt)
export const sci = (value, label = '') => ({ label, kind: 'sci', value });
// Auswahlliste (z. B. „linear“ / „exponentiell“)
export const sel = (options, value, label = '') => ({ label, kind: 'select', options, value });
// Term wie 2x + 85 (wird als Funktion verglichen, nicht als Text)
export const expr = (value, { label = '', vars = ['x'], alt = [] } = {}) => ({ label, kind: 'expr', value, vars, alternatives: alt });
// Zahl mit Toleranz (Rundung) und optionaler relativer Toleranz
export const approx = (value, { label = '', unit = '', tol = 0.011, rel = 0, alt } = {}) => ({ ...num(value, { label, unit, tol, alt }), tolerance: tol, ...(rel ? { rel } : {}) });
export const money = (value, label = '', rel = 5e-5) => approx(value, { label, unit: '€', tol: 0.011, rel });

// Tabelle: Die Felder (parts) werden zeilenweise ab Index `from` eingetragen.
export const table = ({ from = 0, cols, rows, corner = '', plot = null, highlightEqual = false }) => ({
  from, cols: cols.map(String), rows, corner, ...(plot ? { plot } : {}), ...(highlightEqual ? { highlightEqual: true } : {}),
});
export const fieldsWith = (parts, layout, extra = {}) => ({ type: 'fields', parts, layout, ...extra });
export const constraint = (parts, c, sample) => ({ type: 'fields', parts, constraint: c, sample });

// Koordinatensystem zum Anklicken
export const graph = ({ view, lines, labels, given }) => ({ type: 'graph', mode: 'lines', view, lines, labels: labels || [], given: given || [] });

// Sortieraufgabe: items in richtiger Reihenfolge angeben; die Anzeige wird deterministisch gemischt.
export function order(items) {
  const r = rng(items.join('|').length * 7919 + items.length);
  let perm;
  do { perm = r.shuffle(items.map((_, i) => i)); } while (perm.every((p, i) => p === i));
  return { type: 'order', items, perm };
}

// Deutsche Zahl im Fließtext ohne LaTeX
export { dt as t };

// Lineare Gleichung a·x + b·y = c in LaTeX (Koeffizienten 1 und −1 ohne Ziffer)
export function eq(a, b, c) {
  const term = (k, v, first) => {
    if (k === 0) return '';
    const s = k < 0 ? '-' : first ? '' : '+';
    const abs = Math.abs(k);
    return `${s}${abs === 1 ? '' : de(abs)}${v}`;
  };
  const left = term(a, 'x', true) + term(b, 'y', a === 0);
  return `${left}=${de(c)}`;
}

// Funktionsterm m·x + b in LaTeX
export function lin(m, b, v = 'x') {
  const mm = m === 0 ? '' : m === 1 ? v : m === -1 ? `-${v}` : `${de(m)}${v}`;
  const bb = b === 0 ? '' : `${b < 0 || !mm ? '' : '+'}${de(b)}`;
  return mm + bb || '0';
}

// einfache Sprache für Plural/Einheiten
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// Wahrscheinlichkeit/Anteil in Prozent; auch als Bruch eingebbar (1/13)
export const pct = (value, label = '', tol = 0.011) => ({ ...approx(round(value, 6), { label, unit: '%', tol }), pct: true });
