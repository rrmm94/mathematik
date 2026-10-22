// Themen 1–7: Skripte und Aufgaben-Generatoren.
// Jede "Sprosse" (rung) 1..5 steht für eine Schwierigkeit. Die Zuordnung
// zu Profilen und Niveaustufen erfolgt in seed/index.js.
import { de, dt, round, num, fields, choice, free, relTol } from './helpers.js';
import { angles, triangleGH, composite, coordLine, img } from './figures.js';

const L = String.raw;
const ALL = ['HS10', 'RS10', 'ERS10'];

export const topicsA = [
  // ------------------------------------------------------------------ 1
  {
    title: 'Zahlen & Rechnen',
    icon: 'Calculator',
    color: 'indigo',
    description: 'Grundrechenarten, negative Zahlen, Brüche, Runden und Zehnerpotenzen',
    profiles: ALL,
    sections: [
      {
        title: 'Rechenregeln: Punkt vor Strich & Klammern',
        md: L`Beim Rechnen gilt eine feste Reihenfolge:

1. **Klammern** zuerst
2. **Potenzen**
3. **Punktrechnung** ($\cdot$ und $:$) vor **Strichrechnung** ($+$ und $-$)
4. Sonst von **links nach rechts**

> **Beispiel:** $1{,}5 + 2 \cdot 3 = 1{,}5 + 6 = 7{,}5$
>
> Falsch wäre: $(1{,}5 + 2) \cdot 3 = 10{,}5$ – das ist eine andere Aufgabe!

**Tipp:** Unterstreiche zuerst alle Mal- und Geteilt-Rechnungen. Die rechnest du zuerst aus.`,
      },
      {
        title: 'Negative Zahlen',
        md: L`Negative Zahlen liegen auf dem Zahlenstrahl links von der Null. Denk an einen **Kontostand** oder ein **Thermometer**.

| Rechnung | Vorstellung | Ergebnis |
|---|---|---|
| $-30 + 60$ | 30 € Schulden, 60 € eingezahlt | $30$ |
| $-2 - 5$ | 2 °C unter null, 5 °C kälter | $-7$ |
| $4 - (-3)$ | Minus mal Minus wird Plus | $7$ |

**Vorzeichenregeln beim Multiplizieren und Dividieren:**
- gleiche Vorzeichen → Ergebnis **positiv**: $(-3)\cdot(-4)=12$
- verschiedene Vorzeichen → Ergebnis **negativ**: $(-3)\cdot 4=-12$`,
      },
      {
        title: 'Brüche und Dezimalzahlen',
        md: L`**Brüche addieren:** Zuerst auf einen **gemeinsamen Nenner** bringen (erweitern), dann die Zähler addieren.

$$\frac{1}{2} + \frac{1}{4} = \frac{2}{4} + \frac{1}{4} = \frac{3}{4}$$

**Umwandeln:** Zähler durch Nenner teilen: $\frac{3}{4} = 3 : 4 = 0{,}75$

Wichtige Brüche, die du auswendig kennen solltest:

| Bruch | $\frac{1}{2}$ | $\frac{1}{4}$ | $\frac{3}{4}$ | $\frac{1}{5}$ | $\frac{1}{10}$ | $\frac{1}{3}$ |
|---|---|---|---|---|---|---|
| Dezimal | $0{,}5$ | $0{,}25$ | $0{,}75$ | $0{,}2$ | $0{,}1$ | $0{,}\overline{3}$ |
| Prozent | 50 % | 25 % | 75 % | 20 % | 10 % | ca. 33,3 % |`,
      },
      {
        title: 'Runden und große Zahlen',
        md: L`**Runden:** Schau auf die Ziffer **rechts** neben der Rundungsstelle.
- $0, 1, 2, 3, 4$ → **abrunden**
- $5, 6, 7, 8, 9$ → **aufrunden**

> **Beispiel:** $18\,465\,232$ auf ganze Millionen: Die Ziffer nach der 8 ist eine **4** → abrunden → $18\,000\,000$

**Große Zahlen:** 1 Tausend $=10^3$, 1 Million $=10^6$, 1 Milliarde $=10^9$.`,
      },
      {
        title: 'Potenzen und Zehnerpotenzen',
        md: L`Eine Potenz ist eine Kurzschreibweise für wiederholtes Multiplizieren: $3^4 = 3\cdot3\cdot3\cdot3 = 81$.

**Wissenschaftliche Schreibweise:** Sehr große oder kleine Zahlen schreibt man als $a \cdot 10^n$ mit $1 \le a < 10$.

- $45\,000 = 4{,}5 \cdot 10^4$ (Komma um 4 Stellen nach **links** verschoben)
- $0{,}00032 = 3{,}2 \cdot 10^{-4}$ (Komma um 4 Stellen nach **rechts** verschoben → negativer Exponent)`,
      },
    ],
    rungs: [
      (r) => {
        const a = r.int(1, 9) + 0.5, b = r.int(2, 6), c = r.int(2, 6);
        return {
          title: 'Punkt vor Strich',
          section: 0,
          prompt: L`Berechne.

$$${de(a)} + ${b} \cdot ${c} = \;?$$`,
          answer: fields(num(a + b * c, { label: 'Ergebnis:' })),
          hint: 'Punktrechnung (·) wird vor Strichrechnung (+) ausgeführt.',
          solution: L`Zuerst die Punktrechnung: $${b}\cdot${c} = ${b * c}$.
Dann: $${de(a)} + ${b * c} = ${de(a + b * c)}$`,
        };
      },
      (r) => {
        const alt = -10 * r.int(2, 9), ein = 10 * r.int(4, 14);
        const a = r.int(2, 9), b = r.int(3, 12);
        return {
          title: 'Negative Zahlen',
          section: 1,
          prompt: L`a) Der alte Kontostand beträgt $${alt}$ €. Es werden $${ein}$ € eingezahlt. Wie hoch ist der neue Kontostand?

b) Ergänze die Lücke: $\;\square - ${a} = -${b}$`,
          answer: fields(num(alt + ein, { label: 'a) Kontostand:', unit: '€' }), num(a - b, { label: 'b) Lücke:' })),
          hint: 'Stell dir den Zahlenstrahl vor. Bei b) kannst du rückwärts rechnen: −' + b + ' + ' + a + '.',
          solution: L`a) $${alt} + ${ein} = ${alt + ein}$ €

b) Rückwärts rechnen: $-${b} + ${a} = ${a - b}$. Probe: $${a - b} - ${a} = -${b}$ ✓`,
        };
      },
      (r) => {
        const [[p, q], [s, t]] = r.pick([[[1, 2], [1, 4]], [[1, 3], [1, 6]], [[2, 5], [1, 10]], [[1, 2], [1, 3]], [[3, 4], [1, 8]], [[2, 3], [1, 4]]]);
        const val = p / q + s / t;
        const n = (q * t) / gcd(q, t);
        const z = (p * n) / q + (s * n) / t;
        const g = gcd(z, n);
        return {
          title: 'Brüche addieren',
          section: 2,
          prompt: L`Berechne und gib das Ergebnis als Bruch (z. B. 3/4) oder als Dezimalzahl an.

$$\frac{${p}}{${q}} + \frac{${s}}{${t}} = \;?$$`,
          answer: fields(num(val, { label: 'Ergebnis:', tol: 0.006 })),
          hint: 'Bringe beide Brüche auf den gemeinsamen Nenner ' + n + '.',
          solution: L`Gemeinsamer Nenner: $${n}$.

$$\frac{${p}}{${q}} + \frac{${s}}{${t}} = \frac{${(p * n) / q}}{${n}} + \frac{${(s * n) / t}}{${n}} = \frac{${z}}{${n}}${g > 1 ? L` = \frac{${z / g}}{${n / g}}` : ''} \approx ${de(val, 3)}$$`,
        };
      },
      (r) => {
        const n = r.int(12, 98) * 1e6 + r.int(0, 999999);
        const rounded = Math.round(n / 1e6) * 1e6;
        const a = r.int(2, 9), b = r.int(3, 9), c = r.int(4, 30);
        return {
          title: 'Runden und Vorzeichen',
          section: 3,
          prompt: L`a) Runde die Zahl $${de(n, 0)}$ auf ganze Millionen.

b) Berechne: $(-${a}) \cdot ${b} - ${c}$`,
          answer: fields(num(rounded, { label: 'a)', alt: [rounded / 1e6] }), num(-a * b - c, { label: 'b)' })),
          hint: 'a) Schau auf die Hunderttausender-Ziffer. b) Minus mal Plus ergibt Minus.',
          solution: L`a) Die Hunderttausender-Ziffer ist $${String(n).slice(-6, -5)}$ → ${Number(String(n).slice(-6, -5)) >= 5 ? 'aufrunden' : 'abrunden'}: $${de(rounded, 0)}$

b) $(-${a}) \cdot ${b} = -${a * b}$, dann $-${a * b} - ${c} = ${-a * b - c}$`,
        };
      },
      (r) => {
        const small = r() < 0.5;
        const m = r.int(11, 98) / 10;
        const n = small ? -r.int(3, 6) : r.int(4, 8);
        const value = m * 10 ** n;
        const shown = small ? value.toFixed(-n + 1).replace('.', ',') : de(value, 0);
        return {
          title: 'Wissenschaftliche Schreibweise',
          section: 4,
          prompt: L`Schreibe die Zahl in wissenschaftlicher Schreibweise $a \cdot 10^n$ (mit $1 \le a < 10$).

$$${shown}$$`,
          answer: fields(num(m, { label: 'a =', tol: 0.001 }), num(n, { label: 'n =' })),
          hint: 'Verschiebe das Komma, bis genau eine Ziffer (ungleich 0) vor dem Komma steht. Zähle die Stellen.',
          solution: L`Komma um $${Math.abs(n)}$ Stellen nach ${small ? 'rechts' : 'links'} verschieben:

$$${shown} = ${de(m, 1)} \cdot 10^{${n}}$$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    title: 'Größen & Einheiten',
    icon: 'Ruler',
    color: 'sky',
    description: 'Längen, Massen, Geld, Zeit, Flächen und Volumen umrechnen',
    profiles: ALL,
    sections: [
      {
        title: 'Längen, Massen und Geld',
        md: L`| Größe | Umrechnung |
|---|---|
| Länge | $1\text{ km} = 1000\text{ m}$, $1\text{ m} = 100\text{ cm}$, $1\text{ cm} = 10\text{ mm}$ |
| Masse | $1\text{ t} = 1000\text{ kg}$, $1\text{ kg} = 1000\text{ g}$ |
| Geld | $1\text{ €} = 100\text{ ct}$ |

**Merke:** Von der größeren zur kleineren Einheit → **multiplizieren** (Zahl wird größer). Von der kleineren zur größeren → **dividieren**.

> $1{,}2\text{ kg} = 1{,}2 \cdot 1000\text{ g} = 1200\text{ g}$`,
      },
      {
        title: 'Zeit',
        md: L`$1\text{ h} = 60\text{ min}$, $1\text{ min} = 60\text{ s}$, $1\text{ Tag} = 24\text{ h}$

**Achtung:** Zeit ist **nicht** dezimal! $1{,}5\text{ h} = 1\text{ h}\;30\text{ min}$ (nicht 50 min).

| Bruchteil | $\frac14$ h | $\frac13$ h | $\frac12$ h | $\frac34$ h |
|---|---|---|---|---|
| Minuten | 15 | 20 | 30 | 45 |

**Zeitspannen** berechnest du am besten in Schritten: $08{:}10 \xrightarrow{+50\text{ min}} 09{:}00 \xrightarrow{+4\text{ h}} 13{:}00 \xrightarrow{+15\text{ min}} 13{:}15$`,
      },
      {
        title: 'Flächeneinheiten',
        md: L`Bei Flächen ist die Umrechnungszahl **100**:

$$1\text{ m}^2 = 100\text{ dm}^2 = 10\,000\text{ cm}^2$$

$1\text{ ha} = 10\,000\text{ m}^2$, $1\text{ km}^2 = 100\text{ ha}$

> Ein Quadrat mit 1 m Seitenlänge hat 100 cm · 100 cm = 10 000 cm².`,
      },
      {
        title: 'Volumen und Hohlmaße',
        md: L`Bei Volumen ist die Umrechnungszahl **1000**:

$$1\text{ m}^3 = 1000\text{ dm}^3, \quad 1\text{ dm}^3 = 1000\text{ cm}^3$$

**Hohlmaße:** $1\text{ dm}^3 = 1\text{ ℓ}$ und $1\text{ cm}^3 = 1\text{ mℓ}$

**Geschwindigkeit:** $\text{km/h} \xrightarrow{:\,3{,}6} \text{m/s}$, z. B. $72\text{ km/h} = 20\text{ m/s}$`,
      },
    ],
    rungs: [
      (r) => {
        const kg = r.int(11, 49) / 10, ct = r.int(101, 399);
        return {
          title: 'Masse und Geld',
          section: 0,
          prompt: L`Wandle in die angegebene Einheit um.

a) $${de(kg)}\text{ kg} = \square\text{ g}$

b) $${ct}\text{ ct} = \square\text{ €}$`,
          answer: fields(num(kg * 1000, { label: 'a)', unit: 'g' }), num(ct / 100, { label: 'b)', unit: '€', tol: 0.001 })),
          hint: '1 kg = 1000 g und 1 € = 100 ct.',
          solution: L`a) $${de(kg)} \cdot 1000 = ${de(kg * 1000, 0)}\text{ g}$

b) $${ct} : 100 = ${de(ct / 100)}\text{ €}$`,
        };
      },
      (r) => {
        const cm = r.int(11, 95) / 10;
        const [fz, fn] = r.pick([[1, 4], [1, 2], [3, 4], [1, 5], [2, 5]]);
        return {
          title: 'Längen und Hohlmaße',
          section: 3,
          prompt: L`Gib die Größen in den angegebenen Einheiten an.

a) $${de(cm)}\text{ cm} = \square\text{ mm}$

