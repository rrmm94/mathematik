// Erw. RS (ERS10): schwierigere Fassungen der RS10-Diagnoseaufgaben, Teil A (Zahlen bis Lineare Gleichungssysteme).
// Jede Funktion liefert Varianten mit schwierigeren Zahlen und einer vertiefenden Teilaufgabe. Alle Ergebnisse werden berechnet.
import { de, dt, num, fields, sel, expr, approx, table, fieldsWith, lin, eq } from './grundlagen/kit.js';
import { distinct, solve2 } from './diag-gls-wachstum.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const r2 = (n) => Math.round(n * 100) / 100;
const r6 = (n) => Math.round(n * 1e6) / 1e6;
const frac = (n, d) => { const g = gcd(n, d); const a = n / g, b = d / g; return { n: a, d: b, v: a / b, tex: b === 1 ? `${a}` : `\\frac{${a}}{${b}}` }; };
const bruch = (n, d) => `\\frac{${n}}{${d}}`;
const par = (x) => (x < 0 ? `(${de(x)})` : de(x));
const V = (prompt, answer, solution, hint = '') => ({ prompt, answer, solution, hint, source: '' });

// ------------------------------------------------------------------ Zahlen & Rechnen
export function zahlenBrueche(r) {
  const ds = [4, 6, 8, 9, 10, 12];
  let q, t;
  do { q = r.pick(ds); t = r.pick(ds); } while (q === t);
  const coprime = (n) => [1, 2, 3, 4, 5, 7, 9, 11].filter((x) => x < n && gcd(x, n) === 1);
  const p = r.pick(coprime(q)), s = r.pick(coprime(t));
  const l = lcm(q, t);
  const sum = frac(p * (l / q) + s * (l / t), l);
  const v = r.pick([5, 7, 8, 9]), x = r.pick([4, 6, 9, 10]);
  const u = r.pick([2, 3, 4, 5].filter((n) => n < v)), w = r.pick([1, 3, 5].filter((n) => n < x));
  const prod = frac(u * w, v * x);
  return V(
    `Berechne und gib die Ergebnisse als Bruch (z. B. 3/4) oder als Dezimalzahl an.\n\na) $${bruch(p, q)} + ${bruch(s, t)}$\n\nb) $${bruch(u, v)} \\cdot ${bruch(w, x)}$`,
    fields(num(sum.v, { label: 'a) Summe:' }), num(prod.v, { label: 'b) Produkt:' })),
    `a) Hauptnenner ${l}: $${bruch(p * (l / q), l)} + ${bruch(s * (l / t), l)} = ${bruch(p * (l / q) + s * (l / t), l)}${sum.d !== l || sum.n !== p * (l / q) + s * (l / t) ? ` = ${sum.tex}` : ''} \\approx ${de(sum.v, 4)}$\n\nb) Zähler mal Zähler, Nenner mal Nenner: $${bruch(u * w, v * x)}${prod.tex !== bruch(u * w, v * x) ? ` = ${prod.tex}` : ''} \\approx ${de(prod.v, 4)}$`,
    'Beim Addieren brauchst du einen gemeinsamen Nenner, beim Multiplizieren nicht.',
  );
}

export function zahlenRunden(r) {
  const n = r.int(100000000, 899999999), rounded = Math.round(n / 1e6) * 1e6;
  const [a, b, c, d] = [r.int(5, 12), r.int(3, 9), r.int(2, 6), r.int(3, 9)];
  const k = r.int(3, 7), m = r.int(2, 4);
  const bv = -a * b - c * -d, cv = k * k - m ** 3;
  return V(
    `a) Runde die Zahl $${de(n, 0)}$ auf ganze Millionen.\n\nb) Berechne: $(-${a})\\cdot ${b} - ${c}\\cdot(-${d})$\n\nc) Berechne: $(-${k})^2 - ${m}^3$`,
    fields(num(rounded, { label: 'a)' }), num(bv, { label: 'b)' }), num(cv, { label: 'c)' })),
    `a) Die Stelle hinter den Millionen ist ${Math.floor((n % 1e6) / 1e5)}, ${(n % 1e6) >= 5e5 ? 'also wird aufgerundet' : 'also wird abgerundet'}: $${de(rounded, 0)}$\n\nb) $-${a * b} - (-${c * d}) = -${a * b} + ${c * d} = ${de(bv, 0)}$\n\nc) $(-${k})^2 = ${k * k}$ und $${m}^3 = ${m ** 3}$, also $${k * k} - ${m ** 3} = ${de(cv, 0)}$`,
    'Punkt vor Strich. Minus mal Minus ergibt Plus.',
  );
}

export function zahlenWissenschaftlich(r) {
  const D = r.int(101, 999), e = r.int(4, 8);
  const small = (D / 10 ** (e + 2)).toFixed(e + 2).replace('.', '{,}');
  const p = r.int(2, 9), q = r.int(3, 9), u = r.int(2, 6), v = r.int(2, 6);
  const prod = p * q, a2 = prod >= 10 ? prod / 10 : prod, n2 = u + v + (prod >= 10 ? 1 : 0);
  return V(
    `Schreibe in wissenschaftlicher Schreibweise $a\\cdot10^n$ (mit $1\\le a<10$).\n\na) $${small}$\n\nb) $(${p}\\cdot10^{${u}})\\cdot(${q}\\cdot10^{${v}})$`,
    fields(num(D / 100, { label: 'a) a =' }), num(-e, { label: 'n =' }), num(a2, { label: 'b) a =' }), num(n2, { label: 'n =' })),
    `a) Das Komma wird um ${e} Stellen nach rechts verschoben, bis $${de(D / 100)}$ entsteht: $${de(D / 100)}\\cdot10^{-${e}}$\n\nb) Zahlen und Zehnerpotenzen getrennt multiplizieren: $${p}\\cdot${q}\\cdot10^{${u}+${v}} = ${prod}\\cdot10^{${u + v}}$${prod >= 10 ? `. Da $${prod}\\ge10$ ist, schreibst du $${de(a2)}\\cdot10^{${n2}}$.` : ''}`,
    'Bei $a\\cdot10^n$ muss $a$ zwischen 1 und 10 liegen.',
  );
}

