// Zusätzliche Aufgaben für den Einstiegstest (RS und erw. RS) zu „Lineare Gleichungssysteme“ und
// „Wachstum & Exponentialfunktionen“. Grundlage sind Aufgaben aus dem Schulbuch-Training (Nr. 94 bis 103 und 154 bis 160)
// und die Abschlussprüfung 2020 (Wahlaufgabe 3). Jede Aufgabe kommt mit Varianten mit anderen Zahlen.
//
// Die Herkunft steht nur in task_variants.source und wird ausschließlich der Lehrkraft angezeigt.
// Alle Ergebnisse werden hier berechnet (nicht von Hand eingetragen); der Test in diag-gls-wachstum.test.js prüft sie.
import { all, get, run, tx, json, getSetting, setSetting } from '../db.js';
import { save } from './figures.js';
import { rng, de, dt, num, fields, sel, expr, approx, table, fieldsWith, eq, lin, constraint } from './grundlagen/kit.js';

const SETTING = 'diag_gls_wachstum_v1';
const GLS = 'Lineare Gleichungssysteme';
const WACHSTUM = 'Wachstum & Exponentialfunktionen';
const BOOK = 'Schulbuch Training';

function distinct(gen, count, seed) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < count * 20; i++) {
    const v = gen(rng(seed * 131 + i));
    if (!v || seen.has(v.prompt)) continue;
    seen.add(v.prompt);
    out.push(v);
  }
  return out;
}

// ===================================================================== Lineare Gleichungssysteme
// a1·x + b1·y = c1 und a2·x + b2·y = c2 nach Cramer lösen
export function solve2(a1, b1, c1, a2, b2, c2) {
  const d = a1 * b2 - a2 * b1;
  if (d === 0) return null;
  return { x: (c1 * b2 - c2 * b1) / d, y: (a1 * c2 - a2 * c1) / d };
}

const xy = (x, y) => fields(num(x, { label: 'x =' }), num(y, { label: 'y =' }));
const system = (e1, e2) => `$$\\text{I}\\quad ${e1}\\qquad\\text{II}\\quad ${e2}$$`;
const probeText = (a1, b1, c1, a2, b2, c2, x, y) => {
  const t = (a, b) => `${de(a)}\\cdot${x < 0 ? `(${de(x)})` : de(x)}${b < 0 ? '-' : '+'}${de(Math.abs(b))}\\cdot${y < 0 ? `(${de(y)})` : de(y)}`;
  return `**Probe:** I: $${t(a1, b1)}=${de(c1)}$ ✓ · II: $${t(a2, b2)}=${de(c2)}$ ✓`;
};
const HINT_VERFAHREN = 'Löse eine Gleichung nach $x$ oder $y$ auf und setze in die andere ein, oder addiere die beiden Gleichungen so, dass eine Unbekannte wegfällt.';

// Gleichungssystem mit eigener Darstellung der Gleichungen (z. B. y = 3x + 5). Das Ergebnis wird berechnet.
function mkSystem({ intro, e1, e2, c, steps, source, hint = HINT_VERFAHREN }) {
  const s = solve2(...c);
  if (!s || !Number.isInteger(s.x * 2) || !Number.isInteger(s.y * 2)) throw new Error(`Gleichungssystem nicht ganzzahlig: ${c}`);
  return {
    prompt: `${intro}\n\n${system(e1, e2)}`,
    answer: xy(s.x, s.y),
    solution: `${steps}\n\n**Lösung:** $x=${de(s.x)}$ und $y=${de(s.y)}$\n\n${probeText(...c, s.x, s.y)}`,
    hint,
    source,
  };
}

// Textaufgabe: zwei Unbekannte, Gleichungen als Koeffizienten, Antwortfelder frei benennbar
function mkText({ prompt, c, labels, units = [], extra, steps, source, hint = 'Wähle für die gesuchten Größen $x$ und $y$ und stelle zwei Gleichungen auf.' }) {
  const s = solve2(...c);
  if (!s || s.x <= 0 || s.y <= 0) throw new Error(`Textaufgabe nicht sinnvoll lösbar: ${c}`);
  const parts = [num(s.x, { label: labels[0], unit: units[0] || '' }), num(s.y, { label: labels[1], unit: units[1] || '' })];
  if (extra) parts.push(num(extra.value(s), { label: extra.label, unit: extra.unit || '' }));
  return {
    prompt,
    answer: fields(...parts),
    solution: `${steps(s)}`,
    hint,
    source,
  };
}

function glsLevel1() {
  const out = [];
  // 96 a) Gleichsetzungsverfahren
  out.push(mkSystem({
    intro: 'Löse das Gleichungssystem mit dem **Gleichsetzungsverfahren**.',
    e1: 'y=3x+5', e2: 'y=2x-4', c: [-3, 1, 5, -2, 1, -4],
    steps: 'Beide Gleichungen sind nach $y$ aufgelöst, also setzt du die rechten Seiten gleich:\n\n$3x+5=2x-4 \\;\\Rightarrow\\; x=-9$\n\nEinsetzen in I: $y=3\\cdot(-9)+5=-22$',
    source: `${BOOK} · Aufgabe 96 a)`,
  }));
  // 95 a) Einsetzungsverfahren
  out.push(mkSystem({
    intro: 'Löse das Gleichungssystem mit dem **Einsetzungsverfahren**.',
    e1: 'x=2y-6', e2: '-4x-7y=9', c: [1, -2, -6, -4, -7, 9],
    steps: 'Gleichung I ist schon nach $x$ aufgelöst. Einsetzen in II:\n\n$-4\\cdot(2y-6)-7y=9 \\;\\Rightarrow\\; -8y+24-7y=9 \\;\\Rightarrow\\; -15y=-15 \\;\\Rightarrow\\; y=1$\n\nEinsetzen in I: $x=2\\cdot1-6=-4$',
    source: `${BOOK} · Aufgabe 95 a)`,
  }));
  // erzeugt: Gleichsetzungsverfahren mit zwei Geraden
  out.push(...distinct((r) => {
    const x0 = r.int(-6, 7), m1 = r.pick([-3, -2, -1, 1, 2, 3, 4]), m2 = r.pick([-3, -2, -1, 1, 2, 3]);
    if (m1 === m2 || x0 === 0) return null;
    const b1 = r.int(-8, 9), y0 = m1 * x0 + b1, b2 = y0 - m2 * x0;
    if (Math.abs(b2) > 12) return null;
    return mkSystem({
      intro: 'Löse das Gleichungssystem mit dem **Gleichsetzungsverfahren**.',
      e1: `y=${lin(m1, b1)}`, e2: `y=${lin(m2, b2)}`, c: [-m1, 1, b1, -m2, 1, b2],
      steps: `Beide Gleichungen sind nach $y$ aufgelöst, also setzt du die rechten Seiten gleich:\n\n$${lin(m1, b1)}=${lin(m2, b2)} \\;\\Rightarrow\\; ${de(m1 - m2)}x=${de(b2 - b1)} \\;\\Rightarrow\\; x=${de(x0)}$\n\nEinsetzen in I: $y=${de(m1)}\\cdot${x0 < 0 ? `(${de(x0)})` : de(x0)}${b1 < 0 ? '-' : '+'}${de(Math.abs(b1))}=${de(y0)}$`,
    });
  }, 2, 11));
  // erzeugt: Einsetzungsverfahren, x ist schon freigestellt
  out.push(...distinct((r) => {
    const x0 = r.int(-7, 8), y0 = r.int(-5, 6), a = r.pick([2, 3, -2, -3, 4]);
    if (x0 === 0 || y0 === 0) return null;
    const c0 = x0 - a * y0, p = r.pick([2, 3, 4, -2, -3]), q = r.pick([1, 2, -1, -2, -3, 3]);
    if (p + q * 0 === 0 || p * a + q === 0) return null;
    return mkSystem({
      intro: 'Löse das Gleichungssystem mit dem **Einsetzungsverfahren**.',
      e1: `x=${lin(a, c0, 'y')}`, e2: eq(p, q, p * x0 + q * y0), c: [1, -a, c0, p, q, p * x0 + q * y0],
      steps: `Gleichung I ist schon nach $x$ aufgelöst. Einsetzen in II:\n\n$${de(p)}\\cdot(${lin(a, c0, 'y')})${q < 0 ? '-' : '+'}${de(Math.abs(q))}y=${de(p * x0 + q * y0)}$\n\nNach dem Ausmultiplizieren und Zusammenfassen erhältst du $y=${de(y0)}$.\n\nEinsetzen in I: $x=${lin(a, c0, 'y').replace(/y/, `\\cdot${y0 < 0 ? `(${de(y0)})` : de(y0)}`)}=${de(x0)}$`,
    });
  }, 2, 12));
  return out;
}

