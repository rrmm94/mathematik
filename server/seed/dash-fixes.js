// Ersetzt Gedankenstriche in Texten durch einfachere Satzzeichen oder neue Formulierungen.
// Die Paare gelten für den Quelltext (Seeds) UND für bereits gespeicherte Inhalte in der Datenbank
// (Aufgaben, Skript, Pakete, Themen). Sie werden beim Serverstart angewendet; danach passiert nichts mehr.
import { all, run } from '../db.js';

export const FIXES = [
  // Benutzeroberfläche und Kurztexte in den Seeds
  [' Aufgaben zum Üben – jede auch mit neuen Zahlen', ' Aufgaben zum Üben, jede auch mit neuen Zahlen'],
  ['Beispielkurs – kann gelöscht werden', 'Beispielkurs, kann gelöscht werden'],
  ['Schau dir im Skript noch einmal das Beispiel an – dann klappt auch die letzte Aufgabe.', 'Schau dir im Skript noch einmal das Beispiel an, dann klappt auch die letzte Aufgabe.'],
  ['$y = 2x + 1$ – wo schneidet die Gerade die y-Achse?', 'Wo schneidet die Gerade $y = 2x + 1$ die y-Achse?'],
  // Themenbereich Zahlen, Zuordnungen, Gleichungen, Winkel (topics-a)
  ['$ – das ist eine andere Aufgabe!', '$. Das ist eine andere Aufgabe!'],
  ['**Je mehr, desto mehr** – und zwar im gleichen Verhältnis.', '**Je mehr, desto mehr**, und zwar im gleichen Verhältnis.'],
  ['**Je mehr, desto weniger** – im umgekehrten Verhältnis.', '**Je mehr, desto weniger**, und zwar im umgekehrten Verhältnis.'],
  [' – alle gleich → **proportional**.', '. Alle gleich, also **proportional**.'],
  [' – alle gleich → **antiproportional**.', '. Alle gleich, also **antiproportional**.'],
  ['immer gleich bleibt – also z. B. bei doppelter Lernzeit', 'immer gleich bleibt. Das hieße z. B. bei doppelter Lernzeit'],
  ['Eine Gleichung ist wie eine **Waage** – was du auf einer Seite machst, musst du auch auf der anderen Seite machen.', 'Eine Gleichung ist wie eine **Waage**: Was du auf einer Seite machst, musst du auch auf der anderen Seite machen.'],
  ['Gehe 1 nach rechts – wie viel nach oben/unten?', 'Wie viel musst du nach oben oder unten gehen, wenn du 1 nach rechts gehst?'],
  ['**kleiner als 180°** – deshalb können Nebenwinkel nie beide spitz sein.', '**kleiner als 180°**. Deshalb können Nebenwinkel nie beide spitz sein.'],
  ['$\\pi \\approx 3{,}14$ – nutze die $\\pi$-Taste deines Taschenrechners.', 'Nutze die $\\pi$-Taste deines Taschenrechners oder rechne mit $\\pi \\approx 3{,}14$.'],
  ['kleiner als 180° – sie können keine Nebenwinkel sein.', 'kleiner als 180° und können deshalb keine Nebenwinkel sein.'],
  // Themenbereich Körper, Pythagoras, Statistik (topics-b)
  ['Summe aller Flächen des Netzes – stell dir vor, du würdest', 'Summe aller Flächen des Netzes. Stell dir vor, du würdest'],
  ['Ein Quader hat 6 Flächen – je zwei sind gleich groß.', 'Ein Quader hat 6 Flächen, je zwei davon sind gleich groß.'],
  ['**Hypotenuse** – die längste Seite, sie liegt', '**Hypotenuse**. Das ist die längste Seite, sie liegt'],
  ['**Katheten** – sie bilden den rechten Winkel.', '**Katheten**. Sie bilden den rechten Winkel.'],
  ['**subtrahiert** – die Hypotenuse ist ja die längste Seite.', '**subtrahiert**, denn die Hypotenuse ist ja die längste Seite.'],
  ['Werte der Größe nach ordnen – der Wert in der **Mitte** ist der Median.', 'Werte der Größe nach ordnen. Der Wert in der **Mitte** ist der Median.'],
  [')$ – in der Klammer steht', ')$. In der Klammer steht'],
  ['$x^2 + px + q = 0$ – dann hilft die **p-q-Formel**:', '$x^2 + px + q = 0$. Dann hilft die **p-q-Formel**:'],
  // Grundlagen: Funktionen und Gleichungssysteme
  ['das Steigungsdreieck – oder zwei Punkte aus einer Wertetabelle.', 'das Steigungsdreieck. Du kannst auch zwei Punkte aus einer Wertetabelle nehmen.'],
  ['**Probe:** in I und II einsetzen – beide Gleichungen stimmen für', '**Probe:** in I und II einsetzen. Beide Gleichungen stimmen für'],
  ['Der Schnittpunkt liegt auf beiden Geraden – seine Koordinaten sind die Lösung.', 'Der Schnittpunkt liegt auf beiden Geraden. Seine Koordinaten sind die Lösung.'],
  ['Axel selbst ist ein Erwachsener – in beiden Besuchen!', 'Axel selbst ist ein Erwachsener, und zwar in beiden Besuchen!'],
  ['Dann stellst du zwei Gleichungen auf – ein **lineares Gleichungssystem**:', 'Dann stellst du zwei Gleichungen auf. Das ist ein **lineares Gleichungssystem**:'],
  ['($x$, $y$ – oder passende Buchstaben)', '($x$, $y$ oder passende Buchstaben)'],
  ['Normalform – lies $b$ und $m$ ab.', 'Normalform. Lies $b$ und $m$ ab.'],
  ['sind markiert – tippe sie an und zeichne die Gerade durch beide.', 'sind markiert. Tippe sie an und zeichne die Gerade durch beide.'],
  ['rechnerisch lösen – und Angebote vergleichen', 'rechnerisch lösen und Angebote vergleichen'],
  ['Vom Text zum Gleichungssystem – Rätsel, Preise, Eintritt', 'Vom Text zum Gleichungssystem: Rätsel, Preise, Eintritt'],
  ['Skiverleih – wann ist welches Angebot günstiger?', 'Skiverleih: Wann ist welches Angebot günstiger?'],
  // Grundlagen: Geometrie
  ['rechte Winkel bei $B$ – die Hypotenuse ist also $b$.', 'rechte Winkel bei $B$. Die Hypotenuse ist also $b$.'],
  ['in zwei Punkten – es gibt **zwei** (spiegelbildliche) Dreiecke.', 'in zwei Punkten. Es gibt also **zwei** (spiegelbildliche) Dreiecke.'],
  ['dem rechten Winkel gegenüber – hier ist es', 'dem rechten Winkel gegenüber. Hier ist es'],
  ['\\pi r s$ – die Seitenlinie $s$ ist die Hypotenuse', '\\pi r s$. Die Seitenlinie $s$ ist die Hypotenuse'],
  ['Die Kerze ist ein Kegel – Volumenformel des Kegels.', 'Die Kerze ist ein Kegel. Nutze die Volumenformel des Kegels.'],
  ['Original ist $k$ – die **Fläche** ändert sich mit $k^2$.', 'Original ist $k$. Die **Fläche** ändert sich mit $k^2$.'],
  ['Ein Dreieck im Dreieck – Längen berechnen', 'Ein Dreieck im Dreieck: Längen berechnen'],
  ['zeichnen – der Schnittpunkt mit dem Thaleskreis ist $C$.', 'zeichnen. Der Schnittpunkt mit dem Thaleskreis ist $C$.'],
  // Grundlagen: Daten, Wachstum, Zahlen und Prozent
  ['Anteil mal $360^\\circ$ – z. B. $40', 'Anteil mal $360^\\circ$, z. B. $40'],
  ['Zufallsversuch – die tatsächlichen Häufigkeiten schwanken', 'Zufallsversuch, die tatsächlichen Häufigkeiten schwanken'],
  ['linear – in gleichen Zeitspannen kommt immer derselbe Betrag dazu', 'linear: In gleichen Zeitspannen kommt immer derselbe Betrag dazu'],
  ['exponentiell – in gleichen Zeitspannen wird immer mit demselben Faktor multipliziert', 'exponentiell: In gleichen Zeitspannen wird immer mit demselben Faktor multipliziert'],
  ['**exponentiell** – „vervielfachen“ heißt:', '**exponentiell**, denn „vervielfachen“ heißt:'],
  ['**linear** – jeden Monat kommen gleich viele (10) dazu.', '**linear**, denn jeden Monat kommen gleich viele (10) dazu.'],
  ['**exponentiell** – Zunahme um einen festen Prozentsatz', '**exponentiell**, denn Zunahme um einen festen Prozentsatz'],
  ['**linear** – jede Stunde werden gleich viele Liter', '**linear**, denn jede Stunde werden gleich viele Liter'],
  ['**exponentiell** – 15 % Wertzuwachs pro Jahr', '**exponentiell**, denn 15 % Wertzuwachs pro Jahr'],
  ['nach rechts – der Exponent ist negativ.', 'nach rechts. Der Exponent ist dann negativ.'],
  ['ohne Zehnerpotenz auf – dann siehst du sofort', 'ohne Zehnerpotenz auf. Dann siehst du sofort'],
  ['beziehen sich auf den Ertrag vorher – das ist der Grundwert.', 'beziehen sich auf den Ertrag vorher. Das ist der Grundwert.'],
  ['aus – das ist der Prozentwert $W=', 'aus. Das ist der Prozentwert $W='],
  ['Große und kleine Zahlen als Zehnerpotenz – und zurück', 'Große und kleine Zahlen als Zehnerpotenz und zurück'],
  // Aus den Prüfungsvarianten
  ['Rechne Schritt für Schritt – Klammern zuerst, Punkt vor Strich:', 'Rechne Schritt für Schritt: Klammern zuerst, dann Punkt vor Strich.'],
  ['gezogen wird – bei der zweiten muss derselbe gezogen werden:', 'gezogen wird: Bei der zweiten muss derselbe gezogen werden:'],
];

