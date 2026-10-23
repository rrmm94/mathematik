// Varianten mit geänderten Zahlen zu den Originalaufgaben aus den Abschlussprüfungen.
//
// Jede Vorlage erkennt eine Originalaufgabe am Text (parse), liest deren Zahlen aus und kann daraus
// die Aufgabe mit beliebigen anderen Zahlen neu aufbauen (make). vary() würfelt neue, „schöne“ Zahlen.
// Wo keine Vorlage passt (z. B. wenn die Zahlen in einem Bild stehen), gibt es nur die Originalaufgabe.
//
// Kontrolle: scripts/check-exam-variants.mjs rechnet jede Originalaufgabe aus ihren Originalzahlen nach
// (make(parse(t)) muss die Lösung aus der Prüfung ergeben) und prüft, dass jede Variante ihre eigene Lösung besteht.
import crypto from 'node:crypto';
import { rng, de, dt, round } from './helpers.js';

// ---------------------------------------------------------------- Hilfen
const seedOf = (s) => parseInt(crypto.createHash('sha1').update(s).digest('hex').slice(0, 8), 16);
const toNum = (s) => Number(String(s).replace(/[\s.]/g, '').replace(',', '.'));
const NUMBER = String.raw`(\d+(?:[ .]\d{3})*(?:,\d+)?)`;
const mm = (n, d = 6) => de(n, d).replace(/(?<!\\),/, '{,}'); // Zahl in LaTeX (Dezimalkomma ohne Abstand; „\,“ ist der Tausenderabstand)
const money = (n) => round(n, 2).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const decimals = (v) => { const s = String(round(v, 9)); return s.includes('.') ? s.split('.')[1].length : 0; };
const isNice = (v, maxDec = 3, max = 1e7) => Number.isFinite(v) && Math.abs(v) < max && Math.abs(v * 10 ** maxDec - Math.round(v * 10 ** maxDec)) < 1e-6;
const pickDifferent = (r, arr, current) => { const rest = arr.filter((x) => JSON.stringify(x) !== JSON.stringify(current)); return r.pick(rest.length ? rest : arr); };

const part = (value, { tol = 0, unit = '', alt = [] } = {}) => ({ label: '', kind: 'number', value: round(value, 9), tolerance: tol, unit, alternatives: alt });
const gaps = (...parts) => ({ type: 'fields', inline: true, parts });

// Klartext der Originalaufgabe (ohne LaTeX-Schnörkel) für die Erkennung
function plain(t) {
  return `${t.context}\n${t.prompt}`
    .replace(/\\displaystyle/g, '')
    .replace(/\*\*[a-z]\)\*\*\s*/gi, '')
    .replace(/\\(?:text|mathrm|textbf)\{([^}]*)\}/g, '$1')
    .replace(/(\d)\\(?:d)?frac\{(\d+)\}\{(\d+)\}/g, '$1 $2/$3')
    .replace(/\\(?:d)?frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    .replace(/\\(km|cm|mm|dm|ml|min|m|l|h)\b/g, '$1')
    .replace(/\\%/g, '%').replace(/\\cdot/g, '·').replace(/\\displaystyle/g, '')
    .replace(/\\[ ,;]|~|\$|\\large|\\Large/gi, ' ')
    .replace(/[−–]/g, '-').replace(/\^2/g, '²').replace(/\^3/g, '³')
    .replace(/[ \t]+/g, ' ');
}

// ---------------------------------------------------------------- 1. Rechenaufgaben mit Lücke ($12\cdot□=48$, $1,5+2\cdot3=□$ …)
function tokenizeEquation(prompt) {
  let s = prompt.replace(/^\*\*[a-z]\)\*\*\s*/i, '');
  if ((s.match(/⟦\d+⟧/g) || []).length !== 1 || !/⟦1⟧/.test(s)) return null;
  s = s.replace(/⟦1⟧/g, '□').replace(/\$/g, '')
    .replace(/\\(?:displaystyle|large|Large|left|right|thickapprox|,|;|!)/g, '').replace(/\\\s/g, '').replace(/~/g, '')
    .replace(/\\(?:d)?frac\s*\{(\d+)\}\{(\d+)\}/g, 'F{$1}{$2}').replace(/(\d+)\/(\d+)/g, 'F{$1}{$2}')
    .replace(/\\cdot|·/g, '*').replace(/:/g, '÷').replace(/[−–]/g, '-').replace(/\s+/g, '');
  const rx = /F\{(\d+)\}\{(\d+)\}|\d+(?:,\d+)?|\^2|[+\-*÷()□=]/g;
  const tokens = s.match(rx);
  if (!tokens || tokens.join('') !== s) return null;
  return tokens;
}

function parseEquation(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const primary = () => {
    const t = next();
    if (t === undefined) throw new Error('Ende');
    if (t === '(') { const e = expr(); if (next() !== ')') throw new Error(')'); return { k: 'par', e }; }
    if (t === '□') return { k: 'x' };
    if (t[0] === 'F') { const m = t.match(/F\{(\d+)\}\{(\d+)\}/); return { k: 'frac', n: +m[1], d: +m[2] }; }
    if (/^\d/.test(t)) return { k: 'num', v: Number(t.replace(',', '.')), dec: t.includes(',') ? t.split(',')[1].length : 0 };
    throw new Error(`Token ${t}`);
  };
  const unary = () => {
    if (peek() === '-') { next(); return { k: 'neg', e: unary() }; }
    let e = primary();
    if (peek() === '^2') { next(); e = { k: 'sq', e }; }
    return e;
  };
  const term = () => { let l = unary(); while (peek() === '*' || peek() === '÷') l = { k: 'bin', op: next(), l, r: unary() }; return l; };
  const expr = () => { let l = term(); while (peek() === '+' || peek() === '-') l = { k: 'bin', op: next(), l, r: term() }; return l; };
  const left = expr();
  if (next() !== '=') throw new Error('=');
  const right = expr();
  if (i !== tokens.length) throw new Error('Rest');
  return { left, right };
}

const hasX = (n) => (n.k === 'x') || (n.e && hasX(n.e)) || (n.l && (hasX(n.l) || hasX(n.r)));
function evalNode(n, x) {
  switch (n.k) {
    case 'x': return x;
    case 'num': return n.v;
    case 'frac': return n.n / n.d;
    case 'par': return evalNode(n.e, x);
    case 'neg': return -evalNode(n.e, x);
    case 'sq': return evalNode(n.e, x) ** 2;
    case 'bin': {
      const a = evalNode(n.l, x), b = evalNode(n.r, x);
      return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : a / b;
    }
    default: throw new Error(n.k);
  }
}
const FRACS = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 8], [3, 8], [1, 10], [3, 10], [2, 3], [1, 3], [5, 8], [7, 8], [4, 5]];
function tex(n, xs) {
  switch (n.k) {
    case 'x': return xs;
    case 'num': return mm(n.v, n.dec);
    case 'frac': return `\\frac{${n.n}}{${n.d}}`;
    case 'par': return `(${tex(n.e, xs)})`;
    case 'neg': return `-${tex(n.e, xs)}`;
    case 'sq': return `${tex(n.e, xs)}^2`;
    case 'bin': return `${tex(n.l, xs)}${n.op === '*' ? '\\cdot ' : n.op === '÷' ? ':' : n.op}${tex(n.r, xs)}`;
    default: return '';
  }
}
function perturbLiteral(n, r) {
  if (n.k === 'frac') { const [a, b] = pickDifferent(r, FRACS, [n.n, n.d]); return { k: 'frac', n: a, d: b }; }
  if (n.k !== 'num') return n;
  const m = Math.round(n.v * 10 ** n.dec);
  const spread = Math.max(3, Math.round(m * 0.4));
  let m2 = m;
  for (let i = 0; i < 20 && (m2 === m || m2 <= 0 || (n.dec === 0 && m2 < 2) || (n.dec > 0 && m2 % 10 === 0)); i++) m2 = m + r.int(-spread, spread);
  return { k: 'num', v: m2 / 10 ** n.dec, dec: n.dec };
}
const mapLeaves = (n, f) => (n.k === 'num' || n.k === 'frac' ? f(n) : n.k === 'x' ? n : n.e ? { ...n, e: mapLeaves(n.e, f) } : n.l ? { ...n, l: mapLeaves(n.l, f), r: mapLeaves(n.r, f) } : n);
const isLiteral = (n) => n.k === 'num' || n.k === 'frac' || (n.k === 'neg' && (n.e.k === 'num' || n.e.k === 'frac'));
const fmtValue = (v) => mm(v, 3).replace(/(\{,\}\d*?)0+$/, '$1').replace(/\{,\}$/, '');

