// Bindet die importierten Originalaufgaben aus den Abschlussprüfungen (server/seed/exams/data, siehe
// scripts/serlo-import.mjs) in Übungspakete und Diagnosetest ein. Läuft einmalig beim Start (auch bei
// bestehenden Installationen) und legt nichts doppelt an.
//
// Nicht jede Prüfungsaufgabe taugt für den Bildschirm: exam-curation.js sortiert aus, was sich am iPad nicht
// sinnvoll lösen lässt, baut Ja/Nein-, Wort- und y = m·x + b-Antworten in Auswahl bzw. Zahlenfelder um, korrigiert
// einzelne Aufgaben und legt fest, welche Originalaufgaben im Einstiegstest vorkommen (DIAG_PICKS).
//
// Die Herkunft („Abschlussprüfung 2025 · Hauptschule E-Kurs · Teil 2 · Aufgabe 3 b)“) steht nur in
// task_variants.source und wird ausschließlich der Lehrkraft angezeigt – nie dem Kind.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { all, get, run, tx, json, getSetting, setSetting, UPLOAD_DIR } from '../db.js';
import { variantsFor } from './exam-variants.js';
import { polish, applyFix, digitalProblem, finishVariant, changesText, keyOf, DIAG_PICKS } from './exam-curation.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'exams');
const SETTING = 'exams_v2'; // v1 = erste Fassung (ungeprüft), wird beim Update entfernt und neu aufgebaut
const SETTING_V1 = 'exams_v1';

const SCHOOL_LABEL = { rs: 'Realschule', 'hs-g': 'Hauptschule G-Kurs', 'hs-e': 'Hauptschule E-Kurs' };
const PART_ORDER = { 'Teil 1': 0, 'Teil 2': 1, Wahlteil: 2 };

// Wohin gehört welcher Prüfungsteil? Niveaustufe 0 Basis … 3 Experte, je Profilgruppe.
// G-Kurs-Teil-1 ist auch für die Realschule die Basisstufe.
const GROUPS = { HS: ['HS10'], RS: ['RS10', 'ERS10'] };
const PLACE = {
  'hs-g': { 'Teil 1': [['HS', 0], ['RS', 0]], 'Teil 2': [['HS', 1]], Wahlteil: [['HS', 1]] },
  'hs-e': { 'Teil 1': [['HS', 2]], 'Teil 2': [['HS', 2]], Wahlteil: [['HS', 3]] },
  rs: { 'Teil 1': [['RS', 1]], 'Teil 2': [['RS', 2]], Wahlteil: [['RS', 3]] },
};
const TASKS_PER_PACKAGE = 6;
const MIN_LEVEL = { HS: 0, RS: 1 };

// Der Prüfungsteil legt die Niveaustufe nur grob fest. Einpunktaufgaben im Teil 2 und im Wahlteil sind meist die
// Einstiegsteilaufgaben (a) und leichter als der Rest des Teils – sie rutschen eine Stufe nach unten.
const levelFor = (t, group, level) => (t.part !== 'Teil 1' && t.points === 1 ? Math.max(MIN_LEVEL[group], level - 1) : level);

const fingerprint = (s) => crypto.createHash('sha1').update(`${s.context}\n${s.prompt}\n${JSON.stringify(s.answer)}`).digest('hex');

// „a)“ vor die Teilaufgabe, damit Verweise wie „Teilaufgabe a)“ verständlich bleiben (Tabellen und Bilder auf eigener Zeile).
const stripLabel = (md) => md.replace(/^\*\*[a-z]\)\*\*\s*/i, '');
const withLabel = (label, prompt) => (label ? `**${label}**${/^[|!]/.test(prompt) ? '\n\n' : ' '}${prompt}` : prompt);

