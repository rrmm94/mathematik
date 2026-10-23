// Grundlagen-Training: Geometrische Gesetzmäßigkeiten
// (Streckung, Strahlensätze, Pythagoras, Thales, Trigonometrie, Kreisteile, Körper)
import { L, rng, de, dt, round, num, fields, sel, approx, graph, unordered } from './kit.js';

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const PI = Math.PI;
const sin = (d) => Math.sin(rad(d));
const cos = (d) => Math.cos(rad(d));
const tan = (d) => Math.tan(rad(d));
const tolOf = (v, rel = 0.004) => Math.max(0.011, Math.abs(v) * rel);
const val = (v, label, unit = '', rel = 0.004) => approx(round(v, 6), { label, unit, tol: tolOf(v, rel) });
const angle = (v, label) => approx(round(v, 6), { label, unit: '°', tol: 0.15 });
const f1 = (v) => de(v, 1);
const f2 = (v) => de(v, 2);

function distinct(gen, count, seed) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < count * 10; i++) {
    const v = gen(rng(seed * 173 + i));
    if (!v) continue;
    const key = v.prompt + JSON.stringify(v.answer);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

let draw; // wird in build() gesetzt (fig.draw)
const NOTE = '*Skizze nicht maßstäblich.*';

// Dreieck-Skizze: P = [A, B, C] in Pixeln; sides: { a, b, c }, angles: { A, B, C }, right: 'A' | 'B' | 'C'
function triFig(name, P, { sides = {}, angles = {}, right = null, w = 340, h = 220, names = ['A', 'B', 'C'], extra = '' } = {}) {
  const [A, B, C] = P;
  const cen = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  const unit = (from, to) => { const dx = to[0] - from[0], dy = to[1] - from[1]; const l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const away = (p, d) => { const u = unit(cen, p); return [p[0] + u[0] * d, p[1] + u[1] * d]; };
  const toward = (p, d) => { const u = unit(p, cen); return [p[0] + u[0] * d, p[1] + u[1] * d]; };
  let body = draw.poly(P, '#eef2ff');
  const V = { A, B, C };
  Object.entries(V).forEach(([k, p], i) => {
    const q = away(p, 16);
    body += draw.tx(q[0], q[1] + 5, names[i], 'middle', "font-size='15' font-weight='700' fill='#0f172a'");
  });
  const mids = { a: [B, C], b: [A, C], c: [A, B] };
  Object.entries(sides).forEach(([k, t]) => {
    const [p, q] = mids[k];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const o = away(m, 18);
    body += draw.tx(o[0], o[1] + 5, t, 'middle', "font-size='13.5' fill='#4f46e5' font-weight='600'");
  });
  Object.entries(angles).forEach(([k, t]) => {
    const q = toward(V[k], 30);
    body += draw.tx(q[0], q[1] + 5, t, 'middle', "font-size='13.5' fill='#b45309' font-weight='700'");
  });
  if (right) {
    const others = Object.entries(V).filter(([k]) => k !== right).map(([, p]) => p);
    body += draw.ra(V[right][0], V[right][1], unit(V[right], others[0]), unit(V[right], others[1]));
  }
  return draw.svg(name, w, h, body + extra);
}

// Dreieck mit vorgegebenen Winkeln/Kathete rechtwinklig bei C (ein Punkt A links unten)
const rightAtC = (b, alphaDeg, scale = 45, x0 = 24, y0 = 190) => {
  const A = [x0, y0];
  const B = [x0 + (b / cos(alphaDeg)) * scale, y0];
  const C = [x0 + b * cos(alphaDeg) * scale, y0 - b * sin(alphaDeg) * scale];
  return [A, B, C];
};

// Strahlensatz-Figur mit zwei parallelen Strecken (Skizze); r = Anteil innere/äußere Parallele
function rayFig(name, { r, base, ray, par, w = 340, h = 270 }) {
  const Z = [30, 245];
  const d = [0.55, -0.83];
  const v = [-60, -110];
  const total = 240;
  const at = (t) => {
    const P = [Z[0] + t, Z[1]];
    const lam = t / ((110 / 0.83) * 0.55 + 60);
    return { P, Q: [P[0] + lam * v[0], P[1] + lam * v[1]] };
  };
  const inner = at(total * r);
  const outer = at(total);
  let body = draw.ln(Z[0], Z[1], outer.P[0] + 20, Z[1]);
  const end = [outer.Q[0] + 28 * d[0], outer.Q[1] + 28 * d[1]];
  body += draw.ln(Z[0], Z[1], end[0], end[1]);
  body += draw.ln(inner.P[0], inner.P[1], inner.Q[0], inner.Q[1], "stroke='#4f46e5'");
  body += draw.ln(outer.P[0], outer.P[1], outer.Q[0], outer.Q[1], "stroke='#4f46e5'");
  body += draw.dot(Z[0], Z[1]) + draw.tx(Z[0] - 10, Z[1] + 5, 'Z', 'end', "font-size='15' font-weight='700'");
  const lab = (x, y, t, anchor = 'middle') => draw.tx(x, y, t, anchor, "font-size='13.5' fill='#0f172a' font-weight='600'");
  body += lab(Z[0] + (total * r) / 2, Z[1] + 20, base[0]);
  body += lab(Z[0] + total * r + (total * (1 - r)) / 2, Z[1] + 20, base[1]);
  if (ray) {
    const mx = (Z[0] + inner.Q[0]) / 2 - 8, my = (Z[1] + inner.Q[1]) / 2 - 4;
    body += lab(mx, my, ray[0], 'end');
    const mx2 = (inner.Q[0] + outer.Q[0]) / 2 - 8, my2 = (inner.Q[1] + outer.Q[1]) / 2 - 4;
    body += lab(mx2, my2, ray[1], 'end');
  }
  body += lab((inner.P[0] + inner.Q[0]) / 2 + 10, (inner.P[1] + inner.Q[1]) / 2 + 4, par[0], 'start');
  body += lab((outer.P[0] + outer.Q[0]) / 2 + 12, (outer.P[1] + outer.Q[1]) / 2, par[1], 'start');
  return draw.svg(name, w, h, body);
}

export function build({ fig }) {
  draw = fig.draw;
  // ======================================================================== Zentrische Streckung
  const stretchPoly = (name, poly, Z, k, view, label) => {
    const img = poly.map(([x, y]) => [Z[0] + k * (x - Z[0]), Z[1] + k * (y - Z[1])]);
    const url = fig.plot({ ...view, name, polygons: [{ pts: poly }, { pts: img, fill: '#fde68a', color: '#d97706' }], points: [{ x: Z[0], y: Z[1], label: 'Z' }] });
    return { img, url };
  };
  const stretchTask = (name, poly, Z, k, view, names) => {
    const { img, url } = stretchPoly(`streck-${name}`, poly, Z, k, view);
    return {
      prompt: `Strecke die Figur vom Zentrum $Z(${de(Z[0])}\\mid${de(Z[1])})$ aus mit dem Streckungsfaktor $k=${de(k)}$.\n\nTippe im Koordinatensystem alle **Eckpunkte der Bildfigur** an. Das Original ist grau eingezeichnet.`,
      answer: { ...graph({ view: { ...view, snapX: 0.5, snapY: 0.5 }, lines: [] }), mode: 'points', count: img.length, points: img, tolerance: 0.01, polygons: [poly], given: [[Z[0], Z[1], 'Z']], connect: true },
      solution: `Jeder Bildpunkt liegt auf der Halbgeraden von $Z$ durch den Originalpunkt. Sein Abstand von $Z$ ist das $${de(k)}$-Fache.\n\n` + poly.map((p, i) => `$${names[i]} (${de(p[0])}\\mid${de(p[1])}) \\to ${names[i]}' (${de(img[i][0])}\\mid${de(img[i][1])})$`).join('\n\n') + `\n\n![Original und Bild](${url})`,
      hint: 'Rechne die Abstände vom Zentrum aus: $x$-Abstand und $y$-Abstand jeweils mit $k$ multiplizieren.',
    };
  };
  const V7 = { xmin: 0, xmax: 7, ymin: 0, ymax: 7, xstep: 1, ystep: 1 };
  const t78a = stretchTask('78a', [[1, 1], [5, 1], [3, 6]], [3, 1], 0.5, V7, ['A', 'B', 'C']);
  const t78b = stretchTask('78b', [[3, 4], [4, 3], [3, 2], [2, 3]], [3, 3], 2, V7, ['A', 'B', 'C', 'D']);
  const penta = [[1, 1], [3, 1], [3, 3], [2, 4.5], [1, 3]];
  const t79a = {
    prompt: 'Zeichne die Punkte $A(1\\mid1)$, $B(3\\mid1)$, $C(3\\mid3)$, $D(2\\mid4{,}5)$ und $E(1\\mid3)$ in ein Koordinatensystem ein und verbinde sie.\n\nTippe die fünf Punkte an. Die Figur entsteht dabei automatisch.',
    answer: { ...graph({ view: { xmin: 0, xmax: 7, ymin: 0, ymax: 7, snapX: 0.5, snapY: 0.5 }, lines: [] }), mode: 'points', count: 5, points: penta, tolerance: 0.01, connect: true },
    solution: 'Die Punkte werden nacheinander im Koordinatensystem markiert: erst der $x$-Wert (nach rechts), dann der $y$-Wert (nach oben).',
    hint: 'Der erste Wert ist immer der $x$-Wert, der zweite der $y$-Wert.',
  };
  const penta2 = penta.map(([x, y]) => [2 * x, 2 * y]);
  const t79b = {
    prompt: 'Das Fünfeck $ABCDE$ hat die Eckpunkte $A(1\\mid1)$, $B(3\\mid1)$, $C(3\\mid3)$, $D(2\\mid4{,}5)$ und $E(1\\mid3)$.\n\nStrecke es vom Zentrum $Z(0\\mid0)$ aus mit dem Streckungsfaktor $k=2$. Tippe die fünf **Bildpunkte** an.',
    answer: { ...graph({ view: { xmin: 0, xmax: 10, ymin: 0, ymax: 10, snapX: 0.5, snapY: 0.5 }, lines: [] }), mode: 'points', count: 5, points: penta2, tolerance: 0.01, polygons: [penta], given: [[0, 0, 'Z']], connect: true },
    solution: 'Beim Zentrum $Z(0\\mid0)$ gilt einfach: alle Koordinaten verdoppeln.\n\n$A\'(2\\mid2)$, $B\'(6\\mid2)$, $C\'(6\\mid6)$, $D\'(4\\mid9)$, $E\'(2\\mid6)$',
    hint: 'Ist das Zentrum der Ursprung, multiplizierst du beide Koordinaten mit $k$.',
  };
  const t80 = (g, h, k) => {
    const A0 = (g * h) / 2;
    const A1 = A0 * k * k;
    return {
      prompt: `Ein Dreieck mit der Grundseite $g=${dt(g)}\\ \\text{cm}$ und der Höhe $h=${dt(h)}\\ \\text{cm}$ wird mit dem Streckungsfaktor $k=${dt(k)}$ ${k < 1 ? 'verkleinert' : 'vergrößert'}.\n\nBerechne den Flächeninhalt des Bilddreiecks.`,
      answer: fields(val(A1, 'Flächeninhalt:', 'cm²')),
      solution: `**Weg 1:** Bilddreieck: $g'=k\\cdot g=${f2(k * g)}\\ \\text{cm}$, $h'=k\\cdot h=${f2(k * h)}\\ \\text{cm}$\n\n$A'=\\frac{g'\\cdot h'}{2}=\\frac{${f2(k * g)}\\cdot${f2(k * h)}}{2}=${f2(A1)}\\ \\text{cm}^2$\n\n**Weg 2:** Die Fläche ändert sich mit $k^2$: $A=\\frac{${dt(g)}\\cdot${dt(h)}}{2}=${f2(A0)}\\ \\text{cm}^2$, $A'=${f2(A0)}\\cdot${dt(k)}^2=${f2(A1)}\\ \\text{cm}^2$`,
      hint: 'Längen werden mit $k$ gestreckt, Flächen mit $k^2$.',
    };
  };
  const t80vars = [t80(12, 7, 0.5), ...distinct((r) => t80(r.pick([6, 8, 10, 12, 16]), r.pick([3, 5, 6, 7, 9]), r.pick([0.5, 2, 3, 1.5, 0.25])), 3, 91)];

  // ======================================================================== Strahlensätze
  const fig81 = (() => {
    const Z = [30, 105];
    const dU = [1, -0.3], dL = [1, 0.45];
    const pt = (d, x) => [Z[0] + x, Z[1] + d[1] * x];
    const B = pt(dU, 95), Bp = pt(dU, 250), A = pt(dL, 95), Ap = pt(dL, 250);
    let body = draw.ln(Z[0], Z[1], Bp[0] + 20, Bp[1] - 6) + draw.ln(Z[0], Z[1], Ap[0] + 20, Ap[1] + 9);
    body += draw.ln(B[0], B[1], A[0], A[1], "stroke='#4f46e5'") + draw.ln(Bp[0], Bp[1], Ap[0], Ap[1], "stroke='#4f46e5'");
    const lb = (p, t, dx, dy) => draw.tx(p[0] + dx, p[1] + dy, t, 'middle', "font-size='15' font-weight='700'");
    body += draw.dot(Z[0], Z[1]) + lb(Z, 'Z', -12, 5) + lb(B, 'B', 0, -9) + lb(Bp, "B'", 0, -9) + lb(A, 'A', 0, 20) + lb(Ap, "A'", 0, 20);
    body += draw.tx(300, 30, "AB ∥ A'B'", 'middle', "font-size='13' fill='#4f46e5' font-weight='600'");
    return draw.svg('streck-81', 340, 250, body);
  })();
  const ov = (s) => `\\overline{${s}}`;
  const t81 = {
    prompt: `Welche Gleichungen passen zur Zeichnung? ($\\overline{AB}\\parallel\\overline{A'B'}$)\n\n![Strahlensatz-Figur](${fig81})\n\nKreuze alle richtigen an.`,
    answer: {
      type: 'choice', multiple: true,
      options: [
        { text: `$\\dfrac{${ov('ZA')}}{${ov("ZA'")}}=\\dfrac{${ov('AB')}}{${ov("A'B'")}}$`, correct: true },
        { text: `$\\dfrac{${ov('AB')}}{${ov("A'B'")}}=\\dfrac{${ov("ZB'")}}{${ov('ZB')}}$`, correct: false },
        { text: `$\\dfrac{${ov("ZB'")}}{${ov('ZB')}}=\\dfrac{${ov('ZA')}}{${ov("ZA'")}}$`, correct: false },
        { text: `$\\dfrac{${ov('ZB')}}{${ov("ZB'")}}=\\dfrac{${ov('ZA')}}{${ov("ZA'")}}$`, correct: true },
      ],
    },
    solution: 'Bei den Strahlensätzen stehen im Zähler und Nenner jeweils die Strecken **vom Zentrum $Z$ aus** bzw. die parallelen Strecken, und zwar immer in derselben Reihenfolge (klein zu groß oder groß zu klein).\n\n- ✓ $\\frac{ZA}{ZA\'}=\\frac{AB}{A\'B\'}$ (2. Strahlensatz)\n- ✗ $\\frac{AB}{A\'B\'}=\\frac{ZB\'}{ZB}$: links klein zu groß, rechts groß zu klein\n- ✗ $\\frac{ZB\'}{ZB}=\\frac{ZA}{ZA\'}$: gleicher Fehler\n- ✓ $\\frac{ZB}{ZB\'}=\\frac{ZA}{ZA\'}$ (1. Strahlensatz)',
    hint: 'Prüfe bei jeder Gleichung: Steht links wie rechts der kleine Wert oben (oder beide Male der große)?',
  };

  const ladderFig = (AB, BD, BC) => draw.svg(`leiter-${AB}-${BD}-${BC}`, 340, 220, (() => {
    const A = [20, 180], D = [310, 180];
    const B = [A[0] + (AB / (AB + BD)) * 290, 180];
    const Cy = 180 - (BC / ((BC * (AB + BD)) / AB)) * 150;
    const C = [B[0], Cy], E = [D[0], 30];
    return draw.ln(A[0], 180, D[0], 180) + draw.ln(A[0], 180, E[0], E[1]) + draw.ln(B[0], 180, C[0], C[1], "stroke='#4f46e5'") + draw.ln(D[0], 180, E[0], E[1] + 4, "stroke='#4f46e5'")
      + [['A', A, -10, 20], ['B', B, 0, 20], ['D', D, 8, 20], ['C', C, -12, -4], ['E', E, 12, 2]].map(([t, p, dx, dy]) => draw.tx(p[0] + dx, p[1] + dy, t, 'middle', "font-size='15' font-weight='700'")).join('')
      + draw.ra(B[0], 180, [-1, 0], [0, -1], 11) + draw.ra(D[0], 180, [-1, 0], [0, -1], 11);
  })());
  const t82 = (AB, BD, BC) => {
    const AD = round(AB + BD, 2);
    const DE = round((BC * AD) / AB, 4);
    return {
      prompt: `Berechne, bis zu welcher Höhe die Leiter reicht ($\\overline{DE}$), wenn die Längen $\\overline{BD}=${dt(BD)}\\ \\text{m}$, $\\overline{AD}=${dt(AD)}\\ \\text{m}$ und $\\overline{BC}=${dt(BC)}\\ \\text{m}$ gegeben sind.\n\n![Leiter](${ladderFig(AB, BD, BC)})\n\n${NOTE}`,
      answer: fields(val(DE, 'Höhe:', 'm')),
      solution: `$BC\\parallel DE$ (beide stehen senkrecht auf dem Boden), $A$ ist das Strahlenzentrum.\n\n$\\overline{AB}=\\overline{AD}-\\overline{BD}=${dt(AD)}-${dt(BD)}=${dt(AB)}\\ \\text{m}$\n\n2. Strahlensatz: $\\dfrac{\\overline{BC}}{\\overline{DE}}=\\dfrac{\\overline{AB}}{\\overline{AD}} \\Rightarrow \\overline{DE}=\\overline{BC}\\cdot\\dfrac{\\overline{AD}}{\\overline{AB}}=${dt(BC)}\\cdot\\dfrac{${dt(AD)}}{${dt(AB)}}=${f2(DE)}\\ \\text{m}$`,
      hint: 'Berechne zuerst $\\overline{AB}=\\overline{AD}-\\overline{BD}$. Dann den Strahlensatz mit den Strecken $\\overline{BC}$, $\\overline{DE}$, $\\overline{AB}$, $\\overline{AD}$.',
    };
  };
  const t82vars = [t82(4.8, 8.4, 2), ...distinct((r) => t82(r.pick([3, 4, 5, 6]), r.pick([6, 7.2, 8, 9]), r.pick([1.5, 2, 2.5, 3])), 3, 92)];

  const url83a = rayFig('strahl-83a', { r: 15 / 27, base: ['15 m', '12 m'], ray: null, par: ['x', '9 m'] });
  const t83a = {
    prompt: `Berechne die fehlende Streckenlänge $x$ in der Abbildung. Die beiden Streckenabschnitte $x$ und $9\\ \\text{m}$ sind parallel.\n\n![Strahlensatz](${url83a})\n\n${NOTE}`,
    answer: fields(val(5, 'x =', 'm')),
    solution: 'Die Strecken auf der Grundlinie vom Zentrum aus: $15\\ \\text{m}$ und $15+12=27\\ \\text{m}$.\n\n$$\\frac{x}{9}=\\frac{15}{27} \\Rightarrow x=9\\cdot\\frac{15}{27}=5\\ \\text{m}$$',
    hint: 'Beachte: Der äußere Abschnitt auf der Grundlinie ist $15+12$, nicht nur $12$.',
  };
  const url83b = rayFig('strahl-83b', { r: 6 / 9, base: ['6 m', 'x'], ray: ['8,4 m', 'y'], par: ['4,8 m', '7,2 m'] });
  const t83b = {
    prompt: `Berechne die fehlenden Streckenlängen $x$ und $y$ in der Abbildung. Die Strecken $4{,}8\\ \\text{m}$ und $7{,}2\\ \\text{m}$ sind parallel.\n\n![Strahlensatz](${url83b})\n\n${NOTE}`,
    answer: fields(val(3, 'x =', 'm'), val(4.2, 'y =', 'm')),
    solution: '2. Strahlensatz: $\\dfrac{6}{6+x}=\\dfrac{4{,}8}{7{,}2} \\Rightarrow 6+x=\\dfrac{6\\cdot7{,}2}{4{,}8}=9 \\Rightarrow x=3\\ \\text{m}$\n\n$\\dfrac{8{,}4}{8{,}4+y}=\\dfrac{4{,}8}{7{,}2} \\Rightarrow 8{,}4+y=12{,}6 \\Rightarrow y=4{,}2\\ \\text{m}$',
    hint: 'Das Verhältnis der parallelen Strecken ist $4{,}8:7{,}2=2:3$. Genauso verhalten sich die Strecken vom Zentrum aus.',
  };
  const tEx = {
    prompt: `Berechne die Längen der Strecken $\\overline{BB'}$ und $\\overline{A'B'}$.\n\nGegeben: $\\overline{ZA}=6\\ \\text{cm}$, $\\overline{ZA'}=9\\ \\text{cm}$, $\\overline{ZB}=4\\ \\text{cm}$, $\\overline{AB}=3\\ \\text{cm}$, $g\\parallel h$.\n\n![Strahlensatz-Figur](${fig81})\n\n${NOTE}`,
    answer: fields(val(2, "BB' =", 'cm'), val(4.5, "A'B' =", 'cm')),
    solution: `**$\\overline{BB'}$:** 1. Strahlensatz $\\dfrac{ZA}{ZA'}=\\dfrac{ZB}{ZB'} \\Rightarrow \\dfrac{6}{9}=\\dfrac{4}{ZB'} \\Rightarrow ZB'=6\\ \\text{cm}$, also $BB'=6-4=2\\ \\text{cm}$.\n\n**$\\overline{A'B'}$:** 2. Strahlensatz $\\dfrac{AB}{A'B'}=\\dfrac{ZA}{ZA'} \\Rightarrow \\dfrac{3}{A'B'}=\\dfrac{6}{9} \\Rightarrow A'B'=4{,}5\\ \\text{cm}$`,
    hint: 'Für $\\overline{BB\'}$ brauchst du erst $\\overline{ZB\'}$ (1. Strahlensatz). Für $\\overline{A\'B\'}$ den 2. Strahlensatz.',
  };

  // ======================================================================== Trigonometrie rechtwinklig
    const exSinCos = (c, alpha) => {
    const a = c * sin(alpha);
    const b = c * cos(alpha);
    const P = [[24, 190], [290, 190], [24 + 266 * cos(alpha) ** 2, 190 - 266 * cos(alpha) * sin(alpha)]];
    const url = triFig(`trig-ex1-${c}-${alpha}`, P, { sides: { a: 'a', b: 'b', c: `c = ${dt(c)} cm` }, angles: { A: `${alpha}°` }, right: 'C' });
    return {
      prompt: `Berechne die Längen der Seiten $a$ und $b$ im rechtwinkligen Dreieck $ABC$ ($\\gamma=90^\\circ$) mit $c=${dt(c)}\\ \\text{cm}$ und $\\alpha=${alpha}^\\circ$. Runde auf zwei Nachkommastellen.\n\n![Dreieck](${url})\n\n${NOTE}`,
      answer: fields(val(a, 'a =', 'cm'), val(b, 'b =', 'cm')),
      solution: `$c$ ist die Hypotenuse, $a$ die Gegenkathete und $b$ die Ankathete von $\\alpha$.\n\n$\\sin\\alpha=\\frac{a}{c} \\Rightarrow a=c\\cdot\\sin\\alpha=${dt(c)}\\cdot\\sin ${alpha}^\\circ=${f2(a)}\\ \\text{cm}$\n\n$\\cos\\alpha=\\frac{b}{c} \\Rightarrow b=c\\cdot\\cos\\alpha=${dt(c)}\\cdot\\cos ${alpha}^\\circ=${f2(b)}\\ \\text{cm}$\n\n(Probe mit Pythagoras: $a^2+b^2=c^2$)`,
      hint: 'Dein Taschenrechner muss im **DEG**-Modus sein. Gegenkathete: Sinus. Ankathete: Kosinus.',
    };
  };
  const ex1vars = [exSinCos(8, 30), ...distinct((r) => exSinCos(r.pick([6, 7, 9, 10, 12, 15]), r.pick([25, 35, 40, 50, 55, 60])), 3, 93)];

  const exTan = (a, c) => {
    const al = deg(Math.atan(a / c));
    const ga = 90 - al;
    const P = [[30, 195], [150, 195], [150, 195 - 120 * (a / c)]];
    const url = triFig(`trig-ex2-${a}-${c}`, P, { sides: { a: `a = ${dt(a)} cm`, c: `c = ${dt(c)} cm` }, angles: { A: 'α', C: 'γ' }, right: 'B' });
    return {
      prompt: `Berechne, wie groß die Winkel $\\alpha$ und $\\gamma$ sind. Das Dreieck ist bei $B$ rechtwinklig; $a=${dt(a)}\\ \\text{cm}$ und $c=${dt(c)}\\ \\text{cm}$ sind die Katheten.\n\n![Dreieck](${url})\n\n${NOTE}`,
      answer: fields(angle(al, 'α ='), angle(ga, 'γ =')),
      solution: `$a$ ist die Gegenkathete von $\\alpha$, $c$ die Ankathete von $\\alpha$ → **Tangens**:\n\n$\\tan\\alpha=\\frac{a}{c}=\\frac{${dt(a)}}{${dt(c)}}=${de(a / c, 4)} \\Rightarrow \\alpha\\approx${f1(al)}^\\circ$\n\nWinkelsumme: $\\gamma=90^\\circ-\\alpha\\approx${f1(ga)}^\\circ$ (oder $\\tan\\gamma=\\frac{c}{a}$)`,
      hint: 'Mit der Umkehrtaste $\\tan^{-1}$ (meist **SHIFT** + **TAN**) bestimmst du den Winkel.',
    };
  };
  const ex2vars = [exTan(3.5, 2.1), ...distinct((r) => exTan(r.pick([2.5, 3, 4, 4.5, 5]), r.pick([1.5, 2, 2.4, 3, 3.6])), 3, 94)];

  const a90a = Math.sqrt(4.8 ** 2 - 4.1 ** 2);
  const al90a = deg(Math.acos(4.1 / 4.8));
  const url90a = triFig('trig-90a', rightAtC(4.1, al90a, 50), { sides: { b: 'b = 4,1 cm', c: 'c = 4,8 cm', a: 'a' }, angles: { A: 'α', B: 'β' }, right: 'C' });
  const t90a = {
    prompt: `Berechne die fehlende Seite und die Winkel des Dreiecks. Es ist bei $C$ rechtwinklig; $b=4{,}1\\ \\text{cm}$ und $c=4{,}8\\ \\text{cm}$.\n\n![Dreieck](${url90a})\n\n${NOTE}`,
    answer: fields(val(a90a, 'a =', 'cm'), angle(al90a, 'α ='), angle(90 - al90a, 'β =')),
    solution: `$c$ ist die Hypotenuse.\n\n$a=\\sqrt{c^2-b^2}=\\sqrt{4{,}8^2-4{,}1^2}=\\sqrt{${f2(4.8 ** 2 - 4.1 ** 2)}}\\approx${f2(a90a)}\\ \\text{cm}$\n\n$\\cos\\alpha=\\frac{b}{c}=\\frac{4{,}1}{4{,}8}=${de(4.1 / 4.8, 4)} \\Rightarrow \\alpha\\approx${f1(al90a)}^\\circ$\n\n$\\beta=90^\\circ-\\alpha\\approx${f1(90 - al90a)}^\\circ$`,
    hint: 'Die fehlende Seite findest du mit dem Satz des Pythagoras, den Winkel $\\alpha$ mit dem Kosinus ($b$ ist die Ankathete).',
  };
  const b90 = 18.5 / sin(70);
  const a90 = 18.5 / tan(70);
  const P90b = [[24, 190], [270, 190], [270, 190 - 246 * tan(20)]];
  const url90b = triFig('trig-90b', P90b, { sides: { c: 'c = 18,5 m', a: 'a', b: 'b' }, angles: { A: 'α', C: 'γ = 70°' }, right: 'B' });
  const t90b = {
    prompt: `Berechne die fehlenden Seiten und den fehlenden Winkel. Das Dreieck ist bei $B$ rechtwinklig; $c=18{,}5\\ \\text{m}$ und $\\gamma=70^\\circ$.\n\n![Dreieck](${url90b})\n\n${NOTE}`,
    answer: fields(angle(20, 'α ='), val(a90, 'a =', 'm'), val(b90, 'b =', 'm')),
    solution: `$\\alpha=90^\\circ-70^\\circ=20^\\circ$\n\n$c$ ist die Gegenkathete von $\\gamma$, $a$ die Ankathete, $b$ die Hypotenuse.\n\n$\\tan\\gamma=\\frac{c}{a} \\Rightarrow a=\\frac{c}{\\tan 70^\\circ}=\\frac{18{,}5}{\\tan 70^\\circ}\\approx${f2(a90)}\\ \\text{m}$\n\n$\\sin\\gamma=\\frac{c}{b} \\Rightarrow b=\\frac{c}{\\sin 70^\\circ}\\approx${f2(b90)}\\ \\text{m}$`,
    hint: 'Hier liegt der rechte Winkel bei $B$. Die Hypotenuse ist also $b$.',
  };

  const t91 = [
    {
      prompt: 'Berechne die fehlenden Werte des rechtwinkligen Dreiecks ($\\gamma=90^\\circ$).\n\n| Hypotenuse | Kathete 1 | Kathete 2 | Winkel $\\alpha$ | Winkel $\\beta$ | Winkel $\\gamma$ |\n|---|---|---|---|---|---|\n| $c=5{,}0\\ \\text{cm}$ | $a=4{,}0\\ \\text{cm}$ | ? | ? | ? | ? |',
      answer: fields(val(3, 'b =', 'cm'), angle(deg(Math.asin(4 / 5)), 'α ='), angle(deg(Math.acos(4 / 5)), 'β ='), angle(90, 'γ =')),
      solution: `$b=\\sqrt{c^2-a^2}=\\sqrt{25-16}=3\\ \\text{cm}$\n\n$\\sin\\alpha=\\frac{a}{c}=0{,}8 \\Rightarrow \\alpha\\approx${f1(deg(Math.asin(0.8)))}^\\circ$\n\n$\\beta=90^\\circ-\\alpha\\approx${f1(deg(Math.acos(0.8)))}^\\circ$, $\\gamma=90^\\circ$`,
      hint: 'Pythagoras für die fehlende Kathete, Sinus für $\\alpha$, Winkelsumme für $\\beta$.',
    },
    {
      prompt: 'Berechne die fehlenden Werte des rechtwinkligen Dreiecks. Der rechte Winkel liegt bei $A$ (die Hypotenuse ist $a$).\n\n| Hypotenuse | Kathete 1 | Kathete 2 | Winkel $\\alpha$ | Winkel $\\beta$ | Winkel $\\gamma$ |\n|---|---|---|---|---|---|\n| ? | $c=5{,}5\\ \\text{cm}$ | $b=3{,}6\\ \\text{cm}$ | $90^\\circ$ | ? | ? |',
      answer: fields(val(Math.hypot(5.5, 3.6), 'a =', 'cm'), angle(deg(Math.atan(3.6 / 5.5)), 'β ='), angle(90 - deg(Math.atan(3.6 / 5.5)), 'γ =')),
      solution: `$a=\\sqrt{c^2+b^2}=\\sqrt{5{,}5^2+3{,}6^2}=\\sqrt{43{,}21}\\approx${f2(Math.hypot(5.5, 3.6))}\\ \\text{cm}$\n\n$\\tan\\beta=\\frac{b}{c}=\\frac{3{,}6}{5{,}5} \\Rightarrow \\beta\\approx${f1(deg(Math.atan(3.6 / 5.5)))}^\\circ$\n\n$\\gamma=90^\\circ-\\beta\\approx${f1(90 - deg(Math.atan(3.6 / 5.5)))}^\\circ$`,
      hint: 'Die beiden Katheten sind gegeben: Pythagoras liefert die Hypotenuse, der Tangens den Winkel.',
    },
    {
      prompt: 'Berechne die fehlenden Werte des rechtwinkligen Dreiecks ($\\gamma=90^\\circ$).\n\n| Hypotenuse | Kathete 1 | Kathete 2 | Winkel $\\alpha$ | Winkel $\\beta$ | Winkel $\\gamma$ |\n|---|---|---|---|---|---|\n| ? | ? | $b=3{,}5\\ \\text{cm}$ | $\\alpha=44^\\circ$ | ? | $\\gamma=90^\\circ$ |',
      answer: fields(val(3.5 / cos(44), 'c =', 'cm'), val(3.5 * tan(44), 'a =', 'cm'), angle(46, 'β =')),
      solution: `$\\beta=90^\\circ-44^\\circ=46^\\circ$\n\n$b$ ist die Ankathete von $\\alpha$: $\\cos\\alpha=\\frac{b}{c} \\Rightarrow c=\\frac{3{,}5}{\\cos 44^\\circ}\\approx${f2(3.5 / cos(44))}\\ \\text{cm}$\n\n$\\tan\\alpha=\\frac{a}{b} \\Rightarrow a=3{,}5\\cdot\\tan 44^\\circ\\approx${f2(3.5 * tan(44))}\\ \\text{cm}$`,
      hint: '$b$ liegt am Winkel $\\alpha$ an (Ankathete). Welche Winkelfunktion verbindet Ankathete und Hypotenuse?',
    },
  ];

  const t92 = (s, h) => {
    const ratio = h / s;
    return {
      prompt: `Berechne das Verhältnis $\\frac{h}{s}$ und gib die Straßensteigung in Prozent an. Bestimme außerdem, wie groß der zugehörige Steigungswinkel $\\alpha$ ist.\n\n$s=${dt(s)}\\ \\text{m}$ (waagerechte Strecke), $h=${dt(h)}\\ \\text{m}$ (Höhenunterschied)\n\n*Beispiel: $\\frac{h}{s}=0{,}226 \\Rightarrow$ Steigung $22{,}6\\,\\%$*`,
      answer: fields(approx(round(ratio, 6), { label: 'h : s =', tol: 0.0006 }), approx(round(ratio * 100, 6), { label: 'Steigung:', unit: '%', tol: 0.06 }), angle(deg(Math.atan(ratio)), 'α =')),
      solution: `$\\frac{h}{s}=\\frac{${dt(h)}}{${dt(s)}}=${de(ratio, 4)}$ → Steigung $${de(ratio * 100, 2)}\\,\\%$\n\n$\\tan\\alpha=\\frac{h}{s}=${de(ratio, 4)} \\Rightarrow \\alpha\\approx${f1(deg(Math.atan(ratio)))}^\\circ$`,
      hint: 'Die Steigung in Prozent ist das Verhältnis $h:s$ mal 100. Der Winkel folgt aus $\\tan^{-1}$.',
    };
  };
  const t92vars = [t92(120, 30), t92(280, 42), ...distinct((r) => t92(r.pick([100, 150, 200, 250, 400]), r.pick([8, 12, 20, 25, 30, 45])), 2, 95)];

  const t93 = (km, al) => {
    const h = km * 1000 * sin(al);
    return {
      prompt: `Wie viele Höhenmeter muss ein Wanderer bis zum Gipfel zurücklegen, wenn die Wegstrecke ${dt(km, 0)} km lang ist und der durchschnittliche Steigungswinkel ${al}° beträgt?`,
      answer: fields(val(h, 'Höhenunterschied:', 'm')),
      solution: `Die Wegstrecke ($${dt(km, 0)}\\ \\text{km}=${dt(km * 1000, 0)}\\ \\text{m}$) ist die Hypotenuse, die Höhe die Gegenkathete des Winkels $${al}^\\circ$:\n\n$\\sin\\alpha=\\frac{h}{s} \\Rightarrow h=s\\cdot\\sin\\alpha=${dt(km * 1000, 0)}\\cdot\\sin ${al}^\\circ\\approx${f1(h)}\\ \\text{m}$`,
      hint: 'Skizziere ein rechtwinkliges Dreieck: Welche Seite ist gegeben (Hypotenuse), welche gesucht (Gegenkathete)?',
    };
  };
  const t93vars = [t93(4, 8), ...distinct((r) => t93(r.pick([2, 3, 5, 6]), r.pick([5, 6, 10, 12])), 3, 96)];
  const t94 = (d, al) => {
    const h = d * tan(al);
    const P = [[30, 190], [300, 190], [30, 190 - 270 * tan(al)]];
    const url = triFig(`turm-${d}-${al}`, P, { sides: { c: `${dt(d, 0)} m` }, angles: { B: `${al}°` }, right: 'A', names: ['Turmfuß', 'Standort', 'Turmspitze'], w: 380 });
    return {
      prompt: `Von einem Standort, der ${dt(d, 0)} m vom Fuß eines Turms entfernt ist, sieht man die Turmspitze unter einem Winkel von ${al}°.\n\nBerechne die Höhe des Turms.\n\n![Turm](${url})\n\n${NOTE}`,
      answer: fields(val(h, 'Höhe:', 'm')),
      solution: `Die Entfernung ist die Ankathete von $${al}^\\circ$, die Turmhöhe die Gegenkathete → **Tangens**:\n\n$h=${dt(d, 0)}\\cdot\\tan ${al}^\\circ\\approx${f1(h)}\\ \\text{m}$`,
      hint: 'Gegenkathete und Ankathete: Das ist der Tangens.',
    };
  };
  const t94vars = [t94(50, 20), ...distinct((r) => t94(r.pick([30, 40, 60, 80, 100]), r.pick([15, 25, 30, 35, 40])), 3, 97)];
  const lad = 25 / sin(15);
  const urlLad = draw.svg('stehleiter', 300, 240, draw.ln(150, 20, 60, 210) + draw.ln(150, 20, 240, 210) + draw.ln(60, 210, 240, 210, draw.dashed) + draw.tx(150, 233, '50 cm') + draw.tx(150, 62, '30°', 'middle', "font-size='14' font-weight='700' fill='#b45309'"));
  const t95 = {
    prompt: `Eine Stehleiter ist aufgeklappt. Oben bilden die beiden Leiterteile einen Winkel von $30^\\circ$, unten stehen sie $50\\ \\text{cm}$ auseinander. Beide Teile sind gleich lang.\n\nBerechne die Länge eines Leiterteils.\n\n![Stehleiter](${urlLad})`,
    answer: fields(val(lad, 'Länge:', 'cm')),
    solution: `Die Leiter bildet ein gleichschenkliges Dreieck. Die Höhe halbiert es in zwei rechtwinklige Dreiecke mit Winkel $15^\\circ$ oben und der Gegenkathete $25\\ \\text{cm}$:\n\n$\\sin 15^\\circ=\\frac{25}{l} \\Rightarrow l=\\frac{25}{\\sin 15^\\circ}\\approx${f1(lad)}\\ \\text{cm}$`,
    hint: 'Halbiere das gleichschenklige Dreieck: Dann hast du ein rechtwinkliges Dreieck mit $15^\\circ$ und $25\\ \\text{cm}$.',
  };
  const H96 = Math.sqrt(8.4 ** 2 - 3.5 ** 2);
  const s96 = 7 * (4.8 / 8.4);
  const w96 = H96 - H96 * (4.8 / 8.4);
  const url96 = draw.svg('haus96', 320, 250, (() => {
    const A = [20, 220], B = [300, 220], T = [160, 20];
    const k = 0.5714; // 4,8 / 8,4
    const yR = T[1] + (A[1] - T[1]) * k;
    const xl = T[0] + (A[0] - T[0]) * k, xr = T[0] + (B[0] - T[0]) * k;
    return draw.poly([A, B, T]) + draw.poly([[xl, yR], [xr, yR], [xr, 220], [xl, 220]], '#fef3c7')
      + draw.tx((xl + xr) / 2, yR - 8, 's') + draw.tx(xl + 10, (yR + 220) / 2 + 5, 'w', 'start') + draw.tx(xr - 10, (yR + 220) / 2 + 5, 'w', 'end')
      + draw.tx(78, 105, '4,8 m', 'end', "font-size='13' fill='#4f46e5' font-weight='600'") + draw.tx(48, 185, '3,6 m', 'end', "font-size='13' fill='#4f46e5' font-weight='600'") + draw.tx(160, 242, '7 m');
  })());
  const t96 = {
    prompt: `In ein gleichschenkliges Dreieck (Grundseite $7\\ \\text{m}$) ist ein Rechteck eingepasst. Auf einem Schenkel sind die Teilstücke $4{,}8\\ \\text{m}$ (oben) und $3{,}6\\ \\text{m}$ (unten) markiert.\n\nBestimme die Längen $s$ und $w$.\n\n![Dreieck mit Rechteck](${url96})\n\n${NOTE}`,
    answer: fields(val(s96, 's =', 'm'), val(w96, 'w =', 'm')),
    solution: `Die Schenkel sind $4{,}8+3{,}6=8{,}4\\ \\text{m}$ lang. Das obere kleine Dreieck ist dem ganzen Dreieck ähnlich (Strahlensatz, $Z$ = Spitze).\n\n**$s$:** $\\dfrac{s}{7}=\\dfrac{4{,}8}{8{,}4} \\Rightarrow s=4\\ \\text{m}$\n\n**$w$:** Höhe des ganzen Dreiecks: $H=\\sqrt{8{,}4^2-3{,}5^2}\\approx${f2(H96)}\\ \\text{m}$. Höhe des kleinen Dreiecks: $H\\cdot\\frac{4{,}8}{8{,}4}\\approx${f2(H96 * 4.8 / 8.4)}\\ \\text{m}$.\n\n$w=${f2(H96)}-${f2(H96 * 4.8 / 8.4)}\\approx${f2(w96)}\\ \\text{m}$`,
    hint: 'Strahlensatz mit der Spitze als Zentrum für $s$. Für $w$ brauchst du die Höhe des Dreiecks (Pythagoras im halben Dreieck).',
  };

  // Sinus-/Kosinussatz (E-Kurs)
  const cosEx = (b, c, al) => {
    const a = Math.sqrt(b * b + c * c - 2 * b * c * cos(al));
    const be = deg(Math.asin((b / a) * sin(al)));
    const ga = 180 - al - be;
    const P = [[20, 170], [320, 170], [20 + b * 30 * cos(al), 170 - b * 30 * sin(al)]];
    const url = triFig(`kos-${b}-${c}-${al}`, P, { sides: { b: `b = ${dt(b, 0)} cm`, c: `c = ${dt(c, 0)} cm` }, angles: { A: `α = ${al}°`, B: 'β', C: 'γ' }, w: 360, h: 210 });
    return {
      prompt: `Berechne die Länge der Seite $a$ sowie die Größe der Winkel $\\beta$ und $\\gamma$.\n\n![Dreieck](${url})\n\n${NOTE}`,
      answer: fields(val(a, 'a =', 'cm'), angle(be, 'β ='), angle(ga, 'γ =')),
      solution: `**Seite $a$ (Kosinussatz):** $a^2=b^2+c^2-2bc\\cdot\\cos\\alpha=${dt(b, 0)}^2+${dt(c, 0)}^2-2\\cdot${dt(b, 0)}\\cdot${dt(c, 0)}\\cdot\\cos ${al}^\\circ\\approx${f2(a * a)} \\Rightarrow a\\approx${f2(a)}\\ \\text{cm}$\n\n**Winkel $\\beta$ (Sinussatz):** $\\sin\\beta=\\frac{b}{a}\\cdot\\sin\\alpha\\approx${de((b / a) * sin(al), 4)} \\Rightarrow \\beta\\approx${f1(be)}^\\circ$\n\n**Winkel $\\gamma$:** $180^\\circ-${al}^\\circ-${f1(be)}^\\circ=${f1(ga)}^\\circ$`,
      hint: 'Zwei Seiten und der eingeschlossene Winkel sind bekannt → zuerst der Kosinussatz.',
    };
  };
  const cosVars = [cosEx(6, 10, 40), ...distinct((r) => cosEx(r.pick([5, 6, 7, 8]), r.pick([9, 10, 11, 12]), r.pick([35, 40, 45, 50, 55])), 2, 98)];
  const al97 = deg(Math.asin((15 * sin(50)) / 28));
  const be97 = 180 - 50 - al97;
  const b97 = (28 * sin(be97)) / sin(50);
  const hc97 = 15 * sin(be97);
  const A97 = (28 * hc97) / 2;
  const url97 = triFig('sin97', [[20, 170], [244, 170], [244 + 120 * cos(180 - be97), 170 - 120 * sin(180 - be97)]], { sides: { a: 'a = 15 cm', c: 'c = 28 cm', b: 'b' }, angles: { A: 'α', B: 'β', C: 'γ = 50°' }, w: 340, h: 210 });
  const t97 = [
    {
      prompt: `Gegeben ist ein Dreieck $ABC$ mit $a=15\\ \\text{cm}$, $c=28\\ \\text{cm}$ und $\\gamma=50^\\circ$.\n\n![Dreieck](${url97})\n\n${NOTE}\n\na) Berechne die Größe der Winkel $\\alpha$ und $\\beta$.\n\nb) Berechne die Länge der Seite $b$.`,
      answer: fields(angle(al97, 'α ='), angle(be97, 'β ='), val(b97, 'b =', 'cm')),
      solution: `a) Sinussatz: $\\dfrac{\\sin\\alpha}{a}=\\dfrac{\\sin\\gamma}{c} \\Rightarrow \\sin\\alpha=\\dfrac{15\\cdot\\sin 50^\\circ}{28}\\approx${de((15 * sin(50)) / 28, 4)} \\Rightarrow \\alpha\\approx${f1(al97)}^\\circ$\n\n$\\beta=180^\\circ-50^\\circ-${f1(al97)}^\\circ=${f1(be97)}^\\circ$\n\nb) $\\dfrac{b}{\\sin\\beta}=\\dfrac{c}{\\sin\\gamma} \\Rightarrow b=\\dfrac{28\\cdot\\sin ${f1(be97)}^\\circ}{\\sin 50^\\circ}\\approx${f1(b97)}\\ \\text{cm}$`,
      hint: 'Sinussatz: Seite durch Sinus des gegenüberliegenden Winkels ist immer gleich.',
    },
    {
      prompt: `Im Dreieck $ABC$ gilt $a=15\\ \\text{cm}$, $c=28\\ \\text{cm}$, $\\beta\\approx${f1(be97)}^\\circ$.\n\nc) Bestimme die Höhe $h_c$.\n\nd) Berechne den Flächeninhalt $A$ des Dreiecks $ABC$.`,
      answer: fields(val(hc97, 'hc =', 'cm'), val(A97, 'A =', 'cm²')),
      solution: `c) Im rechtwinkligen Teildreieck mit der Seite $a$ als Hypotenuse: $h_c=a\\cdot\\sin\\beta=15\\cdot\\sin ${f1(be97)}^\\circ\\approx${f2(hc97)}\\ \\text{cm}$\n\nd) $A=\\dfrac{c\\cdot h_c}{2}=\\dfrac{28\\cdot${f2(hc97)}}{2}\\approx${f1(A97)}\\ \\text{cm}^2$`,
      hint: 'Die Höhe $h_c$ steht senkrecht auf $c$. Mit dem Sinus von $\\beta$ im Teildreieck findest du sie.',
    },
  ];

  // ======================================================================== Pythagoras & Thales
  const exIso = (c, b) => {
    const h = Math.sqrt(b * b - (c / 2) ** 2);
    const A = (c * h) / 2;
    const url = triFig(`iso-${c}-${b}`, [[20, 175], [300, 175], [160, 25]], { sides: { b: `b = ${dt(b, 0)} cm`, c: `c = ${dt(c, 0)} cm` }, w: 320, h: 205, extra: draw.ln(160, 25, 160, 175, `stroke='#4f46e5' ${draw.dashed}`) + draw.ra(160, 175, [-1, 0], [0, -1], 11) });
    return {
      prompt: `Berechne den Flächeninhalt des gleichschenkligen Dreiecks $ABC$ mit der Grundseite $c=${dt(c, 0)}\\ \\text{cm}$ und den Schenkeln $b=${dt(b, 0)}\\ \\text{cm}$.\n\n![Dreieck](${url})\n\n${NOTE}`,
      answer: fields(val(h, 'Höhe h =', 'cm'), val(A, 'Fläche A =', 'cm²')),
      solution: `Die Höhe halbiert die Grundseite. Im rechtwinkligen Teildreieck gilt:\n\n$(\\frac{c}{2})^2+h^2=b^2 \\Rightarrow ${dt(c / 2)}^2+h^2=${dt(b, 0)}^2 \\Rightarrow h^2=${dt(b * b - (c / 2) ** 2)} \\Rightarrow h=${f2(h)}\\ \\text{cm}$\n\n$A=\\dfrac{c\\cdot h}{2}=\\dfrac{${dt(c, 0)}\\cdot${f2(h)}}{2}=${f2(A)}\\ \\text{cm}^2$`,
      hint: 'Teile das Dreieck mit der Höhe in zwei rechtwinklige Dreiecke. Die zweite (negative) Lösung beim Wurzelziehen entfällt.',
    };
  };
  const exIsoVars = [exIso(16, 10), exIso(10, 13), exIso(24, 13), exIso(12, 10)];
  const quader = (a, b, c) => {
    const e = Math.sqrt(a * a + b * b);
    const g = Math.sqrt(a * a + b * b + c * c);
    return {
      prompt: `Ein Quader hat die Maße $a=${dt(a, 0)}\\ \\text{cm}$, $b=${dt(b, 0)}\\ \\text{cm}$ und $c=${dt(c, 0)}\\ \\text{cm}$ (Grundfläche $ABCD$, Höhe $\\overline{CG}=c$).\n\na) Bestimme die Länge der **Flächendiagonalen** $\\overline{AC}$.\n\nb) Bestimme die Länge der **Raumdiagonalen** $\\overline{AG}$.`,
      answer: fields(val(e, 'a) AC =', 'cm'), val(g, 'b) AG =', 'cm')),
      solution: `a) Rechtwinkliges Dreieck $ABC$: $\\overline{AC}=\\sqrt{a^2+b^2}=\\sqrt{${dt(a, 0)}^2+${dt(b, 0)}^2}=\\sqrt{${dt(a * a + b * b, 0)}}\\approx${f2(e)}\\ \\text{cm}$\n\nb) Rechtwinkliges Dreieck $ACG$ (rechter Winkel bei $C$): $\\overline{AG}=\\sqrt{\\overline{AC}^2+c^2}=\\sqrt{${dt(a * a + b * b, 0)}+${dt(c * c, 0)}}=\\sqrt{${dt(a * a + b * b + c * c, 0)}}\\approx${f2(g)}\\ \\text{cm}$`,
      hint: 'Pythagoras zweimal: erst in der Grundfläche, dann im Dreieck $ACG$.',
    };
  };
  const quaderVars = [quader(5, 4, 3), ...distinct((r) => quader(r.pick([3, 4, 5, 6, 8]), r.pick([4, 5, 6, 12]), r.pick([2, 3, 5, 7])), 3, 99)];
  const t85a = {
    prompt: 'Von einem Dreieck sind die Eckpunkte $A(2\\mid2)$, $B(6\\mid-2)$ und $C(6\\mid2)$ gegeben.\n\na) Zeichne das Dreieck in ein Koordinatensystem: Tippe die drei Eckpunkte an.',
    answer: { ...graph({ view: { xmin: -1, xmax: 8, ymin: -3, ymax: 4, snapX: 1, snapY: 1 }, lines: [] }), mode: 'points', count: 3, points: [[2, 2], [6, -2], [6, 2]], tolerance: 0.01, connect: true },
    solution: 'Die Punkte werden eingetragen und verbunden. Das Dreieck hat bei $C(6\\mid2)$ einen rechten Winkel (die Strecke $AC$ ist waagerecht, $BC$ senkrecht).',
    hint: 'Erster Wert: $x$ (nach rechts), zweiter Wert: $y$ (nach oben).',
  };
  const t85b = {
    prompt: 'Von einem Dreieck sind die Eckpunkte $A(2\\mid2)$, $B(6\\mid-2)$ und $C(6\\mid2)$ gegeben.\n\nb) Berechne die Streckenlänge $c=\\overline{AB}$.',
    answer: fields(val(Math.sqrt(32), 'c =', 'LE')),
    solution: 'Die Katheten sind $\\overline{AC}=6-2=4$ und $\\overline{BC}=2-(-2)=4$ (Längeneinheiten). $c$ ist die Hypotenuse:\n\n$c=\\sqrt{4^2+4^2}=\\sqrt{32}\\approx5{,}66$',
    hint: 'Zähle die Kästchen in $x$- und $y$-Richtung und nutze den Satz des Pythagoras.',
  };
  // 86: Umfang und Flächeninhalt
  const hexUrl = draw.svg('sechseck86', 410, 170, (() => {
    const P = [[30, 85], [100, 20], [260, 20], [330, 85], [260, 150], [100, 150]];
    return draw.poly(P) + draw.tx(180, 12, '3 cm') + draw.tx(180, 168, '3 cm') + draw.ln(30, 100, 330, 100, `stroke='#4f46e5' ${draw.dashed}`) + draw.tx(180, 118, '9 cm', 'middle', "font-size='14' fill='#4f46e5'") + draw.tx(352, 90, '3 cm', 'start') + draw.ln(345, 20, 345, 150, `stroke='#64748b'`);
  })());
  const hexSide = Math.hypot(3, 1.5);
  const t86a = {
    prompt: `Berechne den Umfang und den Flächeninhalt des Sechsecks. Es ist symmetrisch: oben und unten je $3\\ \\text{cm}$, größte Breite $9\\ \\text{cm}$ (auf halber Höhe), Gesamthöhe $3\\ \\text{cm}$.\n\n![Sechseck](${hexUrl})\n\n${NOTE}`,
    answer: fields(val(6 + 4 * hexSide, 'Umfang:', 'cm'), val(18, 'Fläche:', 'cm²')),
    solution: `**Flächeninhalt:** Das Sechseck besteht aus zwei Trapezen (Parallelseiten $9\\ \\text{cm}$ und $3\\ \\text{cm}$, Höhe $1{,}5\\ \\text{cm}$): $A=2\\cdot\\frac{9+3}{2}\\cdot1{,}5=18\\ \\text{cm}^2$\n\n**Umfang:** Die schrägen Seiten sind Hypotenusen von Dreiecken mit den Katheten $\\frac{9-3}{2}=3\\ \\text{cm}$ und $1{,}5\\ \\text{cm}$: $s=\\sqrt{3^2+1{,}5^2}\\approx${f2(hexSide)}\\ \\text{cm}$\n\n$u=3+3+4\\cdot${f2(hexSide)}\\approx${f2(6 + 4 * hexSide)}\\ \\text{cm}$`,
    hint: 'Zerlege die Figur in Trapeze/Dreiecke. Die schrägen Seiten berechnest du mit Pythagoras.',
  };
  const trapUrl = draw.svg('trapez86', 340, 160, draw.poly([[20, 20], [320, 20], [220, 130], [70, 130]]) + draw.tx(170, 12, '6 cm') + draw.tx(145, 150, '3 cm') + draw.tx(45, 150, '1 cm') + draw.tx(335, 80, '2 cm', 'start') + draw.ln(20, 20, 70, 130, `stroke='#64748b' ${draw.dashed}`));
  const trapL = Math.hypot(1, 2), trapR = Math.hypot(2, 2);
  const t86b = {
    prompt: `Berechne den Umfang und den Flächeninhalt der Figur (Trapez: oben $6\\ \\text{cm}$, unten $3\\ \\text{cm}$, Höhe $2\\ \\text{cm}$; die untere Seite beginnt $1\\ \\text{cm}$ rechts vom linken oberen Eckpunkt).\n\n![Trapez](${trapUrl})\n\n${NOTE}`,
    answer: fields(val(6 + 3 + trapL + trapR, 'Umfang:', 'cm'), val(9, 'Fläche:', 'cm²')),
    solution: `**Fläche:** $A=\\frac{6+3}{2}\\cdot2=9\\ \\text{cm}^2$\n\n**Seiten:** links $\\sqrt{1^2+2^2}\\approx${f2(trapL)}\\ \\text{cm}$, rechts: Der Überstand rechts ist $6-1-3=2\\ \\text{cm}$, also $\\sqrt{2^2+2^2}\\approx${f2(trapR)}\\ \\text{cm}$\n\n$u=6+3+${f2(trapL)}+${f2(trapR)}\\approx${f2(6 + 3 + trapL + trapR)}\\ \\text{cm}$`,
    hint: 'Die beiden schrägen Seiten sind Hypotenusen kleiner rechtwinkliger Dreiecke.',
  };

  // Thales
  const sets = [
    { s: [6, 8, 10], ok: true }, { s: [5, 12, 14], ok: false }, { s: [9, 12, 15], ok: true }, { s: [7, 8, 10], ok: false },
  ];
  const t87 = {
    prompt: 'Welche Dreiecke sind rechtwinklig? Kreuze an und begründe mit der **Umkehrung des Satzes des Pythagoras** (gilt $a^2+b^2=c^2$ für die längste Seite $c$?).\n\n*(Die Aufgabe im Buch arbeitet mit Zeichnungen; hier sind die Seitenlängen angegeben.)*\n\n- Dreieck 1: $6\\ \\text{cm}$, $8\\ \\text{cm}$, $10\\ \\text{cm}$\n- Dreieck 2: $5\\ \\text{cm}$, $12\\ \\text{cm}$, $14\\ \\text{cm}$\n- Dreieck 3: $9\\ \\text{cm}$, $12\\ \\text{cm}$, $15\\ \\text{cm}$\n- Dreieck 4: $7\\ \\text{cm}$, $8\\ \\text{cm}$, $10\\ \\text{cm}$',
    answer: { type: 'choice', multiple: true, options: sets.map((x, i) => ({ text: `Dreieck ${i + 1}`, correct: x.ok })) },
    solution: '- Dreieck 1: $6^2+8^2=36+64=100=10^2$ ✓ rechtwinklig\n- Dreieck 2: $5^2+12^2=169\\neq14^2=196$ ✗\n- Dreieck 3: $9^2+12^2=81+144=225=15^2$ ✓ rechtwinklig\n- Dreieck 4: $7^2+8^2=113\\neq10^2=100$ ✗',
    hint: 'Quadriere die zwei kürzeren Seiten, addiere sie und vergleiche mit dem Quadrat der längsten Seite.',
  };
  const t88a = {
    prompt: 'Konstruiere ein rechtwinkliges Dreieck mit **Hypotenuse $c=8\\ \\text{cm}$ und Kathete $a=3\\ \\text{cm}$** (Thaleskreis über $c$, Kreis um $B$ mit Radius $3\\ \\text{cm}$). Miss oder berechne die zweite Kathete $b$.',
    answer: fields(approx(round(Math.sqrt(55), 6), { label: 'b =', unit: 'cm', tol: 0.15 })),
    solution: 'Zeichne $c=8\\ \\text{cm}$ und den Halbkreis (Thaleskreis) über $c$. Ein Kreis um $B$ mit Radius $3\\ \\text{cm}$ schneidet den Thaleskreis in $C$.\n\nRechnerische Kontrolle: $b=\\sqrt{c^2-a^2}=\\sqrt{64-9}=\\sqrt{55}\\approx7{,}42\\ \\text{cm}$',
    hint: 'Der Eckpunkt $C$ liegt auf dem Thaleskreis, damit ist der Winkel bei $C$ automatisch $90^\\circ$.',
  };
  const t88b = {
    prompt: 'Konstruiere ein rechtwinkliges Dreieck mit **Hypotenuse $c=5\\ \\text{cm}$ und Winkel $\\alpha=35^\\circ$**. Gib die beiden Katheten an (Messen oder Rechnen).',
    answer: fields(approx(round(5 * sin(35), 6), { label: 'a =', unit: 'cm', tol: 0.15 }), approx(round(5 * cos(35), 6), { label: 'b =', unit: 'cm', tol: 0.15 })),
    solution: 'Zeichne $c=5\\ \\text{cm}$, trage in $A$ den Winkel $35^\\circ$ an. Der Schenkel schneidet den Thaleskreis über $c$ in $C$.\n\n$a=c\\cdot\\sin 35^\\circ\\approx2{,}87\\ \\text{cm}$, $b=c\\cdot\\cos 35^\\circ\\approx4{,}10\\ \\text{cm}$',
    hint: 'Sinus für die Gegenkathete $a$, Kosinus für die Ankathete $b$.',
  };
  const hcP = (6 - Math.sqrt(36 - 4 * 6.25)) / 2;
  const hcQ = 6 - hcP;
  const l1 = Math.hypot(2.5, hcP), l2 = Math.hypot(2.5, hcQ);
  const t88c = {
    prompt: 'Konstruiere **ein** rechtwinkliges Dreieck mit **Hypotenuse $c=6\\ \\text{cm}$ und Höhe $h_c=2{,}5\\ \\text{cm}$** (Parallele zu $c$ im Abstand $2{,}5\\ \\text{cm}$ schneidet den Thaleskreis). Gib die Längen der beiden Katheten an.',
    answer: { ...unordered(approx(round(l1, 6), { label: 'Kathete 1:', unit: 'cm', tol: 0.15 }), approx(round(l2, 6), { label: 'Kathete 2:', unit: 'cm', tol: 0.15 })) },
    solution: `Die Parallele zu $c$ im Abstand $2{,}5\\ \\text{cm}$ schneidet den Thaleskreis in zwei Punkten. Es gibt also **zwei** (spiegelbildliche) Dreiecke.\n\nRechnerisch: Der Höhenfußpunkt teilt $c$ in $p$ und $q$ mit $p\\cdot q=h_c^2=6{,}25$ und $p+q=6$. Das ergibt $p\\approx${f2(hcP)}$, $q\\approx${f2(hcQ)}$.\n\nKatheten: $\\sqrt{2{,}5^2+${f2(hcP)}^2}\\approx${f2(l1)}\\ \\text{cm}$ und $\\sqrt{2{,}5^2+${f2(hcQ)}^2}\\approx${f2(l2)}\\ \\text{cm}$`,
    hint: 'Der Eckpunkt $C$ muss auf dem Thaleskreis liegen und $2{,}5\\ \\text{cm}$ über der Hypotenuse.',
  };
  const t89a = {
    prompt: 'Von einem Dreieck sind die Eckpunkte $A(-3\\mid-1)$, $B(3{,}5\\mid-1)$ und $C(1{,}5\\mid2)$ gegeben.\n\na) Zeichne das Dreieck $ABC$ in ein Koordinatensystem (1 Einheit = 1 cm): Tippe die drei Punkte an.',
    answer: { ...graph({ view: { xmin: -5, xmax: 5, ymin: -3, ymax: 4, snapX: 0.5, snapY: 0.5 }, lines: [] }), mode: 'points', count: 3, points: [[-3, -1], [3.5, -1], [1.5, 2]], tolerance: 0.01, connect: true },
    solution: 'Die Strecke $AB$ liegt waagerecht auf der Höhe $y=-1$ und ist $6{,}5$ Einheiten lang.',
    hint: 'Halbe Einheiten: $3{,}5$ liegt genau zwischen 3 und 4.',
  };
  const t89b = {
    prompt: 'Das Dreieck hat die Eckpunkte $A(-3\\mid-1)$, $B(3{,}5\\mid-1)$ und $C(1{,}5\\mid2)$.\n\nb) Zeige mithilfe des **Satzes von Thales**, dass das Dreieck $ABC$ rechtwinklig ist: Der Mittelpunkt von $\\overline{AB}$ ist $M$. Berechne dessen $x$-Koordinate, den Radius des Thaleskreises und den Abstand $\\overline{MC}$.',
    answer: fields(num(0.25, { label: 'M hat die x-Koordinate', tol: 0 }), val(3.25, 'Radius r =', 'LE'), val(Math.hypot(1.25, 3), 'MC =', 'LE'), sel(['bei A', 'bei B', 'bei C'], 'bei C', 'Das Dreieck ist rechtwinklig')),
    solution: '$M=\\left(\\frac{-3+3{,}5}{2}\\mid-1\\right)=(0{,}25\\mid-1)$, Radius $r=\\frac{6{,}5}{2}=3{,}25$.\n\n$\\overline{MC}=\\sqrt{(1{,}5-0{,}25)^2+(2-(-1))^2}=\\sqrt{1{,}5625+9}=\\sqrt{10{,}5625}=3{,}25$\n\n$C$ hat vom Mittelpunkt genau den Abstand des Radius, liegt also auf dem Thaleskreis über $\\overline{AB}$ → rechter Winkel **bei $C$**.',
    hint: 'Ein Punkt liegt auf dem Thaleskreis, wenn sein Abstand zum Mittelpunkt der Hypotenuse gleich dem Radius ist.',
  };
  const b89 = 5.4;
  const a89 = Math.sqrt(6.5 ** 2 - b89 ** 2);
  const t89c = {
    prompt: 'Im Dreieck $ABC$ ist die Kathete $b=5{,}4\\ \\text{cm}$ lang (Koordinaten wie oben, 1 Einheit = 1 cm).\n\nc) Entnimm die Länge der Hypotenuse aus der Zeichnung und berechne die Länge der fehlenden Kathete.',
    answer: fields(val(6.5, 'Hypotenuse c =', 'cm'), val(a89, 'Kathete a =', 'cm')),
    solution: `Die Hypotenuse $c=\\overline{AB}=3{,}5-(-3)=6{,}5\\ \\text{cm}$.\n\n$a=\\sqrt{c^2-b^2}=\\sqrt{6{,}5^2-5{,}4^2}=\\sqrt{${f2(6.5 ** 2 - b89 ** 2)}}\\approx${f2(a89)}\\ \\text{cm}$`,
    hint: 'Die längste Seite (Hypotenuse) liegt dem rechten Winkel gegenüber. Hier ist es $\\overline{AB}$.',
  };

  // ======================================================================== Kreisteile
  const sector = (r, al) => {
    const b = 2 * PI * r * (al / 360);
    const A = PI * r * r * (al / 360);
    return {
      prompt: `Ein Kreisausschnitt hat einen Mittelpunktswinkel von $\\alpha=${al}^\\circ$ und einen Radius von $r=${dt(r)}\\ \\text{cm}$.\n\nBerechne die Länge des Kreisbogens und den Flächeninhalt des Kreisausschnittes.`,
      answer: fields(val(b, 'Bogen b =', 'cm'), val(A, 'Fläche A =', 'cm²')),
      solution: `$b=2\\pi r\\cdot\\frac{\\alpha}{360^\\circ}=2\\pi\\cdot${dt(r)}\\cdot\\frac{${al}^\\circ}{360^\\circ}\\approx${f2(b)}\\ \\text{cm}$\n\n$A=\\pi r^2\\cdot\\frac{\\alpha}{360^\\circ}=\\pi\\cdot${dt(r)}^2\\cdot\\frac{${al}^\\circ}{360^\\circ}\\approx${f2(A)}\\ \\text{cm}^2$`,
      hint: 'Der Anteil am ganzen Kreis ist $\\frac{\\alpha}{360^\\circ}$. Wende ihn auf Umfang bzw. Fläche des ganzen Kreises an.',
    };
  };
  const sectorVars = [sector(5, 120), ...distinct((r) => sector(r.pick([3, 4, 6, 7.5, 10]), r.pick([30, 45, 60, 90, 150, 210])), 3, 101)];
  const ring = (r1, r2) => {
    const u = 2 * PI * (r1 + r2);
    const A = PI * (r1 * r1 - r2 * r2);
    return {
      prompt: `Ein Kreisring besteht aus zwei Kreisen mit den Radien $r_1=${dt(r1)}\\ \\text{m}$ und $r_2=${dt(r2)}\\ \\text{m}$.\n\nBerechne den Umfang und den Flächeninhalt des Kreisrings. (Rechne mit dem genauen Wert von $\\pi$ aus dem Taschenrechner.)`,
      answer: fields(val(u, 'Umfang u =', 'm'), val(A, 'Fläche A =', 'm²')),
      solution: `$u=u_1+u_2=2\\pi\\cdot${dt(r1)}+2\\pi\\cdot${dt(r2)}\\approx${f2(2 * PI * r1)}+${f2(2 * PI * r2)}=${f2(u)}\\ \\text{m}$\n\n$A=A_1-A_2=\\pi\\cdot${dt(r1)}^2-\\pi\\cdot${dt(r2)}^2\\approx${f2(PI * r1 * r1)}-${f2(PI * r2 * r2)}=${f2(A)}\\ \\text{m}^2$`,
      hint: 'Beim Umfang addierst du die Umfänge beider Kreise, bei der Fläche ziehst du die kleinere von der größeren ab.',
    };
  };
  const ringVars = [ring(10, 8), ...distinct((r) => ring(r.pick([6, 8, 9, 12, 15]), r.pick([3, 4, 5, 7])), 3, 102).filter((v) => v)];
  const t98 = [
    {
      prompt: 'Berechne die fehlenden Werte für einen Kreisausschnitt.\n\n| Radius $r$ | Winkel $\\alpha$ | Kreisbogen $b$ | Flächeninhalt $A$ |\n|---|---|---|---|\n| $5\\ \\text{cm}$ | $45^\\circ$ | ? | ? |',
      answer: fields(val(2 * PI * 5 * 45 / 360, 'b =', 'cm'), val(PI * 25 * 45 / 360, 'A =', 'cm²')),
      solution: `$b=2\\pi\\cdot5\\cdot\\frac{45}{360}\\approx${f2(2 * PI * 5 * 45 / 360)}\\ \\text{cm}$ · $A=\\pi\\cdot5^2\\cdot\\frac{45}{360}\\approx${f2(PI * 25 * 45 / 360)}\\ \\text{cm}^2$`,
      hint: '$\\frac{45}{360}=\\frac{1}{8}$ des ganzen Kreises.',
    },
    {
      prompt: 'Berechne die fehlenden Werte für einen Kreisausschnitt.\n\n| Radius $r$ | Winkel $\\alpha$ | Kreisbogen $b$ | Flächeninhalt $A$ |\n|---|---|---|---|\n| ? | $20^\\circ$ | $6{,}28\\ \\text{cm}$ | ? |',
      answer: fields(val(6.28 * 360 / (2 * PI * 20), 'r =', 'cm', 0.01), val(PI * (6.28 * 360 / (2 * PI * 20)) ** 2 * 20 / 360, 'A =', 'cm²', 0.01)),
      solution: `$b=2\\pi r\\cdot\\frac{\\alpha}{360} \\Rightarrow r=\\frac{b\\cdot360}{2\\pi\\cdot\\alpha}=\\frac{6{,}28\\cdot360}{2\\pi\\cdot20}\\approx${f2(6.28 * 360 / (2 * PI * 20))}\\ \\text{cm}$ (also $r=18\\ \\text{cm}$)\n\n$A=\\pi\\cdot${f2(6.28 * 360 / (2 * PI * 20))}^2\\cdot\\frac{20}{360}\\approx${f2(PI * (6.28 * 360 / (2 * PI * 20)) ** 2 * 20 / 360)}\\ \\text{cm}^2$`,
      hint: 'Stelle die Bogenformel nach $r$ um.',
    },
    {
      prompt: 'Berechne die fehlenden Werte für einen Kreisausschnitt.\n\n| Radius $r$ | Winkel $\\alpha$ | Kreisbogen $b$ | Flächeninhalt $A$ |\n|---|---|---|---|\n| ? | $180^\\circ$ | ? | $88{,}36\\ \\text{dm}^2$ |',
      answer: fields(val(Math.sqrt(88.36 * 2 / PI), 'r =', 'dm', 0.004), val(PI * Math.sqrt(88.36 * 2 / PI), 'b =', 'dm', 0.004)),
      solution: `$180^\\circ$ ist ein Halbkreis: $A=\\frac{\\pi r^2}{2} \\Rightarrow r^2=\\frac{2\\cdot88{,}36}{\\pi}\\approx56{,}25 \\Rightarrow r=7{,}5\\ \\text{dm}$\n\n$b=\\pi r\\approx${f2(PI * 7.5)}\\ \\text{dm}$`,
      hint: 'Bei $180^\\circ$ ist der Kreisausschnitt ein Halbkreis.',
    },
  ];
  const t99 = [
    {
      prompt: 'Berechne die fehlenden Werte für einen Kreisring.\n\n| Radius $r_1$ | Radius $r_2$ | Umfang $u$ | Flächeninhalt $A$ |\n|---|---|---|---|\n| $7\\ \\text{dm}$ | $4\\ \\text{dm}$ | ? | ? |',
      answer: fields(val(2 * PI * 11, 'u =', 'dm'), val(PI * 33, 'A =', 'dm²')),
      solution: `$u=2\\pi(7+4)\\approx${f2(2 * PI * 11)}\\ \\text{dm}$ · $A=\\pi(7^2-4^2)=33\\pi\\approx${f2(PI * 33)}\\ \\text{dm}^2$`,
      hint: 'Umfang: beide Kreisumfänge addieren. Fläche: großer Kreis minus kleiner Kreis.',
    },
    {
      prompt: 'Berechne die fehlenden Werte für einen Kreisring.\n\n| Radius $r_1$ | Radius $r_2$ | Umfang $u$ | Flächeninhalt $A$ |\n|---|---|---|---|\n| $6\\ \\text{cm}$ | ? | $56{,}55\\ \\text{cm}$ | ? |',
      answer: fields(val(3, 'r₂ =', 'cm', 0.002), val(PI * 27, 'A =', 'cm²', 0.004)),
      solution: `$u=2\\pi(r_1+r_2) \\Rightarrow r_1+r_2=\\frac{56{,}55}{2\\pi}\\approx9 \\Rightarrow r_2=3\\ \\text{cm}$\n\n$A=\\pi(6^2-3^2)=27\\pi\\approx${f2(PI * 27)}\\ \\text{cm}^2$`,
      hint: 'Teile den Umfang durch $2\\pi$, dann erhältst du $r_1+r_2$.',
    },
    {
      prompt: 'Berechne die fehlenden Werte für einen Kreisring.\n\n| Radius $r_1$ | Radius $r_2$ | Umfang $u$ | Flächeninhalt $A$ |\n|---|---|---|---|\n| ? | $15\\ \\text{m}$ | ? | $311{,}02\\ \\text{m}^2$ |',
      answer: fields(val(18, 'r₁ =', 'm', 0.002), val(2 * PI * 33, 'u =', 'm', 0.004)),
      solution: `$A=\\pi(r_1^2-r_2^2) \\Rightarrow r_1^2=\\frac{311{,}02}{\\pi}+15^2\\approx99+225=324 \\Rightarrow r_1=18\\ \\text{m}$\n\n$u=2\\pi(18+15)\\approx${f2(2 * PI * 33)}\\ \\text{m}$`,
      hint: 'Stelle die Flächenformel nach $r_1^2$ um und ziehe am Ende die Wurzel.',
    },
  ];
  const url101 = draw.svg('figur101', 300, 300, (() => {
    const C = [150, 90];
    const s = 120;
    const Bp = [C[0] - s / 2, C[1] + s * 0.866], Cp = [C[0] + s / 2, C[1] + s * 0.866];
    return draw.circle(C[0], C[1], 60, '#fde68a') + draw.poly([C, Bp, Cp], '#e0e7ff') + draw.circle(C[0], C[1], 60, 'none', "fill-opacity='0'")
      + draw.tx(C[0], C[1] - 70, 'r = 2 cm', 'middle', "font-size='13' fill='#b45309' font-weight='700'") + draw.tx(C[0], Bp[1] + 20, '4 cm') + draw.tx(C[0] + 8, C[1] + 28, '60°', 'start', "font-size='13' font-weight='700' fill='#b45309'") + draw.dot(C[0], C[1]);
  })());
  const A101 = (Math.sqrt(3) / 4) * 16 + PI * 4 * (300 / 360);
  const t101 = {
    prompt: `Die Figur besteht aus einem gleichseitigen Dreieck mit der Seitenlänge $4\\ \\text{cm}$ und einem Kreis mit Radius $2\\ \\text{cm}$ um die obere Spitze (Winkel an der Spitze $60^\\circ$). Berechne den Flächeninhalt der gesamten Figur (Dreieck und Kreis zusammen, der gemeinsame Teil zählt nur einmal).\n\n![Figur](${url101})\n\n${NOTE}`,
    answer: fields(val(A101, 'Fläche A =', 'cm²')),
    solution: `Zerlege die Figur in das Dreieck und den Kreis*ausschnitt* mit dem **Restwinkel** $360^\\circ-60^\\circ=300^\\circ$ (der $60^\\circ$-Teil des Kreises liegt schon im Dreieck).\n\nDreieck: $A_\\triangle=\\frac{\\sqrt3}{4}\\cdot4^2\\approx${f2((Math.sqrt(3) / 4) * 16)}\\ \\text{cm}^2$ (Höhe $h=\\sqrt{4^2-2^2}\\approx3{,}46$, $A=\\frac{4\\cdot3{,}46}{2}$)\n\nKreisausschnitt: $A_K=\\pi\\cdot2^2\\cdot\\frac{300}{360}\\approx${f2(PI * 4 * (300 / 360))}\\ \\text{cm}^2$\n\n$A\\approx${f2(A101)}\\ \\text{cm}^2$`,
    hint: 'Ein Teil des Kreises liegt innerhalb des Dreiecks. Rechne mit dem Kreisausschnitt von $300^\\circ$.',
  };
  const t102 = {
    prompt: 'In einem Garten wird ein zylinderförmiges Schwimmbecken angelegt. Das Becken hat einen Umfang von $37{,}70\\ \\text{m}$. Um das Becken führt ein $90\\ \\text{cm}$ breiter Weg.\n\na) Berechne die Grundfläche des Beckens.\n\nb) Berechne die Fläche des Weges.\n\nc) Berechne den Umfang des äußeren Wegrandes.',
    answer: fields(val(PI * 36, 'a) Grundfläche:', 'm²', 0.004), val(PI * (6.9 ** 2 - 36), 'b) Weg:', 'm²', 0.004), val(2 * PI * 6.9, 'c) Umfang:', 'm', 0.004)),
    solution: `a) $r=\\frac{u}{2\\pi}=\\frac{37{,}70}{2\\pi}\\approx6{,}0\\ \\text{m}$, $A=\\pi r^2\\approx113{,}10\\ \\text{m}^2$\n\nb) Außenradius $R=6{,}0+0{,}9=6{,}9\\ \\text{m}$: $A_{Weg}=\\pi(6{,}9^2-6^2)\\approx${f2(PI * (6.9 ** 2 - 36))}\\ \\text{m}^2$ (Kreisring)\n\nc) $u_a=2\\pi\\cdot6{,}9\\approx${f2(2 * PI * 6.9)}\\ \\text{m}$`,
    hint: 'Aus dem Umfang bekommst du den Radius. Der Weg ist ein Kreisring (Achtung: 90 cm = 0,9 m).',
  };

  // ======================================================================== Körper
  const cone = (r, h) => {
    const V = (PI * r * r * h) / 3;
    const s = Math.sqrt(r * r + h * h);
    const O = PI * r * r + PI * r * s;
    return {
      prompt: `Von einem Kegel sind der Radius $r=${dt(r)}\\ \\text{cm}$ und die Körperhöhe $h_K=${dt(h)}\\ \\text{cm}$ gegeben.\n\nBerechne das Volumen des Kegels.`,
      answer: fields(val(V, 'V =', 'cm³')),
      solution: `$V=\\frac{1}{3}\\cdot\\pi\\cdot r^2\\cdot h_K=\\frac{1}{3}\\cdot\\pi\\cdot${dt(r)}^2\\cdot${dt(h)}\\approx${f2(V)}\\ \\text{cm}^3$\n\n*E-Kurs:* Seitenlinie $s=\\sqrt{r^2+h_K^2}=${f2(s)}\\ \\text{cm}$, Oberfläche $O=\\pi r^2+\\pi r s\\approx${f2(O)}\\ \\text{cm}^2$`,
      hint: 'Setze Radius und Höhe in die Volumenformel des Kegels ein.',
    };
  };
  const coneVars = [cone(2.5, 6), ...distinct((r) => cone(r.pick([2, 3, 3.5, 4, 5, 6]), r.pick([4, 5, 7, 8, 9, 10])), 3, 103)];
  const coneO = (r, h) => {
    const s = Math.sqrt(r * r + h * h);
    const O = PI * r * r + PI * r * s;
    return {
      prompt: `Ein Kegel hat den Radius $r=${dt(r)}\\ \\text{cm}$ und die Körperhöhe $h_K=${dt(h)}\\ \\text{cm}$.\n\nBerechne die Oberfläche des Kegels. (Tipp: Zuerst die Seitenlinie $s$ mit Pythagoras.)`,
      answer: fields(val(s, 's =', 'cm'), val(O, 'O =', 'cm²')),
      solution: `$s^2=r^2+h_K^2=${dt(r)}^2+${dt(h)}^2=${f2(s * s)} \\Rightarrow s=${f2(s)}\\ \\text{cm}$\n\n$O=G+M=\\pi r^2+\\pi r s=\\pi\\cdot${dt(r)}^2+\\pi\\cdot${dt(r)}\\cdot${f2(s)}\\approx${f2(O)}\\ \\text{cm}^2$`,
      hint: '$O=\\pi r^2+\\pi r s$. Die Seitenlinie $s$ ist die Hypotenuse im Dreieck aus $r$ und $h_K$.',
    };
  };
  const coneOVars = [coneO(2.5, 6), coneO(5, 7.5), ...distinct((r) => coneO(r.pick([3, 4, 6]), r.pick([4, 8, 9])), 2, 104)];
  const t103b = cone(5, 7.5);
  const pyr = (a, h) => {
    const V = (a * a * h) / 3;
    return {
      prompt: `Bei einer quadratischen Pyramide gilt für die Grundkante $a=${dt(a)}\\ \\text{cm}$ und für die Körperhöhe $h_K=${dt(h)}\\ \\text{cm}$.\n\nBerechne das Volumen der quadratischen Pyramide.`,
      answer: fields(val(V, 'V =', 'cm³')),
      solution: `$G=a^2=${dt(a * a)}\\ \\text{cm}^2$\n\n$V=\\frac{1}{3}\\cdot G\\cdot h_K=\\frac{1}{3}\\cdot${dt(a * a)}\\cdot${dt(h)}\\approx${f2(V)}\\ \\text{cm}^3$`,
      hint: 'Grundfläche der quadratischen Pyramide ist $a\\cdot a$.',
    };
  };
  const pyrVars = [pyr(4, 3.5), ...distinct((r) => pyr(r.pick([3, 5, 6, 8]), r.pick([4, 4.5, 6, 7.5])), 3, 105)];
  const r105 = 55 / (2 * PI);
  const V105 = (PI * r105 ** 2 * 100) / 3;
  const s105 = Math.sqrt(r105 ** 2 + 100 ** 2);
  const M105 = PI * r105 * s105;
  const t105a = {
    prompt: 'Leon möchte sich für die Faschingsparty einen kegelförmigen Hut basteln. Sein Kopfumfang beträgt $55\\ \\text{cm}$. Damit er auf der Feier auch auffällt, soll der Hut einen Meter hoch sein.\n\na) Berechne, welches Volumen der Faschingshut hat. (Der Kopfumfang ist der Umfang des Kreises am unteren Rand.)',
    answer: fields(val(r105, 'Radius r =', 'cm', 0.004), val(V105, 'V =', 'cm³', 0.006)),
    solution: `$r=\\frac{u}{2\\pi}=\\frac{55}{2\\pi}\\approx${f2(r105)}\\ \\text{cm}$\n\n$V=\\frac{1}{3}\\pi r^2 h_K=\\frac{1}{3}\\pi\\cdot${f2(r105)}^2\\cdot100\\approx${f1(V105)}\\ \\text{cm}^3$`,
    hint: 'Aus dem Umfang $u=2\\pi r$ erhältst du zuerst den Radius.',
  };
  const t105b = {
    prompt: 'Leon möchte sich einen kegelförmigen Hut basteln (Kopfumfang $55\\ \\text{cm}$, Höhe $1\\ \\text{m}$).\n\nb) Berechne, wie viel $\\text{cm}^2$ Pappe er für den Hut benötigt. (Der Hut hat keinen Boden, nur die Mantelfläche.)',
    answer: fields(val(M105, 'Pappe:', 'cm²', 0.006)),
    solution: `$r\\approx${f2(r105)}\\ \\text{cm}$, $s=\\sqrt{r^2+h_K^2}=\\sqrt{${f2(r105 ** 2)}+10000}\\approx${f2(s105)}\\ \\text{cm}$\n\n$M=\\pi\\cdot r\\cdot s\\approx\\pi\\cdot${f2(r105)}\\cdot${f2(s105)}\\approx${f1(M105)}\\ \\text{cm}^2$`,
    hint: 'Nur die Mantelfläche $M=\\pi r s$ wird benötigt.',
  };
  const t106 = [
    {
      prompt: 'Berechne die fehlende Größe des Kegels.\n\na) $V=123\\ \\text{cm}^3$; $r=2{,}8\\ \\text{cm}$; $h_K=?$',
      answer: fields(val((3 * 123) / (PI * 2.8 ** 2), 'hK =', 'cm')),
      solution: `$V=\\frac{1}{3}\\pi r^2 h_K \\Rightarrow h_K=\\frac{3V}{\\pi r^2}=\\frac{3\\cdot123}{\\pi\\cdot2{,}8^2}\\approx${f2((3 * 123) / (PI * 2.8 ** 2))}\\ \\text{cm}$`,
      hint: 'Stelle die Volumenformel nach $h_K$ um.',
    },
    {
      prompt: 'Berechne die fehlende Größe des Kegels.\n\nb) $V=254\\ \\text{cm}^3$; $h_K=9\\ \\text{cm}$; $r=?$',
      answer: fields(val(Math.sqrt((3 * 254) / (PI * 9)), 'r =', 'cm')),
      solution: `$r^2=\\frac{3V}{\\pi h_K}=\\frac{3\\cdot254}{\\pi\\cdot9}\\approx${f2((3 * 254) / (PI * 9))} \\Rightarrow r\\approx${f2(Math.sqrt((3 * 254) / (PI * 9)))}\\ \\text{cm}$`,
      hint: 'Stelle nach $r^2$ um und ziehe dann die Wurzel.',
    },
  ];
  const ha107 = Math.sqrt(16 + 1);
  const t107 = {
    prompt: 'Eine quadratische Pyramide hat eine Grundfläche von $4\\ \\text{dm}^2$ und die Körperhöhe $h_K$ beträgt $4\\ \\text{dm}$.\n\nBerechne die Seitenhöhe $h_a$, die Oberfläche und das Volumen der Pyramide.',
    answer: fields(val(ha107, 'ha =', 'dm'), val(4 + 4 * 0.5 * 2 * ha107, 'O =', 'dm²'), val(16 / 3, 'V =', 'dm³')),
    solution: `Grundkante: $a=\\sqrt{4}=2\\ \\text{dm}$. Im rechtwinkligen Dreieck aus $h_K$, $\\frac{a}{2}$ und $h_a$:\n\n$h_a=\\sqrt{4^2+1^2}=\\sqrt{17}\\approx${f2(ha107)}\\ \\text{dm}$\n\nMantel: 4 Dreiecke $\\frac{a\\cdot h_a}{2}$: $M=4\\cdot\\frac{2\\cdot${f2(ha107)}}{2}\\approx${f2(4 * ha107)}\\ \\text{dm}^2$, $O=G+M\\approx${f2(4 + 4 * ha107)}\\ \\text{dm}^2$\n\n$V=\\frac{1}{3}\\cdot4\\cdot4\\approx5{,}33\\ \\text{dm}^3$`,
    hint: 'Aus $G=a^2$ folgt $a$. Die Seitenhöhe liegt im Dreieck mit $h_K$ und $\\frac{a}{2}$.',
  };
  const t108a = {
    prompt: 'Die Abbildung zeigt eine kegelförmige Kerze, die $25\\ \\text{cm}$ hoch ist und einen Radius von $r=4\\ \\text{cm}$ hat.\n\nBestimme, wie viel Wachs man zum Herstellen der Kerze benötigt.',
    answer: fields(val((PI * 16 * 25) / 3, 'Wachs:', 'cm³')),
    solution: `$V=\\frac{1}{3}\\pi r^2 h=\\frac{1}{3}\\pi\\cdot4^2\\cdot25\\approx${f2((PI * 16 * 25) / 3)}\\ \\text{cm}^3$`,
    hint: 'Die Kerze ist ein Kegel. Nutze die Volumenformel des Kegels.',
  };
  const t108b = {
    prompt: 'Die Abbildung zeigt eine pyramidenförmige Kerze (quadratische Grundfläche, Grundkante $a=12\\ \\text{cm}$), die $25\\ \\text{cm}$ hoch ist.\n\nBestimme, wie viel Wachs man zum Herstellen der Kerze benötigt.',
    answer: fields(val(1200, 'Wachs:', 'cm³')),
    solution: '$V=\\frac{1}{3}\\cdot a^2\\cdot h=\\frac{1}{3}\\cdot12^2\\cdot25=1\\,200\\ \\text{cm}^3$',
    hint: 'Pyramide: $V=\\frac{1}{3}\\cdot G\\cdot h$ mit $G=a^2$.',
  };
  const t109 = [
    {
      prompt: 'Gib an, wie sich das Volumen einer quadratischen Pyramide verhält, wenn sich die **Körperhöhe verdoppelt**.',
      answer: fields(sel(['halbiert sich', 'verdoppelt sich', 'vervierfacht sich', 'verachtfacht sich'], 'verdoppelt sich', 'Das Volumen')),
      solution: '$V=\\frac{1}{3}a^2h$. Mit $2h$ gilt $V\'=\\frac{1}{3}a^2\\cdot2h=2V$ → das Volumen **verdoppelt sich**.',
      hint: 'Setze $2h$ in die Formel ein und vergleiche.',
    },
    {
      prompt: 'Gib an, wie sich das Volumen einer quadratischen Pyramide verhält, wenn sich die **Grundseite verdoppelt**.',
      answer: fields(sel(['halbiert sich', 'verdoppelt sich', 'vervierfacht sich', 'verachtfacht sich'], 'vervierfacht sich', 'Das Volumen')),
      solution: '$V=\\frac{1}{3}a^2h$. Mit $2a$ gilt $V\'=\\frac{1}{3}(2a)^2h=4\\cdot\\frac{1}{3}a^2h=4V$ → das Volumen **vervierfacht sich**.',
      hint: '$a$ steht in der Formel im Quadrat.',
    },
  ];
  // Kugel
  const ball = (r) => {
    const V = (4 / 3) * PI * r ** 3;
    const O = 4 * PI * r * r;
    return {
      prompt: `Berechne das Volumen und die Oberfläche einer Kugel mit dem Radius $r=${dt(r)}\\ \\text{cm}$.`,
      answer: fields(val(V, 'V =', 'cm³'), val(O, 'O =', 'cm²')),
      solution: `$V=\\frac{4}{3}\\pi r^3=\\frac{4}{3}\\pi\\cdot${dt(r)}^3\\approx${f2(V)}\\ \\text{cm}^3$\n\n$O=4\\pi r^2=4\\pi\\cdot${dt(r)}^2\\approx${f2(O)}\\ \\text{cm}^2$`,
      hint: '$V=\\frac{4}{3}\\pi r^3$ und $O=4\\pi r^2$.',
    };
  };
  const ballVars = [ball(3.5), ball(15), ...distinct((r) => ball(r.pick([2, 4, 5, 6, 7.5, 10])), 2, 106)];
  const t110b = {
    prompt: 'Berechne das Volumen und die Oberfläche der Kugel mit dem **Kugeldurchmesser $d=9\\ \\text{m}$**.',
    answer: fields(val((4 / 3) * PI * 4.5 ** 3, 'V =', 'm³'), val(4 * PI * 4.5 ** 2, 'O =', 'm²')),
    solution: `$r=\\frac{d}{2}=4{,}5\\ \\text{m}$\n\n$V=\\frac{4}{3}\\pi\\cdot4{,}5^3\\approx${f2((4 / 3) * PI * 4.5 ** 3)}\\ \\text{m}^3$ · $O=4\\pi\\cdot4{,}5^2\\approx${f2(4 * PI * 4.5 ** 2)}\\ \\text{m}^2$`,
    hint: 'Achtung: Gegeben ist der Durchmesser, du brauchst den Radius.',
  };
  const vEis = (4 / 3) * PI * 1.75 ** 3;
  const t111 = {
    prompt: 'Eine Eispackung enthält einen Liter Eis ($1\\ \\text{l}=1\\,000\\ \\text{cm}^3$).\n\nBerechne, wie viele Kugeln man daraus formen kann, wenn eine Kugel einen Durchmesser von $3{,}5\\ \\text{cm}$ haben soll.',
    answer: fields(val(vEis, 'Volumen einer Kugel:', 'cm³'), num(44, { label: 'Anzahl der Kugeln:', tol: 0 })),
    solution: `$r=1{,}75\\ \\text{cm}$: $V_K=\\frac{4}{3}\\pi\\cdot1{,}75^3\\approx${f2(vEis)}\\ \\text{cm}^3$\n\n$1\\,000:${f2(vEis)}\\approx${f1(1000 / vEis)}$ → es reicht für **44 volle Kugeln**.`,
    hint: 'Teile das Gesamtvolumen durch das Volumen einer Kugel und runde ab.',
  };
  const VTT = (4 / 3) * PI * (20 ** 3 - 19.75 ** 3);
  const t112 = {
    prompt: 'Ein Tischtennisball wird aus Zelluloid hergestellt. Ein Ball hat einen Durchmesser von $40\\ \\text{mm}$ und eine Wandstärke von $0{,}25\\ \\text{mm}$.\n\nBerechne, wie viel Zelluloid man für eine 6er-Packung Bälle benötigt (in $\\text{mm}^3$).',
    answer: fields(val(VTT * 6, '6 Bälle:', 'mm³', 0.006)),
    solution: `Außenradius $R=20\\ \\text{mm}$, Innenradius $r=19{,}75\\ \\text{mm}$.\n\n$V_{Ball}=\\frac{4}{3}\\pi(R^3-r^3)=\\frac{4}{3}\\pi(8000-${f2(19.75 ** 3)})\\approx${f1(VTT)}\\ \\text{mm}^3$\n\n6 Bälle: $6\\cdot${f1(VTT)}\\approx${f1(VTT * 6)}\\ \\text{mm}^3\\approx7{,}4\\ \\text{cm}^3$`,
    hint: 'Das Zelluloid ist die Differenz aus großer Kugel (Außenradius) und kleiner Kugel (Innenradius).',
  };
  const t113 = {
    prompt: 'Nora möchte ihre 120 Murmeln in eine würfelförmige Schachtel mit der Kantenlänge $a=4\\ \\text{cm}$ verpacken. Die Murmeln haben jeweils einen Durchmesser von $0{,}8\\ \\text{cm}$.\n\nPassen die Murmeln in die Schachtel? Begründe mit einer Rechnung: Wie viele Murmeln passen nebeneinander in eine Reihe, wie viele insgesamt?',
    answer: fields(num(5, { label: 'Murmeln pro Kante:', tol: 0 }), num(125, { label: 'Murmeln insgesamt höchstens:', tol: 0 }), sel(['Ja, sie passen', 'Nein, sie passen nicht'], 'Ja, sie passen', 'Antwort:')),
    solution: '$4:0{,}8=5$ → in jede Richtung passen 5 Murmeln. In die Schachtel passen also $5\\cdot5\\cdot5=125$ Murmeln. Das sind mehr als 120 → **Ja**, sie passen.\n\n(Das Volumen allein würde nichts beweisen: $120\\cdot\\frac{4}{3}\\pi\\cdot0{,}4^3\\approx32{,}2\\ \\text{cm}^3<64\\ \\text{cm}^3$, aber Kugeln lassen Zwischenräume.)',
    hint: 'Überlege, wie viele Murmeln in einer Reihe, einer Schicht und in der ganzen Schachtel Platz haben.',
  };
  const t114 = [
    {
      prompt: 'Berechne den Radius der Kugel, wenn $V=268\\ \\text{cm}^3$ bekannt ist.',
      answer: fields(val(Math.cbrt((3 * 268) / (4 * PI)), 'r =', 'cm', 0.004)),
      solution: `$V=\\frac{4}{3}\\pi r^3 \\Rightarrow r^3=\\frac{3V}{4\\pi}=\\frac{3\\cdot268}{4\\pi}\\approx${f2((3 * 268) / (4 * PI))} \\Rightarrow r=\\sqrt[3]{${f2((3 * 268) / (4 * PI))}}\\approx${f2(Math.cbrt((3 * 268) / (4 * PI)))}\\ \\text{cm}$`,
      hint: 'Stelle nach $r^3$ um und ziehe die dritte Wurzel (Taschenrechner: $\\sqrt[3]{x}$ oder $x^{1/3}$).',
    },
    {
      prompt: 'Berechne den Radius der Kugel, wenn $O=113\\ \\text{cm}^2$ bekannt ist.',
      answer: fields(val(Math.sqrt(113 / (4 * PI)), 'r =', 'cm', 0.004)),
      solution: `$O=4\\pi r^2 \\Rightarrow r^2=\\frac{113}{4\\pi}\\approx${f2(113 / (4 * PI))} \\Rightarrow r\\approx${f2(Math.sqrt(113 / (4 * PI)))}\\ \\text{cm}$`,
      hint: 'Stelle nach $r^2$ um und ziehe die Wurzel.',
    },
  ];
  const F = ['wird halb so groß', 'verdoppelt sich', 'vervierfacht sich', 'verachtfacht sich', 'wird 16-mal so groß', 'wird 64-mal so groß'];
  const t115 = [
    {
      prompt: 'Gib an, wie sich das Volumen einer Kugel verhält, wenn sich der Radius **verdoppelt**.',
      answer: fields(sel(F, 'verachtfacht sich', 'Das Volumen')),
      solution: '$V=\\frac{4}{3}\\pi r^3$. Mit $2r$: $V\'=\\frac{4}{3}\\pi(2r)^3=8\\cdot\\frac{4}{3}\\pi r^3=8V$ → **verachtfacht sich**.',
      hint: '$r$ steht in der dritten Potenz: $2^3=8$.',
    },
    {
      prompt: 'Gib an, wie sich das Volumen einer Kugel verhält, wenn sich der Radius **vervierfacht**.',
      answer: fields(sel(F, 'wird 64-mal so groß', 'Das Volumen')),
      solution: '$V\'=\\frac{4}{3}\\pi(4r)^3=64\\cdot V$ → **64-mal so groß** ($4^3=64$).',
      hint: '$r$ steht in der dritten Potenz: $4^3=64$.',
    },
  ];
  // Vermischtes
  const VSB = (2 / 3) * PI * 8 + (PI * 4 * 7) / 3;
  const t122a = {
    prompt: 'Ein Maurerlot (Senkblei) setzt sich aus einer Halbkugel (Durchmesser $4\\ \\text{cm}$) und einem Kegel (Höhe $7\\ \\text{cm}$) zusammen.\n\na) Berechne die Masse des Maurerlotes. Verwende, dass $1\\ \\text{cm}^3$ Edelstahllegierung $7{,}8\\ \\text{g}$ wiegt.',
    answer: fields(val(VSB, 'Volumen:', 'cm³'), val(VSB * 7.8, 'Masse:', 'g', 0.005)),
    solution: `$r=2\\ \\text{cm}$\n\nHalbkugel: $V_H=\\frac{1}{2}\\cdot\\frac{4}{3}\\pi\\cdot2^3\\approx${f2((2 / 3) * PI * 8)}\\ \\text{cm}^3$\n\nKegel: $V_K=\\frac{1}{3}\\pi\\cdot2^2\\cdot7\\approx${f2((PI * 4 * 7) / 3)}\\ \\text{cm}^3$\n\n$V\\approx${f2(VSB)}\\ \\text{cm}^3$, Masse: $${f2(VSB)}\\cdot7{,}8\\approx${f1(VSB * 7.8)}\\ \\text{g}$`,
    hint: 'Zerlege den Körper in Halbkugel und Kegel, berechne beide Volumina und addiere.',
  };
  const sL = Math.sqrt(4 + 49);
  const OSB = 2 * PI * 4 + PI * 2 * sL;
  const t122b = {
    prompt: 'Ein Maurerlot besteht aus einer Halbkugel (Durchmesser $4\\ \\text{cm}$) und einem Kegel (Höhe $7\\ \\text{cm}$).\n\nb) Berechne die Oberfläche des Maurerlotes.',
    answer: fields(val(sL, 's =', 'cm'), val(OSB, 'O =', 'cm²')),
    solution: `$s=\\sqrt{r^2+h^2}=\\sqrt{4+49}\\approx${f2(sL)}\\ \\text{cm}$\n\nHalbkugel (gewölbte Fläche): $2\\pi r^2=2\\pi\\cdot4\\approx${f2(2 * PI * 4)}\\ \\text{cm}^2$\n\nKegelmantel: $\\pi r s=\\pi\\cdot2\\cdot${f2(sL)}\\approx${f2(PI * 2 * sL)}\\ \\text{cm}^2$\n\n$O\\approx${f2(OSB)}\\ \\text{cm}^2$`,
    hint: 'Bei der Oberfläche zählen nur die äußeren Flächen: Halbkugelfläche + Kegelmantel (keine Grundfläche).',
  };
  const t123 = [
    {
      prompt: 'Runde Kuchenformen werden nach der Größe ihres Durchmessers in cm benannt. Eine 24er-Form hat einen $8\\ \\text{cm}$ hohen Rand.\n\na) Bestimme, wie viel $\\text{cm}^3$ Teig in die Form passt.',
      answer: fields(val(PI * 144 * 8, 'Teig:', 'cm³')),
      solution: `Durchmesser 24 cm → $r=12\\ \\text{cm}$\n\n$V=\\pi r^2 h=\\pi\\cdot12^2\\cdot8\\approx${f1(PI * 144 * 8)}\\ \\text{cm}^3$`,
      hint: 'Die Form ist ein Zylinder. Aus dem Durchmesser bekommst du den Radius.',
    },
    {
      prompt: 'Eine 24er-Kuchenform (Durchmesser $24\\ \\text{cm}$, Rand $8\\ \\text{cm}$). Nachdem der Kuchen gebacken wurde, wird er aus der Form gelöst. Der Rand und die Fläche oben werden mit Fondant ummantelt.\n\nb) Berechne, wie viel $\\text{cm}^2$ Fondant man benötigt, wenn der Kuchen $3\\ \\text{cm}$ höher als die Form ist.',
      answer: fields(val(PI * 144 + 2 * PI * 12 * 11, 'Fondant:', 'cm²')),
      solution: `Kuchenhöhe: $8+3=11\\ \\text{cm}$\n\nOben: $\\pi r^2=\\pi\\cdot12^2\\approx${f1(PI * 144)}\\ \\text{cm}^2$\n\nRand (Mantel): $2\\pi r h=2\\pi\\cdot12\\cdot11\\approx${f1(2 * PI * 12 * 11)}\\ \\text{cm}^2$\n\nSumme: $\\approx${f1(PI * 144 + 2 * PI * 12 * 11)}\\ \\text{cm}^2$`,
      hint: 'Deckfläche (Kreis) plus Mantelfläche des Zylinders.',
    },
    {
      prompt: 'Zum Backen einer Hochzeitstorte wird eine 48er-Form (Durchmesser $48\\ \\text{cm}$) mit einem $16\\ \\text{cm}$ hohen Rand benutzt. Zum Vergleich: die 24er-Form hat einen $8\\ \\text{cm}$ hohen Rand.\n\nc) Entscheide, ob sich die benötigte Teigmenge dadurch verdoppelt.',
      answer: fields(num(8, { label: 'Die Teigmenge wird das', unit: '-Fache', tol: 0 }), sel(['verdoppelt sich', 'verdoppelt sich nicht'], 'verdoppelt sich nicht', 'Sie')),
      solution: `$V_{48}=\\pi\\cdot24^2\\cdot16\\approx${f1(PI * 576 * 16)}\\ \\text{cm}^3$, $V_{24}=\\pi\\cdot12^2\\cdot8\\approx${f1(PI * 144 * 8)}\\ \\text{cm}^3$\n\nDurchmesser und Höhe wurden verdoppelt: Radius im Quadrat ($2^2=4$), Höhe einfach ($2$) → $4\\cdot2=8$. Die Teigmenge **verachtfacht** sich.`,
      hint: 'Vergleiche beide Volumina mit der Zylinderformel. Wie oft kommt der Radius in der Formel vor?',
    },
  ];
  const side = Math.hypot(2, 3);
  const Oprism = 2 * 6 + 10 * (4 + 2 * side);
  const t124 = [
    {
      prompt: 'René bringt seinen Eltern von der Klassenfahrt eine Schweizer Schokolade mit und verpackt sie als Geschenk. Die Schokoladenpackung ist ein Prisma: Die Grundfläche ist ein gleichschenkliges Dreieck (Grundseite $4\\ \\text{cm}$, Höhe $3\\ \\text{cm}$), die Länge beträgt $10\\ \\text{cm}$.\n\na) Berechne, wie viel $\\text{cm}^2$ Geschenkpapier er braucht, wenn dieses $19\\,\\%$ größer ist als die Oberfläche der Schokoladenpackung.',
      answer: fields(val(Oprism, 'Oberfläche:', 'cm²', 0.005), val(Oprism * 1.19, 'Geschenkpapier:', 'cm²', 0.005)),
      solution: `Schenkel des Dreiecks: $\\sqrt{2^2+3^2}=\\sqrt{13}\\approx${f2(side)}\\ \\text{cm}$\n\nGrundflächen: $2\\cdot\\frac{4\\cdot3}{2}=12\\ \\text{cm}^2$\n\nMantel: Umfang · Länge $=(4+2\\cdot${f2(side)})\\cdot10\\approx${f2(10 * (4 + 2 * side))}\\ \\text{cm}^2$\n\n$O\\approx${f2(Oprism)}\\ \\text{cm}^2$\n\nGeschenkpapier: $1{,}19\\cdot O\\approx${f2(Oprism * 1.19)}\\ \\text{cm}^2$`,
      hint: 'Oberfläche = 2 · Grundfläche + Mantel. Das Papier ist 119 % der Oberfläche.',
    },
    {
      prompt: 'René verpackt die Schokolade (Prisma, Grundfläche: gleichschenkliges Dreieck mit Grundseite $4\\ \\text{cm}$ und Höhe $3\\ \\text{cm}$) als Geschenk. Das Geschenkband wird einmal um die Packung herum gelegt (um die Dreiecksfläche).\n\nb) Berechne die Länge des Geschenkbandes, wenn für die Schleife zusätzlich $36{,}2\\ \\text{cm}$ benötigt werden.',
      answer: fields(val(4 + 2 * side + 36.2, 'Bandlänge:', 'cm', 0.004)),
      solution: `Das Band geht einmal um das Dreieck: Umfang $u=4+2\\cdot\\sqrt{13}\\approx${f2(4 + 2 * side)}\\ \\text{cm}$\n\nMit der Schleife: $${f2(4 + 2 * side)}+36{,}2\\approx${f2(4 + 2 * side + 36.2)}\\ \\text{cm}$\n\n*(Annahme: ein Band einmal um die Dreiecksfläche, wie in der Abbildung.)*`,
      hint: 'Wie lang ist der Weg einmal um das Dreieck herum? Dann die Schleife addieren.',
    },
  ];

  return [
    {
      topic: 'Trigonometrie & Ähnlichkeit',
      addProfiles: ['HS10'],
      sections: [
        {
          title: 'Zentrische Streckung',
          md: L`Zwei Figuren heißen **ähnlich**, wenn sie in allen Winkeln und in allen Seitenverhältnissen übereinstimmen. Ähnliche Figuren entstehen z. B. durch **zentrische Streckung**.

Eine zentrische Streckung wird durch das **Streckungszentrum $Z$** und den **Streckungsfaktor $k$** festgelegt:
- $k>1$: **Vergrößerung**
- $0<k<1$: **Verkleinerung**

**Eigenschaften:**
- Original- und Bildpunkt liegen auf einer Geraden durch $Z$.
- Original- und Bildstrecke sind **parallel**.
- Das Längenverhältnis Bild : Original ist $k$. Die **Fläche** ändert sich mit $k^2$.
- Original- und Bildwinkel sind gleich groß.

**Konstruktion:** Zeichne von $Z$ aus Halbgeraden durch die Eckpunkte. Die Bildpunkte liegen darauf im $k$-fachen Abstand von $Z$.

> Beispiel: $Z(1\mid1)$, $k=2$, $A(2\mid3)$: Abstand von $Z$ ist $(1\mid2)$, doppelt: $(2\mid4)$, also $A'(3\mid5)$.`,
        },
        {
          title: 'Sinus- und Kosinussatz im allgemeinen Dreieck',
          md: L`In **beliebigen** Dreiecken (nicht nur rechtwinkligen) brauchst du zwei Sätze:

**Sinussatz:** $\dfrac{a}{\sin\alpha}=\dfrac{b}{\sin\beta}=\dfrac{c}{\sin\gamma}$

**Kosinussatz:** $a^2=b^2+c^2-2\,b\,c\cdot\cos\alpha$ (entsprechend für $b$ und $c$)

- **Kosinussatz:** zwei Seiten und der eingeschlossene Winkel sind bekannt (oder alle drei Seiten).
- **Sinussatz:** eine Seite mit gegenüberliegendem Winkel ist bekannt plus eine weitere Größe.

Bei einem rechtwinkligen Dreieck wird der Kosinussatz wegen $\cos 90^\circ=0$ zum Satz des Pythagoras.

**Winkelsumme:** $\alpha+\beta+\gamma=180^\circ$.`,
        },
      ],
      packages: [
        {
          title: 'Zentrische Streckung',
          description: 'Figuren strecken und verkleinern, Flächeninhalt der Bildfigur',
          level: 1,
          tasks: [
            { title: 'Grundlagen 78 a: Dreieck strecken (k = 0,5)', section: 'Zentrische Streckung', variants: [t78a] },
            { title: 'Grundlagen 78 b: Raute strecken (k = 2)', section: 'Zentrische Streckung', variants: [t78b] },
            { title: 'Grundlagen 79 a: Fünfeck zeichnen', section: 'Zentrische Streckung', variants: [t79a] },
            { title: 'Grundlagen 79 b: Fünfeck strecken (k = 2)', section: 'Zentrische Streckung', variants: [t79b] },
            { title: 'Grundlagen 80: Fläche des Bilddreiecks', section: 'Zentrische Streckung', variants: t80vars },
          ],
        },
        {
          title: 'Strahlensätze',
          description: 'Streckenlängen mit dem 1. und 2. Strahlensatz berechnen',
          level: 2,
          tasks: [
            { title: 'Grundlagen Beispiel: Strahlensatz', section: 'Strahlensatz und Peilen', variants: [tEx] },
            { title: 'Grundlagen 81: Passende Gleichungen', section: 'Strahlensatz und Peilen', variants: [t81] },
            { title: 'Grundlagen 82: Leiter', section: 'Strahlensatz und Peilen', variants: t82vars },
            { title: 'Grundlagen 83 a: Fehlende Strecke x', section: 'Strahlensatz und Peilen', variants: [t83a] },
            { title: 'Grundlagen 83 b: Fehlende Strecken x und y', section: 'Strahlensatz und Peilen', variants: [t83b] },
          ],
        },
        {
          title: 'Sinus, Kosinus und Tangens',
          description: 'Seiten und Winkel im rechtwinkligen Dreieck berechnen',
          level: 2,
          tasks: [
            { title: 'Grundlagen Beispiel 1: Seiten mit Sinus und Kosinus', section: 'Sinus, Kosinus und Tangens', variants: ex1vars },
            { title: 'Grundlagen Beispiel 2: Winkel mit dem Tangens', section: 'Winkel berechnen', variants: ex2vars },
            { title: 'Grundlagen 90 a: Dreieck (rechter Winkel bei C)', section: 'Sinus, Kosinus und Tangens', variants: [t90a] },
            { title: 'Grundlagen 90 b: Dreieck (rechter Winkel bei B)', section: 'Sinus, Kosinus und Tangens', variants: [t90b] },
            { title: 'Grundlagen 91 a: Tabelle', section: 'Sinus, Kosinus und Tangens', variants: [t91[0]] },
            { title: 'Grundlagen 91 b: Tabelle', section: 'Sinus, Kosinus und Tangens', variants: [t91[1]] },
            { title: 'Grundlagen 91 c: Tabelle', section: 'Sinus, Kosinus und Tangens', variants: [t91[2]] },
            { title: 'Grundlagen 92: Straßensteigung', section: 'Winkel berechnen', variants: t92vars },
            { title: 'Grundlagen 93: Wanderer', section: 'Sinus, Kosinus und Tangens', variants: t93vars },
            { title: 'Grundlagen 94: Turmhöhe', section: 'Sinus, Kosinus und Tangens', variants: t94vars },
            { title: 'Grundlagen 95: Leiter', section: 'Sinus, Kosinus und Tangens', variants: [t95] },
          ],
        },
        {
          title: 'Trigonometrie und Strahlensatz verbinden',
          description: 'Ein Dreieck im Dreieck: Längen berechnen',
          level: 3,
          tasks: [{ title: 'Grundlagen 96: s und w', section: 'Strahlensatz und Peilen', variants: [t96] }],
        },
        {
          title: 'Sinus- und Kosinussatz (E-Kurs)',
          description: 'Beliebige Dreiecke berechnen',
          level: 3,
          profiles: ['HS10', 'RS10', 'ERS10'],
          tasks: [
            { title: 'Grundlagen Beispiel: Kosinus- und Sinussatz', section: 'Sinus- und Kosinussatz im allgemeinen Dreieck', variants: cosVars },
            { title: 'Grundlagen 97 a/b: Winkel und Seite', section: 'Sinus- und Kosinussatz im allgemeinen Dreieck', variants: [t97[0]] },
            { title: 'Grundlagen 97 c/d: Höhe und Fläche', section: 'Sinus- und Kosinussatz im allgemeinen Dreieck', variants: [t97[1]] },
          ],
        },
      ],
    },
    {
      topic: 'Satz des Pythagoras',
      sections: [{
        title: 'Satz des Thales',
        md: L`**Satz des Thales:** Liegt die Ecke $C$ eines Dreiecks $ABC$ auf dem Halbkreis (**Thaleskreis**) über der Seite $c=\overline{AB}$, dann ist das Dreieck bei $C$ **rechtwinklig**.

**Umkehrung:** Zu jedem rechtwinkligen Dreieck kann man einen Thaleskreis zeichnen. Die **Hypotenuse** ist dabei der **Durchmesser** des Kreises.

**Konstruktion** (Hypotenuse $c=4\ \text{cm}$, Kathete $a=2{,}5\ \text{cm}$):
1. Strecke $c$ zeichnen, Mittelpunkt $M$ bestimmen.
2. Thaleskreis über $c$ zeichnen (Radius $2\ \text{cm}$ um $M$).
3. Kreis um $B$ mit Radius $2{,}5\ \text{cm}$ zeichnen. Der Schnittpunkt mit dem Thaleskreis ist $C$.

**Rechnerisch prüfen:** Liegt $C$ auf dem Thaleskreis, hat $C$ von $M$ den Abstand $\frac{c}{2}$.`,
      }],
      packages: [
        {
          title: 'Pythagoras anwenden',
          description: 'Höhe, Diagonalen, Streckenlängen im Koordinatensystem, Umfang und Fläche',
          level: 2,
          tasks: [
            { title: 'Grundlagen Beispiel: Gleichschenkliges Dreieck', section: 'Anwendungen im Raum und Alltag', variants: exIsoVars },
            { title: 'Grundlagen 84: Quader · Flächen- und Raumdiagonale', section: 'Anwendungen im Raum und Alltag', variants: quaderVars },
            { title: 'Grundlagen 85 a: Dreieck zeichnen', section: 'Der Satz des Pythagoras', variants: [t85a] },
            { title: 'Grundlagen 85 b: Streckenlänge c', section: 'Der Satz des Pythagoras', variants: [t85b] },
            { title: 'Grundlagen 86 a: Sechseck', section: 'Anwendungen im Raum und Alltag', variants: [t86a] },
            { title: 'Grundlagen 86 b: Trapez', section: 'Anwendungen im Raum und Alltag', variants: [t86b] },
          ],
        },
        {
          title: 'Satz des Thales',
          description: 'Rechtwinklige Dreiecke erkennen und konstruieren',
          level: 2,
          tasks: [
            { title: 'Grundlagen 87: Welche Dreiecke sind rechtwinklig?', section: 'Satz des Thales', variants: [t87] },
            { title: 'Grundlagen 88 a: Hypotenuse und Kathete', section: 'Satz des Thales', variants: [t88a] },
            { title: 'Grundlagen 88 b: Hypotenuse und Winkel', section: 'Satz des Thales', variants: [t88b] },
            { title: 'Grundlagen 88 c: Hypotenuse und Höhe', section: 'Satz des Thales', variants: [t88c] },
            { title: 'Grundlagen 89 a: Dreieck zeichnen', section: 'Satz des Thales', variants: [t89a] },
            { title: 'Grundlagen 89 b: Rechter Winkel mit Thales', section: 'Satz des Thales', variants: [t89b] },
            { title: 'Grundlagen 89 c: Fehlende Kathete', section: 'Satz des Thales', variants: [t89c] },
          ],
        },
      ],
    },
    {
      topic: 'Winkel, Dreiecke & Flächen',
      sections: [{
        title: 'Kreisausschnitt und Kreisring',
        md: L`Für einen ganzen Kreis gilt $u=2\pi r$ und $A=\pi r^2$.

**Kreisausschnitt (Kreissektor)** mit Mittelpunktswinkel $\alpha$: ein Teil der Kreisfläche, der anteilig $\frac{\alpha}{360^\circ}$ vom ganzen Kreis ausmacht.
- Kreisbogen: $b=2\pi r\cdot\dfrac{\alpha}{360^\circ}$
- Flächeninhalt: $A=\pi r^2\cdot\dfrac{\alpha}{360^\circ}$

> $\alpha=120^\circ$, $r=5\ \text{cm}$: $\frac{120}{360}=\frac{1}{3}$ → $b\approx10{,}47\ \text{cm}$, $A\approx26{,}18\ \text{cm}^2$.

**Kreisring:** zwei Kreise mit dem gleichen Mittelpunkt und den Radien $r_1>r_2$.
- Umfang: $u=u_1+u_2=2\pi(r_1+r_2)$
- Fläche: $A=A_1-A_2=\pi(r_1^2-r_2^2)$

> $r_1=10\ \text{m}$, $r_2=8\ \text{m}$: $u\approx113{,}10\ \text{m}$, $A\approx113{,}10\ \text{m}^2$.

**Hinweis:** Rechne mit dem $\pi$-Wert deines Taschenrechners, mit $3{,}14$ gibt es kleine Abweichungen.`,
      }],
      packages: [
        {
          title: 'Kreisausschnitt und Kreisring',
          description: 'Bogenlänge, Flächeninhalt, Kreisring, zusammengesetzte Figuren',
          level: 2,
          tasks: [
            { title: 'Grundlagen Beispiel: Kreisausschnitt', section: 'Kreisausschnitt und Kreisring', variants: sectorVars },
            { title: 'Grundlagen Beispiel: Kreisring', section: 'Kreisausschnitt und Kreisring', variants: ringVars },
            { title: 'Grundlagen 98 a: Kreisausschnitt', section: 'Kreisausschnitt und Kreisring', variants: [t98[0]] },
            { title: 'Grundlagen 98 b: Kreisausschnitt', section: 'Kreisausschnitt und Kreisring', variants: [t98[1]] },
            { title: 'Grundlagen 98 c: Kreisausschnitt', section: 'Kreisausschnitt und Kreisring', variants: [t98[2]] },
            { title: 'Grundlagen 99 a: Kreisring', section: 'Kreisausschnitt und Kreisring', variants: [t99[0]] },
            { title: 'Grundlagen 99 b: Kreisring', section: 'Kreisausschnitt und Kreisring', variants: [t99[1]] },
            { title: 'Grundlagen 99 c: Kreisring', section: 'Kreisausschnitt und Kreisring', variants: [t99[2]] },
            { title: 'Grundlagen 101: Dreieck und Kreis', section: 'Kreisausschnitt und Kreisring', variants: [t101] },
            { title: 'Grundlagen 102: Schwimmbecken und Weg', section: 'Kreisausschnitt und Kreisring', variants: [t102] },
          ],
        },
      ],
    },
    {
      topic: 'Körper: Oberfläche & Volumen',
      sections: [{
        title: 'Zusammengesetzte und unregelmäßige Körper',
        md: L`**Lösungsplan für unregelmäßig geformte Körper:**
1. **Zerlege** den Körper in Teilkörper, die du kennst (Quader, Zylinder, Kegel, Halbkugel …).
2. **Berechne** die Volumina der Teilkörper.
3. Fehlen Maße, wähle eine **Bezugsgröße** (z. B. eine bekannte Länge) und schätze die anderen Maße.
4. **Addiere** die Teilvolumina und **prüfe** das Ergebnis: Ist der Körper in Wirklichkeit größer oder kleiner als deine Teilkörper?

**Wichtige Formeln:**
- Kegel: $V=\frac{1}{3}\pi r^2 h_K$ · $M=\pi r s$ · $O=\pi r^2+\pi r s$ mit $s=\sqrt{r^2+h_K^2}$
- Pyramide: $V=\frac{1}{3}G\,h_K$ · $O=G+M$
- Kugel: $V=\frac{4}{3}\pi r^3$ · $O=4\pi r^2$
- Halbkugel: $V=\frac{2}{3}\pi r^3$ · gewölbte Fläche $2\pi r^2$

**Wie ändert sich das Volumen?** Wird eine Länge verdoppelt, wird die Fläche $2^2=4$-mal und das Volumen $2^3=8$-mal so groß (bei allen Maßen gleichzeitig).`,
      }],
      packages: [
        {
          title: 'Kegel und Pyramide',
          description: 'Volumen von Spitzkörpern berechnen und umstellen',
          level: 2,
          tasks: [
            { title: 'Grundlagen Beispiel: Kegelvolumen', section: 'Pyramide, Kegel und Kugel', variants: coneVars },
            { title: 'Grundlagen 104 b: Pyramidenvolumen', section: 'Pyramide, Kegel und Kugel', variants: pyrVars },
            { title: 'Grundlagen 105 a: Faschingshut · Volumen', section: 'Pyramide, Kegel und Kugel', variants: [t105a] },
            { title: 'Grundlagen 106 a: Kegel · Höhe', section: 'Pyramide, Kegel und Kugel', variants: [t106[0]] },
            { title: 'Grundlagen 106 b: Kegel · Radius', section: 'Pyramide, Kegel und Kugel', variants: [t106[1]] },
            { title: 'Grundlagen 107: Pyramide', section: 'Pyramide, Kegel und Kugel', variants: [t107] },
            { title: 'Grundlagen 108 a: Kegelkerze', section: 'Pyramide, Kegel und Kugel', variants: [t108a] },
            { title: 'Grundlagen 108 b: Pyramidenkerze', section: 'Pyramide, Kegel und Kugel', variants: [t108b] },
            { title: 'Grundlagen 109 a: Höhe verdoppelt', section: 'Pyramide, Kegel und Kugel', variants: [t109[0]] },
            { title: 'Grundlagen 109 b: Grundseite verdoppelt', section: 'Pyramide, Kegel und Kugel', variants: [t109[1]] },
          ],
        },
        {
          title: 'Kugel',
          description: 'Volumen und Oberfläche von Kugeln, Umkehraufgaben',
          level: 2,
          tasks: [
            { title: 'Grundlagen 110 a: Kugel (Radius)', section: 'Pyramide, Kegel und Kugel', variants: ballVars },
            { title: 'Grundlagen 110 b: Kugel (Durchmesser)', section: 'Pyramide, Kegel und Kugel', variants: [t110b] },
            { title: 'Grundlagen 111: Eiskugeln', section: 'Pyramide, Kegel und Kugel', variants: [t111] },
            { title: 'Grundlagen 112: Tischtennisbälle', section: 'Pyramide, Kegel und Kugel', variants: [t112] },
            { title: 'Grundlagen 113: Murmeln', section: 'Pyramide, Kegel und Kugel', variants: [t113] },
            { title: 'Grundlagen 114 a: Radius aus dem Volumen', section: 'Pyramide, Kegel und Kugel', variants: [t114[0]] },
            { title: 'Grundlagen 114 b: Radius aus der Oberfläche', section: 'Pyramide, Kegel und Kugel', variants: [t114[1]] },
            { title: 'Grundlagen 115 a: Radius verdoppelt', section: 'Pyramide, Kegel und Kugel', variants: [t115[0]] },
            { title: 'Grundlagen 115 b: Radius vervierfacht', section: 'Pyramide, Kegel und Kugel', variants: [t115[1]] },
          ],
        },
        {
          title: 'Zusammengesetzte Körper und Vermischtes',
          description: 'Maurerlot, Kuchenformen, Geschenkverpackung',
          level: 3,
          tasks: [
            { title: 'Grundlagen 122 a: Maurerlot · Masse', section: 'Zusammengesetzte und unregelmäßige Körper', variants: [t122a] },
            { title: 'Grundlagen 123 a: Kuchenform · Teig', section: 'Prisma und Zylinder', variants: [t123[0]] },
            { title: 'Grundlagen 123 b: Kuchen · Fondant', section: 'Prisma und Zylinder', variants: [t123[1]] },
            { title: 'Grundlagen 123 c: Hochzeitstorte', section: 'Prisma und Zylinder', variants: [t123[2]] },
            { title: 'Grundlagen 124 a: Geschenkpapier', section: 'Prisma und Zylinder', variants: [t124[0]] },
            { title: 'Grundlagen 124 b: Geschenkband', section: 'Prisma und Zylinder', variants: [t124[1]] },
          ],
        },
        {
          title: 'Mantel- und Oberfläche von Kegeln (E-Kurs)',
          description: 'Seitenlinie, Mantelfläche, Oberfläche',
          level: 3,
          profiles: ['HS10', 'RS10', 'ERS10'],
          tasks: [
            { title: 'Grundlagen Beispiel b / 103 c: Kegeloberfläche', section: 'Pyramide, Kegel und Kugel', variants: coneOVars },
            { title: 'Grundlagen 105 b: Faschingshut · Pappe', section: 'Pyramide, Kegel und Kugel', variants: [t105b] },
            { title: 'Grundlagen 122 b: Maurerlot · Oberfläche', section: 'Zusammengesetzte und unregelmäßige Körper', variants: [t122b] },
          ],
        },
      ],
    },
  ];
}