// ------------------------------------------------------------------ Größen & Einheiten
export function groessenZeit(r) {
  const sh = r.int(7, 9), sm = r.pick([5, 10, 15, 20, 35, 40, 50]), dur = r.int(300, 400) + r.pick([0, 5, 10, 15]);
  const end = sh * 60 + sm + dur;
  const w = r.int(2, 4), f = r.pick([[1, 4, 15], [1, 2, 30], [3, 4, 45], [2, 3, 40], [1, 3, 20], [1, 5, 12]]);
  const film = r.pick([95, 105, 115, 125, 135, 145, 155]), fh = r.pick([18, 19, 20]), fm = r.pick([10, 20, 25, 35, 40, 50]);
  const fe = fh * 60 + fm + film;
  const t = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return V(
    `a) Der Unterricht beginnt um **${t(sh * 60 + sm)} Uhr** und endet um **${t(end)} Uhr**. Wie viele Minuten dauert der Unterricht?\n\nb) $${w}\\tfrac{${f[0]}}{${f[1]}}\\text{ h} = \\square\\text{ min}$\n\nc) Ein Film dauert ${film} Minuten und beginnt um **${t(fh * 60 + fm)} Uhr**. Um wie viel Uhr endet er?`,
    fields(num(dur, { label: 'a) Dauer:', unit: 'min' }), num(w * 60 + f[2], { label: 'b)', unit: 'min' }), num(Math.floor(fe / 60) % 24, { label: 'c) Ende, Stunde:' }), num(fe % 60, { label: 'Minute:' })),
    `a) von ${t(sh * 60 + sm)} Uhr bis ${t(end)} Uhr: ${end - (sh * 60 + sm)} Minuten\n\nb) $${w}\\text{ h}=${w * 60}$ min und $\\frac{${f[0]}}{${f[1]}}\\text{ h}=${f[2]}$ min, zusammen **${w * 60 + f[2]} min**\n\nc) ${t(fh * 60 + fm)} Uhr + ${film} min = ${t(fe % 1440)} Uhr`,
    '1 Stunde sind 60 Minuten.',
  );
}

export function groessenFlaeche(r) {
  const a = r.pick([2.4, 3.6, 5.5, 0.75, 1.8, 6.25]), b = r.pick([350, 1260, 4500, 80, 2750, 960]), c = r.pick([0.4, 0.75, 2.5, 1.2, 3.8]);
  const A = a * 10000, B = b / 100, C = c * 10000;
  return V(
    `Wandle um.\n\na) $${de(a)}\\text{ m}^2 = \\square\\text{ cm}^2$\n\nb) $${de(b, 0)}\\text{ dm}^2 = \\square\\text{ m}^2$\n\nc) $${de(c)}\\text{ ha} = \\square\\text{ m}^2$`,
    fields(num(r6(A), { label: 'a)', unit: 'cm²' }), num(r6(B), { label: 'b)', unit: 'm²' }), num(r6(C), { label: 'c)', unit: 'm²' })),
    `Umrechnungszahl bei Flächen: 100 (von dm² zu m², von m² zu dm² usw.), 10 000 von m² zu cm² und von ha zu m².\n\na) $${de(a)}\\cdot10\\,000=${de(A, 0)}$ cm²\n\nb) $${de(b, 0)}:100=${de(B)}$ m²\n\nc) $${de(c)}\\cdot10\\,000=${de(C, 0)}$ m²`,
    'Bei Flächen ist jede Umrechnungszahl das Quadrat der Umrechnungszahl bei Längen.',
  );
}

export function groessenVolumen(r) {
  const vol = r.pick([6.5, 12.5, 3.2, 8.4, 0.75]), v1 = r.pick([36, 45, 72, 81, 108, 126, 99]), v2 = r.pick([8, 12, 15, 20, 25, 35]);
  return V(
    `a) Ein Wasserbecken fasst ${dt(vol)} m³. Wie viele Liter sind das?\n\nb) Ein Auto fährt $${v1}\\text{ km/h}$. Wie viele Meter legt es pro Sekunde zurück?\n\nc) Ein Sprinter läuft $${v2}\\text{ m/s}$. Gib die Geschwindigkeit in km/h an.`,
    fields(num(r6(vol * 1000), { label: 'a)', unit: 'Liter' }), num(r6(v1 / 3.6), { label: 'b)', unit: 'm/s' }), num(r6(v2 * 3.6), { label: 'c)', unit: 'km/h' })),
    `a) $1\\text{ m}^3=1000$ Liter: $${de(vol)}\\cdot1000=${de(vol * 1000, 0)}$ Liter\n\nb) $${v1}\\text{ km/h}:3{,}6=${de(v1 / 3.6)}$ m/s\n\nc) $${v2}\\text{ m/s}\\cdot3{,}6=${de(v2 * 3.6)}$ km/h`,
    '$1\\text{ m/s}=3{,}6\\text{ km/h}$',
  );
}

// ------------------------------------------------------------------ Prozent & Zinsen
export function prozentRabatt(r) {
  const price = r.int(4500, 19990) / 100, pc = r.pick([12, 15, 18, 20, 25, 30, 35, 40]);
  const item = r.pick([['Eine Jacke', 'die Jacke'], ['Ein Rucksack', 'der Rucksack'], ['Ein Paar Sportschuhe', 'das Paar Sportschuhe'], ['Ein Tablet', 'das Tablet']]);
  const saved = r2(price * pc / 100), nw = r2(price - saved);
  return V(
    `${item[0]} kostet $${de(price)}$ €. Im Sale gibt es $${de(pc, 0)}\\,\\%$ Rabatt.\n\na) Wie viel kostet ${item[1]} jetzt?\n\nb) Wie viel Euro spart man durch den Rabatt?`,
    fields(approx(nw, { label: 'a) Neuer Preis:', unit: '€', tol: 0.011 }), approx(saved, { label: 'b) Ersparnis:', unit: '€', tol: 0.011 })),
    `b) Ersparnis: $${de(price)}\\cdot\\frac{${pc}}{100}=${de(saved)}$ €\n\na) Neuer Preis: $${de(price)}-${de(saved)}=${de(nw)}$ €\n\n(oder in einem Schritt: $${de(price)}\\cdot${de(1 - pc / 100, 2)}=${de(nw)}$ €)`,
    'Neuer Preis = alter Preis mal Faktor, bei Rabatt $1-\\frac{p}{100}$.',
  );
}

