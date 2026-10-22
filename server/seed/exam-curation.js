// Kuratierung der Originalaufgaben aus den Abschlussprüfungen für die Bearbeitung am Bildschirm (iPad).
//
// 1. digitalProblem(): erkennt Aufgaben, die sich am Bildschirm nicht sinnvoll lösen lassen
//    (am Bild ankreuzen/ergänzen und darunter Freitext, Texteingaben, die nicht automatisch prüfbar sind …).
// 2. polish(): macht aus dem Prüfungstext eine Bildschirmaufgabe (Ja/Nein und Wörter als Auswahl, y = m·x + b als zwei
//    Zahlenfelder, „Notiere deinen Rechenweg“ und Punktangaben entfernen …).
// 3. FIXES: Korrekturen einzelner Aufgaben (falsches Thema, falscher Kontext, zusätzliche Bilder …).
// 4. DIAG_PICKS: welche Originalaufgaben im Einstiegstest vorkommen – je Abschlussgruppe, Thema und Schwierigkeit (1 leicht … 3 schwer).
//
// Schlüssel einer Aufgabe: Schule|Jahr|Teil|Aufgabe|Teilaufgabe, z. B. „rs|2025|Teil 2|3|a)“ (siehe keyOf).

export const keyOf = (t) => [t.school, t.year, t.part, t.no, t.label || ''].join('|');

const IMG = /!\[[^\]]*\]\([^)]+\)/;
const IMG_G = /!\[[^\]]*\]\([^)]+\)/g;
const DRAW = /(\bzeichne\b|\bzeichnen\b|\bmiss\b|\bmesse\b|verbinde|markiere|einzeichn|skizzier|färbe|schraffier|spiegel|konstruier|trage\b[^.\n]{0,80}\bein\b|ordne\b[^.\n]{0,40}\bzu\b|kreuze\b[^.\n]{0,60}\b(abbildung|bild|würfel|netz)|vervollständige\b[^.\n]{0,60}\b(tabelle|baumdiagramm|zeichnung|koordinatensystem|graph|diagramm|figur|muster)|ergänze\b[^.\n]{0,60}\b(tabelle|baumdiagramm|zeichnung|koordinatensystem|graph|diagramm|figur|muster|wertetabelle))/i;

// Warum eine Aufgabe am Bildschirm nicht sinnvoll lösbar ist (oder null).
export function digitalProblem(t) {
  const text = `${t.context}\n${t.prompt}`;
  // Verweis auf eine Abbildung, die nur bei einer anderen Teilaufgabe der Prüfungsaufgabe steht
  const noImages = text.replace(IMG_G, '');
  if (/abgebildet|abbildung|grafik|diagramm|skizze(?! nicht)|foto\b|\bgraph(en)?\b|schaubild|baumdiagramm/i.test(noImages) && !IMG.test(text) && !/(^|\n)\|/.test(text)) return 'Abbildung fehlt (steht bei einer anderen Teilaufgabe)';
  if (t.answer.type === 'free') {
    if (IMG.test(t.prompt)) return 'Bild gehört zur Antwort (ankreuzen/ergänzen)';
    if (DRAW.test(text)) return 'Antwort müsste gezeichnet/eingetragen werden';
    if (/Rechenweg\s*:?\s*$/i.test(t.prompt.trim())) return 'Rechenweg auf Papier';
    const bare = t.prompt.replace(/^\*\*[a-z]\)\*\*\s*/i, '').replace(/[\s.]+/g, ' ').trim();
    if (bare.length < 60) return 'Aufgabe ist ohne die vorherigen Teilaufgaben nicht verständlich';
    if (/zeichnerisch|funktionsgleichung|gleichung (der|für|in)|\bformel\b|scheitelpunktform|term\b.*\b(an|auf)\b|passendes ereignis|ereignis an|y\s*=\s*$/i.test(t.prompt)) return 'Gleichung/Formel müsste frei eingetippt werden';
  } else if (/(\bzeichne\b|\bzeichnen\b|\bmiss\b|\bmesse\b|einzeichn|verbinde|spiegel)/i.test(text)) {
    return 'Zeichnen/Messen';
  }
  if (t.answer.type === 'fields') {
    const texts = (t.answer.parts || []).filter((p) => p.kind === 'text');
    if (texts.length) return 'Texteingabe nicht automatisch prüfbar';
  }
  return null;
}