b) $\frac{${fz}}{${fn}}\text{ ℓ} = \square\text{ mℓ}$`,
          answer: fields(num(cm * 10, { label: 'a)', unit: 'mm' }), num((fz / fn) * 1000, { label: 'b)', unit: 'mℓ' })),
          hint: '1 cm = 10 mm, 1 ℓ = 1000 mℓ.',
          solution: L`a) $${de(cm)} \cdot 10 = ${de(cm * 10)}\text{ mm}$

b) $\frac{${fz}}{${fn}} \cdot 1000\text{ mℓ} = ${(fz / fn) * 1000}\text{ mℓ}$`,
        };
      },
      (r) => {
        const h1 = r.int(7, 9), m1 = 5 * r.int(0, 11), dur = 5 * r.int(50, 80);
        const endMin = h1 * 60 + m1 + dur;
        const pad = (n) => String(n).padStart(2, '0');
        const [fz, fn, fm] = r.pick([[1, 3, 20], [1, 4, 15], [3, 4, 45], [2, 3, 40]]);
        const h = r.int(1, 3);
        return {
          title: 'Zeitspannen',
          section: 1,
          prompt: L`a) Der Unterricht beginnt um **${pad(h1)}:${pad(m1)} Uhr** und endet um **${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)} Uhr**. Wie viele Minuten dauert der Unterricht?

