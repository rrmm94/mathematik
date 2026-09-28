// Themen 8–14: Skripte und Aufgaben-Generatoren.
import { de, round, num, fields, unordered, choice, free, relTol } from './helpers.js';
import { cuboid, cylinder, rightTriangle, img } from './figures.js';

const L = String.raw;
const ALL = ['HS9', 'RS9', 'HS10', 'RS10', 'ERS10'];
const deg = (x) => (x * Math.PI) / 180;
const probHint = 'Gib die Wahrscheinlichkeit als Bruch (z. B. 3/8), als Dezimalzahl oder in Prozent an.';
const prob = (p, label = 'P =') => num(p, { label, tol: 0.006, alt: [p * 100] });

export const topicsB = [
  // ------------------------------------------------------------------ 8
  {
    title: 'Körper: Oberfläche & Volumen',
    icon: 'Box',
    color: 'orange',
    description: 'Quader, Prisma, Zylinder, Pyramide, Kegel und Kugel',
    profiles: ALL,
    sections: [
      {
        title: 'Quader und Würfel',
        md: L`| | Volumen | Oberfläche |
|---|---|---|
| Quader | $V = a \cdot b \cdot c$ | $O = 2ab + 2ac + 2bc$ |
| Würfel | $V = a^3$ | $O = 6a^2$ |

Die **Oberfläche** ist die Summe aller Flächen des Netzes – stell dir vor, du würdest den Körper aufschneiden und flach ausbreiten.`,
      },
      {
        title: 'Prisma und Zylinder',
        md: L`Für **alle Prismen** gilt: $V = G \cdot h_K$ (Grundfläche mal Körperhöhe)

**Zylinder** (Grundfläche ist ein Kreis):

$$V = \pi r^2 \cdot h \qquad O = 2\pi r^2 + 2\pi r h$$

Die Mantelfläche $M = 2\pi r \cdot h$ ist ein aufgerolltes Rechteck.`,
      },
      {
        title: 'Pyramide, Kegel und Kugel',
        md: L`Spitze Körper haben **ein Drittel** des Volumens des passenden Prismas bzw. Zylinders:

$$V_{\text{Pyramide}} = \frac13 G \cdot h \qquad V_{\text{Kegel}} = \frac13 \pi r^2 h$$

**Kugel:** $V = \frac43 \pi r^3$ &nbsp; und &nbsp; $O = 4\pi r^2$

**Mantellinie des Kegels** mit Pythagoras: $s = \sqrt{r^2 + h^2}$`,
      },
    ],
    rungs: [
      (r) => {
        const a = r.int(4, 20), b = r.int(3, 12), c = r.int(2, 10);
        return {
          title: 'Volumen Quader',
          section: 0,
          prompt: L`Eine Saftverpackung hat die Form eines Quaders. Berechne das Volumen.

${img(cuboid({ a: `${a} cm`, b: `${b} cm`, c: `${c} cm` }), 'Quader')}`,
          answer: fields(num(a * b * c, { label: 'V =', unit: 'cm³' })),
          hint: 'V = Länge · Breite · Höhe',
          solution: L`$V = ${a} \cdot ${b} \cdot ${c} = ${a * b * c}\text{ cm}^3$`,
        };
      },
      (r) => {
        const a = r.int(4, 15), b = r.int(3, 10), c = r.int(2, 12);
        const O = 2 * (a * b + a * c + b * c);
        return {
          title: 'Oberfläche Quader',
          section: 0,
          prompt: L`Ein Geschenkkarton ist $${a}\text{ cm}$ lang, $${b}\text{ cm}$ breit und $${c}\text{ cm}$ hoch. Wie viel $\text{cm}^2$ Pappe braucht man mindestens für den Karton (Oberfläche)?`,
          answer: fields(num(O, { label: 'O =', unit: 'cm²' })),
          hint: 'Ein Quader hat 6 Flächen – je zwei sind gleich groß.',
          solution: L`$O = 2 \cdot ${a} \cdot ${b} + 2 \cdot ${a} \cdot ${c} + 2 \cdot ${b} \cdot ${c} = ${2 * a * b} + ${2 * a * c} + ${2 * b * c} = ${O}\text{ cm}^2$`,
        };
      },
      (r) => {
        const rad = r.int(2, 8), h = r.int(5, 20);
        const V = round(Math.PI * rad * rad * h);
        return {
          title: 'Volumen Zylinder',
          section: 1,
          prompt: L`Eine Dose hat die Form eines Zylinders. Berechne das Volumen. Runde auf zwei Nachkommastellen.

${img(cylinder({ r: `r = ${rad} cm`, h: `h = ${h} cm` }), 'Zylinder')}`,
          answer: fields(num(V, { label: 'V =', unit: 'cm³', tol: relTol(V) })),
          hint: 'V = π · r² · h',
          solution: L`$V = \pi \cdot ${rad}^2 \cdot ${h} \approx ${de(V)}\text{ cm}^3$`,
        };
      },
      (r) => {
        const rad = r.int(2, 9), h = r.int(4, 16);
        const O = round(2 * Math.PI * rad * rad + 2 * Math.PI * rad * h);
        return {
          title: 'Oberfläche Zylinder',
          section: 1,
          prompt: L`Ein zylinderförmiger Behälter (mit Deckel) hat den Radius $r = ${rad}\text{ cm}$ und die Höhe $h = ${h}\text{ cm}$. Berechne die Oberfläche.`,
          answer: fields(num(O, { label: 'O =', unit: 'cm²', tol: relTol(O) })),
          hint: 'O = 2 · Grundfläche + Mantelfläche = 2πr² + 2πrh',
          solution: L`$O = 2\pi \cdot ${rad}^2 + 2\pi \cdot ${rad} \cdot ${h} \approx ${de(2 * Math.PI * rad * rad)} + ${de(2 * Math.PI * rad * h)} \approx ${de(O)}\text{ cm}^2$`,
        };
      },
      (r) => {
        const rad = r.int(3, 8), h = 2 * rad;
        const Vk = round((Math.PI * rad * rad * h) / 3);
        const rk = r.int(2, 6) / 2 + 1;
        const Vs = round((4 / 3) * Math.PI * rk ** 3);
        return {
          title: 'Kegel und Kugel',
          section: 2,
          prompt: L`a) Ein Kegel hat den Radius $r = ${rad}\text{ cm}$ und die Höhe $h = ${h}\text{ cm}$. Berechne sein Volumen.

b) Eine Kugel hat das Volumen $V = ${de(Vs)}\text{ cm}^3$. Berechne ihren Radius.`,
          answer: fields(num(Vk, { label: 'a) V =', unit: 'cm³', tol: relTol(Vk) }), num(rk, { label: 'b) r =', unit: 'cm', tol: 0.02 })),
          hint: 'a) V = ⅓ · π · r² · h. b) Stelle V = 4/3 · π · r³ nach r um (dritte Wurzel!).',
          solution: L`a) $V = \frac13 \pi \cdot ${rad}^2 \cdot ${h} \approx ${de(Vk)}\text{ cm}^3$

b) $r = \sqrt[3]{\frac{3V}{4\pi}} = \sqrt[3]{\frac{3 \cdot ${de(Vs)}}{4\pi}} \approx ${de(rk)}\text{ cm}$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    title: 'Satz des Pythagoras',
    icon: 'TriangleRight',
    color: 'cyan',
    description: 'Seiten im rechtwinkligen Dreieck berechnen',
    profiles: ['HS10', 'RS10', 'ERS10'],
    sections: [
      {
        title: 'Der Satz des Pythagoras',
        md: L`In einem **rechtwinkligen** Dreieck gilt:

$$a^2 + b^2 = c^2$$

- $c$ ist die **Hypotenuse** – die längste Seite, sie liegt **gegenüber vom rechten Winkel**.
- $a$ und $b$ sind die **Katheten** – sie bilden den rechten Winkel.

**Achtung:** Die Buchstaben können anders heißen! Suche immer zuerst den rechten Winkel.`,
      },
      {
        title: 'Hypotenuse berechnen',
        md: L`$$c = \sqrt{a^2 + b^2}$$

> $a = 3\text{ cm}$, $b = 4\text{ cm}$: $c = \sqrt{9 + 16} = \sqrt{25} = 5\text{ cm}$`,
      },
      {
        title: 'Kathete berechnen',
        md: L`$$a = \sqrt{c^2 - b^2}$$

Bei der Kathete wird **subtrahiert** – die Hypotenuse ist ja die längste Seite.

> $c = 13\text{ cm}$, $b = 5\text{ cm}$: $a = \sqrt{169 - 25} = \sqrt{144} = 12\text{ cm}$`,
      },
      {
        title: 'Anwendungen im Raum und Alltag',
        md: L`**Leiter an der Wand:** Leiter = Hypotenuse, Wand und Boden = Katheten.

**Raumdiagonale im Quader:**
$$e = \sqrt{a^2 + b^2 + c^2}$$

**Würfel:** Flächendiagonale $d = \sqrt2 \cdot a$, Raumdiagonale $e = \sqrt3 \cdot a$`,
      },
    ],
    rungs: [
      (r) => {
        const at = r.int(0, 2);
        const opts = ['a² + b² = c²', 'a² + c² = b²', 'b² + c² = a²'];
        const vertex = ['C', 'B', 'A'][at];
        return {
          title: 'Hypotenuse erkennen',
          section: 0,
          prompt: L`In einem Dreieck $ABC$ liegt der rechte Winkel im Punkt **${vertex}**. (Die Seite $a$ liegt gegenüber von $A$, $b$ gegenüber von $B$, $c$ gegenüber von $C$.)

Welche Gleichung gilt?`,
          answer: choice(opts, at),
          hint: 'Die Hypotenuse liegt dem rechten Winkel gegenüber.',
          solution: L`Die Hypotenuse liegt gegenüber vom rechten Winkel in ${vertex}, also ist **${vertex.toLowerCase()}** die Hypotenuse: **${opts[at]}**`,
        };
      },
      (r) => {
        const [a0, b0, c0] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
        return {
          title: 'Hypotenuse (ganzzahlig)',
          section: 1,
          prompt: L`Berechne die Länge der Hypotenuse $c$.

${img(rightTriangle({ a: `a = ${a0} cm`, b: `b = ${b0} cm`, c: 'c = ?' }), 'Rechtwinkliges Dreieck')}`,
          answer: fields(num(c0, { label: 'c =', unit: 'cm' })),
          hint: 'c = √(a² + b²)',
          solution: L`$c = \sqrt{${a0}^2 + ${b0}^2} = \sqrt{${a0 * a0} + ${b0 * b0}} = \sqrt{${c0 * c0}} = ${c0}\text{ cm}$`,
        };
      },
      (r) => {
        const a = r.int(20, 90) / 10, b = r.int(20, 90) / 10;
        const c = round(Math.sqrt(a * a + b * b));
        return {
          title: 'Hypotenuse berechnen',
          section: 1,
          prompt: L`In einem rechtwinkligen Dreieck sind die Katheten $a = ${de(a)}\text{ cm}$ und $b = ${de(b)}\text{ cm}$ lang. Berechne die Hypotenuse $c$. Runde auf zwei Nachkommastellen.`,
          answer: fields(num(c, { label: 'c =', unit: 'cm', tol: 0.011 })),
          hint: 'c = √(a² + b²)',
          solution: L`$c = \sqrt{${de(a)}^2 + ${de(b)}^2} = \sqrt{${de(a * a)} + ${de(b * b)}} \approx ${de(c)}\text{ cm}$`,
        };
      },
      (r) => {
        const b = r.int(20, 60) / 10, c = b + r.int(15, 50) / 10;
        const a = round(Math.sqrt(c * c - b * b));
        return {
          title: 'Kathete berechnen',
          section: 2,
          prompt: L`Eine $${de(c)}\text{ m}$ lange Leiter lehnt an einer Hauswand. Der Fuß der Leiter steht $${de(b)}\text{ m}$ von der Wand entfernt. In welcher Höhe berührt die Leiter die Wand?`,
          answer: fields(num(a, { label: 'h =', unit: 'm', tol: 0.011 })),
          hint: 'Die Leiter ist die Hypotenuse. Gesucht ist eine Kathete: a = √(c² − b²).',
          solution: L`$h = \sqrt{${de(c)}^2 - ${de(b)}^2} = \sqrt{${de(c * c)} - ${de(b * b)}} \approx ${de(a)}\text{ m}$`,
        };
      },
      (r) => {
        const a = r.int(3, 12), b = r.int(2, 8), c = r.int(2, 10);
        const e = round(Math.sqrt(a * a + b * b + c * c));
        return {
          title: 'Raumdiagonale',
          section: 3,
          prompt: L`Ein Quader hat die Kantenlängen $a = ${a}\text{ cm}$, $b = ${b}\text{ cm}$ und $c = ${c}\text{ cm}$. Passt ein $${Math.floor(e)}\text{ cm}$ langer Stab schräg in den Quader? Berechne dazu die Länge der Raumdiagonalen $e$.`,
          answer: fields(num(e, { label: 'e =', unit: 'cm', tol: 0.011 })),
          hint: 'Berechne zuerst die Diagonale der Grundfläche, dann die Raumdiagonale. Oder direkt: e = √(a² + b² + c²).',
          solution: L`Grundflächendiagonale: $d = \sqrt{${a}^2 + ${b}^2} \approx ${de(Math.sqrt(a * a + b * b))}\text{ cm}$

Raumdiagonale: $e = \sqrt{d^2 + ${c}^2} = \sqrt{${a * a + b * b + c * c}} \approx ${de(e)}\text{ cm}$ → Der Stab passt ✓`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    title: 'Daten & Statistik',
    icon: 'BarChart3',
    color: 'fuchsia',
    description: 'Mittelwert, Median, Spannweite und Häufigkeiten',
    profiles: ALL,
    sections: [
      {
        title: 'Mittelwert (Durchschnitt)',
        md: L`$$\text{Mittelwert} = \frac{\text{Summe aller Werte}}{\text{Anzahl der Werte}}$$

> Noten 5; 3; 4; 3; 2 → $\frac{5+3+4+3+2}{5} = \frac{17}{5} = 3{,}4$

**Mit Häufigkeitstabelle:** Jeden Wert mit seiner Anzahl multiplizieren, alles addieren und durch die Gesamtanzahl teilen.`,
      },
      {
        title: 'Median und Spannweite',
        md: L`**Median (Zentralwert):** Werte der Größe nach ordnen – der Wert in der **Mitte** ist der Median. Bei gerader Anzahl: Mittelwert der beiden mittleren Werte.

**Spannweite:** größter Wert − kleinster Wert

> 2; 3; **4**; 7; 9 → Median = 4, Spannweite = 9 − 2 = 7`,
      },
      {
        title: 'Häufigkeiten und Diagramme',
        md: L`**Absolute Häufigkeit:** Wie oft kommt etwas vor? (z. B. 6 Schüler)

**Relative Häufigkeit:** Anteil am Ganzen: $\frac{\text{absolute Häufigkeit}}{\text{Gesamtzahl}}$ (z. B. $\frac{6}{24} = 0{,}25 = 25\,\%$)

**Kreisdiagramm:** Der ganze Kreis hat $360°$. Winkel $= \text{relative Häufigkeit} \cdot 360°$ (25 % → 90°).`,
      },
    ],
    rungs: [
      (r) => {
        const vals = Array.from({ length: 5 }, () => r.int(1, 6));
        const m = vals.reduce((s, v) => s + v, 0) / 5;
        return {
          title: 'Durchschnitt berechnen',
          section: 0,
          prompt: L`Hakan hat im Schuljahr folgende Noten geschrieben: **${vals.join('; ')}**. Berechne seine Durchschnittsnote.`,
          answer: fields(num(m, { label: 'Durchschnitt:', tol: 0.011 })),
          hint: 'Alle Noten addieren und durch die Anzahl teilen.',
          solution: L`$\frac{${vals.join(' + ')}}{5} = \frac{${vals.reduce((s, v) => s + v, 0)}}{5} = ${de(m)}$`,
        };
      },
      (r) => {
        const vals = Array.from({ length: 7 }, () => r.int(8, 40));
        const sorted = [...vals].sort((a, b) => a - b);
        return {
          title: 'Median und Spannweite',
          section: 1,
          prompt: L`Bei einem Weitsprung-Wettbewerb wurden folgende Weiten (in dm) gemessen:

**${vals.join('; ')}**

Bestimme den Median und die Spannweite.`,
          answer: fields(num(sorted[3], { label: 'Median:', unit: 'dm' }), num(sorted[6] - sorted[0], { label: 'Spannweite:', unit: 'dm' })),
          hint: 'Ordne die Werte zuerst der Größe nach.',
          solution: L`Geordnet: ${sorted.map((v, i) => (i === 3 ? `**${v}**` : v)).join('; ')}

Median $= ${sorted[3]}$, Spannweite $= ${sorted[6]} - ${sorted[0]} = ${sorted[6] - sorted[0]}$`,
        };
      },
      (r) => {
        const counts = [r.int(0, 3), r.int(2, 6), r.int(3, 8), r.int(2, 6), r.int(0, 3), r.int(0, 2)];
        const n = counts.reduce((s, v) => s + v, 0);
        const sum = counts.reduce((s, v, i) => s + v * (i + 1), 0);
        return {
          title: 'Mittelwert aus Tabelle',
          section: 0,
          prompt: L`Die Tabelle zeigt die Ergebnisse einer Mathearbeit.

| Note | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Anzahl | ${counts.join(' | ')} |

Berechne den Notendurchschnitt. Runde auf zwei Nachkommastellen.`,
          answer: fields(num(round(sum / n), { label: 'Durchschnitt:', tol: 0.011 })),
          hint: 'Note · Anzahl für jede Spalte, dann alles addieren und durch die Gesamtzahl teilen.',
          solution: L`$\frac{${counts.map((c, i) => `${i + 1}\cdot${c}`).join(' + ')}}{${n}} = \frac{${sum}}{${n}} \approx ${de(sum / n)}$`,
        };
      },
      (r) => {
        const total = r.pick([20, 24, 25, 30, 40, 50]), part = r.int(3, Math.floor(total / 2));
        const pct = round((part / total) * 100), ang = round((part / total) * 360);
        return {
          title: 'Relative Häufigkeit & Kreisdiagramm',
          section: 2,
          prompt: L`Von $${total}$ befragten Jugendlichen fahren $${part}$ mit dem Bus zur Schule.

a) Wie viel Prozent sind das?

b) Wie groß ist der Winkel für „Bus“ in einem Kreisdiagramm?`,
          answer: fields(num(pct, { label: 'a)', unit: '%', tol: 0.011 }), num(ang, { label: 'b)', unit: '°', tol: 0.11 })),
          hint: 'Anteil = Teil : Ganzes. Der Vollkreis hat 360°.',
          solution: L`a) $\frac{${part}}{${total}} = ${de(part / total, 4)} = ${de(pct)}\,\%$

b) $${de(part / total, 4)} \cdot 360° = ${de(ang)}°$`,
        };
      },
      (r) => {
        const known = Array.from({ length: 4 }, () => r.int(2, 9));
        const missing = r.int(2, 9);
        const m = (known.reduce((s, v) => s + v, 0) + missing) / 5;
        return {
          title: 'Fehlenden Wert bestimmen',
          section: 0,
          prompt: L`Fünf Freunde haben im Durchschnitt $${de(m)}$ Stunden pro Woche Sport gemacht. Vier von ihnen haben $${known.join('\\text{ h}, ')}\text{ h}$ angegeben. Wie viele Stunden hat der fünfte Freund Sport gemacht?`,
          answer: fields(num(missing, { label: 'Stunden:', unit: 'h', tol: 0.011 })),
          hint: 'Mittelwert · Anzahl = Summe aller Werte.',
          solution: L`Summe aller fünf Werte: $${de(m)} \cdot 5 = ${de(m * 5)}$

Fehlender Wert: $${de(m * 5)} - (${known.join(' + ')}) = ${de(missing)}\text{ h}$`,
        };
      },
    ],
    extras: [
      {
        rung: 3,
        title: 'Begründen: Mittelwert',
        section: 0,
        prompt: L`Frau Meier berechnet den Notendurchschnitt ihrer Klasse mit der Formel

$$M = (1a + 2b + 3c + 4d + 5e + 6f) : 20$$

Erkläre, wofür der Buchstabe $e$ steht und warum sie durch 20 teilt.`,
        answer: free('e ist die Anzahl der Schülerinnen und Schüler, die die Note 5 geschrieben haben. Sie teilt durch 20, weil insgesamt 20 Schülerinnen und Schüler die Arbeit mitgeschrieben haben.'),
        solution: L`$e$ steht für die **Anzahl der Schülerinnen und Schüler mit der Note 5**. Geteilt wird durch 20, weil **20 Kinder** mitgeschrieben haben (Gesamtanzahl).`,
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    title: 'Wahrscheinlichkeit',
    icon: 'Dices',
    color: 'lime',
    description: 'Laplace-Experimente, Baumdiagramme und Pfadregeln',
    profiles: ALL,
    sections: [
      {
        title: 'Laplace-Experimente',
        md: L`Bei einem Zufallsexperiment, bei dem alle Ergebnisse **gleich wahrscheinlich** sind (Würfel, Münze, …):

$$P(E) = \frac{\text{Anzahl der günstigen Ergebnisse}}{\text{Anzahl aller möglichen Ergebnisse}}$$

> Würfel, gerade Zahl: günstig sind 2, 4, 6 → $P = \frac36 = \frac12 = 50\,\%$

Wahrscheinlichkeiten liegen immer zwischen $0$ (unmöglich) und $1$ (sicher).`,
      },
      {
        title: 'Baumdiagramme und Pfadregeln',
        md: L`Mehrstufige Zufallsexperimente stellt man mit einem **Baumdiagramm** dar.

**1. Pfadregel (Produktregel):** Wahrscheinlichkeiten **entlang eines Pfades multiplizieren**.

**2. Pfadregel (Summenregel):** Gehören mehrere Pfade zum Ereignis, deren Wahrscheinlichkeiten **addieren**.

> Zweimal Münze werfen: $P(\text{Kopf, Kopf}) = \frac12 \cdot \frac12 = \frac14$`,
      },
      {
        title: 'Ziehen ohne Zurücklegen',
        md: L`Wird die gezogene Kugel/Karte **nicht zurückgelegt**, ändern sich die Wahrscheinlichkeiten auf der zweiten Stufe: Es ist eine Karte weniger im Spiel!

> 20 Karten, davon 3 Joker. Zweimal ziehen ohne Zurücklegen:
> $$P(\text{Joker, Joker}) = \frac{3}{20} \cdot \frac{2}{19} = \frac{6}{380} \approx 0{,}016$$`,
      },
      {
        title: 'Gegenereignis',
        md: L`Oft ist es einfacher, das **Gegenteil** zu berechnen:

$$P(\text{mindestens einmal}) = 1 - P(\text{keinmal})$$

> $P(\text{mindestens ein Joker}) = 1 - \frac{17}{20}\cdot\frac{16}{19} \approx 1 - 0{,}716 = 0{,}284$`,
      },
    ],
    rungs: [
      (r) => {
        const ev = r.pick([
          ['eine gerade Zahl', 3], ['eine Zahl größer als 4', 2], ['eine 6', 1], ['eine Zahl kleiner als 3', 2], ['eine Primzahl (2, 3 oder 5)', 3],
        ]);
        return {
          title: 'Würfeln',
          section: 0,
          prompt: L`Ein normaler Spielwürfel wird einmal geworfen. Wie groß ist die Wahrscheinlichkeit, **${ev[0]}** zu würfeln?

*${probHint}*`,
          answer: fields(prob(ev[1] / 6)),
          hint: 'Zähle die günstigen Ergebnisse. Es gibt 6 mögliche Ergebnisse.',
          solution: L`Günstige Ergebnisse: $${ev[1]}$ von $6$ → $P = \frac{${ev[1]}}{6} \approx ${de(ev[1] / 6, 3)} \approx ${de((ev[1] / 6) * 100)}\,\%$`,
        };
      },
      (r) => {
        const red = r.int(2, 7), blue = r.int(2, 8), green = r.int(1, 5);
        const n = red + blue + green;
        return {
          title: 'Ziehen aus einer Urne',
          section: 0,
          prompt: L`In einem Beutel liegen $${red}$ rote, $${blue}$ blaue und $${green}$ grüne Kugeln. Es wird eine Kugel gezogen. Wie groß ist die Wahrscheinlichkeit für eine **rote** Kugel?

*${probHint}*`,
          answer: fields(prob(red / n)),
          hint: 'Wie viele Kugeln sind es insgesamt?',
          solution: L`Insgesamt $${n}$ Kugeln, davon $${red}$ rot: $P = \frac{${red}}{${n}} \approx ${de(red / n, 3)}$`,
        };
      },
      (r) => {
        const red = r.int(1, 3), total = r.pick([4, 5, 6, 8]);
        return {
          title: 'Zweistufig mit Zurücklegen',
          section: 1,
          prompt: L`Ein Glücksrad hat $${total}$ gleich große Felder, davon sind $${red}$ rot. Das Rad wird **zweimal** gedreht. Wie groß ist die Wahrscheinlichkeit, dass **beide Male** Rot erscheint?

*${probHint}*`,
          answer: fields(prob((red / total) ** 2)),
          hint: '1. Pfadregel: entlang des Pfades multiplizieren.',
          solution: L`$P(\text{rot, rot}) = \frac{${red}}{${total}} \cdot \frac{${red}}{${total}} = \frac{${red * red}}{${total * total}} \approx ${de((red / total) ** 2, 4)}$`,
        };
      },
      (r) => {
        const N = r.pick([10, 12, 15, 20]), J = r.int(2, 4);
        const p = (J / N) * ((J - 1) / (N - 1));
        return {
          title: 'Ziehen ohne Zurücklegen',
          section: 2,
          prompt: L`Lars hat ein Kartenspiel mit $${N}$ Karten, darunter $${J}$ Joker. Er zieht nacheinander zwei Karten, **ohne** die erste zurückzulegen. Wie groß ist die Wahrscheinlichkeit, **zwei Joker** zu ziehen?

*${probHint}*`,
          answer: fields(num(p, { label: 'P =', tol: 0.0011, alt: [p * 100] })),
          hint: 'Nach dem ersten Joker sind nur noch ' + (N - 1) + ' Karten und ' + (J - 1) + ' Joker übrig.',
          solution: L`$P = \frac{${J}}{${N}} \cdot \frac{${J - 1}}{${N - 1}} = \frac{${J * (J - 1)}}{${N * (N - 1)}} \approx ${de(p, 4)}$`,
        };
      },
      (r) => {
        const N = r.pick([10, 12, 15, 20]), J = r.int(2, 4);
        const p = 1 - ((N - J) / N) * ((N - J - 1) / (N - 1));
        return {
          title: 'Gegenereignis',
          section: 3,
          prompt: L`In einem Kartenspiel mit $${N}$ Karten sind $${J}$ Joker. Es werden zwei Karten **ohne Zurücklegen** gezogen. Wie groß ist die Wahrscheinlichkeit, **mindestens einen** Joker zu ziehen?

*${probHint}*`,
          answer: fields(num(p, { label: 'P =', tol: 0.006, alt: [p * 100] })),
          hint: 'Berechne zuerst die Wahrscheinlichkeit für „kein Joker“ und nutze das Gegenereignis.',
          solution: L`$P(\text{kein Joker}) = \frac{${N - J}}{${N}} \cdot \frac{${N - J - 1}}{${N - 1}} \approx ${de(1 - p, 4)}$

$P(\text{mind. ein Joker}) = 1 - ${de(1 - p, 4)} \approx ${de(p, 4)}$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    title: 'Quadratische Funktionen & Gleichungen',
    icon: 'Spline',
    color: 'blue',
    description: 'Parabeln, Scheitelpunkt und die p-q-Formel',
    profiles: ['RS10', 'ERS10'],
    sections: [
      {
        title: 'Normalparabel und Scheitelpunkt',
        md: L`Die **Normalparabel** hat die Gleichung $y = x^2$. Ihr tiefster Punkt ist der **Scheitelpunkt** $S(0 \mid 0)$.

| $x$ | $-3$ | $-2$ | $-1$ | $0$ | $1$ | $2$ | $3$ |
|---|---|---|---|---|---|---|---|
| $y$ | $9$ | $4$ | $1$ | $0$ | $1$ | $4$ | $9$ |

$y = x^2 + e$: Die Parabel ist um $e$ nach **oben/unten** verschoben.`,
      },
      {
        title: 'Scheitelpunktform',
        md: L`$$y = a(x - d)^2 + e \quad\Rightarrow\quad S(d \mid e)$$

- $d$: Verschiebung nach **rechts** (Achtung Vorzeichen: $(x - 3)^2$ → $d = 3$, $(x + 3)^2$ → $d = -3$)
- $e$: Verschiebung nach **oben**
- $a < 0$: Parabel ist nach **unten geöffnet** (Scheitel ist der höchste Punkt)`,
      },
      {
        title: 'Quadratische Gleichungen und p-q-Formel',
        md: L`**Rein quadratisch:** $x^2 = 49 \Rightarrow x_1 = 7,\; x_2 = -7$

**Normalform** $x^2 + px + q = 0$ – dann hilft die **p-q-Formel**:

$$x_{1,2} = -\frac{p}{2} \pm \sqrt{\left(\frac{p}{2}\right)^2 - q}$$

> $x^2 + 14x + 24 = 0$: $p = 14$, $q = 24$
> $x_{1,2} = -7 \pm \sqrt{49 - 24} = -7 \pm 5$ → $x_1 = -2$, $x_2 = -12$

Der Ausdruck unter der Wurzel (Diskriminante) entscheidet: $> 0$ zwei Lösungen, $= 0$ eine Lösung, $< 0$ keine Lösung.`,
      },
      {
        title: 'Anwendungen',
        md: L`Flugbahnen (Ball, Wasserstrahl) sind oft Parabeln: $y = -0{,}02(x - 6)^2 + 2{,}5$

- **Maximale Höhe:** Scheitelpunkt → $2{,}5$ m nach $6$ m
- **Abwurfhöhe:** $x = 0$ einsetzen
- **Landepunkt:** Nullstelle ($y = 0$) berechnen`,
      },
    ],
    rungs: [
      (r) => {
        const e = r.int(-5, 5), x = r.pick([-4, -3, -2, 2, 3, 4]);
        return {
          title: 'Funktionswerte einer Parabel',
          section: 0,
          prompt: L`Gegeben ist $y = x^2 ${e >= 0 ? '+ ' + e : '- ' + -e}$. Berechne $y$ für $x = ${x}$.`,
          answer: fields(num(x * x + e, { label: 'y =' })),
          hint: 'Achtung: (−3)² = 9, nicht −9!',
          solution: L`$y = (${x})^2 ${e >= 0 ? '+ ' + e : '- ' + -e} = ${x * x} ${e >= 0 ? '+ ' + e : '- ' + -e} = ${x * x + e}$`,
        };
      },
      (r) => {
        const d = r.int(-5, 5) || 2, e = r.int(-6, 6);
        return {
          title: 'Scheitelpunkt ablesen',
          section: 1,
          prompt: L`Gib den Scheitelpunkt der Parabel an.

$$y = (x ${d >= 0 ? '- ' + d : '+ ' + -d})^2 ${e >= 0 ? '+ ' + e : '- ' + -e}$$`,
          answer: fields(num(d, { label: 'S (x-Wert):' }), num(e, { label: 'S (y-Wert):' })),
          hint: 'Scheitelpunktform y = (x − d)² + e → S(d | e). Achte auf das Vorzeichen in der Klammer.',
          solution: L`$S(${d} \mid ${e})$ – in der Klammer steht $x ${d >= 0 ? '- ' + d : '+ ' + -d}$, also $d = ${d}$.`,
        };
      },
      (r) => {
        const s = r.int(2, 12), k = r.pick([1, 2]);
        return {
          title: 'Rein quadratische Gleichungen',
          section: 2,
          prompt: L`Löse die Gleichung.

$$${k === 1 ? '' : k}x^2 - ${k * s * s} = 0$$`,
          answer: unordered(num(s, { label: 'x₁ =' }), num(-s, { label: 'x₂ =' })),
          hint: 'Bringe die Zahl auf die andere Seite und ziehe die Wurzel. Denke an beide Lösungen!',
          solution: L`$${k === 1 ? '' : k}x^2 = ${k * s * s}$ ${k > 1 ? L`$\Rightarrow x^2 = ${s * s}$` : ''} $\Rightarrow x_1 = ${s},\; x_2 = -${s}$`,
        };
      },
      (r) => {
        let r1, r2;
        do { r1 = r.int(-12, 6); r2 = r.int(-12, 6); } while (r1 === r2);
        const p = -(r1 + r2), q = r1 * r2;
        const sp = p === 0 ? '' : p > 0 ? `+ ${p}x` : `- ${-p}x`;
        const sq = q === 0 ? '' : q > 0 ? `+ ${q}` : `- ${-q}`;
        return {
          title: 'p-q-Formel',
          section: 2,
          prompt: L`Löse die quadratische Gleichung.

$$x^2 ${sp} ${sq} = 0$$`,
          answer: unordered(num(r1, { label: 'x₁ =' }), num(r2, { label: 'x₂ =' })),
          hint: 'x₁,₂ = −p/2 ± √((p/2)² − q)',
          solution: L`$p = ${p}$, $q = ${q}$

$$x_{1,2} = ${de(-p / 2)} \pm \sqrt{${de((p / 2) ** 2)} - (${q})} = ${de(-p / 2)} \pm ${de(Math.abs(r1 - r2) / 2)}$$

$x_1 = ${Math.max(r1, r2)}$, $x_2 = ${Math.min(r1, r2)}$`,
        };
      },
      (r) => {
        const a = r.pick([0.02, 0.05, 0.1]), d = r.int(3, 8), e = r.int(20, 40) / 10;
        const y0 = round(-a * d * d + e);
        const xw = round(d + Math.sqrt(e / a));
        return {
          title: 'Flugbahnen',
          section: 3,
          prompt: L`Die Flugbahn eines Balls wird beschrieben durch $y = -${de(a)}(x - ${d})^2 + ${de(e)}$ ($x$ und $y$ in Metern).

a) Wie hoch ist der Ball beim Abwurf ($x = 0$)?

b) Nach wie vielen Metern landet der Ball auf dem Boden?`,
          answer: fields(num(y0, { label: 'a) Höhe:', unit: 'm', tol: 0.011 }), num(xw, { label: 'b) Weite:', unit: 'm', tol: 0.02 })),
          hint: 'a) x = 0 einsetzen. b) y = 0 setzen und nach x auflösen (positive Lösung).',
          solution: L`a) $y = -${de(a)} \cdot (0 - ${d})^2 + ${de(e)} = ${de(y0)}\text{ m}$

b) $0 = -${de(a)}(x - ${d})^2 + ${de(e)} \Rightarrow (x - ${d})^2 = ${de(e / a)} \Rightarrow x = ${d} + \sqrt{${de(e / a)}} \approx ${de(xw)}\text{ m}$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 13
  {
    title: 'Trigonometrie & Ähnlichkeit',
    icon: 'Compass',
    color: 'pink',
    description: 'Ähnliche Figuren, Strahlensatz, Sinus, Kosinus und Tangens',
    profiles: ['RS10', 'ERS10'],
    sections: [
      {
        title: 'Ähnliche Figuren',
        md: L`Zwei Figuren sind **ähnlich**, wenn alle Winkel gleich sind und alle Seiten mit dem **gleichen Faktor** $k$ vergrößert oder verkleinert wurden.

> Wird Seite $a$ verdoppelt, müssen auch $b$ und $c$ verdoppelt werden.

$$k = \frac{a'}{a} = \frac{b'}{b} = \frac{c'}{c}$$`,
      },
      {
        title: 'Strahlensatz und Peilen',
        md: L`Mit ähnlichen Dreiecken kann man Höhen bestimmen, die man nicht messen kann:

$$\frac{\text{Baumhöhe}}{\text{Schatten Baum}} = \frac{\text{Stabhöhe}}{\text{Schatten Stab}}$$

> Stab 1 m, Schatten 0,8 m; Baumschatten 12 m → Baum $= \frac{1}{0{,}8} \cdot 12 = 15$ m`,
      },
      {
        title: 'Sinus, Kosinus und Tangens',
        md: L`Im **rechtwinkligen** Dreieck, bezogen auf den Winkel $\alpha$:

$$\sin\alpha = \frac{\text{Gegenkathete}}{\text{Hypotenuse}} \qquad \cos\alpha = \frac{\text{Ankathete}}{\text{Hypotenuse}} \qquad \tan\alpha = \frac{\text{Gegenkathete}}{\text{Ankathete}}$$

Merkhilfe: **GAGA HHAG** (Gegenkathete/Hypotenuse, Ankathete/Hypotenuse, Gegenkathete/Ankathete)

**Taschenrechner auf DEG stellen!**`,
      },
      {
        title: 'Winkel berechnen',
        md: L`Um einen Winkel zu berechnen, verwendest du die **Umkehrfunktion** ($\sin^{-1}$, $\cos^{-1}$, $\tan^{-1}$), meist mit der Taste **SHIFT**.

> Gegenkathete 3 cm, Ankathete 4 cm: $\tan\alpha = \frac34 = 0{,}75 \Rightarrow \alpha = \tan^{-1}(0{,}75) \approx 36{,}87°$`,
      },
    ],
    rungs: [
      (r) => {
        const a = r.int(3, 8), b = r.int(4, 10), k = r.pick([2, 3, 1.5, 2.5]);
        return {
          title: 'Ähnliche Dreiecke',
          section: 0,
          prompt: L`Ein Dreieck hat die Seiten $a = ${a}\text{ cm}$ und $b = ${b}\text{ cm}$. Ein dazu ähnliches Dreieck hat die Seite $a' = ${de(a * k)}\text{ cm}$. Wie lang ist $b'$?`,
          answer: fields(num(b * k, { label: "b' =", unit: 'cm' })),
          hint: "Bestimme den Streckfaktor k = a' : a.",
          solution: L`$k = ${de(a * k)} : ${a} = ${de(k)}$, also $b' = ${b} \cdot ${de(k)} = ${de(b * k)}\text{ cm}$`,
        };
      },
      (r) => {
        const stab = r.pick([1, 1.5, 2]), ss = r.int(6, 16) / 10, bs = r.int(8, 25);
        const h = round((stab / ss) * bs);
        return {
          title: 'Höhen bestimmen',
          section: 1,
          prompt: L`Ein $${de(stab)}\text{ m}$ langer Stab wirft einen $${de(ss)}\text{ m}$ langen Schatten. Zur selben Zeit wirft ein Baum einen $${bs}\text{ m}$ langen Schatten. Wie hoch ist der Baum?`,
          answer: fields(num(h, { label: 'Höhe:', unit: 'm', tol: 0.011 })),
          hint: 'Die Verhältnisse Höhe : Schatten sind gleich.',
          solution: L`$$h = \frac{${de(stab)}}{${de(ss)}} \cdot ${bs} \approx ${de(h)}\text{ m}$$`,
        };
      },
      (r) => {
        const c = r.int(5, 15), al = r.int(20, 65);
        const a = round(c * Math.sin(deg(al)));
        return {
          title: 'Seiten mit Sinus berechnen',
          section: 2,
          prompt: L`In einem rechtwinkligen Dreieck ist die Hypotenuse $c = ${c}\text{ cm}$ lang und $\alpha = ${al}°$. Berechne die Gegenkathete $a$ von $\alpha$.

${img(rightTriangle({ a: 'a = ?', b: 'b', c: `c = ${c} cm`, alpha: `α = ${al}°` }), 'Rechtwinkliges Dreieck')}`,
          answer: fields(num(a, { label: 'a =', unit: 'cm', tol: 0.02 })),
          hint: 'sin α = Gegenkathete : Hypotenuse',
          solution: L`$a = c \cdot \sin\alpha = ${c} \cdot \sin(${al}°) \approx ${de(a)}\text{ cm}$`,
        };
      },
      (r) => {
        const a = r.int(2, 9), b = r.int(3, 12);
        const al = round((Math.atan(a / b) * 180) / Math.PI);
        return {
          title: 'Winkel mit Tangens berechnen',
          section: 3,
          prompt: L`In einem rechtwinkligen Dreieck ist die Gegenkathete von $\alpha$ $${a}\text{ cm}$ und die Ankathete $${b}\text{ cm}$ lang. Berechne $\alpha$.`,
          answer: fields(num(al, { label: 'α =', unit: '°', tol: 0.06 })),
          hint: 'tan α = Gegenkathete : Ankathete, dann tan⁻¹ verwenden.',
          solution: L`$\tan\alpha = \frac{${a}}{${b}} \approx ${de(a / b, 4)} \Rightarrow \alpha = \tan^{-1}(${de(a / b, 4)}) \approx ${de(al)}°$`,
        };
      },
      (r) => {
        const h = r.int(40, 150) / 100, al = r.pick([4, 5, 6, 8, 10]);
        const len = round(h / Math.sin(deg(al))), hor = round(h / Math.tan(deg(al)));
        return {
          title: 'Anwendung: Rampe',
          section: 2,
          prompt: L`Eine Rampe soll einen Höhenunterschied von $${de(h)}\text{ m}$ überwinden. Der Steigungswinkel darf höchstens $${al}°$ betragen.

a) Wie lang muss die Rampe (schräge Fläche) mindestens sein?

b) Wie viel Platz braucht sie waagerecht auf dem Boden?`,
          answer: fields(num(len, { label: 'a)', unit: 'm', tol: 0.02 }), num(hor, { label: 'b)', unit: 'm', tol: 0.02 })),
          hint: 'Zeichne eine Skizze. Die Rampe ist die Hypotenuse, die Höhe die Gegenkathete des Winkels.',
          solution: L`a) $\sin(${al}°) = \frac{${de(h)}}{\ell} \Rightarrow \ell = \frac{${de(h)}}{\sin(${al}°)} \approx ${de(len)}\text{ m}$

b) $\tan(${al}°) = \frac{${de(h)}}{x} \Rightarrow x = \frac{${de(h)}}{\tan(${al}°)} \approx ${de(hor)}\text{ m}$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 14
  {
    title: 'Wachstum & Exponentialfunktionen',
    icon: 'Rocket',
    color: 'red',
    description: 'Lineares und exponentielles Wachstum, Wachstumsfaktor',
    profiles: ['ERS10'],
    sections: [
      {
        title: 'Lineares und exponentielles Wachstum',
        md: L`| | lineares Wachstum | exponentielles Wachstum |
|---|---|---|
| pro Schritt | **gleicher Summand** ($+d$) | **gleicher Faktor** ($\cdot q$) |
| Gleichung | $y = d \cdot x + b$ | $y = a \cdot q^x$ |
| Beispiel | Taschengeld +5 € pro Monat | Bakterien verdoppeln sich stündlich |

**Test:** Differenzen gleich → linear. Quotienten gleich → exponentiell.`,
      },
      {
        title: 'Wachstumsfaktor',
        md: L`Zunahme um $p\,\%$: $q = 1 + \frac{p}{100}$ &nbsp;&nbsp;(+5 % → $q = 1{,}05$)

Abnahme um $p\,\%$: $q = 1 - \frac{p}{100}$ &nbsp;&nbsp;(−15 % → $q = 0{,}85$)

$q > 1$: Wachstum, $0 < q < 1$: Zerfall/Abnahme`,
      },
      {
        title: 'Exponentialfunktionen',
        md: L`$$y = a \cdot q^x$$

$a$ = Anfangswert (bei $x = 0$), $q$ = Wachstumsfaktor, $x$ = Anzahl der Zeitschritte.

> Ein Auto (20 000 €) verliert jährlich 15 % an Wert: nach 3 Jahren $20\,000 \cdot 0{,}85^3 \approx 12\,282{,}50$ €

**Verdopplungszeit:** Probiere aus, für welches $x$ gilt: $q^x \ge 2$ (oder mit dem Logarithmus: $x = \frac{\log 2}{\log q}$).`,
      },
    ],
    rungs: [
      (r) => {
        const p1 = r.pick([3, 5, 8, 12, 20]), p2 = r.pick([4, 10, 15, 25]);
        return {
          title: 'Wachstumsfaktor bestimmen',
          section: 1,
          prompt: L`Gib jeweils den Wachstumsfaktor $q$ an.

a) Eine Größe **nimmt** jährlich um $${p1}\,\%$ **zu**.

b) Eine Größe **nimmt** jährlich um $${p2}\,\%$ **ab**.`,
          answer: fields(num(1 + p1 / 100, { label: 'a) q =', tol: 0.0001 }), num(1 - p2 / 100, { label: 'b) q =', tol: 0.0001 })),
          hint: 'Zunahme: 1 + p/100, Abnahme: 1 − p/100',
          solution: L`a) $q = 1 + ${de(p1 / 100)} = ${de(1 + p1 / 100)}$

b) $q = 1 - ${de(p2 / 100)} = ${de(1 - p2 / 100)}$`,
        };
      },
      (r) => {
        const type = r.int(0, 1);
        const a = r.int(2, 5) * 10;
        const vals = type === 0 ? [0, 1, 2, 3].map((x) => a + 15 * x) : [0, 1, 2, 3].map((x) => a * 2 ** x);
        return {
          title: 'Wachstum erkennen',
          section: 0,
          prompt: L`Welche Art von Wachstum liegt vor?

| Jahr | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Bestand | ${vals.join(' | ')} |`,
          answer: choice(['lineares Wachstum', 'exponentielles Wachstum'], type),
          hint: 'Berechne die Differenzen und die Quotienten aufeinanderfolgender Werte.',
          solution: type === 0 ? L`Die Differenzen sind immer $15$ → **lineares Wachstum**.` : L`Die Quotienten sind immer $2$ → **exponentielles Wachstum** (Verdopplung).`,
        };
      },
      (r) => {
        const b0 = r.int(2, 9) * 100, n = r.int(3, 8);
        return {
          title: 'Verdopplung',
          section: 2,
          prompt: L`Eine Bakterienkultur besteht aus $${b0}$ Bakterien. Die Anzahl verdoppelt sich jede Stunde. Wie viele Bakterien sind es nach $${n}$ Stunden?`,
          answer: fields(num(b0 * 2 ** n, { label: 'Anzahl:' })),
          hint: 'y = a · 2ˣ',
          solution: L`$${b0} \cdot 2^{${n}} = ${b0} \cdot ${2 ** n} = ${de(b0 * 2 ** n, 0)}$`,
        };
      },
      (r) => {
        const w0 = r.int(15, 40) * 1000, p = r.pick([10, 12, 15, 20]), n = r.int(2, 6);
        const w = round(w0 * (1 - p / 100) ** n);
        return {
          title: 'Wertverlust',
          section: 2,
          prompt: L`Ein Auto kostet neu $${de(w0, 0)}$ €. Es verliert jedes Jahr $${p}\,\%$ seines Wertes. Wie viel ist es nach $${n}$ Jahren noch wert?`,
          answer: fields(num(w, { label: 'Wert:', unit: '€', tol: 0.02 })),
          hint: 'Wachstumsfaktor q = 1 − p/100, dann W = W₀ · qⁿ.',
          solution: L`$W = ${de(w0, 0)} \cdot ${de(1 - p / 100)}^{${n}} \approx ${de(w)}\text{ €}$`,
        };
      },
      (r) => {
        const p = r.pick([2, 3, 4, 5, 6, 8]);
        const n = Math.ceil(Math.log(2) / Math.log(1 + p / 100));
        return {
          title: 'Verdopplungszeit',
          section: 2,
          prompt: L`Ein Kapital wird jährlich mit $${p}\,\%$ verzinst (Zinseszins). Nach wie vielen **ganzen Jahren** hat es sich zum ersten Mal mindestens verdoppelt?`,
          answer: fields(num(n, { label: 'Jahre:' })),
          hint: 'Suche das kleinste n mit ' + de(1 + p / 100) + 'ⁿ ≥ 2. Probiere mit dem Taschenrechner aus.',
          solution: L`$${de(1 + p / 100)}^{${n - 1}} \approx ${de((1 + p / 100) ** (n - 1), 3)} < 2$, aber $${de(1 + p / 100)}^{${n}} \approx ${de((1 + p / 100) ** n, 3)} \ge 2$ → nach **${n} Jahren**.`,
        };
      },
    ],
  },
];

