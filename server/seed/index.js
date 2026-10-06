// Legt beim ersten Start Beispielinhalte an: Themen, Skripte, Diagnosetest
// (3 Profile × Themen × 3 Aufgaben mit je 3 Varianten), Übungspakete und
// optional einen Demo-Kurs. Aufruf auch manuell: npm run seed
import { get, run, all, tx, setSetting, getSetting } from '../db.js';
import { hashPassword } from '../auth.js';
import { buildPlanFromRun } from '../plan.js';
import { rng } from './helpers.js';
import { topicsA } from './topics-a.js';
import { topicsB } from './topics-b.js';
import { TOPIC_HINTS } from './topic-hints.js';

export const TOPICS = [...topicsA, ...topicsB];

// Welche Schwierigkeits-Sprossen (1..5) für die Diagnose-Aufgaben leicht/mittel/schwer genutzt werden
export const DIAG_RUNGS = {
  HS10: [2, 3, 4],
  RS10: [3, 4, 5],
  ERS10: [3, 4, 5],
};

// Übungspakete: Niveaustufe (0 Basis … 3 Experte) -> Sprosse, getrennt nach HS- und RS-Profilen
export const PRACTICE_GROUPS = [
  { profiles: ['HS10'], rungs: { 0: 1, 1: 2, 2: 3, 3: 4 } },
  { profiles: ['RS10', 'ERS10'], rungs: { 0: 2, 1: 3, 2: 4, 3: 5 } },
];

const VARIANTS = 3;
const TASKS_PER_PACKAGE = 3;

const seedOf = (...parts) => parts.reduce((h, p) => (Math.imul(h ^ (typeof p === 'number' ? p : hashStr(p)), 2654435761) >>> 0), 17);
function hashStr(s) {
  let h = 0;
  for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h;
}

function insertTask({ kind, topicId, packageId = null, profile = null, difficulty = null, title, sectionId, sort, variants }) {
  const tid = Number(run(
    'INSERT INTO tasks (kind, topic_id, package_id, profile, difficulty, title, script_section_id, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    kind, topicId, packageId, profile, difficulty, title, sectionId, sort,
  ).lastInsertRowid);
  variants.forEach((v, i) => run(
    'INSERT INTO task_variants (task_id, prompt, answer, solution, hint, sort) VALUES (?, ?, ?, ?, ?, ?)',
    tid, v.prompt, JSON.stringify(v.answer), v.solution || '', v.hint || '', i,
  ));
  return tid;
}

function makeVariants(gen, seedBase) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < VARIANTS && i < VARIANTS * 4; i++) {
    const v = gen(rng(seedOf(seedBase, i)));
    if (seen.has(v.prompt)) continue; // doppelte Zahlen vermeiden
    seen.add(v.prompt);
    out.push(v);
  }
  return out;
}

