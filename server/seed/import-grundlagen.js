// Importiert die Aufgaben aus dem „Grundlagen-Training“ (Hauptschule Klasse 10) in eine
// bestehende oder neue Datenbank – ohne vorhandene Inhalte zu überschreiben.
//
// - Läuft bei jedem Serverstart, tut aber nur etwas, wenn IMPORT_VERSION neu ist.
// - Legt Übungspakete in den passenden Themen an (und das Thema „Lineare Gleichungssysteme“,
//   falls es noch fehlt), ergänzt Skript-Abschnitte und schaltet das Thema „Wachstum“ für HS 10 frei.
// - Bei einer neuen Version werden nur die zuvor importierten Pakete/Abschnitte ersetzt.
import { get, run, tx, json, getSetting, setSetting } from '../db.js';
import * as figures from './figures.js';
import { buildAll as buildContent, buildGeometrie, buildDaten } from './grundlagen/index.js';

export const IMPORT_VERSION = 1;
const DEFAULT_PROFILES = ['HS10'];

function removePrevious(state) {
  for (const id of state.packageIds || []) run('DELETE FROM packages WHERE id = ?', id);
  for (const id of state.sectionIds || []) run('DELETE FROM script_sections WHERE id = ?', id);
}

function ensureTopic(entry, state) {
  let topic = get('SELECT * FROM topics WHERE title = ?', entry.topic);
  if (!topic && entry.create) {
    const c = entry.create;
    const after = c.after && get('SELECT sort FROM topics WHERE title = ?', c.after);
    let sort;
    if (after) {
      run('UPDATE topics SET sort = sort + 1 WHERE sort > ?', after.sort);
      sort = after.sort + 1;
    } else sort = (get('SELECT COALESCE(MAX(sort), -1) AS m FROM topics').m) + 1;
    const id = Number(run(
      'INSERT INTO topics (title, description, icon, color, sort, profiles) VALUES (?, ?, ?, ?, ?, ?)',
      entry.topic, c.description, c.icon, c.color, sort, JSON.stringify(c.profiles),
    ).lastInsertRowid);
    state.topicIds.push(id);
    topic = get('SELECT * FROM topics WHERE id = ?', id);
  }
  if (!topic) return null;
  // Thema auch für weitere Profile freigeben (z. B. Wachstum für HS 10)
  if (entry.addProfiles) {
    const have = json(topic.profiles, []);
    if (have.length) {
      const next = [...new Set([...have, ...entry.addProfiles])];
      if (next.length !== have.length) {
        run('UPDATE topics SET profiles = ? WHERE id = ?', JSON.stringify(next), topic.id);
        state.profileChanges[topic.id] = have;
      }
    }
  }
  return topic;
}

// Mehrere unabhängige Importe – jeder merkt sich seine Version unter einem eigenen Schlüssel.
export function importGrundlagen() {
  runImport('import_grundlagen', IMPORT_VERSION, 'Grundlagen-Training (Rechnen, Funktionen, Wachstum)', () => buildContent(figures));
  runImport('import_geometrie', 1, 'Grundlagen-Training Geometrie', () => buildGeometrie(figures));
  runImport('import_daten', 1, 'Grundlagen-Training Daten und Zufall', () => buildDaten(figures));
}

function runImport(KEY, version, label, build) {
  const prev = json(getSetting(KEY, ''), null);
  if (prev && prev.version === version) return;

  const data = build();
  const state = { version, packageIds: [], sectionIds: [], topicIds: prev?.topicIds || [], profileChanges: prev?.profileChanges || {} };
  let tasks = 0;
  let variants = 0;

  tx(() => {
    if (prev) removePrevious(prev);

    for (const entry of data) {
      const topic = ensureTopic(entry, state);
      if (!topic) {
        console.warn(`Grundlagen-Import: Thema „${entry.topic}“ nicht gefunden – übersprungen.`);
        continue;
      }
      const entryProfiles = entry.create?.profiles || DEFAULT_PROFILES;

      let sectionSort = get('SELECT COALESCE(MAX(sort), -1) AS m FROM script_sections WHERE topic_id = ?', topic.id).m;
      for (const s of entry.sections || []) {
        const id = Number(run(
          'INSERT INTO script_sections (topic_id, title, sort, blocks) VALUES (?, ?, ?, ?)',
          topic.id, s.title, ++sectionSort, JSON.stringify([{ type: 'text', md: s.md }]),
        ).lastInsertRowid);
        state.sectionIds.push(id);
      }
      const sectionId = (title) => get('SELECT id FROM script_sections WHERE topic_id = ? AND title = ? ORDER BY id LIMIT 1', topic.id, title)?.id ?? null;

      let pkgSort = get('SELECT COALESCE(MAX(sort), -1) AS m FROM packages WHERE topic_id = ?', topic.id).m;
      for (const pkg of entry.packages) {
        const pkgId = Number(run(
          'INSERT INTO packages (topic_id, title, description, level, profiles, sort) VALUES (?, ?, ?, ?, ?, ?)',
          topic.id, pkg.title, pkg.description, pkg.level, JSON.stringify(pkg.profiles || entryProfiles), ++pkgSort,
        ).lastInsertRowid);
        state.packageIds.push(pkgId);
        pkg.tasks.forEach((t, i) => {
          const sid = sectionId(t.section);
          if (!sid) console.warn(`Grundlagen-Import: Skript-Abschnitt „${t.section}“ in „${entry.topic}“ nicht gefunden.`);
          const taskId = Number(run(
            'INSERT INTO tasks (kind, topic_id, package_id, title, script_section_id, sort) VALUES (?, ?, ?, ?, ?, ?)',
            'practice', topic.id, pkgId, t.title, sid, i,
          ).lastInsertRowid);
          tasks++;
          t.variants.forEach((v, j) => {
            run(
              'INSERT INTO task_variants (task_id, prompt, answer, solution, hint, sort) VALUES (?, ?, ?, ?, ?, ?)',
              taskId, v.prompt, JSON.stringify(v.answer), v.solution || '', v.hint || '', j,
            );
            variants++;
          });
        });
      }
    }
    setSetting(KEY, JSON.stringify(state));
  });

  console.log(`${label} importiert: ${state.packageIds.length} Übungspakete, ${tasks} Aufgaben, ${variants} Varianten.`);
}
