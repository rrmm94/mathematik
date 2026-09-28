import { Router } from 'express';
import { all, get, run, json, tx, getSetting } from '../db.js';
import { requireStudent } from '../auth.js';
import { checkAnswer, publicAnswerSpec, answerSummary } from '../../shared/checker.js';
import { buildPlanFromRun, runTopicScores, topicsForProfile, packagesFor, topicProgress, syncPlan } from '../plan.js';
import { PROFILES, GOAL_OPTIONS } from '../../shared/constants.js';
import { publicUser } from './auth.js';

// WICHTIG: Keine Antwort dieses Routers darf Niveaustufen, Schwierigkeitsgrade
// oder G/E-Kurse enthalten. Die Kinder sollen ihr Niveau nicht erkennen.

const r = Router();
r.use(requireStudent);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const topicPublic = (t) => ({ id: t.id, title: t.title, description: t.description, icon: t.icon, color: t.color });
const clampTime = (ms) => Math.max(0, Math.min(Number(ms) || 0, 3 * 3600e3));

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Erster Login ----------
r.get('/onboarding', (_req, res) => res.json({ options: GOAL_OPTIONS }));

r.post('/onboarding', (req, res) => {
  const grade = Number(req.body?.grade);
  const profile = String(req.body?.profile || '');
  if (![9, 10].includes(grade) || !GOAL_OPTIONS[grade].some((o) => o.profile === profile)) {
    return res.status(400).json({ error: 'Bitte wähle Jahrgang und Ziel aus.' });
  }
  run('UPDATE users SET grade = ?, profile = ?, onboarded = 1 WHERE id = ?', grade, profile, req.user.id);
  res.json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

// ---------- Startseite ----------
r.get('/dashboard', (req, res) => {
  const u = req.user;
  syncPlan(u.id);
  const examDate = getSetting(`exam_date_${u.profile}`, '');
  const daysLeft = examDate ? Math.ceil((new Date(examDate + 'T08:00:00') - new Date()) / 864e5) : null;

  const runs = all('SELECT * FROM diag_runs WHERE user_id = ? ORDER BY number', u.id);
  const activeRun = runs.find((x) => x.status === 'active');
  const finished = runs.filter((x) => x.status === 'done');

  const planRows = all(
    `SELECT p.*, t.title, t.description, t.icon, t.color, t.sort AS tsort FROM plan_items p
     JOIN topics t ON t.id = p.topic_id WHERE p.user_id = ? ORDER BY p.sort`,
    u.id,
  );
  const plan = planRows.map((p) => {
    const levels = json(p.levels, [1]);
    const sections = all('SELECT id FROM script_sections WHERE topic_id = ? LIMIT 1', p.topic_id);
    return {
      topic: { id: p.topic_id, title: p.title, description: p.description, icon: p.icon, color: p.color },
      progress: topicProgress(u.id, p.topic_id, u.profile, levels),
      hasScript: sections.length > 0,
    };
  });

  const feedback = all(
    `SELECT f.id, f.text, f.created_at, f.read_at, t.title AS topic_title, t.id AS topic_id, t.icon
     FROM feedback f LEFT JOIN topics t ON t.id = f.topic_id WHERE f.user_id = ? ORDER BY f.created_at DESC LIMIT 20`,
    u.id,
  );

  const events = all(
    `SELECT e.id, e.title, e.date, e.time, e.room, e.note, t.title AS topic_title, t.icon, t.id AS topic_id
     FROM events e LEFT JOIN topics t ON t.id = e.topic_id
     WHERE (e.course_id = ? OR e.course_id IS NULL) AND e.date >= ? ORDER BY e.date, e.time LIMIT 8`,
    u.course_id, today(),
  );

  // Rückmeldung zum letzten Wiederholungstest (ohne Stufen!)
  let retest = null;
  const last = finished[finished.length - 1];
  if (last && last.number > 1) retest = { finishedAt: last.finished_at, improved: improvedTopics(u.id, last.id) };

  res.json({
    user: publicUser(u),
    goal: PROFILES[u.profile]?.label,
    examDate,
    daysLeft,
    diagnose: {
      hasPlan: plan.length > 0,
      active: activeRun ? { id: activeRun.id, retest: activeRun.number > 1, ...runProgress(activeRun.id) } : null,
      canStart: !activeRun && (!!u.diag_unlocked || finished.length === 0),
      isRetest: finished.length > 0,
    },
    plan,
    feedback,
    events,
    retest,
  });
});

function runProgress(runId) {
  const r2 = get('SELECT COUNT(*) AS total, SUM(CASE WHEN answered_at IS NOT NULL THEN 1 ELSE 0 END) AS answered FROM diag_items WHERE run_id = ?', runId);
  return { total: r2.total, answered: r2.answered || 0 };
}

// Themen, in denen sich ein Kind im Vergleich zum vorherigen Test verbessert hat.
function improvedTopics(userId, runId) {
  const runRow = get('SELECT * FROM diag_runs WHERE id = ?', runId);
  const prev = get("SELECT * FROM diag_runs WHERE user_id = ? AND number < ? AND status = 'done' ORDER BY number DESC LIMIT 1", userId, runRow.number);
  if (!prev) return [];
  const a = runTopicScores(prev.id);
  const b = runTopicScores(runId);
  const out = [];
  for (const [topicId, s] of Object.entries(b)) {
    const before = a[topicId];
    if (before && s.total && before.total && s.correct / s.total > before.correct / before.total) {
      const t = get('SELECT * FROM topics WHERE id = ?', Number(topicId));
      if (t) out.push(topicPublic(t));
    }
  }
  return out;
}

// ---------- Diagnosetest ----------
r.post('/diagnose/start', (req, res) => {
  const u = req.user;
  const active = get("SELECT * FROM diag_runs WHERE user_id = ? AND status = 'active'", u.id);
  if (active) return res.json({ runId: active.id });
  const doneCount = get("SELECT COUNT(*) AS n FROM diag_runs WHERE user_id = ? AND status = 'done'", u.id).n;
  if (doneCount > 0 && !u.diag_unlocked) return res.status(403).json({ error: 'Der Test ist gerade nicht freigeschaltet.' });

  const topics = topicsForProfile(u.profile);
  const runId = tx(() => {
    const number = (get('SELECT MAX(number) AS n FROM diag_runs WHERE user_id = ?', u.id).n || 0) + 1;
    const id = Number(run('INSERT INTO diag_runs (user_id, number, profile) VALUES (?, ?, ?)', u.id, number, u.profile).lastInsertRowid);
    let sort = 0;
    for (const t of topics) {
      const tasks = all("SELECT * FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = ? ORDER BY difficulty, sort, id", t.id, u.profile);
      for (const task of tasks) {
        const variants = all('SELECT id FROM task_variants WHERE task_id = ?', task.id);
        if (!variants.length) continue;
        run('INSERT INTO diag_items (run_id, task_id, variant_id, topic_id, difficulty, sort) VALUES (?, ?, ?, ?, ?, ?)', id, task.id, pick(variants).id, t.id, task.difficulty, sort++);
      }
    }
    run('UPDATE users SET diag_unlocked = 0 WHERE id = ?', u.id);
    return id;
  });
  res.json({ runId });
});

r.get('/diagnose', (req, res) => {
  const active = get("SELECT * FROM diag_runs WHERE user_id = ? AND status = 'active'", req.user.id);
  if (!active) return res.json({ run: null });
  const items = all(
    `SELECT i.id, i.topic_id, i.answer, i.answered_at, v.prompt, v.answer AS spec, t.title AS topic_title, t.icon, t.color
     FROM diag_items i JOIN task_variants v ON v.id = i.variant_id JOIN topics t ON t.id = i.topic_id
     WHERE i.run_id = ? ORDER BY i.sort`,
    active.id,
  );
  res.json({
    run: { id: active.id, retest: active.number > 1 },
    items: items.map((i) => ({
      id: i.id,
      topic: { id: i.topic_id, title: i.topic_title, icon: i.icon, color: i.color },
      prompt: i.prompt,
      spec: publicAnswerSpec(json(i.spec, {})),
      answer: json(i.answer, null),
      answered: !!i.answered_at,
    })),
  });
});

r.post('/diagnose/items/:id', (req, res) => {
  const item = get(
    `SELECT i.*, v.answer AS spec FROM diag_items i JOIN diag_runs d ON d.id = i.run_id JOIN task_variants v ON v.id = i.variant_id
     WHERE i.id = ? AND d.user_id = ? AND d.status = 'active'`,
    Number(req.params.id), req.user.id,
  );
  if (!item) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
  const answer = req.body?.answer ?? null;
  const { correct } = checkAnswer(json(item.spec, {}), answer);
  run(
    'UPDATE diag_items SET answer = ?, correct = ?, time_ms = time_ms + ?, answered_at = CURRENT_TIMESTAMP WHERE id = ?',
    JSON.stringify(answer), correct === null ? null : correct ? 1 : 0, clampTime(req.body?.time_ms), item.id,
  );
  res.json({ ok: true }); // bewusst ohne Richtig/Falsch-Rückmeldung
});

r.post('/diagnose/finish', (req, res) => {
  const u = req.user;
  const active = get("SELECT * FROM diag_runs WHERE user_id = ? AND status = 'active'", u.id);
  if (!active) return res.status(404).json({ error: 'Kein laufender Test.' });
  run("UPDATE diag_runs SET status = 'done', finished_at = CURRENT_TIMESTAMP WHERE id = ?", active.id);
  const hasPlan = get('SELECT COUNT(*) AS n FROM plan_items WHERE user_id = ?', u.id).n > 0;
  if (active.number === 1 || !hasPlan) {
    buildPlanFromRun(u.id, active.id);
    return res.json({ kind: 'initial' });
  }
  res.json({ kind: 'retest', improved: improvedTopics(u.id, active.id) });
});

// ---------- Themen & Übungen ----------
function planLevels(userId, topicId) {
  const p = get('SELECT levels FROM plan_items WHERE user_id = ? AND topic_id = ?', userId, topicId);
  return p ? json(p.levels, [1]) : null;
}

r.get('/topics/:id', (req, res) => {
  const u = req.user;
  const topic = get('SELECT * FROM topics WHERE id = ?', Number(req.params.id));
  const levels = topic && planLevels(u.id, topic.id);
  if (!topic || !levels) return res.status(404).json({ error: 'Thema nicht gefunden.' });
  const pkgs = packagesFor(u.id, topic.id, u.profile, levels).map((p) => {
    const s = get(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN tp.solved = 1 THEN 1 ELSE 0 END) AS solved
       FROM tasks t LEFT JOIN task_progress tp ON tp.task_id = t.id AND tp.user_id = ? WHERE t.package_id = ?`,
      u.id, p.id,
    );
    return { id: p.id, title: p.title, description: p.description, total: s.total, solved: s.solved || 0 };
  });
  const sections = all('SELECT id, title FROM script_sections WHERE topic_id = ? ORDER BY sort, id', topic.id);
  const feedback = all('SELECT id, text, created_at, read_at FROM feedback WHERE user_id = ? AND topic_id = ? ORDER BY created_at DESC', u.id, topic.id);
  const events = all('SELECT id, title, date, time, room FROM events WHERE topic_id = ? AND (course_id = ? OR course_id IS NULL) AND date >= ? ORDER BY date', topic.id, u.course_id, today());
  res.json({ topic: topicPublic(topic), progress: topicProgress(u.id, topic.id, u.profile, levels), packages: pkgs, sections, feedback, events });
});

// Prüft, ob ein Paket für das Kind freigeschaltet ist.
function allowedPackage(u, packageId) {
  const p = get('SELECT * FROM packages WHERE id = ?', packageId);
  if (!p) return null;
  const levels = planLevels(u.id, p.topic_id);
  if (!levels) return null;
  return packagesFor(u.id, p.topic_id, u.profile, levels).some((x) => x.id === p.id) ? p : null;
}

function taskView(u, task, forceNew = false) {
  const variants = all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort, id', task.id);
  if (!variants.length) return null;
  let prog = get('SELECT * FROM task_progress WHERE user_id = ? AND task_id = ?', u.id, task.id);
  let variant = prog && variants.find((v) => v.id === prog.variant_id);
  if (!variant || forceNew) {
    const others = variants.filter((v) => !variant || v.id !== variant.id);
    variant = pick(others.length ? others : variants);
    run(
      `INSERT INTO task_progress (user_id, task_id, variant_id) VALUES (?, ?, ?)
       ON CONFLICT(user_id, task_id) DO UPDATE SET variant_id = excluded.variant_id`,
      u.id, task.id, variant.id,
    );
    prog = get('SELECT * FROM task_progress WHERE user_id = ? AND task_id = ?', u.id, task.id);
  }
  return {
    id: task.id,
    title: task.title,
    variantId: variant.id,
    variantCount: variants.length,
    prompt: variant.prompt,
    hint: variant.hint || '',
    spec: publicAnswerSpec(json(variant.answer, {})),
    scriptSectionId: task.script_section_id,
    topicId: task.topic_id,
    solved: !!prog?.solved,
    attempts: prog?.attempts || 0,
  };
}

r.get('/packages/:id', (req, res) => {
  const u = req.user;
  const p = allowedPackage(u, Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Übungspaket nicht gefunden.' });
  const topic = get('SELECT * FROM topics WHERE id = ?', p.topic_id);
  const tasks = all("SELECT * FROM tasks WHERE package_id = ? AND kind = 'practice' ORDER BY sort, id", p.id)
    .map((t) => taskView(u, t))
    .filter(Boolean);
  res.json({ package: { id: p.id, title: p.title, description: p.description }, topic: topicPublic(topic), tasks });
});

function allowedTask(u, taskId) {
  const t = get("SELECT * FROM tasks WHERE id = ? AND kind = 'practice'", taskId);
  if (!t || !allowedPackage(u, t.package_id)) return null;
  return t;
}

r.post('/tasks/:id/check', (req, res) => {
  const u = req.user;
  const task = allowedTask(u, Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
  const variant = get('SELECT * FROM task_variants WHERE id = ? AND task_id = ?', Number(req.body?.variantId), task.id);
  if (!variant) return res.status(400).json({ error: 'Variante unbekannt.' });
  const spec = json(variant.answer, {});
  const answer = req.body?.answer ?? null;
  const result = checkAnswer(spec, answer);
  const ms = clampTime(req.body?.time_ms);
  // Freitext: Einreichen zählt als "bearbeitet" – Selbstvergleich mit Musterlösung
  const solvedNow = result.correct === true || spec.type === 'free';
  tx(() => {
    run('INSERT INTO attempts (user_id, task_id, variant_id, answer, correct, time_ms) VALUES (?, ?, ?, ?, ?, ?)', u.id, task.id, variant.id, JSON.stringify(answer), result.correct === null ? null : result.correct ? 1 : 0, ms);
    run(
      `INSERT INTO task_progress (user_id, task_id, attempts, solved, time_ms, variant_id) VALUES (?, ?, 1, ?, ?, ?)
       ON CONFLICT(user_id, task_id) DO UPDATE SET attempts = attempts + 1, solved = MAX(solved, excluded.solved),
         time_ms = time_ms + excluded.time_ms, updated_at = CURRENT_TIMESTAMP`,
      u.id, task.id, solvedNow ? 1 : 0, ms, variant.id,
    );
  });
  const out = { correct: result.correct, parts: result.parts || null };
  if (spec.type === 'free') Object.assign(out, { solution: variant.solution, summary: answerSummary(spec) });
  res.json(out);
});

r.post('/tasks/:id/solution', (req, res) => {
  const u = req.user;
  const task = allowedTask(u, Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
  const variant = get('SELECT * FROM task_variants WHERE id = ? AND task_id = ?', Number(req.body?.variantId), task.id);
  if (!variant) return res.status(400).json({ error: 'Variante unbekannt.' });
  run(
    `INSERT INTO task_progress (user_id, task_id, solution_viewed, variant_id) VALUES (?, ?, 1, ?)
     ON CONFLICT(user_id, task_id) DO UPDATE SET solution_viewed = 1, updated_at = CURRENT_TIMESTAMP`,
    u.id, task.id, variant.id,
  );
  res.json({ solution: variant.solution, summary: answerSummary(json(variant.answer, {})) });
});

r.post('/tasks/:id/new-variant', (req, res) => {
  const u = req.user;
  const task = allowedTask(u, Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
  res.json({ task: taskView(u, task, true) });
});

// ---------- Skript ----------
r.get('/script/:topicId', (req, res) => {
  const topic = get('SELECT * FROM topics WHERE id = ?', Number(req.params.topicId));
  if (!topic) return res.status(404).json({ error: 'Thema nicht gefunden.' });
  const sections = all('SELECT id, title, blocks FROM script_sections WHERE topic_id = ? ORDER BY sort, id', topic.id).map((s) => ({ ...s, blocks: json(s.blocks, []) }));
  const topics = topicsForProfile(req.user.profile).map(topicPublic);
  res.json({ topic: topicPublic(topic), sections, topics });
});

// ---------- Feedback ----------
r.post('/feedback/read', (req, res) => {
  const ids = (req.body?.ids || []).map(Number);
  for (const id of ids) run('UPDATE feedback SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND read_at IS NULL', id, req.user.id);
  res.json({ ok: true });
});

export default r;
