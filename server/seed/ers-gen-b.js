// Erw. RS (ERS10): schwierigere Fassungen der RS10-Diagnoseaufgaben, Teil B
// (Quadratische Funktionen, Wachstum, Flächen, Pythagoras, Trigonometrie, Körper, Daten, Wahrscheinlichkeit).
import { de, dt, num, fields, sel, expr, approx, table, fieldsWith, lin } from './grundlagen/kit.js';
import { triangleGH, composite, cylinder } from './figures.js';
import { zuordnenTask, curve } from './diag-gls-wachstum.js';

const r2 = (n) => Math.round(n * 100) / 100;
const r6 = (n) => Math.round(n * 1e6) / 1e6;
const par = (x) => (x < 0 ? `(${de(x)})` : de(x));
const V = (prompt, answer, solution, hint = '') => ({ prompt, answer, solution, hint, source: '' });
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const SAY_P = '*Gib die Wahrscheinlichkeit als Bruch (z. B. 3/8), als Dezimalzahl oder in Prozent an.*';

// ------------------------------------------------------------------ Quadratische Funktionen & Gleichungen
const quad = (a, b, c) => `${a === 1 ? '' : a === -1 ? '-' : de(a)}x^2${b === 0 ? '' : `${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : de(Math.abs(b))}x`}${c === 0 ? '' : `${c < 0 ? '-' : '+'}${de(Math.abs(c))}`}`;

export function quadWertetabelle(r) {
  const a = r.pick([1, 1, -1, 2]), xS = r.int(-2, 3), b = -2 * a * xS, c = r.int(-5, 5), f = (x) => a * x * x + b * x + c;
  const x1 = r.pick([-2, -1]), x2 = r.int(4, 6);
  return V(
    `Die Toreinfahrt hat die Form einer Parabel mit der Funktionsgleichung $y=${quad(a, b, c)}$.\n\na) Berechne $y$ für $x=${x1}$ und für $x=${x2}$.\n\nb) An welcher Stelle $x$ liegt der Scheitelpunkt?`,
    fields(num(f(x1), { label: `a) y(${x1}) =` }), num(f(x2), { label: `y(${x2}) =` }), num(xS, { label: 'b) x des Scheitelpunkts =' })),
    `a) $y(${x1})=${de(a)}\\cdot${par(x1)}^2${b < 0 ? '-' : '+'}${de(Math.abs(b))}\\cdot${par(x1)}${c < 0 ? '-' : '+'}${de(Math.abs(c))}=${de(f(x1))}$ und $y(${x2})=${de(f(x2))}$\n\nb) Der Scheitelpunkt liegt in der Mitte zwischen den Stellen mit gleichem $y$-Wert, also bei $x=-\\frac{b}{2a}=-\\frac{${de(b)}}{${de(2 * a)}}=${de(xS)}$.`,
    'Setze die $x$-Werte in die Funktionsgleichung ein.',
  );
}

export function quadRein(r) {
  const a = r.pick([2, 3, 5, 0.5]), k = r.int(3, 9), c = a * k * k;
  const d = r.int(1, 5), e = r.int(2, 8), sign = r.pick([-1, 1]);
  const inner = sign < 0 ? `x-${d}` : `x+${d}`;
  const big = -sign * d + e, small = -sign * d - e;
  const [hi, lo] = [Math.max(big, small), Math.min(big, small)];
  return V(
    `Löse die Gleichungen. Gib immer zuerst die größere Lösung an.\n\na) $${de(a)}x^2-${de(c)}=0$\n\nb) $(${inner})^2=${e * e}$`,
    fields(num(k, { label: 'a) x₁ =' }), num(-k, { label: 'x₂ =' }), num(hi, { label: 'b) x₁ =' }), num(lo, { label: 'x₂ =' })),
    `a) $${de(a)}x^2=${de(c)} \\Rightarrow x^2=${k * k} \\Rightarrow x=\\pm${k}$\n\nb) Wurzel ziehen: $${inner}=\\pm${e}$, also $x=${de(-sign * d)}\\pm${e}$ und damit $x_1=${hi}$, $x_2=${lo}$.`,
    'Löse zuerst nach $x^2$ auf und ziehe dann die Wurzel (positive und negative Lösung).',
  );
}

export function quadPQ(r) {
  const a = r.pick([1, 1, 2]), r1 = r.int(-9, 7), r2_ = r.int(-8, 10);
  if (r1 >= r2_ || r2_ - r1 > 14) return null;
  const b = -a * (r1 + r2_), c = a * r1 * r2_;
  const p = b / a, q = c / a;
  return V(
    `Löse die quadratische Gleichung $${quad(a, b, c)}=0$. Gib zuerst die kleinere Lösung an.\n\nIn welcher $x$-Koordinate liegt der Scheitelpunkt der zugehörigen Parabel $y=${quad(a, b, c)}$?`,
    fields(num(r1, { label: 'x₁ =' }), num(r2_, { label: 'x₂ =' }), num((r1 + r2_) / 2, { label: 'x des Scheitelpunkts =' })),
    `${a === 1 ? '' : `Teile durch $${a}$: $x^2${p < 0 ? '-' : '+'}${de(Math.abs(p))}x${q < 0 ? '-' : '+'}${de(Math.abs(q))}=0$\n\n`}p-q-Formel mit $p=${de(p)}$ und $q=${de(q)}$:\n\n$x_{1,2}=-\\frac{p}{2}\\pm\\sqrt{\\left(\\frac{p}{2}\\right)^2-q}=${de(-p / 2)}\\pm\\sqrt{${de((p / 2) ** 2 - q)}}=${de(-p / 2)}\\pm${de((r2_ - r1) / 2)}$\n\nAlso $x_1=${r1}$ und $x_2=${r2_}$.\n\nDer Scheitelpunkt liegt in der Mitte der Nullstellen: $x_S=\\frac{${r1}+${par(r2_)}}{2}=${de((r1 + r2_) / 2)}$.`,
    'Bringe die Gleichung auf die Form $x^2+px+q=0$ und nutze die p-q-Formel.',
  );
}