export function prozentGrundwert(r) {
  const pc = r.pick([12.5, 15, 35, 45, 60, 8]), G = r.pick([80, 120, 160, 200, 240, 360, 440]), W = r2(G * pc / 100);
  const K = r.pick([1200, 1600, 2000, 2400, 3200, 4800]), p = r.pick([2.5, 3, 3.5, 4, 4.5]), m = r.pick([3, 4, 6, 9]);
  const Z = r2(K * p / 100 * m / 12);
  const K2 = r.pick([1200, 1600, 2000, 2500, 4000]), p2 = r.pick([2, 2.5, 3.5, 4.5, 5]), Z1 = r2(K2 * p2 / 100);
  return V(
    `a) $${de(pc)}\\,\\%$ des Preises einer Klassenfahrt sind $${de(W)}$ €. Wie hoch ist der volle Preis (100 %)?\n\nb) Frau Kaya legt $${de(K, 0)}$ € zu einem Zinssatz von $${de(p)}\\,\\%$ für $${m}$ Monate an. Wie viel Zinsen erhält sie?\n\nc) Auf $${de(K2, 0)}$ € erhält Herr Berg nach einem Jahr $${de(Z1)}$ € Zinsen. Wie hoch ist der Zinssatz?`,
    fields(num(G, { label: 'a) G =', unit: '€' }), approx(Z, { label: 'b) Z =', unit: '€', tol: 0.011 }), approx(p2, { label: 'c) p =', unit: '%', tol: 0.011 })),
    `a) $G=\\frac{W}{p}=\\frac{${de(W)}}{${de(pc / 100, 3)}}=${de(G, 0)}$ €\n\nb) $Z=K\\cdot\\frac{p}{100}\\cdot\\frac{${m}}{12}=${de(K, 0)}\\cdot${de(p / 100, 3)}\\cdot\\frac{${m}}{12}=${de(Z)}$ €\n\nc) $p=\\frac{Z}{K}\\cdot100=\\frac{${de(Z1)}}{${de(K2, 0)}}\\cdot100=${de(p2)}\\,\\%$`,
    'Bei Zinsen für Monate rechnest du mit dem Bruchteil $\\frac{\\text{Monate}}{12}$ eines Jahres.',
  );
}

export function prozentZinseszins(r) {
  const K0 = r.pick([2500, 4000, 6500, 8000, 12000]), p = r.pick([2.5, 3, 3.5, 4.5]), n = r.pick([5, 6, 8, 10]);
  const q = 1 + p / 100, Kn = r2(K0 * q ** n);
  return V(
    `Lena legt $${de(K0, 0)}$ € für $${n}$ Jahre zu einem festen Zinssatz von $${de(p)}\\,\\%$ an. Die Zinsen werden jedes Jahr mitverzinst.\n\na) Über welchen Betrag kann sie nach $${n}$ Jahren verfügen?\n\nb) Wie viel Euro Zinsen hat sie insgesamt erhalten?`,
    fields(approx(Kn, { label: 'a) K =', unit: '€', tol: 0.02 }), approx(r2(Kn - K0), { label: 'b) Zinsen:', unit: '€', tol: 0.02 })),
    `a) Wachstumsfaktor $q=1+\\frac{${de(p)}}{100}=${de(q, 3)}$\n\n$K_{${n}}=${de(K0, 0)}\\cdot${de(q, 3)}^{${n}}\\approx${de(Kn)}$ €\n\nb) $${de(Kn)}-${de(K0, 0)}=${de(r2(Kn - K0))}$ €`,
    'Zinseszins: $K_n=K_0\\cdot q^n$ mit $q=1+\\frac{p}{100}$.',
  );
}

// ------------------------------------------------------------------ Terme, Gleichungen & Formeln
export function termeGleichung(r) {
  const x0 = r.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]), a = r.int(5, 12), c = r.int(1, a - 3), b = r.int(-18, 18), d = (a - c) * x0 + b;
  if (b === 0) return null;
  return V(
    `Löse die Gleichung und gib auch den Wert an, den beide Seiten der Gleichung für deine Lösung annehmen.\n\n$$${lin(a, b)}=${lin(c, d)}$$`,
    fields(num(x0, { label: 'x =' }), num(a * x0 + b, { label: 'Wert beider Seiten:' })),
    `$${lin(a, b)}=${lin(c, d)}$\n\nSubtrahiere $${de(c)}x$ auf beiden Seiten: $${de(a - c)}x${b < 0 ? '-' : '+'}${de(Math.abs(b))}=${de(d)}$\n\n${b < 0 ? 'Addiere' : 'Subtrahiere'} $${de(Math.abs(b))}$: $${de(a - c)}x=${de(d - b)}$\n\nTeile durch $${de(a - c)}$: $x=${de(x0)}$\n\n**Probe:** $${de(a)}\\cdot${par(x0)}${b < 0 ? '-' : '+'}${de(Math.abs(b))}=${de(a * x0 + b)}$ und $${de(c)}\\cdot${par(x0)}${d < 0 ? '-' : '+'}${de(Math.abs(d))}=${de(c * x0 + d)}$`,
    'Sammle alle $x$ auf einer Seite und alle Zahlen auf der anderen Seite.',
  );
}