export function seedContent() {
  tx(() => {
    TOPICS.forEach((t, ti) => {
      const topicId = Number(run(
        'INSERT INTO topics (title, description, icon, color, sort, profiles, keywords, example) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        t.title, t.description, t.icon, t.color, ti, JSON.stringify(t.profiles),
        TOPIC_HINTS[t.title]?.keywords ?? '', TOPIC_HINTS[t.title]?.example ?? '',
      ).lastInsertRowid);

      // Skript
      const sectionIds = t.sections.map((s, si) => {
        const blocks = [{ type: 'text', md: s.md }];
        if (si === t.sections.length - 1) {
          blocks.push({ type: 'link', title: `Mehr Übungen und Erklärungen zu „${t.title}“ bei Serlo`, url: 'https://de.serlo.org/mathe', qr: true });
        }
        return Number(run('INSERT INTO script_sections (topic_id, title, sort, blocks) VALUES (?, ?, ?, ?)', topicId, s.title, si, JSON.stringify(blocks)).lastInsertRowid);
      });

      // Diagnose: je Profil drei Aufgaben (leicht, mittel, schwer)
      for (const profile of t.profiles) {
        DIAG_RUNGS[profile].forEach((rungNo, di) => {
          const gen = t.rungs[rungNo - 1];
          const variants = makeVariants(gen, seedOf('diag', ti, profile, rungNo));
          insertTask({
            kind: 'diagnose', topicId, profile, difficulty: di + 1, title: variants[0].title,
            sectionId: sectionIds[variants[0].section] ?? null, sort: di, variants,
          });
        });
      }

      // Übungspakete
      let pkgSort = 0;
      for (const group of PRACTICE_GROUPS) {
        const profiles = group.profiles.filter((p) => t.profiles.includes(p));
        if (!profiles.length) continue;
        for (const [level, rungNo] of Object.entries(group.rungs)) {
          const gen = t.rungs[rungNo - 1];
          const sample = gen(rng(seedOf('title', ti, rungNo)));
          const pkgId = Number(run(
            'INSERT INTO packages (topic_id, title, description, level, profiles, sort) VALUES (?, ?, ?, ?, ?, ?)',
            topicId, sample.title, `${TASKS_PER_PACKAGE} Aufgaben zum Üben – jede auch mit neuen Zahlen`, Number(level), JSON.stringify(profiles), pkgSort++,
          ).lastInsertRowid);
          for (let k = 0; k < TASKS_PER_PACKAGE; k++) {
            const variants = makeVariants(gen, seedOf('practice', ti, profiles.join(), rungNo, k));
            insertTask({
              kind: 'practice', topicId, packageId: pkgId, title: `${sample.title} ${k + 1}`,
              sectionId: sectionIds[variants[0].section] ?? null, sort: k, variants,
            });
          }
          for (const ex of t.extras || []) {
            if (ex.rung !== rungNo) continue;
            insertTask({
              kind: 'practice', topicId, packageId: pkgId, title: ex.title,
              sectionId: sectionIds[ex.section] ?? null, sort: TASKS_PER_PACKAGE, variants: [ex],
            });
          }
        }
      }
    });
  });
}

function seedSettings() {
  const defaults = {
    chatbot_url: '',
    school_name: 'Oberschule',
    exam_date_HS10: '2027-05-06',
    exam_date_RS10: '2027-05-06',
    exam_date_ERS10: '2027-05-06',
    ai_check_enabled: 'false',
  };
  for (const [k, v] of Object.entries(defaults)) if (!getSetting(k, '')) setSetting(k, v);
}