export function quadFlug(r) {
  const a = r.pick([0.04, 0.05, 0.08, 0.1]), k = r.int(5, 10), p = r.int(3, 7), q = r2(a * k * k), d = r.pick([2 * p, p + 2, p - 1]);
  if (q - a * p * p < 0.4) return null;
  const y0 = r2(q - a * p * p), yd = r2(q - a * (d - p) ** 2);
  return V(
    `Die Flugbahn eines Balls wird beschrieben durch $y=-${de(a)}(x-${p})^2+${de(q)}$ ($x$ und $y$ in Metern).\n\na) Wie hoch ist der Ball beim Abwurf ($x=0$)?\n\nb) Nach wie vielen Metern landet der Ball auf dem Boden?\n\nc) Wie hoch ist der Ball bei $x=${d}$?`,
    fields(approx(y0, { label: 'a) Höhe:', unit: 'm', tol: 0.011 }), approx(p + k, { label: 'b) Weite:', unit: 'm', tol: 0.011 }), approx(yd, { label: `c) y(${d}) =`, unit: 'm', tol: 0.011 })),
    `a) $y(0)=-${de(a)}\\cdot(0-${p})^2+${de(q)}=${de(y0)}$ m\n\nb) $y=0$: $${de(a)}(x-${p})^2=${de(q)} \\Rightarrow (x-${p})^2=${k * k} \\Rightarrow x-${p}=\\pm${k}$. Die Lösung $x=${p - k}$ liegt hinter dem Abwurf, also landet der Ball bei $x=${p + k}$ m.\n\nc) $y(${d})=-${de(a)}\\cdot(${d - p})^2+${de(q)}=${de(yd)}$ m`,
    'Beim Landen ist $y=0$. Von den zwei Lösungen passt nur die positive.',
  );
}

// ------------------------------------------------------------------ Wachstum & Exponentialfunktionen
export function wachstumFaktor(r) {
  const a = r.pick([120, 250, 400, 800, 1200, 2500]), growth = r.pick([true, true, false]);
  const q = growth ? r.pick([1.05, 1.075, 1.12, 1.35, 1.6]) : r.pick([0.95, 0.85, 0.7, 0.92, 0.6]), pc = r6(Math.abs(q - 1) * 100);
  const [thing, unit] = growth ? r.pick([['Die Zahl $y$ der Follower eines Accounts', 'Wochen'], ['Die Anzahl $y$ der Bakterien in einer Kultur', 'Stunden']]) : r.pick([['Der Wert $y$ eines Motorrollers (in €)', 'Jahren'], ['Die Menge $y$ eines Wirkstoffs im Blut (in mg)', 'Stunden']]);
  return V(
    `${thing} wird durch die Exponentialfunktion $y=${de(a, 0)}\\cdot${de(q, 3)}^x$ beschrieben ($x$ in ${unit}).\n\nGib den Anfangswert und den Wachstumsfaktor an. Handelt es sich um Zunahme oder Abnahme, und um wie viel Prozent ändert sich der Wert in jedem Zeitschritt?`,
    fields(num(a, { label: 'Anfangswert:' }), num(q, { label: 'Wachstumsfaktor q =', tol: 0.0001 }), sel(['Zunahme', 'Abnahme'], growth ? 'Zunahme' : 'Abnahme', 'Art der Änderung:'), num(pc, { label: 'Änderung pro Schritt:', unit: '%', tol: 0.05 })),
    `Die Funktion hat die Form $y=a\\cdot q^x$.\n\n- Anfangswert: $a=${de(a, 0)}$\n- Wachstumsfaktor: $q=${de(q, 3)}$\n- ${growth ? `$q>1$: **Zunahme** um $${de(q, 3)}-1=${de(q - 1, 3)}$, das sind **${de(pc)} %**` : `$q<1$: **Abnahme** um $1-${de(q, 3)}=${de(1 - q, 3)}$, das sind **${de(pc)} %**`}`,
    'Der Anfangswert steht vor der Potenz, der Wachstumsfaktor ist die Basis.',
  );
}

export function wachstumVerlauf(r) {
  const qs = r.shuffle([r.pick([1.04, 1.15, 1.4, 1.75]), r.pick([0.6, 0.75, 0.9, 0.96]), 1, r.pick([2, 3, 1.25, 0.5])]).slice(0, 3);
  if (new Set(qs).size < 3) return null;
  const as = qs.map(() => r.pick([1, 2, 3, 0.5, 4]));
  const kind = (q) => (q > 1 ? 'steigend' : q < 1 ? 'fallend' : 'waagerecht');
  const txt = (a, q) => `${a === 1 ? '' : `${dt(a)}·`}${dt(q)}ˣ`;
  const tex = (a, q) => `${a === 1 ? '' : `${de(a)}\\cdot`}${de(q, 3)}^x`;
  return V(
    `Bestimme für jede Funktion den Verlauf des Graphen (steigend, fallend oder waagerecht) und gib an, um wie viel Prozent sich $y$ pro Schritt ändert (Betrag, ohne Vorzeichen).\n\n${qs.map((q, i) => `- ${'abc'[i]}) $y=${tex(as[i], q)}$`).join('\n')}`,
    fields(...qs.flatMap((q, i) => [sel(['steigend', 'fallend', 'waagerecht'], kind(q), `${'abc'[i]}) y = ${txt(as[i], q)}:`), num(r6(Math.abs(q - 1) * 100), { label: 'Änderung:', unit: '%', tol: 0.05 })])),
    qs.map((q, i) => `${'abc'[i]}) $q=${de(q, 3)}$: **${kind(q)}**${q === 1 ? ', keine Änderung (0 %)' : `, Änderung um $|${de(q, 3)}-1|\\cdot100=${de(Math.abs(q - 1) * 100)}\\,\\%$`}`).join('\n\n'),
    'Ist $q>1$, steigt der Graph, bei $0<q<1$ fällt er, bei $q=1$ bleibt er waagerecht.',
  );
}