export function termeKlammern(r) {
  const x0 = r.int(-5, 8), a = r.int(2, 5), b = r.int(2, 4), c = r.int(1, 6), d = r.int(2, 4), e = r.int(1, 3), f = r.int(1, 7), g = r.int(-2, 4);
  const k = a * b - d * e - g;
  if (k === 0 || x0 === 0) return null;
  const hh = k * x0 - a * c - d * f; // aus (ab - de - g)·x0 = hh + ac + df
  return V(
    `Löse die Gleichung.\n\n$$${a}(${lin(b, -c)})-${d}(${lin(e, f)})=${lin(g, hh)}$$\n\nGib außerdem den Wert der linken Seite für deine Lösung an.`,
    fields(num(x0, { label: 'x =' }), num((a * (b * x0 - c)) - d * (e * x0 + f), { label: 'Wert der linken Seite:' })),
    `Klammern ausmultiplizieren: $${de(a * b)}x-${de(a * c)}-${de(d * e)}x-${de(d * f)}=${lin(g, hh)}$\n\nZusammenfassen: $${lin(a * b - d * e, -a * c - d * f)}=${lin(g, hh)}$\n\nNach $x$ auflösen: $${k === 1 ? '' : k === -1 ? '-' : de(k)}x=${de(hh + a * c + d * f)}$, also $x=${de(x0)}$\n\n**Probe:** linke Seite $${a}\\cdot(${de(b * x0 - c)})-${d}\\cdot(${de(e * x0 + f)})=${de(a * (b * x0 - c) - d * (e * x0 + f))}$`,
    'Achte beim Auflösen der Klammern auf das Minuszeichen vor der Klammer.',
  );
}

export function termeFormel(r) {
  const kind = r.int(0, 2);
  if (kind === 0) {
    const a = r.int(4, 12), c = r.int(2, 9), h = r.int(3, 10), A = (a + c) * h / 2;
    const [a2, c2, h2] = [r.int(3, 10), r.int(5, 15), r.int(2, 8)];
    if (a === c) return null;
    const A2 = (a2 + c2) * h2 / 2;
    return V(
      `Für den Flächeninhalt eines Trapezes gilt $A=\\frac{a+c}{2}\\cdot h$.\n\na) Stelle die Formel nach $c$ um und berechne $c$ für $A=${de(A)}\\text{ cm}^2$, $a=${a}\\text{ cm}$ und $h=${h}\\text{ cm}$.\n\nb) Berechne $h$ für $A=${de(A2)}\\text{ cm}^2$, $a=${a2}\\text{ cm}$ und $c=${c2}\\text{ cm}$.`,
      fields(num(c, { label: 'a) c =', unit: 'cm' }), num(h2, { label: 'b) h =', unit: 'cm' })),
      `a) $A=\\frac{a+c}{2}\\cdot h \\Rightarrow c=\\frac{2A}{h}-a=\\frac{2\\cdot${de(A)}}{${h}}-${a}=${c}$ cm\n\nb) $h=\\frac{2A}{a+c}=\\frac{2\\cdot${de(A2)}}{${a2}+${c2}}=${h2}$ cm`,
      'Multipliziere zuerst mit 2, dann teile durch die Höhe bzw. die Summe.',
    );
  }
  if (kind === 1) {
    const rr = r.int(3, 8), h = r.int(4, 14), Vv = r2(Math.PI * rr * rr * h);
    const h2 = r.int(5, 12), V2 = r2(Math.PI * 25 * h2);
    return V(
      `Für das Volumen eines Zylinders gilt $V=\\pi\\cdot r^2\\cdot h$.\n\na) Stelle die Formel nach $h$ um und berechne $h$ für $V=${de(Vv)}\\text{ cm}^3$ und $r=${rr}\\text{ cm}$.\n\nb) Stelle nach $r$ um und berechne $r$ für $V=${de(V2)}\\text{ cm}^3$ und $h=${h2}\\text{ cm}$. (auf eine Nachkommastelle runden)`,
      fields(approx(h, { label: 'a) h =', unit: 'cm', tol: 0.02 }), approx(5, { label: 'b) r =', unit: 'cm', tol: 0.06 })),
      `a) $h=\\frac{V}{\\pi r^2}=\\frac{${de(Vv)}}{\\pi\\cdot${rr}^2}\\approx${h}$ cm\n\nb) $r=\\sqrt{\\frac{V}{\\pi h}}=\\sqrt{\\frac{${de(V2)}}{\\pi\\cdot${h2}}}\\approx5{,}0$ cm`,
      'Löse die Formel erst nach der gesuchten Größe auf und setze dann ein.',
    );
  }
  const K = r.pick([800, 1500, 2400, 3000]), p = r.pick([2, 2.5, 3, 4]), t = r.pick([180, 90, 270, 120]), Z = r2(K * p * t / 36000);
  return V(
    `Die Zinsen für $t$ Tage berechnest du mit $Z=\\dfrac{K\\cdot p\\cdot t}{100\\cdot360}$.\n\nStelle die Formel nach $K$ um und berechne $K$ für $Z=${de(Z)}$ €, $p=${de(p)}\\,\\%$ und $t=${t}$ Tage.`,
    fields(num(K, { label: 'K =', unit: '€' })),
    `$K=\\dfrac{Z\\cdot100\\cdot360}{p\\cdot t}$, also $K=\\dfrac{${de(Z)}\\cdot36\\,000}{${de(p)}\\cdot${t}}=${de(K, 0)}$ €`,
    'Multipliziere beide Seiten mit dem Nenner und teile dann durch $p\\cdot t$.',
  );
}

