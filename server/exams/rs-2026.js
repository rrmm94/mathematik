// Abschlussprüfung Mathematik 2026, Niedersachsen, Schuljahrgang 10, Version E-Kurs/RS (Realschule).
// Grundlage: die von Serlo importierten Aufgaben (server/seed/exams/data/rs-2026-*.json, CC BY-SA 4.0).
//
// Hier wird die Prüfung vollständig und in der Originalreihenfolge abgebildet:
// - Punkte je Teilaufgabe wie im Original („[n Pkt]“ bei Serlo),
// - Aufgaben mit eindeutigem Ergebnis werden automatisch bewertet (answer),
// - Zeichnen, Begründen, Formeln aufstellen: Bearbeitung auf Papier, nach der Abgabe vergleicht das Kind mit der
//   Musterlösung und schätzt seine Punkte selbst ein (self),
// - Teil 1 und Teil 2 haben bei Serlo noch keine Lösungen: die Musterlösungen unten sind ergänzt.
//
// Schlüssel: Teil|Aufgabe|Teilaufgabe (z. B. „teil1|3|a)“).

const num = (value, extra = {}) => ({ label: '', kind: 'number', value, tolerance: 0, unit: '', alternatives: [], ...extra });
const fields = (...parts) => ({ type: 'fields', inline: true, parts });
const prob = (value, extra = {}) => num(value, { prob: true, tolerance: 0.0005, ...extra });