export function wachstumTabelle(r) {
  const a = r.pick([500, 800, 1200, 2000]), q = r.pick([1.25, 1.5, 0.85, 0.8, 0.9, 1.6]), xs = range(0, 5);
  const vals = xs.map((x) => r6(a * q ** x)), growth = q > 1;
  return V(
    `${growth ? 'Eine Bakterienkultur' : 'Eine Medikamentenmenge'} wird durch $y=${de(a, 0)}\\cdot${de(q, 2)}^x$ beschrieben ($x$ in Stunden).\n\nErstelle eine Wertetabelle für die ersten fünf Stunden (auf ganze Zahlen runden). Beim Ausfüllen entsteht unten der Graph.`,
    fieldsWith(vals.map((v) => approx(v, { tol: Number.isInteger(v) ? 0 : 0.6 })), table({ from: 0, cols: xs, rows: ['y'], corner: 'Stunde x', plot: { xs, xlabel: 'Stunden x', ylabel: 'y' } })),
    `Setze $x=0,1,\\dots,5$ ein oder multipliziere schrittweise mit $${de(q, 2)}$.\n\n| $x$ | ${xs.join(' | ')} |\n|---|${xs.map(() => '---').join('|')}|\n| $y$ | ${vals.map((v) => de(Math.round(v), 0)).join(' | ')} |\n\nDer Graph ${growth ? 'steigt immer steiler' : 'fällt, wird aber immer flacher'}.`,
    `Der Startwert bei $x=0$ ist ${de(a, 0)}. Für den nächsten Wert multiplizierst du mit $${de(q, 2)}$.`,
  );
}

export function wachstumGraph(r, i) {
  const sets = [
    { fig: { xmin: -3.5, xmax: 3.5, ymax: 6 }, curves: [curve('A', 1, 1.4, 'schwarz', false, 2.4), curve('B', 4, 0.6, 'rot', true, -0.9), curve('C', 2, 1.4, 'rot', false, 1.8), curve('D', 1, 0.6, 'schwarz', true, -1.9)], extra: [{ a: 1, q: 2 }, { a: 2, q: 0.6 }] },
    { fig: { xmin: -4, xmax: 4, ymax: 5.5 }, curves: [curve('A', 3, 0.7, 'schwarz', false, -3.2), curve('B', 1, 1.3, 'rot', true, 3.2), curve('C', 3, 1.3, 'schwarz', true, 1.4), curve('D', 1, 0.7, 'rot', false, -1.8)], extra: [{ a: 2, q: 1.3 }, { a: 3, q: 0.5 }] },
  ];
  const s = sets[i % sets.length];
  return zuordnenTask({ figure: { ...s.fig, curves: s.curves }, drawn: s.curves, extra: s.extra, source: '' });
}

export function wachstumHalbwert(r) {
  const T = r.pick([2, 3, 4, 5]), m0 = r.pick([80, 120, 160, 200]), n = r.pick([3, 4]), tt = T * r.pick([1.5, 2.5]);
  const tgt = r2(m0 / 2 ** n * 1.2), need = Math.ceil(T * Math.log2(m0 / tgt) - 1e-9);
  const at = m0 * 0.5 ** (tt / T);
  return V(
    `Ein Medikament hat im Blut eine Halbwertszeit von ${T} Stunden. Um 7:00 Uhr werden $${m0}$ mg eingenommen.\n\na) Stelle eine Funktionsgleichung auf, die die Menge $y$ (in mg) in Abhängigkeit von der Zeit $x$ (in Stunden) beschreibt.\n\nb) Berechne die Menge nach ${dt(tt)} Stunden. (auf zwei Nachkommastellen runden)\n\nc) Nach wie vielen Stunden ist die Menge zum ersten Mal kleiner als $${de(tgt)}$ mg? (ganze Stunden, durch Probieren)`,
    fields(expr(`${m0}*0.5^(x/${T})`, { label: 'a) y =', vars: ['x'] }), approx(at, { label: `b) Menge nach ${dt(tt)} h:`, unit: 'mg', tol: 0.06 }), num(need, { label: 'c) nach', unit: 'Stunden' })),
    `a) Die Menge halbiert sich alle ${T} Stunden: $y=${m0}\\cdot0{,}5^{\\frac{x}{${T}}}$\n\nb) $y=${m0}\\cdot0{,}5^{\\frac{${dt(tt)}}{${T}}}\\approx${de(at)}$ mg\n\nc) Probieren: nach ${need - 1} Stunden sind es $${de(m0 * 0.5 ** ((need - 1) / T))}$ mg (noch nicht kleiner), nach ${need} Stunden $${de(m0 * 0.5 ** (need / T))}$ mg. Nach **${need} Stunden** ist die Menge kleiner als $${de(tgt)}$ mg.`,
    'Im Exponenten steht die Zeit geteilt durch die Halbwertszeit.',
  );
}

// ------------------------------------------------------------------ Winkel, Dreiecke & Flächen
export function flaecheDreieck(r) {
  const g = r.pick([7.5, 9, 12, 12.5, 15, 18]), h = r.pick([4, 5.5, 6, 7.2, 8, 9]), A = r6(g * h / 2);
  const url = triangleGH({ g: `g = ${dt(g)} cm`, h: `h = ${dt(h)} cm` });
  return V(
    `Berechne den Flächeninhalt des Dreiecks.\n\n![Dreieck](${url})\n\nEin zweites Dreieck hat dieselbe Grundseite, aber die doppelte Höhe. Wie groß ist sein Flächeninhalt?`,
    fields(num(A, { label: 'A =', unit: 'cm²' }), num(2 * A, { label: 'A₂ =', unit: 'cm²' })),
    `$A=\\frac{g\\cdot h}{2}=\\frac{${de(g)}\\cdot${de(h)}}{2}=${de(A)}\\text{ cm}^2$\n\nBei doppelter Höhe verdoppelt sich die Fläche: $${de(A)}\\cdot2=${de(2 * A)}\\text{ cm}^2$.`,
    '$A=\\frac{g\\cdot h}{2}$',
  );
}