// ------------------------------------------------------------------ Zuordnungen & Dreisatz
export function dreisatzProp(r) {
  const n = r.pick([4, 5, 8, 12]), p = r.pick([2.4, 3.2, 4.5, 5.6, 6.8, 2.8]), T = r2(n * p), z = r.pick([3, 7, 9, 15]), B = r2(p * r.pick([4, 6, 10, 20]));
  const sort = r.pick(['Kirschen', 'Trauben', 'Nüsse', 'Erdbeeren']);
  return V(
    `${n} kg ${sort} kosten $${de(T)}$ €.\n\na) Wie viel kostet 1 kg?\n\nb) Wie viel kosten ${z} kg?\n\nc) Wie viel kg bekommt man für $${de(B)}$ €?`,
    fields(approx(p, { label: 'a) 1 kg:', unit: '€', tol: 0.011 }), approx(r2(p * z), { label: `b) ${z} kg:`, unit: '€', tol: 0.011 }), approx(r6(B / p), { label: 'c) Menge:', unit: 'kg', tol: 0.011 })),
    `a) $${de(T)}:${n}=${de(p)}$ € pro kg\n\nb) $${de(p)}\\cdot${z}=${de(p * z)}$ €\n\nc) $${de(B)}:${de(p)}=${de(B / p)}$ kg`,
    'Rechne erst auf 1 kg zurück (Dreisatz).',
  );
}

export function dreisatzAnti(r) {
  const k = r.pick([120, 180, 240, 360]), divs = [2, 3, 4, 5, 6, 8, 10, 12, 15].filter((x) => k % x === 0);
  const xs = r.shuffle(divs).slice(0, 4).sort((a, b) => a - b);
  const known = xs.slice(0, 3), miss = xs[3];
  const ys = divs.filter((x) => !xs.includes(x) && k / x === Math.round(k / x));
  const cand = [10, 12, 15, 20, 24, 30, 36, 40].filter((y) => k % y === 0 && !known.map((x) => k / x).includes(y) && y !== k / miss && k / y !== miss);
  if (!cand.length) return null;
  const yt = r.pick(cand);
  void ys;
  return V(
    `Die Zuordnung ist antiproportional.\n\n| $x$ | ${known.join(' | ')} | ${miss} |\n|---|${known.map(() => '---').join('|')}|---|\n| $y$ | ${known.map((x) => k / x).join(' | ')} | $\\square$ |\n\na) Gib das Produkt $x\\cdot y$ an.\n\nb) Ergänze den fehlenden Wert.\n\nc) Welcher $x$-Wert gehört zu $y=${yt}$?`,
    fields(num(k, { label: 'a) x · y =' }), num(k / miss, { label: 'b) y =' }), num(k / yt, { label: 'c) x =' })),
    `a) Bei antiproportionalen Zuordnungen ist $x\\cdot y$ immer gleich: $${known[0]}\\cdot${k / known[0]}=${k}$\n\nb) $y=${k}:${miss}=${k / miss}$\n\nc) $x=${k}:${yt}=${k / yt}$`,
    'Bei einer antiproportionalen Zuordnung ist das Produkt $x\\cdot y$ immer gleich.',
  );
}

export function dreisatzMehr(r) {
  const n = r.pick([4, 6, 8, 9, 12]), d = r.pick([6, 8, 10, 12, 15]), f = r.pick([1.5, 2, 2.5, 3]);
  const W = n * d * f;
  const ms = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15].filter((m) => m !== n && Number.isInteger(r6(W / m * 10)));
  const Ds = [3, 4, 5, 6, 8, 9, 10, 12, 15, 18].filter((D) => Number.isInteger(r6(W / D)));
  if (!ms.length || !Ds.length) return null;
  const m = r.pick(ms), D = r.pick(Ds);
  const what = r.pick([['Arbeiter', 'Tage', 'ein Dach'], ['Maler', 'Tage', 'ein Haus']]);
  return V(
    `${n} gleich schnelle ${what[0]} decken ${what[2]} in ${d} ${what[1]}. Ein zweites Projekt ist ${de(f)}-mal so groß.\n\na) Wie lange brauchen ${m} ${what[0]} für das zweite Projekt?\n\nb) Wie viele ${what[0]} braucht man, damit das zweite Projekt in ${D} ${what[1]} fertig ist?`,
    fields(num(r6(W / m), { label: `a) Dauer:`, unit: 'Tage' }), num(W / D, { label: `b) Anzahl ${what[0]}:` })),
    `Gesamtarbeit für das erste Projekt: $${n}\\cdot${d}=${n * d}$ Arbeitertage. Das zweite Projekt braucht $${n * d}\\cdot${de(f)}=${de(W)}$ Arbeitertage.\n\na) $${de(W)}:${m}=${de(W / m)}$ Tage\n\nb) $${de(W)}:${D}=${de(W / D)}$ ${what[0]}`,
    'Rechne mit der Gesamtarbeit (Anzahl mal Dauer), sie bleibt gleich.',
  );
}

// ------------------------------------------------------------------ Lineare Funktionen
export function linSteigung(r) {
  const m = r.pick([-2.5, -1.5, -0.75, -0.5, 0.25, 0.5, 0.75, 1.5, 2.5]), den = [0.25, 0.75].includes(Math.abs(m)) ? 4 : 2;
  const x1 = r.int(-5, 1), dx = den * r.int(1, 2), y1 = r.int(-6, 6), b = r6(y1 - m * x1), x2 = x1 + dx, y2 = r6(m * x2 + b), xq = r.pick([6, 8, 10]);
  if (!Number.isInteger(y2)) return null;
  const sg = (v) => (v < 0 ? `−${de(Math.abs(v))}` : de(v));
  return V(
    `Eine Gerade verläuft durch die Punkte $P_1(${x1}\\mid ${y1})$ und $P_2(${x2}\\mid ${y2})$.\n\na) Berechne die Steigung $m$ und den y-Achsenabschnitt $b$.\n\nb) Welchen $y$-Wert hat die Gerade bei $x=${xq}$?`,
    fields(num(m, { label: 'a) m =' }), num(b, { label: 'b =' }), num(r6(m * xq + b), { label: `b) y(${xq}) =` })),
    `a) $m=\\frac{y_2-y_1}{x_2-x_1}=\\frac{${y2}-${par(y1)}}{${x2}-${par(x1)}}=${sg(m)}$\n\nEinsetzen von $P_1$ in $y=mx+b$: $${y1}=${sg(m)}\\cdot${par(x1)}+b \\Rightarrow b=${sg(b)}$\n\nb) $y(${xq})=${sg(m)}\\cdot${xq}${b < 0 ? '-' : '+'}${de(Math.abs(b))}=${de(m * xq + b)}$`,
    'Die Steigung ist $\\frac{\\Delta y}{\\Delta x}$. Den Achsenabschnitt erhältst du, wenn du einen Punkt einsetzt.',
  );
}