const equationFamily = {
  id: 'rechnung',
  parse(t) {
    const tokens = tokenizeEquation(t.prompt);
    if (!tokens) return null;
    let eq;
    try { eq = parseEquation(tokens); } catch { return null; }
    const xSide = hasX(eq.left) ? 'left' : hasX(eq.right) ? 'right' : null;
    if (!xSide) return null;
    const answer = t.answer?.parts?.[0]?.value;
    return { eq, xSide, answer: typeof answer === 'number' ? answer : null };
  },
  make(p) {
    const { eq, xSide } = p;
    const X = eq[xSide], O = eq[xSide === 'left' ? 'right' : 'left'];
    const alone = X.k === 'x'; // „□ = Term“ bzw. „Term = □“: Ergebnis wird einfach ausgerechnet
    const x = alone ? evalNode(O, 0) : p.answer;
    const full = xSide === 'left' ? `${tex(X, '§')}=${tex(O, '§')}` : `${tex(O, '§')}=${tex(X, '§')}`;
    const [l, rr] = full.split('§');
    const prompt = `${l ? `$${l}$ ` : ''}⟦1⟧${rr ? ` $${rr}$` : ''}`;
    const filled = full.replace('§', fmtValue(x));
    const solution = alone
      ? `Rechne Schritt für Schritt: Klammern zuerst, dann Punkt vor Strich.\n\n$${tex(O, '')} = ${fmtValue(x)}$`
      : `Gesucht ist die Zahl, bei der die Rechnung stimmt. Rechne rückwärts (Umkehraufgabe) oder probiere aus.\n\nProbe: $${filled}$ ✓`;
    return { prompt, answer: gaps(part(x)), solution };
  },
  vary(r, p) {
    const { eq, xSide } = p;
    const X = eq[xSide], O = eq[xSide === 'left' ? 'right' : 'left'];
    for (let attempt = 0; attempt < 400; attempt++) {
      const leaf = (n) => perturbLiteral(n, r);
      if (X.k === 'x') {
        const O2 = mapLeaves(O, leaf);
        const val = evalNode(O2, 0);
        if (!isNice(val, 3, 1e6) || val === p.answer) continue;
        return { eq: { ...eq, [xSide === 'left' ? 'right' : 'left']: O2 }, xSide, answer: val };
      }
      if (!isLiteral(O)) return null;
      const X2 = mapLeaves(X, leaf);
      const base = Math.abs(p.answer);
      const dec = decimals(p.answer);
      const m = Math.round(base * 10 ** dec), spread = Math.max(3, Math.round(m * 0.5));
      let m2 = m + r.int(-spread, spread);
      if (m2 <= 0 || m2 === m) continue;
      const x2 = (p.answer < 0 ? -m2 : m2) / 10 ** dec;
      const target = evalNode(X2, x2);
      if (!isNice(target, 3, 1e5) || (O.k === 'frac' && !FRACS.some(([a, b]) => Math.abs(a / b - target) < 1e-9))) continue;
      let O2;
      if (O.k === 'frac') { const [a, b] = FRACS.find(([a2, b2]) => Math.abs(a2 / b2 - target) < 1e-9); O2 = { k: 'frac', n: a, d: b }; }
      else O2 = { k: 'num', v: Math.abs(target), dec: decimals(target) };
      if (target < 0 && O.k !== 'frac') O2 = { k: 'neg', e: O2 };
      return { eq: { ...eq, [xSide === 'left' ? 'right' : 'left']: O2, [xSide]: X2 }, xSide, answer: x2 };
    }
    return null;
  },
};

// ---------------------------------------------------------------- 2. Einheiten umrechnen
const UNITS = {
  Länge: { km: 1000, m: 1, dm: 0.1, cm: 0.01, mm: 0.001 },
  Masse: { t: 1000, kg: 1, g: 0.001 },
  Hohlmaß: { l: 1, ml: 0.001 },
  Zeit: { h: 60, min: 1 },
  Fläche: { 'm²': 1, 'dm²': 0.01, 'cm²': 0.0001, 'mm²': 0.000001 },
  Volumen: { 'm³': 1, 'dm³': 0.001, 'cm³': 0.000001, 'mm³': 0.000000001 },
};
const familyOf = (u) => Object.keys(UNITS).find((f) => u in UNITS[f]);
const unitTex = (u) => `\\text{${u.replace(/[²³]/, '')}}${u.includes('²') ? '^2' : u.includes('³') ? '^3' : ''}`;
const UNIT_RE = '(km|dm|cm|mm|m²|dm²|cm²|mm²|m³|dm³|cm³|mm³|m|kg|g|t|ml|l|h|min)';
const valueTex = (v) => (v.type === 'frac' ? `\\frac{${v.n}}{${v.d}}` : v.type === 'mixed' ? `${v.w}\\frac{${v.n}}{${v.d}}` : mm(v.v, v.dec ?? 0));
const valueNum = (v) => (v.type === 'frac' ? v.n / v.d : v.type === 'mixed' ? v.w + v.n / v.d : v.v);

const unitFamily = {
  id: 'einheiten',
  parse(t) {
    const P = plain({ context: '', prompt: t.prompt }).trim();
    const mm2 = P.replace(/⟦1⟧/g, '□').match(new RegExp(`^(\\d+(?:,\\d+)?|\\d+/\\d+|\\d+ \\d+/\\d+) ?${UNIT_RE} ?= ?□ ?${UNIT_RE}$`));
    if (!mm2) return null;
    const [, raw, from, to] = mm2;
    if (familyOf(from) !== familyOf(to)) return null;
    let v;
    if (/^\d+ \d+\/\d+$/.test(raw)) { const [w, f] = raw.split(' '); const [n, d] = f.split('/'); v = { type: 'mixed', w: +w, n: +n, d: +d }; }
    else if (raw.includes('/')) { const [n, d] = raw.split('/'); v = { type: 'frac', n: +n, d: +d }; }
    else v = { type: 'num', v: toNum(raw), dec: raw.includes(',') ? raw.split(',')[1].length : 0 };
    return { v, from, to };
  },
  make(p) {
    const f = UNITS[familyOf(p.from)];
    const result = (valueNum(p.v) * f[p.from]) / f[p.to];
    return {
      prompt: `$${valueTex(p.v)}\\,${unitTex(p.from)}=$ ⟦1⟧ $${unitTex(p.to)}$`,
      answer: gaps(part(result)),
      solution: `$1\\,${unitTex(p.from)} = ${fmtValue(f[p.from] / f[p.to])}\\,${unitTex(p.to)}$, also\n\n$${valueTex(p.v)}\\,${unitTex(p.from)} = ${fmtValue(result)}\\,${unitTex(p.to)}$`,
    };
  },
  vary(r, p) {
    const fam = UNITS[familyOf(p.from)];
    const keys = Object.keys(fam);
    const down = fam[p.from] > fam[p.to];
    for (let a = 0; a < 200; a++) {
      const from = r.pick(keys), to = r.pick(keys);
      if (from === to || (fam[from] > fam[to]) !== down) continue;
      let v;
      if (p.v.type === 'frac') { const [n, d] = r.pick([[1, 2], [3, 4], [1, 4], [1, 5], [2, 5], [3, 5], [1, 8], [3, 8]]); v = { type: 'frac', n, d }; }
      else if (p.v.type === 'mixed') { const [n, d] = r.pick([[1, 2], [1, 4], [3, 4], [1, 3], [2, 3]]); v = { type: 'mixed', w: r.int(1, 4), n, d }; }
      else if (p.v.dec > 0) { const dec = r.int(1, 2); v = { type: 'num', v: r.int(11, 999) / 10 ** dec, dec }; }
      else v = { type: 'num', v: r.pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 20, 25, 40, 50, 75, 120, 250, 300, 500]), dec: 0 };
      if (v.type === 'num' && v.dec > 0 && v.v % 1 === 0) continue;
      const res = (valueNum(v) * fam[from]) / fam[to];
      if (!isNice(res, 3, 1e8) || res === 0) continue;
      if ((p.v.type === 'frac' || p.v.type === 'mixed') && res % 1 !== 0 && decimals(res) > 2) continue;
      if (from === p.from && to === p.to && valueNum(v) === valueNum(p.v)) continue;
      return { v, from, to };
    }
    return null;
  },
};