export function flaecheKreis(r) {
  const d = r.pick([1.2, 1.8, 2.4, 3, 3.6, 5]), rr = d / 2;
  return V(
    `Ein runder Tisch hat einen Durchmesser von $${de(d)}\\text{ m}$. Runde auf zwei Nachkommastellen.\n\na) Berechne den Flächeninhalt der Tischplatte.\n\nb) Berechne den Umfang der Tischplatte.\n\nc) Wie groß wäre der Radius eines Tisches mit doppelt so großer Fläche?`,
    fields(approx(r2(Math.PI * rr * rr), { label: 'a) A =', unit: 'm²', tol: 0.011 }), approx(r2(Math.PI * d), { label: 'b) u =', unit: 'm', tol: 0.011 }), approx(r2(rr * Math.SQRT2), { label: 'c) r =', unit: 'm', tol: 0.011 })),
    `Radius: $r=${de(d)}:2=${de(rr)}$ m\n\na) $A=\\pi r^2=\\pi\\cdot${de(rr)}^2\\approx${de(Math.PI * rr * rr)}\\text{ m}^2$\n\nb) $u=\\pi d=\\pi\\cdot${de(d)}\\approx${de(Math.PI * d)}$ m\n\nc) Doppelte Fläche: $\\pi r'^2=2\\pi r^2 \\Rightarrow r'=r\\sqrt2=${de(rr)}\\cdot\\sqrt2\\approx${de(rr * Math.SQRT2)}$ m`,
    '$A=\\pi r^2$ und $u=\\pi d$. Bei doppelter Fläche wird der Radius nicht verdoppelt.',
  );
}

export function flaecheZusammen(r) {
  const w = r.pick([6, 8, 10, 12, 14]), h = r.pick([4, 5, 6, 7, 9]), url = composite({ a: `${w} cm`, b: `${h} cm` });
  const A = w * h + Math.PI * (w / 2) ** 2 / 2, u = w + 2 * h + Math.PI * w / 2;
  return V(
    `Die Figur besteht aus einem Rechteck und einem aufgesetzten Halbkreis.\n\n![Rechteck mit Halbkreis](${url})\n\na) Berechne den Flächeninhalt der Figur.\n\nb) Berechne den Umfang der Figur (die gestrichelte Linie gehört nicht dazu).`,
    fields(approx(r2(A), { label: 'a) A =', unit: 'cm²', tol: 0.02 }), approx(r2(u), { label: 'b) u =', unit: 'cm', tol: 0.02 })),
    `Der Halbkreis hat den Durchmesser $${w}$ cm, also $r=${w / 2}$ cm.\n\na) Rechteck: $${w}\\cdot${h}=${w * h}\\text{ cm}^2$, Halbkreis: $\\frac{\\pi\\cdot${w / 2}^2}{2}\\approx${de(Math.PI * (w / 2) ** 2 / 2)}\\text{ cm}^2$, zusammen $A\\approx${de(A)}\\text{ cm}^2$\n\nb) untere Seite $${w}$ cm, zwei Seiten $2\\cdot${h}$ cm, Halbkreisbogen $\\pi\\cdot${w / 2}\\approx${de(Math.PI * w / 2)}$ cm: $u\\approx${de(u)}$ cm`,
    'Zerlege die Figur in Rechteck und Halbkreis. Der Umfang besteht aus drei geraden Stücken und einem Bogen.',
  );
}

// ------------------------------------------------------------------ Satz des Pythagoras
export function pythHyp(r) {
  const a = r.int(30, 120) / 10, b = r.int(30, 120) / 10, c = Math.sqrt(a * a + b * b);
  return V(
    `In einem rechtwinkligen Dreieck sind die Katheten $a=${de(a)}\\text{ cm}$ und $b=${de(b)}\\text{ cm}$ lang. Runde auf zwei Nachkommastellen.\n\na) Berechne die Hypotenuse $c$.\n\nb) Berechne den Umfang des Dreiecks.\n\nc) Berechne den Flächeninhalt des Dreiecks.`,
    fields(approx(r2(c), { label: 'a) c =', unit: 'cm', tol: 0.011 }), approx(r2(a + b + c), { label: 'b) u =', unit: 'cm', tol: 0.02 }), approx(r2(a * b / 2), { label: 'c) A =', unit: 'cm²', tol: 0.011 })),
    `a) $c=\\sqrt{a^2+b^2}=\\sqrt{${de(a)}^2+${de(b)}^2}\\approx${de(c)}$ cm\n\nb) $u=a+b+c=${de(a)}+${de(b)}+${de(c)}\\approx${de(a + b + c)}$ cm\n\nc) Die Katheten sind Grundseite und Höhe: $A=\\frac{a\\cdot b}{2}=${de(a * b / 2)}\\text{ cm}^2$`,
    'Satz des Pythagoras: $a^2+b^2=c^2$',
  );
}