export function linNullstelle(r) {
  const m = r.pick([-4, -2.5, -1.5, 0.5, 1.5, 2.5, 4, -0.5]), x0 = r.pick([-3, -1.5, 0.5, 1.5, 2, 2.5, 3, 4, 6]), b = r6(-m * x0), xq = r.pick([4, 5, -2, 8]);
  if (b === 0) return null;
  return V(
    `Gegeben ist die Funktion $y=${lin(m, b)}$.\n\na) Berechne die Nullstelle.\n\nb) In welchem Punkt schneidet der Graph die $y$-Achse?\n\nc) Berechne den Funktionswert für $x=${xq}$.`,
    fields(num(x0, { label: 'a) x₀ =' }), num(b, { label: 'b) S(0 |' }), num(r6(m * xq + b), { label: `c) y(${xq}) =` })),
    `a) $0=${lin(m, b)} \\Rightarrow ${de(-m)}x=${de(b)} \\Rightarrow x_0=${de(x0)}$\n\nb) Der $y$-Achsenabschnitt ist $b=${de(b)}$, also $S_y(0\\mid ${de(b)})$.\n\nc) $y(${xq})=${de(m)}\\cdot${par(xq)}${b < 0 ? '-' : '+'}${de(Math.abs(b))}=${de(m * xq + b)}$`,
    'Bei der Nullstelle ist $y=0$. Den $y$-Achsenabschnitt siehst du direkt an der Gleichung.',
  );
}

export function linSchnittpunkt(r) {
  const xs = r.int(-3, 6), ys = r.int(-4, 8), m1 = r.pick([-2, -1.5, -0.5, 0.5, 1, 1.5, 2, 3]), m2 = r.pick([-3, -1, -0.5, 0.5, 1, 2, 2.5]);
  if (m1 === m2) return null;
  const b1 = r6(ys - m1 * xs), b2 = r6(ys - m2 * xs);
  if (Math.abs(b1) > 12 || Math.abs(b2) > 12 || b1 === 0 || b2 === 0) return null;
  const bigger = m1 > m2 ? 'y₁' : 'y₂';
  return V(
    `Gegeben sind die Geraden $y_1=${lin(m1, b1)}$ und $y_2=${lin(m2, b2)}$.\n\na) Berechne die Koordinaten des Schnittpunkts.\n\nb) Welcher Funktionswert ist für $x>${de(xs)}$ größer?`,
    fields(num(xs, { label: 'a) x =' }), num(ys, { label: 'y =' }), sel(['y₁', 'y₂'], bigger, `b) Für x > ${dt(xs)} ist größer:`)),
    `a) Gleichsetzen: $${lin(m1, b1)}=${lin(m2, b2)} \\Rightarrow ${de(m1 - m2)}x=${de(b2 - b1)} \\Rightarrow x=${de(xs)}$\n\nEinsetzen: $y=${de(m1)}\\cdot${par(xs)}${b1 < 0 ? '-' : '+'}${de(Math.abs(b1))}=${de(ys)}$, also $S(${de(xs)}\\mid ${de(ys)})$.\n\nb) Die Gerade mit der **größeren Steigung** liegt rechts vom Schnittpunkt oben: $m_1=${de(m1)}$, $m_2=${de(m2)}$, also ist ${bigger} größer.`,
    'Zum Schnittpunkt: beide rechten Seiten gleichsetzen. Rechts vom Schnittpunkt liegt die steilere Gerade oben.',
  );
}

// ------------------------------------------------------------------ Lineare Gleichungssysteme (erw. RS)
const xy = (x, y) => fields(num(x, { label: 'x =' }), num(y, { label: 'y =' }));
const sysEq = (e1, e2) => `$$\\text{I}\\quad ${e1}\\qquad\\text{II}\\quad ${e2}$$`;
const gProbe = (a1, b1, c1, a2, b2, c2, x, y) => `**Probe:** I: $${de(a1)}\\cdot${par(x)}${b1 < 0 ? '-' : '+'}${de(Math.abs(b1))}\\cdot${par(y)}=${de(c1)}$ ✓ · II: $${de(a2)}\\cdot${par(x)}${b2 < 0 ? '-' : '+'}${de(Math.abs(b2))}\\cdot${par(y)}=${de(c2)}$ ✓`;

export function glsGleichsetzen(r) {
  const xs = r.int(-4, 8), ys = r.int(-6, 10), m1 = r.pick([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3]), m2 = r.pick([-3, -1, 0.25, 0.75, 1, 2]);
  if (m1 === m2 || xs === 0) return null;
  const b1 = r6(ys - m1 * xs), b2 = r6(ys - m2 * xs);
  if (Math.abs(b1) > 14 || Math.abs(b2) > 14) return null;
  return V(
    `Löse das Gleichungssystem mit dem **Gleichsetzungsverfahren**.\n\n${sysEq(`y=${lin(m1, b1)}`, `y=${lin(m2, b2)}`)}\n\nBerechne außerdem die Nullstelle der Geraden I.`,
    fields(num(xs, { label: 'x =' }), num(ys, { label: 'y =' }), num(r6(-b1 / m1), { label: 'Nullstelle von I:' })),
    `Gleichsetzen: $${lin(m1, b1)}=${lin(m2, b2)} \\Rightarrow ${de(m1 - m2)}x=${de(b2 - b1)} \\Rightarrow x=${de(xs)}$\n\nEinsetzen in I: $y=${de(m1)}\\cdot${par(xs)}${b1 < 0 ? '-' : '+'}${de(Math.abs(b1))}=${de(ys)}$\n\nDie Geraden schneiden sich im Punkt $S(${de(xs)}\\mid ${de(ys)})$.\n\nNullstelle von I: $0=${lin(m1, b1)} \\Rightarrow x=${de(-b1 / m1)}$`,
    'Beide Gleichungen sind nach $y$ aufgelöst: setze die rechten Seiten gleich. Bei der Nullstelle ist $y=0$.',
  );
}

