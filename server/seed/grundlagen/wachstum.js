// Grundlagen-Training: Lineares und exponentielles Wachstum, Zu- und Abnahme, vermischte Aufgaben
import { L, rng, de, dt, eur, eurm, round, num, fields, sel, expr, approx, money, table, fieldsWith } from './kit.js';

function distinct(gen, count, seed) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < count * 10; i++) {
    const v = gen(rng(seed * 151 + i));
    if (!v || seen.has(v.prompt)) continue;
    seen.add(v.prompt);
    out.push(v);
  }
  return out;
}

const LIN = 'linear';
const EXP = 'exponentiell';
const KINDS = [LIN, EXP];
const REASONS = ['linear: In gleichen Zeitspannen kommt immer derselbe Betrag dazu', 'exponentiell: In gleichen Zeitspannen wird immer mit demselben Faktor multipliziert'];

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const cellsOf = (values, tol = 0) => values.map((v) => approx(v, { tol: Number.isInteger(v) && !tol ? 0 : tol || 0.011 }));
const plotOf = (xs, xlabel, ylabel) => ({ xs, xlabel, ylabel });

export function build() {
  // ---- Wachstumsfaktor bestimmen (Beispiel 1)
  const factorTask = (items) => ({
    prompt: 'Bestimme aus der prozentualen Veränderung jeweils den **Wachstumsfaktor** $q$.',
    answer: fields(...items.map((it, i) => num(it.q, { label: `${'abcde'[i]}) ${it.text}: q =`, tol: 0.0001 }))),
    solution: items.map((it, i) => `${'abcde'[i]}) ${it.text}: $q=${it.calc}=${de(it.q, 4)}$`).join('\n\n') + '\n\n**Merke:** Zunahme um $p\\,\\%$: $q=1+\\frac{p}{100}$ · Abnahme um $p\\,\\%$: $q=1-\\frac{p}{100}$. Eine Verdopplung ist eine Zunahme um 100 %, eine Halbierung eine Abnahme um 50 %.',
    hint: 'Bei Zunahme addierst du den Prozentsatz zu 1 (in Dezimalschreibweise), bei Abnahme ziehst du ihn von 1 ab.',
  });
  const inc = (p) => ({ text: `Zunahme um ${dt(p)} %`, q: round(1 + p / 100, 4), calc: `1+\\frac{${dt(p)}}{100}` });
  const dec = (p) => ({ text: `Abnahme um ${dt(p)} %`, q: round(1 - p / 100, 4), calc: `1-\\frac{${dt(p)}}{100}` });
  const dbl = { text: 'Verdopplung', q: 2, calc: '1+\\frac{100}{100}' };
  const half = { text: 'Halbierung', q: 0.5, calc: '1-\\frac{50}{100}' };
  const factorVars = [factorTask([inc(5), dec(8), dec(25), dbl, half]), ...distinct((r) => factorTask([inc(r.pick([2, 3, 4, 6, 7, 10, 12, 15])), dec(r.pick([2, 4, 5, 10, 12, 15, 20])), dec(r.pick([30, 40, 50, 60, 75])), r.pick([dbl, { text: 'Verdreifachung', q: 3, calc: '1+\\frac{200}{100}' }]), r.pick([half, { text: 'Abnahme auf ein Viertel', q: 0.25, calc: '1-\\frac{75}{100}' }])]), 3, 81)];

  // ---- 29 Bakterien / Motorblöcke
  const t29a = {
    prompt: 'Entscheide, um welche Art von Wachstum es sich handelt, gib die Funktionsgleichung an und lege eine Wertetabelle an. Beim Ausfüllen entsteht unten der Graph.\n\n**Eine Bakterienkultur vervierfacht sich in einer Stunde.** (Beginne mit 1 Bakterie: $n=0$.)',
    answer: fieldsWith([sel(KINDS, EXP, 'Wachstumsart:'), expr('4^n', { label: 'Gleichung G(n) =', vars: ['n'] }), ...cellsOf([1, 4, 16, 64, 256])],
      table({ from: 2, cols: range(0, 4), rows: ['Bakterien'], corner: 'Stunde n', plot: plotOf(range(0, 4), 'Stunden n', 'Bakterien') })),
    solution: 'Die Anzahl wird **in jeder Stunde mit demselben Faktor 4 multipliziert** → **exponentielles Wachstum**.\n\n$G_n = 1\\cdot4^{n}$\n\n| $n$ | 0 | 1 | 2 | 3 | 4 |\n|---|---|---|---|---|---|\n| Bakterien | 1 | 4 | 16 | 64 | 256 |\n\nDer Graph ist eine **Kurve**, die immer steiler wird.',
    hint: 'Eine Vervierfachung heißt: jede Stunde mal 4. Das Ergebnis der Vorstunde mal 4 ergibt die nächste Zeile.',
  };
  const t29b = {
    prompt: 'Entscheide, um welche Art von Wachstum es sich handelt, gib die Funktionsgleichung an und lege eine Wertetabelle an. Beim Ausfüllen entsteht unten der Graph.\n\n**Eine Maschine stellt in einer Stunde vier Motorblöcke her.** (Zu Beginn, $n=0$, sind es 0 Motorblöcke.)',
    answer: fieldsWith([sel(KINDS, LIN, 'Wachstumsart:'), expr('4n', { label: 'Gleichung y =', vars: ['n'] }), ...cellsOf([0, 4, 8, 12, 16])],
      table({ from: 2, cols: range(0, 4), rows: ['Motorblöcke'], corner: 'Stunde n', plot: plotOf(range(0, 4), 'Stunden n', 'Motorblöcke') })),
    solution: 'Pro Stunde kommen **immer 4 Blöcke dazu** → **lineares Wachstum**.\n\n$y = 4\\cdot n$\n\n| $n$ | 0 | 1 | 2 | 3 | 4 |\n|---|---|---|---|---|---|\n| Motorblöcke | 0 | 4 | 8 | 12 | 16 |\n\nDer Graph ist eine **Gerade**.',
    hint: 'Hier wird jede Stunde derselbe Betrag (4) addiert, nicht multipliziert.',
  };

  // ---- 30 linear oder exponentiell mit Begründung
  const stmts = [
    ['a) Die Aufrufe eines TikTok-Videos vervielfachen sich stündlich.', 1],
    ['b) In jedem Monat melden sich 10 neue Kunden in einem Fitnessstudio an.', 0],
    ['c) Die Stromkosten steigen jährlich um 12 %.', 1],
    ['d) In einen Swimmingpool werden jede Stunde 2 000 Liter Wasser gepumpt.', 0],
    ['e) Ein gut gepflegter Porsche-Oldtimer gewinnt jedes Jahr 15 % an Wert.', 1],
  ];
  const t30 = {
    prompt: 'Entscheide, ob es sich um ein **lineares** oder **exponentielles** Wachstum handelt. Wähle jeweils auch die passende Begründung.\n\n' + stmts.map((s) => `- ${s[0]}`).join('\n'),
    answer: fields(...stmts.map((s) => sel(REASONS, REASONS[s[1]], s[0].slice(0, 2)))),
    solution: '- a) **exponentiell**, denn „vervielfachen“ heißt: mit einem Faktor multiplizieren.\n- b) **linear**, denn jeden Monat kommen gleich viele (10) dazu.\n- c) **exponentiell**, denn Zunahme um einen festen Prozentsatz bedeutet Multiplikation mit $q=1{,}12$.\n- d) **linear**, denn jede Stunde werden gleich viele Liter (2 000) addiert.\n- e) **exponentiell**, denn 15 % Wertzuwachs pro Jahr bedeutet Multiplikation mit $q=1{,}15$.',
    hint: 'Linear: immer **dasselbe addiert**. Exponentiell: immer **mit demselben Faktor multipliziert** (z. B. prozentuale Änderung).',
  };

  // ---- 31 Taschengeld
  const dario = range(0, 5).map((n) => 15 + 3 * n);
  const mona = range(0, 5).map((n) => round(10 * 1.1 ** n, 2));
  const t31 = {
    prompt: 'Gib an, ob ein lineares oder exponentielles Wachstum vorliegt. Lege eine Wertetabelle an (Taschengeld pro Monat in €, auf Cent gerundet). Die Graphen entstehen beim Ausfüllen **gemeinsam** in einem Koordinatensystem.\n\na) Dario bekommt monatlich $15\\ €$ Taschengeld. Jedes Jahr soll es um $3\\ €$ erhöht werden.\n\nb) Mona bekommt monatlich $10\\ €$ Taschengeld. Jedes Jahr soll es um $10\\,\\%$ steigen.',
    answer: fieldsWith([sel(KINDS, LIN, 'Dario:'), sel(KINDS, EXP, 'Mona:'), ...cellsOf(dario), ...cellsOf(mona)],
      table({ from: 2, cols: range(0, 5), rows: ['Dario', 'Mona'], corner: 'Jahr', plot: plotOf(range(0, 5), 'Jahre', 'Taschengeld in €') })),
    solution: 'a) Dario: Jedes Jahr kommen **3 €** dazu → **linear**. $y=15+3n$\n\nb) Mona: Jedes Jahr wird mit **1,1** multipliziert → **exponentiell**. $y=10\\cdot1{,}1^{n}$\n\n| Jahr | 0 | 1 | 2 | 3 | 4 | 5 |\n|---|---|---|---|---|---|---|\n| Dario | 15 | 18 | 21 | 24 | 27 | 30 |\n| Mona | 10 | 11 | 12,10 | 13,31 | 14,64 | 16,11 |\n\nMonas Taschengeld startet niedriger, wächst aber immer schneller (Kurve).',
    hint: 'Bei Dario wird immer 3 addiert. Bei Mona ist q = 1 + 10/100 = 1,1.',
  };

  // ---- 32 Basketball
  const o1 = range(1, 5).map((n) => 10 * n);
  const o2 = range(1, 5).map((n) => 2 ** n - 1);
  const t32 = {
    prompt: 'Zu seinem erfolgreichen Hauptschulabschluss bekommt Sebastian von seinem Vater einen Basketballkorb. Zusätzlich soll er auch noch etwas Bargeld bekommen. Sebastian darf zehnmal auf den Korb werfen. Für jeden Treffer erhält er einen bestimmten Geldbetrag. Sein Vater macht ihm folgende Angebote:\n\n- **Angebot 1:** Sebastian bekommt für jeden Treffer $10\\ €$.\n- **Angebot 2:** Sebastian bekommt für den ersten Treffer $1\\ €$. Bei jedem weiteren Treffer verdoppelt sich jeweils die Auszahlung, die er für den Treffer bekommt.\n\nTrage in die Tabelle den **Gesamtbetrag nach 1 bis 5 Treffern** ein und entscheide, welches Angebot besser ist, wenn er höchstens die Hälfte trifft.',
    answer: fieldsWith([sel(['Angebot 1', 'Angebot 2'], 'Angebot 1', 'Besser ist (bei höchstens 5 Treffern):'), ...cellsOf([...o1, ...o2])],
      table({ from: 1, cols: range(1, 5), rows: ['Angebot 1', 'Angebot 2'], corner: 'Treffer', plot: plotOf(range(1, 5), 'Treffer', 'Gesamtbetrag in €') })),
    solution: '**Angebot 1** (linear): $10\\ €$ pro Treffer → 10, 20, 30, 40, 50 €.\n\n**Angebot 2** (exponentiell): Auszahlungen 1, 2, 4, 8, 16 € → Gesamtbeträge **1, 3, 7, 15, 31 €**.\n\nBei höchstens 5 Treffern ist **Angebot 1** besser (50 € gegen 31 €). Erst bei 6 Treffern wäre Angebot 2 mit 63 € besser als Angebot 1 mit 60 €.',
    hint: 'Bei Angebot 2 addierst du die Auszahlungen der einzelnen Treffer: 1 + 2 + 4 + …',
  };

  // ---- 35 Salmonellen
  const t35 = (n0, minutes, hours) => {
    const k = (hours * 60) / minutes;
    const end = n0 * 2 ** k;
    return {
      prompt: `In einem Fischbrötchen befinden sich um 12.00 Uhr ${n0} Salmonellen. Bei einer Temperatur von 20 °C verdoppelt sich die Anzahl der Salmonellen alle ${minutes} Minuten.\n\nBerechne, wie viele Salmonellen um ${12 + hours}.00 Uhr in dem Fischbrötchen sind.`,
      answer: fields(num(end, { label: 'Anzahl:', unit: 'Salmonellen', tol: 0 })),
      solution: `Zeitspanne: ${hours * 60} Minuten. Alle ${minutes} Minuten verdoppelt sich die Anzahl, also ${hours * 60}:${minutes} = **${k} Verdopplungen**.\n\nWachstumsfaktor: $q=2$.\n\n$$G_{${k}} = ${n0}\\cdot2^{${k}} = ${de(end, 0)}$$\n\nUm ${12 + hours}.00 Uhr sind es **${dt(end, 0)} Salmonellen**.`,
      hint: 'Wie viele Verdopplungen passieren in der Zeitspanne? Dann $G_n=G_0\\cdot2^n$.',
    };
  };
  const t35vars = [t35(50, 30, 2), ...distinct((r) => { const m = r.pick([15, 20, 30, 60]); const h = r.pick([1, 2, 3]); if ((h * 60) / m > 10) return null; return t35(r.pick([20, 40, 50, 80, 100]), m, h); }, 3, 85)];

  // ---- 36 Algen
  const t36 = (A, p, d) => {
    const q = round(1 - p / 100, 4);
    const end = A * q ** d;
    return {
      prompt: `Durch ein Algenvernichtungsmittel lässt sich ein Algenteppich von ${A} m² täglich um ${p} % reduzieren.\n\nBerechne die Größe der Algenfläche nach ${d} Tagen. Runde auf zwei Nachkommastellen.`,
      answer: fields(approx(end, { label: 'Algenfläche:', unit: 'm²', tol: 0.011, rel: 1e-4 })),
      solution: `Abnahme um ${p} % → $q=1-\\frac{${p}}{100}=${de(q, 4)}$\n\n$$G_{${d}} = ${A}\\cdot${de(q, 4)}^{${d}} \\approx ${de(end)}\\ \\text{m}^2$$\n\nNach ${d} Tagen sind noch etwa **${dt(end)} m²** Algen übrig.`,
      hint: 'Wachstumsfaktor bei Abnahme: $q=1-\\frac{p}{100}$. Dann $G_n=G_0\\cdot q^n$.',
    };
  };
  const t36vars = [t36(200, 20, 5), ...distinct((r) => t36(r.pick([100, 150, 250, 300, 400]), r.pick([10, 15, 25, 30, 40]), r.int(3, 7)), 3, 86)];

  // ---- 37 Virenlast
  const t37 = (half, thr) => {
    const vals = [100];
    while (vals[vals.length - 1] >= thr) vals.push(vals[vals.length - 1] / 2);
    const steps = vals.length - 1;
    const minutes = steps * half;
    return {
      prompt: `Durch eine Filteranlage lässt sich die Virenlast in einem Klassenraum innerhalb von ${half} Minuten halbieren.\n\nBerechne, wann sich die Virenlast auf **unter ${thr} %** reduziert hat. Nimm an, dass am Beginn eine Virenlast von 100 % vorliegt. Berechne den Zeitraum durch Probieren: Fülle die Tabelle aus (alle ${half} Minuten halbiert sich der Wert).`,
      answer: fieldsWith([...cellsOf(vals), num(minutes, { label: 'Unter ' + thr + ' % nach', unit: 'Minuten', tol: 0 })],
        table({ cols: vals.map((_, i) => i * half), rows: ['Virenlast in %'], corner: 'Minuten', plot: plotOf(vals.map((_, i) => i * half), 'Minuten', 'Virenlast in %') })),
      solution: `Wachstumsfaktor: $q=0{,}5$ (Halbierung)\n\n| Minuten | ${vals.map((_, i) => i * half).join(' | ')} |\n|---|${vals.map(() => '---').join('|')}|\n| Virenlast in % | ${vals.map((v) => de(v, 3)).join(' | ')} |\n\nNach ${steps} Halbierungen, also nach **${minutes} Minuten**, liegt die Virenlast mit ${de(vals[vals.length - 1], 3)} % unter ${thr} %.`,
      hint: 'Teile den Wert immer wieder durch 2, bis er unter die Grenze fällt.',
    };
  };
  const t37vars = [t37(10, 10), t37(15, 5), t37(20, 10)];

  // ---- 38 Autopreise
  const t38 = (rows, p) => {
    const q = 1 + p / 100;
    const cells = rows.flatMap(([, price]) => [Math.round(price * q ** 5), Math.round(price * q ** 10)]);
    return {
      prompt: `Die Tabelle zeigt die aktuellen Preise für vier Modelle eines Autoherstellers. Die Preise der Autos steigen jährlich durchschnittlich um ${dt(p)} %.\n\nWie viel kosten die Autos jeweils in fünf bzw. zehn Jahren? Runde auf ganze Euro.`,
      answer: fieldsWith(cells.map((v) => approx(v, { tol: 1 })),
        table({ cols: ['Preis in 5 Jahren', 'Preis in 10 Jahren'], rows: rows.map(([n, pr]) => `${n} (${dt(pr, 0)} €)`), corner: 'Modell (aktueller Preis)' })),
      solution: `Wachstumsfaktor: $q=1+\\frac{${dt(p)}}{100}=${de(q, 3)}$\n\n` + rows.map(([n, pr], i) => `${n}: $${de(pr, 0)}\\cdot${de(q, 3)}^{5}\\approx ${de(cells[2 * i], 0)}\\ €$ und $${de(pr, 0)}\\cdot${de(q, 3)}^{10}\\approx ${de(cells[2 * i + 1], 0)}\\ €$`).join('\n\n'),
      hint: 'Rechne $G_5 = G_0\\cdot q^5$ und $G_{10} = G_0\\cdot q^{10}$. Mit der Potenztaste geht es am schnellsten.',
    };
  };
  const t38vars = [t38([['Xavier', 9000], ['Fabio', 13500], ['Rico', 18900], ['Cesaro', 23200]], 4), ...distinct((r) => t38([['Xavier', r.pick([8000, 9500, 10000, 12000])], ['Fabio', r.pick([12500, 14000, 15500])], ['Rico', r.pick([17500, 19900, 21000])], ['Cesaro', r.pick([22000, 24500, 26000])]], r.pick([3, 5, 6])), 2, 88)];

  // ---- 39 Miete
  const t39 = (rent, p, years, limit) => {
    const end = rent * (1 + p / 100) ** years;
    return {
      prompt: `Die Mietpreise in Hannover steigen jährlich um ca. ${dt(p)} %. Carsten und Helge streiten sich, ob ihre jetzige Miete von ${dt(rent, 0)} € in ${years} Jahren mehr als ${dt(limit, 0)} € beträgt.\n\nEntscheide mithilfe einer Rechnung, ob die Miete über oder unter ${dt(limit, 0)} € liegen wird.`,
      answer: fields(money(end, 'Miete nach ' + years + ' Jahren:'), sel([`über ${dt(limit, 0)} €`, `unter ${dt(limit, 0)} €`], end > limit ? `über ${dt(limit, 0)} €` : `unter ${dt(limit, 0)} €`, 'Sie liegt')),
      solution: `Wachstumsfaktor: $q=1+\\frac{${dt(p)}}{100}=${de(1 + p / 100, 3)}$\n\n$$G_{${years}} = ${de(rent, 0)}\\cdot${de(1 + p / 100, 3)}^{${years}} \\approx ${eurm(end)}\\ €$$\n\nDie Miete liegt mit etwa **${eur(end)} €** ${end > limit ? 'über' : 'unter'} ${dt(limit, 0)} €.`,
      hint: 'Berechne die Miete nach der angegebenen Zeit mit $G_n=G_0\\cdot q^n$ und vergleiche mit der Grenze.',
    };
  };
  const t39vars = [t39(500, 5, 10, 750), ...distinct((r) => t39(r.pick([400, 450, 550, 600, 650]), r.pick([3, 4, 5, 6]), r.int(6, 12), r.pick([700, 800, 900, 1000])), 3, 89)];

  // ---- 40 Benzin
  const t40 = (price, p, years) => {
    const end = price * (1 + p / 100) ** years;
    return {
      prompt: `Die 15-jährige Leila hat in der Zeitung gelesen, dass der Preis für einen Liter Benzin um ca. ${p} % pro Jahr ansteigt. Sie möchte gerne wissen, wie teuer der Sprit ist, wenn sie mit 18 Jahren den Führerschein macht. Auf dem Schulweg hat sie gesehen, dass ein Liter im Moment ${dt(price)} € kostet.\n\nBerechne mit diesen Informationen den Spritpreis für den Zeitpunkt, wenn Leila 18 Jahre alt wird.`,
      answer: fields(approx(end, { label: 'Preis pro Liter:', unit: '€', tol: 0.011 })),
      solution: `Zeitspanne: von 15 bis 18 Jahre → $n=${years}$ Jahre. Wachstumsfaktor $q=1+\\frac{${p}}{100}=${de(1 + p / 100, 2)}$.\n\n$$G_{${years}} = ${de(price)}\\cdot${de(1 + p / 100, 2)}^{${years}} \\approx ${de(end, 3)} \\approx ${eurm(end)}\\ €$$\n\nEin Liter Benzin kostet dann etwa **${eur(end)} €**.`,
      hint: 'Leila ist heute 15 und wird 18: Wie viele Jahre sind das? Dann $G_n=G_0\\cdot q^n$.',
    };
  };
  const t40vars = [t40(1.82, 12, 3), ...distinct((r) => t40(r.pick([1.65, 1.7, 1.75, 1.9, 2.05]), r.pick([5, 8, 10, 12, 15]), 3), 3, 90)];

  // ---- 43 Fitnessstudios
  const fit = range(0, 6).map((n) => 100 + 12 * n);
  const elan = range(0, 6).map((n) => 100 * 1.1 ** n);
  const t43 = {
    prompt: 'In Hannover eröffnen zeitgleich zwei Fitnessstudios. Bei der Eröffnungsfeier melden sich bei beiden Studios exakt 100 Leute an. Danach gehen die Anmeldezahlen auseinander:\n\n- **Fit In:** Es melden sich jeden Monat 12 neue Mitglieder an.\n- **Elan:** Die Mitgliederzahl steigt jeden Monat um 10 %.\n\na) Stelle für die ersten 6 Monate eine geeignete Tabelle zum Vergleich der Mitgliederzahlen auf (ganze Mitglieder).\n\nb) Beim Ausfüllen entsteht unten das Diagramm (x-Achse: Monate, y-Achse: Mitgliederzahl).',
    answer: fieldsWith([...cellsOf(fit), ...elan.map((v) => approx(v, { tol: 0.6 }))],
      table({ cols: range(0, 6), rows: ['Fit In', 'Elan'], corner: 'Monat', plot: plotOf(range(0, 6), 'Monate', 'Mitglieder') })),
    solution: 'Fit In (**linear**): $100+12\\cdot n$ · Elan (**exponentiell**): $100\\cdot1{,}1^{n}$\n\n| Monat | 0 | 1 | 2 | 3 | 4 | 5 | 6 |\n|---|---|---|---|---|---|---|---|\n| Fit In | 100 | 112 | 124 | 136 | 148 | 160 | 172 |\n| Elan | 100 | 110 | 121 | 133 | 146 | 161 | 177 |\n\nZunächst hat Fit In mehr Mitglieder, ab dem 5. Monat überholt Elan, weil exponentielles Wachstum immer steiler wird.',
    hint: 'Fit In: jeden Monat +12. Elan: jeden Monat mal 1,1.',
  };

  return [
    {
      topic: 'Wachstum & Exponentialfunktionen',
      addProfiles: ['HS10'],
      sections: [{
        title: 'Beispiele: Tierpopulation und Neuwagen',
        md: L`**Zunahme und Abnahme um $p\,\%$:** Mit dem Wachstumsfaktor $q$ gilt $G_n=G_0\cdot q^{n}$.

- Zunahme: $q=1+\frac{p}{100}$ (z. B. $5\,\% \Rightarrow q=1{,}05$)
- Abnahme: $q=1-\frac{p}{100}$ (z. B. $8\,\% \Rightarrow q=0{,}92$)
- Verdopplung: $q=2$ · Halbierung: $q=0{,}5$

> **Tierpopulation:** 320 Tiere, Zunahme um $25\,\%$ pro Jahr. Nach 4 Jahren: $G_4=320\cdot1{,}25^{4}=781{,}25$ → es sind **781 Tiere** (abrunden, es gibt nur ganze Tiere).

> **Neuwagen:** $25\,000\ €$, verliert jährlich $20\,\%$ an Wert ($q=0{,}8$). Nach 6 Jahren: $G_6=25\,000\cdot0{,}8^{6}=6\,553{,}60\ €$.

**Der Graph** einer Funktion mit exponentiellem Wachstum oder Zerfall ist immer eine **Kurve**. Die Anfangsgröße $G_0$ ist der Schnittpunkt mit der $y$-Achse, der Wachstumsfaktor $q$ gibt die „Steigung“ an: Je größer $q$, desto steiler verläuft der Graph.`,
      }],
      packages: [
        {
          title: 'Linear oder exponentiell?',
          description: 'Wachstumsarten erkennen, Tabellen ausfüllen, Graphen vergleichen',
          level: 1,
          tasks: [
            { title: 'Grundlagen 29 a: Bakterienkultur', section: 'Lineares und exponentielles Wachstum', variants: [t29a] },
            { title: 'Grundlagen 29 b: Motorblöcke', section: 'Lineares und exponentielles Wachstum', variants: [t29b] },
            { title: 'Grundlagen 30: Linear oder exponentiell?', section: 'Lineares und exponentielles Wachstum', variants: [t30] },
            { title: 'Grundlagen 31: Taschengeld', section: 'Lineares und exponentielles Wachstum', variants: [t31] },
          ],
        },
        {
          title: 'Zu- und Abnahme berechnen',
          description: 'Wachstumsfaktor und G(n) = G(0) · q^n anwenden',
          level: 2,
          tasks: [
            { title: 'Beispiel 1: Wachstumsfaktor bestimmen', section: 'Wachstumsfaktor', variants: factorVars },
            { title: 'Grundlagen 35: Salmonellen', section: 'Wachstumsfaktor', variants: t35vars },
            { title: 'Grundlagen 36: Algenteppich', section: 'Wachstumsfaktor', variants: t36vars },
            { title: 'Grundlagen 37: Virenlast', section: 'Wachstumsfaktor', variants: t37vars },
            { title: 'Grundlagen 38: Autopreise', section: 'Wachstumsfaktor', variants: t38vars },
          ],
        },
        {
          title: 'Vermischte Aufgaben: Wachstum',
          description: 'Angebote vergleichen und mit Wachstumsfaktoren rechnen',
          level: 3,
          tasks: [
            { title: 'Grundlagen 32: Basketballkorb', section: 'Lineares und exponentielles Wachstum', variants: [t32] },
            { title: 'Grundlagen 39: Mietpreise', section: 'Wachstumsfaktor', variants: t39vars },
            { title: 'Grundlagen 40: Benzinpreis', section: 'Wachstumsfaktor', variants: t40vars },
            { title: 'Grundlagen 43: Fitnessstudios', section: 'Lineares und exponentielles Wachstum', variants: [t43] },
          ],
        },
      ],
    },
  ];
}
