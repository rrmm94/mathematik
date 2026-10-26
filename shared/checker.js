// Prüft Schülerantworten gegen die Antwort-Spezifikation einer Aufgabenvariante.
//
// Formate:
//  { type: 'fields', parts: [{ label, kind, value, tolerance, unit, alternatives: [] }], layout?, constraint?, unordered? }
//      kind: 'number' (Standard) | 'text' | 'sci' (a·10ⁿ) | 'expr' (Term, z. B. 2x+85) | 'select' (Auswahlliste)
//     inline: true -> die Felder stehen als Lücken ⟦1⟧, ⟦2⟧ … direkt im Aufgabentext
//  { type: 'choice', multiple: bool, options: [{ text, correct }] }
//  { type: 'order', items: [... in richtiger Reihenfolge], perm: [... Anzeigereihenfolge] }
//  { type: 'graph', mode: 'lines'|'points', view: {...}, lines: [{ m, b }], points: [[x, y]], given: [[x, y, name]] }
//  { type: 'free', sample: '...' }   -> keine automatische Prüfung (correct = null)

const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
const NUM = String.raw`-?\d+(?:[.,]\d+)?`;
// a·10^n  (auch 10^n allein)
const SCI_RE = new RegExp(String.raw`^(?:(${NUM})(?:\*|·|×|x|\\cdot))?10\^\{?\(?(-?\d+)\)?\}?$`);
// 8e6 (so speichert das Eingabefeld a·10ⁿ)
const E_RE = new RegExp(String.raw`^(${NUM})e([+-]?\d+)$`);

function cleanInput(input) {
  let s = String(input).trim().toLowerCase();
  s = s.replace(/\s+/g, '').replace(/[−–]/g, '-');
  // 10⁶ -> 10^6 (aber nicht cm² etc.)
  s = s.replace(/10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (_, m) => '10^' + [...m].map((c) => SUP[c]).join(''));
  return s;
}

export function parseNumber(input) {
  if (input == null) return NaN;
  let s = cleanInput(input);
  if (!s) return NaN;
  const sci = s.match(SCI_RE);
  if (sci) {
    const mant = toNum(sci[1] == null ? '1' : sci[1]);
    return Number.isNaN(mant) ? NaN : Number(`${mant}e${sci[2]}`); // exakt, ohne 10 ** n
  }
  // Einheiten/Prozentzeichen am Ende entfernen
  s = s.replace(/(€|%|°|[a-zäöüß²³]+)$/i, '');
  // Brüche wie 3/4
  const frac = s.match(/^(-?\d+(?:[.,]\d+)?)\/(-?\d+(?:[.,]\d+)?)$/);
  if (frac) return toNum(frac[1]) / toNum(frac[2]);
  return toNum(s);
}

function toNum(s) {
  // Tausenderpunkte (1.234.567 oder 1.234,5) erkennen
  if (/^-?[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '');
  s = s.replace(',', '.');
  if (!/^-?\d*\.?\d+(e[+-]?\d+)?$/.test(s)) return NaN;
  return Number(s);
}

// a·10ⁿ in Mantisse und Exponent zerlegen (null, wenn kein gültiges Format)
export function parseSci(input) {
  if (input == null) return null;
  const s = cleanInput(input);
  const m = s.match(E_RE) || s.match(SCI_RE);
  if (!m) return null;
  const a = m[1] == null ? 1 : toNum(m[1]);
  if (Number.isNaN(a)) return null;
  return { a, n: Number(m[2]) };
}

// ---------- Terme (z. B. "2x+85", "y = -0,5x + 1", "4^n") ----------
const EVAL_POINTS = [0, 1, 2, 3, 4, 5, 6, -1, -2, 10];

function tokenize(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\d/.test(c) || (c === '.' && /\d/.test(src[i + 1] || ''))) {
      let j = i;
      while (j < src.length && /[\d.]/.test(src[j])) j++;
      out.push({ t: 'num', v: Number(src.slice(i, j)) });
      i = j;
    } else if (/[a-z]/.test(c)) {
      out.push({ t: 'var', v: c });
      i++;
    } else if ('+-*/^()'.includes(c)) {
      out.push({ t: c });
      i++;
    } else return null;
  }
  return out;
}

