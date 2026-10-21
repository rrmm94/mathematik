// Bindet die importierten Originalaufgaben aus den Abschlussprüfungen (server/seed/exams/data, siehe
// scripts/serlo-import.mjs) in Übungspakete und Diagnosetest ein. Läuft einmalig beim Start (auch bei
// bestehenden Installationen) und legt nichts doppelt an.
//
// Die Herkunft („Abschlussprüfung 2025 · Hauptschule E-Kurs · Teil 2 · Aufgabe 3 b)“) steht nur in
// task_variants.source und wird ausschließlich der Lehrkraft angezeigt – nie dem Kind.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { all, get, run, tx, json, getSetting, setSetting, UPLOAD_DIR } from '../db.js';
import { variantsFor } from './exam-variants.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'exams');
const SETTING = 'exams_v1';

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
// Schwierigkeit im Diagnosetest (1 leicht … 3 schwer) je Profilgruppe und Niveaustufe der Übungspakete.
const DIAG_DIFFICULTY = { HS: { 0: 1, 1: 1, 2: 2, 3: 3 }, RS: { 1: 1, 2: 2, 3: 3 } };
const DIAG_PER_SLOT = 4; // so viele Originalaufgaben kommen je Diagnose-Aufgabe als zusätzliche Varianten dazu
const TASKS_PER_PACKAGE = 6;

const fingerprint = (s) => crypto.createHash('sha1').update(`${s.context}\n${s.prompt}\n${JSON.stringify(s.answer)}`).digest('hex');

// „a)“ vor die Teilaufgabe, damit Verweise wie „Teilaufgabe a)“ verständlich bleiben (Tabellen und Bilder auf eigener Zeile).
const withLabel = (label, prompt) => (label ? `**${label}**${/^[|!]/.test(prompt) ? '\n\n' : ' '}${prompt}` : prompt);

export function loadExams() {
  if (!fs.existsSync(path.join(DIR, 'data'))) return [];
  const out = [];
  for (const file of fs.readdirSync(path.join(DIR, 'data')).filter((f) => f.endsWith('.json')).sort()) {
    const exam = JSON.parse(fs.readFileSync(path.join(DIR, 'data', file), 'utf8'));
    for (const g of exam.groups) {
      g.subs.forEach((s, i) => {
        if (s.skip) return;
        out.push({
          school: exam.school, year: exam.year, part: exam.part, no: g.no, order: i,
          context: g.context || '', prompt: withLabel(s.label, s.prompt), answer: s.answer.type === 'free' ? { type: 'free', sample: '' } : s.answer, solution: s.solution || '', points: s.points || 0,
          topic: s.topic, label: s.label || '',
        });
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

export function seedExams() {
  if (getSetting(SETTING, '')) return;
  const exams = loadExams();
  if (!exams.length) return;

  const topics = new Map(all('SELECT * FROM topics').map((t) => [t.title, t]));
  const allowed = (topic, group) => {
    const p = json(topic.profiles, []);
    return p.length === 0 || GROUPS[group].some((x) => p.includes(x));
  };

  // 1. Zuordnung: (Thema, Gruppe, Stufe) -> Aufgaben ohne Dopplungen (gleiche Aufgabe in mehreren Prüfungen wird einmal gezeigt)
  const buckets = new Map();
  let skippedTopic = 0;
  for (const t of exams) {
    const topic = topics.get(t.topic);
    if (!topic) continue;
    for (const [group, level] of PLACE[t.school][t.part] || []) {
      if (!allowed(topic, group)) { skippedTopic++; continue; } // z. B. Trigonometrie/Quadratik/Wachstum nur für die Realschule
      const key = `${topic.id}|${group}|${level}`;
      if (!buckets.has(key)) buckets.set(key, { topic, group, level, tasks: new Map() });
      const b = buckets.get(key);
      const fp = fingerprint(t);
      if (b.tasks.has(fp)) b.tasks.get(fp).sources.push(sourceOf(t));
      else b.tasks.set(fp, { ...t, sources: [sourceOf(t)] });
    }
  }

  let nPackages = 0, nTasks = 0, nDiag = 0;
  tx(() => {
    ensureImages(exams);
    const diagPool = new Map(); // `${topicId}|${group}|${difficulty}` -> Kandidaten
    for (const b of [...buckets.values()].sort((a, c) => a.topic.sort - c.topic.sort || a.level - c.level)) {
      const list = [...b.tasks.values()].sort((x, y) => y.year - x.year || PART_ORDER[x.part] - PART_ORDER[y.part] || x.no - y.no || x.order - y.order);
      const mk = (t) => [{ ...t, source: [...new Set(t.sources)].join('  |  ') }, ...variantsFor(t).map((v) => ({ ...v, prompt: withLabel(t.label, v.prompt) }))];

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
        chunk.forEach((t, i) => { insertTask({ topicId: b.topic.id, packageId: pkg, title: 'Prüfungsaufgabe', sort: i, variants: mk(t) }); nTasks++; });
      });

      // Kandidaten für den Diagnosetest: automatisch prüfbar, kurz, möglichst verschiedene Jahre
      const d = DIAG_DIFFICULTY[b.group][b.level];
      if (d) {
        const key = `${b.topic.id}|${b.group}|${d}`;
        if (!diagPool.has(key)) diagPool.set(key, []);
        diagPool.get(key).push(...list.filter((t) => t.answer.type !== 'free' && t.points <= 4).map(mk));
      }
    }

    // 2. Diagnosetest: einige Originalaufgaben als zusätzliche Varianten der vorhandenen Diagnose-Aufgaben
    for (const [key, cands] of diagPool) {
      const [topicId, group, difficulty] = key.split('|');
      const picked = [];
      const seen = new Set();
      for (const c of cands.sort((x, y) => (x[0].answer.parts?.length || 1) - (y[0].answer.parts?.length || 1) || y[0].year - x[0].year)) {
        const t = c[0];
        const gk = `${t.school}${t.year}${t.part}${t.no}`;
        if (seen.has(gk) || picked.some((p) => p[0].prompt === t.prompt)) continue;
        seen.add(gk);
        picked.push(c);
        if (picked.length >= DIAG_PER_SLOT) break;
      }
      for (const profile of GROUPS[group]) {
        const task = get("SELECT * FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = ? AND difficulty = ?", Number(topicId), profile, Number(difficulty));
        if (!task) continue;
        let sort = (get('SELECT MAX(sort) AS m FROM task_variants WHERE task_id = ?', task.id).m ?? -1) + 1;
        for (const c of picked) for (const v of c) { addVariants(task.id, [v], sort++); nDiag++; } // Original + Varianten mit neuen Zahlen
      }
    }
    setSetting(SETTING, '1');
  });
  console.log(`Originalaufgaben eingebunden: ${nPackages} Übungspakete, ${nTasks} Aufgaben, ${nDiag} Diagnose-Varianten (${skippedTopic} für die Hauptschule nicht freigeschaltete Zuordnungen ausgelassen).`);
  const total = get("SELECT (SELECT COUNT(*) FROM tasks WHERE kind = 'practice') AS p, (SELECT COUNT(*) FROM tasks WHERE kind = 'diagnose') AS d, (SELECT COUNT(*) FROM task_variants WHERE source LIKE 'Abschlussprüfung%' OR source LIKE 'Variante mit%') AS e");
  console.log(`Gesamt jetzt: ${total.p} Übungsaufgaben, ${total.d} Diagnoseaufgaben, davon ${total.e} Varianten aus Abschlussprüfungen.`);
}