export function pythKathete(r) {
  const L = r.pick([4.5, 5.2, 6, 6.5, 7.5]), h = r2(L * r.pick([0.8, 0.85, 0.9])), d2 = r.pick([1.2, 1.5, 1.8]);
  const x = Math.sqrt(L * L - h * h), h2 = Math.sqrt(L * L - d2 * d2);
  return V(
    `Eine Leiter ist $${de(L)}\\text{ m}$ lang und wird in $${de(h)}\\text{ m}$ Höhe an eine Wand gelehnt. Runde auf zwei Nachkommastellen.\n\na) Wie weit steht der Fuß der Leiter von der Wand entfernt?\n\nb) Wie hoch reicht die Leiter, wenn der Fuß $${de(d2)}\\text{ m}$ von der Wand entfernt steht?`,
    fields(approx(r2(x), { label: 'a) Abstand:', unit: 'm', tol: 0.011 }), approx(r2(h2), { label: 'b) Höhe:', unit: 'm', tol: 0.011 })),
    `a) Die Leiter ist die Hypotenuse: $x=\\sqrt{${de(L)}^2-${de(h)}^2}\\approx${de(x)}$ m\n\nb) $h=\\sqrt{${de(L)}^2-${de(d2)}^2}\\approx${de(h2)}$ m`,
    'Die Leiter ist die Hypotenuse, die Wand und der Boden sind die Katheten.',
  );
}

export function pythRaum(r) {
  const a = r.pick([6, 8, 9, 12]), b = r.pick([4, 5, 7, 8]), c = r.pick([3, 5, 6, 10]), d = Math.sqrt(a * a + b * b), e = Math.sqrt(a * a + b * b + c * c);
  const s = r.pick([Math.floor(e), Math.ceil(e) + 1]);
  return V(
    `Ein Quader hat die Kantenlängen $a=${a}\\text{ cm}$, $b=${b}\\text{ cm}$ und $c=${c}\\text{ cm}$. Runde auf zwei Nachkommastellen.\n\na) Berechne die Diagonale $d$ der Grundfläche.\n\nb) Berechne die Raumdiagonale $e$.\n\nc) Passt ein Stab der Länge $${s}\\text{ cm}$ schräg in den Quader?`,
    fields(approx(r2(d), { label: 'a) d =', unit: 'cm', tol: 0.011 }), approx(r2(e), { label: 'b) e =', unit: 'cm', tol: 0.011 }), sel(['ja', 'nein'], s <= e ? 'ja' : 'nein', 'c) Passt der Stab hinein?')),
    `a) $d=\\sqrt{${a}^2+${b}^2}\\approx${de(d)}$ cm\n\nb) $e=\\sqrt{d^2+c^2}=\\sqrt{${a}^2+${b}^2+${c}^2}\\approx${de(e)}$ cm\n\nc) Die Raumdiagonale ist die längste Strecke im Quader. ${s <= e ? `Der Stab ($${s}$ cm) ist nicht länger als $${de(e)}$ cm, er passt.` : `Der Stab ($${s}$ cm) ist länger als $${de(e)}$ cm, er passt nicht.`}`,
    'Wende den Satz des Pythagoras zweimal an: erst in der Grundfläche, dann im Dreieck mit der Raumdiagonale.',
  );
}

// ------------------------------------------------------------------ Trigonometrie & Ähnlichkeit
const rad = (g) => (g * Math.PI) / 180;
const deg = (x) => (x * 180) / Math.PI;

export function trigSeiten(r) {
  const al = r.pick([25, 32, 38, 42, 55, 62]), c = r.pick([6, 8.5, 10, 12, 15]);
  return V(
    `In einem rechtwinkligen Dreieck ist die Hypotenuse $c=${de(c)}\\text{ cm}$ lang und der Winkel $\\alpha=${al}°$. Runde auf zwei Nachkommastellen.\n\na) Berechne die Gegenkathete $a$ von $\\alpha$.\n\nb) Berechne die Ankathete $b$ von $\\alpha$.`,
    fields(approx(r2(c * Math.sin(rad(al))), { label: 'a) a =', unit: 'cm', tol: 0.011 }), approx(r2(c * Math.cos(rad(al))), { label: 'b) b =', unit: 'cm', tol: 0.011 })),
    `a) $\\sin\\alpha=\\frac{a}{c} \\Rightarrow a=c\\cdot\\sin${al}°=${de(c)}\\cdot\\sin${al}°\\approx${de(c * Math.sin(rad(al)))}$ cm\n\nb) $\\cos\\alpha=\\frac{b}{c} \\Rightarrow b=c\\cdot\\cos${al}°\\approx${de(c * Math.cos(rad(al)))}$ cm`,
    'Gegenkathete: Sinus. Ankathete: Kosinus.',
  );
}

export function trigWinkel(r) {
  const h = r.pick([0.9, 1.2, 1.5, 1.8]), l = r.pick([8, 10, 12, 15]);
  return V(
    `Eine Rampe überwindet einen Höhenunterschied von $${de(h)}\\text{ m}$ auf einer waagerechten Strecke von $${de(l)}\\text{ m}$.\n\na) Berechne den Steigungswinkel $\\alpha$ der Rampe (auf eine Nachkommastelle).\n\nb) Wie lang ist die Rampe selbst? (auf zwei Nachkommastellen)`,
    fields(approx(Math.round(deg(Math.atan(h / l)) * 10) / 10, { label: 'a) α =', unit: '°', tol: 0.06 }), approx(r2(Math.sqrt(h * h + l * l)), { label: 'b) Länge:', unit: 'm', tol: 0.011 })),
    `a) $\\tan\\alpha=\\frac{${de(h)}}{${de(l)}} \\Rightarrow \\alpha=\\tan^{-1}\\left(\\frac{${de(h)}}{${de(l)}}\\right)\\approx${de(deg(Math.atan(h / l)), 1)}°$\n\nb) $s=\\sqrt{${de(h)}^2+${de(l)}^2}\\approx${de(Math.sqrt(h * h + l * l))}$ m`,
    'Höhe und waagerechte Strecke sind Gegen- und Ankathete: $\\tan\\alpha=\\frac{\\text{Gegenkathete}}{\\text{Ankathete}}$',
  );
}