// 2,3 km + 840 m = □ km   /   0,5 t + □ kg = 0,520 t
const unitSumFamily = {
  id: 'einheiten-summe',
  parse(t) {
    const P = plain({ context: '', prompt: t.prompt }).replace(/⟦1⟧/g, '□').replace(/\s+/g, '');
    let m = P.match(/^(\d+(?:,\d+)?)km\+(\d+)m=□km$/);
    if (m) return { kind: 'km', a: toNum(m[1]), b: toNum(m[2]) };
    m = P.match(/^(\d+(?:,\d+)?)t\+□kg=(\d+(?:,\d+)?)t$/);
    if (m) return { kind: 't', a: toNum(m[1]), c: toNum(m[2]) };
    return null;
  },
  make(p) {
    if (p.kind === 'km') {
      const res = round(p.a + p.b / 1000, 3);
      return { prompt: `$${mm(p.a, 1)}\\,\\text{km}+${p.b}\\,\\text{m}=$ ⟦1⟧ $\\text{km}$`, answer: gaps(part(res)), solution: `$${p.b}\\,\\text{m} = ${fmtValue(p.b / 1000)}\\,\\text{km}$, also $${mm(p.a, 1)}+${fmtValue(p.b / 1000)} = ${fmtValue(res)}$ km.` };
    }
    const kg = Math.round((p.c - p.a) * 1000);
    return { prompt: `$${mm(p.a, 1)}\\,\\text{t}+$ ⟦1⟧ $\\text{kg}=${mm(p.c, 3)}\\,\\text{t}$`, answer: gaps(part(kg)), solution: `$${mm(p.c, 3)}\\,\\text{t} - ${mm(p.a, 1)}\\,\\text{t} = ${fmtValue(round(p.c - p.a, 3))}\\,\\text{t} = ${kg}\\,\\text{kg}$` };
  },
  vary(r, p) {
    if (p.kind === 'km') return { kind: 'km', a: r.int(11, 99) / 10, b: r.pick([60, 120, 250, 340, 450, 580, 720, 860, 940]) };
    const a = r.int(1, 9) / 10;
    return { kind: 't', a, c: round(a + r.pick([10, 20, 25, 40, 45, 60, 75, 80, 120, 150, 240]) / 1000, 3) };
  },
};

// ---------------------------------------------------------------- 3. Terme und Gleichungen
const sgn = (n) => (n < 0 ? `-${Math.abs(n)}` : `+${n}`);
const coef = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));
const termValue = {
  id: 'termwert',
  parse(t) {
    const P = plain(t);
    let m = P.match(/Berechne den Wert des Terms\s*(-?\d*)x ?([+-]) ?(\d+) ?([+-]) ?(\d*)x für x ?= ?(-?\d+)/);
    if (m) return { kind: 'axbcx', a: m[1] === '' ? 1 : +m[1], b: +(m[2] + m[3]), c: +(m[4] + (m[5] || 1)), x: +m[6] };
    m = P.match(/Berechne den Wert des Terms\s*(\d+)x ?- ?\((\d+) ?\+ ?(\d+)x\) für x ?= ?1\/(\d+)/);
    if (m) return { kind: 'bracket', a: +m[1], b: +m[2], c: +m[3], q: +m[4] };
    return null;
  },
  make(p) {
    if (p.kind === 'axbcx') {
      const res = (p.a + p.c) * p.x + p.b;
      return { prompt: `Berechne den Wert des Terms $${coef(p.a)}x${sgn(p.b)}${p.c < 0 ? '-' : '+'}${Math.abs(p.c) === 1 ? '' : Math.abs(p.c)}x$ für $x=${p.x}$.\n\n⟦1⟧`, answer: gaps(part(res)), solution: `Zuerst zusammenfassen: $${coef(p.a)}x${p.c < 0 ? '-' : '+'}${Math.abs(p.c) === 1 ? '' : Math.abs(p.c)}x = ${coef(p.a + p.c)}x$, also $${coef(p.a + p.c)}x${sgn(p.b)}$.\n\nEinsetzen: $${p.a + p.c}\\cdot ${p.x}${sgn(p.b)} = ${res}$` };
    }
    const res = round((p.a - p.c) / p.q - p.b, 6);
    return { prompt: `Berechne den Wert des Terms $${p.a}x-(${p.b}+${p.c}x)$ für $x=\\frac{1}{${p.q}}$.\n\n⟦1⟧`, answer: gaps(part(res, { tol: 0.0001 })), solution: `Klammer auflösen: $${p.a}x-${p.b}-${p.c}x = ${p.a - p.c}x-${p.b}$.\n\nEinsetzen: $${p.a - p.c}\\cdot\\frac{1}{${p.q}}-${p.b} = ${fmtValue(res)}$` };
  },
  vary(r, p) {
    for (let i = 0; i < 100; i++) {
      if (p.kind === 'axbcx') {
        const q = { kind: 'axbcx', a: r.int(2, 9), b: r.pick([-1, 1]) * r.int(2, 15), c: r.pick([-1, 1]) * r.int(1, 8), x: r.int(2, 6) };
        if (q.a + q.c !== 0 && JSON.stringify(q) !== JSON.stringify(p)) return q;
      } else {
        const q = { kind: 'bracket', a: r.int(3, 9), b: r.int(2, 12), c: r.int(2, 12), q: r.pick([2, 4, 5]) };
        if (isNice((q.a - q.c) / q.q - q.b, 2) && q.a !== q.c && JSON.stringify(q) !== JSON.stringify(p)) return q;
      }
    }
    return null;
  },
};