function glsLevel2() {
  const out = [];
  const add = (src, intro, e1, e2, c, steps) => out.push(mkSystem({ intro, e1, e2, c, steps, source: `${BOOK} · Aufgabe ${src}` }));
  add('97 a)', 'Löse das Gleichungssystem mit dem **Additionsverfahren**.', '3x+4y=10', '2x-4y=0', [3, 4, 10, 2, -4, 0],
    'Die $y$-Terme haben entgegengesetzte Vorzeichen. Addiere I und II:\n\n$5x=10 \\;\\Rightarrow\\; x=2$\n\nEinsetzen in II: $2\\cdot2-4y=0 \\;\\Rightarrow\\; y=1$');
  add('97 b)', 'Löse das Gleichungssystem mit dem **Additionsverfahren**.', '2x+3y=20', '5x-y=33', [2, 3, 20, 5, -1, 33],
    'Multipliziere II mit 3, dann fällt $y$ beim Addieren weg:\n\n$\\text{II}'+"'"+'\\quad 15x-3y=99$\n\nI + II$'+"'"+'$: $17x=119 \\;\\Rightarrow\\; x=7$\n\nEinsetzen in II: $5\\cdot7-y=33 \\;\\Rightarrow\\; y=2$');
  add('98 a)', 'Löse das Gleichungssystem mit einem Verfahren deiner Wahl.', '2x-3y=9', '2x+4y=2', [2, -3, 9, 2, 4, 2],
    'Subtrahiere II von I, dann fällt $x$ weg:\n\n$-7y=7 \\;\\Rightarrow\\; y=-1$\n\nEinsetzen in I: $2x+3=9 \\;\\Rightarrow\\; x=3$');
  add('98 b)', 'Löse das Gleichungssystem mit einem Verfahren deiner Wahl.', '2x-7y=0', 'x+4y=30', [2, -7, 0, 1, 4, 30],
    'Gleichung II nach $x$ auflösen: $x=30-4y$\n\nEinsetzen in I: $2(30-4y)-7y=0 \\;\\Rightarrow\\; 60-15y=0 \\;\\Rightarrow\\; y=4$\n\nEinsetzen in $x=30-4y$: $x=14$');
  add('98 c)', 'Löse das Gleichungssystem mit einem Verfahren deiner Wahl.', 'x-3y=-15', 'x-2y=-9', [1, -3, -15, 1, -2, -9],
    'Subtrahiere II von I, dann fällt $x$ weg:\n\n$-y=-6 \\;\\Rightarrow\\; y=6$\n\nEinsetzen in II: $x-12=-9 \\;\\Rightarrow\\; x=3$');
  add('98 d)', 'Löse das Gleichungssystem mit einem Verfahren deiner Wahl.', '4x-8y=-20', 'y=4x-8', [4, -8, -20, -4, 1, -8],
    'Gleichung II ist schon nach $y$ aufgelöst. Einsetzen in I:\n\n$4x-8(4x-8)=-20 \\;\\Rightarrow\\; -28x+64=-20 \\;\\Rightarrow\\; x=3$\n\nEinsetzen in II: $y=4\\cdot3-8=4$');
  add('95 b)', 'Löse das Gleichungssystem mit dem **Einsetzungsverfahren**.', '3x+y=14', '4x+2y=20', [3, 1, 14, 4, 2, 20],
    'Gleichung I nach $y$ auflösen: $y=14-3x$\n\nEinsetzen in II: $4x+2(14-3x)=20 \\;\\Rightarrow\\; -2x+28=20 \\;\\Rightarrow\\; x=4$\n\nEinsetzen: $y=14-12=2$');
  add('96 b)', 'Löse das Gleichungssystem mit dem **Gleichsetzungsverfahren**.', '-3x-6y=-30', '2x-6y=-60', [-3, -6, -30, 2, -6, -60],
    'Beide Gleichungen nach $y$ auflösen:\n\n$\\text{I}\\quad y=5-0{,}5x$ und $\\text{II}\\quad y=10+\\frac{1}{3}x$\n\nGleichsetzen: $5-0{,}5x=10+\\frac13x \\;\\Rightarrow\\; -\\frac56x=5 \\;\\Rightarrow\\; x=-6$\n\nEinsetzen: $y=5-0{,}5\\cdot(-6)=8$');
  // erzeugt: Additionsverfahren, ein y-Term mit entgegengesetztem Vorzeichen
  out.push(...distinct((r) => {
    const x0 = r.int(-5, 8), y0 = r.int(-5, 8), a1 = r.pick([2, 3, 4, 5]), a2 = r.pick([1, 2, 3, 5]), b = r.pick([2, 3, 4, 5, 6]);
    if (x0 === 0 || y0 === 0) return null;
    const c1 = a1 * x0 + b * y0, c2 = a2 * x0 - b * y0;
    return mkSystem({
      intro: 'Löse das Gleichungssystem mit dem **Additionsverfahren**.',
      e1: eq(a1, b, c1), e2: eq(a2, -b, c2), c: [a1, b, c1, a2, -b, c2],
      steps: `Die $y$-Terme haben entgegengesetzte Vorzeichen. Addiere I und II:\n\n$${de(a1 + a2)}x=${de(c1 + c2)} \\;\\Rightarrow\\; x=${de(x0)}$\n\nEinsetzen in I: $${de(a1)}\\cdot${x0 < 0 ? `(${de(x0)})` : de(x0)}+${de(b)}y=${de(c1)} \\;\\Rightarrow\\; y=${de(y0)}$`,
    });
  }, 2, 21));
  return out;
}

const SOLVE_TEXT = 'Stelle ein Gleichungssystem auf und löse es.';

