// Grundlagen-Training: Daten und Zufall (Statistik und Wahrscheinlichkeit)
import { rng, de, dt, round, num, fields, sel, approx, pct, constraint, table, fieldsWith } from './kit.js';

function distinct(gen, count, seed) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < count * 10; i++) {
    const v = gen(rng(seed * 197 + i));
    if (!v) continue;
    const key = v.prompt + JSON.stringify(v.answer);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

const f2 = (v) => de(v, 2);
const mdTable = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}`;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Kennzahlen aus einer Häufigkeitstabelle { Wert: Anzahl }
function stats(values, counts) {
  const n = counts.reduce((a, b) => a + b, 0);
  const sorted = values.flatMap((v, i) => Array(counts[i]).fill(v));
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return { n, min: Math.min(...values.filter((_, i) => counts[i] > 0)), max: Math.max(...values.filter((_, i) => counts[i] > 0)), mean: sum / n, median: mid, sum, sorted };
}

export function build({ fig }) {
  // ======================================================================== Statistik
  const fahr = (hours, counts, title = 'Anzahl Fahrstunden', who = 'Prüflinge') => {
    const S = stats(hours, counts);
    return {
      prompt: `Nach ihren bestandenen Fahrprüfungen wurden ${S.n} Personen gefragt, wie viele Fahrstunden (à 45 min) sie benötigt haben.\n\n${mdTable([title, ...hours.map(String)], [[`Anzahl ${who}`, ...counts.map(String)]])}\n\na) Gib das Minimum, das Maximum und die Spannweite an.\n\nb) Berechne den Mittelwert (das arithmetische Mittel) und den Median (Zentralwert).`,
      answer: fields(num(S.min, { label: 'Minimum:', tol: 0 }), num(S.max, { label: 'Maximum:', tol: 0 }), num(S.max - S.min, { label: 'Spannweite:', tol: 0 }), approx(round(S.mean, 6), { label: 'Mittelwert:', tol: 0.011 }), approx(S.median, { label: 'Median:', tol: 0.011 })),
      solution: `a) Minimum: ${S.min} · Maximum: ${S.max} · Spannweite: $${S.max}-${S.min}=${S.max - S.min}$\n\nb) Mittelwert $=\\dfrac{\\text{Summe aller Werte}}{\\text{Anzahl der Werte}}=\\dfrac{${hours.map((h, i) => `${counts[i]}\\cdot${h}`).join('+')}}{${S.n}}=\\dfrac{${S.sum}}{${S.n}}\\approx${f2(S.mean)}$\n\nMedian: geordnete Rangfolge: ${S.sorted.join(', ')}\n\n${S.n % 2 ? `Ungerade Anzahl → der Wert in der Mitte ist der **${S.median}**.` : `Gerade Anzahl → Mittelwert der beiden mittleren Werte: **${de(S.median, 2)}**.`}`,
      hint: 'Mittelwert: jeden Wert mit seiner Anzahl malnehmen, alles addieren, durch die Gesamtzahl teilen. Median: Werte der Größe nach ordnen und die Mitte nehmen.',
    };
  };
  const fahrVars = [fahr([20, 21, 22, 23, 24], [3, 1, 2, 4, 5]), ...distinct((r) => { const st = r.pick([16, 18, 19, 21, 25]); return fahr(range(st, st + 4), range(0, 4).map(() => r.int(1, 6))); }, 3, 111)];

  const relH = (hours, counts) => {
    const n = counts.reduce((a, b) => a + b, 0);
    return {
      prompt: `Nach ihren bestandenen Fahrprüfungen wurden ${n} Personen gefragt, wie viele Fahrstunden sie benötigt haben.\n\n${mdTable(['Anzahl Fahrstunden', ...hours.map(String)], [['Anzahl Prüflinge', ...counts.map(String)]])}\n\nc) Bestimme die **relative Häufigkeit** jedes Wertes in Prozent (auf zwei Nachkommastellen).`,
      answer: fields(...hours.map((h, i) => pct((counts[i] / n) * 100, `${h} Fahrstunden:`))),
      solution: `relative Häufigkeit $=\\dfrac{\\text{absolute Häufigkeit}}{\\text{Anzahl aller Werte}}$\n\n` + hours.map((h, i) => `${h} Fahrstunden: $\\frac{${counts[i]}}{${n}}\\cdot100\\,\\%\\approx${f2((counts[i] / n) * 100)}\\,\\%$`).join('\n\n'),
      hint: 'Teile jede Anzahl durch die Gesamtzahl der Personen und multipliziere mit 100.',
    };
  };
  const relHVars = [relH([20, 21, 22, 23, 24], [3, 1, 2, 4, 5]), ...distinct((r) => relH(range(18, 22), [r.int(1, 6), r.int(1, 6), r.int(1, 6), r.int(1, 6), r.int(1, 6)]), 2, 112)];
  const angles = (hours, counts) => {
    const n = counts.reduce((a, b) => a + b, 0);
    return {
      prompt: `Die ${n} Prüflinge haben unterschiedlich viele Fahrstunden gebraucht:\n\n${mdTable(['Anzahl Fahrstunden', ...hours.map(String)], [['Anzahl Prüflinge', ...counts.map(String)]])}\n\nd) Du möchtest die relativen Häufigkeiten in einem **Kreisdiagramm** darstellen. Berechne die zugehörigen Winkel ($100\\,\\%\\ \\hat{=}\\ 360^\\circ$).`,
      answer: fields(...hours.map((h, i) => approx(round((counts[i] / n) * 360, 6), { label: `${h} Fahrstunden:`, unit: '°', tol: 0.6 }))),
      solution: `Winkel $=\\dfrac{\\text{absolute Häufigkeit}}{${n}}\\cdot360^\\circ$\n\n` + hours.map((h, i) => `${h} Fahrstunden: $\\frac{${counts[i]}}{${n}}\\cdot360^\\circ\\approx${de((counts[i] / n) * 360, 1)}^\\circ$`).join('\n\n'),
      hint: '$1\\,\\%$ entspricht $3{,}6^\\circ$. Oder: Anteil mal $360^\\circ$.',
    };
  };
  const anglesVars = [angles([20, 21, 22, 23, 24], [3, 1, 2, 4, 5]), angles(range(18, 22), [2, 4, 3, 5, 1])];

  const noten = (cls, counts) => {
    const S = stats([1, 2, 3, 4, 5, 6], counts);
    return {
      prompt: `In zwei Parallelklassen wurde die gleiche Mathematikarbeit geschrieben. Ergebnis der **Klasse ${cls}**:\n\n${mdTable(['Note', '1', '2', '3', '4', '5', '6'], [['Schülerzahl', ...counts.map(String)]])}\n\nBestimme das Minimum, das Maximum und die Spannweite sowie den Mittelwert und den Median.`,
      answer: fields(num(S.min, { label: 'Minimum:', tol: 0 }), num(S.max, { label: 'Maximum:', tol: 0 }), num(S.max - S.min, { label: 'Spannweite:', tol: 0 }), approx(round(S.mean, 6), { label: 'Mittelwert:', tol: 0.011 }), approx(S.median, { label: 'Median:', tol: 0.011 })),
      solution: `${S.n} Schülerinnen und Schüler.\n\nMinimum ${S.min}, Maximum ${S.max}, Spannweite ${S.max - S.min}.\n\nMittelwert: $\\dfrac{${counts.map((c, i) => `${c}\\cdot${i + 1}`).filter((_, i) => counts[i]).join('+')}}{${S.n}}=\\dfrac{${S.sum}}{${S.n}}\\approx${f2(S.mean)}$\n\nMedian: geordnet ergibt sich ${S.n % 2 ? `der mittlere Wert **${S.median}**` : `bei gerader Anzahl der Mittelwert der Werte an Position ${S.n / 2} und ${S.n / 2 + 1}: **${de(S.median, 1)}**`}.`,
      hint: 'Beim Median ordnest du die Noten der Größe nach: erst alle Einsen, dann alle Zweien usw.',
    };
  };
  const n10a = noten('10 a', [2, 4, 8, 9, 3, 2]);
  const n10b = noten('10 b', [0, 6, 12, 9, 1, 0]);
  const n10c = {
    prompt: 'Die Mathematikarbeit der beiden Parallelklassen hat folgende Ergebnisse (Schulnoten, niedriger ist besser):\n\n**Klasse 10 a:** Mittelwert $\\approx3{,}46$, Median $3{,}5$, Spannweite $5$\n\n**Klasse 10 b:** Mittelwert $\\approx3{,}18$, Median $3$, Spannweite $3$\n\nEntscheide, welche Klasse besser abgeschnitten hat, und begründe mit den Kennzahlen.',
    answer: fields(sel(['Klasse 10 a', 'Klasse 10 b'], 'Klasse 10 b', 'Besser abgeschnitten hat'), sel(['Mittelwert und Median sind kleiner (bessere Noten)', 'Die Spannweite ist größer', 'Es gibt mehr Einsen'], 'Mittelwert und Median sind kleiner (bessere Noten)', 'Begründung:')),
    solution: '**Klasse 10 b** hat besser abgeschnitten:\n\n- Der Mittelwert ($3{,}18$ gegen $3{,}46$) und der Median ($3$ gegen $3{,}5$) sind kleiner, also bessere Noten.\n- Die Spannweite ist kleiner, die Leistungen liegen enger beieinander (keine Note 1, aber auch keine 6).',
    hint: 'Bei Schulnoten ist ein kleinerer Mittelwert besser.',
  };

  const sp = [30, 23, 18, 15, 4];
  const spN = sp.reduce((a, b) => a + b, 0);
  const t126 = {
    prompt: `Innerhalb geschlossener Ortschaften sind für Autos $50\\ \\frac{\\text{km}}{\\text{h}}$ erlaubt. Eine Geschwindigkeitskontrolle ergab folgendes Ergebnis:\n\n${mdTable(['Überschreitung in km/h', 'Keine', '1–10', '11–20', '21–30', '>30'], [['Anzahl Autos', ...sp.map(String)]])}\n\na) Gib an, wie viele Autos insgesamt kontrolliert wurden.\n\nb) Berechne die relativen Häufigkeiten in Prozent (auf zwei Nachkommastellen).`,
    answer: fields(num(spN, { label: 'a) Autos insgesamt:', tol: 0 }), ...['Keine', '1–10', '11–20', '21–30', '>30'].map((k, i) => pct((sp[i] / spN) * 100, `b) ${k}:`))),
    solution: `a) $${sp.join('+')}=${spN}$ Autos\n\nb) ` + ['Keine', '1–10', '11–20', '21–30', '>30'].map((k, i) => `${k}: $\\frac{${sp[i]}}{${spN}}\\approx${f2((sp[i] / spN) * 100)}\\,\\%$`).join(' · ') + '\n\nDie Summe der relativen Häufigkeiten ist $100\\,\\%$ (Probe).',
    hint: 'Gesamtzahl = Summe aller Autos. Relative Häufigkeit = Anzahl : Gesamtzahl.',
  };

  const votes = { A: 600, B: 300, C: 300, D: 150 };
  const t127a = {
    prompt: 'Von 1 500 zufällig ausgewählten Personen würden bei der nächsten Wahl 600 die Partei A, 300 die Partei B, 300 die Partei C, 150 die Partei D und der Rest die Partei E wählen.\n\na) Stelle das Ergebnis in einer übersichtlichen Tabelle dar. Wie viele Personen wählen die Partei E?',
    answer: fieldsWith([num(150, { tol: 0 }), num(1500, { tol: 0 })], table({ from: 0, cols: ['E', 'gesamt'], rows: ['Stimmen'], corner: '' })),
    solution: `${mdTable(['Partei', 'A', 'B', 'C', 'D', 'E', 'gesamt'], [['Stimmen', '600', '300', '300', '150', '150', '1 500']])}\n\nPartei E: $1\\,500-600-300-300-150=150$`,
    hint: 'Ziehe von 1 500 die Stimmen der Parteien A bis D ab.',
  };
  const shares = [600, 300, 300, 150, 150];
  const t127b = {
    prompt: 'Von 1 500 Personen wählen 600 die Partei A, 300 die Partei B, 300 die Partei C, 150 die Partei D und 150 die Partei E.\n\nb) Berechne die relativen Häufigkeiten in Prozent.',
    answer: fields(...'ABCDE'.split('').map((p, i) => pct((shares[i] / 1500) * 100, `Partei ${p}:`))),
    solution: shares.map((s, i) => `Partei ${'ABCDE'[i]}: $\\frac{${s}}{1500}=${f2((s / 1500) * 100)}\\,\\%$`).join('\n\n'),
    hint: 'Teile die Stimmen jeder Partei durch 1 500.',
  };
  const t127b2 = {
    prompt: 'Von 1 500 Personen wählen 600 die Partei A, 300 die Partei B, 300 die Partei C, 150 die Partei D und 150 die Partei E.\n\nb) Für das **Kreisdiagramm** brauchst du die Winkel der Kreisausschnitte. Berechne sie ($100\\,\\%\\ \\hat{=}\\ 360^\\circ$).',
    answer: fields(...'ABCDE'.split('').map((p, i) => approx((shares[i] / 1500) * 360, { label: `Partei ${p}:`, unit: '°', tol: 0.6 }))),
    solution: shares.map((s, i) => `Partei ${'ABCDE'[i]}: $${f2((s / 1500) * 100)}\\,\\%$ → $${de((s / 1500) * 360, 1)}^\\circ$`).join('\n\n'),
    hint: 'Anteil mal $360^\\circ$ – z. B. $40\\,\\%$ sind $144^\\circ$.',
  };
  const t127c = {
    prompt: 'Bei der Umfrage unter 1 500 Personen ergaben sich folgende Anteile: Partei A $40\\,\\%$, B $20\\,\\%$, C $20\\,\\%$, D $10\\,\\%$, E $10\\,\\%$.\n\nc) Berechne die Stimmenverteilung bei $30\\,000$ Wählern.',
    answer: fields(...'ABCDE'.split('').map((p, i) => num([12000, 6000, 6000, 3000, 3000][i], { label: `Partei ${p}:`, tol: 0 }))),
    solution: 'Die relativen Häufigkeiten übertragen sich auf die größere Gruppe:\n\nA: $0{,}4\\cdot30\\,000=12\\,000$ · B und C: $0{,}2\\cdot30\\,000=6\\,000$ · D und E: $0{,}1\\cdot30\\,000=3\\,000$',
    hint: 'Rechne den Prozentwert aus: Anteil mal 30 000.',
  };

  // ======================================================================== Wahrscheinlichkeit
  const dieEx = (text, favourable, list) => ({
    prompt: `Berechne die Wahrscheinlichkeit, dass bei einem Würfelwurf die Augenzahl ${text} ist.`,
    answer: fields(num(favourable.length, { label: 'günstige Ergebnisse:', tol: 0 }), pct((favourable.length / 6) * 100, 'Wahrscheinlichkeit:')),
    solution: `Günstige Ergebnisse: ${list} → ${favourable.length}\n\nMögliche Ergebnisse: 1; 2; 3; 4; 5; 6 → 6\n\n$P(E)=\\dfrac{\\text{günstige}}{\\text{mögliche}}=\\dfrac{${favourable.length}}{6}\\approx${f2((favourable.length / 6) * 100)}\\,\\%$`,
    hint: 'Zähle die günstigen Ergebnisse und teile durch die Anzahl aller Möglichkeiten (6).',
  });
  const dieVars = [dieEx('durch 3 teilbar', [3, 6], '3; 6'), dieEx('gerade', [2, 4, 6], '2; 4; 6'), dieEx('größer als 4', [5, 6], '5; 6'), dieEx('eine Primzahl', [2, 3, 5], '2; 3; 5')];

  const t128 = {
    prompt: 'Ein Pokerblatt besteht aus 52 Karten. Insgesamt sind vier Asse enthalten.\n\nBerechne die Wahrscheinlichkeit, als erste Karte ein Ass zu bekommen. (Angabe in Prozent oder als Bruch, z. B. 1/13.)',
    answer: fields(pct((4 / 52) * 100, 'P(Ass) =')),
    solution: '$P(\\text{Ass})=\\dfrac{4}{52}=\\dfrac{1}{13}\\approx7{,}69\\,\\%$',
    hint: 'günstige Ergebnisse : mögliche Ergebnisse = 4 : 52',
  };
  const t129 = [
    { part: 'a) Mountainbike', n: 1, shown: 'mit einem Los das Mountainbike zu gewinnen' },
    { part: 'b) Niete', n: 220, shown: 'mit einem Los eine Niete zu ziehen' },
    { part: 'c) Taschenbuch oder Trinkflasche', n: 25, shown: 'mit einem Los ein Taschenbuch oder eine Trinkflasche zu gewinnen' },
  ].map((x) => ({
    prompt: `In einer Lostrommel befinden sich: 220 Nieten, 15 Taschenbücher, 10 Trinkflaschen, 4 In-Ear-Kopfhörer und 1 Mountainbike (insgesamt 250 Lose).\n\nBerechne die Wahrscheinlichkeit, ${x.shown}. (In Prozent oder als Bruch.)`,
    answer: fields(pct((x.n / 250) * 100, 'P =')),
    solution: `Mögliche Ergebnisse: $220+15+10+4+1=250$\n\n${x.part.slice(0, 1)}) Günstige Ergebnisse: ${x.n}\n\n$P=\\dfrac{${x.n}}{250}=${f2((x.n / 250) * 100)}\\,\\%$`,
    hint: 'Zähle zuerst alle Lose zusammen. Bei c) zählen beide Gewinnarten als günstig.',
  }));
  const t130 = {
    prompt: 'Ein Würfel wird 60-mal geworfen.\n\nWie müssten sich die Ergebnisse des Experiments verteilen? Gib an, wie oft jede Augenzahl zu erwarten ist, und nimm kritisch Stellung.',
    answer: fields(num(10, { label: 'Erwartung je Augenzahl:', unit: 'mal', tol: 0 }), sel(['Jede Augenzahl fällt genau 10-mal.', 'Jede Augenzahl fällt ungefähr 10-mal; Abweichungen sind normal.', 'Die Sechs fällt am seltensten.'], 'Jede Augenzahl fällt ungefähr 10-mal; Abweichungen sind normal.', 'Stellungnahme:')),
    solution: 'Bei einem fairen Würfel hat jede Augenzahl die Wahrscheinlichkeit $\\frac{1}{6}$. Bei 60 Würfen erwartet man $60\\cdot\\frac{1}{6}=10$ Treffer je Augenzahl.\n\n**Kritisch:** Es handelt sich um einen Zufallsversuch – die tatsächlichen Häufigkeiten schwanken (z. B. 7, 12, 9 …). Erst bei sehr vielen Würfen nähern sich die relativen Häufigkeiten $\\frac{1}{6}$ an.',
    hint: 'Welche Wahrscheinlichkeit hat jede Zahl? Wie oft passiert das also bei 60 Würfen im Durchschnitt?',
  };

  // Mehrstufig
  const balls = (s, w) => {
    const n = s + w;
    const withP = (s * w * 2) / (n * n);
    const withoutP = (s * w * 2) / (n * (n - 1));
    const url = fig.probTree({ name: `kugeln-${s}-${w}`, branches: [
      { label: 's', p: `${s}/${n}`, kids: [{ label: 's', p: `${s}/${n}` }, { label: 'w', p: `${w}/${n}` }] },
      { label: 'w', p: `${w}/${n}`, kids: [{ label: 's', p: `${s}/${n}` }, { label: 'w', p: `${w}/${n}` }] },
    ] });
    const url2 = fig.probTree({ name: `kugeln-ohne-${s}-${w}`, branches: [
      { label: 's', p: `${s}/${n}`, kids: [{ label: 's', p: `${s - 1}/${n - 1}` }, { label: 'w', p: `${w}/${n - 1}` }] },
      { label: 'w', p: `${w}/${n}`, kids: [{ label: 's', p: `${s}/${n - 1}` }, { label: 'w', p: `${w - 1}/${n - 1}` }] },
    ] });
    return {
      prompt: `In einem Behälter befinden sich ${s} schwarze und ${w} weiße Kugeln. Es werden nacheinander zwei Kugeln gezogen.\n\nBerechne die Wahrscheinlichkeit, **genau eine weiße Kugel** zu ziehen, wenn\n\na) die erste Kugel wieder zurückgelegt wird,\n\nb) die erste Kugel nicht zurückgelegt wird. (In Prozent.)`,
      answer: fields(pct(withP * 100, 'a) mit Zurücklegen:'), pct(withoutP * 100, 'b) ohne Zurücklegen:')),
      solution: `Das Ereignis „genau eine weiße“ hat zwei Pfade: (s; w) und (w; s). Pfadregeln: Produkt entlang des Pfades, Summe über die Pfade.\n\n**a) mit Zurücklegen**\n\n![Baumdiagramm](${url})\n\n$P(E)=\\frac{${s}}{${n}}\\cdot\\frac{${w}}{${n}}+\\frac{${w}}{${n}}\\cdot\\frac{${s}}{${n}}=${f2(withP * 100)}\\,\\%$\n\n**b) ohne Zurücklegen**\n\n![Baumdiagramm](${url2})\n\n$P(E)=\\frac{${s}}{${n}}\\cdot\\frac{${w}}{${n - 1}}+\\frac{${w}}{${n}}\\cdot\\frac{${s}}{${n - 1}}=${f2(withoutP * 100)}\\,\\%$`,
      hint: 'Zeichne ein Baumdiagramm. Ohne Zurücklegen ist nach dem ersten Zug eine Kugel weniger im Behälter.',
    };
  };
  const ballVars = [balls(3, 2), ...distinct((r) => { const s = r.pick([2, 3, 4, 5]), w = r.pick([2, 3, 4]); return s === 3 && w === 2 ? null : balls(s, w); }, 3, 113)];
  const t131 = {
    prompt: 'Anna würfelt zweimal hintereinander und addiert die Augenzahlen.\n\nBerechne die Wahrscheinlichkeit, dass sie insgesamt die Augenzahl 6 würfelt. (In Prozent oder als Bruch.)',
    answer: fields(pct((5 / 36) * 100, 'P(Summe 6) =')),
    solution: 'Es gibt $6\\cdot6=36$ gleich wahrscheinliche Ergebnispaare.\n\nSumme 6: (1;5), (2;4), (3;3), (4;2), (5;1) → 5 Pfade mit je $\\frac{1}{6}\\cdot\\frac{1}{6}=\\frac{1}{36}$\n\n$P=\\frac{5}{36}\\approx13{,}89\\,\\%$',
    hint: 'Schreibe alle Paare auf, die zusammen 6 ergeben, und zähle sie.',
  };
  const coinUrl = fig.probTree({ name: 'muenze', branches: [{ label: 'K', p: '1/2', kids: [{ label: 'K', p: '1/2' }, { label: 'Z', p: '1/2' }] }, { label: 'Z', p: '1/2', kids: [{ label: 'K', p: '1/2' }, { label: 'Z', p: '1/2' }] }] });
  const t132a = {
    prompt: 'Eine Münze wird zweimal nacheinander geworfen (Kopf K, Zahl Z).\n\na) Das Baumdiagramm zeigt alle Möglichkeiten. Berechne mit den Pfadregeln: Wie wahrscheinlich ist „zweimal Kopf“, wie wahrscheinlich „genau einmal Zahl“? (In Prozent.)',
    answer: fields(pct(25, 'zweimal Kopf:'), pct(50, 'genau einmal Zahl:')),
    solution: `![Baumdiagramm](${coinUrl})\n\nJeder Pfad hat die Wahrscheinlichkeit $\\frac{1}{2}\\cdot\\frac{1}{2}=\\frac{1}{4}=25\\,\\%$.\n\n- zweimal Kopf: Pfad KK → $25\\,\\%$\n- genau einmal Zahl: Pfade KZ und ZK → $25\\,\\%+25\\,\\%=50\\,\\%$`,
    hint: 'Multipliziere entlang des Pfades, addiere bei mehreren Pfaden.',
  };
  const t132b = {
    prompt: 'Eine Münze hat zwei Ergebnisse (Kopf, Zahl).\n\nb) Du sollst ein **Glücksrad** zeichnen, das bei einmaligem Drehen die gleichen Wahrscheinlichkeiten für die beiden Ergebnisse hat. Wie viele gleich große Sektoren brauchst du mindestens, und wie groß ist der Mittelpunktswinkel eines Sektors?',
    answer: fields(num(2, { label: 'Anzahl der Sektoren:', tol: 0 }), approx(180, { label: 'Winkel je Sektor:', unit: '°', tol: 0.5 })),
    solution: 'Zwei gleich wahrscheinliche Ergebnisse → **zwei gleich große Sektoren** (Halbkreise), je $\\frac{360^\\circ}{2}=180^\\circ$.\n\n(Möglich sind auch 4, 6, … Sektoren, die abwechselnd beschriftet werden.)',
    hint: 'Alle Ergebnisse müssen gleich viel „Platz“ auf dem Rad haben.',
  };
  const t133 = (withRepl) => {
    const p = withRepl ? (2 * 4 * 1) / 64 : (2 * 4 * 1) / (8 * 7);
    return {
      prompt: `Aus einem Kartenspiel werden vier Damen, drei Könige und ein Bube genommen (8 Karten). Nina zieht nacheinander zwei Karten.\n\nBerechne die Wahrscheinlichkeit, dass Nina **eine Dame und einen Buben** zieht, wenn sie die erste Karte ${withRepl ? 'wieder zurücklegt' : 'nicht zurücklegt'}. (In Prozent oder als Bruch.)`,
      answer: fields(pct(p * 100, 'P =')),
      solution: withRepl
        ? '„Dame und Bube“ hat zwei Pfade: (D; B) und (B; D).\n\n$P=\\frac{4}{8}\\cdot\\frac{1}{8}+\\frac{1}{8}\\cdot\\frac{4}{8}=\\frac{4}{64}+\\frac{4}{64}=\\frac{8}{64}=\\frac{1}{8}=12{,}5\\,\\%$'
        : '„Dame und Bube“ hat zwei Pfade: (D; B) und (B; D). Ohne Zurücklegen bleiben nach dem ersten Zug 7 Karten.\n\n$P=\\frac{4}{8}\\cdot\\frac{1}{7}+\\frac{1}{8}\\cdot\\frac{4}{7}=\\frac{4}{56}+\\frac{4}{56}=\\frac{8}{56}=\\frac{1}{7}\\approx14{,}29\\,\\%$',
      hint: 'Beide Reihenfolgen (erst Dame, dann Bube und umgekehrt) zählen.',
    };
  };
  const t134 = {
    prompt: 'Jonas muss auf seinem Schulweg über zwei Ampeln gehen. Die erste hat eine Grünphase von 50 Sekunden und eine Rotphase von 30 Sekunden. Die zweite hat eine Grünphase von 40 Sekunden und eine Rotphase von 60 Sekunden.\n\nBerechne die Wahrscheinlichkeit, dass Jonas auf dem Schulweg nicht warten muss. (In Prozent.)',
    answer: fields(pct(25, 'P(nicht warten) =')),
    solution: 'Erste Ampel grün: $\\frac{50}{80}=\\frac{5}{8}$\n\nZweite Ampel grün: $\\frac{40}{100}=\\frac{2}{5}$\n\nBeide grün (Produktregel): $P=\\frac{5}{8}\\cdot\\frac{2}{5}=\\frac{10}{40}=\\frac{1}{4}=25\\,\\%$',
    hint: 'Jonas muss bei **beiden** Ampeln Grün haben: Produktregel.',
  };
  const t135 = {
    prompt: 'Deine Mutter hat keine Lust mehr, deine Socken zusammenzurollen, und hat deswegen alle Socken einzeln in die Schublade gelegt. Morgens greifst du blind zweimal in die Schublade.\n\nBerechne die Wahrscheinlichkeit, bei acht Paar unterschiedlicher Socken ein passendes Pärchen zu ziehen. (In Prozent oder als Bruch.)',
    answer: fields(pct((1 / 15) * 100, 'P(Pärchen) =')),
    solution: 'Acht Paar = 16 einzelne Socken. Die erste Socke ist egal. Für die zweite Socke bleiben 15 Socken, **eine** davon passt zur ersten.\n\n$P=\\frac{16}{16}\\cdot\\frac{1}{15}=\\frac{1}{15}\\approx6{,}67\\,\\%$',
    hint: 'Nach der ersten Socke: Wie viele Socken sind noch in der Schublade, und wie viele davon passen?',
  };
  const t136 = {
    prompt: 'In einer Urne liegen rote, blaue und grüne Kugeln.\n\nGib eine mögliche Anzahl von Kugeln an, sodass mit einer Wahrscheinlichkeit von $25\\,\\%$ eine blaue Kugel gezogen wird.',
    answer: constraint([num(0, { label: 'blaue Kugeln:', tol: 0 }), num(0, { label: 'rote und grüne zusammen:', tol: 0 })], { type: 'share', index: 0, value: 0.25, integers: true }, 'z. B. 5 blaue und 15 andere (rot und grün)'),
    solution: '$25\\,\\%=\\frac{1}{4}$: Von vier Kugeln ist eine blau. Es gibt unendlich viele Möglichkeiten, z. B.:\n\n- 1 blaue, 3 andere (zusammen 4)\n- 5 blaue, 15 andere (zusammen 20)\n- 10 blaue, 30 andere (zusammen 40)\n\nDie anderen Kugeln müssen **dreimal so viele** sein wie die blauen.',
    hint: '$25\\,\\%$ ist ein Viertel: Wenn es $b$ blaue Kugeln gibt, müssen es insgesamt $4b$ Kugeln sein.',
  };
  const lostUrl = fig.probTree({ name: 'lostrommel137', branches: [
    { label: 'N', p: '?', kids: [{ label: 'N', p: '' }, { label: 'T', p: '' }, { label: 'H', p: '' }] },
    { label: 'T', p: '60/200', kids: [{ label: 'N', p: '' }, { label: 'T', p: '' }, { label: 'H', p: '' }] },
    { label: 'H', p: '10 %', kids: [{ label: 'N', p: '' }, { label: 'T', p: '' }, { label: 'H', p: '' }] },
  ] });
  const lostBase = `In einer Lostrommel mit 200 Losen befinden sich Nieten (N), Trostpreise (T) und Hauptgewinne (H). Yuna kauft zwei Lose und zieht sie nacheinander ohne Zurücklegen.\n\n![Baumdiagramm](${lostUrl})`;
  const t137a = {
    prompt: `${lostBase}\n\na) Ergänze den fehlenden Wert im Baumdiagramm (Wahrscheinlichkeit für eine Niete beim ersten Zug). Gib ihn in Prozent an.`,
    answer: fields(pct(60, 'P(N) =')),
    solution: 'Trostpreise: $\\frac{60}{200}=30\\,\\%$, Hauptgewinne: $10\\,\\%$.\n\nDie Wahrscheinlichkeiten eines Zuges ergeben zusammen $100\\,\\%$:\n\n$P(N)=100\\,\\%-30\\,\\%-10\\,\\%=60\\,\\%=\\frac{120}{200}$',
    hint: 'Alle Äste eines Zuges zusammen ergeben 1 (= 100 %).',
  };
  const pNone = (180 / 200) * (179 / 199);
  const t137b = {
    prompt: `${lostBase}\n\nb) Berechne die Wahrscheinlichkeit, dass sie **keinen Hauptgewinn** zieht (in Prozent).`,
    answer: fields(pct(pNone * 100, 'P(kein H) =', 0.02)),
    solution: `Hauptgewinne: $10\\,\\%$ von 200 = 20 Lose. Kein Hauptgewinn heißt: **beide** Lose sind keine Hauptgewinne.\n\n$P=\\frac{180}{200}\\cdot\\frac{179}{199}=${f2(pNone * 100)}\\,\\%$\n\n(Gegenereignis: $1-P(\\text{mindestens ein H})$)`,
    hint: 'Beim ersten Los sind 180 von 200 keine Hauptgewinne. Beim zweiten Los (ohne Zurücklegen) 179 von 199.',
  };
  const t137c = {
    prompt: 'An einem anderen Stand gibt es insgesamt **400 Lose**, die Anzahl der Trostpreise und Hauptgewinne ist aber **dieselbe wie in der Lostrommel mit 200 Losen** (60 Trostpreise, 20 Hauptgewinne).\n\nc) Begründe, ob auch die Wahrscheinlichkeit, einen Hauptgewinn zu ziehen, gleich bleibt.',
    answer: fields(pct(5, 'P(H) beim ersten Los ='), sel(['bleibt gleich', 'wird kleiner', 'wird größer'], 'wird kleiner', 'Die Wahrscheinlichkeit')),
    solution: 'Beim ersten Stand: $P(H)=\\frac{20}{200}=10\\,\\%$.\n\nBeim zweiten Stand: $P(H)=\\frac{20}{400}=5\\,\\%$.\n\nDie Anzahl der Hauptgewinne ist gleich, aber die Zahl **aller** Lose hat sich verdoppelt. Die Wahrscheinlichkeit **halbiert** sich (wird kleiner).',
    hint: 'P = günstige : mögliche. Was passiert mit dem Nenner, wenn mehr Nieten in der Trommel sind?',
  };

  return [
    {
      topic: 'Daten & Statistik',
      sections: [],
      packages: [
        {
          title: 'Statistische Kennwerte',
          description: 'Minimum, Maximum, Spannweite, Mittelwert und Median aus Häufigkeitstabellen',
          level: 1,
          tasks: [
            { title: 'Grundlagen Beispiel a/b: Fahrstunden', section: 'Mittelwert (Durchschnitt)', variants: fahrVars },
            { title: 'Grundlagen 125 a: Klasse 10 a', section: 'Median und Spannweite', variants: [n10a] },
            { title: 'Grundlagen 125 a: Klasse 10 b', section: 'Median und Spannweite', variants: [n10b] },
            { title: 'Grundlagen 125 c: Welche Klasse ist besser?', section: 'Median und Spannweite', variants: [n10c] },
          ],
        },
        {
          title: 'Relative Häufigkeit und Diagramme',
          description: 'Prozentuale Anteile, Kreisdiagramm-Winkel, Hochrechnen',
          level: 2,
          tasks: [
            { title: 'Grundlagen Beispiel c: relative Häufigkeit', section: 'Häufigkeiten und Diagramme', variants: relHVars },
            { title: 'Grundlagen Beispiel d: Kreisdiagramm', section: 'Häufigkeiten und Diagramme', variants: anglesVars },
            { title: 'Grundlagen 126: Geschwindigkeitskontrolle', section: 'Häufigkeiten und Diagramme', variants: [t126] },
            { title: 'Grundlagen 127 a: Wahlumfrage – Tabelle', section: 'Häufigkeiten und Diagramme', variants: [t127a] },
            { title: 'Grundlagen 127 b: Wahlumfrage – relative Häufigkeiten', section: 'Häufigkeiten und Diagramme', variants: [t127b] },
            { title: 'Grundlagen 127 b: Wahlumfrage – Kreisdiagramm', section: 'Häufigkeiten und Diagramme', variants: [t127b2] },
            { title: 'Grundlagen 127 c: Stimmenverteilung', section: 'Häufigkeiten und Diagramme', variants: [t127c] },
          ],
        },
      ],
    },
    {
      topic: 'Wahrscheinlichkeit',
      sections: [],
      packages: [
        {
          title: 'Einstufige Zufallsversuche',
          description: 'Laplace-Wahrscheinlichkeit: günstige durch mögliche Ergebnisse',
          level: 1,
          tasks: [
            { title: 'Grundlagen Beispiel: Würfelwurf', section: 'Laplace-Experimente', variants: dieVars },
            { title: 'Grundlagen 128: Pokerblatt', section: 'Laplace-Experimente', variants: [t128] },
            { title: 'Grundlagen 129 a: Mountainbike', section: 'Laplace-Experimente', variants: [t129[0]] },
            { title: 'Grundlagen 129 b: Niete', section: 'Laplace-Experimente', variants: [t129[1]] },
            { title: 'Grundlagen 129 c: Taschenbuch oder Trinkflasche', section: 'Laplace-Experimente', variants: [t129[2]] },
            { title: 'Grundlagen 130: 60 Würfe', section: 'Laplace-Experimente', variants: [t130] },
          ],
        },
        {
          title: 'Mehrstufige Zufallsversuche',
          description: 'Baumdiagramme und Pfadregeln, mit und ohne Zurücklegen',
          level: 2,
          tasks: [
            { title: 'Grundlagen Beispiel: Kugeln ziehen', section: 'Baumdiagramme und Pfadregeln', variants: ballVars },
            { title: 'Grundlagen 131: Zweimal würfeln', section: 'Baumdiagramme und Pfadregeln', variants: [t131] },
            { title: 'Grundlagen 132 a: Münze', section: 'Baumdiagramme und Pfadregeln', variants: [t132a] },
            { title: 'Grundlagen 132 b: Glücksrad', section: 'Baumdiagramme und Pfadregeln', variants: [t132b] },
            { title: 'Grundlagen 133 a: Dame und Bube (mit Zurücklegen)', section: 'Baumdiagramme und Pfadregeln', variants: [t133(true)] },
            { title: 'Grundlagen 133 b: Dame und Bube (ohne Zurücklegen)', section: 'Ziehen ohne Zurücklegen', variants: [t133(false)] },
            { title: 'Grundlagen 134: Ampeln', section: 'Baumdiagramme und Pfadregeln', variants: [t134] },
            { title: 'Grundlagen 135: Socken', section: 'Ziehen ohne Zurücklegen', variants: [t135] },
          ],
        },
        {
          title: 'Wahrscheinlichkeit: Knobelaufgaben',
          description: 'Eigene Beispiele finden und Lostrommel mit Baumdiagramm',
          level: 3,
          tasks: [
            { title: 'Grundlagen 136: 25 % blaue Kugeln', section: 'Laplace-Experimente', variants: [t136] },
            { title: 'Grundlagen 137 a: Lostrommel – fehlender Wert', section: 'Ziehen ohne Zurücklegen', variants: [t137a] },
            { title: 'Grundlagen 137 b: Lostrommel – kein Hauptgewinn', section: 'Ziehen ohne Zurücklegen', variants: [t137b] },
            { title: 'Grundlagen 137 c: Anderer Stand', section: 'Gegenereignis', variants: [t137c] },
          ],
        },
      ],
    },
  ];
}
