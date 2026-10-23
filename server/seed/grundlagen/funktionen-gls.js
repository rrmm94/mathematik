// Grundlagen-Training: Lineare Funktionen und lineare Gleichungssysteme
import { L, rng, de, dt, num, fields, choice, sel, expr, approx, money, table, fieldsWith, constraint, graph, eq, lin } from './kit.js';

const V = (xmin, xmax, ymin, ymax, o = {}) => ({ xmin, xmax, ymin, ymax, xstep: 1, ystep: 1, snapX: 1, snapY: 1, ...o });
const LET = 'abcdefgh';

function distinct(gen, count, seed) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < count * 10; i++) {
    const v = gen(rng(seed * 131 + i));
    if (!v || seen.has(v.prompt)) continue;
    seen.add(v.prompt);
    out.push(v);
  }
  return out;
}

export function build({ fig }) {
  // ------------------------------------------------------------------ Lineare Funktionen
  const drawLine = (name, letter, m, b) => {
    const url = fig.plot({ lines: [{ m, b, label: letter }], name: `lf-${name}` });
    return {
      prompt: `Zeichne den Graphen der Funktion $${letter}\\colon\\ y=${lin(m, b)}$ in das Koordinatensystem.\n\nTipp: Der Punkt $(0\\mid ${de(b)})$ liegt auf der Geraden. Mit der Steigung $m=${de(m)}$ findest du einen zweiten Punkt.`,
      answer: graph({ view: V(-5, 5, -5, 5, { snapY: 0.5 }), lines: [{ m, b }] }),
      solution: `**Wertetabelle:** $y=${lin(m, b)}$\n\n| $x$ | $-2$ | $-1$ | $0$ | $1$ | $2$ |\n|---|---|---|---|---|---|\n| $y$ | ${[-2, -1, 0, 1, 2].map((x) => de(m * x + b)).join(' | ')} |\n\n**Steigungsdreieck:** Starte bei $b=${de(b)}$ auf der $y$-Achse. ${m >= 0 ? `Gehe $1$ nach rechts und $${de(m)}$ nach oben.` : `Gehe $1$ nach rechts und $${de(-m)}$ nach unten (negative Steigung).`}\n\n![Graph](${url})`,
      hint: 'Setze zwei $x$-Werte in die Funktionsgleichung ein (z. B. 0 und 2) und trage die beiden Punkte ein. Oder: Start bei $b$ auf der $y$-Achse, dann das Steigungsdreieck.',
    };
  };
  const lineGen = (letter, seed) => distinct((r) => {
    const m = r.pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3]);
    const b = r.int(-4, 4);
    if (Math.abs(m + b) > 5 || Math.abs(2 * m + b) > 9) return null;
    return drawLine(`${letter}${m}${b}`, letter, m, b);
  }, 2, seed);

  const readLine = (name, letter, m, b, view) => {
    const url = fig.plot({ ...view, lines: [{ m, b, label: letter }], name: `lf-lesen-${name}` });
    return url;
  };
  const urlA = readLine('a', 'g', -1, 3, { xmin: -2, xmax: 5, ymin: -2, ymax: 5 });
  const urlB = readLine('b', 'h', 2, -3, { xmin: -3, xmax: 4, ymin: -4, ymax: 3 });

  const steigung = fig.plot({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, name: 'lf-steigung', lines: [{ m: 1.5, b: 2, label: 'g₁' }, { m: -1, b: -2, label: 'g₂' }, { m: 0, b: 3, label: 'g₃' }] });
  const kerze = [
    {
      prompt: 'Lena zündet eine 8 cm lange Kerze an, die gleichmäßig pro Stunde um 2 cm abbrennt.\n\na) Stelle die Funktionsgleichung für die Länge der Kerze in Abhängigkeit von der Brenndauer $x$ (in Stunden) auf.\n\nb) Nach wie vielen Stunden ist die Kerze abgebrannt?',
      answer: fields(expr('-2x+8', { label: 'a) y =' }), num(4, { label: 'b) Nach', unit: 'Stunden' })),
      solution: 'Pro Stunde wird die Kerze **2 cm kürzer**: $m=-2$. Am Anfang ist sie **8 cm** lang: $b=8$.\n\n$$y=-2x+8$$\n\nb) Die Kerze ist abgebrannt, wenn $y=0$: $-2x+8=0 \\Rightarrow x=4$. Nach **4 Stunden**.',
      hint: 'Die Steigung ist negativ, weil die Kerze kürzer wird. $b$ ist die Anfangslänge.',
    },
  ];

  const bus = {
    prompt: 'Ein Busunternehmen macht der Klasse 10 a ein Angebot für eine Tagesreise:\n\n- Die Tagespauschale beträgt $85\\ €$.\n- Für jeden gefahrenen Kilometer müssen $2\\ €$ bezahlt werden.\n\na) Stelle eine Funktionsgleichung auf, mit der die Klasse den Preis $y$ (in €) für die Busfahrt über $x$ Kilometer schnell berechnen kann.\n\nb) Berechne mit deiner Gleichung den Preis für 120 km.',
    answer: fields(expr('2x+85', { label: 'a) y =' }), money(325, 'b) Preis:')),
    solution: 'Die Pauschale von $85\\ €$ fällt immer an: $b=85$. Pro Kilometer kommen $2\\ €$ dazu: $m=2$.\n\n$$y=2x+85$$\n\nb) $y=2\\cdot120+85=240+85=325$ → Die Fahrt über 120 km kostet **325 €**.',
    hint: 'Feste Kosten = $b$ (der Wert bei $x=0$), Kosten pro Kilometer = $m$.',
  };

  const poolPoints = [[2, 48, ''], [3, 42, '']];
  const pool = 'Ein Swimmingpool wird im Herbst leer gepumpt. Nach zwei Stunden sind noch $48\\ \\text{m}^3$ Wasser im Pool, nach einer weiteren Stunde noch $42\\ \\text{m}^3$.';
  const poolUrl = fig.plot({ xmin: 0, xmax: 11, ymin: 0, ymax: 70, xstep: 1, ystep: 10, xlabel: 'Stunden', ylabel: 'm³', name: 'pool', lines: [{ m: -6, b: 60 }], points: [{ x: 2, y: 48 }, { x: 3, y: 42 }, { x: 0, y: 60 }, { x: 10, y: 0 }] });

  const efUrl = fig.plot({ xmin: -4, xmax: 6, ymin: -2, ymax: 8, name: 'ef', lines: [{ m: -1, b: 4, label: 'h' }], points: [{ x: -2, y: 6, label: 'E' }, { x: 2, y: 2, label: 'F' }] });

  // ------------------------------------------------------------------ Gleichungssysteme
  const solveFields = (x, y, tol = 0) => fields(approx(x, { label: 'x =', tol: tol || (Number.isInteger(x) ? 0 : 0.011) }), approx(y, { label: 'y =', tol: tol || (Number.isInteger(y) ? 0 : 0.011) }));

  // 17: Wertetabelle
  const wt = (m1, b1, m2, b2, x0) => {
    const xs = [1, 2, 3, 4, 5];
    const y1 = xs.map((x) => m1 * x + b1);
    const y2 = xs.map((x) => m2 * x + b2);
    const y0 = m1 * x0 + b1;
    const cells = [...y1, ...y2].map((v) => approx(v, { tol: Number.isInteger(v) ? 0 : 0.011 }));
    return {
      prompt: `Löse das Gleichungssystem mithilfe einer Wertetabelle.\n\n$$\\text{I}\\quad y=${lin(m1, b1)} \\qquad \\text{II}\\quad y=${lin(m2, b2)}$$\n\nFülle die Tabelle aus. Sobald in einer Spalte beide Werte gleich sind, wird sie grün. Trage dann die Lösung ein.`,
      answer: fieldsWith([...cells, approx(x0, { label: 'x =', tol: 0 }), approx(y0, { label: 'y =', tol: Number.isInteger(y0) ? 0 : 0.011 })],
        table({ cols: xs, rows: [`I: $y=${lin(m1, b1)}$`, `II: $y=${lin(m2, b2)}$`], corner: 'x', highlightEqual: true })),
      solution: `| $x$ | ${xs.join(' | ')} |\n|---|${xs.map(() => '---').join('|')}|\n| I | ${y1.map((v) => de(v)).join(' | ')} |\n| II | ${y2.map((v) => de(v)).join(' | ')} |\n\nBei $x=${de(x0)}$ sind beide $y$-Werte gleich $${de(y0)}$. Die Lösung ist $x=${de(x0)}$ und $y=${de(y0)}$, also der Schnittpunkt $S(${de(x0)}\\mid${de(y0)})$.`,
      hint: 'Setze die $x$-Werte nacheinander in beide Gleichungen ein. Gesucht ist der $x$-Wert, bei dem beide Gleichungen denselben $y$-Wert liefern.',
    };
  };
  const wtGen = (seed) => distinct((r) => {
    const x0 = r.int(2, 4);
    const m1 = r.pick([1, 2, 3, 1.5, 0.5, -1, -2]);
    let m2 = r.pick([1, 2, 3, 1.5, 0.5, -0.5, -1, -2, 4]);
    if (m2 === m1) m2 = m1 + 1;
    const b1 = r.int(-5, 3);
    const y0 = m1 * x0 + b1;
    const b2 = y0 - m2 * x0;
    if (!Number.isInteger(b2 * 2) || Math.abs(b2) > 9) return null;
    return wt(m1, b1, m2, b2, x0);
  }, 2, seed);

  // 18: zeichnerisch
  const drawSystem = (name, eq1, eq2, l1, l2, x0, y0, norm) => {
    const url = fig.plot({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, name: `gls18${name}`, lines: [{ ...l1, label: 'I' }, { ...l2, label: 'II' }], points: [{ x: x0, y: y0, label: 'S' }] });
    return [
      {
        prompt: `Löse das Gleichungssystem **zeichnerisch**.\n\n$$\\text{I}\\quad ${eq1}\\qquad\\text{II}\\quad ${eq2}$$\n\nForme zuerst beide Gleichungen nach $y$ um und zeichne dann beide Geraden: je zwei Punkte, zuerst für Gleichung I (blau), dann für Gleichung II (gelb).`,
        answer: graph({ view: V(-6, 6, -6, 6), lines: [l1, l2], labels: ['Gleichung I', 'Gleichung II'] }),
        solution: `Nach $y$ umgestellt:\n\n${norm}\n\n![Graphen](${url})`,
        hint: 'Gleichung nach $y$ auflösen, dann $b$ als Startpunkt auf der $y$-Achse und das Steigungsdreieck. Du kannst auch zwei Punkte aus einer Wertetabelle nehmen.',
      },
      {
        prompt: `Du hast die beiden Geraden gezeichnet:\n\n$$\\text{I}\\quad ${eq1}\\qquad\\text{II}\\quad ${eq2}$$\n\nLies am **Schnittpunkt** $S(x\\mid y)$ die Lösung des Gleichungssystems ab.`,
        answer: solveFields(x0, y0),
        solution: `Die Geraden schneiden sich in $S(${de(x0)}\\mid${de(y0)})$.\n\n![Graphen](${url})\n\n**Probe:** in I und II einsetzen. Beide Gleichungen stimmen für $x=${de(x0)}$, $y=${de(y0)}$.`,
        hint: 'Der Schnittpunkt liegt auf beiden Geraden. Seine Koordinaten sind die Lösung.',
      },
    ];
  };
  const s18a = drawSystem('a', '2y+2x=-4', 'y-2x=4', { m: -1, b: -2 }, { m: 2, b: 4 }, -2, 0, '$\\text{I}\\quad 2y+2x=-4 \\Rightarrow y=-x-2$\n\n$\\text{II}\\quad y-2x=4 \\Rightarrow y=2x+4$');
  const s18b = drawSystem('b', '3y-6x=12', '2y=2x+2', { m: 2, b: 4 }, { m: 1, b: 1 }, -3, -2, '$\\text{I}\\quad 3y-6x=12 \\Rightarrow y=2x+4$\n\n$\\text{II}\\quad 2y=2x+2 \\Rightarrow y=x+1$');

  // 19: rechnerisch
  const sys = (a1, b1, c1, a2, b2, c2, x, y, steps) => ({
    prompt: `Löse das Gleichungssystem mit einem rechnerischen Lösungsverfahren (Einsetzungs- oder Gleichsetzungsverfahren).\n\n$$\\text{I}\\quad ${eq(a1, b1, c1)}\\qquad\\text{II}\\quad ${eq(a2, b2, c2)}$$`,
    answer: solveFields(x, y),
    solution: `${steps || ''}\n\n**Lösung:** $x=${de(x)}$ und $y=${de(y)}$\n\n**Probe:** I: $${de(a1)}\\cdot${de(x)}${b1 < 0 ? '-' : '+'}${de(Math.abs(b1))}\\cdot${de(y)} = ${de(c1)}$ ✓  II: $${de(a2)}\\cdot${de(x)}${b2 < 0 ? '-' : '+'}${de(Math.abs(b2))}\\cdot${de(y)} = ${de(c2)}$ ✓`,
    hint: 'Stelle beide Gleichungen nach derselben Variablen um (Gleichsetzungsverfahren) oder löse eine Gleichung nach $x$ oder $y$ auf und setze in die andere ein (Einsetzungsverfahren).',
  });
  const s19a = sys(2, -3, 9, 2, 4, 2, 3, -1, 'Beide Gleichungen nach $x$ auflösen:\n\n$\\text{I}\\quad 2x=9+3y \\Rightarrow x=4{,}5+1{,}5y$\n\n$\\text{II}\\quad 2x=2-4y \\Rightarrow x=1-2y$\n\nGleichsetzen: $4{,}5+1{,}5y=1-2y \\;\\Rightarrow\\; 3{,}5y=-3{,}5 \\;\\Rightarrow\\; y=-1$\n\nEinsetzen in $x=1-2y$: $x=1-2\\cdot(-1)=3$');
  const s19b = sys(2, -7, 0, 1, 4, 30, 14, 4, 'Gleichung II nach $x$ auflösen: $x=30-4y$\n\nEinsetzen in I: $2(30-4y)-7y=0 \\;\\Rightarrow\\; 60-8y-7y=0 \\;\\Rightarrow\\; -15y=-60 \\;\\Rightarrow\\; y=4$\n\nEinsetzen in $x=30-4y$: $x=30-16=14$');
  const sysGen = (seed) => distinct((r) => {
    const x = r.int(-4, 8), y = r.int(-4, 8);
    const a1 = r.pick([1, 2, 3, 4, -1, -2]), b1 = r.pick([1, 2, 3, -1, -2, -3]);
    const a2 = r.pick([1, 2, 3, 5, -1, -3]), b2 = r.pick([1, 2, 4, -1, -2, -4]);
    if (a1 * b2 - a2 * b1 === 0 || (x === 0 && y === 0)) return null;
    return sys(a1, b1, a1 * x + b1 * y, a2, b2, a2 * x + b2 * y, x, y, '');
  }, 3, seed);

  // 20: Schnittpunkt
  const cut = (lines, x, y, solution) => ({
    prompt: `Bestimme den Schnittpunkt der linearen Funktionen mit einem Verfahren deiner Wahl.\n\n$$\\text{I}\\quad ${lines[0]}\\qquad\\text{II}\\quad ${lines[1]}$$`,
    answer: solveFields(x, y),
    solution: `${solution}\n\nDer Schnittpunkt ist $S(${de(x)}\\mid${de(y)})$.`,
    hint: 'Bei zwei Funktionen in der Form $y=\\dots$ ist das Gleichsetzungsverfahren am schnellsten: beide rechten Seiten gleich setzen.',
  });
  const cutGen = (seed) => distinct((r) => {
    const x = r.int(-4, 6);
    const m1 = r.pick([-2, -1, -0.5, 0.5, 1, 2]);
    let m2 = r.pick([-3, -2, -1, 1, 2, 3, 0.5]);
    if (m2 === m1) m2 = 3;
    const b1 = r.int(-5, 6);
    const y = m1 * x + b1;
    const b2 = y - m2 * x;
    if (!Number.isInteger(b2 * 2) || Math.abs(b2) > 12 || Math.abs(y) > 15) return null;
    return cut([`y=${lin(m1, b1)}`, `y=${lin(m2, b2)}`], x, y, `Gleichsetzen: $${lin(m1, b1)}=${lin(m2, b2)}$ → $x=${de(x)}$, dann $y=${de(m1)}\\cdot${de(x)}${b1 < 0 ? '-' : '+'}${de(Math.abs(b1))}=${de(y)}$.`);
  }, 3, seed);
  const c20 = [
    [cut(['y=x-2', 'y=-0{,}5x+4'], 4, 2, 'Gleichsetzen: $x-2=-0{,}5x+4 \\;\\Rightarrow\\; 1{,}5x=6 \\;\\Rightarrow\\; x=4$\n\nEinsetzen: $y=4-2=2$'), ...cutGen(1)],
    [cut(['y=0{,}5x+6', 'y=-8x+40'], 4, 8, 'Gleichsetzen: $0{,}5x+6=-8x+40 \\;\\Rightarrow\\; 8{,}5x=34 \\;\\Rightarrow\\; x=4$\n\nEinsetzen: $y=0{,}5\\cdot4+6=8$'), ...cutGen(2)],
    [cut(['-0{,}25x=y-5', '0{,}5+y=2{,}5x'], 2, 4.5, 'Beide Gleichungen nach $y$ auflösen:\n\n$\\text{I}\\quad y=-0{,}25x+5$\n\n$\\text{II}\\quad y=2{,}5x-0{,}5$\n\nGleichsetzen: $-0{,}25x+5=2{,}5x-0{,}5 \\;\\Rightarrow\\; 5{,}5=2{,}75x \\;\\Rightarrow\\; x=2$\n\nEinsetzen: $y=2{,}5\\cdot2-0{,}5=4{,}5$')],
    [cut(['4y=12-8x', '-5y=15x-5'], -2, 7, 'Beide Gleichungen nach $y$ auflösen:\n\n$\\text{I}\\quad y=3-2x$\n\n$\\text{II}\\quad y=-3x+1$\n\nGleichsetzen: $3-2x=-3x+1 \\;\\Rightarrow\\; x=-2$\n\nEinsetzen: $y=3-2\\cdot(-2)=7$')],
  ];

  // 21: Anzahl der Lösungen
  const view21 = { xmin: -5, xmax: 5, ymin: -4, ymax: 5, name: '' };
  const figA = fig.plot({ ...view21, title: 'Schaubild A', name: 'gls21A', lines: [{ m: 0.5, b: 1 }, { m: 0.5, b: -1 }] });
  const figB = fig.plot({ ...view21, title: 'Schaubild B', name: 'gls21B', lines: [{ m: 1.5, b: -1 }] });
  const figC = fig.plot({ ...view21, title: 'Schaubild C', name: 'gls21C', lines: [{ m: -0.25, b: 1 }, { m: 0.5, b: 2.5 }] });
  const NUMS = ['keine Lösung', 'genau eine Lösung', 'unendlich viele Lösungen'];
  const shots = `![A](${figA})\n\n![B](${figB})\n\n![C](${figC})`;
  const t21 = (label, e1, e2, nIdx, shot, why) => ({
    prompt: `Bestimme die Anzahl der Lösungen des Gleichungssystems und ordne es einem der Schaubilder A, B oder C zu.\n\n$$\\text{I}\\quad ${e1}\\qquad\\text{II}\\quad ${e2}$$\n\n${shots}`,
    answer: fields(sel(NUMS, NUMS[nIdx], 'Das Gleichungssystem hat'), sel(['A', 'B', 'C'], shot, 'und gehört zu Schaubild')),
    solution: why,
    hint: 'Forme beide Gleichungen nach $y$ um und vergleiche die Steigungen $m$ und die Achsenabschnitte $b$.',
    label,
  });
  const q21 = [
    t21('a', '2x+8y=8', '-2x=10-4y', 1, 'C', '$\\text{I}\\quad y=-0{,}25x+1$\n\n$\\text{II}\\quad y=0{,}5x+2{,}5$\n\nDie Steigungen sind verschieden ($-0{,}25 \\neq 0{,}5$): Die Geraden **schneiden sich** → **genau eine Lösung** → Schaubild **C**.'),
    t21('b', 'x+2-2y=0', '1{,}5x=3y+3', 0, 'A', '$\\text{I}\\quad y=0{,}5x+1$\n\n$\\text{II}\\quad y=0{,}5x-1$\n\nGleiche Steigung, aber verschiedene Achsenabschnitte: Die Geraden sind **parallel** → **keine Lösung** → Schaubild **A**.'),
    t21('c', '4y=6x-4', '3x-2y=2', 2, 'B', '$\\text{I}\\quad y=1{,}5x-1$\n\n$\\text{II}\\quad y=1{,}5x-1$\n\nBeide Gleichungen ergeben dieselbe Gerade (identisch) → **unendlich viele Lösungen** → Schaubild **B**.'),
  ];

  // 22: Gleichungssystem aufstellen
  const t22 = [
    {
      prompt: 'Lege geeignete Variablen fest und stelle ein passendes Gleichungssystem auf.\n\n**Die Summe zweier Zahlen ist 27 und das Produkt 72.**\n\nWelches Gleichungssystem passt? ($x$ und $y$ sind die beiden Zahlen.)',
      answer: choice(['I $x+y=27$ und II $x\\cdot y=72$', 'I $x+y=72$ und II $x\\cdot y=27$', 'I $x-y=27$ und II $x\\cdot y=72$', 'I $x+y=27$ und II $x+y=72$'], 0),
      solution: 'Variablen: erste Zahl $x$, zweite Zahl $y$.\n\n- „Die **Summe** ist 27“ → $x+y=27$\n- „Das **Produkt** ist 72“ → $x\\cdot y=72$\n\nLösung: $x=3$ und $y=24$ (oder umgekehrt), denn $3+24=27$ und $3\\cdot24=72$.',
      hint: 'Summe heißt plus, Produkt heißt mal.',
    },
    {
      prompt: 'Zwei E-Scooter-Firmen haben folgende Angebote:\n\n| | Freischaltgebühr | Preis pro km |\n|---|---|---|\n| **Togo** | 1 € | 80 Cent |\n| **Elsa** | 3 € | 60 Cent |\n\nLege Variablen fest ($x$: gefahrene Kilometer, $y$: Preis in €) und stelle ein passendes Gleichungssystem auf.',
      answer: choice(['I $y=0{,}8x+1$ und II $y=0{,}6x+3$', 'I $y=0{,}8x+3$ und II $y=0{,}6x+1$', 'I $y=80x+1$ und II $y=60x+3$', 'I $y=x+0{,}8$ und II $y=x+0{,}6$'], 0),
      solution: 'Die Freischaltgebühr ist der feste Betrag ($b$), der Preis pro km die Steigung ($m$). Weil der Preis in € angegeben wird, sind 80 Cent $=0{,}8\\ €$.\n\n- Togo: $y=0{,}8x+1$\n- Elsa: $y=0{,}6x+3$\n\nGleichsetzen: $0{,}8x+1=0{,}6x+3 \\Rightarrow x=10$. Bei **10 km** kosten beide **9 €**.',
      hint: 'Rechne Cent in Euro um: 80 Cent = 0,80 €.',
    },
    {
      prompt: 'Im Café bezahlt Marta für 4 Saftschorlen und 4 Waffeln $32\\ €$. Jannis bezahlt für 3 Saftschorlen und 5 Waffeln $34\\ €$.\n\nLege Variablen fest ($s$: Preis einer Saftschorle, $w$: Preis einer Waffel) und stelle ein passendes Gleichungssystem auf.',
      answer: choice(['I $4s+4w=32$ und II $3s+5w=34$', 'I $4s+4w=34$ und II $3s+5w=32$', 'I $4s+3w=32$ und II $4s+5w=34$', 'I $s+w=32$ und II $s+w=34$'], 0),
      solution: 'Jede Person bezahlt „Anzahl · Preis“:\n\n- Marta: $4s+4w=32$\n- Jannis: $3s+5w=34$\n\nLösung: $s=3$ und $w=5$. Eine Saftschorle kostet **3 €**, eine Waffel **5 €**. (Probe: $4\\cdot3+4\\cdot5=32$ ✓, $3\\cdot3+5\\cdot5=34$ ✓)',
      hint: 'Achte darauf, dass in beiden Gleichungen die Saftschorlen vorne und die Waffeln hinten stehen.',
    },
  ];

  // 23: Streamingdienste
  const cA = [0, 1, 2, 3, 4, 5].map((n) => 5 + 3 * n);
  const cB = [0, 1, 2, 3, 4, 5].map((n) => 3 + 3.5 * n);
  const streamBase = 'Sarah hat die Wahl zwischen zwei Streaminganbietern:\n\n| | Grundgebühr pro Monat | Preis pro Film |\n|---|---|---|\n| **Anbieter A** | 5 € | 3 € |\n| **Anbieter B** | 3 € | 3,50 € |';
  const streamUrl = fig.plot({ xmin: 0, xmax: 8, ymin: 0, ymax: 32, xstep: 1, ystep: 4, xlabel: 'Filme', ylabel: '€', name: 'stream', lines: [{ m: 3, b: 5, label: 'A' }, { m: 3.5, b: 3, label: 'B' }], points: [{ x: 4, y: 17 }] });
  const t23 = [
    {
      prompt: `${streamBase}\n\na) Erstelle eine geeignete Wertetabelle (Kosten pro Monat in €). Beim Ausfüllen entsteht unten der Graph.`,
      answer: fieldsWith([...cA, ...cB].map((v) => approx(v, { tol: Number.isInteger(v) ? 0 : 0.011 })), table({ cols: [0, 1, 2, 3, 4, 5], rows: ['Anbieter A', 'Anbieter B'], corner: 'Filme', plot: { xs: [0, 1, 2, 3, 4, 5], xlabel: 'Filme', ylabel: 'Kosten in €' } })),
      solution: `Anbieter A: $5+3\\cdot n$ · Anbieter B: $3+3{,}5\\cdot n$\n\n| Filme | 0 | 1 | 2 | 3 | 4 | 5 |\n|---|---|---|---|---|---|---|\n| A | ${cA.map((v) => de(v)).join(' | ')} |\n| B | ${cB.map((v) => de(v)).join(' | ')} |\n\nBei **4 Filmen** kosten beide **17 €**.`,
      hint: 'Rechne Grundgebühr + Anzahl der Filme · Preis pro Film.',
    },
    {
      prompt: `${streamBase}\n\nb) Stelle den Sachverhalt in einem Koordinatensystem dar. Zeichne zuerst die Gerade für Anbieter A (2 Punkte), dann die für Anbieter B (2 Punkte).`,
      answer: graph({ view: V(0, 8, 0, 32, { ystep: 4, snapY: 1, xlabel: 'Filme', ylabel: 'Kosten in €' }), lines: [{ m: 3, b: 5 }, { m: 3.5, b: 3 }], labels: ['Anbieter A', 'Anbieter B'] }),
      solution: `A: $y=3x+5$ (Start bei 5, 3 hoch pro Film) · B: $y=3{,}5x+3$ (Start bei 3, 3,5 hoch pro Film)\n\n![Graphen](${streamUrl})\n\nDie Geraden schneiden sich bei $x=4$.`,
      hint: 'Beide Geraden starten auf der $y$-Achse bei der Grundgebühr (5 bzw. 3).',
    },
    {
      prompt: `${streamBase}\n\nc) Stelle ein passendes Gleichungssystem auf und gib an, bei welcher Anzahl von Filmen beide Anbieter gleich teuer sind.`,
      answer: fields(sel(['I y = 5 + 3x; II y = 3 + 3,5x', 'I y = 5x + 3; II y = 3x + 3,5', 'I y = 3 + 5x; II y = 3,5 + 3x'], 'I y = 5 + 3x; II y = 3 + 3,5x', 'Gleichungssystem:'), num(4, { label: 'Gleich teuer bei', unit: 'Filmen' })),
      solution: '$x$: Anzahl der Filme, $y$: Kosten in €\n\n$\\text{I}\\quad y=3x+5$\n\n$\\text{II}\\quad y=3{,}5x+3$\n\nGleichsetzen: $3x+5=3{,}5x+3 \\Rightarrow 2=0{,}5x \\Rightarrow x=4$. Bei **4 Filmen** sind beide gleich teuer (je 17 €).',
      hint: 'Die Grundgebühr ist der feste Teil, der Preis pro Film steht bei $x$.',
    },
    {
      prompt: `${streamBase}\n\nd) Begründe, wie sich Sarah deiner Meinung nach entscheiden soll.`,
      answer: choice([
        'Bis 3 Filme im Monat ist B günstiger, ab 5 Filmen ist A günstiger.',
        'Anbieter A ist immer günstiger, weil der Preis pro Film kleiner ist.',
        'Anbieter B ist immer günstiger, weil die Grundgebühr kleiner ist.',
        'Es ist egal, beide kosten immer gleich viel.',
      ], 0),
      solution: 'Bei **4 Filmen** kosten beide gleich viel (17 €).\n\n- Schaut Sarah **weniger als 4 Filme** im Monat, ist **Anbieter B** günstiger (kleine Grundgebühr).\n- Schaut sie **mehr als 4 Filme**, ist **Anbieter A** günstiger (kleinerer Preis pro Film).\n\nSie sollte sich also nach ihrem Filmverhalten entscheiden.',
      hint: 'Schau im Graphen, welche Gerade links bzw. rechts vom Schnittpunkt weiter unten liegt.',
    },
  ];

  // 24 / 25 / 27 Sachaufgaben
  const t24 = [
    {
      prompt: 'Löse mit einem Gleichungssystem:\n\nClara kauft Zitronenlimonade zum Preis von $1\\ €$ pro Flasche und Rhabarberschorle zum Preis von $1{,}50\\ €$ pro Flasche. Für 18 Flaschen zahlt sie $21\\ €$.\n\nWie viele Flaschen Zitronenlimonade und Rhabarberschorle hat sie gekauft?',
      answer: fields(num(12, { label: 'Zitronenlimonade:', unit: 'Flaschen' }), num(6, { label: 'Rhabarberschorle:', unit: 'Flaschen' })),
      solution: '$x$: Flaschen Zitronenlimonade, $y$: Flaschen Rhabarberschorle\n\n$\\text{I}\\quad x+y=18$\n\n$\\text{II}\\quad 1x+1{,}5y=21$\n\nAus I: $x=18-y$. Einsetzen in II: $18-y+1{,}5y=21 \\Rightarrow 0{,}5y=3 \\Rightarrow y=6$. Dann $x=12$.\n\nClara kauft **12 Flaschen Zitronenlimonade** und **6 Flaschen Rhabarberschorle**.',
      hint: 'Gleichung I zählt die Flaschen, Gleichung II zählt das Geld.',
    },
    {
      prompt: 'Löse mit einem Gleichungssystem:\n\nElif kauft für das Familienfrühstück jeden Samstag vier „Weltmeisterbrötchen“ und zwei normale Brötchen. Hierfür bezahlt sie $5{,}60\\ €$. Diesen Samstag bekommen sie Besuch von Freunden. Sie besorgt deshalb zehn „Weltmeisterbrötchen“ und zehn normale Brötchen für genau $17\\ €$.\n\nWie viel kosten die „Weltmeisterbrötchen“ und die normalen Brötchen?',
      answer: fields(money(1.1, 'Weltmeisterbrötchen:'), money(0.6, 'normales Brötchen:')),
      solution: '$w$: Preis eines Weltmeisterbrötchens, $n$: Preis eines normalen Brötchens (in €)\n\n$\\text{I}\\quad 4w+2n=5{,}6$\n\n$\\text{II}\\quad 10w+10n=17$\n\nAus II: $n=1{,}7-w$. Einsetzen in I: $4w+2(1{,}7-w)=5{,}6 \\Rightarrow 2w+3{,}4=5{,}6 \\Rightarrow w=1{,}1$. Dann $n=0{,}6$.\n\nEin Weltmeisterbrötchen kostet **1,10 €**, ein normales Brötchen **0,60 €**.',
      hint: 'Teile Gleichung II durch 10, dann ist sie viel einfacher: $w+n=1{,}7$.',
    },
  ];
  const t25 = {
    prompt: 'Nach der Pause auf einem Parkplatz stellt der Vater seinem Sohn ein Rätsel:\n\n„Ich habe **Autos mit und ohne Anhänger** gesehen. Insgesamt habe ich 76 Räder an 16 Fahrzeugen gezählt. Wie viele Anhänger habe ich gezählt?“ (Ein Auto hat 4 Räder, ein Anhänger hat 2 Räder; ein Auto mit Anhänger zählt als ein Fahrzeug.)\n\nLöse das Rätsel mit einem Gleichungssystem.',
    answer: fields(num(10, { label: 'Autos ohne Anhänger:' }), num(6, { label: 'Autos mit Anhänger:' })),
    solution: '$x$: Autos **ohne** Anhänger (4 Räder), $y$: Autos **mit** Anhänger ($4+2=6$ Räder)\n\n$\\text{I}\\quad x+y=16$\n\n$\\text{II}\\quad 4x+6y=76$\n\nAus I: $x=16-y$. Einsetzen: $4(16-y)+6y=76 \\Rightarrow 64+2y=76 \\Rightarrow y=6$. Dann $x=10$.\n\nEs waren **6 Anhänger** (10 Autos ohne, 6 Autos mit Anhänger).',
    hint: 'Ein Auto mit Anhänger hat insgesamt 6 Räder.',
  };
  const t27 = {
    prompt: 'Axel war zweimal in der Trampolinhalle.\n\n- Einmal hat er mit seiner Frau und seinem Sohn $32\\ €$ bezahlt.\n- Einmal war er mit seinem Sohn und seinen 2 Töchtern da und hat $36\\ €$ bezahlt.\n\nBestimme, wie hoch die Eintrittspreise für Erwachsene und für Kinder sind.',
    answer: fields(money(12, 'Erwachsene:'), money(8, 'Kinder:')),
    solution: '$x$: Eintritt Erwachsene, $y$: Eintritt Kinder\n\n$\\text{I}\\quad 2x+y=32$ (zwei Erwachsene, ein Kind)\n\n$\\text{II}\\quad x+3y=36$ (ein Erwachsener, drei Kinder)\n\nAus I: $y=32-2x$. Einsetzen in II: $x+96-6x=36 \\Rightarrow -5x=-60 \\Rightarrow x=12$. Dann $y=8$.\n\nErwachsene zahlen **12 €**, Kinder **8 €**.',
    hint: 'Axel selbst ist ein Erwachsener, und zwar in beiden Besuchen!',
  };

  // 26: Autoverleih
  const rentUrl = fig.plot({ xmin: 0, xmax: 100, ymin: 0, ymax: 100, xstep: 10, ystep: 10, xlabel: 'km', ylabel: '€', name: 'verleih', lines: [{ m: 0.5, b: 35, label: 'Polo' }, { m: 0.7, b: 25, label: 'Corsa' }], points: [{ x: 50, y: 60 }] });
  const rentBase = 'Natascha möchte sich im Urlaub beim Autoverleih für einen Tag einen Kleinwagen leihen. Sie vergleicht zwei Angebote:\n\n| | pro Tag | jeder Kilometer |\n|---|---|---|\n| **VW Polo** | 35 € | 50 Cent |\n| **Opel Corsa** | 25 € | 70 Cent |';
  const t26 = [
    {
      prompt: `${rentBase}\n\nStelle beide Angebote in einem Koordinatensystem dar (x: Kilometer, y: Kosten in €). Zeichne zuerst den VW Polo, dann den Opel Corsa.`,
      answer: graph({ view: V(0, 100, 0, 100, { xstep: 10, ystep: 10, snapX: 10, snapY: 5, xlabel: 'Kilometer', ylabel: 'Kosten in €' }), lines: [{ m: 0.5, b: 35 }, { m: 0.7, b: 25 }], labels: ['VW Polo', 'Opel Corsa'] }),
      solution: `VW Polo: $y=0{,}5x+35$ · Opel Corsa: $y=0{,}7x+25$\n\n![Graphen](${rentUrl})`,
      hint: 'Die Tagesmiete ist der Startwert bei $x=0$, die Kilometerkosten (in €) die Steigung.',
    },
    {
      prompt: `${rentBase}\n\nGib an, wie sich Natascha entscheiden soll.`,
      answer: fields(num(50, { label: 'Gleich teuer bei', unit: 'km' }), sel(['VW Polo', 'Opel Corsa'], 'Opel Corsa', 'Bei weniger als 50 km ist günstiger:')),
      solution: 'Gleichsetzen: $0{,}5x+35=0{,}7x+25 \\Rightarrow 10=0{,}2x \\Rightarrow x=50$. Bei **50 km** kosten beide **60 €**.\n\n- **Weniger als 50 km:** Der Opel Corsa ist günstiger (kleinere Tagesmiete).\n- **Mehr als 50 km:** Der VW Polo ist günstiger (kleinerer Kilometerpreis).\n\nNatascha sollte also abschätzen, wie weit sie am Tag fährt.',
      hint: 'Beim Schnittpunkt der beiden Geraden sind die Kosten gleich.',
    },
  ];

  // 28: Skiverleih
  const sk1 = [1, 2, 3, 4, 5, 6, 7].map((d) => 22 + 21 * d);
  const sk2 = [1, 2, 3, 4, 5, 6, 7].map((d) => 10 + 25 * d);
  const skiBase = 'Beim Ausleihen von Skiern muss man einmalig die Bindung einstellen lassen und für jeden Tag eine Leihgebühr bezahlen. Zwei Ausleihstationen machen folgende Angebote:\n\n| | Einstellen der Bindung | Leihgebühr pro Tag |\n|---|---|---|\n| **Skiverleih Hexenritt** | 22 € | 21 € |\n| **Verleih am Wurmberg** | 10 € | 25 € |';
  const t28 = [
    {
      prompt: `${skiBase}\n\na) Ergänze für beide Angebote die Kosten in der Tabelle.`,
      answer: fieldsWith([...sk1, ...sk2].map((v) => approx(v, { tol: 0 })), table({ cols: [1, 2, 3, 4, 5, 6, 7].map((d) => `${d}. Tag`), rows: ['Skiverleih Hexenritt', 'Verleih am Wurmberg'], corner: '', plot: { xs: [1, 2, 3, 4, 5, 6, 7], xlabel: 'Tage', ylabel: 'Kosten in €' } })),
      solution: `Hexenritt: $22+21\\cdot d$ · Wurmberg: $10+25\\cdot d$\n\n| | 1. | 2. | 3. | 4. | 5. | 6. | 7. Tag |\n|---|---|---|---|---|---|---|---|\n| Hexenritt | ${sk1.join(' | ')} |\n| Wurmberg | ${sk2.join(' | ')} |`,
      hint: 'Einmalige Bindungsgebühr + Anzahl der Tage · Leihgebühr pro Tag.',
    },
    {
      prompt: `${skiBase}\n\nb) Stelle eine Gleichung auf, mit der berechnet werden kann, an welchem Tag die Kosten gleich hoch sind, und gib den Tag und die Kosten an.`,
      answer: fields(num(3, { label: 'Gleich teuer am', unit: '. Tag' }), money(85, 'Kosten:')),
      solution: '$22+21x=10+25x \\Rightarrow 12=4x \\Rightarrow x=3$. Am **3. Tag** kosten beide **85 €**.',
      hint: 'Setze die beiden Kostenterme gleich.',
    },
    {
      prompt: `${skiBase}\n\nc) Berechne, wie viel Prozent man am **ersten** und am **letzten** Tag aus der Tabelle sparen kann. (Bezogen auf das jeweils teurere Angebot; runde auf zwei Nachkommastellen.)`,
      answer: fields(approx(18.6, { label: '1. Tag:', unit: '%', tol: 0.011 }), approx(8.65, { label: '7. Tag:', unit: '%', tol: 0.011 })),
      solution: '**1. Tag:** Hexenritt $43\\ €$, Wurmberg $35\\ €$ → Ersparnis $8\\ €$ von $43\\ €$: $\\frac{8}{43}\\cdot100\\,\\% \\approx 18{,}60\\,\\%$\n\n**7. Tag:** Hexenritt $169\\ €$, Wurmberg $185\\ €$ → Ersparnis $16\\ €$ von $185\\ €$: $\\frac{16}{185}\\cdot100\\,\\% \\approx 8{,}65\\,\\%$',
      hint: 'Die Ersparnis ist der Prozentwert $W$, das teurere Angebot ist der Grundwert $G$.',
    },
    {
      prompt: `${skiBase}\n\nd) Stelle ein **eigenes Angebot** auf, das nach drei Tagen inklusive Bindung einstellen und Leihgebühr nur $80\\ €$ kostet.`,
      answer: constraint([num(0, { label: 'Einstellen der Bindung:', unit: '€', tol: 0 }), num(0, { label: 'Leihgebühr pro Tag:', unit: '€', tol: 0 })], { type: 'weighted', weights: [1, 3], value: 80, positive: true }, 'z. B. 20 € + 3 · 20 € = 80 €'),
      solution: 'Gesucht sind Beträge $b$ (Bindung) und $m$ (pro Tag) mit $b+3\\cdot m=80$.\n\nMögliche Lösungen: $20\\ € + 3\\cdot20\\ €$, $35\\ € + 3\\cdot15\\ €$, $8\\ € + 3\\cdot24\\ €$, $50\\ € + 3\\cdot10\\ €$ …\n\nDas Angebot ist als Funktion $y=m\\cdot x+b$ (Kosten nach $x$ Tagen) formuliert.',
      hint: 'Such dir eine Leihgebühr pro Tag aus, rechne ×3 und fülle den Rest mit der Bindungsgebühr auf 80 € auf.',
    },
  ];

  // ------------------------------------------------------------------ Skript Lineare Gleichungssysteme
  const gls = [
    {
      title: 'Was ist ein lineares Gleichungssystem?',
      md: L`Manchmal sind **zwei Größen** gesucht ($x$ und $y$), und du kennst **zwei Bedingungen**. Dann stellst du zwei Gleichungen auf. Das ist ein **lineares Gleichungssystem**:

$$\text{I}\quad y=m_1x+b_1 \qquad \text{II}\quad y=m_2x+b_2$$

Gesucht ist das Zahlenpaar $(x\mid y)$, das **beide Gleichungen gleichzeitig** erfüllt.

**Beispiel:** Die Klasse 10 a fährt in ein Jugendgästehaus. Es gibt nur Doppelzimmer ($x$) und Vierbettzimmer ($y$). In 10 Zimmern gibt es insgesamt 28 Betten.

$$\text{I}\quad x+y=10 \qquad\text{(Anzahl der Zimmer)}$$
$$\text{II}\quad 2x+4y=28 \qquad\text{(Anzahl der Betten)}$$

Du kannst es **zeichnerisch**, mit einer **Wertetabelle** oder **rechnerisch** lösen. Die Lösung ist $x=6$ Doppelzimmer und $y=4$ Vierbettzimmer.`,
    },
    {
      title: 'Zeichnerisch lösen und Anzahl der Lösungen',
      md: L`**So geht's:**
1. Löse beide Gleichungen nach $y$ auf.
2. Zeichne beide Geraden in ein Koordinatensystem.
3. Der **Schnittpunkt** $S(x\mid y)$ ist die Lösung.

> Beispiel: $\text{I}\ x+y=10 \Rightarrow y=10-x$ und $\text{II}\ 2x+4y=28 \Rightarrow y=7-0{,}5x$. Die Geraden schneiden sich in $S(6\mid4)$.

**Wie viele Lösungen gibt es?** Das erkennst du sofort an den Geraden:

| Lage der Geraden | Steigung / Achsenabschnitt | Lösungen |
|---|---|---|
| **parallel** | gleiches $m$, verschiedenes $b$ | **keine** Lösung |
| **ein Schnittpunkt** | verschiedenes $m$ | **eine** Lösung |
| **identisch** | gleiches $m$ und gleiches $b$ | **unendlich viele** Lösungen |`,
    },
    {
      title: 'Lösen mit einer Wertetabelle',
      md: L`1. Löse beide Gleichungen nach $y$ auf.
2. Lege eine gemeinsame Wertetabelle an.
3. Lies das Wertepaar ab, bei dem **beide $y$-Werte gleich** sind.

| $x$ | 0 | 1 | 2 | 3 | 4 | 5 | **6** |
|---|---|---|---|---|---|---|---|
| I $y=10-x$ | 10 | 9 | 8 | 7 | 6 | 5 | **4** |
| II $y=7-0{,}5x$ | 7 | 6{,}5 | 6 | 5{,}5 | 5 | 4{,}5 | **4** |

Bei $x=6$ sind beide Werte $4$ → Lösung $x=6$, $y=4$.

**Tipp:** Kommen nur kleine, ganze Zahlen vor, ist Probieren mit der Wertetabelle oder das Zeichnen am einfachsten. Bei großen Zahlen und Kommazahlen rechnest du lieber.`,
    },
    {
      title: 'Einsetzungsverfahren',
      md: L`1. Löse **eine** Gleichung nach einer Variablen auf ($x$ oder $y$).
2. **Setze** den Ausdruck in die **andere** Gleichung **ein** und löse sie.
3. Berechne mit dem Ergebnis die zweite Variable.

$$\text{I}\ \ x+y=10 \Rightarrow y=10-x$$
$$\text{in II:}\ \ 2x+4(10-x)=28 \Rightarrow 2x+40-4x=28 \Rightarrow -2x=-12 \Rightarrow x=6$$
$$\text{in I:}\ \ y=10-6=4$$

Lösung: $x=6$ und $y=4$.`,
    },
    {
      title: 'Gleichsetzungsverfahren',
      md: L`1. Löse **beide** Gleichungen nach **derselben** Variablen auf.
2. **Setze die beiden Terme gleich** und löse die Gleichung.
3. Berechne mit dem Ergebnis die zweite Variable.

$$\text{I}\ \ x=10-y \qquad \text{II}\ \ x=14-2y$$
$$10-y=14-2y \Rightarrow y=4$$
$$\text{in I:}\ \ x=10-4=6$$

Lösung: $x=6$ und $y=4$.

> Das Gleichsetzungsverfahren ist besonders praktisch, wenn beide Gleichungen schon in der Form $y=m x+b$ dastehen (Schnittpunkt zweier Geraden).`,
    },
    {
      title: 'Vom Text zum Gleichungssystem',
      md: L`**So gehst du vor:**
1. **Gegeben** und **gesucht** aufschreiben.
2. Variablen festlegen ($x$, $y$ oder passende Buchstaben).
3. Zwei Gleichungen aufstellen (z. B. eine für die **Anzahl**, eine für das **Geld**).
4. Lösen, **Probe** machen, Antwortsatz schreiben.

> **Angebote vergleichen:** feste Gebühr $=b$, Preis pro Einheit $=m$. Beispiel Autoverleih: $y=0{,}5x+35$. Wo sich die Geraden schneiden, sind beide Angebote gleich teuer. Links davon ist das eine, rechts davon das andere günstiger.`,
    },
  ];

  // Skript für Lineare Funktionen (neue Abschnitte)
  const lf = [
    {
      title: 'Geraden zeichnen: Wertetabelle und Steigungsdreieck',
      md: L`Der Graph einer linearen Funktion $y=mx+b$ ist eine **Gerade**.

- $m>0$: Die Gerade **steigt** von links unten nach rechts oben.
- $m<0$: Die Gerade **fällt**.
- $m=0$: Die Gerade verläuft **parallel zur $x$-Achse**.
- $b$: Hier schneidet die Gerade die **$y$-Achse**.

**Zeichnen mit dem Steigungsdreieck:** Starte bei $b$ auf der $y$-Achse. Gehe 1 Einheit nach rechts und $m$ Einheiten nach oben (bei negativem $m$ nach unten). Zeichne die Gerade durch beide Punkte.

> $y=-2x+8$: Start bei $8$, dann 1 nach rechts und 2 nach unten.

**Alternativ:** Wertetabelle mit zwei oder drei $x$-Werten anlegen und die Punkte eintragen.

**Umformen in die Normalform:** Löse die Gleichung nach $y$ auf. Aus $y+13=2x+15$ wird $y=2x+2$.`,
    },
    {
      title: 'Lineare Funktionen in Sachaufgaben',
      md: L`In Sachaufgaben steckt die Funktionsgleichung im Text:

- **fester Betrag** am Anfang → $b$ (z. B. Anfangslänge, Grundgebühr, Pauschale)
- **Änderung pro Einheit** → $m$ (z. B. $-2\ \text{cm}$ pro Stunde, $+2\ €$ pro km)

> **Beispiel Kerze:** Eine 8 cm lange Kerze brennt pro Stunde um 2 cm ab → $y=-2x+8$. Abgebrannt ist sie, wenn $y=0$ gilt: $x=4$ Stunden.

> **Beispiel Bus:** Pauschale 85 €, 2 € pro km → $y=2x+85$.

**Gerade durch zwei Punkte:** Aus $E(-2\mid6)$ und $F(2\mid2)$ berechnest du $m=\frac{2-6}{2-(-2)}=-1$ und setzt einen Punkt ein, um $b$ zu finden: $2=-1\cdot2+b \Rightarrow b=4$.`,
    },
  ];

  const steigungTask = {
    prompt: `Das Schaubild zeigt die Graphen verschiedener linearer Funktionen.\n\n![Graphen](${steigung})\n\nGib jeweils das **Steigungsverhalten** an und lies ab, wo die Gerade die $y$-Achse schneidet ($b$).`,
    answer: fields(
      sel(['steigt', 'fällt', 'ist parallel zur x-Achse'], 'steigt', 'g₁'), num(2, { label: 'b =', tol: 0 }),
      sel(['steigt', 'fällt', 'ist parallel zur x-Achse'], 'fällt', 'g₂'), num(-2, { label: 'b =', tol: 0 }),
      sel(['steigt', 'fällt', 'ist parallel zur x-Achse'], 'ist parallel zur x-Achse', 'g₃'), num(3, { label: 'b =', tol: 0 }),
    ),
    solution: '- $g_1$ **steigt** (von links unten nach rechts oben), schneidet die $y$-Achse bei $b=2$.\n- $g_2$ **fällt**, $b=-2$.\n- $g_3$ ist eine **Parallele zur $x$-Achse** ($m=0$), $b=3$.',
    hint: 'Steigt die Gerade von links nach rechts nach oben, ist $m>0$. Der Schnittpunkt mit der $y$-Achse ist $b$.',
  };

  return [
    {
      topic: 'Lineare Funktionen',
      sections: lf,
      packages: [
        {
          title: 'Steigung und Achsenabschnitt erkennen',
          description: 'Steigt oder fällt die Gerade? Wo schneidet sie die y-Achse?',
          level: 0,
          tasks: [{ title: 'Grundlagen Beispiel 1: Steigungsverhalten', section: 'Die Funktionsgleichung y = mx + b', variants: [steigungTask] }],
        },
        {
          title: 'Geraden zeichnen und ablesen',
          description: 'Graphen zeichnen, Funktionsgleichungen aus dem Graphen lesen',
          level: 1,
          tasks: [
            { title: 'Grundlagen 11 a: f: y = 2x + 1', section: 'Geraden zeichnen: Wertetabelle und Steigungsdreieck', variants: [drawLine('f', 'f', 2, 1), ...lineGen('f', 51)] },
            { title: 'Grundlagen 11 b: g: y = −0,5x + 1', section: 'Geraden zeichnen: Wertetabelle und Steigungsdreieck', variants: [drawLine('g', 'g', -0.5, 1), ...lineGen('g', 52)] },
            { title: 'Grundlagen 11 c: h: y = x − 4', section: 'Geraden zeichnen: Wertetabelle und Steigungsdreieck', variants: [drawLine('h', 'h', 1, -4), ...lineGen('h', 53)] },
            { title: 'Grundlagen 11 d: k: y = −2x − 0,5', section: 'Geraden zeichnen: Wertetabelle und Steigungsdreieck', variants: [drawLine('k', 'k', -2, -0.5), ...lineGen('k', 54)] },
            {
              title: 'Grundlagen 12 a: Gleichung aus Graph g',
              section: 'Die Funktionsgleichung y = mx + b',
              variants: [{
                prompt: `Lies die passende Funktionsgleichung aus dem Graphen ab.\n\n![Graph g](${urlA})`,
                answer: fields(expr('-x+3', { label: 'g: y =' })),
                solution: 'Die Gerade schneidet die $y$-Achse bei $b=3$. Von dort geht sie 1 nach rechts und 1 nach unten: $m=-1$.\n\n$$y=-x+3$$',
                hint: 'Lies zuerst $b$ (Schnittpunkt mit der $y$-Achse) ab, dann die Steigung mit dem Steigungsdreieck.',
              }],
            },
            {
              title: 'Grundlagen 12 b: Gleichung aus Graph h',
              section: 'Die Funktionsgleichung y = mx + b',
              variants: [{
                prompt: `Lies die passende Funktionsgleichung aus dem Graphen ab.\n\n![Graph h](${urlB})`,
                answer: fields(expr('2x-3', { label: 'h: y =' })),
                solution: 'Die Gerade schneidet die $y$-Achse bei $b=-3$. Von dort geht sie 1 nach rechts und 2 nach oben: $m=2$.\n\n$$y=2x-3$$',
                hint: 'Lies zuerst $b$ (Schnittpunkt mit der $y$-Achse) ab, dann die Steigung mit dem Steigungsdreieck.',
              }],
            },
          ],
        },
        {
          title: 'Normalform und lineare Modelle',
          description: 'Gleichungen umformen, Sachaufgaben mit Geraden',
          level: 2,
          tasks: [
            {
              title: 'Grundlagen 13: Normalform',
              section: 'Geraden zeichnen: Wertetabelle und Steigungsdreieck',
              variants: [{
                prompt: 'Forme die Funktionsgleichungen in die **Normalform** $y=mx+b$ um.\n\n$$g\\colon\\ y+13=2x+15 \\qquad h\\colon\\ 3y+9x=-3x+21$$',
                answer: fields(num(2, { label: 'g: m =', tol: 0 }), num(2, { label: 'g: b =', tol: 0 }), num(-4, { label: 'h: m =', tol: 0 }), num(7, { label: 'h: b =', tol: 0 })),
                solution: '$g$: $y+13=2x+15 \\;|-13 \\Rightarrow y=2x+2$\n\n$h$: $3y+9x=-3x+21 \\;|-9x \\Rightarrow 3y=-12x+21 \\;|:3 \\Rightarrow y=-4x+7$',
                hint: 'Bringe alles außer $y$ auf die andere Seite und teile am Ende durch die Zahl vor dem $y$.',
              }],
            },
            {
              title: 'Grundlagen 13: Graphen zeichnen',
              section: 'Geraden zeichnen: Wertetabelle und Steigungsdreieck',
              variants: [{
                prompt: 'Zeichne die Graphen von $g\\colon y=2x+2$ und $h\\colon y=-4x+7$ in ein gemeinsames Koordinatensystem. Zeichne zuerst $g$ (2 Punkte), dann $h$ (2 Punkte).',
                answer: graph({ view: V(-5, 5, -10, 10, { ystep: 2, snapY: 1 }), lines: [{ m: 2, b: 2 }, { m: -4, b: 7 }], labels: ['g', 'h'] }),
                solution: `$g$: Start bei $(0\\mid2)$, dann 1 nach rechts und 2 nach oben → $(1\\mid4)$.\n\n$h$: Start bei $(0\\mid7)$, dann 1 nach rechts und 4 nach unten → $(1\\mid3)$.\n\n![Graphen](${fig.plot({ xmin: -5, xmax: 5, ymin: -10, ymax: 10, ystep: 2, name: 'lf13', lines: [{ m: 2, b: 2, label: 'g' }, { m: -4, b: 7, label: 'h' }] })})`,
                hint: 'Beide Funktionen stehen schon in Normalform. Lies $b$ und $m$ ab.',
              }],
            },
            { title: 'Beispiel Kerze', section: 'Lineare Funktionen in Sachaufgaben', variants: kerze },
            { title: 'Grundlagen 14: Busreise', section: 'Lineare Funktionen in Sachaufgaben', variants: [bus] },
            {
              title: 'Grundlagen 15 a: Pool · Graph',
              section: 'Lineare Funktionen in Sachaufgaben',
              variants: [{
                prompt: `${pool}\n\na) Zeichne einen Funktionsgraphen, der den Abpumpvorgang beschreibt (x: Stunden, y: Wassermenge in m³). Die beiden bekannten Punkte sind schon markiert.`,
                answer: graph({ view: V(0, 11, 0, 70, { ystep: 10, snapY: 2, xlabel: 'Stunden', ylabel: 'Wasser in m³' }), lines: [{ m: -6, b: 60 }], given: poolPoints }),
                solution: `Von der 2. zur 3. Stunde nimmt das Wasser um $6\\ \\text{m}^3$ ab: $m=-6$. Zu Beginn ($x=0$) waren es $48+2\\cdot6=60\\ \\text{m}^3$.\n\n$$y=-6x+60$$\n\n![Graph](${poolUrl})`,
                hint: 'Pro Stunde werden 6 m³ abgepumpt. Gehe von den Punkten aus zwei Stunden zurück, um den Anfangswert zu finden.',
              }],
            },
            {
              title: 'Grundlagen 15 b/c: Pool · leer und Anfangsmenge',
              section: 'Lineare Funktionen in Sachaufgaben',
              variants: [{
                prompt: `${pool}\n\nb) Bestimme, nach wie vielen Stunden der Pool vollständig entleert ist.\n\nc) Bestimme, wie viele Liter Wasser anfangs im Pool waren.`,
                answer: fields(num(10, { label: 'b) Nach', unit: 'Stunden', tol: 0 }), num(60000, { label: 'c) Anfangs', unit: 'Liter', tol: 0 })),
                solution: '$y=-6x+60$\n\nb) $-6x+60=0 \\Rightarrow x=10$ → nach **10 Stunden** ist der Pool leer.\n\nc) Anfangs ($x=0$): $60\\ \\text{m}^3$. Wegen $1\\ \\text{m}^3=1\\,000\\ \\text{l}$ sind das **60 000 Liter**.',
                hint: 'Der Pool ist leer, wenn $y=0$. Und $1\\ \\text{m}^3$ sind 1000 Liter.',
              }],
            },
            {
              title: 'Grundlagen 16 a: Gerade durch E und F',
              section: 'Lineare Funktionen in Sachaufgaben',
              variants: [{
                prompt: 'Durch die Punkte $E(-2\\mid6)$ und $F(2\\mid2)$ verläuft eine lineare Funktion.\n\na) Zeichne die Gerade $h$, die durch die Punkte $E$ und $F$ verläuft. Tippe dazu die Punkte $E$ und $F$ an.',
                answer: graph({ view: V(-4, 6, -2, 8), lines: [{ m: -1, b: 4 }], given: [[-2, 6, 'E'], [2, 2, 'F']] }),
                solution: `![Gerade h](${efUrl})`,
                hint: 'Die Punkte $E$ und $F$ sind markiert. Tippe sie an und zeichne die Gerade durch beide.',
              }],
            },
            {
              title: 'Grundlagen 16 b: Gleichung der Geraden h',
              section: 'Lineare Funktionen in Sachaufgaben',
              variants: [{
                prompt: 'Die Gerade $h$ verläuft durch $E(-2\\mid6)$ und $F(2\\mid2)$.\n\nb) Bestimme die Funktionsgleichung der Geraden $h$.',
                answer: fields(expr('-x+4', { label: 'h: y =' })),
                solution: 'Steigung: $m=\\dfrac{y_F-y_E}{x_F-x_E}=\\dfrac{2-6}{2-(-2)}=\\dfrac{-4}{4}=-1$\n\n$b$ mit Punkt $F$: $2=-1\\cdot2+b \\Rightarrow b=4$\n\n$$h\\colon\\ y=-x+4$$\n\nProbe mit $E$: $-(-2)+4=6$ ✓',
                hint: 'Erst die Steigung mit $\\frac{\\Delta y}{\\Delta x}$, dann einen Punkt einsetzen, um $b$ zu bestimmen.',
              }],
            },
          ],
        },
        {
          title: 'Eigene Geraden finden',
          description: 'Aufgaben mit mehreren richtigen Lösungen',
          level: 3,
          tasks: [
            {
              title: 'Grundlagen 15 d: Pool · mögliche Maße',
              section: 'Lineare Funktionen in Sachaufgaben',
              variants: [{
                prompt: `${pool}\n\nd) Gib mögliche Maße für den quaderförmigen Pool an (Länge, Breite und Tiefe in Metern).`,
                answer: constraint([num(0, { label: 'Länge:', unit: 'm', tol: 0 }), num(0, { label: 'Breite:', unit: 'm', tol: 0 }), num(0, { label: 'Tiefe:', unit: 'm', tol: 0 })], { type: 'product', value: 60, positive: true, tolerance: 0.001 }, 'z. B. 5 m · 4 m · 3 m = 60 m³'),
                solution: 'Das Volumen des vollen Pools ist $60\\ \\text{m}^3$ und gilt für einen Quader $V=l\\cdot b\\cdot h$.\n\nMögliche Maße: $5\\cdot4\\cdot3=60$, $10\\cdot3\\cdot2=60$, $6\\cdot5\\cdot2=60$, $12\\cdot5\\cdot1=60$ …',
                hint: 'Länge · Breite · Tiefe muss 60 ergeben. Probiere z. B. 5 · 4 · 3.',
              }],
            },
            {
              title: 'Grundlagen 16 c: Gerade durch F',
              section: 'Lineare Funktionen in Sachaufgaben',
              variants: [{
                prompt: 'Die Gerade $h\\colon y=-x+4$ verläuft durch $F(2\\mid2)$.\n\nc) Gib die Funktionsgleichung $y=mx+b$ **einer anderen** linearen Funktion an, die die Gerade $h$ im Punkt $F(2\\mid2)$ schneidet.',
                answer: constraint([num(0, { label: 'm =', tol: 0 }), num(0, { label: 'b =', tol: 0 })], { type: 'line', through: [2, 2], notSlope: -1, tolerance: 1e-6 }, 'z. B. y = x'),
                solution: 'Die neue Gerade muss durch $F(2\\mid2)$ gehen und eine **andere Steigung** als $h$ haben (sonst wäre sie dieselbe Gerade).\n\nWähle $m$ beliebig ($m\\neq-1$) und berechne $b$ aus $2=m\\cdot2+b$.\n\nBeispiele: $m=1 \\Rightarrow b=0$: $y=x$ · $m=2 \\Rightarrow b=-2$: $y=2x-2$ · $m=0 \\Rightarrow b=2$: $y=2$',
                hint: 'Wähle eine Steigung $m$ (nicht $-1$) und setze $F(2\\mid2)$ ein: $2=m\\cdot2+b$.',
              }],
            },
          ],
        },
      ],
    },
    {
      topic: 'Lineare Gleichungssysteme',
      create: {
        description: 'Gleichungssysteme zeichnerisch, mit Wertetabelle und rechnerisch lösen und Angebote vergleichen',
        icon: 'SquareFunction',
        color: 'blue',
        profiles: ['HS10', 'RS10', 'ERS10'],
        after: 'Lineare Funktionen',
      },
      sections: gls,
      packages: [
        {
          title: 'Zeichnerisch und mit Wertetabelle lösen',
          description: 'Schnittpunkt ablesen, Anzahl der Lösungen erkennen',
          level: 1,
          tasks: [
            { title: 'Grundlagen 17 a: Wertetabelle', section: 'Lösen mit einer Wertetabelle', variants: [wt(2, -1, 3, -5, 4), ...wtGen(61)] },
            { title: 'Grundlagen 17 b: Wertetabelle', section: 'Lösen mit einer Wertetabelle', variants: [wt(1.5, -3, -0.5, 3, 3), ...wtGen(62)] },
            { title: 'Grundlagen 18 a: zeichnen', section: 'Zeichnerisch lösen und Anzahl der Lösungen', variants: [s18a[0]] },
            { title: 'Grundlagen 18 a: Lösung ablesen', section: 'Zeichnerisch lösen und Anzahl der Lösungen', variants: [s18a[1]] },
            { title: 'Grundlagen 18 b: zeichnen', section: 'Zeichnerisch lösen und Anzahl der Lösungen', variants: [s18b[0]] },
            { title: 'Grundlagen 18 b: Lösung ablesen', section: 'Zeichnerisch lösen und Anzahl der Lösungen', variants: [s18b[1]] },
            { title: 'Grundlagen 21 a: Anzahl der Lösungen', section: 'Zeichnerisch lösen und Anzahl der Lösungen', variants: [q21[0]] },
            { title: 'Grundlagen 21 b: Anzahl der Lösungen', section: 'Zeichnerisch lösen und Anzahl der Lösungen', variants: [q21[1]] },
            { title: 'Grundlagen 21 c: Anzahl der Lösungen', section: 'Zeichnerisch lösen und Anzahl der Lösungen', variants: [q21[2]] },
          ],
        },
        {
          title: 'Rechnerisch lösen',
          description: 'Einsetzungs- und Gleichsetzungsverfahren',
          level: 2,
          tasks: [
            { title: 'Grundlagen 19 a: rechnerisch', section: 'Einsetzungsverfahren', variants: [s19a, ...sysGen(71)] },
            { title: 'Grundlagen 19 b: rechnerisch', section: 'Einsetzungsverfahren', variants: [s19b, ...sysGen(72)] },
            { title: 'Grundlagen 20 a: Schnittpunkt', section: 'Gleichsetzungsverfahren', variants: c20[0] },
            { title: 'Grundlagen 20 b: Schnittpunkt', section: 'Gleichsetzungsverfahren', variants: c20[1] },
            { title: 'Grundlagen 20 c: Schnittpunkt', section: 'Gleichsetzungsverfahren', variants: c20[2] },
            { title: 'Grundlagen 20 d: Schnittpunkt', section: 'Gleichsetzungsverfahren', variants: c20[3] },
          ],
        },
        {
          title: 'Gleichungssysteme aufstellen und lösen',
          description: 'Vom Text zum Gleichungssystem: Rätsel, Preise, Eintritt',
          level: 2,
          tasks: [
            { title: 'Grundlagen 22 a: Summe und Produkt', section: 'Vom Text zum Gleichungssystem', variants: [t22[0]] },
            { title: 'Grundlagen 22 b: E-Scooter', section: 'Vom Text zum Gleichungssystem', variants: [t22[1]] },
            { title: 'Grundlagen 22 c: Café', section: 'Vom Text zum Gleichungssystem', variants: [t22[2]] },
            { title: 'Grundlagen 24 a: Limonade und Schorle', section: 'Vom Text zum Gleichungssystem', variants: [t24[0]] },
            { title: 'Grundlagen 24 b: Brötchen', section: 'Vom Text zum Gleichungssystem', variants: [t24[1]] },
            { title: 'Grundlagen 25: Autos und Anhänger', section: 'Vom Text zum Gleichungssystem', variants: [t25] },
            { title: 'Grundlagen 27: Trampolinhalle', section: 'Vom Text zum Gleichungssystem', variants: [t27] },
          ],
        },
        {
          title: 'Angebote vergleichen',
          description: 'Streaming, Autoverleih und Skiverleih: Wann ist welches Angebot günstiger?',
          level: 3,
          tasks: [
            { title: 'Grundlagen 23 a: Streaming · Tabelle', section: 'Vom Text zum Gleichungssystem', variants: [t23[0]] },
            { title: 'Grundlagen 23 b: Streaming · Graph', section: 'Vom Text zum Gleichungssystem', variants: [t23[1]] },
            { title: 'Grundlagen 23 c: Streaming · Gleichungssystem', section: 'Vom Text zum Gleichungssystem', variants: [t23[2]] },
            { title: 'Grundlagen 23 d: Streaming · Entscheidung', section: 'Vom Text zum Gleichungssystem', variants: [t23[3]] },
            { title: 'Grundlagen 26 a: Autoverleih · Graph', section: 'Vom Text zum Gleichungssystem', variants: [t26[0]] },
            { title: 'Grundlagen 26 b: Autoverleih · Entscheidung', section: 'Vom Text zum Gleichungssystem', variants: [t26[1]] },
            { title: 'Grundlagen 28 a: Skiverleih · Tabelle', section: 'Vom Text zum Gleichungssystem', variants: [t28[0]] },
            { title: 'Grundlagen 28 b: Skiverleih · gleich teuer', section: 'Vom Text zum Gleichungssystem', variants: [t28[1]] },
            { title: 'Grundlagen 28 c: Skiverleih · Prozent sparen', section: 'Vom Text zum Gleichungssystem', variants: [t28[2]] },
            { title: 'Grundlagen 28 d: Skiverleih · eigenes Angebot', section: 'Vom Text zum Gleichungssystem', variants: [t28[3]] },
          ],
        },
      ],
    },
  ];
}