function glsLevel3() {
  const out = [];
  // 99 Zoo
  out.push(mkText({
    prompt: `Marta überlegt, wie teuer die Eintrittspreise für Kinder und Erwachsene im Zoo waren.\n\n- Einmal hat sie für zwei Erwachsene und ein Kind 68 € bezahlt.\n- Einmal hat sie für eine Erwachsene und drei Kinder 79 € bezahlt.\n\n${SOLVE_TEXT} Wie viel kostet der Eintritt für eine erwachsene Person und für ein Kind?`,
    c: [2, 1, 68, 1, 3, 79], labels: ['Eintritt Erwachsene:', 'Eintritt Kind:'], units: ['€', '€'],
    steps: (s) => `$x$: Preis für eine erwachsene Person, $y$: Preis für ein Kind.\n\n$\\text{I}\\quad 2x+y=68 \\qquad \\text{II}\\quad x+3y=79$\n\nI nach $y$ auflösen: $y=68-2x$. Einsetzen in II: $x+3(68-2x)=79 \\Rightarrow -5x+204=79 \\Rightarrow x=${de(s.x)}$\n\n$y=68-2\\cdot${de(s.x)}=${de(s.y)}$\n\nEine erwachsene Person zahlt **${de(s.x)} €**, ein Kind **${de(s.y)} €**.`,
    source: `${BOOK} · Aufgabe 99`,
  }));
  // 100 Jamal
  out.push(mkText({
    prompt: `Jamal kauft Apfelsaft zum Preis von 1,00 € pro Flasche und Kirschsaft zum Preis von 1,50 € pro Flasche. Für 18 Flaschen zahlt er 21 €.\n\n${SOLVE_TEXT} Wie viele Flaschen Apfelsaft und wie viele Flaschen Kirschsaft kauft er?`,
    c: [1, 1, 18, 1, 1.5, 21], labels: ['Flaschen Apfelsaft:', 'Flaschen Kirschsaft:'],
    steps: (s) => `$x$: Anzahl Apfelsaft, $y$: Anzahl Kirschsaft.\n\n$\\text{I}\\quad x+y=18 \\qquad \\text{II}\\quad 1{,}00x+1{,}50y=21$\n\nI nach $x$ auflösen: $x=18-y$. Einsetzen in II: $18-y+1{,}5y=21 \\Rightarrow 0{,}5y=3 \\Rightarrow y=${de(s.y)}$\n\n$x=18-${de(s.y)}=${de(s.x)}$\n\nJamal kauft **${de(s.x)} Flaschen Apfelsaft** und **${de(s.y)} Flaschen Kirschsaft**.`,
    source: `${BOOK} · Aufgabe 100`,
  }));
  // 101 Alter
  out.push(mkText({
    prompt: `Markus will das Alter seiner Nachbarinnen Leyla und Lisa wissen. Leyla antwortet ihm: „Zusammen sind wir beide 34 Jahre alt. Lisa ist 6 Jahre jünger als ich.“\n\n${SOLVE_TEXT} Wie alt sind Leyla und Lisa?`,
    c: [1, 1, 34, 1, -1, 6], labels: ['Leyla ist', 'Lisa ist'], units: ['Jahre', 'Jahre'],
    steps: (s) => `$x$: Alter von Leyla, $y$: Alter von Lisa.\n\n$\\text{I}\\quad x+y=34 \\qquad \\text{II}\\quad x-y=6$\n\nAddiere I und II: $2x=40 \\Rightarrow x=${de(s.x)}$\n\nEinsetzen in I: $y=34-${de(s.x)}=${de(s.y)}$\n\nLeyla ist **${de(s.x)} Jahre**, Lisa **${de(s.y)} Jahre** alt.`,
    source: `${BOOK} · Aufgabe 101`,
  }));
  // 102 Rechteck
  out.push(mkText({
    prompt: `Ein Rechteck hat einen Umfang von 24 cm. Die Seite $a$ ist doppelt so lang wie $b$.\n\n${SOLVE_TEXT} Wie groß ist der Flächeninhalt des Rechtecks?`,
    c: [2, 2, 24, 1, -2, 0], labels: ['Seite a =', 'Seite b ='], units: ['cm', 'cm'],
    extra: { label: 'Flächeninhalt A =', unit: 'cm²', value: (s) => s.x * s.y },
    steps: (s) => `$\\text{I}\\quad 2a+2b=24 \\qquad \\text{II}\\quad a=2b$\n\nII in I einsetzen: $2\\cdot2b+2b=24 \\Rightarrow 6b=24 \\Rightarrow b=${de(s.y)}$\n\n$a=2\\cdot${de(s.y)}=${de(s.x)}$\n\n$A=a\\cdot b=${de(s.x)}\\cdot${de(s.y)}=${de(s.x * s.y)}\\ \\text{cm}^2$`,
    source: `${BOOK} · Aufgabe 102`,
  }));
  // 103 Jugendherberge
  out.push(mkText({
    prompt: `Die Klasse 10a fährt in eine Jugendherberge. Im Internet liest sie, dass es\n\n- nur Doppelzimmer und Vierbettzimmer gibt,\n- in zehn Zimmern insgesamt 28 Betten gibt.\n\n${SOLVE_TEXT} Wie viele Doppelzimmer und wie viele Vierbettzimmer gibt es?`,
    c: [1, 1, 10, 2, 4, 28], labels: ['Doppelzimmer:', 'Vierbettzimmer:'],
    steps: (s) => `$x$: Anzahl Doppelzimmer, $y$: Anzahl Vierbettzimmer.\n\n$\\text{I}\\quad x+y=10 \\qquad \\text{II}\\quad 2x+4y=28$\n\nI nach $x$ auflösen: $x=10-y$. Einsetzen in II: $2(10-y)+4y=28 \\Rightarrow 2y=8 \\Rightarrow y=${de(s.y)}$\n\n$x=10-${de(s.y)}=${de(s.x)}$\n\nEs gibt **${de(s.x)} Doppelzimmer** und **${de(s.y)} Vierbettzimmer**.`,
    source: `${BOOK} · Aufgabe 103`,
  }));
  // erzeugt: Eintrittspreise (wie Aufgabe 99)
  out.push(...distinct((r) => {
    const E = r.int(9, 28), K = r.int(4, 15), n = r.pick([2, 3]), m = r.pick([2, 3, 4]);
    if (E <= K) return null;
    const c = [n, 1, n * E + K, 1, m, E + m * K];
    const place = r.pick([['im Freizeitpark', 'eine erwachsene Person', 'ein Kind'], ['im Schwimmbad', 'eine erwachsene Person', 'ein Kind']]);
    const word = (k, w) => (k === 1 ? `${w === 'E' ? 'eine Erwachsene' : 'ein Kind'}` : `${['', '', 'zwei', 'drei', 'vier'][k]} ${w === 'E' ? 'Erwachsene' : 'Kinder'}`);
    return mkText({
      prompt: `Familie Demir war ${place[0]}. Beim ersten Besuch haben ${word(n, 'E')} und ein Kind ${dt(c[2])} € bezahlt. Beim zweiten Besuch haben eine Erwachsene und ${word(m, 'K')} ${dt(c[5])} € bezahlt.\n\n${SOLVE_TEXT} Wie viel kostet der Eintritt für ${place[1]} und für ${place[2]}?`,
      c, labels: ['Eintritt Erwachsene:', 'Eintritt Kind:'], units: ['€', '€'],
      steps: (s) => `$x$: Preis für eine erwachsene Person, $y$: Preis für ein Kind.\n\n$\\text{I}\\quad ${eq(n, 1, c[2])} \\qquad \\text{II}\\quad ${eq(1, m, c[5])}$\n\nDas Gleichungssystem hat die Lösung $x=${de(s.x)}$ und $y=${de(s.y)}$.\n\nEine erwachsene Person zahlt **${de(s.x)} €**, ein Kind **${de(s.y)} €**.\n\n${probeText(...c, s.x, s.y)}`,
    });
  }, 2, 31));
  // erzeugt: Mischung wie bei Jamal
  out.push(...distinct((r) => {
    const A = r.int(5, 14), B = r.int(4, 12), pa = r.pick([0.8, 1, 1.2]), pb = r.pick([1.5, 1.8, 2, 2.5]);
    const total = round2(pa * A + pb * B);
    return mkText({
      prompt: `Lena kauft Bio-Äpfel zum Preis von ${dt(pa)} € pro Stück und Birnen zum Preis von ${dt(pb)} € pro Stück. Für insgesamt ${A + B} Stück zahlt sie ${dt(total)} €.\n\n${SOLVE_TEXT} Wie viele Äpfel und wie viele Birnen kauft sie?`,
      c: [1, 1, A + B, pa, pb, total], labels: ['Äpfel:', 'Birnen:'],
      steps: (s) => `$x$: Anzahl Äpfel, $y$: Anzahl Birnen.\n\n$\\text{I}\\quad x+y=${A + B} \\qquad \\text{II}\\quad ${de(pa)}x+${de(pb)}y=${de(total)}$\n\nI nach $x$ auflösen: $x=${A + B}-y$. Einsetzen in II und Zusammenfassen ergibt $y=${de(s.y)}$ und damit $x=${de(s.x)}$.\n\nSie kauft **${de(s.x)} Äpfel** und **${de(s.y)} Birnen**.`,
    });
  }, 2, 32));
  // erzeugt: Zimmer wie bei Aufgabe 103
  out.push(...distinct((r) => {
    const x0 = r.int(3, 9), y0 = r.int(2, 8), kind = r.pick([['Zweibettzimmer', 'Sechsbettzimmer', 2, 6], ['Zweibettzimmer', 'Dreibettzimmer', 2, 3], ['Dreibettzimmer', 'Vierbettzimmer', 3, 4]]);
    const n = x0 + y0, beds = kind[2] * x0 + kind[3] * y0;
    return mkText({
      prompt: `Die Klasse 9b fährt in ein Gästehaus. Dort gibt es nur ${kind[0]} und ${kind[1]}. In ${n} Zimmern gibt es insgesamt ${beds} Betten.\n\n${SOLVE_TEXT} Wie viele ${kind[0]} und wie viele ${kind[1]} gibt es?`,
      c: [1, 1, n, kind[2], kind[3], beds], labels: [`${kind[0]}:`, `${kind[1]}:`],
      steps: (s) => `$x$: Anzahl ${kind[0]}, $y$: Anzahl ${kind[1]}.\n\n$\\text{I}\\quad x+y=${n} \\qquad \\text{II}\\quad ${kind[2]}x+${kind[3]}y=${beds}$\n\nI nach $x$ auflösen: $x=${n}-y$. Einsetzen in II: $${kind[2]}(${n}-y)+${kind[3]}y=${beds} \\Rightarrow ${kind[3] - kind[2]}y=${beds - kind[2] * n} \\Rightarrow y=${de(s.y)}$\n\n$x=${n}-${de(s.y)}=${de(s.x)}$`,
    });
  }, 1, 33));
  // erzeugt: Alter
  out.push(...distinct((r) => {
    const old = r.int(14, 40), diff = r.pick([4, 6, 8, 10]);
    const names = r.pick([['Ben', 'Jonas'], ['Aylin', 'Mia'], ['Tom', 'Lukas']]);
    return mkText({
      prompt: `${names[0]} sagt zu Markus: „${names[1]} und ich sind zusammen ${2 * old - diff} Jahre alt. ${names[1]} ist ${diff} Jahre jünger als ich.“\n\n${SOLVE_TEXT} Wie alt sind ${names[0]} und ${names[1]}?`,
      c: [1, 1, 2 * old - diff, 1, -1, diff], labels: [`${names[0]} ist`, `${names[1]} ist`], units: ['Jahre', 'Jahre'],
      steps: (s) => `$x$: Alter von ${names[0]}, $y$: Alter von ${names[1]}.\n\n$\\text{I}\\quad x+y=${2 * old - diff} \\qquad \\text{II}\\quad x-y=${diff}$\n\nAddiere I und II: $2x=${2 * old} \\Rightarrow x=${de(s.x)}$, dann $y=${de(s.y)}$.`,
    });
  }, 1, 34));
  // Abschlussprüfung 2020, Wahlaufgabe 3 a) bis d): Ferienwohnung
  const p2020 = 'Abschlussprüfung 2020 · Realschule · Wahlaufgabe 3';
  out.push({
    prompt: 'Eine Ferienwohnung kostet pro Tag 75 €. Die Endreinigung kostet 50 €.\n\n**a)** Bestimme die Kosten der Ferienwohnung für 7 Tage.\n\n**b)** Stelle eine Funktionsgleichung in der Form $y=mx+b$ auf, mit der die Kosten der Ferienwohnung für $x$ Tage berechnet werden können.\n\nDie Kosten für zwei andere Ferienwohnungen werden durch das folgende Gleichungssystem dargestellt.\n\n$$\\text{I}\\quad y=64x+35 \\qquad \\text{II}\\quad y=59x+80$$\n\n**c)** Löse das Gleichungssystem.\n\n**d)** Für wie viele Tage ist welche Ferienwohnung aus c) günstiger?',
    answer: fields(
      num(75 * 7 + 50, { label: 'a) Kosten für 7 Tage:', unit: '€' }),
      num(75, { label: 'b) y = m·x + b mit m =' }), num(50, { label: 'b =' }),
      num(9, { label: 'c) x =' }), num(64 * 9 + 35, { label: 'y =' }),
      sel(['Wohnung I', 'Wohnung II'], 'Wohnung I', 'd) Bei 1 bis 8 Tagen ist günstiger:'),
      sel(['Wohnung I', 'Wohnung II'], 'Wohnung II', 'Ab 10 Tagen ist günstiger:'),
    ),
    solution: '**a)** $7\\cdot75+50=575$. Die Ferienwohnung kostet für 7 Tage **575 €**.\n\n**b)** Pro Tag kommen 75 € dazu (Steigung), die Endreinigung ist der feste Betrag: $y=75x+50$.\n\n**c)** Gleichsetzen: $64x+35=59x+80 \\Rightarrow 5x=45 \\Rightarrow x=9$\n\nEinsetzen: $y=64\\cdot9+35=611$. Die Lösung ist $(9\\mid611)$: Nach 9 Tagen kosten beide Wohnungen 611 €.\n\n**d)** Wohnung I hat die kleinere Steigung (64 € pro Tag statt 59 €), aber die niedrigere Grundgebühr (35 € statt 80 €). Bei **1 bis 8 Tagen** ist **Wohnung I** günstiger, bei **mehr als 9 Tagen** ist **Wohnung II** günstiger. Bei genau 9 Tagen kosten beide gleich viel.',
    hint: 'Pro Tag kommt immer derselbe Betrag dazu (Steigung), die Endreinigung zahlst du nur einmal (fester Betrag). Zum Lösen setzt du die beiden rechten Seiten gleich.',
    source: `${p2020} a) bis d)`,
  });
  // Abschlussprüfung 2020, Wahlaufgabe 3 e): keine Lösung
  out.push({
    prompt: 'Ergänze das folgende Gleichungssystem, sodass es **keine Lösung** gibt. Trage in jede Lücke eine Zahl ein.\n\n$$\\text{I}\\quad y=50x+\\underline{\\quad b\\quad} \\qquad \\text{II}\\quad y=\\underline{\\quad m\\quad}\\,x+75$$',
    answer: constraint([num(0, { label: 'I: y = 50x + b mit b =', tol: 0 }), num(0, { label: 'II: y = m·x + 75 mit m =', tol: 0 })], { type: 'parallel', slope: 50, notIntercept: 75, tolerance: 1e-6 }, 'z. B. b = 10 und m = 50'),
    solution: 'Ein Gleichungssystem hat **keine Lösung**, wenn die beiden Geraden **parallel** sind, aber nicht übereinander liegen.\n\nDafür brauchst du dieselbe Steigung: $m=50$.\n\nUnd **verschiedene** Achsenabschnitte: $b\\neq75$, zum Beispiel $b=10$.\n\nBeispiel: $\\text{I}\\ y=50x+10$ und $\\text{II}\\ y=50x+75$',
    hint: 'Zwei Geraden schneiden sich nicht, wenn sie die gleiche Steigung, aber verschiedene Achsenabschnitte haben.',
    source: `${p2020} e)`,
  });
  return out;
}