// Gibt eine Funktion (vars) => Zahl zurück oder null bei ungültigem Term.
function compileExpr(raw) {
  let s = String(raw ?? '').toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/:/g, '/').replace(/,/g, '.');
  s = s.replace(/²/g, '^2').replace(/³/g, '^3');
  if (!s || s.length > 80) return null;
  const eq = s.split('=');
  if (eq.length > 2) return null;
  if (eq.length === 2) {
    // linke Seite darf nur ein Name wie y, f(x), k_n sein
    if (!/^[a-z](?:_?[a-z0-9]+)?(?:\([a-z]\))?$/.test(eq[0])) return null;
    s = eq[1];
  }
  const toks = tokenize(s);
  if (!toks || toks.length > 60) return null;
  let pos = 0;
  const peek = () => toks[pos];
  let depth = 0;
  const guard = () => { if (++depth > 40) throw new Error('zu tief'); };

  const parseExpr = () => {
    guard();
    let left = parseTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = toks[pos++].t;
      const right = parseTerm();
      const l = left;
      left = op === '+' ? (v) => l(v) + right(v) : (v) => l(v) - right(v);
    }
    depth--;
    return left;
  };
  const startsFactor = (t) => t && (t.t === 'num' || t.t === 'var' || t.t === '(');
  const parseTerm = () => {
    let left = parseFactor();
    for (;;) {
      const t = peek();
      if (t && (t.t === '*' || t.t === '/')) {
        pos++;
        const right = parseFactor();
        const l = left;
        left = t.t === '*' ? (v) => l(v) * right(v) : (v) => l(v) / right(v);
      } else if (startsFactor(t)) {
        const right = parseFactor(); // 2x, 2(x+1), x(x+1)
        const l = left;
        left = (v) => l(v) * right(v);
      } else break;
    }
    return left;
  };
  const parseFactor = () => {
    guard();
    const t = peek();
    let r;
    if (t && (t.t === '+' || t.t === '-')) {
      pos++;
      const inner = parseFactor();
      r = t.t === '-' ? (v) => -inner(v) : inner;
    } else r = parsePower();
    depth--;
    return r;
  };
  const parsePower = () => {
    const base = parseAtom();
    if (peek() && peek().t === '^') {
      pos++;
      const exp = parseFactor();
      return (v) => base(v) ** exp(v);
    }
    return base;
  };
  const parseAtom = () => {
    const t = toks[pos++];
    if (!t) throw new Error('unerwartetes Ende');
    if (t.t === 'num') return () => t.v;
    if (t.t === 'var') return (v) => (t.v in v ? v[t.v] : NaN);
    if (t.t === '(') {
      const e = parseExpr();
      if (!peek() || peek().t !== ')') throw new Error('Klammer');
      pos++;
      return e;
    }
    throw new Error('unerwartetes Zeichen');
  };
  try {
    const f = parseExpr();
    if (pos !== toks.length) return null;
    return f;
  } catch {
    return null;
  }
}

// Vergleicht zwei Terme an mehreren Stellen (Variablen z. B. ['x'] oder ['n']).
export function exprEquals(given, expected, vars = ['x']) {
  const f = compileExpr(given);
  const g = compileExpr(expected);
  if (!f || !g) return false;
  let compared = 0;
  for (const p of EVAL_POINTS) {
    const env = {};
    vars.forEach((v, i) => { env[v] = p + i * 0.5; });
    const a = f(env);
    const b = g(env);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      if (Number.isFinite(a) !== Number.isFinite(b) && !(Number.isNaN(a) && Number.isNaN(b))) return false;
      continue;
    }
    if (Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(b))) return false;
    compared++;
  }
  return compared >= 3;
}

const normText = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!]+$/, '');