const linearEquation = {
  id: 'gleichung',
  parse(t) {
    const m = plain(t).match(/Löse die Gleichung\.\s*(-?\d*)x ?([+-]) ?(\d+) ?([+-]) ?(\d*)x ?= ?(-?\d+)/);
    return m ? { a: m[1] === '' ? 1 : +m[1], b: +(m[2] + m[3]), c: +(m[4] + (m[5] || 1)), d: +m[6] } : null;
  },
  make(p) {
    const cx = `${p.c < 0 ? '-' : '+'}${Math.abs(p.c) === 1 ? '' : Math.abs(p.c)}x`;
    const sol = (p.d - p.b) / (p.a + p.c);
    return {
      prompt: `Löse die Gleichung.\n\n$\\mathrm{${coef(p.a)}x${sgn(p.b)}${cx}=${p.d}}$\n\n$x=$ ⟦1⟧`,
      answer: gaps(part(sol, { tol: 0.0001 })),
      solution: `$$\\begin{aligned} ${coef(p.a)}x${sgn(p.b)}${cx} &= ${p.d} \\\\ ${coef(p.a + p.c)}x${sgn(p.b)} &= ${p.d} \\qquad |\\; ${p.b < 0 ? '+' : '-'}${Math.abs(p.b)} \\\\ ${coef(p.a + p.c)}x &= ${p.d - p.b} \\qquad |\\; :${p.a + p.c} \\\\ x &= ${fmtValue(sol)} \\end{aligned}$$`,
    };
  },
  vary(r, p) {
    for (let i = 0; i < 100; i++) {
      const q = { a: r.int(2, 9), b: r.pick([-1, 1]) * r.int(3, 25), c: r.int(1, 8) * r.pick([1, 1, -1]), d: 0 };
      const s = r.int(2, 12) * r.pick([1, 1, 1, -1]);
      if (q.a + q.c <= 0) continue;
      q.d = (q.a + q.c) * s + q.b;
      if (JSON.stringify(q) !== JSON.stringify(p)) return q;
    }
    return null;
  },
};