export function loadExams(report = null) {
  if (!fs.existsSync(path.join(DIR, 'data'))) return [];
  const out = [];
  for (const file of fs.readdirSync(path.join(DIR, 'data')).filter((f) => f.endsWith('.json')).sort()) {
    const exam = JSON.parse(fs.readFileSync(path.join(DIR, 'data', file), 'utf8'));
    for (const g of exam.groups) {
      g.subs.forEach((s, i) => {
        if (s.skip) return;
        const raw = {
          school: exam.school, year: exam.year, part: exam.part, no: g.no, order: i,
          context: g.context || '', prompt: withLabel(s.label, s.prompt), answer: s.answer.type === 'free' ? { type: 'free', sample: '' } : s.answer, solution: s.solution || '', points: s.points || 0,
          topic: s.topic, label: s.label || '',
        };
        const t = applyFix(polish(raw));
        if (!t) { report?.skipped.push([keyOf(raw), 'Einzelkorrektur: entfällt']); return; }
        const problem = digitalProblem(t);
        if (problem) { report?.skipped.push([keyOf(raw), problem]); return; }
        // raw: Originaltext für die Varianten mit neuen Zahlen (die Vorlagen erkennen die Aufgabe am Originaltext)
        out.push({ ...t, key: keyOf(raw), raw: { context: raw.context, prompt: raw.prompt, answer: raw.answer }, textFixed: changesText(keyOf(raw)) });
      });
    }
  }
  return out;
}

export const sourceOf = (t) => `Abschlussprüfung ${t.year} · ${SCHOOL_LABEL[t.school]} · ${t.part} · Aufgabe ${t.no}${t.label ? ` ${t.label}` : ''}`;

// Kopiert die benötigten Bilder in den Upload-Ordner (einmalig je Datei).
function ensureImages(tasks) {
  const names = new Set();
  for (const t of tasks) for (const m of `${t.context}\n${t.prompt}\n${t.solution}`.matchAll(/\/uploads\/(ex-[a-z0-9]+\.\w+)/g)) names.add(m[1]);
  for (const name of names) {
    const dest = path.join(UPLOAD_DIR, name);
    if (fs.existsSync(dest)) continue;
    const src = path.join(DIR, 'img', name.replace(/^ex-/, ''));
    if (!fs.existsSync(src)) continue;
    fs.copyFileSync(src, dest);
    run('INSERT INTO uploads (filename, original, mime) VALUES (?, ?, ?)', name, name, `image/${name.endsWith('.svg') ? 'svg+xml' : name.split('.').pop().replace('jpg', 'jpeg')}`);
  }
}

function insertTask({ topicId, packageId, title, sort, variants }) {
  const tid = Number(run(
    "INSERT INTO tasks (kind, topic_id, package_id, title, sort) VALUES ('practice', ?, ?, ?, ?)",
    topicId, packageId, title, sort,
  ).lastInsertRowid);
  addVariants(tid, variants, 0);
  return tid;
}

function addVariants(taskId, variants, startSort) {
  variants.forEach((v, i) => run(
    'INSERT INTO task_variants (task_id, prompt, context, points, answer, solution, hint, source, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    taskId, v.prompt, v.context || '', v.points || 0, JSON.stringify(v.answer), v.solution || '', v.hint || '', v.source || '', startSort + i,
  ));
}

