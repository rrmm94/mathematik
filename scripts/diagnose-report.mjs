// Übersicht über den Einstiegstest (Diagnose) zum Gegenlesen: je Profil, Thema und Schwierigkeit die erzeugte Aufgabe
// und die Originalaufgaben aus den Prüfungen mit Herkunft, Antwortart und Lösung.
// Aufruf (leerer Ordner, Datenbank wird neu aufgebaut): DATA_DIR=/tmp/x node --no-warnings scripts/diagnose-report.mjs > DIAGNOSETEST.md
import { seedIfEmpty } from '../server/seed/index.js';
import { all, json } from '../server/db.js';
import { answerSummary } from '../shared/checker.js';

seedIfEmpty();
const LEVEL = { 1: 'leicht', 2: 'mittel', 3: 'schwer' };
const short = (md, n = 150) => String(md || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '[Bild]').replace(/\s+/g, ' ').replace(/⟦\d+⟧/g, '___').trim().slice(0, n);
const kind = (a) => (a.type === 'choice' ? (a.multiple ? 'Mehrfachauswahl' : 'Auswahl') : a.type === 'fields' ? (a.parts.length > 1 ? `${a.parts.length} Zahlenfelder` : 'Zahlenfeld') : 'Freitext');

const out = ['# Einstiegstest – Übersicht der Aufgaben', '',
  'Je Thema drei Plätze: **leicht**, **mittel**, **schwer**. Jedes Kind bekommt pro Platz eine der Varianten (Zufall).',
  'Erzeugte Aufgaben stehen für jeden Platz zur Verfügung, dazu die hier aufgeführten **geprüften Originalaufgaben** aus den Abschlussprüfungen',
  '(jeweils zusätzlich mit ein bis zwei Varianten mit anderen Zahlen). Erzeugt mit `scripts/diagnose-report.mjs`.', ''];

for (const profile of ['RS10', 'HS10']) {
  out.push(`## ${profile === 'RS10' ? 'Realschule (RS10 und ERS10 haben dieselben Aufgaben)' : 'Hauptschule (HS10)'}`, '');
  const tasks = all("SELECT t.*, tp.title AS topic FROM tasks t JOIN topics tp ON tp.id = t.topic_id WHERE t.kind = 'diagnose' AND t.profile = ? ORDER BY tp.sort, t.difficulty", profile);
  let topic = '';
  for (const t of tasks) {
    if (t.topic !== topic) { topic = t.topic; out.push(`### ${topic}`, ''); }
    const vs = all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort', t.id);
    const gen = vs.filter((v) => !v.source);
    const orig = vs.filter((v) => v.source.startsWith('Abschlussprüfung') || v.source.startsWith('Schulbuch'));
    out.push(`**${LEVEL[t.difficulty]}** – ${gen.length} erzeugte Variante(n), ${orig.length} Originalaufgabe(n)`, '');
    if (gen[0]) out.push(`- erzeugt: ${short(gen[0].prompt)} → *${answerSummary(json(gen[0].answer, {}))}*`);
    for (const v of orig) {
      const a = json(v.answer, {});
      out.push(`- ${v.source.replace('Abschlussprüfung ', '').replace('Schulbuch Training', 'Schulbuch')} (${kind(a)}): ${short(`${v.context} ${v.prompt}`, 170)} → *${short(answerSummary(a), 60)}*`);
    }
    out.push('');
  }
}
console.log(out.join('\n'));