// Demo-Kurs mit Beispielkindern, damit man die Plattform sofort ausprobieren kann.
export function seedDemo() {
  const pw = hashPassword('demo1234');
  const c10 = Number(run('INSERT INTO courses (name, description) VALUES (?, ?)', '10a Mathe (Demo)', 'Beispielkurs – kann gelöscht werden').lastInsertRowid);
  const mk = (username, name, course, profile) => Number(run(
    `INSERT INTO users (username, password_hash, role, display_name, course_id, profile, onboarded, topics_asked) VALUES (?, ?, 'student', ?, ?, ?, ?, ?)`,
    username, pw, name, course, profile, profile ? 1 : 0, profile ? 1 : 0,
  ).lastInsertRowid);

  mk('peter', 'Peter Neumann', c10, null); // erster Login: Auswahl + Diagnose
  const lea = mk('lea', 'Lea Beispiel', c10, 'RS10');
  const ali = mk('ali', 'Ali Demir', c10, 'HS10');

  // Lea hat beim ersten Login Themen angehakt, die ihr leichtfallen
  const easy = all("SELECT id FROM topics WHERE title IN ('Zahlen & Rechnen', 'Winkel, Dreiecke & Flächen', 'Wahrscheinlichkeit')").map((t) => t.id);
  run('UPDATE users SET easy_topics = ? WHERE id = ?', JSON.stringify(easy), lea);

  // Lea und Ali haben den Diagnosetest schon gemacht (simuliert)
  for (const [uid, profile, skill] of [[lea, 'RS10', 0.6], [ali, 'HS10', 0.45]]) {
    const r = rng(uid * 97);
    const runId = Number(run("INSERT INTO diag_runs (user_id, number, profile, status, finished_at) VALUES (?, 1, ?, 'done', datetime('now', '-9 days'))", uid, profile).lastInsertRowid);
    let sort = 0;
    for (const t of all("SELECT t.*, (SELECT id FROM task_variants v WHERE v.task_id = t.id ORDER BY sort LIMIT 1) AS vid FROM tasks t WHERE kind = 'diagnose' AND profile = ? ORDER BY topic_id, difficulty", profile)) {
      const correct = r() < skill + (2 - t.difficulty) * 0.25 ? 1 : 0;
      run(
        "INSERT INTO diag_items (run_id, task_id, variant_id, topic_id, difficulty, sort, answer, correct, time_ms, answered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-9 days'))",
        runId, t.id, t.vid, t.topic_id, t.difficulty, sort++, JSON.stringify(['–']), correct, r.int(25, 240) * 1000,
      );
    }
    run('UPDATE users SET diag_unlocked = 0 WHERE id = ?', uid);
    buildPlanFromRun(uid, runId);
  }

  // Etwas Fortschritt für Lea
  const leaPlan = all('SELECT * FROM plan_items WHERE user_id = ? ORDER BY sort LIMIT 3', lea);
  for (const p of leaPlan) {
    const tasks = all("SELECT t.id FROM tasks t JOIN packages pk ON pk.id = t.package_id WHERE t.topic_id = ? AND pk.level = ? AND pk.profiles LIKE '%RS10%' LIMIT 3", p.topic_id, JSON.parse(p.levels)[0]);
    tasks.forEach((t, i) => run(
      'INSERT INTO task_progress (user_id, task_id, attempts, solved, solution_viewed, time_ms) VALUES (?, ?, ?, ?, ?, ?)',
      lea, t.id, i + 1, i < 2 ? 1 : 0, i === 2 ? 1 : 0, (i + 1) * 95000,
    ));
  }
  if (leaPlan[0]) {
    run('INSERT INTO feedback (user_id, topic_id, text) VALUES (?, ?, ?)', lea, leaPlan[0].topic_id,
      'Super, dass du hier schon so fleißig geübt hast! Schau dir im Skript noch einmal das Beispiel an – dann klappt auch die letzte Aufgabe. 💪');
  }

  // Termine (Input-Veranstaltungen)
  const topicIds = all('SELECT id, title FROM topics ORDER BY sort');
  const day = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
  const ev = [[c10, 2, 'Prozent & Zinsen'], [c10, 9, 'Satz des Pythagoras'], [c10, 16, 'Quadratische Funktionen & Gleichungen'], [c10, 23, 'Zuordnungen & Dreisatz']];
  for (const [course, d, title] of ev) {
    const t = topicIds.find((x) => x.title === title);
    run('INSERT INTO events (course_id, topic_id, title, date, time, room, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      course, t?.id ?? null, `Wiederholung: ${title}`, day(d), '7./8. Stunde', 'Raum 204', 'Bring deinen Taschenrechner mit.');
  }
}

// Ältere Installationen: Stichworte/Beispiele einmalig für die Standardthemen ergänzen.
function seedTopicHints() {
  if (getSetting('topic_hints_v1', '')) return;
  for (const [title, h] of Object.entries(TOPIC_HINTS)) {
    run("UPDATE topics SET keywords = ?, example = ? WHERE title = ? AND keywords = '' AND example = ''", h.keywords, h.example, title);
  }
  setSetting('topic_hints_v1', '1');
}

export function seedIfEmpty() {
  seedSettings();
  if (get('SELECT COUNT(*) AS n FROM topics').n === 0) {
    console.log('Lege Beispielinhalte an …');
    seedContent();
    if (process.env.SEED_DEMO !== 'false' && get("SELECT COUNT(*) AS n FROM users WHERE role = 'student'").n === 0) {
      tx(seedDemo);
      console.log('Demo-Kurs angelegt (Kennungen: peter, lea, ali – Passwort: demo1234)');
    }
    const c = get("SELECT (SELECT COUNT(*) FROM tasks WHERE kind='diagnose') AS d, (SELECT COUNT(*) FROM tasks WHERE kind='practice') AS p, (SELECT COUNT(*) FROM task_variants) AS v");
    console.log(`Fertig: ${TOPICS.length} Themen, ${c.d} Diagnoseaufgaben, ${c.p} Übungsaufgaben, ${c.v} Varianten.`);
  }
  seedTopicHints();
}

// Direkter Aufruf: npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed/index.js')) {
  seedIfEmpty();
}