b) $${h}\tfrac{${fz}}{${fn}}\text{ h} = \square\text{ min}$`,
          answer: fields(num(dur, { label: 'a)', unit: 'min' }), num(h * 60 + fm, { label: 'b)', unit: 'min' })),
          hint: 'Rechne in Schritten bis zur vollen Stunde. Bei b): 1 h = 60 min.',
          solution: L`a) Dauer: $${Math.floor(dur / 60)}\text{ h}\;${dur % 60}\text{ min} = ${dur}\text{ min}$

b) $${h}\cdot 60 + \frac{${fz}}{${fn}}\cdot 60 = ${h * 60} + ${fm} = ${h * 60 + fm}\text{ min}$`,
        };
      },
      (r) => {
        const m2 = r.int(11, 89) / 10, dm2 = 10 * r.int(3, 95);
        return {
          title: 'Flächeneinheiten',
          section: 2,
          prompt: L`Wandle um.

a) $${de(m2)}\text{ m}^2 = \square\text{ cm}^2$

b) $${dm2}\text{ dm}^2 = \square\text{ m}^2$`,
          answer: fields(num(m2 * 10000, { label: 'a)', unit: 'cm²' }), num(dm2 / 100, { label: 'b)', unit: 'm²', tol: 0.001 })),
          hint: 'Bei Flächeneinheiten ist die Umrechnungszahl 100 (von m² zu cm² also 100 · 100).',
          solution: L`a) $${de(m2)} \cdot 10\,000 = ${de(m2 * 10000, 0)}\text{ cm}^2$

b) $${dm2} : 100 = ${de(dm2 / 100)}\text{ m}^2$`,
        };
      },
      (r) => {
        const dm3 = r.int(12, 95) / 10, kmh = 18 * r.int(1, 7);
        return {
          title: 'Volumen und Geschwindigkeit',
          section: 3,
          prompt: L`a) Ein Aquarium hat ein Volumen von $${de(dm3)}\text{ dm}^3$. Wie viele $\text{cm}^3$ sind das?

b) Ein Auto fährt $${kmh}\text{ km/h}$. Wie viele Meter legt es pro Sekunde zurück?`,
          answer: fields(num(dm3 * 1000, { label: 'a)', unit: 'cm³' }), num(kmh / 3.6, { label: 'b)', unit: 'm/s' })),
          hint: 'Volumen: Umrechnungszahl 1000. Geschwindigkeit: km/h durch 3,6 teilen.',
          solution: L`a) $${de(dm3)} \cdot 1000 = ${de(dm3 * 1000, 0)}\text{ cm}^3$ $(= ${de(dm3)}\text{ ℓ})$