export function glsEinsetzen(r) {
  const xs = r.int(-6, 8), ys = r.int(-5, 7), a = r.pick([2, 3, -2, -3, 4]), c0 = xs - a * ys, p = r.pick([3, 4, 5, -2, -3]), q = r.pick([2, 3, -2, -4, 5]);
  if (xs === 0 || ys === 0 || p * a + q === 0) return null;
  const c2 = p * xs + q * ys;
  return V(
    `Löse das Gleichungssystem mit dem **Einsetzungsverfahren**.\n\n${sysEq(`x=${lin(a, c0, 'y')}`, eq(p, q, c2))}`,
    xy(xs, ys),
    `I in II einsetzen: $${de(p)}\\cdot(${lin(a, c0, 'y')})${q < 0 ? '-' : '+'}${de(Math.abs(q))}y=${de(c2)}$\n\nAusmultiplizieren: $${de(p * a + q)}y${p * c0 < 0 ? '-' : '+'}${de(Math.abs(p * c0))}=${de(c2)}$, also $${de(p * a + q)}y=${de(c2 - p * c0)}$ und $y=${de(ys)}$\n\nEinsetzen in I: $x=${de(a)}\\cdot${par(ys)}${c0 < 0 ? '-' : '+'}${de(Math.abs(c0))}=${de(xs)}$\n\n${gProbe(1, -a, c0, p, q, c2, xs, ys)}`,
    'Gleichung I ist schon nach $x$ aufgelöst: setze den Term für $x$ in Gleichung II ein.',
  );
}

export function glsAddition(r) {
  const xs = r.int(-5, 8), ys = r.int(-5, 8), a1 = r.pick([2, 3, 4, 5]), b1 = r.pick([3, 4, 5, 6]), k = r.pick([2, 3]), a2 = r.pick([1, 2, 3, 5]);
  const b2 = -b1 / k; // nach Multiplikation von II mit k entgegengesetzt zu b1
  if (!Number.isInteger(b2) || xs === 0 || ys === 0 || a1 * b2 - a2 * b1 === 0) return null;
  const c1 = a1 * xs + b1 * ys, c2 = a2 * xs + b2 * ys;
  return V(
    `Löse das Gleichungssystem mit dem **Additionsverfahren**. (Multipliziere dazu eine Gleichung passend.)\n\n${sysEq(eq(a1, b1, c1), eq(a2, b2, c2))}`,
    xy(xs, ys),
    `Multipliziere II mit $${k}$: $\\text{II}'\\quad ${eq(k * a2, k * b2, k * c2)}$\n\nI + II$'$: $${de(a1 + k * a2)}x=${de(c1 + k * c2)} \\Rightarrow x=${de(xs)}$\n\nEinsetzen in I: $${de(a1)}\\cdot${par(xs)}${b1 < 0 ? '-' : '+'}${de(Math.abs(b1))}y=${de(c1)} \\Rightarrow y=${de(ys)}$\n\n${gProbe(a1, b1, c1, a2, b2, c2, xs, ys)}`,
    'Multipliziere eine der beiden Gleichungen so, dass beim Addieren eine Unbekannte wegfällt.',
  );
}

export function glsAnzahl(r) {
  const a = r.pick([2, 3, 4]), b = r.pick([1, 3, 5]), c = r.pick([6, 8, 12]), k = r.pick([2, 3]);
  const kind = r.pick(['keine', 'unendlich viele']);
  const c2 = kind === 'unendlich viele' ? k * c : k * c + r.pick([3, 5, 7]);
  const opts = ['genau eine Lösung', 'keine Lösung', 'unendlich viele Lösungen'];
  const ans = kind === 'keine' ? opts[1] : opts[2];
  return V(
    `Untersuche das Gleichungssystem.\n\n${sysEq(eq(a, b, c), eq(k * a, k * b, c2))}\n\nWie viele Lösungen hat das Gleichungssystem?`,
    fields(sel(opts, ans, 'Anzahl der Lösungen:')),
    `Gleichung II hat auf der linken Seite genau das $${k}$-fache von Gleichung I. Die rechte Seite von I mal $${k}$ wäre $${k * c}$.\n\n${kind === 'keine' ? `In II steht rechts aber $${c2}$. Das ist ein Widerspruch: Die Geraden sind **parallel**, es gibt **keine Lösung**.` : `In II steht rechts auch $${c2}=${k}\\cdot${c}$. Beide Gleichungen beschreiben dieselbe Gerade, es gibt **unendlich viele Lösungen**.`}`,
    'Vergleiche die Gleichungen: Ist die eine ein Vielfaches der anderen?',
  );
}

// Sachaufgaben: Gleichungssystem plus vertiefende Frage
export function glsSachEintritt(r) {
  const E = r.int(14, 32), K = r.int(6, 16), n = r.pick([2, 3]), m = r.pick([2, 3, 4]), e2 = r.pick([2, 3]), k2 = r.pick([3, 4, 5]);
  if (E <= K) return null;
  const c1 = n * E + K, c2 = E + m * K;
  const s = solve2(n, 1, c1, 1, m, c2);
  if (!s || s.x !== E) return null;
  return V(
    `Im Freizeitpark zahlt eine Familie für ${n} Erwachsene und 1 Kind $${de(c1, 0)}$ €. Eine andere Familie zahlt für 1 Erwachsenen und ${m} Kinder $${de(c2, 0)}$ €.\n\nStelle ein Gleichungssystem auf und löse es.\n\na) Wie viel kostet der Eintritt für einen Erwachsenen und für ein Kind?\n\nb) Wie viel zahlt eine Gruppe mit ${e2} Erwachsenen und ${k2} Kindern?`,
    fields(num(E, { label: 'a) Erwachsener:', unit: '€' }), num(K, { label: 'Kind:', unit: '€' }), num(e2 * E + k2 * K, { label: 'b) Gruppe:', unit: '€' })),
    `$x$: Preis Erwachsener, $y$: Preis Kind.\n\n$\\text{I}\\quad ${eq(n, 1, c1)}\\qquad\\text{II}\\quad ${eq(1, m, c2)}$\n\nI nach $y$ auflösen: $y=${c1}-${n}x$. Einsetzen in II: $x+${m}(${c1}-${n}x)=${c2}$, also $${de(1 - m * n)}x=${de(c2 - m * c1)}$ und $x=${E}$.\n\n$y=${c1}-${n}\\cdot${E}=${K}$\n\na) Ein Erwachsener zahlt **${E} €**, ein Kind **${K} €**.\n\nb) $${e2}\\cdot${E}+${k2}\\cdot${K}=${e2 * E + k2 * K}$ €`,
    'Wähle $x$ für den Erwachsenenpreis und $y$ für den Kinderpreis.',
  );
}

