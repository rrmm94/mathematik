// Grundlagen-Training: Zehnerpotenzen, Prozentrechnen, Zinseszins
// (Themen „Zahlen & Rechnen“ und „Prozent & Zinsen“)
import { L, rng, de, dt, eur, eurm, round, num, fields, sci, sel, approx, money, order, table, fieldsWith } from './kit.js';

// ---------- Hilfen ----------
const MANT = [2, 3, 4, 5, 6, 7, 8, 9, 1.4, 2.5, 3.6, 5.3, 6.2, 7.8, 8.4, 4.5, 1.8, 9.6];
const dec = (m) => (String(m).split('.')[1] || '').length;
// 0,0035 als Text (ohne Rundungsfehler)
function smallStr(m, n) {
  const digits = String(m).replace('.', '');
  const places = dec(m) + n;
  return '0,' + '0'.repeat(places - digits.length) + digits;
}
const bigStr = (m, n) => de(Math.round(m * 10 ** n), 0);
const mant = (m) => de(m, 3);

function distinct(gen, count, seed, seenKeys = new Set()) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < count * 8; i++) {
    const v = gen(rng(seed * 101 + i));
    const key = v.prompt + JSON.stringify(v.answer);
    if (seen.has(key) || seenKeys.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

const LETTERS = 'abcdefgh';

// ---------- Zehnerpotenzen ----------
function writeAsPower(items, original) {
  // items: [{ m, n, big }]
  const parts = items.map((it, i) => sci(it.m * 10 ** it.n, `${LETTERS[i]}) $${it.big ? bigStr(it.m, it.n) : smallStr(it.m, it.n)}$ =`));
  // sci-Wert exakt aus Text bilden (kein Rundungsfehler bei kleinen Zahlen)
  parts.forEach((p, i) => { p.value = Number(`${items[i].m}e${items[i].big ? items[i].n : -items[i].n}`); });
  return {
    prompt: `Schreibe die Zahlen als Zehnerpotenz der Form $a\\cdot10^{n}$ mit $1\\le a<10$. Trage links den Faktor $a$ und rechts den Exponenten $n$ ein.`,
    answer: fields(...parts),
    solution: items.map((it, i) => `${LETTERS[i]}) $${it.big ? bigStr(it.m, it.n) : smallStr(it.m, it.n)} = ${mant(it.m)}\\cdot10^{${it.big ? it.n : -it.n}}$`).join('\n\n')
      + '\n\n**Merke:** Bei großen Zahlen zählst du, um wie viele Stellen das Komma nach links wandert (positiver Exponent). Bei kleinen Zahlen wandert das Komma nach rechts – der Exponent ist negativ.',
    hint: 'Der Faktor $a$ muss zwischen 1 und 10 liegen. Zähle, um wie viele Stellen du das Komma verschieben musst.',
  };
}
function writeAsNumber(items) {
  const parts = items.map((it, i) => ({ ...num(Number(`${it.m}e${it.big ? it.n : -it.n}`), { label: `${LETTERS[i]}) $${mant(it.m)}\\cdot10^{${it.big ? it.n : -it.n}}$ =`, tol: 0 }), rel: 1e-9 }));
  return {
    prompt: 'Schreibe die Zahlen ohne Zehnerpotenz. Die Ziffern darfst du mit Leerzeichen gliedern, z. B. 5 000 000.',
    answer: fields(...parts),
    solution: items.map((it, i) => `${LETTERS[i]}) $${mant(it.m)}\\cdot10^{${it.big ? it.n : -it.n}} = ${it.big ? bigStr(it.m, it.n) : smallStr(it.m, it.n)}$`).join('\n\n')
      + '\n\n**Merke:** $10^n$ mit positivem $n$: Komma um $n$ Stellen nach rechts. $10^{-n}$: Komma um $n$ Stellen nach links.',
    hint: 'Bei $10^{5}$ rutscht das Komma 5 Stellen nach rechts, bei $10^{-5}$ rutscht es 5 Stellen nach links.',
  };
}
const pickItems = (r, count, big) => {
  const used = new Set();
  const items = [];
  while (items.length < count) {
    const m = MANT[Math.floor(r() * MANT.length)];
    const n = big ? r.int(3, 8) : r.int(2, 6);
    if (used.has(`${m}|${n}`)) continue;
    used.add(`${m}|${n}`);
    items.push({ m, n, big });
  }
  return items;
};
const fixed = (arr, big) => arr.map(([m, n]) => ({ m, n, big }));

const t1big = [writeAsPower(fixed([[8, 5], [3, 4], [5.3, 7], [1.4, 5]], true)), ...distinct((r) => writeAsPower(pickItems(r, 4, true)), 3, 11)];
const t1small = [writeAsPower(fixed([[2, 2], [3.5, 3], [6, 5], [4.5, 4]], false)), ...distinct((r) => writeAsPower(pickItems(r, 4, false)), 3, 12)];
const t2big = [writeAsNumber(fixed([[6, 5], [8, 8], [3.8, 7], [7.85, 6]], true)), ...distinct((r) => writeAsNumber(pickItems(r, 4, true)), 3, 13)];
const t2small = [writeAsNumber(fixed([[3, 3], [2.8, 4], [8.9, 6], [1.1, 5]], false)), ...distinct((r) => writeAsNumber(pickItems(r, 4, false)), 3, 14)];

const ordering = (title, items) => ({
  title,
  section: 'Zehnerpotenzen im Überblick',
  variants: [{
    prompt: 'Ordne die Zahlen der Größe nach. **Beginne mit der kleinsten.**',
    answer: order(items.map((x) => `$${x[0]}$`)),
    solution: 'Wandle zuerst alle Zahlen in dieselbe Schreibweise um, dann kannst du sie vergleichen:\n\n' + items.map((x) => `- $${x[0]}$ $= ${x[1]}$`).join('\n'),
    hint: 'Schreibe jede Zahl ohne Zehnerpotenz auf – dann siehst du sofort, welche am größten ist.',
  }],
});

// ---------- Prozentrechnen ----------
const pct = (n) => `${dt(n)} %`;

function t6(r, G1, p1, G2, W2, G3, p3) {
  const W1 = round((G1 * p1) / 100, 4);
  const p2 = round((W2 * 100) / G2, 4);
  const W3 = round((G3 * p3) / 100, 4);
  return {
    prompt: `Berechne jeweils den fehlenden Wert im Kopf.\n\n| | G | W | p % |\n|---|---|---|---|\n| a) | ${dt(G1)} | ? | ${dt(p1)} % |\n| b) | ${dt(G2)} | ${dt(W2)} | ? |\n| c) | ${dt(G3)} | ? | ${dt(p3)} % |`,
    answer: fields(approx(W1, { label: 'a) W =', tol: 0 }), approx(p2, { label: 'b) p % =', unit: '%', tol: 0 }), approx(W3, { label: 'c) W =', tol: 0 })),
    solution: `a) $W = G\\cdot\\frac{p}{100} = ${dt(G1)}\\cdot\\frac{${dt(p1)}}{100} = ${dt(W1)}$\n\nb) $p\\,\\% = \\frac{W\\cdot100}{G}\\,\\% = \\frac{${dt(W2)}\\cdot100}{${dt(G2)}}\\,\\% = ${dt(p2)}\\,\\%$\n\nc) $W = ${dt(G3)}\\cdot\\frac{${dt(p3)}}{100} = ${dt(W3)}$`,
    hint: '10 % ist ein Zehntel, 50 % ist die Hälfte, 25 % ist ein Viertel. Bei 100 als Grundwert ist der Prozentwert gleich dem Prozentsatz.',
  };
}
const t6vars = [
  t6(null, 90, 30, 150, 75, 100, 35),
  ...distinct((r) => {
    const G1 = r.pick([40, 60, 80, 120, 200, 250]);
    const p1 = r.pick([10, 20, 25, 30, 50, 75]);
    const G2 = r.pick([60, 120, 160, 200, 400]);
    const p2 = r.pick([5, 10, 25, 40, 50, 75]);
    const G3 = r.pick([100, 100, 200, 300, 500]);
    const p3 = r.pick([15, 20, 35, 45, 60]);
    return t6(r, G1, p1, G2, round((G2 * p2) / 100, 4), G3, p3);
  }, 3, 21),
];

function t7(G, p, extra) {
  const before = round(extra / (p / 100), 2);
  return {
    prompt: `Ein Bauer baut Weizen an. Durch eine andere Weizenart konnte er seinen Ertrag um ${p} % steigern. Das entspricht einem zusätzlichen Ertrag von ${dt(extra)} t.\n\nBerechne, wie hoch sein Ertrag **vor** der Umstellung war.`,
    answer: fields(approx(before, { label: 'Ertrag vorher:', unit: 't', tol: 0.011 })),
    solution: `Gesucht ist der Grundwert $G$ (= der Ertrag vorher). Gegeben: Prozentwert $W=${dt(extra)}\\,\\text{t}$ und Prozentsatz $p\\,\\%=${p}\\,\\%$.\n\n$$G = W\\cdot\\frac{100}{p} = ${dt(extra)}\\cdot\\frac{100}{${p}} = ${dt(before)}\\,\\text{t}$$\n\nVor der Umstellung betrug der Ertrag **${dt(before)} t**.`,
    hint: 'Die 16 % Steigerung beziehen sich auf den Ertrag vorher – das ist der Grundwert. Die 60 t sind der Prozentwert.',
  };
}
const t7vars = [t7(null, 16, 60), ...distinct((r) => { const p = r.pick([8, 12, 15, 20, 25]); const before = r.pick([120, 200, 250, 320, 400, 500]); return t7(null, p, round((before * p) / 100, 2)); }, 3, 22)];

function t8(total, k) {
  const p = round((k * 100) / total, 4);
  return {
    prompt: `Bei einem Autohändler sind von ${total} verkauften Autos ${k} Elektroautos.\n\nBestimme, wie viel Prozent der verkauften Autos Elektroautos sind.`,
    answer: fields(approx(p, { label: 'Anteil:', unit: '%', tol: 0.011 })),
    solution: `Grundwert $G=${total}$, Prozentwert $W=${k}$.\n\n$$p\\,\\% = \\frac{W\\cdot100}{G}\\,\\% = \\frac{${k}\\cdot100}{${total}}\\,\\% = ${dt(p)}\\,\\%$$\n\nEs sind **${dt(p)} %** Elektroautos.`,
    hint: 'Teile den Prozentwert durch den Grundwert und multipliziere mit 100.',
  };
}
const t8vars = [t8(400, 175), ...distinct((r) => { const total = r.pick([200, 250, 400, 500, 800]); return t8(total, r.int(Math.round(total * 0.1), Math.round(total * 0.6))); }, 3, 23)];

function t9(kg, p) {
  const W = round((kg * p) / 100, 4);
  return {
    prompt: `Bei einer erwachsenen Person machen die Knochen ungefähr ${p} % des Körpergewichts aus.\n\nBerechne das Gewicht der Knochen für eine Person, die ${kg} kg wiegt.`,
    answer: fields(approx(W, { label: 'Knochengewicht:', unit: 'kg', tol: 0.011 })),
    solution: `Grundwert $G=${kg}\\,\\text{kg}$, Prozentsatz $p\\,\\%=${p}\\,\\%$.\n\n$$W = G\\cdot\\frac{p}{100} = ${kg}\\cdot\\frac{${p}}{100} = ${dt(W)}\\,\\text{kg}$$`,
    hint: 'Gesucht ist der Prozentwert: Grundwert mal Prozentsatz geteilt durch 100.',
  };
}
const t9vars = [t9(85, 12), ...distinct((r) => t9(r.pick([55, 62, 68, 72, 78, 90, 95]), r.pick([10, 12, 15, 16])), 3, 24)];

function t10(total, share) {
  const part = round((total * share) / 100, 4);
  return {
    prompt: `Jeder Mensch in Deutschland verbraucht durchschnittlich eine bestimmte Menge Wasser pro Tag. Das Kreisdiagramm zeigt, wie sich dieser Wasserverbrauch aufschlüsselt.\n\n![Kreisdiagramm Wasserverbrauch](%PIE%)\n\nBerechne, welcher Wassermenge das **komplette** Kreisdiagramm entspricht, wenn die Toilettenspülung ${dt(part)} Liter ausmacht.`,
    answer: fields(approx(total, { label: 'Gesamter Wasserverbrauch:', unit: 'Liter', tol: 0.011 })),
    solution: `Die Toilettenspülung macht $27\\,\\%$ aus – das ist der Prozentwert $W=${dt(part)}\\,\\text{l}$. Gesucht ist der Grundwert $G$ (das ganze Diagramm = 100 %).\n\n$$G = W\\cdot\\frac{100}{p} = ${dt(part)}\\cdot\\frac{100}{27} = ${dt(total)}\\,\\text{l}$$\n\nPro Tag verbraucht ein Mensch etwa **${dt(total)} Liter** Wasser.`,
    hint: 'Lies im Diagramm ab, wie viel Prozent die Toilettenspülung ausmacht. Diese Prozentzahl gehört zu der angegebenen Wassermenge.',
  };
}

// ---------- Zinseszins ----------
function t33(rows) {
  const parts = rows.map(([K, p, n], i) => money(round(K * (1 + p / 100) ** n, 6), `${LETTERS[i]}) ${dt(K)} €, ${dt(p)} %, ${n} Jahre →`));
  return {
    prompt: 'Bestimme jeweils das **Endkapital mit Zinseszinsen** am Ende der Laufzeit. Runde auf Cent.\n\n$$K_n = K_0\\cdot q^n \\qquad q = 1+\\frac{p}{100}$$',
    answer: fields(...parts),
    solution: rows.map(([K, p, n], i) => `${LETTERS[i]}) $q = 1+\\frac{${dt(p)}}{100} = ${de(1 + p / 100, 4)}$\n\n$K_{${n}} = ${de(K, 0)}\\cdot ${de(1 + p / 100, 4)}^{${n}} \\approx ${eurm(K * (1 + p / 100) ** n)}\\,€$`).join('\n\n'),
    hint: 'Zuerst den Zinsfaktor $q$ bestimmen (3 % → 1,03), dann im Taschenrechner $K_0\\cdot q^n$ eingeben (Potenztaste).',
  };
}
const t33vars = [t33([[5000, 3, 5], [25000, 4, 8], [2500, 2.5, 3], [1800, 1.5, 2]]), ...distinct((r) => t33(Array.from({ length: 4 }, () => [r.pick([1200, 1500, 2000, 3500, 4000, 6000, 10000, 12000]), r.pick([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]), r.int(2, 9)])), 3, 33)];

const t34Values = Array.from({ length: 11 }, (_, n) => round(1000 * 1.05 ** n, 2));

function t41(K, p, n) {
  const end = round(K * (1 + p / 100) ** n, 6);
  return {
    prompt: `Natascha legt die ${dt(K)} €, die sie zur Konfirmation bekommen hat, zu einem Zinssatz von ${dt(p)} % für ${n} Jahre fest an (die Zinsen werden mitverzinst).\n\nBerechne, wie viel Geld sie nach ${n} Jahren von ihrem Konto abheben kann.`,
    answer: fields(money(end, 'Kontostand:')),
    solution: `Zinsfaktor: $q = 1+\\frac{${dt(p)}}{100} = ${de(1 + p / 100, 4)}$\n\n$$K_{${n}} = ${de(K, 0)}\\cdot ${de(1 + p / 100, 4)}^{${n}} \\approx ${eurm(end)}\\,€$$\n\nNach ${n} Jahren kann sie **${eur(end)} €** abheben.`,
    hint: 'Weil die Zinsen mitverzinst werden, brauchst du die Zinseszinsformel $K_n=K_0\\cdot q^n$.',
  };
}
const t41vars = [t41(400, 3.5, 8), ...distinct((r) => t41(r.pick([250, 300, 500, 600, 800, 1000]), r.pick([2, 2.5, 3, 3.5, 4]), r.int(4, 10)), 3, 41)];

export function build({ fig }) {
  const pie = fig.pie({
    name: 'wasserverbrauch',
    slices: [
      { label: 'Körperpflege 36 %', value: 36 },
      { label: 'Toilettenspülung 27 %', value: 27, color: '#6366f1' },
      { label: 'Wäschewaschen 12 %', value: 12, color: '#38bdf8' },
      { label: 'Geschirrspülen 6 %', value: 6, color: '#f59e0b' },
      { label: 'Sonstiges 19 %', value: 19, color: '#94a3b8' },
    ],
  });
  const t10vars = [t10(130, 27), ...distinct((r) => t10(r.pick([110, 120, 125, 140, 150]), 27), 2, 25)].map((v) => ({ ...v, prompt: v.prompt.replace('%PIE%', pie) }));

  return [
    {
      topic: 'Zahlen & Rechnen',
      sections: [{
        title: 'Zehnerpotenzen im Überblick',
        md: L`Mit **Zehnerpotenzen** kannst du sehr große und sehr kleine Zahlen kurz aufschreiben.

- Ein **positiver Exponent** gibt die **Anzahl der Nullen** an: $10^{6}=1\,000\,000$.
- Ein **negativer Exponent** sagt, an welcher Stelle **hinter dem Komma** die erste Ziffer steht: $10^{-3}=0{,}001$.

| Zehnerpotenz | Zahl | Name |
|---|---|---|
| $10^{-3}$ | $0{,}001$ | ein Tausendstel (Milli) |
| $10^{-2}$ | $0{,}01$ | ein Hundertstel |
| $10^{-1}$ | $0{,}1$ | ein Zehntel |
| $10^{0}$ | $1$ | eins |
| $10^{1}$ | $10$ | zehn |
| $10^{2}$ | $100$ | hundert |
| $10^{3}$ | $1\,000$ | tausend (Kilo) |
| $10^{4}$ | $10\,000$ | zehntausend |
| $10^{5}$ | $100\,000$ | hunderttausend |
| $10^{6}$ | $1\,000\,000$ | eine Million (Mega) |
| $10^{9}$ | $1\,000\,000\,000$ | eine Milliarde (Giga) |

**So schreibst du eine Zahl mit Zehnerpotenz:** als Produkt aus einer Zahl zwischen 1 und 10 und einer Zehnerpotenz.

> $8\,000\,000 = 8\cdot 1\,000\,000 = 8\cdot10^{6}$
>
> $780\,000 = 7{,}8\cdot10^{5}$
>
> $0{,}0005 = 5\cdot0{,}0001 = 5\cdot10^{-4}$

**Zurück zur ausgeschriebenen Zahl:** $6{,}9\cdot10^{-5} = 6{,}9\cdot0{,}00001 = 0{,}000069$

**Tipp beim Rechnen:** Zehnerpotenzen teilst du getrennt: $\frac{1{,}41\cdot10^{27}}{1{,}08\cdot10^{21}} = \frac{1{,}41}{1{,}08}\cdot10^{27-21}$.`,
      }],
      packages: [
        {
          title: 'Zehnerpotenzen schreiben und lesen',
          description: 'Große und kleine Zahlen als Zehnerpotenz – und zurück',
          level: 1,
          tasks: [
            { title: 'Grundlagen 1 a–d: Große Zahlen als Zehnerpotenz', section: 'Zehnerpotenzen im Überblick', variants: t1big },
            { title: 'Grundlagen 1 e–h: Kleine Zahlen als Zehnerpotenz', section: 'Zehnerpotenzen im Überblick', variants: t1small },
            { title: 'Grundlagen 2 a–d: Große Zahlen ausschreiben', section: 'Zehnerpotenzen im Überblick', variants: t2big },
            { title: 'Grundlagen 2 e–h: Kleine Zahlen ausschreiben', section: 'Zehnerpotenzen im Überblick', variants: t2small },
          ],
        },
        {
          title: 'Zehnerpotenzen vergleichen und anwenden',
          description: 'Zahlen ordnen, Textzeichen zählen, Erde und Sonne',
          level: 2,
          tasks: [
            ordering('Grundlagen 3 a: Zahlen ordnen', [['4\\cdot10^{6}', '4\\,000\\,000'], ['4\\,400\\,000', '4\\,400\\,000'], ['4{,}5\\cdot10^{6}', '4\\,500\\,000'], ['5\\,000\\,000', '5\\,000\\,000'], ['4\\cdot10^{7}', '40\\,000\\,000']]),
            ordering('Grundlagen 3 b: Zahlen ordnen', [['5{,}1\\cdot10^{4}', '51\\,000'], ['3{,}6\\cdot10^{6}', '3\\,600\\,000'], ['3{,}7\\cdot10^{6}', '3\\,700\\,000'], ['3\\,720\\,000', '3\\,720\\,000'], ['40\\cdot10^{5}', '4\\,000\\,000']]),
            ordering('Grundlagen 3 c: Zahlen ordnen', [['0{,}005', '0{,}005'], ['0{,}0051', '0{,}0051'], ['5\\cdot10^{4}', '50\\,000'], ['5{,}1\\cdot10^{4}', '51\\,000'], ['5{,}12\\cdot10^{4}', '51\\,200']]),
            ordering('Grundlagen 3 d: Zahlen ordnen', [['0{,}00618', '0{,}00618'], ['65\\cdot10^{-4}', '0{,}0065'], ['6{,}8\\cdot10^{-3}', '0{,}0068'], ['0{,}00681', '0{,}00681']]),
            {
              title: 'Grundlagen 4: Zeichen auf Seiten',
              section: 'Zehnerpotenzen im Überblick',
              variants: [{
                prompt: 'Eine in „12pt-Schrift“ auf dem Computer verfasste Seite hat durchschnittlich 50 Zeilen mit je 75 Zeichen in einer Zeile.\n\nGib die Antworten als Zehnerpotenz $a\\cdot10^{n}$ an.\n\na) Wie viele Zeichen sind auf einer Seite?\n\nb) Wie viele Zeichen sind in einem Referat, das zehn Seiten lang ist?\n\nc) Wie viele Zeichen sind in einer Doktorarbeit, die 200 Seiten umfasst?',
                answer: fields(sci(3750, 'a) 1 Seite:'), sci(37500, 'b) 10 Seiten:'), sci(750000, 'c) 200 Seiten:')),
                solution: 'a) $50\\cdot75 = 3\\,750 = 3{,}75\\cdot10^{3}$\n\nb) $10\\cdot3\\,750 = 37\\,500 = 3{,}75\\cdot10^{4}$\n\nc) $200\\cdot3\\,750 = 750\\,000 = 7{,}5\\cdot10^{5}$',
                hint: 'Rechne zuerst $50\\cdot75$ und multipliziere dann mit der Seitenzahl. Das Ergebnis schreibst du dann als $a\\cdot10^n$.',
              }],
            },
            {
              title: 'Grundlagen 5: Erde und Sonne',
              section: 'Zehnerpotenzen im Überblick',
              variants: [{
                prompt: 'Das Erdvolumen beträgt $1\\,080\\,000\\,000\\,000\\,000\\,000\\,000\\ \\text{m}^3$. Die Sonne hat ein Volumen von $1{,}41\\cdot10^{27}\\ \\text{m}^3$.\n\na) Schreibe das Erdvolumen als Zehnerpotenz.\n\nb) Schreibe das Sonnenvolumen ohne Zehnerpotenz.\n\nc) Wie viele Erdkugeln füllen in etwa die Sonne aus? (Runde grob.)',
                answer: fields(sci(1.08e21, 'a) Erdvolumen in m³:'), { ...num(1.41e27, { label: 'b) Sonnenvolumen in m³:', tol: 0 }), rel: 1e-6 }, { ...num(1305556, { label: 'c) etwa', tol: 0, unit: 'Erdkugeln' }), rel: 0.02 }),
                solution: 'a) Die Zahl hat die Ziffern 108 gefolgt von 19 Nullen: $1\\,080\\,000\\,000\\,000\\,000\\,000\\,000 = 1{,}08\\cdot10^{21}$\n\nb) $1{,}41\\cdot10^{27} = 1\\,410\\,000\\,000\\,000\\,000\\,000\\,000\\,000\\,000$ ($141$ gefolgt von 25 Nullen)\n\nc) $\\dfrac{1{,}41\\cdot10^{27}}{1{,}08\\cdot10^{21}} = \\dfrac{1{,}41}{1{,}08}\\cdot10^{6} \\approx 1{,}3\\cdot10^{6}$\n\nEs passen etwa **1,3 Millionen Erdkugeln** in die Sonne.',
                hint: 'Bei c) teilst du das Sonnenvolumen durch das Erdvolumen. Die Zehnerpotenzen teilst du getrennt: $10^{27}:10^{21}=10^{6}$.',
              }],
            },
          ],
        },
      ],
    },
    {
      topic: 'Prozent & Zinsen',
      sections: [],
      packages: [
        {
          title: 'Prozentrechnung: Grundaufgaben',
          description: 'Prozentwert, Grundwert und Prozentsatz berechnen',
          level: 1,
          tasks: [
            { title: 'Grundlagen 6: Fehlenden Wert im Kopf', section: 'Prozentwert, Grundwert und Prozentsatz berechnen', variants: t6vars },
            { title: 'Grundlagen 8: Elektroautos', section: 'Prozentwert, Grundwert und Prozentsatz berechnen', variants: t8vars },
            { title: 'Grundlagen 9: Knochen', section: 'Prozentwert, Grundwert und Prozentsatz berechnen', variants: t9vars },
          ],
        },
        {
          title: 'Prozentrechnung: Anwendungen',
          description: 'Grundwert aus Prozentwert und Prozentsatz, Kreisdiagramm',
          level: 2,
          tasks: [
            { title: 'Grundlagen 7: Weizenertrag', section: 'Prozentwert, Grundwert und Prozentsatz berechnen', variants: t7vars },
            { title: 'Grundlagen 10: Wasserverbrauch', section: 'Prozentwert, Grundwert und Prozentsatz berechnen', variants: t10vars },
          ],
        },
        {
          title: 'Zinseszins',
          description: 'Endkapital mit Zinseszinsen berechnen, Entwicklung als Tabelle und Graph',
          level: 2,
          tasks: [
            { title: 'Grundlagen 33: Endkapital mit Zinseszins', section: 'Zinseszins', variants: t33vars },
            {
              title: 'Grundlagen 34: Kapitalentwicklung',
              section: 'Zinseszins',
              variants: [{
                prompt: 'Ein Anfangskapital von $1\\,000\\ €$ wird zehn Jahre lang zu einem festen Zinssatz von $5\\,\\%$ mit Zinseszinsen angelegt.\n\na) Erstelle eine Tabelle, die die Entwicklung des Kapitals zeigt. Runde auf Cent.\n\nb) Beim Ausfüllen entsteht unten automatisch der **Graph** der Kapitalentwicklung. Was fällt dir an der Form auf?',
                answer: fieldsWith(
                  t34Values.map((v) => approx(v, { tol: 0.011 })),
                  table({ cols: Array.from({ length: 11 }, (_, i) => i), rows: ['Kapital in €'], corner: 'Jahr n', plot: { xs: Array.from({ length: 11 }, (_, i) => i), xlabel: 'Jahre', ylabel: 'Kapital in €' } }),
                ),
                solution: 'Zinsfaktor $q = 1{,}05$. Jedes Jahr multiplizierst du das Kapital mit $1{,}05$:\n\n$K_n = 1\\,000\\cdot1{,}05^{n}$\n\n| Jahr | 0 | 1 | 2 | 3 | 4 | 5 |\n|---|---|---|---|---|---|---|\n| Kapital | 1 000,00 | 1 050,00 | 1 102,50 | 1 157,63 | 1 215,51 | 1 276,28 |\n\n| Jahr | 6 | 7 | 8 | 9 | 10 |\n|---|---|---|---|---|---|\n| Kapital | 1 340,10 | 1 407,10 | 1 477,46 | 1 551,33 | 1 628,89 |\n\nDer Graph ist eine **Kurve** (exponentielles Wachstum): Sie steigt von Jahr zu Jahr immer steiler.',
                hint: 'Multipliziere den Wert aus dem Vorjahr mit 1,05. Mit dem Taschenrechner: $1000\\cdot1{,}05^n$.',
              }],
            },
            { title: 'Grundlagen 41: Konfirmationsgeld', section: 'Zinseszins', variants: t41vars },
            {
              title: 'Grundlagen 42: Welches Angebot?',
              section: 'Zinseszins',
              variants: [{
                prompt: 'Der 13-jährige Yannick hat schon $1\\,500\\ €$ zusammengespart. Bis zu seinem 18. Geburtstag möchte er das Geld anlegen, um davon seinen Führerschein zu bezahlen. Die Bank macht ihm folgende Angebote:\n\n- **Angebot 1:** fester Zinssatz von $4{,}5\\,\\%$; Auszahlung der Zinsen jeweils am Jahresende\n- **Angebot 2:** fester Zinssatz von $4{,}25\\,\\%$; Zinsen werden jährlich mitverzinst\n\nBerechne, wie viel Geld Yannick an seinem 18. Geburtstag jeweils hat (bei Angebot 1: Kapital plus alle ausgezahlten Zinsen), und nimm Stellung.',
                answer: fields(money(1837.5, 'Angebot 1:'), money(1847.02, 'Angebot 2:'), sel(['Angebot 1', 'Angebot 2'], 'Angebot 2', 'Yannick sollte wählen:')),
                solution: 'Laufzeit: von 13 bis 18 Jahre → $n=5$ Jahre.\n\n**Angebot 1** (lineares Wachstum): Zinsen pro Jahr $1\\,500\\cdot0{,}045 = 67{,}50\\ €$. In 5 Jahren: $5\\cdot67{,}50 = 337{,}50\\ €$. Gesamt: $1\\,500+337{,}50 = 1\\,837{,}50\\ €$.\n\n**Angebot 2** (Zinseszins): $1\\,500\\cdot1{,}0425^{5} \\approx 1\\,847{,}02\\ €$.\n\nTrotz des kleineren Zinssatzes ist **Angebot 2** besser, weil die Zinsen mitverzinst werden (ca. $9{,}52\\ €$ mehr).',
                hint: 'Bei Angebot 1 bekommt Yannick jedes Jahr gleich hohe Zinsen. Bei Angebot 2 rechnest du mit $K_0\\cdot q^n$.',
              }],
            },
          ],
        },
      ],
    },
  ];
}