// Titel: " – " trennt Thema und Teilaufgabe, Bereiche wie "a–d" werden ausgeschrieben
const TITLE_RULES = [
  [/ – /g, ' · '],
  [/(\d) ([a-z])–([a-z]):/g, '$1 $2 bis $3:'],
];

const TEXT_COLUMNS = [
  ['task_variants', ['prompt', 'context', 'solution', 'hint', 'answer']],
  ['script_sections', ['title', 'blocks']],
  ['packages', ['title', 'description']],
  ['topics', ['description', 'example', 'keywords']],
  ['tasks', ['title']],
  ['courses', ['description']],
];

export function applyDashFixes() {
  let changed = 0;
  for (const [table, cols] of TEXT_COLUMNS) {
    for (const col of cols) {
      for (const [from, to] of FIXES) {
        // JSON-Spalten (Skript, Antworten) speichern Backslashes doppelt
        for (const [a, b] of [[from, to], [from.replaceAll('\\', '\\\\'), to.replaceAll('\\', '\\\\')]]) {
          const info = run(`UPDATE ${table} SET ${col} = replace(${col}, ?, ?) WHERE instr(${col}, ?) > 0`, a, b, a);
          changed += Number(info.changes || 0);
        }
      }
    }
  }
  for (const table of ['tasks', 'packages', 'script_sections']) {
    for (const row of all(`SELECT id, title FROM ${table} WHERE title LIKE '%–%'`)) {
      let t = row.title;
      for (const [re, to] of TITLE_RULES) t = t.replace(re, to);
      if (t !== row.title) { run(`UPDATE ${table} SET title = ? WHERE id = ?`, t, row.id); changed++; }
    }
  }
  if (changed) console.log(`Texte ohne Gedankenstriche umformuliert: ${changed}`);
}