export function trigTurm(r) {
  const dd = r.pick([30, 40, 50, 60]), al = r.pick([28, 35, 38, 42, 48]), eye = r.pick([1.5, 1.6, 1.7]);
  const hh = dd * Math.tan(rad(al)) + eye, s = dd / Math.cos(rad(al));
  return V(
    `Von einem Punkt in $${dd}\\text{ m}$ Entfernung vom Fuß eines Turms sieht man die Turmspitze unter einem Höhenwinkel von $${al}°$. Die Augenhöhe beträgt $${de(eye)}\\text{ m}$. Runde auf zwei Nachkommastellen.\n\na) Wie hoch ist der Turm?\n\nb) Wie weit ist die Turmspitze vom Auge des Beobachters entfernt?`,
    fields(approx(r2(hh), { label: 'a) Turmhöhe:', unit: 'm', tol: 0.02 }), approx(r2(s), { label: 'b) Entfernung:', unit: 'm', tol: 0.02 })),
    `a) Höhe über der Augenhöhe: $${dd}\\cdot\\tan${al}°\\approx${de(dd * Math.tan(rad(al)))}$ m. Dazu kommt die Augenhöhe: $${de(dd * Math.tan(rad(al)))}+${de(eye)}\\approx${de(hh)}$ m.\n\nb) $\\cos${al}°=\\frac{${dd}}{s} \\Rightarrow s=\\frac{${dd}}{\\cos${al}°}\\approx${de(s)}$ m`,
    'Der Höhenwinkel gehört zum rechtwinkligen Dreieck zwischen Auge, Turmspitze und Punkt auf Augenhöhe über dem Turmfuß.',
  );
}

// ------------------------------------------------------------------ Körper
export function koerperZylinder(r) {
  const rr = r.pick([3, 4, 5, 6]), h = r.pick([8, 10, 12, 15]), url = cylinder({ r: `r = ${rr} cm`, h: `h = ${h} cm` }), v = Math.PI * rr * rr * h;
  return V(
    `Eine Dose hat die Form eines Zylinders. Runde auf zwei Nachkommastellen.\n\n![Zylinder](${url})\n\na) Berechne das Volumen in cm³.\n\nb) Wie viele Liter passen in die Dose?`,
    fields(approx(r2(v), { label: 'a) V =', unit: 'cm³', tol: 0.02 }), approx(r2(v / 1000), { label: 'b) Inhalt:', unit: 'Liter', tol: 0.011 })),
    `a) $V=\\pi r^2 h=\\pi\\cdot${rr}^2\\cdot${h}\\approx${de(v)}\\text{ cm}^3$\n\nb) $1\\text{ Liter}=1000\\text{ cm}^3$: $${de(v)}:1000\\approx${de(v / 1000)}$ Liter`,
    '$V=\\pi\\cdot r^2\\cdot h$',
  );
}

export function koerperOberflaeche(r) {
  const rr = r.pick([3, 4, 5, 6.5]), h = r.pick([7, 9, 12, 15]), url = cylinder({ r: `r = ${dt(rr)} cm`, h: `h = ${h} cm` });
  const M = 2 * Math.PI * rr * h, O = 2 * Math.PI * rr * rr + M;
  return V(
    `Ein zylinderförmiger Behälter (mit Deckel) wird aus Blech gefertigt. Runde auf zwei Nachkommastellen.\n\n![Zylinder](${url})\n\na) Berechne die Mantelfläche.\n\nb) Berechne die gesamte Oberfläche.`,
    fields(approx(r2(M), { label: 'a) M =', unit: 'cm²', tol: 0.02 }), approx(r2(O), { label: 'b) O =', unit: 'cm²', tol: 0.02 })),
    `a) Mantel: $M=2\\pi r h=2\\pi\\cdot${de(rr)}\\cdot${h}\\approx${de(M)}\\text{ cm}^2$\n\nb) Grund- und Deckfläche: $2\\pi r^2=2\\pi\\cdot${de(rr)}^2\\approx${de(2 * Math.PI * rr * rr)}\\text{ cm}^2$, zusammen $O\\approx${de(O)}\\text{ cm}^2$`,
    '$O=2\\pi r^2+2\\pi r h$',
  );
}

export function koerperKegel(r) {
  const rr = r.pick([2, 3, 4, 5]), h = r.pick([6, 9, 10, 12]), vk = Math.PI * rr * rr * h / 3, vh = 2 * Math.PI * rr ** 3 / 3;
  return V(
    `Eine Eiswaffel hat die Form eines Kegels mit dem Radius $r=${rr}\\text{ cm}$ und der Höhe $h=${h}\\text{ cm}$. Oben auf der Waffel liegt eine Halbkugel Eis mit demselben Radius. Runde auf zwei Nachkommastellen.\n\na) Berechne das Volumen der Waffel (Kegel).\n\nb) Berechne das Gesamtvolumen von Waffel und Eis.`,
    fields(approx(r2(vk), { label: 'a) V Kegel =', unit: 'cm³', tol: 0.02 }), approx(r2(vk + vh), { label: 'b) V gesamt =', unit: 'cm³', tol: 0.03 })),
    `a) $V_K=\\frac13\\pi r^2 h=\\frac13\\pi\\cdot${rr}^2\\cdot${h}\\approx${de(vk)}\\text{ cm}^3$\n\nb) Halbkugel: $V_H=\\frac12\\cdot\\frac43\\pi r^3=\\frac23\\pi\\cdot${rr}^3\\approx${de(vh)}\\text{ cm}^3$\n\nGesamt: $${de(vk)}+${de(vh)}\\approx${de(vk + vh)}\\text{ cm}^3$`,
    'Kegel: $V=\\frac13\\pi r^2h$, Halbkugel: $V=\\frac23\\pi r^3$',
  );
}