b) $${kmh}\text{ km/h} = \frac{${kmh}\,000\text{ m}}{3600\text{ s}} = ${kmh} : 3{,}6 = ${de(kmh / 3.6)}\text{ m/s}$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    title: 'Prozent & Zinsen',
    icon: 'Percent',
    color: 'emerald',
    description: 'Prozentwert, Grundwert, Prozentsatz, Rabatte und Zinsen',
    profiles: ALL,
    sections: [
      {
        title: 'Grundbegriffe: G, W und p %',
        md: L`| Begriff | Bedeutung | Beispiel |
|---|---|---|
| **Grundwert** $G$ | das Ganze (100 %) | 80 Schüler |
| **Prozentwert** $W$ | der Anteil | 16 Schüler |
| **Prozentsatz** $p\,\%$ | Anteil in Prozent | 20 % |

$$1\,\% = \frac{1}{100} = 0{,}01$$

**Kopfrechnen:** 10 % = durch 10 teilen, 50 % = halbieren, 25 % = durch 4 teilen, 20 % = durch 5 teilen.`,
      },
      {
        title: 'Prozentwert, Grundwert und Prozentsatz berechnen',
        md: L`$$W = G \cdot \frac{p}{100} \qquad G = \frac{W \cdot 100}{p} \qquad p = \frac{W}{G} \cdot 100$$

**Oder mit dem Dreisatz:**

| | Prozent | Wert |
|---|---|---|
| | 100 % | 708 cm² |
| :100 | 1 % | 7,08 cm² |
| ·8 | 8 % | **56,64 cm²** |

**Tipp:** Frage dich immer zuerst: *Was ist das Ganze (100 %)?*`,
      },
      {
        title: 'Vermehrter und verminderter Grundwert',
        md: L`**Rabatt (Preis sinkt um p %):** neuer Preis $= G \cdot (1 - \frac{p}{100})$

> 20 % Rabatt auf 50 €: $50 \cdot 0{,}8 = 40$ €

**Aufschlag (Preis steigt um p %):** neuer Preis $= G \cdot (1 + \frac{p}{100})$

> 19 % Mehrwertsteuer auf 100 €: $100 \cdot 1{,}19 = 119$ €`,
      },
      {
        title: 'Zinsen',
        md: L`Zinsrechnung ist Prozentrechnung mit neuen Namen: Kapital $K$ (= Grundwert), Zinsen $Z$ (= Prozentwert), Zinssatz $p\,\%$.

$$Z = K \cdot \frac{p}{100} \quad\text{(Jahreszinsen)}$$

**Für Monate:** $Z = K \cdot \frac{p}{100} \cdot \frac{m}{12}$ &nbsp;&nbsp; **Für Tage:** $Z = K \cdot \frac{p}{100} \cdot \frac{t}{360}$`,
      },
      {
        title: 'Zinseszins',
        md: L`Werden die Zinsen mitverzinst, wächst das Kapital jedes Jahr um den gleichen **Faktor** $q = 1 + \frac{p}{100}$:

$$K_n = K_0 \cdot \left(1 + \frac{p}{100}\right)^n$$

> 2000 € zu 3 % für 5 Jahre: $K_5 = 2000 \cdot 1{,}03^5 \approx 2318{,}55$ €`,
      },
    ],
    rungs: [
      (r) => {
        const p = r.pick([10, 20, 25, 50]), G = 20 * r.int(2, 12);
        return {
          title: 'Prozente im Kopf',
          section: 0,
          prompt: L`Von $${G}$ Schülerinnen und Schülern haben $${p}\,\%$ eine AG „Kochen“ gewählt. Wie viele Schülerinnen und Schüler sind das?`,
          answer: fields(num((G * p) / 100, { label: 'Anzahl:' })),
          hint: `${p} % sind ${p === 50 ? 'die Hälfte' : p === 25 ? 'ein Viertel' : p === 20 ? 'ein Fünftel' : 'ein Zehntel'}.`,
          solution: L`$${p}\,\% = \frac{${p}}{100}$, also $${G} \cdot \frac{${p}}{100} = ${(G * p) / 100}$`,
        };
      },
      (r) => {
        const G = r.int(300, 900), p = r.int(3, 19);
        return {
          title: 'Prozentwert berechnen',
          section: 1,
          prompt: L`Für eine Saftverpackung werden $${G}\text{ cm}^2$ Pappe benötigt. Für die Klebeflächen kommen $${p}\,\%$ dazu. Wie viel $\text{cm}^2$ Pappe sind das für die Klebeflächen?`,
          answer: fields(num((G * p) / 100, { label: 'W =', unit: 'cm²' })),
          hint: 'Rechne zuerst 1 %, dann ' + p + ' %.',
          solution: L`$$W = ${G} \cdot \frac{${p}}{100} = ${de((G * p) / 100)}\text{ cm}^2$$`,
        };
      },
      (r) => {
        const price = r.int(20, 150) - 0.1, p = r.pick([10, 15, 20, 25, 30]);
        const res = round(price * (1 - p / 100));
        return {
          title: 'Rabatt',
          section: 2,
          prompt: L`Ein Paar Sneaker kostet $${de(price)}$ €. Im Sale gibt es $${p}\,\%$ Rabatt. Wie viel kosten die Sneaker jetzt?`,
          answer: fields(num(res, { label: 'Neuer Preis:', unit: '€' })),
          hint: 'Nach dem Rabatt zahlst du noch ' + (100 - p) + ' % des Preises.',
          solution: L`$$${de(price)} \cdot ${de(1 - p / 100)} = ${de(res)}\text{ €}$$
(oder: Rabatt $= ${de((price * p) / 100)}$ €, dann $${de(price)} - ${de((price * p) / 100)}$)`,
        };
      },
      (r) => {
        const p = r.pick([15, 30, 35, 40, 45, 60]), G = 10 * r.int(8, 40);
        const W = (G * p) / 100;
        const K = 100 * r.int(12, 60), zp = r.pick([1.5, 2, 2.5, 3]), m = r.pick([3, 4, 6, 8, 9]);
        const Z = round((K * zp) / 100 * (m / 12));
        return {
          title: 'Grundwert und Zinsen',
          section: 1,
          prompt: L`a) $${p}\,\%$ der Klasse sind $${dt(W)}$ € für die Klassenfahrt. Wie hoch ist der gesamte Betrag (100 %)?

b) Frau Kaya legt $${de(K, 0)}$ € zu einem Zinssatz von $${de(zp)}\,\%$ für $${m}$ Monate an. Wie viel Zinsen erhält sie?`,
          answer: fields(num(G, { label: 'a) G =', unit: '€' }), num(Z, { label: 'b) Z =', unit: '€' })),
          hint: 'a) W : p · 100. b) Jahreszinsen berechnen und dann mit Monate/12 multiplizieren.',
          solution: L`a) $G = \frac{${dt(W)} \cdot 100}{${p}} = ${G}$ €

b) $Z = ${de(K, 0)} \cdot \frac{${de(zp)}}{100} \cdot \frac{${m}}{12} = ${de(Z)}$ €`,
        };
      },
      (r) => {
        const K = 500 * r.int(2, 10), p = r.pick([1.5, 2, 2.5, 3, 3.5]), n = r.int(3, 8);
        const Kn = round(K * (1 + p / 100) ** n);
        return {
          title: 'Zinseszins',
          section: 4,
          prompt: L`Lena legt $${de(K, 0)}$ € für $${n}$ Jahre zu einem festen Zinssatz von $${de(p)}\,\%$ an. Die Zinsen werden jedes Jahr mitverzinst. Über welchen Betrag kann sie nach $${n}$ Jahren verfügen?`,
          answer: fields(num(Kn, { label: 'K =', unit: '€', tol: 0.02 })),
          hint: 'Wachstumsfaktor q = 1 + p/100. Rechne Kₙ = K₀ · qⁿ.',
          solution: L`$$K_{${n}} = ${de(K, 0)} \cdot ${de(1 + p / 100, 3)}^{${n}} \approx ${de(Kn)}\text{ €}$$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    title: 'Zuordnungen & Dreisatz',
    icon: 'ArrowLeftRight',
    color: 'amber',
    description: 'Proportional, antiproportional und der Dreisatz',
    profiles: ALL,
    sections: [
      {
        title: 'Proportionale Zuordnungen',
        md: L`**Je mehr, desto mehr** – und zwar im gleichen Verhältnis.

- Verdoppelt sich $x$, verdoppelt sich auch $y$.
- Alle Paare sind **quotientengleich**: $\frac{y}{x} = k$ (immer gleich)
- Der Graph ist eine **Gerade durch den Ursprung**.

| $x$ | 2 | 6 | 10 |
|---|---|---|---|
| $y$ | 5 | 15 | 25 |

$\frac{5}{2} = \frac{15}{6} = \frac{25}{10} = 2{,}5$ → proportional ✓`,
      },
      {
        title: 'Antiproportionale Zuordnungen',
        md: L`**Je mehr, desto weniger** – im umgekehrten Verhältnis.

- Verdoppelt sich $x$, **halbiert** sich $y$.
- Alle Paare sind **produktgleich**: $x \cdot y = k$ (immer gleich)

> Eine Kiste Futter reicht für 8 Kaninchen 10 Tage. Produkt: $8 \cdot 10 = 80$.
> Für 5 Kaninchen: $80 : 5 = 16$ Tage.

**Achtung:** Nicht jede „Je mehr, desto weniger“-Zuordnung ist antiproportional! Prüfe immer das Produkt.`,
      },
      {
        title: 'Der Dreisatz',
        md: L`Der Dreisatz funktioniert in drei Schritten:

1. **Gegebenes** aufschreiben
2. **Auf eine Einheit** zurückrechnen
3. **Auf das Gesuchte** hochrechnen

| | Kaninchen | Futter |
|---|---|---|
| | 7 | 2,1 kg |
| :7 | 1 | 0,3 kg |
| ·10 | 10 | **3 kg** |

Bei **antiproportionalen** Zuordnungen rechnest du auf der rechten Seite **umgekehrt** (· statt : und umgekehrt).`,
      },
    ],
    rungs: [
      (r) => {
        const type = r.int(0, 2);
        const xs = [2, 4, 8];
        let ys;
        if (type === 0) { const k = r.int(2, 6); ys = xs.map((x) => x * k); }
        else if (type === 1) { const k = r.pick([24, 40, 48, 64]); ys = xs.map((x) => k / x); }
        else { const k = r.int(1, 5); ys = xs.map((x) => x + k); }
        return {
          title: 'Zuordnungen erkennen',
          section: 0,
          prompt: L`Entscheide, welche Art von Zuordnung vorliegt.

| $x$ | ${xs.join(' | ')} |
|---|---|---|---|
| $y$ | ${ys.join(' | ')} |`,
          answer: choice(['proportional', 'antiproportional', 'keines von beidem'], type),
          hint: 'Prüfe, ob alle Quotienten y : x oder alle Produkte x · y gleich sind.',
          solution: type === 0
            ? L`Quotienten: ${xs.map((x, i) => `$${ys[i]}:${x} = ${ys[i] / x}$`).join(', ')} – alle gleich → **proportional**.`
            : type === 1
              ? L`Produkte: ${xs.map((x, i) => `$${x}\cdot${ys[i]} = ${x * ys[i]}$`).join(', ')} – alle gleich → **antiproportional**.`
              : L`Quotienten (${xs.map((x, i) => de(ys[i] / x)).join('; ')}) und Produkte (${xs.map((x, i) => x * ys[i]).join('; ')}) sind nicht gleich → **keines von beidem**.`,
        };
      },
      (r) => {
        const n1 = r.int(3, 8), per = r.int(2, 5) / 10, n2 = n1 + r.int(2, 6);
        return {
          title: 'Dreisatz (proportional)',
          section: 2,
          prompt: L`Ina hat $${n1}$ Kaninchen. Diese brauchen pro Tag $${de(n1 * per)}\text{ kg}$ Futter. Sie bekommt weitere Kaninchen dazu und hat jetzt $${n2}$ Kaninchen. Wie viel Futter braucht sie nun täglich?`,
          answer: fields(num(n2 * per, { label: 'Futter:', unit: 'kg' })),
          hint: 'Berechne zuerst, wie viel Futter 1 Kaninchen braucht.',
          solution: L`1 Kaninchen: $${de(n1 * per)} : ${n1} = ${de(per)}\text{ kg}$

${n2} Kaninchen: $${de(per)} \cdot ${n2} = ${de(n2 * per)}\text{ kg}$`,
        };
      },
      (r) => {
        const [n1, d, n2] = r.pick([[8, 10, 5], [6, 10, 4], [4, 15, 6], [6, 8, 4], [9, 4, 6], [10, 6, 12]]);
        return {
          title: 'Dreisatz (antiproportional)',
          section: 1,
          prompt: L`Eine Kiste Futter reicht für $${n1}$ Kaninchen $${d}$ Tage. Wie lange reicht die Kiste für $${n2}$ Kaninchen?`,
          answer: fields(num((n1 * d) / n2, { label: 'Dauer:', unit: 'Tage' })),
          hint: 'Weniger Kaninchen → das Futter reicht länger. Rechne über 1 Kaninchen.',
          solution: L`1 Kaninchen: $${n1} \cdot ${d} = ${n1 * d}$ Tage

${n2} Kaninchen: $${n1 * d} : ${n2} = ${de((n1 * d) / n2)}$ Tage`,
        };
      },
      (r) => {
        const k = r.pick([60, 72, 120, 90]);
        const xs = [2, 3, 4], target = r.pick([5, 6, 8].filter((t) => k % t === 0));
        return {
          title: 'Tabellen ergänzen',
          section: 1,
          prompt: L`Die Zuordnung ist antiproportional.

| $x$ | ${xs.join(' | ')} | ${target} |
|---|---|---|---|---|
| $y$ | ${xs.map((x) => k / x).join(' | ')} | $\square$ |

a) Gib das Produkt $x \cdot y$ an.

b) Ergänze den fehlenden Wert.`,
          answer: fields(num(k, { label: 'a) x · y =' }), num(k / target, { label: 'b) y =' })),
          hint: 'Bei antiproportionalen Zuordnungen ist x · y immer gleich.',
          solution: L`a) $${xs[0]} \cdot ${k / xs[0]} = ${k}$