export function glsSachMischung(r) {
  const pa = r.pick([6, 7, 8, 9]), pb = r.pick([12, 13, 14, 15, 16]), total = r.pick([20, 30, 40, 50]);
  const mixP = r.pick([9, 10, 10.5, 11, 12]);
  const A = total * (pb - mixP) / (pb - pa), B = total - A;
  if (!(A > 0 && B > 0) || !Number.isInteger(r6(A))) return null;
  const sell = r.pick([1.2, 1.25, 1.3]), gain = r2(total * mixP * (sell - 1));
  return V(
    `Ein Händler mischt zwei Teesorten: Sorte A kostet $${pa}$ € pro kg, Sorte B kostet $${pb}$ € pro kg. Er möchte $${total}$ kg einer Mischung herstellen, bei der das kg $${de(mixP)}$ € kostet.\n\nStelle ein Gleichungssystem auf und löse es.\n\na) Wie viel kg von Sorte A und wie viel kg von Sorte B braucht er?\n\nb) Er verkauft die Mischung mit $${de(Math.round((sell - 1) * 100), 0)}\\,\\%$ Aufschlag auf den Einkaufspreis. Wie hoch ist sein Gewinn beim Verkauf der gesamten Mischung?`,
    fields(num(A, { label: 'a) Sorte A:', unit: 'kg' }), num(B, { label: 'Sorte B:', unit: 'kg' }), approx(gain, { label: 'b) Gewinn:', unit: '€', tol: 0.011 })),
    `$x$: kg von Sorte A, $y$: kg von Sorte B.\n\n$\\text{I}\\quad x+y=${total}\\qquad\\text{II}\\quad ${pa}x+${pb}y=${de(total * mixP)}$\n\nI nach $x$ auflösen: $x=${total}-y$. Einsetzen in II: $${pa}(${total}-y)+${pb}y=${de(total * mixP)}$, also $${pb - pa}y=${de(total * mixP - pa * total)}$ und $y=${de(B)}$.\n\n$x=${total}-${de(B)}=${de(A)}$\n\na) Er braucht **${de(A)} kg** von Sorte A und **${de(B)} kg** von Sorte B.\n\nb) Einkauf: $${total}\\cdot${de(mixP)}=${de(total * mixP)}$ €. Gewinn: $${de(total * mixP)}\\cdot${de(sell - 1, 2)}=${de(gain)}$ €`,
    'Eine Gleichung für die Menge, eine für den Preis.',
  );
}

export function glsSachTarif(r) {
  const gA = r.pick([5, 8, 10]), gB = gA + r.pick([10, 12, 15]), pA = r.pick([0.2, 0.25, 0.3]), dd = r.pick([0.05, 0.1]);
  const pB = r6(pA - dd), xs = r6((gB - gA) / dd);
  if (!Number.isInteger(xs) || xs < 50 || xs > 600 || pB <= 0) return null;
  const cost = r2(gA + pA * xs);
  const t = r.pick([xs - 40, xs + 60].filter((v) => v > 0)), cheaper = t < xs ? 'Tarif A' : 'Tarif B';
  return V(
    `Handytarif A kostet $${de(gA, 0)}$ € Grundgebühr im Monat plus $${de(pA)}$ € pro Gesprächsminute. Tarif B kostet $${de(gB, 0)}$ € Grundgebühr plus $${de(pB)}$ € pro Minute.\n\nStelle ein Gleichungssystem auf und löse es.\n\na) Bei wie vielen Minuten kosten beide Tarife gleich viel? Wie hoch sind dann die Kosten?\n\nb) Welcher Tarif ist bei $${t}$ Minuten günstiger?`,
    fields(num(xs, { label: 'a) Minuten:', unit: 'min' }), approx(cost, { label: 'Kosten:', unit: '€', tol: 0.011 }), sel(['Tarif A', 'Tarif B'], cheaper, `b) Bei ${t} Minuten ist günstiger:`)),
    `$x$: Minuten, $y$: Kosten in €.\n\n$\\text{I}\\quad y=${de(pA)}x+${de(gA, 0)}\\qquad\\text{II}\\quad y=${de(pB)}x+${de(gB, 0)}$\n\nGleichsetzen: $${de(pA)}x+${de(gA, 0)}=${de(pB)}x+${de(gB, 0)} \\Rightarrow ${de(pA - pB)}x=${de(gB - gA, 0)} \\Rightarrow x=${de(xs, 0)}$\n\n$y=${de(pA)}\\cdot${de(xs, 0)}+${de(gA, 0)}=${de(cost)}$\n\na) Bei **${de(xs, 0)} Minuten** kosten beide **${de(cost)} €**.\n\nb) Tarif A hat den höheren Minutenpreis, aber die kleinere Grundgebühr. Bei weniger als ${de(xs, 0)} Minuten ist **Tarif A** günstiger, bei mehr **Tarif B**. Bei ${t} Minuten ist **${cheaper}** günstiger.`,
    'Stelle für jeden Tarif eine Funktionsgleichung $y=mx+b$ auf und setze gleich.',
  );
}

export { distinct };
void table; void fieldsWith; void expr; void gcd;