// ---------------------------------------------------------------- 4. Textaufgaben (Prozent, Zinsen, Wahrscheinlichkeit, Tabellen …)
// „Kisten mit Äpfeln“ (Dativ) -> „Äpfel“ (Nominativ)
const FRUIT = { Äpfeln: 'Äpfel', Birnen: 'Birnen', Orangen: 'Orangen', Pfirsichen: 'Pfirsiche' };
const NAMES = ['Nina', 'Jan', 'Mara', 'Tom', 'Lea', 'Ben', 'Selin', 'Omar'];
const textEntries = [
  {
    id: 'rabatt',
    parse(t) {
      const m = plain(t).match(new RegExp(`Ein (\\S+) kostet ${NUMBER} ?€\\.\\s*(\\S+) erhält ${NUMBER} ?% Rabatt`));
      return m ? { item: m[1], price: toNum(m[2]), who: m[3], rate: toNum(m[4]) } : null;
    },
    make: (p) => {
      const res = p.price * (1 - p.rate / 100);
      return {
        prompt: `Ein ${p.item} kostet ${dt(p.price)} €. ${p.who} erhält ${dt(p.rate)} % Rabatt auf diesen Preis.\n\nBerechne den neuen Preis.\n\nDer neue Preis beträgt ⟦1⟧ €.`,
        answer: gaps(part(res, { tol: 0.011 })),
        solution: `$${mm(p.rate)}\\,\\%$ von $${mm(p.price)}$ € sind $${mm(p.price)}\\cdot ${mm(p.rate / 100)} = ${fmtValue(p.price * p.rate / 100)}$ €.\n\nNeuer Preis: $${mm(p.price)} - ${fmtValue(p.price * p.rate / 100)} = ${fmtValue(res)}$ €`,
      };
    },
    vary: (r, p) => ({ item: r.pick(['Tablet', 'Fahrrad', 'Smartphone', 'Rucksack', 'Fernseher']), price: r.pick([80, 120, 160, 240, 320, 360, 450, 480, 520, 640, 700, 800]), who: r.pick(NAMES), rate: r.pick([5, 10, 15, 20, 25, 30, 40]) }),
  },
  {
    id: 'fahrrad-anzahl',
    parse(t) {
      const m = plain(t).match(new RegExp(`Von ${NUMBER} Schülerinnen und Schülern einer Schule kommen ${NUMBER} ?% mit dem Fahrrad`));
      return m && /Berechne die Anzahl der Schülerinnen und Schüler, die mit dem Fahrrad/.test(t.prompt) ? { n: toNum(m[1]), p: toNum(m[2]) } : null;
    },
    make: (p) => ({
      context: `Von $${mm(p.n)}$ Schülerinnen und Schülern einer Schule kommen $${mm(p.p)}\\,\\%$ mit dem Fahrrad.`,
      prompt: `Berechne die Anzahl der Schülerinnen und Schüler, die mit dem Fahrrad kommen.\n\nEs kommen ⟦1⟧ Schülerinnen und Schüler mit dem Fahrrad zur Schule.`,
      answer: gaps(part(p.n * p.p / 100)),
      solution: `$${mm(p.p)}\\,\\%$ von $${mm(p.n)}$: $${mm(p.n)}\\cdot ${mm(p.p / 100)} = ${fmtValue(p.n * p.p / 100)}$`,
    }),
    vary: (r) => ({ n: r.pick([200, 240, 250, 300, 320, 360, 400, 450, 500, 600, 800]), p: r.pick([10, 15, 20, 25, 30, 35, 40, 45, 60, 65]) }),
    ok: (p) => Number.isInteger(p.n * p.p / 100),
  },
  {
    id: 'fahrrad-grundwert',
    parse(t) {
      const m = plain(t).match(new RegExp(`An einer anderen Schule kommen ${NUMBER} ?% der Kinder mit dem Fahrrad\\. Das sind ${NUMBER} Kinder`));
      return m ? { p: toNum(m[1]), w: toNum(m[2]) } : null;
    },
    make: (p) => ({
      context: `An einer Schule kommen $${mm(p.p)}\\,\\%$ der Kinder mit dem Fahrrad. Das sind $${mm(p.w)}$ Kinder.`,
      prompt: `Berechne die Anzahl aller Kinder, die diese Schule besuchen.\n\nDiese Schule besuchen ⟦1⟧ Kinder.`,
      answer: gaps(part(p.w * 100 / p.p)),
      solution: `$${mm(p.p)}\\,\\% \\;\\hat{=}\\; ${mm(p.w)}$ Kinder, also $1\\,\\% \\;\\hat{=}\\; ${fmtValue(p.w / p.p)}$ Kinder.\n\n$100\\,\\%$: $${fmtValue(p.w / p.p)}\\cdot 100 = ${fmtValue(p.w * 100 / p.p)}$`,
    }),
    vary: (r) => { const p = r.pick([20, 25, 40, 50, 60, 75, 80]); const g = r.pick([200, 240, 300, 360, 400, 500, 600, 800]); return { p, w: g * p / 100 }; },
    ok: (p) => Number.isInteger(p.w * 100 / p.p) && p.w < 2000,
  },
  {
    id: 'quadrat-gefaerbt',
    parse(t) {
      const m = plain(t).match(new RegExp(`Flächeninhalt des Quadrates beträgt ${NUMBER} ?cm.*?${NUMBER} ?% der Fläche gefärbt`, 's'));
      return m ? { a: toNum(m[1]), p: toNum(m[2]) } : null;
    },
    make: (p) => ({
      prompt: `Der Flächeninhalt des Quadrates beträgt $${mm(p.a)}\\,\\text{cm}^2$. Es sind $${mm(p.p)}\\,\\%$ der Fläche gefärbt.\n\nErgänze: Die gefärbte Fläche ist ⟦1⟧ $\\text{cm}^2$ groß.`,
      answer: gaps(part(p.a * p.p / 100, { tol: 0.011 })),
      solution: `$${mm(p.p)}\\,\\%$ von $${mm(p.a)}\\,\\text{cm}^2$: $${mm(p.a)}\\cdot ${mm(p.p / 100)} = ${fmtValue(p.a * p.p / 100)}\\,\\text{cm}^2$`,
    }),
    vary: (r) => ({ a: r.pick([16, 25, 36, 64, 80, 100, 120, 144, 200]), p: r.pick([10, 20, 25, 30, 40, 50, 60, 75]) }),
    ok: (p) => isNice(p.a * p.p / 100, 2),
  },
  {
    id: 'durchschnitt-summe',
    parse(t) {
      const m = plain(t).match(new RegExp(`(\\S+) hat in ${NUMBER} Spielen einen Durchschnitt von ${NUMBER} Treffern`));
      return m ? { who: m[1], n: toNum(m[2]), avg: toNum(m[3]) } : null;
    },
    make: (p) => ({
      prompt: `${p.who} hat in $${p.n}$ Spielen einen Durchschnitt von $${mm(p.avg)}$ Treffern erzielt.\n\nGib an, wie viele Treffer ${p.who} insgesamt erzielt hat.\n\n${p.who} hat insgesamt ⟦1⟧ Treffer erzielt.`,
      answer: gaps(part(p.n * p.avg)),
      solution: `Durchschnitt $=$ Summe $:$ Anzahl, also Summe $=$ Durchschnitt $\\cdot$ Anzahl:\n\n$${mm(p.avg)}\\cdot ${p.n} = ${fmtValue(p.n * p.avg)}$`,
    }),
    vary: (r) => ({ who: r.pick(['Kira', 'Lena', 'Mia', 'Ayla', 'Jule']), n: r.pick([3, 4, 5, 6, 8]), avg: r.pick([5.5, 6.5, 7.5, 8.5, 9, 10, 12, 4.5]) }),
    ok: (p) => Number.isInteger(p.n * p.avg),
  },
  {
    id: 'tueten',
    parse(t) {
      const m = plain(t).match(new RegExp(`In einem Regal stehen ${NUMBER} Kisten mit (Äpfeln|Birnen|Orangen|Pfirsichen)\\. In jeder Kiste sind ${NUMBER} \\S+\\..*?In jede Tüte werden ${NUMBER} `, 's'));
      return m ? { a: toNum(m[1]), fruit: m[2], b: toNum(m[3]), c: toNum(m[4]) } : null;
    },
    make: (p) => ({
      context: `In einem Regal stehen ${p.a} Kisten mit ${p.fruit}. In jeder Kiste sind ${p.b} ${FRUIT[p.fruit]}.\n\nAlle ${FRUIT[p.fruit]} werden in Tüten umgepackt. In jede Tüte werden ${p.c} ${FRUIT[p.fruit]} gepackt.`,
      prompt: `Berechne, wie viele Tüten man benötigt.\n\nMan benötigt ⟦1⟧ Tüten.`,
      answer: gaps(part(p.a * p.b / p.c)),
      solution: `Alle ${p.fruit}: $${p.a}\\cdot ${p.b} = ${p.a * p.b}$\n\nTüten: $${p.a * p.b} : ${p.c} = ${p.a * p.b / p.c}$`,
    }),
    vary: (r) => ({ a: r.int(12, 24), fruit: r.pick(['Äpfeln', 'Birnen', 'Orangen', 'Pfirsichen']), b: r.pick([6, 8, 9, 10, 12]), c: r.pick([4, 5, 6, 8, 10]) }),
    ok: (p) => Number.isInteger(p.a * p.b / p.c),
  },
  {
    id: 'lose-gewinn',
    parse(t) {
      const m = plain(t).match(new RegExp(`${NUMBER} Lose.*?${NUMBER} Gewinne`, 's'));
      if (!m || !/Wahrscheinlichkeit, einen Gewinn zu ziehen/.test(t.prompt)) return null;
      return { n: toNum(m[1]), g: toNum(m[2]), percent: /Prozent/.test(t.prompt) };
    },
    make: (p) => {
      const ctx = `In einem Eimer befinden sich insgesamt $${mm(p.n)}$ Lose. Davon sind $${p.g}$ Gewinne und der Rest Nieten.`;
      return p.percent
        ? { context: ctx, prompt: 'Bestimme die Wahrscheinlichkeit, einen Gewinn zu ziehen. Gib das Ergebnis in Prozent an.\n\nDie Wahrscheinlichkeit beträgt ⟦1⟧ %.', answer: gaps(part(p.g / p.n * 100, { tol: 0.011 })), solution: `$P(\\text{Gewinn}) = \\frac{${p.g}}{${p.n}} = ${fmtValue(p.g / p.n * 100)}\\,\\%$` }
        : { context: ctx, prompt: 'Bestimme die Wahrscheinlichkeit, einen Gewinn zu ziehen. Gib die Wahrscheinlichkeit als Bruch an.\n\nDie Wahrscheinlichkeit beträgt ⟦1⟧ .', answer: gaps(part(p.g / p.n, { tol: 0.0006 })), solution: `$P(\\text{Gewinn}) = \\frac{${p.g}}{${p.n}}$` };
    },
    vary: (r, p) => ({ n: r.pick([200, 250, 400, 500, 1000]), g: r.int(30, 140), percent: p.percent }),
    ok: (p) => p.g < p.n / 2 && isNice(p.g / p.n * 100, 1),
  },
  {
    id: 'lose-zwei',
    parse(t) {
      const m = plain(t).match(new RegExp(`${NUMBER} Lose.*?${NUMBER} Gewinne`, 's'));
      if (!m || !/nacheinander zwei Gewinne/.test(t.prompt)) return null;
      return { n: toNum(m[1]), g: toNum(m[2]), percent: /Jonas/.test(t.prompt) };
    },
    make: (p) => {
      const v = p.g / p.n * ((p.g - 1) / (p.n - 1));
      const ctx = `In einem Eimer befinden sich insgesamt $${mm(p.n)}$ Lose. Davon sind $${p.g}$ Gewinne und der Rest Nieten.`;
      const sol = `Die Lose werden nicht zurückgelegt:\n\n$P(\\text{zwei Gewinne}) = \\frac{${p.g}}{${p.n}}\\cdot\\frac{${p.g - 1}}{${p.n - 1}} \\approx ${fmtValue(round(v, 4))}$`;
      return p.percent
        ? { context: ctx, prompt: 'Jonas darf als Erster aus diesem Eimer zwei Lose ziehen.\n\nBerechne die Wahrscheinlichkeit in Prozent, dass Jonas nacheinander zwei Gewinne zieht. Runde auf zwei Nachkommastellen.\n\n⟦1⟧ %', answer: gaps(part(v * 100, { tol: 0.011 })), solution: `${sol}\n\nIn Prozent: $${fmtValue(round(v * 100, 2))}\\,\\%$` }
        : { context: ctx, prompt: 'Du darfst als erste Person aus diesem Eimer ziehen.\n\nBerechne die Wahrscheinlichkeit, nacheinander zwei Gewinne zu ziehen. Gib die Wahrscheinlichkeit als Bruch an.\n\n⟦1⟧', answer: gaps(part(v, { tol: 0.00006 })), solution: sol };
    },
    vary: (r, p) => ({ n: r.pick([200, 250, 400, 500]), g: r.int(30, 120), percent: p.percent }),
    ok: (p) => p.g < p.n / 2,
  },
  {
    id: 'lose-zwei-nieten',
    parse(t) {
      const m = plain(t).match(new RegExp(`${NUMBER} Lose: ${NUMBER} Gewinne \\(G\\) und ${NUMBER} Nieten`));
      return m && /zwei Nieten/.test(t.prompt) ? { n: toNum(m[1]), g: toNum(m[2]) } : null;
    },
    make: (p) => {
      const ni = p.n - p.g;
      const v = ni / p.n * ((ni - 1) / (p.n - 1));
      return {
        context: `Im Eimer befinden sich insgesamt ${p.n} Lose: ${p.g} Gewinne (G) und ${ni} Nieten (N). Timo zieht nacheinander zwei Lose.`,
        prompt: 'Berechne die Wahrscheinlichkeit, nacheinander zwei Nieten zu ziehen. Gib das Ergebnis als Dezimalzahl an.\n\n⟦1⟧',
        answer: gaps(part(v, { tol: 0.0006 })),
        solution: `Die Lose werden nicht zurückgelegt:\n\n$P(N,N) = \\frac{${ni}}{${p.n}}\\cdot\\frac{${ni - 1}}{${p.n - 1}} \\approx ${fmtValue(round(v, 3))}$`,
      };
    },
    vary: (r) => ({ n: r.pick([200, 250, 400, 500]), g: r.int(30, 120) }),
    ok: (p) => p.g < p.n / 2,
  },
  {
    id: 'radrennen',
    parse(t) {
      const m = plain(t).match(/Drei Radrennfahrer \((\w+), (\w+),? (?:und )?(\w+)\)/);
      if (!m) return null;
      const both = /Ali bei beiden/.test(t.prompt);
      if (!both && !/zweimal derselbe/.test(t.prompt)) return null;
      return { names: [m[1], m[2], m[3]], both };
    },
    make: (p) => {
      const n = p.names.length;
      const words = { 3: 'Drei', 4: 'Vier', 5: 'Fünf' };
      const list = `${p.names.slice(0, -1).join(', ')} und ${p.names[n - 1]}`;
      const v = p.both ? 1 / n ** 2 : 1 / n;
      return {
        context: `${words[n]} Radrennfahrer (${list}) fahren ein Radrennen.\n\nDas Radrennen besteht aus zwei Etappen.\n\nNach jeder Etappe wird ein Radrennfahrer zur Dopingkontrolle zufällig ausgelost.`,
        prompt: `${p.both ? `Berechne die Wahrscheinlichkeit, dass ${p.names[0]} bei beiden Dopingkontrollen ausgelost wird.` : 'Berechne die Wahrscheinlichkeit, dass zweimal derselbe Radrennfahrer ausgelost wird.'}\n\n⟦1⟧`,
        answer: gaps(part(v, { tol: 0.0006 })),
        solution: p.both
          ? `Jede Auslosung: $\\frac{1}{${n}}$. Beide: $\\frac{1}{${n}}\\cdot\\frac{1}{${n}} = \\frac{1}{${n * n}}$`
          : `Egal, wer bei der ersten Kontrolle gezogen wird: Bei der zweiten muss derselbe gezogen werden: $\\frac{1}{${n}}$`,
      };
    },
    vary: (r, p) => { const all = ['Ali', 'Kai', 'Tom', 'Ben', 'Eda', 'Joe', 'Max']; const n = r.pick([4, 5]); return { names: ['Ali', ...r.shuffle(all.slice(1)).slice(0, n - 1)], both: p.both }; },
  },
  {
    id: 'sparkonto-zinssatz',
    parse(t) {
      const m = plain(t).match(new RegExp(`Laura hatte zu Beginn des Jahres ${NUMBER} ?€ auf ihrem Sparkonto\\.\\s*Am Jahresende waren es ${NUMBER} ?€`));
      return m ? { k: toNum(m[1]), end: toNum(m[2]) } : null;
    },
    make: (p) => ({
      prompt: `Laura hatte zu Beginn des Jahres $${mm(p.k)}\\ €$ auf ihrem Sparkonto.\n\nAm Jahresende waren es $${mm(p.end, 2)}\\ €$.\n\nBerechne den Zinssatz.\n\nDer Zinssatz beträgt ⟦1⟧ %.`,
      answer: gaps(part((p.end - p.k) / p.k * 100, { tol: 0.011 })),
      solution: `Zinsen: $${mm(p.end, 2)} - ${mm(p.k)} = ${fmtValue(round(p.end - p.k, 2))}$ €\n\nZinssatz: $\\frac{${fmtValue(round(p.end - p.k, 2))}}{${mm(p.k)}} = ${fmtValue(round((p.end - p.k) / p.k * 100, 3))}\\,\\%$`,
    }),
    vary: (r) => { const k = r.pick([800, 1200, 1500, 1800, 2000, 2400, 2500, 3000]); const pz = r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2.5]); return { k, end: round(k * (1 + pz / 100), 2) }; },
  },
  {
    id: 'mehrwertsteuer',
    parse(t) {
      const m = plain(t).match(new RegExp(`Mehrwertsteuer von (\\d+) ?% auf (\\d+) ?% gesenkt\\. Ein Auto kostet ohne Mehrwertsteuer ${NUMBER} ?€`));
      return m ? { from: +m[1], to: +m[2], price: toNum(m[3]) } : null;
    },
    make: (p) => ({
      context: `Im Juli 2020 wurde die Mehrwertsteuer von ${p.from} % auf ${p.to} % gesenkt. Ein Auto kostet ohne Mehrwertsteuer ${dt(p.price)} €.`,
      prompt: `Berechne den Gesamtpreis für das Auto inklusive ${p.to} % Mehrwertsteuer.\n\nDer Gesamtpreis beträgt ⟦1⟧ €.`,
      answer: gaps(part(p.price * (1 + p.to / 100), { tol: 0.011 })),
      solution: `$100\\,\\% + ${p.to}\\,\\% = ${100 + p.to}\\,\\% = ${mm(1 + p.to / 100)}$\n\n$${mm(p.price)}\\cdot ${mm(1 + p.to / 100)} = ${fmtValue(round(p.price * (1 + p.to / 100), 2))}$ €`,
    }),
    vary: (r, p) => ({ from: p.from, to: p.to, price: r.pick([9800, 11250, 12480, 13200, 15800, 17500, 19900, 21600]) }),
  },
  {
    id: 'elektroautos',
    parse(t) {
      const m = plain(t).match(new RegExp(`Im (\\w+) (\\d{4}) wurden in Norwegen ${NUMBER} Elektro-Autos verkauft\\.\\s*Das war ein Anteil von ${NUMBER} ?%`));
      return m ? { month: m[1], year: +m[2], w: toNum(m[3]), p: toNum(m[4]) } : null;
    },
    make: (p) => ({
      context: `Im ${p.month} ${p.year} wurden in Norwegen $${mm(p.w)}$ Elektro-Autos verkauft.\n\nDas war ein Anteil von $${mm(p.p)}\\,\\%$.`,
      prompt: `Berechne die Anzahl aller im ${p.month} ${p.year} verkauften Autos.\n\nEs wurden ⟦1⟧ Autos verkauft.`,
      answer: gaps(part(p.w * 100 / p.p)),
      solution: `$${mm(p.p)}\\,\\% \\;\\hat{=}\\; ${mm(p.w)}$, also $1\\,\\% \\;\\hat{=}\\; ${fmtValue(p.w / p.p)}$\n\n$100\\,\\%$: $${fmtValue(p.w / p.p)}\\cdot 100 = ${fmtValue(p.w * 100 / p.p)}$`,
    }),
    vary: (r) => { const pr = r.pick([25, 40, 50, 60, 75, 80]); const g = r.pick([6000, 8000, 9600, 10000, 12000, 14400]); return { month: r.pick(['März', 'April', 'Mai', 'Juni', 'Juli']), year: 2022, w: g * pr / 100, p: pr }; },
    ok: (p) => Number.isInteger(p.w * 100 / p.p),
  },
  {
    id: 'rechtecke-flaeche',
    parse(t) {
      return /haben den gleichen Flächeninhalt/.test(t.context) && /Ergänze die fehlenden Werte in der Tabelle/.test(t.prompt) && /Rechteck/.test(t.prompt)
        ? { a: 40, l: [2, 4, 8, 80] } : null;
    },
    make: (p) => {
      const w = p.l.map((l) => p.a / l);
      const u = (v) => `${mm(v)}\\,\\text{m}`;
      return {
        context: 'Die Rechtecke (1), (2), (3) und (4) haben den gleichen Flächeninhalt.',
        prompt: `Ergänze die fehlenden Werte in der Tabelle.\n\n|   | Länge | Breite |\n|---|---|---|\n| Rechteck (1) | $${u(p.l[0])}$ | $${u(w[0])}$ |\n| Rechteck (2) | $${u(p.l[1])}$ | ⟦1⟧ m |\n| Rechteck (3) | $${u(p.l[2])}$ | $${u(w[2])}$ |\n| Rechteck (4) | $${u(p.l[3])}$ | ⟦2⟧ m |`,
        answer: gaps(part(w[1], { tol: 0.0001 }), part(w[3], { tol: 0.0001 })),
        solution: `Alle Rechtecke haben den Flächeninhalt $A = ${mm(p.l[0])}\\cdot ${mm(w[0])} = ${mm(p.a)}\\,\\text{m}^2$. Die Breite ist $A$ geteilt durch die Länge:\n\n(2): $${mm(p.a)} : ${mm(p.l[1])} = ${fmtValue(w[1])}$ m\n\n(4): $${mm(p.a)} : ${mm(p.l[3])} = ${fmtValue(w[3])}$ m`,
      };
    },
    vary: (r) => {
      const a = r.pick([24, 36, 48, 60, 72, 90]);
      const divs = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 45, 60].filter((d) => a % d === 0 && d < a);
      const l = r.shuffle(divs).slice(0, 3);
      return { a, l: [l[0], l[1], l[2], a * r.pick([2, 4, 5])] };
    },
  },
  {
    id: 'apfel-tabelle',
    parse(t) {
      return /Wochenmarkt verkauft Steffi Äpfel/.test(t.context) && /Ergänze die Lücken in der Tabelle/.test(t.prompt) ? { p1: 2.8, p2: 3.2, k: 5 } : null;
    },
    make: (p) => {
      const c = (v) => `${money(v)} €`;
      return {
        context: 'Auf dem Wochenmarkt verkauft Steffi Äpfel. Dafür legt sie eine Tabelle an, um schnell die Preise abzulesen.',
        prompt: `Ergänze die Lücken in der Tabelle.\n\n| Menge | Preis "Roter Boskop" | Preis "Jonagold" |\n|---|---|---|\n| 1 kg | ${c(p.p1)} | ${c(p.p2)} |\n| 2 kg | ${c(2 * p.p1)} | ${c(2 * p.p2)} |\n| 3 kg | ${c(3 * p.p1)} | ⟦1⟧ |\n| ⟦2⟧ | ${c(p.k * p.p1)} | ${c(p.k * p.p2)} |`,
        answer: gaps(part(3 * p.p2, { tol: 0.011 }), part(p.k)),
        solution: `Der Preis ist proportional zur Menge.\n\n3 kg Jonagold: $3\\cdot ${mm(p.p2, 2)} = ${fmtValue(round(3 * p.p2, 2))}$ €\n\nMenge: $${fmtValue(round(p.k * p.p1, 2))} : ${mm(p.p1, 2)} = ${p.k}$ kg`,
      };
    },
    vary: (r) => { const [p1, p2] = r.pick([[2.4, 2.8], [1.9, 2.3], [2.6, 3.1], [3.2, 3.6], [1.8, 2.2], [2.5, 3.0]]); return { p1, p2, k: r.pick([4, 5, 6, 8]) }; },
  },
  {
    id: 'kuehe-runden',
    parse(t) {
      const m = plain(t).match(/Alle niedersächsischen Kühe geben zusammen jeden Tag durchschnittlich (\d+(?: \d{3})+) Liter Milch/);
      return m && /Runde die Zahl auf ganze Millionen/.test(t.prompt) ? { n: toNum(m[1]) } : null;
    },
    make: (p) => ({
      context: `Alle niedersächsischen Kühe geben zusammen jeden Tag durchschnittlich $${de(p.n, 0)}$ Liter Milch.`,
      prompt: 'Runde die Zahl auf ganze Millionen.\n\n⟦1⟧ Liter',
      answer: gaps(part(Math.round(p.n / 1e6) * 1e6, { alt: [Math.round(p.n / 1e6)] })),
      solution: `Die Hunderttausenderstelle entscheidet: $${String(p.n).slice(-6, -5)}$ → ${Number(String(p.n).slice(-6, -5)) >= 5 ? 'aufrunden' : 'abrunden'}.\n\n$${de(Math.round(p.n / 1e6) * 1e6, 0)}$`,
    }),
    vary: (r) => ({ n: r.int(11, 97) * 1e6 + r.int(100000, 999999) }),
  },
  {
    id: 'quadratische-gleichung',
    parse(t) {
      const m = plain(t).match(/Löse die quadratische Gleichung x²([+-]\d+)x([+-]\d+)=0/);
      return m ? { p: +m[1], q: +m[2] } : null;
    },
    make: (p) => {
      const d = (p.p / 2) ** 2 - p.q, s = Math.sqrt(d);
      const x1 = -p.p / 2 + s, x2 = -p.p / 2 - s;
      return {
        prompt: `Löse die quadratische Gleichung $x^2${sgn(p.p)}x${sgn(p.q)}=0$.\n\n$x_1 =$ ⟦1⟧\n\n$x_2=$ ⟦2⟧`,
        answer: { ...gaps(part(x1), part(x2)), unordered: true },
        solution: `p-q-Formel mit $p=${p.p}$ und $q=${p.q}$:\n\n$$x_{1/2} = -\\frac{${p.p}}{2} \\pm \\sqrt{\\left(\\frac{${p.p}}{2}\\right)^2 - (${p.q})} = ${fmtValue(-p.p / 2)} \\pm ${fmtValue(s)}$$\n\n$x_1 = ${fmtValue(x1)}$ und $x_2 = ${fmtValue(x2)}$`,
      };
    },
    vary: (r) => { for (;;) { const x1 = r.int(-12, 8), x2 = r.int(-12, 8); if (x1 !== x2 && x1 * x2 !== 0 && (x1 < 0 || x2 < 0)) return { p: -(x1 + x2), q: x1 * x2 }; } },
  },
  {
    id: 'schnittpunkt',
    parse(t) {
      const m = plain(t).match(/g: ?y ?= ?(-?\d*)x ?([+-]) ?(\d+).*?h: ?y ?= ?(-?\d*)x ?([+-]) ?(\d+)/s);
      if (!m || !/Bestimme den Schnittpunkt der beiden Geraden/.test(t.prompt)) return null;
      const co = (s) => (s === '' ? 1 : s === '-' ? -1 : +s);
      return { m1: co(m[1]), b1: +(m[2] + m[3]), m2: co(m[4]), b2: +(m[5] + m[6]) };
    },
    make: (p) => {
      const x = (p.b2 - p.b1) / (p.m1 - p.m2), y = p.m1 * x + p.b1;
      const lin = (m, b) => `${coef(m)}x${b === 0 ? '' : sgn(b)}`;
      return {
        prompt: `Zwei Geraden $g$ und $h$ haben folgende Funktionsgleichungen:\n\n$g: y = ${lin(p.m1, p.b1)}$\n\n$h: y = ${lin(p.m2, p.b2)}$\n\nBestimme den Schnittpunkt der beiden Geraden.\n\nS(⟦1⟧ \\| ⟦2⟧)`,
        answer: gaps(part(x), part(y)),
        solution: `Gleichsetzen: $${lin(p.m1, p.b1)} = ${lin(p.m2, p.b2)}$\n\nAuflösen: $${p.m1 - p.m2}x = ${p.b2 - p.b1}$, also $x = ${fmtValue(x)}$.\n\nEinsetzen in $g$: $y = ${p.m1}\\cdot ${fmtValue(x)}${sgn(p.b1)} = ${fmtValue(y)}$\n\n$S(${fmtValue(x)} \\mid ${fmtValue(y)})$`,
      };
    },
    vary: (r) => { for (;;) { const x = r.int(-4, 4), y = r.int(-6, 6), m1 = r.int(-4, 5), m2 = r.int(-4, 5); if (m1 !== m2 && m1 !== 0 && m2 !== 0) return { m1, b1: y - m1 * x, m2, b2: y - m2 * x }; } },
  },
  {
    id: 'wertetabelle-quadratisch',
    parse(t) {
      const m = plain(t).match(/Funktionsgleichung y ?= ?x² ?([+-]) ?(\d+)x ?([+-]) ?(\d+)/);
      return m && /Wertetabelle/.test(t.prompt) ? { kind: 'allg', b: +(m[1] + m[2]), c: +(m[3] + m[4]) } : null;
    },
    make: (p) => {
      const xs = [-4, -3, -2, -1, 0, 1, 2];
      const ys = xs.map((x) => x * x + p.b * x + p.c);
      return {
        context: `Eine quadratische Funktion hat die Funktionsgleichung $y = x^2${p.b === 0 ? '' : `${p.b < 0 ? '-' : '+'}${Math.abs(p.b) === 1 ? '' : Math.abs(p.b)}x`}${sgn(p.c)}$.`,
        prompt: `Vervollständige die Wertetabelle.\n\n| x | ${xs.join(' | ')} |\n|---|${xs.map(() => '---').join('|')}|\n| y | ${ys.map((y, i) => (i === 2 ? '⟦1⟧' : y)).join(' | ')} |`,
        answer: gaps(part(ys[2])),
        solution: `Für $x=-2$ einsetzen: $y = (-2)^2${p.b < 0 ? '-' : '+'}${Math.abs(p.b)}\\cdot(-2)${sgn(p.c)} = ${ys[2]}$`,
      };
    },
    vary: (r) => ({ kind: 'allg', b: r.pick([-4, -2, 2, 3, 4, 6]), c: r.pick([-5, -3, -1, 1, 2]) }),
  },
  {
    id: 'wertetabelle-tor',
    parse(t) {
      const m = plain(t).match(/Funktionsgleichung y ?= ?- ?x² ?\+ ?(\d+)x ?- ?(\d+)/);
      return m && /Wertetabelle/.test(t.prompt) ? { b: +m[1], c: -m[2] } : null;
    },
    make: (p) => {
      const xs = [0.5, 1, 1.5, 2, 2.5, 3];
      const ys = xs.map((x) => -x * x + p.b * x + p.c);
      return {
        context: `Es wird eine Toreinfahrt in Form einer Parabel gebaut.\n\nDie Parabel hat die Funktionsgleichung $y = -x^2+${p.b}x${sgn(p.c)}$.`,
        prompt: `Ergänze den fehlenden Wert in der Wertetabelle.\n\n| x in m | ${xs.map((x) => de(x, 1)).join(' | ')} |\n|---|${xs.map(() => '---').join('|')}|\n| y in m | ⟦1⟧ | ${ys.slice(1).map((y) => de(y, 2)).join(' | ')} |`,
        answer: gaps(part(ys[0], { tol: 0.0001 })),
        solution: `Für $x=0{,}5$ einsetzen: $y = -0{,}5^2+${p.b}\\cdot 0{,}5${sgn(p.c)} = ${fmtValue(ys[0])}$`,
      };
    },
    vary: (r) => ({ b: r.pick([2, 3, 4, 5, 6]), c: r.pick([-3, -2, -1, 0, 1]) }),
  },
  {
    id: 'farbstoff-tabelle',
    parse(t) {
      const m = plain(t).match(/scheidet pro 10 Minuten ca\. (\d+) ?% des jeweils noch vorhandenen Farbstoffes aus/);
      return m && /Vervollständige die Tabelle/.test(t.prompt) ? { rate: +m[1] } : null;
    },
    make: (p) => {
      const q = 1 - p.rate / 100;
      const v = (k) => 100 * q ** k;
      const f = (k) => (Number.isInteger(round(v(k), 9)) ? String(round(v(k), 9)) : round(v(k), 1).toFixed(1).replace('.', ','));
      return {
        context: `Um eine Bauchspeicheldrüse zu untersuchen, wird dem Patienten ein Farbstoff gespritzt.\n\nEine gesunde Bauchspeicheldrüse scheidet pro 10 Minuten ca. ${p.rate} % des jeweils noch vorhandenen Farbstoffes aus.`,
        prompt: `Vervollständige die Tabelle.\n\n| Zeit in Minuten | 0 | 10 | 20 | 30 | 40 | 50 | ... | 80 |\n|---|---|---|---|---|---|---|---|---|\n| Farbstoffmenge in % | 100 | ${f(1)} | ⟦1⟧ | ${f(3)} | ${f(4)} | ${f(5)} | ... | ${f(8)} |`,
        answer: gaps(part(v(2), { tol: 0.06 })),
        solution: `Pro 10 Minuten bleiben $${100 - p.rate}\\,\\%$ übrig, also Faktor $${mm(q)}$.\n\nNach 20 Minuten: $${f(1)}\\cdot ${mm(q)} = ${fmtValue(round(v(2), 2))}$`,
      };
    },
    vary: (r, p) => ({ rate: pickDifferent(r, [10, 20, 25, 40, 50], p.rate) }),
  },
];