function checkPart(part, given) {
  const kind = part.kind || 'number';
  if (kind === 'number') {
    let n = parseNumber(given);
    if (Number.isNaN(n)) return false;
    // Wahrscheinlichkeit in %: auch als Bruch (z. B. 1/13) eingeben
    if (part.pct && /\//.test(String(given))) n *= 100;
    const values = [part.value, ...(part.alternatives || [])].map(Number).filter((v) => !Number.isNaN(v));
    return values.some((v) => {
      const tol = Math.max(Number(part.tolerance) || 0, (Number(part.rel) || 0) * Math.abs(v), 1e-9);
      return Math.abs(n - v) <= tol + 1e-9 * Math.max(1, Math.abs(v));
    });
  }
  if (kind === 'sci') {
    const got = parseSci(given);
    if (!got || !(Math.abs(got.a) >= 1 && Math.abs(got.a) < 10) || !Number.isInteger(got.n)) return false;
    const values = [part.value, ...(part.alternatives || [])].map(Number).filter((v) => Number.isFinite(v) && v !== 0);
    return values.some((v) => {
      const [m, e] = v.toExponential().split('e');
      return Math.abs(got.a - Number(m)) < 1e-9 && got.n === Number(e);
    });
  }
  if (kind === 'expr') {
    const all = [part.value, ...(part.alternatives || [])];
    return all.some((v) => exprEquals(given, v, part.vars || ['x']));
  }
  // Terme wie „y = 0,5x + 1“: Leerzeichen, Malpunkt/Stern und Dezimalkomma/-punkt sind gleichwertig
  const squash = (x) => normText(x).replace(/\s+/g, '').replace(/[·*]/g, '').replace(/,/g, '.');
  const accepted = [part.value, ...(part.alternatives || [])].map(squash);
  return accepted.includes(squash(given));
}

// Bedingung über mehrere Zahlfelder (für Aufgaben mit vielen richtigen Lösungen)
function checkConstraint(c, given, parts) {
  const nums = parts.map((_, i) => parseNumber(given[i]));
  if (nums.some((n) => Number.isNaN(n))) return false;
  if (c.positive && nums.some((n) => n <= 0)) return false;
  const tol = Number(c.tolerance) || 1e-6;
  switch (c.type) {
    case 'product': return Math.abs(nums.reduce((a, b) => a * b, 1) - c.value) <= tol;
    case 'sum': return Math.abs(nums.reduce((a, b) => a + b, 0) - c.value) <= tol;
    case 'weighted': return Math.abs(nums.reduce((a, b, i) => a + b * (c.weights[i] ?? 1), 0) - c.value) <= tol;
    case 'line': { // Felder: Steigung m, Achsenabschnitt b; Gerade geht durch [x, y]
      const [m, b] = nums;
      const through = Math.abs(m * c.through[0] + b - c.through[1]) <= tol;
      const other = c.notSlope == null || Math.abs(m - c.notSlope) > 1e-9;
      return through && other;
    }
    case 'parallel': { // Felder: Achsenabschnitt b der ersten Gerade, Steigung m der zweiten; parallel, aber nicht identisch
      const [b, m] = nums;
      return Math.abs(m - c.slope) <= tol && Math.abs(b - c.notIntercept) > tol;
    }
    case 'share': { // Anteil eines Feldes an der Summe aller Felder (z. B. 25 % blaue Kugeln)
      const sum = nums.reduce((a, b) => a + b, 0);
      return sum > 0 && Math.abs(nums[c.index || 0] / sum - c.value) <= 1e-9 && (!c.integers || nums.every(Number.isInteger));
    }
    default: return false;
  }
}

// ---------- Koordinatensystem ----------
function toPoints(given) {
  return (Array.isArray(given) ? given : [])
    .map((p) => (Array.isArray(p) ? { x: Number(p[0]), y: Number(p[1]) } : { x: Number(p?.x), y: Number(p?.y) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

export function graphNeed(spec) {
  if (spec.mode === 'points') return spec.count ?? (spec.points || []).length;
  return 2 * (spec.n ?? (spec.lines || []).length);
}

function checkGraph(spec, given) {
  const pts = toPoints(given);
  const eps = 1e-6;
  if (spec.mode === 'points') {
    const want = spec.points || [];
    if (pts.length !== want.length) return false;
    const tolX = Number(spec.tolerance?.x ?? spec.tolerance ?? 0.26);
    const tolY = Number(spec.tolerance?.y ?? spec.tolerance ?? 0.26);
    const free = [...pts];
    return want.every(([wx, wy]) => {
      const i = free.findIndex((p) => p && Math.abs(p.x - wx) <= tolX + eps && Math.abs(p.y - wy) <= tolY + eps);
      if (i < 0) return false;
      free[i] = null;
      return true;
    });
  }
  const want = spec.lines || [];
  if (pts.length !== want.length * 2) return false;
  const got = [];
  for (let k = 0; k < want.length; k++) {
    const p = pts[2 * k];
    const q = pts[2 * k + 1];
    if (Math.abs(p.x - q.x) < eps) return false; // senkrechte oder doppelte Punkte: keine Funktion
    const m = (q.y - p.y) / (q.x - p.x);
    got.push({ m, b: p.y - m * p.x });
  }
  const free = [...got];
  return want.every((l) => {
    const i = free.findIndex((g) => g && Math.abs(g.m - l.m) < 1e-6 && Math.abs(g.b - l.b) < 1e-6);
    if (i < 0) return false;
    free[i] = null;
    return true;
  });
}

/**
 * @returns {{ correct: boolean|null, parts?: boolean[] }}
 */
export function checkAnswer(spec, given) {
  if (!spec || !spec.type) return { correct: null };
  if (spec.type === 'fields') {
    const arr = Array.isArray(given) ? given : [given];
    let parts;
    if (spec.constraint) {
      const ok = checkConstraint(spec.constraint, arr, spec.parts || []);
      parts = (spec.parts || []).map(() => ok);
    } else if (spec.unordered) {
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
  if (spec.type === 'order') {
    const picked = (Array.isArray(given) ? given : []).map(Number);
    const n = (spec.items || []).length;
    const perm = spec.perm || [...Array(n).keys()];
    const correct = picked.length === n && picked.every((k, pos) => perm[k] === pos);
    return { correct };
  }
  if (spec.type === 'graph') {
    return { correct: checkGraph(spec, given) };
  }
  if (spec.type === 'free') {
    // Freitext wird nicht automatisch bewertet
    return { correct: null };
  }
  return { correct: null };
}

// Entfernt Lösungen aus der Spezifikation, bevor sie an den Browser geht.
export function publicAnswerSpec(spec) {
  if (!spec) return { type: 'free' };
  if (spec.type === 'fields') {
    const out = {
      type: 'fields',
      inline: !!spec.inline,
      parts: (spec.parts || []).map((p) => {
        const o = { label: p.label || '', unit: p.unit || '', kind: p.kind || 'number' };
        if (p.kind === 'select') o.options = p.options || [];
        if (p.kind === 'expr' && p.vars && p.vars.length) o.vars = p.vars;
        if (p.placeholder) o.placeholder = p.placeholder;
        return o;
      }),
    };
    if (spec.layout) out.layout = spec.layout;
    return out;
  }
  if (spec.type === 'choice') {
    return { type: 'choice', multiple: !!spec.multiple, options: (spec.options || []).map((o) => ({ text: o.text })) };
  }
  if (spec.type === 'order') {
    const items = spec.items || [];
    const perm = spec.perm || items.map((_, i) => i);
    return { type: 'order', items: perm.map((i) => items[i]) };
  }
  if (spec.type === 'graph') {
    return {
      type: 'graph',
      mode: spec.mode || 'lines',
      view: spec.view || {},
      need: graphNeed(spec),
      given: spec.given || [],
      labels: spec.labels || [],
      polygons: spec.polygons || [],
      connect: !!spec.connect,
    };
  }
  return { type: 'free' };
}

// Lesbare Musterlösung für die Anzeige nach "Lösung zeigen".
export function answerSummary(spec) {
  if (!spec) return '';
  if (spec.type === 'fields') {
    if (spec.constraint) return spec.sample || 'Mehrere Lösungen möglich. Siehe Lösungsweg.';
    return (spec.parts || []).map((p) => `${p.label ? p.label + ' ' : ''}${formatPart(p)}${p.unit ? ' ' + p.unit : ''}`).join('   ·   ');
  }
  if (spec.type === 'choice') {
    return (spec.options || []).filter((o) => o.correct).map((o) => o.text).join('; ');
  }
  if (spec.type === 'order') {
    return (spec.items || []).join('  <  ');
  }
  if (spec.type === 'graph') {
    if (spec.mode === 'points') return (spec.points || []).map(([x, y]) => `(${formatValue(x)}|${formatValue(y)})`).join('  ');
    return (spec.lines || []).map((l) => `y = ${formatValue(l.m)}x ${l.b < 0 ? '−' : '+'} ${formatValue(Math.abs(l.b))}`).join('   ·   ');
  }
  return spec.sample || '';
}

function formatPart(p) {
  if (p.kind === 'sci') {
    const [m, e] = Number(p.value).toExponential().split('e');
    return `${formatValue(Number(m))} · 10^${Number(e)}`;
  }
  return formatValue(p.value);
}

function formatValue(v) {
  if (typeof v === 'number') return String(Math.abs(v) < 1 ? Math.round(v * 1e6) / 1e6 : Math.round(v * 1e3) / 1e3).replace('.', ',');
  return String(v ?? '');
}