const round2 = (n) => Math.round(n * 100) / 100;

// ===================================================================== Wachstum & Exponentialfunktionen
const RISE = 'steigend';
const FALL = 'fallend';
const FLAT = 'waagerecht';
const VERLAUF = [RISE, FALL, FLAT];
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const cells = (values) => values.map((v) => approx(v, { tol: Number.isInteger(v) ? 0 : 0.6 }));
const sup = (s) => String(s).replace('x', 'ˣ');
const plain = (n) => dt(n).replace(/ /g, '');

// ---- 155: Verlauf der Graphen
function verlaufTask(items, source) {
  const kind = (it) => (it.q > 1 ? RISE : it.q < 1 ? FALL : FLAT);
  return {
    prompt: `Bestimme den Verlauf der Graphen. Wähle jeweils: steigend, fallend oder waagerecht.\n\n${items.map((it, i) => `- ${'abcd'[i]}) $y=${it.tex}$`).join('\n')}`,
    answer: fields(...items.map((it, i) => sel(VERLAUF, kind(it), `${'abcd'[i]}) y = ${it.text}:`))),
    solution: items.map((it, i) => `${'abcd'[i]}) $y=${it.tex}$: Der Wachstumsfaktor ist $q=${it.qtex}$ ${it.q > 1 ? '(größer als 1)' : it.q < 1 ? '(zwischen 0 und 1)' : '(gleich 1)'} → **${kind(it)}**`).join('\n\n') + '\n\n**Merke:** $q>1$: der Graph steigt (Wachstum) · $0<q<1$: der Graph fällt (Abnahme) · $q=1$: der Graph verläuft waagerecht.',
    hint: 'Entscheidend ist der Wachstumsfaktor $q$, die Zahl, die hochx steht: größer oder kleiner als 1?',
    source,
  };
}
const fracItem = (a, b, fac = 1) => ({ text: `${fac === 1 ? '' : `${fac}·`}(${a}/${b})ˣ`, tex: `${fac === 1 ? '' : `${fac}\\cdot`}\\left(\\frac{${a}}{${b}}\\right)^x`, q: a / b, qtex: `\\frac{${a}}{${b}}` });
const decItem = (q, fac = 1) => ({ text: `${fac === 1 ? '' : `${fac}·`}${plain(q)}ˣ`, tex: `${fac === 1 ? '' : `${de(fac)}\\cdot`}${de(q)}^x`, q, qtex: de(q) });