b) $y = ${k} : ${target} = ${k / target}$`,
        };
      },
      (r) => {
        const p1 = r.pick([3, 4, 6]), t1 = r.pick([4, 6, 8, 12]), p2 = r.pick([2, 5, 8].filter((x) => x !== p1)), f = r.pick([2, 1.5]);
        const t = round(((p1 * t1) / p2) * f);
        return {
          title: 'Mehrstufiger Dreisatz',
          section: 2,
          prompt: L`$${p1}$ gleich starke Pumpen füllen ein Becken in $${t1}$ Stunden. Ein zweites Becken ist $${de(f)}$-mal so groß. Wie lange brauchen $${p2}$ Pumpen, um das zweite Becken zu füllen?`,
          answer: fields(num(t, { label: 'Zeit:', unit: 'h' })),
          hint: 'Zwei Schritte: erst die Pumpenzahl ändern (antiproportional), dann die Beckengröße (proportional).',
          solution: L`1 Pumpe für Becken 1: $${p1} \cdot ${t1} = ${p1 * t1}$ h

${p2} Pumpen: $${p1 * t1} : ${p2} = ${de((p1 * t1) / p2)}$ h

Becken 2 ist $${de(f)}$-mal so groß: $${de((p1 * t1) / p2)} \cdot ${de(f)} = ${de(t)}$ h`,
        };
      },
    ],
    extras: [
      {
        rung: 3,
        title: 'Begründen: proportional oder nicht?',
        section: 1,
        prompt: L`Tim sagt: „Je länger ich lerne, desto weniger Fehler mache ich. Also ist die Zuordnung *Lernzeit → Fehler* antiproportional.“

Nimm Stellung zu Tims Aussage und begründe.`,
        answer: free('Die Aussage ist nicht (unbedingt) richtig: „Je mehr, desto weniger“ reicht nicht aus. Antiproportional wäre die Zuordnung nur, wenn das Produkt Lernzeit · Fehler immer gleich bleibt – also z. B. bei doppelter Lernzeit genau halb so viele Fehler. Das ist in der Realität nicht so.'),
        solution: L`Eine Zuordnung ist nur dann **antiproportional**, wenn **alle Produkte gleich** sind (doppelt so viel $x$ → halb so viel $y$). „Je mehr, desto weniger“ allein reicht nicht als Begründung.`,
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    title: 'Terme, Gleichungen & Formeln',
    icon: 'Variable',
    color: 'rose',
    description: 'Terme berechnen, Gleichungen lösen und Formeln umstellen',
    profiles: ALL,
    sections: [
      {
        title: 'Terme berechnen und vereinfachen',
        md: L`Ein **Term** ist ein Rechenausdruck mit Zahlen und Variablen, z. B. $2x + 5$.