// ------------------------------------------------------------------ Daten & Statistik
export function datenMittelwert(r) {
  const cnt = [r.int(1, 5), r.int(2, 7), r.int(3, 8), r.int(2, 7), r.int(0, 4), r.int(0, 3)], n = cnt.reduce((a, b) => a + b, 0);
  const sum = cnt.reduce((a, c, i) => a + c * (i + 1), 0), mean = sum / n;
  const list = cnt.flatMap((c, i) => Array(c).fill(i + 1));
  const med = n % 2 ? list[(n - 1) / 2] : (list[n / 2 - 1] + list[n / 2]) / 2;
  return V(
    `Die Tabelle zeigt die Ergebnisse einer Mathearbeit.\n\n| Note | 1 | 2 | 3 | 4 | 5 | 6 |\n|---|---|---|---|---|---|---|\n| Anzahl | ${cnt.join(' | ')} |\n\na) Berechne den Notendurchschnitt. Runde auf zwei Nachkommastellen.\n\nb) Bestimme den Median der Noten.`,
    fields(approx(r2(mean), { label: 'a) Durchschnitt:', tol: 0.011 }), num(med, { label: 'b) Median:' })),
    `a) Summe aller Noten: ${cnt.map((c, i) => `${c}·${i + 1}`).join(' + ')} $=${sum}$, Anzahl der Arbeiten: $${n}$\n\n$\\overline{x}=${sum}:${n}\\approx${de(mean)}$\n\nb) Sortiert ergeben sich $${n}$ Noten. ${n % 2 ? `Der Median ist der Wert an Position ${(n + 1) / 2}: **${de(med)}**.` : `Der Median ist der Mittelwert der Werte an den Positionen ${n / 2} und ${n / 2 + 1}: **${de(med)}**.`}`,
    'Der Median ist der mittlere Wert der der Größe nach geordneten Liste.',
  );
}

export function datenKreis(r) {
  const n = r.pick([40, 60, 80, 120, 150]), shares = r.pick([[0.35, 0.25], [0.45, 0.2], [0.3, 0.15], [0.4, 0.35]]), a = Math.round(n * shares[0]), b = Math.round(n * shares[1]);
  return V(
    `Von $${n}$ befragten Jugendlichen fahren $${a}$ mit dem Bus und $${b}$ mit dem Fahrrad zur Schule, die übrigen gehen zu Fuß. Die Ergebnisse sollen in einem Kreisdiagramm dargestellt werden.\n\na) Wie viel Prozent fahren mit dem Bus?\n\nb) Wie groß ist der Winkel für „Fahrrad“?\n\nc) Wie groß ist der Winkel für „zu Fuß“?`,
    fields(approx(r6(a / n * 100), { label: 'a) Bus:', unit: '%', tol: 0.011 }), approx(r6(b / n * 360), { label: 'b) Fahrrad:', unit: '°', tol: 0.06 }), approx(r6((n - a - b) / n * 360), { label: 'c) zu Fuß:', unit: '°', tol: 0.06 })),
    `a) $\\frac{${a}}{${n}}=${de(a / n * 100)}\\,\\%$\n\nb) $\\frac{${b}}{${n}}\\cdot360°=${de(b / n * 360)}°$\n\nc) Zu Fuß gehen $${n}-${a}-${b}=${n - a - b}$ Jugendliche: $\\frac{${n - a - b}}{${n}}\\cdot360°=${de((n - a - b) / n * 360)}°$`,
    'Der volle Kreis hat $360°$, das entspricht $100\\,\\%$.',
  );
}

export function datenFehlend(r) {
  const vals = Array.from({ length: 5 }, () => r.int(3, 11)), miss = r.int(2, 12), all = [...vals, miss], mean = all.reduce((a, b) => a + b, 0) / 6;
  if (!Number.isInteger(mean * 10) && !Number.isInteger(mean * 100)) return null;
  const sorted = [...all].sort((a, b) => a - b), med = (sorted[2] + sorted[3]) / 2, range_ = sorted[5] - sorted[0];
  return V(
    `Sechs Freunde haben im Durchschnitt $${de(mean)}$ Stunden pro Woche Sport gemacht. Fünf von ihnen haben $${vals.map((v) => `${v}\\text{ h}`).join(', ')}$ angegeben.\n\na) Wie viele Stunden hat der sechste Freund Sport gemacht?\n\nb) Wie groß ist die Spannweite aller sechs Werte?`,
    fields(num(miss, { label: 'a) Stunden:', unit: 'h' }), num(range_, { label: 'b) Spannweite:', unit: 'h' })),
    `a) Gesamtsumme: $6\\cdot${de(mean)}=${de(mean * 6)}$. Summe der fünf bekannten Werte: $${vals.reduce((a, b) => a + b, 0)}$. Fehlender Wert: $${de(mean * 6)}-${vals.reduce((a, b) => a + b, 0)}=${miss}$ h\n\nb) Alle Werte sortiert: ${sorted.join('; ')}. Spannweite $=${sorted[5]}-${sorted[0]}=${range_}$ h (Median: ${dt(med)} h)`,
    'Mittelwert mal Anzahl ergibt die Summe aller Werte.',
  );
}