function wachstumLevel1() {
  const out = [];
  out.push(verlaufTask([decItem(1.2), fracItem(4, 5), fracItem(7, 6, 3), decItem(1, 0.2)], `${BOOK} · Aufgabe 155`));
  out.push(...distinct((r) => {
    const items = r.shuffle([
      decItem(r.pick([1.05, 1.1, 1.5, 1.8, 2])),
      fracItem(...r.pick([[2, 3], [3, 4], [5, 6], [3, 5]])),
      fracItem(...r.pick([[5, 4], [6, 5], [9, 8], [4, 3]]), r.pick([2, 3, 5])),
      decItem(1, r.pick([0.5, 2, 4])),
    ]);
    return verlaufTask(items);
  }, 2, 41));

  // 158 a) Anfangswert, Wachstumsfaktor, Wachstumsrate aus y = a·q^x
  const faktorTask = (a, q, thing, unit, source) => ({
    prompt: `${thing} wird durch die Exponentialfunktion $y=${de(a)}\\cdot${de(q)}^x$ beschrieben ($x$ in ${unit}).\n\nGib den Anfangswert, den Wachstumsfaktor und die prozentuale Wachstumsrate an.`,
    answer: fields(num(a, { label: 'Anfangswert:' }), num(q, { label: 'Wachstumsfaktor q =', tol: 0.0001 }), num(Math.round((q - 1) * 1000) / 10, { label: `Wachstumsrate pro ${unit === 'Stunden' ? 'Stunde' : unit === 'Jahren' ? 'Jahr' : 'Tag'}:`, unit: '%', tol: 0.05 })),
    solution: `Die Funktion hat die Form $y=a\\cdot q^x$.\n\n- Anfangswert (bei $x=0$): $a=${de(a)}$\n- Wachstumsfaktor: $q=${de(q)}$\n- Wachstumsrate: $q-1=${de(q)}-1=${de(Math.round((q - 1) * 1000) / 1000)}$, das sind **${de(Math.round((q - 1) * 1000) / 10)} %** pro Zeitschritt.`,
    hint: 'Der Anfangswert steht vor dem $q^x$, der Wachstumsfaktor ist die Basis der Potenz. Die Wachstumsrate ist $q-1$ in Prozent.',
    source,
  });
  out.push(faktorTask(500, 1.8, 'Die Anzahl $y$ der Bakterien einer Bakterienkultur', 'Stunden', `${BOOK} · Aufgabe 158 a)`));
  out.push(...distinct((r) => faktorTask(r.pick([50, 120, 200, 250, 800]), r.pick([1.1, 1.2, 1.25, 1.4, 1.6, 2.5]), r.pick(['Die Anzahl $y$ der Bakterien in einer Kultur', 'Die Anzahl $y$ der Aufrufe eines Videos', 'Die Zahl $y$ der Pilzsporen auf einem Brot']), 'Stunden'), 2, 42));
  return out;
}