**Einsetzen:** Für $x = 3$ gilt $2 \cdot 3 + 5 = 11$.

**Zusammenfassen:** Nur **gleichartige** Glieder zusammenfassen:
$$3x + 4 + 2x - 1 = 5x + 3$$

**Klammern auflösen:** $3(x - 2) = 3x - 6$ &nbsp;&nbsp; und &nbsp;&nbsp; $-(x + 1) = -x - 1$`,
      },
      {
        title: 'Gleichungen lösen',
        md: L`Eine Gleichung ist wie eine **Waage** – was du auf einer Seite machst, musst du auch auf der anderen Seite machen.

$$\begin{aligned} 5x - 7 &= 2x + 8 && \mid -2x \\ 3x - 7 &= 8 && \mid +7 \\ 3x &= 15 && \mid :3 \\ x &= 5 \end{aligned}$$

**Probe:** $5 \cdot 5 - 7 = 18$ und $2 \cdot 5 + 8 = 18$ ✓`,
      },
      {
        title: 'Gleichungen mit Klammern',
        md: L`1. Klammern auflösen
2. Auf jeder Seite zusammenfassen
3. Alle $x$ auf eine Seite, alle Zahlen auf die andere
4. Durch die Zahl vor dem $x$ teilen

$$\begin{aligned} 2(3x - 4) - (x + 1) &= 3x + 7 \\ 6x - 8 - x - 1 &= 3x + 7 \\ 5x - 9 &= 3x + 7 && \mid -3x + 9 \\ 2x &= 16 \\ x &= 8 \end{aligned}$$`,
      },
      {
        title: 'Formeln umstellen',
        md: L`Formeln stellst du genauso um wie Gleichungen.

$$A = \frac{g \cdot h}{2} \quad \mid \cdot 2 \qquad 2A = g \cdot h \quad \mid : g \qquad h = \frac{2A}{g}$$

> Mit Zahlen: $A = 24\text{ cm}^2$, $g = 6\text{ cm}$ → $h = \frac{2 \cdot 24}{6} = 8\text{ cm}$`,
      },
    ],
    rungs: [
      (r) => {
        const a = r.int(2, 6), b = r.int(1, 9), x = r.int(2, 7);
        return {
          title: 'Terme berechnen',
          section: 0,
          prompt: L`Berechne den Wert des Terms $${a}x + ${b}$ für $x = ${x}$.`,
          answer: fields(num(a * x + b, { label: 'Wert:' })),
          hint: 'Setze für x die Zahl ein. Punkt vor Strich!',
          solution: L`$${a} \cdot ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}$`,
        };
      },
      (r) => {
        const a = r.int(2, 7), x = r.int(2, 9), b = r.int(1, 15);
        return {
          title: 'Einfache Gleichungen',
          section: 1,
          prompt: L`Löse die Gleichung.

$$${a}x + ${b} = ${a * x + b}$$`,
          answer: fields(num(x, { label: 'x =' })),
          hint: `Rechne zuerst −${b} auf beiden Seiten.`,
          solution: L`$$\begin{aligned} ${a}x + ${b} &= ${a * x + b} && \mid -${b} \\ ${a}x &= ${a * x} && \mid :${a} \\ x &= ${x} \end{aligned}$$`,
        };
      },
      (r) => {
        const x = r.int(-4, 9), c = r.int(2, 4), a = c + r.int(1, 4), b = r.int(1, 12);
        const d = a * x - b - c * x;
        const sd = d >= 0 ? `+ ${d}` : `- ${-d}`;
        return {
          title: 'Gleichungen mit x auf beiden Seiten',
          section: 1,
          prompt: L`Löse die Gleichung.

$$${a}x - ${b} = ${c}x ${sd}$$`,
          answer: fields(num(x, { label: 'x =' })),
          hint: `Bringe zuerst alle x auf die linke Seite (−${c}x).`,
          solution: L`$$\begin{aligned} ${a}x - ${b} &= ${c}x ${sd} && \mid -${c}x \\ ${a - c}x - ${b} &= ${d} && \mid +${b} \\ ${a - c}x &= ${d + b} && \mid :${a - c} \\ x &= ${x} \end{aligned}$$`,
        };
      },
      (r) => {
        const g = r.int(4, 12), h = r.int(3, 11);
        const A = (g * h) / 2;
        return {
          title: 'Formeln umstellen',
          section: 3,
          prompt: L`Für den Flächeninhalt eines Dreiecks gilt $A = \frac{g \cdot h}{2}$.

Stelle die Formel nach $h$ um und berechne $h$ für $A = ${de(A)}\text{ cm}^2$ und $g = ${g}\text{ cm}$.`,
          answer: fields(num(h, { label: 'h =', unit: 'cm' })),
          hint: 'Multipliziere zuerst mit 2, dann teile durch g.',
          solution: L`$$h = \frac{2A}{g} = \frac{2 \cdot ${de(A)}}{${g}} = ${h}\text{ cm}$$`,
        };
      },
      (r) => {
        let a, b, c, d, e, x, coef;
        do {
          a = r.int(2, 4); b = r.int(2, 4); c = r.int(1, 5); d = r.int(1, 6); e = r.int(1, 4); x = r.int(-3, 8);
          coef = a * b - 1 - e;
        } while (coef === 0);
        const f = a * (b * x - c) - (x + d) - e * x;
        const sf = f >= 0 ? `+ ${f}` : `- ${-f}`;
        return {
          title: 'Gleichungen mit Klammern',
          section: 2,
          prompt: L`Löse die Gleichung.