// ------------------------------------------------------------------ Wahrscheinlichkeit
export function wahrscheinlichkeitWuerfel(r) {
  const n = r.pick([6, 8, 10, 12]), lim = n - r.pick([2, 3]);
  const target = r.pick([[(x) => x % 2 === 0, 'eine gerade Zahl'], [(x) => x > lim, `eine Zahl größer als ${lim}`], [(x) => x % 3 === 0, 'ein Vielfaches von 3']]);
  const faces = Array.from({ length: n }, (_, i) => i + 1), fav = faces.filter(target[0]).length;
  const prime = faces.filter((x) => x > 1 && Array.from({ length: x - 2 }, (_, i) => i + 2).every((d) => x % d)).length;
  return V(
    `Ein fairer Würfel hat $${n}$ gleich wahrscheinliche Seiten mit den Zahlen $1$ bis $${n}$. Er wird einmal geworfen.\n\na) Wie groß ist die Wahrscheinlichkeit, ${target[1]} zu würfeln?\n\nb) Wie groß ist die Wahrscheinlichkeit, eine Primzahl zu würfeln?\n\n${SAY_P}`,
    fields(num(r6(fav / n), { label: 'a) P =' }), num(r6(prime / n), { label: 'b) P =' })),
    `a) Günstige Ergebnisse: ${fav} von ${n}, also $P=\\frac{${fav}}{${n}}\\approx${de(fav / n, 3)}$\n\nb) Primzahlen bis ${n}: ${faces.filter((x) => x > 1 && Array.from({ length: x - 2 }, (_, i) => i + 2).every((d) => x % d)).join(', ')}. Das sind ${prime} Zahlen: $P=\\frac{${prime}}{${n}}\\approx${de(prime / n, 3)}$ (die 1 ist keine Primzahl)`,
    'Laplace: $P=\\frac{\\text{günstige Ergebnisse}}{\\text{alle Ergebnisse}}$',
  );
}

export function wahrscheinlichkeitZurueck(r) {
  const n = r.pick([10, 12, 15, 20]), ro = r.int(2, Math.floor(n / 2) - 1), bl = r.int(2, Math.floor(n / 2)), gr = n - ro - bl;
  if (gr < 1) return null;
  const pRR = (ro / n) ** 2, pDiff = 1 - ((ro / n) ** 2 + (bl / n) ** 2 + (gr / n) ** 2);
  return V(
    `In einer Urne liegen $${n}$ Kugeln: $${ro}$ rote, $${bl}$ blaue und $${gr}$ grüne. Es wird zweimal **mit Zurücklegen** gezogen.\n\na) Wie groß ist die Wahrscheinlichkeit, dass beide Kugeln rot sind?\n\nb) Wie groß ist die Wahrscheinlichkeit, dass beide Kugeln **verschiedene** Farben haben?\n\n${SAY_P}`,
    fields(num(r6(pRR), { label: 'a) P =' }), num(r6(pDiff), { label: 'b) P =' })),
    `a) $P=\\frac{${ro}}{${n}}\\cdot\\frac{${ro}}{${n}}=${de(pRR, 4)}$\n\nb) Gegenereignis „beide gleich“: $\\left(\\frac{${ro}}{${n}}\\right)^2+\\left(\\frac{${bl}}{${n}}\\right)^2+\\left(\\frac{${gr}}{${n}}\\right)^2=${de(1 - pDiff, 4)}$\n\n$P=1-${de(1 - pDiff, 4)}=${de(pDiff, 4)}$`,
    'Bei „verschiedene Farben“ ist das Gegenereignis „gleiche Farbe“ einfacher zu berechnen.',
  );
}

export function wahrscheinlichkeitBaum(r) {
  const n = r.pick([8, 10, 12]), ro = r.int(3, n - 3), bl = n - ro;
  const pSame = (ro / n) * ((ro - 1) / (n - 1)) + (bl / n) * ((bl - 1) / (n - 1)), pRB = (ro / n) * (bl / (n - 1));
  return V(
    `In einem Beutel liegen $${ro}$ rote und $${bl}$ blaue Kugeln. Es werden zwei Kugeln **ohne Zurücklegen** gezogen.\n\na) Wie groß ist die Wahrscheinlichkeit, zuerst eine rote und dann eine blaue Kugel zu ziehen?\n\nb) Wie groß ist die Wahrscheinlichkeit, dass beide Kugeln dieselbe Farbe haben?\n\n${SAY_P}`,
    fields(num(r6(pRB), { label: 'a) P =' }), num(r6(pSame), { label: 'b) P =' })),
    `a) $P(\\text{rot, blau})=\\frac{${ro}}{${n}}\\cdot\\frac{${bl}}{${n - 1}}\\approx${de(pRB, 4)}$\n\nb) Beide rot: $\\frac{${ro}}{${n}}\\cdot\\frac{${ro - 1}}{${n - 1}}$, beide blau: $\\frac{${bl}}{${n}}\\cdot\\frac{${bl - 1}}{${n - 1}}$.\n\nSumme der beiden Pfade: $P\\approx${de(pSame, 4)}$`,
    'Zeichne ein Baumdiagramm: Nach dem ersten Zug ist eine Kugel weniger im Beutel.',
  );
}

export function wahrscheinlichkeitGegen(r) {
  const n = r.pick([12, 15, 16, 20]), j = r.int(3, 5);
  if (n - j < 3) return null;
  const pNone = ((n - j) / n) * ((n - j - 1) / (n - 1)) * ((n - j - 2) / (n - 2));
  return V(
    `In einem Kartenspiel mit $${n}$ Karten sind $${j}$ Joker. Es werden drei Karten **ohne Zurücklegen** gezogen.\n\na) Wie groß ist die Wahrscheinlichkeit, **keinen** Joker zu ziehen?\n\nb) Wie groß ist die Wahrscheinlichkeit, **mindestens einen** Joker zu ziehen?\n\n${SAY_P}`,
    fields(num(r6(pNone), { label: 'a) P =' }), num(r6(1 - pNone), { label: 'b) P =' })),
    `a) $P(\\text{kein Joker})=\\frac{${n - j}}{${n}}\\cdot\\frac{${n - j - 1}}{${n - 1}}\\cdot\\frac{${n - j - 2}}{${n - 2}}\\approx${de(pNone, 4)}$\n\nb) Gegenereignis: $P(\\text{mindestens ein Joker})=1-${de(pNone, 4)}=${de(1 - pNone, 4)}$`,
    '„Mindestens einer“ ist das Gegenereignis zu „keiner“.',
  );
}

void gcd; void lin;