// Entfernt die erste, ungeprüfte Fassung der Prüfungsaufgaben (Setting exams_v1), damit sie neu aufgebaut werden kann.
// Was Kinder schon bearbeitet haben (Übungsfortschritt, Einstiegstest), bleibt unangetastet.
function removeFirstVersion() {
  const isExam = "(v.source LIKE 'Abschlussprüfung%' OR v.source LIKE 'Variante mit geänderten Zahlen%')";
  let removed = 0, kept = 0;
  for (const { id } of all(`SELECT DISTINCT t.id FROM tasks t JOIN task_variants v ON v.task_id = t.id WHERE t.kind = 'practice' AND ${isExam}`)) {
    const used = get('SELECT (SELECT COUNT(*) FROM task_progress WHERE task_id = ?) + (SELECT COUNT(*) FROM attempts WHERE task_id = ?) AS n', id, id).n;
    if (used) { kept++; continue; }
    run('DELETE FROM tasks WHERE id = ?', id);
    removed++;
  }
  run("DELETE FROM packages WHERE title LIKE 'Prüfungsaufgaben%' AND id NOT IN (SELECT package_id FROM tasks WHERE package_id IS NOT NULL)");
  const diag = run(`DELETE FROM task_variants WHERE id IN (SELECT v.id FROM task_variants v JOIN tasks t ON t.id = v.task_id WHERE t.kind = 'diagnose' AND ${isExam}) AND id NOT IN (SELECT variant_id FROM diag_items)`).changes;
  console.log(`Prüfungsaufgaben (erste Fassung) entfernt: ${removed} Übungsaufgaben${kept ? ` (${kept} mit Lernfortschritt bleiben)` : ''}, ${diag} Diagnose-Varianten.`);
}