// ---------------------------------------------------------------- Aufbereitung
const YESNO = [{ text: 'Ja' }, { text: 'Nein' }];
const CHOICE_WORDS = [
  [/^(ja|nein)$/i, () => [{ text: 'Ja' }, { text: 'Nein' }]],
  [/^(rechtwinkliges|rechtwinklig)$/i, () => ['spitzwinkliges', 'rechtwinkliges', 'stumpfwinkliges']],
  [/^exponentiell$/i, () => ['linear', 'quadratisch', 'exponentiell']],
  [/^verachtfacht$/i, () => ['verdoppelt', 'vervierfacht', 'verachtfacht']],
];
const norm = (s) => String(s ?? '').trim().toLowerCase();

// y = m·x + b als zwei Zahlenfelder statt freier Texteingabe
function linearParts(p) {
  const all = [p.value, ...(p.alternatives || [])].map((v) => String(v).replace(/\s+/g, '').replace(/^y=/i, '').replace(/,/g, '.').replace(/−/g, '-'));
  for (const v of all) {
    const m = v.match(/^(-?\d*\.?\d+(?:\/\d+)?)(?:\*|·)?x(?:([+-]\d*\.?\d+))?$/);
    if (m) {
      const num = (s) => (s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s));
      return [num(m[1]), m[2] ? num(m[2]) : 0];
    }
  }
  return null;
}

// Gemeinsame Bereinigung des Textes (gilt auch für Varianten mit neuen Zahlen)
export function cleanText(md) {
  return String(md || '')
    .replace(/\n*\s*Notiere (?:deinen|einen|eine)[^\n.]*(?:Rechenweg|Überschlagsrechnung)\.?[ \t]*(?:\n+\s*!\[[^\]]*\]\([^)]+\))?/gi, '')
    .replace(/\n+\s*Rechenweg\s*:?\s*(?=\n|$)/gi, '')
    .replace(/\n+\s*\d+\s*Pkte?\.?\s*(?=\n|$)/gi, '')
    .replace(/\n+\s*\(?\d+\s*Pkte?\.?\)?\s*$/gi, '')
    .replace(/([^\n.!?:)\]|$])[ \t]*\n\n(?=[a-zäöüß(])/g, '$1 ') // Absatz mitten im Satz („… Gebühr\n\nvon 110 €“)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Toleranz beim Runden: Prüfungsaufgaben verlangen „auf zwei Nachkommastellen“ o. Ä.; wer richtig rechnet und
// sinnvoll rundet, soll nicht durchfallen. Ganze/„glatte“ Ergebnisse bleiben exakt.
const APPROX = /≈|\\approx|\bca\.|\betwa\b|ungefähr|gerundet|\brund\b/i;
const decimalsOf = (v) => { const str = String(v); return str.includes('.') ? Math.min(str.split('.')[1].length, 6) : 0; };
export function withTolerance(t) {
  if (t.answer.type !== 'fields') return t;
  const approx = APPROX.test(`${t.context} ${t.prompt}`);
  const parts = t.answer.parts.map((p) => {
    if (p.kind !== 'number' || Number(p.tolerance) > 0) return p;
    const d = decimalsOf(p.value);
    // ab zwei Nachkommastellen: auf die angegebene Stelle gerundet (höchstens 3); eine Stelle nur bei größeren Zahlen
    // oder „ca.“ (Wahrscheinlichkeiten wie 0,4 bleiben exakt); ganze Zahlen nur bei „ca.“
    const tol = d >= 2 ? 0.5 * 10 ** -Math.min(d, 3) : d === 1 ? (Math.abs(p.value) >= 10 || approx ? 0.05 : 0) : approx ? 0.5 : 0;
    return tol ? { ...p, tolerance: tol } : p;
  });
  return { ...t, answer: { ...t.answer, parts } };
}