export const RS_2026 = {
  key: 'rs-2026',
  profiles: ['RS10', 'ERS10'],
  year: 2026,
  title: 'Realschulabschlussprüfung 2026',
  subtitle: 'Mathematik · Schuljahrgang 10 · Version E-Kurs/RS',
  date: '18.05.2026',
  source: 'Aufgaben: Niedersächsisches Kultusministerium. Digitale Fassung: Serlo (de.serlo.org, CC BY-SA 4.0). Musterlösungen zu Hauptteil 1 und 2 ergänzt.',
  files: { teil1: 'rs-2026-teil1.json', teil2: 'rs-2026-teil2.json', wahl: 'rs-2026-wahlteil.json' },

  // Punkte je Teilaufgabe in Originalreihenfolge (aus den Serlo-Seiten 334270, 334271, 335752)
  points: {
    teil1: [[1, 1, 1, 1], [2], [1, 2, 1], [2, 2, 2], [2, 1], [1, 3, 1], [2, 1, 1]],
    teil2: [[2, 2, 2, 1], [1, 2, 3], [1, 2, 3, 2], [2, 4, 2], [2, 2, 3]],
    wahl: [[2, 2, 3, 2, 1], [1, 2, 4, 2, 1], [1, 5, 3, 1], [2, 3, 1, 4]],
  },

  overrides: {
    // ------------------------------------------------------------ Hauptteil 1
    'teil1|1|a)': { solution: '$-7+30=23$' },
    'teil1|1|b)': { solution: '$11{,}5+2{,}35=13{,}85$' },
    'teil1|1|c)': { solution: '$0{,}8\\cdot 4=3{,}2$' },
    'teil1|1|d)': { solution: 'Punkt- vor Strichrechnung: $15+5\\cdot 9=15+45=60$' },
    'teil1|2|': {
      answer: fields(num(50, { tolerance: 1 })),
      solution: 'Überschlag: $402{,}10\\,€\\approx 400\\,€$ und $7{,}98\\,€\\approx 8\\,€$.\n\n$400 : 8 = 50$, also kann Herr Gerdes **ungefähr 50 Zirkel** kaufen.',
    },
    'teil1|3|a)': {
      prompt: '![Abbildung](/uploads/ex-8265f1e00661.png)\n\nDie Tabelle zeigt den Fahrplan des Zuges RE 30 von Hannover nach Wolfsburg.\n\nDer Zug benötigt 9 Minuten von Hannover nach Lehrte.\n\nGib die Ankunftszeit in Lehrte an (Tabellenfeld „Lehrte an“).\n\nAnkunft in Lehrte: ⟦1⟧ Uhr',
      answer: fields({ label: '', kind: 'text', value: '09:57', alternatives: ['9:57', '09.57', '9.57', '0957', '957'], placeholder: 'hh:mm' }),
      solution: 'Abfahrt in Hannover 09:48 Uhr, plus 9 Minuten: **Ankunft in Lehrte 09:57 Uhr**.',
    },
    'teil1|3|b)': {
      answer: fields(num(27), { label: '', kind: 'text', value: '11:13', alternatives: ['11.13', '11:13 uhr', '1113'], placeholder: 'hh:mm' }),
      solution: 'Lehrte ab 09:58 Uhr, Gifhorn an 10:25 Uhr: **27 Minuten**.\n\nPlanmäßige Ankunft in Wolfsburg 10:46 Uhr, plus 27 Minuten: **11:13 Uhr**.',
    },
    'teil1|3|c)': {
      self: true,
      solution: 'An den waagerechten Stellen ändert sich die Fahrstrecke nicht, obwohl die Zeit weiterläuft: **Der Zug hält dort an einem Bahnhof** (Lehrte, Meinersen, Gifhorn, Fallersleben).',
    },
    'teil1|4|a)': { solution: '$35\\,\\%$ von $400$: $\\;400\\cdot 0{,}35 = 140$ (oder: $10\\,\\% = 40$, also $35\\,\\% = 3{,}5\\cdot 40 = 140$).\n\nEs kommen **140** Schülerinnen und Schüler mit dem Fahrrad.' },
    'teil1|4|b)': {
      prompt: 'Drei Schülerinnen haben Prozentsätze in einem Prozentstreifen grau dargestellt.\n\n![Abbildung](/uploads/ex-c9d44c83ba7f.png)\n\nEntscheide, welche Schülerin $35\\,\\%$ dargestellt hat. Begründe deine Entscheidung (auf Papier).',
      answer: { type: 'choice', multiple: false, options: [{ text: 'Maria', correct: false }, { text: 'Franka', correct: false }, { text: 'Ayse', correct: true }] },
      autoPoints: 1,
      self: { points: 1, label: 'Begründung' },
      solution: '**Ayse.** Begründung: $35\\,\\%$ ist etwas mehr als ein Drittel ($33{,}3\\,\\%$). Bei Ayse ist etwas mehr als ein Drittel des Streifens grau. Bei Maria ist es mehr als die Hälfte (etwa $60\\,\\%$), bei Franka nur etwa ein Fünftel ($20\\,\\%$).',
    },
    'teil1|4|c)': { solution: '$40\\,\\% \\;\\hat=\\; 120$ Kinder, also $10\\,\\% \\;\\hat=\\; 30$ Kinder und $100\\,\\% \\;\\hat=\\; 300$ Kinder.\n\nDie Schule besuchen **300** Kinder.' },
    'teil1|5|a)': { solution: '$15\\cdot 8 = 120$ Äpfel, $\\;120 : 6 = 20$.\n\nMan benötigt **20 Tüten**.' },
    'teil1|5|b)': {
      self: true,
      solution: '$130 : 9 = 14$ Rest $4$ (denn $14\\cdot 9 = 126$ und $15\\cdot 9 = 135$). Die Birnen lassen sich **nicht vollständig** in Tüten mit je 9 Birnen verpacken, es bleiben 4 Birnen übrig.',
    },
    'teil1|6|a)': {
      prompt: 'Ein Dreieck ABC soll gezeichnet werden. Die Strecke $\\overline{A B}$ ist vorgegeben.\n\n![Abbildung](/uploads/ex-d529b72f8ef7.png)\n\nMiss die Länge der Strecke $\\overline{\\mathrm{AB}}$.\n\n*Hinweis: Am Bildschirm ist die Zeichnung nicht maßstabsgetreu. Im Original ist die Strecke so lang, wie in der Musterlösung angegeben. Zeichne sie für Teilaufgabe b) auf dein Papier.*',
      answer: undefined,
      self: true,
      solution: '$\\overline{\\mathrm{AB}} = 4{,}3\\,\\mathrm{cm}$ (gemessen am Originalausdruck, $\\pm 1\\,\\mathrm{mm}$).',
    },
    'teil1|6|b)': {
      self: true,
      solution: 'Strecke $\\overline{AB} = 4{,}3\\,\\mathrm{cm}$ zeichnen. In A den Winkel $\\alpha = 110^\\circ$ antragen, in B den Winkel $\\beta = 25^\\circ$ antragen (beide auf derselben Seite von $\\overline{AB}$). Der Schnittpunkt der beiden Schenkel ist C.\n\nBewertung: je 1 Punkt für $\\alpha$ und $\\beta$ (Genauigkeit $\\pm 1^\\circ$), 1 Punkt für die Beschriftung aller Winkel (auch $\\gamma$).',
    },
    'teil1|6|c)': { solution: 'Winkelsumme im Dreieck: $\\gamma = 180^\\circ - 110^\\circ - 25^\\circ = 45^\\circ$.' },
    'teil1|7|a)': {
      self: true,
      solution: 'Der Würfel hat zweimal Stern (S), einmal Kreis (K) und dreimal Batterie (B). Es fehlen die Kombinationen\n\n| 1. Wurf | K | B | B | B |\n|---|---|---|---|---|\n| 2. Wurf | K | S | K | B |\n\n(1 Punkt für drei richtige, 2 Punkte für alle vier fehlenden Kombinationen.)',
    },
    'teil1|7|b)': {
      self: true,
      solution: 'Der Kreis gehört in das **letzte Feld der mittleren Reihe** (rechts neben der Batterie, über dem einzelnen unteren Feld).\n\nBegründung: Alle Batterien zeigen mit dem Pluspol zum mittleren Stern. In Mias Netz zeigen die Batterien zum zweiten Feld der Reihe, dort liegt also dieser Stern. Gegenüber von ihm (zwei Felder weiter) liegt der Kreis. Im unteren Feld liegt der zweite Stern.',
    },
    'teil1|7|c)': {
      prompt: 'Kreuze die beiden Abbildungen an, die diesen Würfel darstellen.\n\n![Abbildung](/uploads/ex-f5d6b1f5ab9a.png)',
      answer: { type: 'choice', multiple: true, options: [{ text: 'Abbildung 1 (links)', correct: false }, { text: 'Abbildung 2', correct: true }, { text: 'Abbildung 3', correct: false }, { text: 'Abbildung 4 (rechts)', correct: true }] },
      solution: '**Abbildung 2 und Abbildung 4.**\n\nAbbildung 1 ist falsch: Zwei der drei Batterien liegen auf dem Würfel gegenüber, man kann nie drei Batterien gleichzeitig sehen. Abbildung 3 ist falsch: Die Batterien zeigen mit dem Pluspol zum mittleren Stern, also vom Kreis weg (der Kreis liegt dem Stern gegenüber), nicht zum Kreis hin.',
    },

    // ------------------------------------------------------------ Hauptteil 2
    'teil2|1|a)': {
      answer: fields({ label: '', kind: 'text', value: 'Fitness', alternatives: [] }, num(21)),
      solution: 'Der größte Anteil ist **Fitness** ($35\\,\\%$).\n\nNordic Walking: $100\\,\\% - 35\\,\\% - 25\\,\\% - 11\\,\\% - 8\\,\\% = 21\\,\\%$.',
    },
    'teil2|1|b)': {
      prompt: 'Berechne die Anzahl der befragten Frauen, die am liebsten Yoga betreiben.\n\nAm liebsten Yoga betreiben ⟦1⟧ Frauen.',
      answer: fields(num(1488)),
      solution: '$8\\,\\%$ von $18\\,600$: $\\;18\\,600\\cdot 0{,}08 = 1\\,488$.\n\n**1 488 Frauen** betreiben am liebsten Yoga.',
    },
    'teil2|1|c)': {
      prompt: '![Abbildung](/uploads/ex-6caad2b3170f.png)\n\nBerechne zuerst die Winkelgrößen in der Tabelle.\n\n![Abbildung](/uploads/ex-c586a18ea0ff.png)\n\nFußball: ⟦1⟧ °  Basketball: ⟦2⟧ °\n\nZeichne die fehlende Unterteilung in das Kreisdiagramm ein (auf Papier).',
      answer: fields(num(90), num(54)),
      autoPoints: 1,
      self: { points: 1, label: 'Zeichnung' },
      solution: 'Fußball: $25\\,\\%$ von $360^\\circ = 90^\\circ$. Basketball: $15\\,\\%$ von $360^\\circ = 0{,}15\\cdot 360^\\circ = 54^\\circ$.\n\nIm Kreisdiagramm fehlt die Grenze zwischen Fußball und Basketball: Von der senkrechten Linie oben aus $54^\\circ$ (Basketball) bzw. $90^\\circ$ (Fußball) abtragen.',
    },
    'teil2|1|d)': {
      self: true,
      solution: 'Die Behauptung lässt sich so **nicht belegen**. Zwar ist der Anteil beim Joggen bei den Männern größer ($35\\,\\%$ gegenüber $25\\,\\%$), aber es ist nicht bekannt, wie viele Männer befragt wurden. Prozentangaben mit unterschiedlichen Grundwerten kann man nicht direkt als Anzahlen vergleichen.',
    },
    'teil2|2|a)': {
      prompt: 'Das Baumdiagramm zeigt die Wahrscheinlichkeiten für das Erscheinen der Hindernisse.\n\n![Abbildung](/uploads/ex-ec0d212f77c7.png)\n\nGib die fehlende Wahrscheinlichkeit im Kreis an.\n\nP(Blitz) = ⟦1⟧',
      answer: fields(prob(0.05, { alternatives: [] })),
      solution: '$1 - \\frac{4}{5} - \\frac{3}{20} = \\frac{20}{20} - \\frac{16}{20} - \\frac{3}{20} = \\frac{1}{20}\\;(=0{,}05 = 5\\,\\%)$',
    },
    'teil2|2|b)': {
      prompt: '„Super Marion“ trifft nacheinander auf zwei Hindernisse.\n\nBerechne die Wahrscheinlichkeit, dass „Super Marion“ zuerst auf eine Wolke (W) und dann auf einen Stein (S) trifft.\n\nP(W, S) = ⟦1⟧',
      answer: fields(prob(0.12)),
      solution: 'Pfadregel (multiplizieren): $P(W,S) = \\frac{4}{5}\\cdot\\frac{3}{20} = \\frac{12}{100} = 0{,}12 = 12\\,\\%$',
    },
    'teil2|2|c)': {
      prompt: 'Berechne die Wahrscheinlichkeit, dass sie auf zwei gleiche Hindernisse trifft.\n\n(Wenn du die Teilaufgabe a) nicht gelöst hast, dann rechne mit $\\frac{2}{20}$ weiter.)\n\nP(zwei gleiche) = ⟦1⟧',
      answer: fields(prob(0.665, { alternatives: [0.6725] })),
      solution: 'Summenregel über die Pfade WW, SS und BB:\n\n$P = \\left(\\frac{4}{5}\\right)^2 + \\left(\\frac{3}{20}\\right)^2 + \\left(\\frac{1}{20}\\right)^2 = 0{,}64 + 0{,}0225 + 0{,}0025 = 0{,}665 = 66{,}5\\,\\%$\n\n(Mit $\\frac{2}{20}$ für den Blitz: $0{,}64 + 0{,}0225 + 0{,}01 = 0{,}6725$.)',
    },
    'teil2|3|a)': { solution: 'Der Scheitelpunkt liegt bei $S(2\\,|\\,-3)$ und die Parabel ist nach oben geöffnet: $y_1 = (x-2)^2 - 3$.' },
    'teil2|3|b)': {
      prompt: 'Die Funktion $\\mathrm{y}_{2}$ hat die Gleichung $\\mathrm{y}_{2} = (x+1)^2 - 4$.\n\nZeichne den Graphen der Funktion $\\mathrm{y}_{2}$ in das Koordinatensystem ein (auf Papier).\n\n*(Bei Serlo fehlt die Gleichung von $\\mathrm{y}_2$; sie ergibt sich aus Murats Rechnung in Teilaufgabe c).)*',
      self: true,
      solution: 'Normalparabel mit dem Scheitelpunkt $S(-1\\,|\\,-4)$, nach oben geöffnet. Weitere Punkte: $(0\\,|\\,-3)$, $(1\\,|\\,0)$, $(-3\\,|\\,0)$, $(2\\,|\\,5)$, $(-4\\,|\\,5)$.\n\n(1 Punkt für den Scheitelpunkt, 1 Punkt für die richtige Form/Öffnung.)',
    },
    'teil2|3|c)': {
      prompt: 'Murat soll die Nullstellen der Funktion $\\mathrm{y}_{2}$ berechnen. Er beginnt seine Rechnung so:\n\n![Abbildung](/uploads/ex-d0e3f44becf1.png)\n\nBeende Murats Rechnung.\n\n$x_1 =$ ⟦1⟧  und  $x_2 =$ ⟦2⟧',
      answer: { ...fields(num(1), num(-3)), unordered: true },
      solution: '$0 = (x+1)^2 - 4 \\;\\Rightarrow\\; (x+1)^2 = 4 \\;\\Rightarrow\\; x+1 = 2$ oder $x+1 = -2$\n\n$x_1 = 1$, $\\;x_2 = -3$',
    },
    'teil2|3|d)': {
      self: true,
      solution: 'Zum Beispiel $y_3 = (x+1)^2$ oder $y_3 = (x+1)^2 + 2$: Die Parabel hat dieselbe Form und Öffnung wie $y_2$, ist aber nach oben verschoben, also schneiden sich die Graphen nie.\n\nEs gibt mehrere Möglichkeiten, weil man $y_2$ um jeden beliebigen Wert nach oben verschieben kann (z. B. auch $y_3 = -(x-5)^2 - 10$ als nach unten geöffnete Parabel, die unterhalb liegt).',
    },
    'teil2|4|a)': {
      prompt: 'Die Größe der kreisförmigen Fläche (1) beträgt $346,36 \\mathrm{~cm}^{2}$.\n\nBerechne den Radius r.\n\n$r \\approx$ ⟦1⟧ cm',
      answer: fields(num(10.5, { tolerance: 0.05 })),
      solution: '$A = \\pi\\cdot r^2 \\;\\Rightarrow\\; r^2 = \\frac{346{,}36}{\\pi} \\approx 110{,}25 \\;\\Rightarrow\\; r \\approx 10{,}5\\,\\mathrm{cm}$',
    },
    'teil2|4|b)': {
      prompt: 'Berechne den Flächeninhalt der Fläche (2).\n\n*(Fläche (2) ist ein Dreiviertel-Kreisring: Die Öffnung oben ist ein Viertel des Rings.)*\n\n$A_2 \\approx$ ⟦1⟧ $\\mathrm{cm}^2$',
      answer: fields(num(191.44, { tolerance: 0.6 })),
      solution: 'Außenradius $r_a = 35 : 2 = 17{,}5\\,\\mathrm{cm}$, Innenradius $r_i = 30 : 2 = 15\\,\\mathrm{cm}$.\n\nGanzer Kreisring: $\\pi\\cdot(17{,}5^2 - 15^2) = \\pi\\cdot 81{,}25 \\approx 255{,}25\\,\\mathrm{cm}^2$\n\nFläche (2) ist drei Viertel davon: $A_2 = \\frac{3}{4}\\cdot 255{,}25 \\approx 191{,}44\\,\\mathrm{cm}^2$',
    },
    'teil2|4|c)': {
      self: true,
      solution: '$A_2 = \\frac{3}{4}\\cdot\\pi\\cdot\\left(r_a^2 - r_i^2\\right)$ (gleichwertig: $A_2 = \\frac{270^\\circ}{360^\\circ}\\cdot\\pi\\cdot r_a^2 - \\frac{270^\\circ}{360^\\circ}\\cdot\\pi\\cdot r_i^2$)',
    },
    'teil2|5|a)': {
      prompt: 'Die Spitze eines Spielgerätes ist von außen mit vier gleichen Blech-Dreiecken verkleidet. Das Blech soll erneuert werden.\n\n![Abbildung](/uploads/ex-57e746003315.png)\n\nBerechne den Blechbedarf in $\\mathrm{m}^{2}$.\n\nBlechbedarf: ⟦1⟧ $\\mathrm{m}^2$',
      answer: fields(num(0.588, { tolerance: 0.005 })),
      solution: 'Ein Dreieck: $A = \\frac{g\\cdot h}{2} = \\frac{0{,}35\\cdot 0{,}84}{2} = 0{,}147\\,\\mathrm{m}^2$\n\nVier Dreiecke: $4\\cdot 0{,}147 = 0{,}588\\,\\mathrm{m}^2$',
    },
    'teil2|5|b)': {
      prompt: 'Die Skizze und das Foto zeigen das komplette Spielgerät. Es hat die Form einer Pyramide mit quadratischer Grundfläche.\n\n![Abbildung](/uploads/ex-3a97ae538de2.png)\n\nBerechne die Länge der Diagonalen d.\n\n$d \\approx$ ⟦1⟧ m',
      answer: fields(num(2.57, { tolerance: 0.01 })),
      solution: 'Satz des Pythagoras im Quadrat: $d^2 = a^2 + a^2 = 2\\cdot 1{,}82^2 = 6{,}6248 \\;\\Rightarrow\\; d \\approx 2{,}57\\,\\mathrm{m}$',
    },
    'teil2|5|c)': {
      prompt: 'Die Größe des Winkels $\\alpha$ beträgt 73°.\n\nBerechne die Länge s.\n\n(Wenn du die Teilaufgabe b) nicht gelöst hast, dann rechne mit $\\mathrm{d}=2,53 \\mathrm{~m}$ weiter.)\n\n$s \\approx$ ⟦1⟧ m',
      answer: fields(num(4.40, { tolerance: 0.02, alternatives: [4.33] })),
      solution: 'Im rechtwinkligen Dreieck aus halber Diagonale, Höhe und Kante s ist $\\frac{d}{2}$ die Ankathete von $\\alpha$:\n\n$\\cos(73^\\circ) = \\frac{d/2}{s} \\;\\Rightarrow\\; s = \\frac{1{,}287}{\\cos(73^\\circ)} \\approx \\frac{1{,}287}{0{,}2924} \\approx 4{,}40\\,\\mathrm{m}$\n\n(Mit $d = 2{,}53\\,\\mathrm{m}$: $s \\approx 4{,}33\\,\\mathrm{m}$.)',
    },

    // ------------------------------------------------------------ Wahlteil
    'wahl|1|a)': { self: true },
    'wahl|1|b)': { prompt: 'Berechne die Wahrscheinlichkeit, dass Jan zuerst Ristretto (R) und dann Espresso (E) zieht.\n\nP(R, E) = ⟦1⟧', answer: fields(prob(2 / 77)) },
    'wahl|1|c)': { prompt: 'Jan mag keinen Espresso.\n\nBerechne die Wahrscheinlichkeit, dass Jan zweimal keinen Espresso zieht.\n\nP = ⟦1⟧', answer: fields(prob(10 / 11)) },
    'wahl|1|d)': { self: true },
    'wahl|1|e)': { prompt: 'Gib an, wie oft Jan maximal ins Gefäß greifen muss, bis er einen Ristretto (R) zieht.\n\nMaximal ⟦1⟧ mal', answer: fields(num(11)) },
    'wahl|2|b)': { self: true },
    'wahl|2|c)': { self: true },
    'wahl|2|d)': { prompt: 'Die Flugbahn eines anderen Golfballes hat folgende Funktionsgleichung:\n\n$y_3=-0,004\\cdot(x-95)^2+35$\n\nEin $22\\m$ hoher Baum steht $45\\m$ vom Koordinatenursprung entfernt.\n\nZeige rechnerisch, dass der Golfball den Baum nicht trifft.', self: true },
    'wahl|2|e)': { dropImages: ['ex-ac49993506a1'] },
    'wahl|3|a)': { prompt: 'Berechne die Höhe $\\mathrm{h}_{\\mathrm{k}}$ des Kegels.\n\n$h_k =$ ⟦1⟧ cm', answer: fields(num(107, { tolerance: 0.5 })) },
    'wahl|3|b)': { answer: fields(num(42123.77, { tolerance: 15, alternatives: [41808.34] })) },
    'wahl|3|c)': { answer: fields(num(353.13, { tolerance: 0.6, alternatives: [346.53] })) },
    'wahl|3|d)': { solution: 'Das Volumen der Halbkugel ist $V = \\frac{2}{3}\\pi r^3$. Der Radius geht hoch drei ein: Verdreifacht sich $r$, wird das Volumen $3^3 = 27$-mal so groß.' },
    'wahl|4|a)': { self: true },
    'wahl|4|b)': { answer: fields(num(191.07, { tolerance: 0.1 })), solution: '$\\sin(\\alpha) = \\frac{h}{g} \\;\\Rightarrow\\; g = \\frac{10}{\\sin(3^\\circ)} \\approx \\frac{10}{0{,}0523} \\approx 191{,}07\\,\\mathrm{km}$' },
    'wahl|4|c)': { answer: fields(num(168)) },
    'wahl|4|d)': { answer: fields(num(253.95, { tolerance: 0.3, alternatives: [254.1] })) },
  },
};