export function seedExams() {
  if (getSetting(SETTING, '')) return;
  const report = { skipped: [] };
  const exams = loadExams(report);
  if (!exams.length) return;

  const topics = new Map(all('SELECT * FROM topics').map((t) => [t.title, t]));
  const allowed = (topic, group) => {
    const p = json(topic.profiles, []);
    return p.length === 0 || GROUPS[group].some((x) => p.includes(x));
  };

  // Originaltext + Varianten mit neuen Zahlen, aufbereitet wie die Originalaufgabe
  const mk = (t, source, { label = true } = {}) => {
    const variants = t.textFixed ? [] : variantsFor({ ...t, ...t.raw, sources: t.sources || [sourceOf(t)] });
    const lab = (md) => (label ? withLabel(t.label, md) : md);
    return [{ ...t, source, prompt: label ? t.prompt : stripLabel(t.prompt) }, ...variants.map((v) => { const f = finishVariant(t, v); return { ...f, prompt: lab(f.prompt) }; })];
  };

  // 1. Zuordnung: (Thema, Gruppe, Stufe) -> Aufgaben ohne Dopplungen. Dieselbe Aufgabe in mehreren Prüfungen
  //    (z. B. G- und E-Kurs) wird je Gruppe nur einmal gezeigt, und zwar auf der niedrigsten Stufe.
  const placements = [];
  let skippedTopic = 0;
  for (const t of exams) {
    const topic = topics.get(t.topic);
    if (!topic) continue;
    for (const [group, level] of PLACE[t.school][t.part] || []) {
      if (!allowed(topic, group)) { skippedTopic++; continue; } // z. B. Trigonometrie/Quadratik/Wachstum nur für die Realschule
      placements.push({ t, topic, group, level: levelFor(t, group, level) });
    }
  }
  placements.sort((a, b) => a.level - b.level);
  const buckets = new Map();
  const first = new Map();
  for (const { t, topic, group, level } of placements) {
    const fp = fingerprint(t);
    const seenKey = `${group}|${fp}`;
    if (first.has(seenKey)) { first.get(seenKey).sources.push(sourceOf(t)); continue; }
    const key = `${topic.id}|${group}|${level}`;
    if (!buckets.has(key)) buckets.set(key, { topic, group, level, tasks: new Map() });
    const entry = { ...t, sources: [sourceOf(t)] };
    buckets.get(key).tasks.set(fp, entry);
    first.set(seenKey, entry);
  }

  let nPackages = 0, nTasks = 0, nDiag = 0;
  tx(() => {
    if (getSetting(SETTING_V1, '')) removeFirstVersion();
    ensureImages(exams);
    for (const b of [...buckets.values()].sort((a, c) => a.topic.sort - c.topic.sort || a.level - c.level)) {
      const list = [...b.tasks.values()].sort((x, y) => y.year - x.year || PART_ORDER[x.part] - PART_ORDER[y.part] || x.no - y.no || x.order - y.order);

      // Übungspakete: Teilaufgaben derselben Aufgabe bleiben zusammen
      const chunks = [];
      let cur = [];
      let curKey = null;
      for (const t of list) {
        const k = `${t.school}${t.year}${t.part}${t.no}`;
        if (cur.length >= TASKS_PER_PACKAGE && k !== curKey) { chunks.push(cur); cur = []; }
        cur.push(t);
        curKey = k;
      }
      if (cur.length) chunks.push(cur);
      const profiles = GROUPS[b.group].filter((p) => { const tp = json(b.topic.profiles, []); return tp.length === 0 || tp.includes(p); });
      const sortBase = (get('SELECT MAX(sort) AS m FROM packages WHERE topic_id = ?', b.topic.id).m ?? -1) + 1;
      chunks.forEach((chunk, ci) => {
        const pkg = Number(run(
          'INSERT INTO packages (topic_id, title, description, level, profiles, sort) VALUES (?, ?, ?, ?, ?, ?)',
          b.topic.id, `Prüfungsaufgaben${chunks.length > 1 ? ` ${ci + 1}` : ''}`, `${chunk.length} Aufgaben zum Üben`, b.level, JSON.stringify(profiles), sortBase + ci,
        ).lastInsertRowid);
        nPackages++;
        chunk.forEach((t, i) => { insertTask({ topicId: b.topic.id, packageId: pkg, title: 'Prüfungsaufgabe', sort: i, variants: mk(t, [...new Set(t.sources)].join('  |  ')) }); nTasks++; });
      });
    }

    // 2. Einstiegstest: die in DIAG_PICKS festgelegten Originalaufgaben (leicht/mittel/schwer) als zusätzliche Varianten
    //    der erzeugten Diagnose-Aufgaben – jede von Hand geprüft (lösbar am Bildschirm, Thema und Schwierigkeit passen).
    const byKey = new Map(exams.map((t) => [t.key, t]));
    for (const [group, byTopic] of Object.entries(DIAG_PICKS)) {
      for (const [title, levels] of Object.entries(byTopic)) {
        const topic = topics.get(title);
        if (!topic) continue;
        levels.forEach((keys, i) => {
          const picks = keys.map((k) => { const t = byKey.get(k); if (!t) console.warn(`Einstiegstest: Aufgabe ${k} nicht gefunden (${group} · ${title} · Stufe ${i + 1})`); return t; }).filter(Boolean);
          for (const profile of GROUPS[group]) {
            const tp = json(topic.profiles, []);
            if (tp.length && !tp.includes(profile)) continue;
            const task = get("SELECT * FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = ? AND difficulty = ?", topic.id, profile, i + 1);
            if (!task) continue;
            let sort = (get('SELECT MAX(sort) AS m FROM task_variants WHERE task_id = ?', task.id).m ?? -1) + 1;
            for (const t of picks) for (const v of mk(t, sourceOf(t), { label: false })) { addVariants(task.id, [v], sort++); nDiag++; } // Original + Varianten mit neuen Zahlen
          }
        });
      }
    }
    setSetting(SETTING, '1');
  });
  console.log(`Originalaufgaben eingebunden: ${nPackages} Übungspakete, ${nTasks} Aufgaben, ${nDiag} Diagnose-Varianten (${skippedTopic} für die Hauptschule nicht freigeschaltete Zuordnungen und ${report.skipped.length} am Bildschirm nicht sinnvoll lösbare Aufgaben ausgelassen).`);
  const total = get("SELECT (SELECT COUNT(*) FROM tasks WHERE kind = 'practice') AS p, (SELECT COUNT(*) FROM tasks WHERE kind = 'diagnose') AS d, (SELECT COUNT(*) FROM task_variants WHERE source LIKE 'Abschlussprüfung%' OR source LIKE 'Variante mit%') AS e");
  console.log(`Gesamt jetzt: ${total.p} Übungsaufgaben, ${total.d} Diagnoseaufgaben, davon ${total.e} Varianten aus Abschlussprüfungen.`);
}