// ---------------------------------------------------------------- Zusammenstellung
export const VARIANTS = [equationFamily, unitFamily, unitSumFamily, termValue, linearEquation, ...textEntries];

export function paramsFor(entry, t) {
  if (t.answer?.type !== 'fields') return null; // Auswahl- und Freitextaufgaben bekommen keine Variante
  try { return entry.parse(t); } catch { return null; }
}

// Die Vorlage muss die Originalaufgabe aus deren Originalzahlen richtig nachrechnen, sonst gibt es keine Variante.
export function validated(entry, t) {
  const p0 = paramsFor(entry, t);
  if (!p0) return null;
  try {
    const got = entry.make({ ...p0 }).answer.parts, want = t.answer.parts;
    if (got.length !== want.length) return null;
    const ok = want.every((w, i) => w.kind !== 'number' || [w.value, ...w.alternatives].some((v) => Math.abs(v - got[i].value) <= Math.max(0.0111, Math.abs(v) * 1e-3)));
    return ok ? p0 : null;
  } catch { return null; }
}

// Liefert die zusätzlichen Varianten (Standard: zwei) zu einer Originalaufgabe.
export function variantsFor(t, count = 2) {
  for (const entry of VARIANTS) {
    const p0 = validated(entry, t);
    if (!p0) continue;
    const r = rng(seedOf(`${entry.id}|${t.context}|${t.prompt}`));
    const out = [];
    for (let i = 0; i < count * 30 && out.length < count; i++) {
      const p = entry.vary(r, p0);
      if (!p || (entry.ok && !entry.ok(p))) continue;
      const v = entry.make({ ...p, answer: p.answer ?? undefined });
      if (!v?.prompt) continue;
      if (out.some((o) => o.prompt === v.prompt && (o.context || '') === (v.context || ''))) continue;
      if (v.prompt === t.prompt && (v.context || '') === t.context) continue;
      out.push({ points: t.points, context: t.context, ...v, source: `Variante mit geänderten Zahlen zu: ${[...new Set(t.sources || [])].join('  |  ')}` });
    }
    return out;
  }
  return [];
}