$$${a}(${b}x - ${c}) - (x + ${d}) = ${e}x ${sf}$$`,
          answer: fields(num(x, { label: 'x =' })),
          hint: 'Löse zuerst die Klammern auf. Achtung beim Minus vor der Klammer!',
          solution: L`$$\begin{aligned} ${a * b}x - ${a * c} - x - ${d} &= ${e}x ${sf} \\ ${a * b - 1}x - ${a * c + d} &= ${e}x ${sf} && \mid -${e}x + ${a * c + d} \\ ${coef}x &= ${f + a * c + d} \\ x &= ${x} \end{aligned}$$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    title: 'Lineare Funktionen',
    icon: 'TrendingUp',
    color: 'violet',
    description: 'Steigung, y-Achsenabschnitt, Nullstellen und Schnittpunkte',
    profiles: ['HS10', 'RS10', 'ERS10'],
    sections: [
      {
        title: 'Die Funktionsgleichung y = mx + b',
        md: L`Der Graph einer linearen Funktion ist eine **Gerade**.

$$y = m \cdot x + b$$

- $m$ = **Steigung**: Um wie viel geht es nach oben (oder unten), wenn man 1 nach rechts geht?
- $b$ = **y-Achsenabschnitt**: Hier schneidet die Gerade die y-Achse, im Punkt $(0 \mid b)$.

> $y = 2x - 2$: Start bei $-2$ auf der y-Achse, dann 1 nach rechts und 2 nach oben.`,
      },
      {
        title: 'Steigung aus zwei Punkten',
        md: L`Durch zwei Punkte $P_1(x_1 \mid y_1)$ und $P_2(x_2 \mid y_2)$:

$$m = \frac{y_2 - y_1}{x_2 - x_1}$$

Danach $b$ bestimmen, indem man einen Punkt einsetzt: $b = y_1 - m \cdot x_1$.`,
      },
      {
        title: 'Punktprobe und Nullstelle',
        md: L`**Punktprobe:** Liegt $P(-8 \mid -7)$ auf $y = \frac12 x - 3$?
$$\tfrac12 \cdot (-8) - 3 = -4 - 3 = -7 \;\checkmark$$

**Nullstelle:** Dort, wo $y = 0$ ist:
$$0 = mx + b \quad\Rightarrow\quad x_0 = -\frac{b}{m}$$`,
      },
      {
        title: 'Schnittpunkt zweier Geraden',
        md: L`Setze die Funktionsterme **gleich** und löse nach $x$ auf. Setze dann $x$ in eine Gleichung ein, um $y$ zu erhalten.

$$\begin{aligned} 2x + 1 &= -x + 7 \\ 3x &= 6 \\ x &= 2 \quad\Rightarrow\quad y = 2\cdot 2 + 1 = 5 \end{aligned}$$

Schnittpunkt: $S(2 \mid 5)$`,
      },
    ],
    rungs: [
      (r) => {
        const m = r.pick([-3, -2, 2, 3, 4]), b = r.int(-5, 6), x = r.int(-3, 5);
        return {
          title: 'Funktionswerte berechnen',
          section: 0,
          prompt: L`Gegeben ist die Funktion $y = ${m}x ${b >= 0 ? '+ ' + b : '- ' + -b}$. Berechne $y$ für $x = ${x}$.`,
          answer: fields(num(m * x + b, { label: 'y =' })),
          hint: 'Setze den x-Wert in die Gleichung ein.',
          solution: L`$y = ${m} \cdot (${x}) ${b >= 0 ? '+ ' + b : '- ' + -b} = ${m * x + b}$`,
        };
      },
      (r) => {
        const m = r.pick([-2, -1, 1, 2]), b = r.int(-3, 3);
        return {
          title: 'Steigung und Achsenabschnitt ablesen',
          section: 0,
          prompt: L`Die Abbildung zeigt den Graphen einer linearen Funktion $y = mx + b$. Lies $m$ und $b$ ab.

${img(coordLine({ m, b }), 'Graph einer Geraden')}`,
          answer: fields(num(m, { label: 'm =' }), num(b, { label: 'b =' })),
          hint: 'b: Wo schneidet die Gerade die y-Achse? m: Gehe 1 nach rechts – wie viel nach oben/unten?',
          solution: L`Die Gerade schneidet die y-Achse bei $b = ${b}$. Geht man 1 nach rechts, geht es ${Math.abs(m)} nach ${m > 0 ? 'oben' : 'unten'}: $m = ${m}$.

Also $y = ${m === 1 ? '' : m === -1 ? '-' : m}x ${b >= 0 ? '+ ' + b : '- ' + -b}$`,
        };
      },
      (r) => {
        const x1 = r.int(-3, 1), x2 = x1 + r.pick([2, 4]), m = r.pick([-1.5, -1, 0.5, 1, 1.5, 2, 3]), b = r.int(-4, 4);
        const y1 = m * x1 + b, y2 = m * x2 + b;
        return {
          title: 'Steigung aus zwei Punkten',
          section: 1,
          prompt: L`Eine Gerade verläuft durch die Punkte $P_1(${x1} \mid ${de(y1)})$ und $P_2(${x2} \mid ${de(y2)})$. Berechne die Steigung $m$ und den y-Achsenabschnitt $b$.`,
          answer: fields(num(m, { label: 'm =', tol: 0.001 }), num(b, { label: 'b =', tol: 0.001 })),
          hint: 'm = (y₂ − y₁) : (x₂ − x₁). Danach einen Punkt einsetzen.',
          solution: L`$$m = \frac{${de(y2)} - (${de(y1)})}{${x2} - (${x1})} = \frac{${de(y2 - y1)}}{${x2 - x1}} = ${de(m)}$$
$b = y_1 - m \cdot x_1 = ${de(y1)} - ${de(m)} \cdot (${x1}) = ${b}$`,
        };
      },
      (r) => {
        const m = r.pick([0.5, 2, -2, 4, -0.5, 3]), b = r.pick([-6, -3, 3, 5, -4, 6]);
        const x0 = round(-b / m);
        return {
          title: 'Nullstelle berechnen',
          section: 2,
          prompt: L`Berechne die Nullstelle der Funktion $y = ${de(m)}x ${b >= 0 ? '+ ' + b : '- ' + -b}$.`,
          answer: fields(num(x0, { label: 'x₀ =' })),
          hint: 'Setze y = 0 und löse nach x auf.',
          solution: L`$$\begin{aligned} 0 &= ${de(m)}x ${b >= 0 ? '+ ' + b : '- ' + -b} \\ ${de(m)}x &= ${-b} \\ x_0 &= ${de(x0)} \end{aligned}$$`,
        };
      },
      (r) => {
        let m1, m2;
        do { m1 = r.pick([-2, -1, 0.5, 1, 2, 3]); m2 = r.pick([-3, -1, -0.5, 1, 2]); } while (m1 === m2);
        const xs = r.int(-2, 4) * 2, ys = r.int(-4, 5);
        const b1 = ys - m1 * xs, b2 = ys - m2 * xs;
        const f = (m, b) => L`${m === 1 ? '' : m === -1 ? '-' : de(m)}x ${b >= 0 ? '+ ' + de(b) : '- ' + de(-b)}`;
        return {
          title: 'Schnittpunkt zweier Geraden',
          section: 3,
          prompt: L`Berechne die Koordinaten des Schnittpunkts der beiden Geraden.

$$y_1 = ${f(m1, b1)} \qquad y_2 = ${f(m2, b2)}$$`,
          answer: fields(num(xs, { label: 'x =' }), num(ys, { label: 'y =' })),
          hint: 'Setze beide Terme gleich: y₁ = y₂.',
          solution: L`$$\begin{aligned} ${f(m1, b1)} &= ${f(m2, b2)} \\ ${de(m1 - m2)}x &= ${de(b2 - b1)} \\ x &= ${xs} \end{aligned}$$
Einsetzen: $y = ${de(m1)} \cdot ${xs} ${b1 >= 0 ? '+' : '-'} ${de(Math.abs(b1))} = ${ys}$ → $S(${xs} \mid ${ys})$`,
        };
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    title: 'Winkel, Dreiecke & Flächen',
    icon: 'Triangle',
    color: 'teal',
    description: 'Winkel an Geraden, Winkelsumme, Flächen und Kreise',
    profiles: ALL,
    sections: [
      {
        title: 'Winkel an Geraden',
        md: L`**Nebenwinkel** ergänzen sich zu $180°$: $\alpha + \beta = 180°$

**Scheitelwinkel** sind gleich groß.

| Winkelart | Größe |
|---|---|
| spitz | $0° < \alpha < 90°$ |
| recht | $\alpha = 90°$ |
| stumpf | $90° < \alpha < 180°$ |
| gestreckt | $\alpha = 180°$ |

> Zwei spitze Winkel sind zusammen immer **kleiner als 180°** – deshalb können Nebenwinkel nie beide spitz sein.`,
      },
      {
        title: 'Winkelsumme im Dreieck',
        md: L`In jedem Dreieck gilt:

$$\alpha + \beta + \gamma = 180°$$

> $\alpha = 28°$, $\beta = 125°$ → $\gamma = 180° - 28° - 125° = 27°$`,
      },
      {
        title: 'Flächen und Umfang',
        md: L`| Figur | Flächeninhalt | Umfang |
|---|---|---|
| Rechteck | $A = a \cdot b$ | $u = 2a + 2b$ |
| Quadrat | $A = a^2$ | $u = 4a$ |
| Dreieck | $A = \frac{g \cdot h}{2}$ | $u = a + b + c$ |
| Parallelogramm | $A = g \cdot h$ | $u = 2a + 2b$ |
| Trapez | $A = \frac{(a + c) \cdot h}{2}$ | Summe der Seiten |

**Zusammengesetzte Figuren:** Zerlege die Figur in bekannte Teilflächen und addiere sie (oder ergänze und subtrahiere).`,
      },
      {
        title: 'Kreis',
        md: L`$$A = \pi \cdot r^2 \qquad u = 2 \cdot \pi \cdot r = \pi \cdot d$$

$\pi \approx 3{,}14$ – nutze die $\pi$-Taste deines Taschenrechners.

> $r = 5\text{ cm}$: $A = \pi \cdot 25 \approx 78{,}54\text{ cm}^2$, $u = 2 \cdot \pi \cdot 5 \approx 31{,}42\text{ cm}$

**Halbkreis:** Fläche halbieren!`,
      },
    ],
    rungs: [
      (r) => {
        const a = r.int(95, 160);
        return {
          title: 'Nebenwinkel',
          section: 0,
          prompt: L`Die Winkel $\alpha$ und $\beta$ sind Nebenwinkel. Es gilt $\alpha = ${a}°$. Berechne $\beta$.

${img(angles({ alpha: `α = ${a}°` }), 'Nebenwinkel')}`,
          answer: fields(num(180 - a, { label: 'β =', unit: '°' })),
          hint: 'Nebenwinkel ergänzen sich zu 180°.',
          solution: L`$\beta = 180° - ${a}° = ${180 - a}°$`,
        };
      },
      (r) => {
        const a = r.int(20, 70), b = r.int(40, 110);
        return {
          title: 'Winkelsumme im Dreieck',
          section: 1,
          prompt: L`In einem Dreieck ist $\alpha = ${a}°$ und $\beta = ${b}°$. Berechne $\gamma$.`,
          answer: fields(num(180 - a - b, { label: 'γ =', unit: '°' })),
          hint: 'Die Winkelsumme im Dreieck beträgt 180°.',
          solution: L`$\gamma = 180° - ${a}° - ${b}° = ${180 - a - b}°$`,
        };
      },
      (r) => {
        const g = r.int(5, 14), h = r.int(3, 9) + 0.5 * r.int(0, 1);
        return {
          title: 'Flächeninhalt Dreieck',
          section: 2,
          prompt: L`Berechne den Flächeninhalt des Dreiecks.

${img(triangleGH({ g: `g = ${dt(g)} cm`, h: `h = ${dt(h)} cm` }), 'Dreieck')}`,
          answer: fields(num((g * h) / 2, { label: 'A =', unit: 'cm²' })),
          hint: 'A = g · h : 2',
          solution: L`$A = \frac{${de(g)} \cdot ${de(h)}}{2} = ${de((g * h) / 2)}\text{ cm}^2$`,
        };
      },
      (r) => {
        const rad = r.int(2, 12) + 0.5 * r.int(0, 1);
        const A = round(Math.PI * rad * rad), u = round(2 * Math.PI * rad);
        return {
          title: 'Kreis',
          section: 3,
          prompt: L`Ein kreisförmiges Beet hat einen Radius von $${de(rad)}\text{ m}$. Berechne den Flächeninhalt und den Umfang. Runde auf zwei Nachkommastellen.`,
          answer: fields(num(A, { label: 'A =', unit: 'm²', tol: relTol(A) }), num(u, { label: 'u =', unit: 'm', tol: relTol(u) })),
          hint: 'A = π · r² und u = 2 · π · r',
          solution: L`$A = \pi \cdot ${de(rad)}^2 \approx ${de(A)}\text{ m}^2$

$u = 2 \cdot \pi \cdot ${de(rad)} \approx ${de(u)}\text{ m}$`,
        };
      },
      (r) => {
        const a = 2 * r.int(3, 8), b = r.int(3, 10);
        const A = round(a * b + (Math.PI * (a / 2) ** 2) / 2);
        return {
          title: 'Zusammengesetzte Figuren',
          section: 2,
          prompt: L`Die Figur besteht aus einem Rechteck und einem aufgesetzten Halbkreis. Berechne den Flächeninhalt der Figur.

${img(composite({ a: `${a} cm`, b: `${b} cm` }), 'Rechteck mit Halbkreis')}`,
          answer: fields(num(A, { label: 'A =', unit: 'cm²', tol: relTol(A) })),
          hint: 'Rechteck + halber Kreis. Der Radius ist die halbe Rechteckbreite.',
          solution: L`Rechteck: $${a} \cdot ${b} = ${a * b}\text{ cm}^2$

Halbkreis mit $r = ${a / 2}\text{ cm}$: $\frac{\pi \cdot ${a / 2}^2}{2} \approx ${de((Math.PI * (a / 2) ** 2) / 2)}\text{ cm}^2$

Gesamt: $A \approx ${de(A)}\text{ cm}^2$`,
        };
      },
    ],
    extras: [
      {
        rung: 1,
        title: 'Begründen: Nebenwinkel',
        section: 0,
        prompt: L`Björn behauptet: „Ich kann ein Nebenwinkelpaar zeichnen, das aus zwei spitzen Winkeln besteht.“

Begründe, dass Björns Behauptung falsch ist.`,
        answer: free('Nebenwinkel ergänzen sich immer zu 180°. Spitze Winkel sind kleiner als 90°. Zwei spitze Winkel sind zusammen also kleiner als 180° – sie können keine Nebenwinkel sein.'),
        solution: L`Nebenwinkel ergeben zusammen **immer 180°**. Ein spitzer Winkel ist **kleiner als 90°**, zwei spitze Winkel ergeben also zusammen **weniger als 180°**. Daher können Nebenwinkel nie beide spitz sein.`,
      },
    ],
  },
];

function gcd(a, b) {
  return b ? gcd(b, a % b) : Math.abs(a);
}
export { gcd };