// ---- 154: Funktionsgleichungen den Graphen zuordnen
const FARBE = { schwarz: '#0f172a', rot: '#dc2626' };
function expFigure(spec) {
  const { xmin, xmax, ymax, curves } = spec;
  const W = 520, H = 330, Lm = 40, R = 18, T = 14, B = 30;
  const X = (x) => Lm + ((x - xmin) / (xmax - xmin)) * (W - Lm - R);
  const Y = (y) => H - B - (y / ymax) * (H - T - B);
  let g = `<clipPath id='c'><rect x='${Lm}' y='${T}' width='${W - Lm - R}' height='${H - T - B}'/></clipPath>`;
  for (let x = Math.ceil(xmin); x <= xmax; x++) g += `<line x1='${X(x)}' y1='${Y(0)}' x2='${X(x)}' y2='${Y(ymax)}' stroke='#e2e8f0'/>`;
  for (let y = 0; y <= ymax; y += 0.5) g += `<line x1='${X(xmin)}' y1='${Y(y)}' x2='${X(xmax)}' y2='${Y(y)}' stroke='#e2e8f0'/>`;
  g += `<line x1='${X(xmin)}' y1='${Y(0)}' x2='${X(xmax)}' y2='${Y(0)}' stroke='#334155' stroke-width='1.6'/><line x1='${X(0)}' y1='${Y(0)}' x2='${X(0)}' y2='${Y(ymax)}' stroke='#334155' stroke-width='1.6'/>`;
  const t = (x, y, s, anchor = 'middle', extra = '') => `<text x='${x}' y='${y}' text-anchor='${anchor}' font-family='Inter, Arial, sans-serif' font-size='13' fill='#475569' ${extra}>${s}</text>`;
  for (let x = Math.ceil(xmin); x <= xmax; x++) if (x !== 0) g += t(X(x), Y(0) + 16, String(x).replace('-', '−'));
  for (let y = 1; y <= ymax; y++) g += t(X(0) - 6, Y(y) + 4, String(y), 'end');
  g += t(X(0) - 6, Y(0) + 16, '0', 'end') + t(X(xmax) - 4, Y(0) - 7, 'x', 'end', "font-style='italic'") + t(X(0) + 8, T + 10, 'y', 'start', "font-style='italic'");
  for (const c of curves) {
    const pts = [];
    for (let x = xmin; x <= xmax + 1e-9; x += 0.05) pts.push(`${X(x).toFixed(1)},${Y(c.a * c.q ** x).toFixed(1)}`);
    g += `<polyline clip-path='url(#c)' points='${pts.join(' ')}' fill='none' stroke='${FARBE[c.color]}' stroke-width='2.4'${c.dashed ? " stroke-dasharray='7 5'" : ''}/>`;
    g += t(X(c.lx), Y(c.a * c.q ** c.lx) - 8, `<tspan font-weight='700' fill='${FARBE[c.color]}' font-size='15'>${c.name}</tspan>`);
  }
  return save(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'>${g}</svg>`, 'expzuordnung');
}
const eqText = (a, q) => `y = ${a === 1 ? '' : `${plain(a)}·`}${plain(q)}ˣ`;
function zuordnenTask({ figure, drawn, extra, source }) {
  const options = [...drawn.map((c) => eqText(c.a, c.q)), ...extra.map((c) => eqText(c.a, c.q))].sort((p, q) => p.localeCompare(q, 'de'));
  const url = expFigure(figure);
  return {
    prompt: `Ordne die Funktionsgleichungen dem passenden Graphen zu. **Zu zwei Gleichungen gibt es keinen passenden Graphen.**\n\n![Graphen A bis D](${url})\n\nGleichungen zur Auswahl: ${options.map((o) => `$${o.replace(/ˣ/g, '^x').replace(/·/g, '\\cdot ').replace(/,/g, '{,}')}$`).join(' · ')}`,
    answer: fields(...drawn.map((c) => sel(options, eqText(c.a, c.q), `Graph ${c.name}:`))),
    solution: drawn.map((c) => `**Graph ${c.name}:** $${eqText(c.a, c.q).replace(/ˣ/g, '^x').replace(/·/g, '\\cdot ').replace(/,/g, '{,}')}$. ${c.why}`).join('\n\n') + `\n\nKeinen Graphen gibt es für ${extra.map((c) => `$${eqText(c.a, c.q).replace(/ˣ/g, '^x').replace(/·/g, '\\cdot ').replace(/,/g, '{,}')}$`).join(' und ')}.\n\n**Merke:** Der Anfangswert $a$ ist der Schnittpunkt mit der $y$-Achse. Ist $q>1$, steigt der Graph, ist $0<q<1$, fällt er.`,
    hint: 'Lies zuerst ab, wo der Graph die $y$-Achse schneidet (das ist $a$). Dann erkennst du am Verlauf, ob $q$ größer oder kleiner als 1 ist.',
    source,
  };
}
const why = (a, q) => `Der Graph schneidet die $y$-Achse bei ${a} und ${q > 1 ? 'steigt' : 'fällt'}, also ist $a=${a}$ und $q${q > 1 ? '>' : '<'}1$.`;
function curve(name, a, q, color, dashed, lx) { return { name, a, q, color, dashed, lx, why: why(a, q) }; }

function wachstumLevel2() {
  const out = [];
  const A = curve('A', 1, 0.8, 'schwarz', false, -4.2), B = curve('B', 2, 0.8, 'rot', true, -3.8), C = curve('C', 2, 1.2, 'schwarz', true, 2.4), D = curve('D', 1, 1.2, 'rot', false, 3.8);
  out.push(zuordnenTask({ figure: { xmin: -4.5, xmax: 4.6, ymax: 5.5, curves: [A, B, C, D] }, drawn: [A, B, C, D], extra: [{ a: 1, q: 2 }, { a: 3, q: 0.8 }], source: `${BOOK} · Aufgabe 154` }));
  const A2 = curve('A', 1, 1.5, 'schwarz', false, 2.1), B2 = curve('B', 3, 0.5, 'rot', true, -0.7), C2 = curve('C', 1, 0.5, 'schwarz', true, -1.5), D2 = curve('D', 2, 1.5, 'rot', false, 1.6);
  out.push(zuordnenTask({ figure: { xmin: -3, xmax: 3, ymax: 6, curves: [A2, B2, C2, D2] }, drawn: [A2, B2, C2, D2], extra: [{ a: 1, q: 2 }, { a: 2, q: 0.5 }], source: `${BOOK} · Aufgabe 154, andere Zahlen` }));

  // 158 b) Wertetabelle zum Bakterienwachstum
  const tabelle = (a, q, source) => {
    const vals = range(0, 6).map((x) => Math.round(a * q ** x * 1000) / 1000);
    return {
      prompt: `Die Anzahl $y$ der Bakterien einer Bakterienkultur in Abhängigkeit von der Zeit $x$ (in Stunden) wird durch $y=${de(a)}\\cdot${de(q)}^x$ beschrieben.\n\nErstelle für die ersten sechs Stunden eine Wertetabelle (Runde auf ganze Bakterien). Beim Ausfüllen entsteht unten der Graph.`,
      answer: fieldsWith(cells(vals), table({ from: 0, cols: range(0, 6), rows: ['Bakterien'], corner: 'Stunde x', plot: { xs: range(0, 6), xlabel: 'Stunden x', ylabel: 'Bakterien' } })),
      solution: `Setze für $x$ die Werte 0 bis 6 in $y=${de(a)}\\cdot${de(q)}^x$ ein.\n\n| $x$ | ${range(0, 6).join(' | ')} |\n|---|${range(0, 6).map(() => '---').join('|')}|\n| $y$ | ${vals.map((v) => de(Math.round(v), 0)).join(' | ')} |\n\nSchneller geht es, wenn du immer das Ergebnis der Vorstunde mit $${de(q)}$ multiplizierst.`,
      hint: `Der Startwert bei $x=0$ ist ${de(a)}. Für den nächsten Wert multiplizierst du jeweils mit $${de(q)}$.`,
      source,
    };
  };
  out.push(tabelle(500, 1.8, `${BOOK} · Aufgabe 158 b)`));
  out.push(...distinct((r) => tabelle(r.pick([100, 200, 300, 400]), r.pick([1.5, 1.6, 1.4, 1.2, 2.2]), undefined), 2, 51));

  // 159 Verdopplung (Salmonellen)
  const verdopplung = (n0, min, hours, what, source) => {
    const k = (hours * 60) / min;
    const end = n0 * 2 ** k;
    return {
      prompt: `${what} Bei 25 °C verdoppelt sich die Anzahl der Salmonellen alle ${min} Minuten.\n\nBerechne die Anzahl nach ${dt(hours)} ${hours === 1 ? 'Stunde' : 'Stunden'}.`,
      answer: fields(num(end, { label: `Anzahl nach ${dt(hours)} h:` })),
      solution: `${hours * 60} Minuten : ${min} Minuten $=${k}$ Verdopplungen. Der Wachstumsfaktor ist $q=2$.\n\n$$y=${de(n0)}\\cdot2^{${k}}=${de(end, 0)}$$\n\nNach ${dt(hours)} Stunden sind es **${dt(end, 0)}**.`,
      hint: 'Rechne zuerst aus, wie oft sich die Anzahl in dieser Zeit verdoppelt, und nimm dann $2^{\\text{Anzahl}}$ mal den Startwert.',
      source,
    };
  };
  out.push(verdopplung(60, 15, 3, 'In einem verdorbenen Lebensmittel befinden sich um 13:00 Uhr ca. 60 Salmonellen.', `${BOOK} · Aufgabe 159`));
  // erzeugte Varianten von 159 mit eigenem Text (Startwert im Text)
  out.push(...distinct((r) => {
    const n0 = r.pick([20, 40, 50, 80]), min = r.pick([10, 20, 30]);
    const hours = min === 30 ? r.pick([2, 3]) : min === 20 ? r.pick([1, 2]) : 1;
    const k = (hours * 60) / min, end = n0 * 2 ** k;
    return {
      prompt: `In einer Petrischale befinden sich um 9:00 Uhr ca. ${n0} Bakterien. Die Anzahl der Bakterien verdoppelt sich alle ${min} Minuten.\n\nBerechne die Anzahl der Bakterien um ${9 + hours}:00 Uhr.`,
      answer: fields(num(end, { label: `Anzahl um ${9 + hours}:00 Uhr:` })),
      solution: `${hours * 60} Minuten : ${min} Minuten $=${k}$ Verdopplungen. Der Wachstumsfaktor ist $q=2$.\n\n$$y=${n0}\\cdot2^{${k}}=${de(end, 0)}$$\n\nUm ${9 + hours}:00 Uhr sind es **${dt(end, 0)} Bakterien**.`,
      hint: 'Rechne zuerst aus, wie oft sich die Anzahl in dieser Zeit verdoppelt.',
    };
  }, 2, 53));

  // 160 a) Halbwertszeit (Koffein)
  const halb = (m0, T, steps, what, source) => {
    const times = steps.map((s) => s * T);
    const vals = steps.map((s) => m0 * 0.5 ** s);
    return {
      prompt: what.prompt,
      answer: fields(...vals.map((v, i) => num(v, { label: `Nach ${times[i]} Stunden:`, unit: 'mg', tol: 0.01 }))),
      solution: `Die Halbwertszeit ist ${T} Stunden: Nach jeweils ${T} Stunden ist nur noch die **Hälfte** da ($q=0{,}5$).\n\n` + vals.map((v, i) => `Nach ${times[i]} Stunden: $${de(m0)}\\cdot0{,}5^{${steps[i]}}=${de(v, 3)}$ mg`).join('\n\n'),
      hint: `Alle ${T} Stunden halbiert sich die Menge.`,
      source,
    };
  };
  out.push(halb(80, 4, [1, 2, 3], {
    prompt: 'Die Halbwertszeit von Koffein im Blutkreislauf beträgt ca. vier Stunden. Lars trinkt um 8:00 Uhr morgens eine Tasse Kaffee mit 80 mg Koffein.\n\nWie viel Koffein hat er um 12:00 Uhr, um 16:00 Uhr und um 20:00 Uhr noch im Blut?',
  }, `${BOOK} · Aufgabe 160 a)`));
  out.push(...distinct((r) => {
    const m0 = r.pick([60, 100, 120, 160, 200]), T = r.pick([2, 3, 5, 6]);
    return halb(m0, T, [1, 2, 3], {
      prompt: `Ein Medikament hat im Blut eine Halbwertszeit von ${T} Stunden. Mia nimmt um 7:00 Uhr eine Tablette mit ${m0} mg Wirkstoff.\n\nWie viel Wirkstoff hat sie um ${7 + T}:00 Uhr, um ${7 + 2 * T}:00 Uhr und um ${7 + 3 * T}:00 Uhr noch im Blut?`,
    });
  }, 2, 54));
  return out;
}

// ---- 156 Zinseszins, 157 Restwert, 160 b) Funktionsgleichung
function wachstumLevel3() {
  const out = [];
  const zins = (K0, p, years, source) => {
    const q = 1 + p / 100;
    const end = K0 * q ** years;
    let dbl = 1;
    while (q ** dbl < 2) dbl++;
    return {
      prompt: `Ein Kapital von ${dt(K0, 0)} € wird mit einer jährlichen Verzinsung von ${dt(p)} % angelegt.\n\n**a)** Stelle die Exponentialfunktion auf, die diesen Wachstumsvorgang beschreibt ($x$ in Jahren, $y$ in €).\n\n**b)** Auf welches Guthaben ist das Anfangskapital nach ${years} Jahren angewachsen? (auf Cent runden)\n\n**c)** Bestimme durch Probieren mit dem Taschenrechner, nach wie vielen Jahren sich das Anfangskapital verdoppelt hat.`,
      answer: fields(expr(`${K0}*${q}^x`, { label: 'a) y =', vars: ['x'] }), approx(end, { label: `b) Guthaben nach ${years} Jahren:`, unit: '€', tol: 0.02 }), num(dbl, { label: 'c) Verdopplung nach', unit: 'Jahren' })),
      solution: `**a)** Wachstumsfaktor: $q=1+\\frac{${dt(p)}}{100}=${de(q, 4)}$\n\n$$y=${de(K0, 0)}\\cdot${de(q, 4)}^x$$\n\n**b)** $y=${de(K0, 0)}\\cdot${de(q, 4)}^{${years}}\\approx${de(end)}$ €\n\n**c)** Probieren: $${de(q, 4)}^{${dbl - 1}}\\approx${de(q ** (dbl - 1), 3)}$ (noch unter 2), $${de(q, 4)}^{${dbl}}\\approx${de(q ** dbl, 3)}$ (über 2). Nach **${dbl} Jahren** hat sich das Kapital verdoppelt.`,
      hint: 'Der Wachstumsfaktor ist $q=1+\\frac{p}{100}$. Die Funktion hat die Form $y=K_0\\cdot q^x$. Für c) probierst du $x=10,11,12,\\dots$ aus, bis das Ergebnis über dem Doppelten des Anfangskapitals liegt.',
      source,
    };
  };
  out.push(zins(1000, 4.5, 12, `${BOOK} · Aufgabe 156 a) bis c)`));
  out.push(...distinct((r) => zins(r.pick([800, 1500, 2000, 2500, 5000]), r.pick([2.5, 3, 3.5, 4, 5, 6]), r.pick([8, 10, 15]), undefined), 3, 61));

  // 157 Wertverlust eines Autos
  const auto = (P, p1, p2, source) => {
    const r1 = P * (1 - p1 / 100), q = 1 - p2 / 100;
    const at = (n) => r1 * q ** n;
    return {
      prompt: `Der Neupreis eines Autos beträgt ${dt(P, 0)} €. Im ersten Jahr ist der Wertverlust ${p1} % des Neupreises. In den folgenden Jahren beträgt der Wertverlust jährlich ${p2} % vom jeweiligen Restwert am Ende des Vorjahres.\n\n**a)** Berechne den Restwert nach dem ersten Jahr. Stelle dann eine Funktion auf, die den Restwert $y$ in Abhängigkeit von der Anzahl $x$ der Jahre **nach dem ersten Jahr** beschreibt.\n\n**b)** Wie groß ist der Restwert 3, 5 und 10 Jahre nach dem ersten Jahr? (auf ganze Euro runden)`,
      answer: fields(approx(r1, { label: 'a) Restwert nach dem 1. Jahr:', unit: '€', tol: 0.011 }), expr(`${r1}*${q}^x`, { label: 'a) y =', vars: ['x'] }), approx(at(3), { label: 'b) nach 3 Jahren:', unit: '€', tol: 1 }), approx(at(5), { label: 'nach 5 Jahren:', unit: '€', tol: 1 }), approx(at(10), { label: 'nach 10 Jahren:', unit: '€', tol: 1 })),
      solution: `**a)** Nach dem ersten Jahr sind noch ${100 - p1} % da: $${de(P, 0)}\\cdot${de((100 - p1) / 100)}=${de(r1)}$ €.\n\nAb dann gilt der Wachstumsfaktor $q=1-\\frac{${p2}}{100}=${de(q)}$:\n\n$$y=${de(r1)}\\cdot${de(q)}^x$$\n\n**b)** nach 3 Jahren: $${de(r1)}\\cdot${de(q)}^{3}\\approx${de(at(3), 0)}$ € · nach 5 Jahren: $\\approx${de(at(5), 0)}$ € · nach 10 Jahren: $\\approx${de(at(10), 0)}$ €`,
      hint: 'Im ersten Jahr rechnest du mit dem Prozentsatz vom Neupreis. Danach gilt der Wachstumsfaktor $q=1-\\frac{p}{100}$ pro Jahr.',
      source,
    };
  };
  out.push(auto(45600, 25, 10, `${BOOK} · Aufgabe 157, angepasst`));
  out.push(...distinct((r) => auto(r.pick([24000, 28500, 32000, 38000, 52000]), r.pick([20, 25, 30]), r.pick([8, 10, 12, 15]), undefined), 2, 62));

  // 160 b) Funktionsgleichung zur Halbwertszeit
  const halbFn = (m0, T, t, intro, source) => {
    const at = m0 * 0.5 ** (t / T);
    return {
      prompt: `${intro}\n\n**a)** Stelle eine passende Funktionsgleichung auf, die die Menge $y$ (in mg) in Abhängigkeit von der Zeit $x$ (in Stunden) beschreibt.\n\n**b)** Berechne die Menge nach ${dt(t)} Stunden. (auf zwei Nachkommastellen runden)`,
      answer: fields(expr(`${m0}*0.5^(x/${T})`, { label: 'a) y =', vars: ['x'] }), approx(at, { label: `b) Menge nach ${dt(t)} h:`, unit: 'mg', tol: 0.06 })),
      solution: `**a)** Alle ${T} Stunden halbiert sich die Menge, also ist der Faktor $0{,}5$ pro **${T} Stunden**. Für $x$ Stunden sind das $\\frac{x}{${T}}$ Zeitschritte:\n\n$$y=${de(m0)}\\cdot0{,}5^{\\frac{x}{${T}}}$$\n\n**b)** $y=${de(m0)}\\cdot0{,}5^{\\frac{${dt(t)}}{${T}}}\\approx${de(at)}$ mg`,
      hint: 'Die Menge halbiert sich nicht pro Stunde, sondern pro Halbwertszeit. Im Exponenten steht deshalb die Zeit geteilt durch die Halbwertszeit.',
      source,
    };
  };
  out.push(halbFn(80, 4, 6, 'Die Halbwertszeit von Koffein im Blutkreislauf beträgt ca. vier Stunden. Lars trinkt um 8:00 Uhr morgens eine Tasse Kaffee mit 80 mg Koffein.', `${BOOK} · Aufgabe 160 b)`));
  out.push(...distinct((r) => {
    const T = r.pick([2, 3, 5, 6]), m0 = r.pick([60, 100, 120, 200]);
    return halbFn(m0, T, T * r.pick([1.5, 2.5]), `Ein Medikament hat im Blut eine Halbwertszeit von ${T} Stunden. Mia nimmt um 7:00 Uhr eine Tablette mit ${m0} mg Wirkstoff ein.`);
  }, 2, 63));
  return out;
}

// ===================================================================== Zusammenbau und Einspielen
// Liefert je Thema und Stufe (1 leicht, 2 mittel, 3 schwer) die Varianten.
export function build() {
  return [
    { topic: GLS, level: 1, title: 'Gleichungssysteme lösen', section: 'Einsetzungsverfahren', variants: glsLevel1() },
    { topic: GLS, level: 2, title: 'Gleichungssysteme lösen', section: 'Gleichsetzungsverfahren', variants: glsLevel2() },
    { topic: GLS, level: 3, title: 'Gleichungssysteme in Sachaufgaben', section: 'Vom Text zum Gleichungssystem', variants: glsLevel3() },
    { topic: WACHSTUM, level: 1, title: 'Wachstumsfaktor und Verlauf', section: 'Wachstumsfaktor', variants: wachstumLevel1() },
    { topic: WACHSTUM, level: 2, title: 'Exponentialfunktionen und Wertetabellen', section: 'Exponentialfunktionen', variants: wachstumLevel2() },
    { topic: WACHSTUM, level: 3, title: 'Wachstums- und Zerfallsprozesse', section: 'Exponentialfunktionen', variants: wachstumLevel3() },
  ];
}

const PROFILES = ['RS10', 'ERS10'];

function addVariants(taskId, variants, startSort) {
  variants.forEach((v, i) => run(
    'INSERT INTO task_variants (task_id, prompt, context, points, answer, solution, hint, source, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    taskId, v.prompt, '', 0, JSON.stringify(v.answer), v.solution || '', v.hint || '', v.source || '', startSort + i,
  ));
}

// Legt die Aufgaben an (einmalig). Wachstum wird für die Realschule (RS 10) freigeschaltet, damit das Thema auch dort im Test vorkommt.
export function seedDiagGlsWachstum() {
  if (getSetting(SETTING, '')) return;
  const gls = get('SELECT * FROM topics WHERE title = ?', GLS);
  const wachstum = get('SELECT * FROM topics WHERE title = ?', WACHSTUM);
  if (!gls || !wachstum) return; // Themen kommen aus dem Grundlagen-Import; beim nächsten Start erneut versuchen

  const data = build();
  let nTasks = 0, nVariants = 0;
  tx(() => {
    // Wachstum auch für RS 10 öffnen (Themenfreigabe und die Übungspakete der erw. RS)
    const have = json(wachstum.profiles, []);
    if (have.length && !have.includes('RS10')) {
      run('UPDATE topics SET profiles = ? WHERE id = ?', JSON.stringify([...have, 'RS10']), wachstum.id);
      for (const p of all('SELECT id, profiles FROM packages WHERE topic_id = ?', wachstum.id)) {
        const pp = json(p.profiles, []);
        if (pp.includes('ERS10') && !pp.includes('RS10')) run('UPDATE packages SET profiles = ? WHERE id = ?', JSON.stringify([...pp, 'RS10']), p.id);
      }
    }

    for (const entry of data) {
      const topic = entry.topic === GLS ? gls : wachstum;
      const sectionId = get('SELECT id FROM script_sections WHERE topic_id = ? AND title = ? ORDER BY id LIMIT 1', topic.id, entry.section)?.id ?? null;
      for (const profile of PROFILES) {
        let task = get("SELECT * FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = ? AND difficulty = ?", topic.id, profile, entry.level);
        if (!task) {
          const id = Number(run(
            "INSERT INTO tasks (kind, topic_id, profile, difficulty, title, script_section_id, sort) VALUES ('diagnose', ?, ?, ?, ?, ?, ?)",
            topic.id, profile, entry.level, entry.title, sectionId, entry.level - 1,
          ).lastInsertRowid);
          task = get('SELECT * FROM tasks WHERE id = ?', id);
          nTasks++;
          // RS 10 bekommt für Wachstum zusätzlich die vorhandenen Aufgaben der erw. RS (RS 10 und erw. RS haben dieselben Aufgaben)
          if (topic.id === wachstum.id && profile === 'RS10') {
            const src = get("SELECT id FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = 'ERS10' AND difficulty = ?", topic.id, entry.level);
            if (src) {
              const old = all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort', src.id);
              old.forEach((v, i) => run(
                'INSERT INTO task_variants (task_id, prompt, context, points, answer, solution, hint, source, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                task.id, v.prompt, v.context, v.points, v.answer, v.solution, v.hint, v.source, i,
              ));
            }
          }
        }
        const sort = (get('SELECT MAX(sort) AS m FROM task_variants WHERE task_id = ?', task.id).m ?? -1) + 1;
        addVariants(task.id, entry.variants, sort);
        nVariants += entry.variants.length;
      }
    }
    setSetting(SETTING, '1');
  });
  console.log(`Einstiegstest ergänzt (Lineare Gleichungssysteme, Wachstum): ${nTasks} neue Aufgaben, ${nVariants} Varianten.`);
}