// Aufbereitung einer einzelnen Originalaufgabe. Gibt die (ggf. umgebaute) Aufgabe zurück.
export function polish(t) {
  let out = { ...t, context: cleanText(t.context), prompt: cleanText(t.prompt) };
  if (out.answer.type === 'choice') {
    return { ...out, answer: { ...out.answer, options: out.answer.options.map((o) => ({ ...o, text: o.text.replace(/^\\(?=\d)/, '').replace(/\$[^$]*\$/g, (m) => m.replace(/(?<=\d),(?=\d)/g, '{,}')) })) } };
  }
  out = withTolerance(out);
  if (out.answer.type !== 'fields') return out;
  const parts = out.answer.parts || [];

  // Ein Wort bzw. Ja/Nein als Auswahl (Antworten per Tippen statt per Tastatur)
  if (parts.length === 1 && parts[0].kind === 'text') {
    const word = norm(parts[0].value);
    const hit = CHOICE_WORDS.find(([re]) => re.test(word));
    const gaps = (out.prompt.match(/⟦\d+⟧/g) || []).length;
    if (hit && gaps <= 1) {
      const opts = hit[1]().map((o) => (typeof o === 'string' ? { text: o } : o));
      const right = opts.findIndex((o) => norm(o.text) === word || norm(o.text).startsWith(word.replace(/s$/, '')));
      if (right >= 0) {
        const prompt = out.prompt
          .replace(/⟦1⟧\s*ja\/nein/gi, '')
          .replace(/\n*(?:Begründe|Erkläre)[^\n]*\./gi, '\nEntscheide.')
          .replace(/⟦1⟧/g, '…');
        return {
          ...out, prompt: cleanText(prompt),
          answer: { type: 'choice', multiple: false, options: opts.map((o, i) => ({ text: o.text, correct: i === right })) },
        };
      }
    }
  }

  // y = m·x + b: zwei Felder
  if (parts.length === 1 && parts[0].kind === 'text') {
    const mb = linearParts(parts[0]);
    if (mb && /y\s*=\s*\$?\s*⟦1⟧|⟦1⟧\s*$/m.test(out.prompt) && /(funktionsgleichung|gleichung der gerade|funktion)/i.test(`${out.context} ${out.prompt}`)) {
      const prompt = out.prompt.replace(/\$?\s*y\s*=\s*\$?\s*⟦1⟧\s*\$?/i, '$y = $ ⟦1⟧ $\\cdot x +$ ⟦2⟧');
      if (prompt !== out.prompt) {
        return {
          ...out, prompt,
          answer: { type: 'fields', inline: true, parts: [
            { label: '', kind: 'number', value: mb[0], tolerance: 0, unit: '', alternatives: [] },
            { label: '', kind: 'number', value: mb[1], tolerance: 0, unit: '', alternatives: [] },
          ] },
        };
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- Einzelkorrekturen
// topic: anderes Thema · skip: Grund, warum die Aufgabe entfällt · context/prompt: Text ersetzen · answer: Antwort ersetzen
// dropImages: Bild-IDs (z. B. ex-1c279a215670), die nicht zur Teilaufgabe gehören · tol: Toleranz je Zahlenfeld
// unordered: Reihenfolge der Felder egal · replace: [[alt, neu]] Textersetzungen
const field = (value, tolerance = 0) => ({ label: '', kind: 'number', value, tolerance, unit: '', alternatives: [] });
const gaps = (...values) => ({ type: 'fields', inline: true, parts: values.map((v) => field(v)) });

const SPORTKURS = {
  context: '',
  prompt: 'Alina bietet einen Sportkurs an. Jede Person muss pro Kursstunde einen festen Betrag bezahlen. An der letzten Kursstunde haben 8 Personen teilgenommen. Alina hatte Einnahmen von $40\\ €$.\n\nBerechne die Einnahmen, wenn 14 Personen am Kurs teilnehmen.\n\nDie Einnahmen betragen ⟦1⟧ €.',
  answer: gaps(70),
};
const ZUG = {
  topic: 'Größen & Einheiten',
  context: 'Der Zug RE 30 fährt um 09:48 Uhr in Hannover ab. Er benötigt 9 Minuten von Hannover nach Lehrte.',
  prompt: 'Wann kommt der Zug in Lehrte an?',
  answer: { type: 'choice', multiple: false, options: [{ text: '09:39 Uhr', correct: false }, { text: '09:47 Uhr', correct: false }, { text: '09:57 Uhr', correct: true }, { text: '10:07 Uhr', correct: false }] },
};
const UEBERSCHLAG = { tol: 5, prompt: 'Bei einer Spendenaktion nimmt der Förderverein einer Schule 402,10 € ein. Davon sollen so viele Zirkel wie möglich gekauft werden. Ein Zirkel kostet 7,98 €.\n\nHerr Gerdes möchte im Kopf überschlagen, wie viele Zirkel er ungefähr kaufen kann.\n\nHerr Gerdes kann ungefähr ⟦1⟧ Zirkel kaufen. *(Eine sinnvolle Überschlagsrechnung genügt, z. B. 400 : 8.)*' };

export const FIXES = {
  // --- Zahlen & Rechnen / Größen / Prozent
  'rs|2026|Teil 1|2|': UEBERSCHLAG,
  'hs-g|2026|Teil 1|2|': UEBERSCHLAG,
  'hs-e|2026|Teil 1|2|': UEBERSCHLAG,
  'rs|2023|Teil 1|3|c)': {
    topic: 'Zahlen & Rechnen',
    context: '',
    dropImages: ['ex-92bfcfeb0576', 'ex-93fd77698ebc'],
    prompt: '**c)** Die Abbildung zeigt eine Schokoladentafel. Der grau gefärbte Teil ist übrig.\n\n![Abbildung](/uploads/ex-4a17003696b8.png)\n\nKreuze die vier richtigen Angaben für den grau gefärbten Anteil an.',
  },
  'rs|2021|Teil 1|4|b)': { topic: 'Zuordnungen & Dreisatz' },
  'rs|2024|Wahlteil|1|d)': { topic: 'Körper: Oberfläche & Volumen' },
  'rs|2022|Teil 2|6|a)': { tol: 1 }, // π und Rundung: 200,3 cm³ ≈ 200
  'rs|2024|Teil 2|2|b)': { replace: [['Im Vergleich zu 2019 ist diese Anzahl', 'Im Vergleich zu 2018 ist diese Anzahl']] }, // 2019 gegenüber 2018: Vorlage verwechselte die Jahre
  'hs-g|2022|Teil 2|1|b)': { topic: 'Prozent & Zinsen' },
  'hs-e|2022|Teil 2|1|b)': { topic: 'Prozent & Zinsen' },
  // --- Zuordnungen
  'rs|2024|Teil 1|4|': SPORTKURS,
  'hs-e|2024|Teil 1|4|': SPORTKURS,
  'hs-g|2024|Teil 1|4|': SPORTKURS,
  'hs-e|2026|Teil 1|3|a)': ZUG,
  'hs-g|2026|Teil 1|3|a)': ZUG,
  // --- Funktionen
  'hs-e|2024|Teil 2|3|a)': { dropImages: ['ex-f60964eef741'] }, // leere Tabelle mit anderen Zahlen
  'rs|2026|Teil 2|3|a)': { topic: 'Quadratische Funktionen & Gleichungen' },
  'hs-g|2026|Teil 2|3|a)': {},
  'rs|2021|Wahlteil|2|b)': { topic: 'Quadratische Funktionen & Gleichungen' },
  'rs|2024|Teil 2|3|b)': { dropImages: ['ex-1c279a215670'] }, // leere Wertetabelle zum Ausfüllen (steht schon im Text)
  'rs|2022|Wahlteil|4|b)': {
    context: '',
    prompt: '**b)** Eine quadratische Funktion hat die Funktionsgleichung $y = x^2 + 2x − 4.$\n\nVervollständige die Wertetabelle.\n\n| x | -4 | -3 | -2 | -1 | 0 | 1 | 2 |\n|---|---|---|---|---|---|---|---|\n| $y=x^2+2x-4$ | 4 | -1 | ⟦1⟧ | -5 | -4 | -1 | 4 |',
  },
  'rs|2021|Teil 2|6|': { unordered: true },
  'rs|2026|Wahlteil|2|e)': { dropImages: ['ex-7b4a68fa7513', 'ex-ac49993506a1'] }, // Foto und Ankreuz-Tabelle (die Auswahl steht unter der Aufgabe)
  // --- Geometrie
  'hs-g|2026|Wahlteil|2|b)': { dropImages: ['ex-e8836e776d9a'] }, // Bambus-Zeichnung
  'hs-e|2024|Wahlteil|3|b)': { dropImages: ['ex-31be1156baec'] }, // Handy-Screenshot
  'hs-e|2023|Wahlteil|2|a)': { dropImages: ['ex-e2d071cdacd0'] }, // Foto Boiler
  'hs-e|2023|Wahlteil|2|b)': { dropImages: ['ex-e2d071cdacd0'] },
  'hs-e|2022|Wahlteil|4|c)': {
    context: 'Dilara lässt ihre Drohne über einem freien Feld fliegen.',
    dropImages: ['ex-19e9ad9fb9ac'],
  },
  'rs|2025|Wahlteil|4|c)': { dropImages: ['ex-67fd5fe82d78'] }, // Foto, nicht nötig
  'hs-e|2025|Wahlteil|4|c)': { dropImages: ['ex-67fd5fe82d78'] },
  'rs|2025|Teil 2|4|a)': { dropImages: ['ex-7a4e4ab3527b'] },
  'hs-e|2025|Teil 2|4|a)': { dropImages: ['ex-7a4e4ab3527b'] },
};

const withoutImages = (md, ids) => ids.reduce((s, id) => s.replace(new RegExp(`!\\[[^\\]]*\\]\\(/uploads/${id}\\.\\w+\\)\\s*`, 'g'), ''), md);

// Ersetzt eine Einzelkorrektur Text oder Antwort der Aufgabe? Dann gibt es keine Varianten mit neuen Zahlen.
export const changesText = (key) => { const f = FIXES[key]; return !!f && ('prompt' in f || 'context' in f || !!f.answer); };

// Varianten mit neuen Zahlen wie die Originalaufgabe aufbereiten (Text bereinigen, Bilder, Rundungstoleranz).
export function finishVariant(t, v) {
  const fix = FIXES[t.key] || {};
  let out = { ...v, context: cleanText(withoutImages(v.context || '', fix.dropImages || [])), prompt: cleanText(withoutImages(v.prompt, fix.dropImages || [])) };
  for (const [from, to] of fix.replace || []) { out.context = out.context.replace(from, to); out.prompt = out.prompt.replace(from, to); }
  if (out.answer?.type === 'fields' && fix.tol != null) out = { ...out, answer: { ...out.answer, parts: out.answer.parts.map((p) => (p.kind === 'number' && !(p.tolerance > 0) ? { ...p, tolerance: fix.tol } : p)) } };
  return out.answer?.type === 'fields' ? withTolerance(out) : out;
}

// Wendet die Einzelkorrektur auf eine Originalaufgabe an (nach polish). Gibt null zurück, wenn sie entfällt.
export function applyFix(t) {
  const fix = FIXES[keyOf(t)];
  if (!fix) return t;
  if (fix.skip) return null;
  const out = { ...t };
  if (fix.topic) out.topic = fix.topic;
  if ('context' in fix) out.context = fix.context;
  if ('prompt' in fix) out.prompt = fix.prompt;
  if (fix.answer) out.answer = fix.answer;
  if (fix.dropImages) {
    out.context = cleanText(withoutImages(out.context, fix.dropImages));
    out.prompt = cleanText(withoutImages(out.prompt, fix.dropImages));
  }
  for (const [from, to] of fix.replace || []) { out.context = out.context.replace(from, to); out.prompt = out.prompt.replace(from, to); }
  if (fix.tol != null && out.answer.type === 'fields') out.answer = { ...out.answer, parts: out.answer.parts.map((p) => (p.kind === 'number' ? { ...p, tolerance: fix.tol } : p)) };
  if (fix.unordered && out.answer.type === 'fields') out.answer = { ...out.answer, unordered: true };
  return out;
}

// ---------------------------------------------------------------- Einstiegstest
// Je Abschlussgruppe (RS = Realschule/erweiterte RS, HS = Hauptschule), Thema und Schwierigkeit 1–3 die Originalaufgaben,
// die neben den erzeugten Aufgaben als zusätzliche Varianten im Einstiegstest vorkommen. Jede ist geprüft: am Bildschirm
// lösbar, alle nötigen Angaben im Text oder Bild, Thema passt, Schwierigkeit entspricht dem Platz im Test.
// Was hier nicht steht, wird im Einstiegstest nicht aus den Prüfungen genommen (dort bleiben die erzeugten Aufgaben).
export const DIAG_PICKS = {
  RS: {
    'Zahlen & Rechnen': [
      ['rs|2026|Teil 1|1|a)', 'rs|2026|Teil 1|5|a)', 'rs|2026|Teil 1|2|'],
      ['rs|2023|Teil 1|3|c)'],
      [],
    ],
    'Größen & Einheiten': [
      ['rs|2023|Teil 1|1|a)', 'rs|2022|Teil 1|2|a)'],
      [],
      [],
    ],
    'Prozent & Zinsen': [
      ['rs|2026|Teil 1|4|a)', 'rs|2025|Teil 1|2|b)', 'rs|2024|Teil 1|3|c)'],
      ['rs|2025|Teil 2|1|a)', 'rs|2023|Teil 2|1|a)', 'rs|2022|Teil 2|1|a)'],
      ['rs|2024|Teil 2|2|b)'],
    ],
    'Zuordnungen & Dreisatz': [
      ['rs|2022|Teil 1|6|a)', 'rs|2021|Teil 1|4|a)', 'rs|2024|Teil 1|4|'],
      [],
      [],
    ],
    'Terme, Gleichungen & Formeln': [
      ['rs|2024|Teil 1|1|c)', 'rs|2025|Teil 1|3|'],
      ['rs|2024|Teil 1|5|b)', 'rs|2023|Teil 1|8|c)'],
      ['rs|2023|Teil 2|2|c)'],
    ],
    'Lineare Funktionen': [
      ['rs|2021|Teil 2|5|a)', 'rs|2023|Teil 2|4|a)'],
      ['rs|2023|Teil 2|5|a)'],
      [],
    ],
    'Winkel, Dreiecke & Flächen': [
      ['rs|2025|Teil 1|6|b)', 'rs|2025|Teil 1|7|'],
      ['rs|2024|Teil 2|5|a)', 'rs|2022|Teil 2|4|c)'],
      ['rs|2023|Teil 2|2|a)'],
    ],
    'Körper: Oberfläche & Volumen': [
      ['rs|2023|Teil 1|6|a)', 'rs|2026|Wahlteil|3|a)'],
      ['rs|2025|Teil 2|4|a)', 'rs|2023|Wahlteil|1|a)'],
      ['rs|2023|Teil 2|7|a)', 'rs|2024|Teil 2|5|b)', 'rs|2022|Teil 2|6|a)'],
    ],
    'Satz des Pythagoras': [
      ['rs|2025|Teil 1|4|b)'],
      ['rs|2025|Teil 2|3|a)', 'rs|2022|Teil 2|4|a)'],
      ['rs|2023|Teil 2|6|a)', 'rs|2023|Wahlteil|1|c)'],
    ],
    'Daten & Statistik': [
      ['rs|2025|Teil 1|9|a)', 'rs|2021|Teil 1|5|'],
      [],
      [],
    ],
    'Wahrscheinlichkeit': [
      ['rs|2023|Teil 2|3|a)', 'rs|2022|Teil 2|2|a)'],
      ['rs|2024|Teil 2|1|c)'],
      ['rs|2025|Wahlteil|4|c)', 'rs|2026|Wahlteil|1|b)'],
    ],
    'Quadratische Funktionen & Gleichungen': [
      ['rs|2023|Wahlteil|4|a)', 'rs|2022|Wahlteil|4|b)'],
      ['rs|2024|Teil 2|3|b)', 'rs|2021|Teil 2|6|', 'rs|2026|Teil 2|3|a)', 'rs|2021|Wahlteil|2|b)'],
      ['rs|2026|Wahlteil|2|e)'],
    ],
    'Trigonometrie & Ähnlichkeit': [
      ['rs|2022|Teil 2|5|a)'],
      ['rs|2023|Teil 2|6|b)', 'rs|2025|Teil 2|3|c)'],
      ['rs|2024|Wahlteil|2|c)', 'rs|2026|Wahlteil|4|b)'],
    ],
    'Wachstum & Exponentialfunktionen': [
      ['rs|2025|Teil 2|2|b)'],
      ['rs|2022|Wahlteil|3|a)'],
      [],
    ],
  },
  HS: {
    'Zahlen & Rechnen': [
      ['hs-g|2026|Teil 1|1|a)', 'hs-g|2026|Teil 1|5|a)', 'hs-g|2026|Teil 1|2|', 'hs-g|2025|Teil 1|1|a)'],
      ['hs-e|2023|Wahlteil|2|a)'],
      [],
    ],
    'Größen & Einheiten': [
      ['hs-g|2023|Teil 1|1|a)', 'hs-g|2022|Teil 1|2|a)', 'hs-g|2021|Teil 1|2|a)'],
      ['hs-e|2026|Teil 1|3|a)'],
      [],
    ],
    'Prozent & Zinsen': [
      ['hs-g|2026|Teil 1|4|a)', 'hs-g|2025|Teil 1|2|b)', 'hs-g|2026|Teil 2|1|b)', 'hs-g|2022|Teil 2|1|b)'],
      ['hs-g|2025|Teil 2|1|b)', 'hs-e|2025|Teil 2|1|a)'],
      [],
    ],
    'Zuordnungen & Dreisatz': [
      ['hs-g|2021|Teil 1|4|a)', 'hs-g|2022|Wahlteil|2|b)', 'hs-e|2024|Teil 1|4|'],
      [],
      [],
    ],
    'Terme, Gleichungen & Formeln': [
      ['hs-g|2022|Teil 1|5|a)'],
      ['hs-g|2025|Teil 1|3|', 'hs-g|2024|Teil 1|5|b)', 'hs-g|2023|Teil 1|8|c)'],
      [],
    ],
    'Lineare Funktionen': [
      ['hs-g|2026|Teil 2|3|a)', 'hs-g|2023|Teil 2|4|a)', 'hs-g|2026|Wahlteil|2|b)'],
      ['hs-e|2022|Teil 2|4|a)', 'hs-e|2024|Teil 2|3|a)', 'hs-e|2023|Teil 2|5|a)'],
      ['hs-e|2022|Wahlteil|2|b)', 'hs-e|2021|Wahlteil|4|b)', 'hs-e|2023|Wahlteil|2|b)'],
    ],
    'Winkel, Dreiecke & Flächen': [
      ['hs-g|2026|Teil 2|4|a)', 'hs-g|2025|Teil 1|6|b)', 'hs-g|2025|Teil 1|7|'],
      ['hs-e|2026|Teil 2|4|a)', 'hs-e|2026|Teil 2|5|a)'],
      ['hs-e|2022|Wahlteil|4|c)', 'hs-e|2023|Wahlteil|1|b)'],
    ],
    'Körper: Oberfläche & Volumen': [
      ['hs-g|2025|Wahlteil|2|a)', 'hs-g|2024|Teil 2|5|a)', 'hs-e|2026|Wahlteil|3|a)'],
      ['hs-e|2023|Teil 1|6|a)', 'hs-e|2025|Teil 2|4|a)', 'hs-g|2026|Wahlteil|3|c)'],
      ['hs-e|2024|Teil 2|5|b)', 'hs-e|2024|Wahlteil|1|b)', 'hs-e|2023|Wahlteil|1|a)'],
    ],
    'Satz des Pythagoras': [
      ['hs-g|2025|Teil 1|4|b)', 'hs-g|2026|Teil 2|5|b)', 'hs-g|2025|Teil 2|3|a)'],
      ['hs-e|2025|Teil 2|3|a)'],
      ['hs-e|2024|Wahlteil|4|b)', 'hs-e|2023|Wahlteil|1|c)', 'hs-e|2023|Wahlteil|4|a)'],
    ],
    'Daten & Statistik': [
      ['hs-g|2025|Teil 1|9|a)'],
      [],
      [],
    ],
    'Wahrscheinlichkeit': [
      ['hs-e|2022|Teil 2|5|a)', 'hs-e|2023|Teil 2|3|a)', 'hs-e|2024|Wahlteil|3|b)'],
      [],
      ['hs-e|2023|Wahlteil|3|b)', 'hs-e|2025|Wahlteil|4|c)', 'hs-e|2026|Wahlteil|1|b)'],
    ],
  },
};
