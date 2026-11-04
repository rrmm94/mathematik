import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { all, get, run, json, tx, getSetting, setSetting, UPLOAD_DIR } from '../db.js';
import { requireAdmin, hashPassword } from '../auth.js';
import { runTopicScores, buildPlanFromRun, topicsForProfile, topicProgress, syncPlan, progressState, compareRuns, previousRun, nachtestTrend, practiceStats } from '../plan.js';
import { PROFILE_KEYS, MIN_STUDENT_PASSWORD } from '../../shared/constants.js';
import { checkAnswer, publicAnswerSpec, answerSummary } from '../../shared/checker.js';
import { attemptSummary, attemptSections } from './exams.js';
import { examByKey, scoreAttempt, reviewPart, SECTIONS, PART_TITLES } from '../exams/index.js';

const r = Router();
r.use(requireAdmin);

const id = (v) => Number(v);
const bad = (res, msg) => res.status(400).json({ error: msg });

// ---------- Übersicht ----------
r.get('/overview', (_req, res) => {
  const courses = all(
    `SELECT c.*, (SELECT COUNT(*) FROM users u WHERE u.course_id = c.id AND u.role = 'student') AS students
     FROM courses c ORDER BY c.name`,
  );
  const counts = get(
    `SELECT (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
            (SELECT COUNT(*) FROM topics) AS topics,
            (SELECT COUNT(*) FROM tasks WHERE kind = 'diagnose') AS diagnose,
            (SELECT COUNT(*) FROM tasks WHERE kind = 'practice') AS practice`,
  );
  const recent = all(
    `SELECT u.id, u.display_name, MAX(a.created_at) AS last, COUNT(*) AS n FROM attempts a JOIN users u ON u.id = a.user_id
     WHERE a.created_at >= datetime('now', '-7 days') GROUP BY u.id ORDER BY last DESC LIMIT 10`,
  );
  const openReports = get('SELECT COUNT(*) AS n FROM reports WHERE resolved_at IS NULL').n;
  res.json({ courses, counts, recent, openReports });
});

// ---------- Kurse ----------
r.get('/courses', (_req, res) => res.json(all('SELECT * FROM courses ORDER BY name')));
r.post('/courses', (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return bad(res, 'Name fehlt.');
  const info = run('INSERT INTO courses (name, description) VALUES (?, ?)', name, req.body?.description || '');
  res.json(get('SELECT * FROM courses WHERE id = ?', info.lastInsertRowid));
});
r.put('/courses/:id', (req, res) => {
  run('UPDATE courses SET name = ?, description = ? WHERE id = ?', String(req.body?.name || '').trim(), req.body?.description || '', id(req.params.id));
  res.json(get('SELECT * FROM courses WHERE id = ?', id(req.params.id)));
});
r.delete('/courses/:id', (req, res) => {
  run('DELETE FROM courses WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});

r.get('/courses/:id', (req, res) => {
  const course = get('SELECT * FROM courses WHERE id = ?', id(req.params.id));
  if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });
  const students = all("SELECT * FROM users WHERE course_id = ? AND role = 'student' ORDER BY display_name", course.id).map(studentSummary);
  res.json({ course, students });
});

// Alle Kinder (auch ohne Kurs)
r.get('/students', (_req, res) => {
  res.json(all("SELECT * FROM users WHERE role = 'student' ORDER BY display_name").map(studentSummary));
});

function studentSummary(u) {
  const runs = all('SELECT id, number, status, finished_at FROM diag_runs WHERE user_id = ? ORDER BY number', u.id);
  const plan = all('SELECT topic_id, levels, diag_level FROM plan_items WHERE user_id = ?', u.id);
  const state = progressState(u);
  const levelCounts = [0, 0, 0, 0];
  for (const p of plan) if (p.diag_level != null) levelCounts[p.diag_level]++;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    courseId: u.course_id,
    profile: u.profile,
    onboarded: !!u.onboarded,
    easyTopics: json(u.easy_topics, []),
    diagUnlocked: !!u.diag_unlocked,
    lastLogin: u.last_login,
    note: u.note,
    diagnose: runs.length ? { count: runs.filter((x) => x.status === 'done').length, active: runs.some((x) => x.status === 'active'), last: runs[runs.length - 1].finished_at } : null,
    // Einstiegstest (Durchlauf 1) getrennt von den Nachtests
    entry: runs.find((x) => x.number === 1) ? { done: runs.find((x) => x.number === 1).status === 'done', finishedAt: runs.find((x) => x.number === 1).finished_at } : null,
    trend: nachtestTrend(u.id),
    practice: practiceStats(u.id),
    progress: state.progress.percent,
    progressDetail: state.progress,
    milestone: state.milestone,
    nachtest: state.nachtest,
    exam: state.exam,
    levelCounts,
  };
}

// ---------- Kinder anlegen / bearbeiten ----------
function makeUsername(name) {
  const base = name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/);
  let u = base.length > 1 ? `${base[0]}.${base[base.length - 1][0]}` : base[0] || 'kind';
  let candidate = u, n = 2;
  while (get('SELECT id FROM users WHERE username = ?', candidate)) candidate = `${u}${n++}`;
  return candidate;
}

const passwordError = (pw) => (pw.length < MIN_STUDENT_PASSWORD ? `Das Passwort muss mindestens ${MIN_STUDENT_PASSWORD} Zeichen lang sein.` : null);

function createStudent({ displayName, username, password, courseId, profile }) {
  const uname = (username && String(username).trim()) || makeUsername(displayName);
  if (get('SELECT id FROM users WHERE username = ?', uname)) throw new Error(`Kennung „${uname}“ ist schon vergeben.`);
  const info = run(
    `INSERT INTO users (username, password_hash, role, display_name, course_id, profile, onboarded)
     VALUES (?, ?, 'student', ?, ?, ?, ?)`,
    uname, hashPassword(password), displayName, courseId || null, profile || null, profile ? 1 : 0,
  );
  return { id: Number(info.lastInsertRowid), username: uname, password, displayName };
}

r.post('/students', (req, res) => {
  const b = req.body || {};
  const names = Array.isArray(b.names) ? b.names : [b.displayName];
  const clean = names.map((n) => String(n || '').trim()).filter(Boolean);
  if (!clean.length) return bad(res, 'Bitte mindestens einen Namen angeben.');
  const password = String(b.password || '');
  const pwErr = passwordError(password);
  if (pwErr) return bad(res, pwErr);
  if (b.profile && !PROFILE_KEYS.includes(b.profile)) return bad(res, 'Unbekanntes Ziel.');
  try {
    const created = tx(() => clean.map((displayName) => createStudent({
      displayName,
      username: clean.length === 1 ? b.username : null,
      password,
      courseId: b.courseId, profile: b.profile,
    })));
    res.json({ created });
  } catch (e) {
    bad(res, e.message);
  }
});

r.put('/students/:id', (req, res) => {
  const u = get("SELECT * FROM users WHERE id = ? AND role = 'student'", id(req.params.id));
  if (!u) return res.status(404).json({ error: 'Nicht gefunden.' });
  const b = req.body || {};
  if (b.username && b.username !== u.username && get('SELECT id FROM users WHERE username = ?', b.username)) return bad(res, 'Kennung ist schon vergeben.');
  if (b.profile && !PROFILE_KEYS.includes(b.profile)) return bad(res, 'Unbekanntes Ziel.');
  run(
    `UPDATE users SET display_name = ?, username = ?, course_id = ?, profile = ?, note = ?,
       onboarded = CASE WHEN ? IS NOT NULL THEN 1 ELSE onboarded END WHERE id = ?`,
    b.displayName ?? u.display_name, b.username ?? u.username, b.courseId === undefined ? u.course_id : b.courseId || null,
    b.profile === undefined ? u.profile : b.profile || null, b.note ?? u.note,
    b.profile ?? u.profile, u.id,
  );
  if (b.profile && b.profile !== u.profile) syncPlan(u.id);
  res.json(studentSummary(get('SELECT * FROM users WHERE id = ?', u.id)));
});

r.post('/students/:id/password', (req, res) => {
  const pw = String(req.body?.password || '');
  const pwErr = passwordError(pw);
  if (pwErr) return bad(res, pwErr);
  run("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'student'", hashPassword(pw), id(req.params.id));
  run('DELETE FROM sessions WHERE user_id = ?', id(req.params.id));
  res.json({ ok: true });
});

r.delete('/students/:id', (req, res) => {
  run("DELETE FROM users WHERE id = ? AND role = 'student'", id(req.params.id));
  res.json({ ok: true });
});

// Diagnosetest (erneut) freigeben – für ein Kind oder einen ganzen Kurs
r.post('/students/:id/unlock-diagnose', (req, res) => {
  run('UPDATE users SET diag_unlocked = ? WHERE id = ?', req.body?.unlock === false ? 0 : 1, id(req.params.id));
  res.json({ ok: true });
});
r.post('/courses/:id/unlock-diagnose', (req, res) => {
  run("UPDATE users SET diag_unlocked = ? WHERE course_id = ? AND role = 'student'", req.body?.unlock === false ? 0 : 1, id(req.params.id));
  res.json({ ok: true });
});

// Alles zurücksetzen (Diagnose, Plan, Fortschritt) – z. B. bei falschem Ziel
r.post('/students/:id/reset', (req, res) => {
  const uid = id(req.params.id);
  tx(() => {
    for (const t of ['diag_runs', 'plan_items', 'attempts', 'task_progress', 'exam_attempts']) run(`DELETE FROM ${t} WHERE user_id = ?`, uid);
    run('UPDATE users SET diag_unlocked = 1, milestone_at = NULL WHERE id = ?', uid);
  });
  res.json({ ok: true });
});

// ---------- Detailansicht eines Kindes ----------
r.get('/students/:id', (req, res) => {
  const u = get("SELECT * FROM users WHERE id = ? AND role = 'student'", id(req.params.id));
  if (!u) return res.status(404).json({ error: 'Nicht gefunden.' });
  syncPlan(u.id);

  const runs = all('SELECT * FROM diag_runs WHERE user_id = ? ORDER BY number', u.id).map((d) => {
    const items = all(
      `SELECT i.*, t.title AS task_title, v.prompt, v.context, v.source, v.solution, v.answer AS spec, v.sort AS variant_sort, tp.title AS topic_title
       FROM diag_items i JOIN tasks t ON t.id = i.task_id JOIN task_variants v ON v.id = i.variant_id JOIN topics tp ON tp.id = i.topic_id
       WHERE i.run_id = ? ORDER BY i.sort`,
      d.id,
    ).map((i) => ({
      id: i.id, taskId: i.task_id, topicId: i.topic_id, topicTitle: i.topic_title, taskTitle: i.task_title, difficulty: i.difficulty,
      source: i.source || '', variant: i.variant_sort + 1, prompt: i.prompt, context: i.context || '', answer: json(i.answer), spec: json(i.spec, {}), correct: i.correct, timeMs: i.time_ms, answeredAt: i.answered_at,
      ...answerView(json(i.spec, {}), json(i.answer)), solution: i.solution || '',
    }));
    // Nachtest: Vergleich mit dem vorherigen Test und dabei freigeschaltete Zusatzübungen
    const prev = d.status === 'done' && d.number > 1 ? previousRun(u.id, d) : null;
    const extraTopics = d.number > 1 ? all('SELECT topic_id FROM plan_items WHERE user_id = ? AND extra_run_id = ?', u.id, d.id).map((x) => x.topic_id) : [];
    return { ...d, items, scores: runTopicScores(d.id), compare: prev ? compareRuns(prev.id, d.id) : null, extraTopics };
  });

  const plan = all(
    `SELECT p.*, t.title, t.icon, t.color FROM plan_items p JOIN topics t ON t.id = p.topic_id WHERE p.user_id = ? ORDER BY p.sort`,
    u.id,
  ).map((p) => {
    const levels = json(p.levels, [1]);
    const tasks = all(
      `SELECT t.id, t.title, pk.title AS package_title, pk.level, tp.attempts, tp.solved, tp.solution_viewed, tp.time_ms, tp.updated_at,
              (SELECT COUNT(*) FROM attempts a WHERE a.user_id = ? AND a.task_id = t.id AND a.correct = 0) AS wrong,
              (SELECT value FROM task_ratings r WHERE r.user_id = ? AND r.task_id = t.id) AS rating,
              (SELECT COUNT(*) FROM feedback f WHERE f.user_id = ? AND f.task_id = t.id) AS feedback_count
       FROM tasks t JOIN packages pk ON pk.id = t.package_id
       LEFT JOIN task_progress tp ON tp.task_id = t.id AND tp.user_id = ?
       WHERE t.kind = 'practice' AND t.topic_id = ? ORDER BY pk.level, pk.sort, t.sort, t.id`,
      u.id, u.id, u.id, u.id, p.topic_id,
    );
    return {
      topicId: p.topic_id, title: p.title, icon: p.icon, color: p.color, sort: p.sort,
      diagLevel: p.diag_level, levels,
      extraLevels: json(p.extra_levels, []).filter((l) => !levels.includes(l)),
      progress: topicProgress(u.id, p.topic_id, u.profile, levels),
      tasks: tasks.filter((t) => t.attempts || t.solution_viewed || t.rating),
    };
  });

  const feedback = all(
    `SELECT f.*, t.title AS topic_title, tk.title AS task_title FROM feedback f LEFT JOIN topics t ON t.id = f.topic_id
     LEFT JOIN tasks tk ON tk.id = f.task_id WHERE f.user_id = ? ORDER BY f.created_at DESC`,
    u.id,
  );
  const reports = all(
    `SELECT r.*, pk.title AS package_title, t.title AS task_title FROM reports r LEFT JOIN packages pk ON pk.id = r.package_id
     LEFT JOIN tasks t ON t.id = r.task_id WHERE r.user_id = ? ORDER BY r.created_at DESC`,
    u.id,
  );
  const exams = all('SELECT * FROM exam_attempts WHERE user_id = ? ORDER BY id DESC', u.id).map(attemptSummary).filter(Boolean);
  res.json({ student: studentSummary(u), runs, plan, feedback, reports, exams });
});

// Ein Prüfungsdurchlauf im Detail: Antworten, Punkte je Teilaufgabe, Musterlösungen
r.get('/students/:id/exam-attempts/:aid', (req, res) => {
  const a = get('SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?', id(req.params.aid), id(req.params.id));
  const exam = a && examByKey(a.exam_key);
  if (!exam) return res.status(404).json({ error: 'Nicht gefunden.' });
  const sections = a.status === 'done' ? attemptSections(a) : [a.section === 'teil2' ? 'teil2' : 'teil1'];
  const partKeys = sections.flatMap((s) => SECTIONS.find((x) => x.key === s).parts);
  const answers = json(a.answers, {});
  res.json({
    exam: { key: exam.key, title: exam.title }, attempt: attemptSummary(a), answers, self: json(a.self, {}),
    score: scoreAttempt(exam, { answers, self: json(a.self, {}), choice: json(a.choice, []), sections }),
    review: Object.fromEntries(partKeys.map((pk) => [pk, { title: PART_TITLES[pk], groups: reviewPart(exam, pk) }])),
  });
});

// Antwort so aufbereiten, wie das Kind sie gesehen hat (öffentliche Spezifikation + Markierung je Feld).
function answerView(spec, answer) {
  const res = answer == null ? { correct: null } : checkAnswer(spec, answer);
  return { publicSpec: publicAnswerSpec(spec), parts: res.parts || null, summary: answerSummary(spec) };
}

// Eine Übungsaufgabe eines Kindes im Detail: Aufgabe, alle Eingaben der Reihe nach, Lösung, Bewertung, Feedback.
r.get('/students/:id/tasks/:taskId', (req, res) => {
  const u = get("SELECT * FROM users WHERE id = ? AND role = 'student'", id(req.params.id));
  const t = get("SELECT * FROM tasks WHERE id = ? AND kind = 'practice'", id(req.params.taskId));
  if (!u || !t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const pkg = get('SELECT id, title, level FROM packages WHERE id = ?', t.package_id);
  const topic = get('SELECT id, title, icon, color FROM topics WHERE id = ?', t.topic_id);
  const ids = all("SELECT id FROM tasks WHERE package_id = ? AND kind = 'practice' ORDER BY sort, id", t.package_id).map((x) => x.id);
  const variants = new Map(all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort, id', t.id).map((v, i) => [v.id, { ...v, no: i + 1 }]));
  const prog = get('SELECT * FROM task_progress WHERE user_id = ? AND task_id = ?', u.id, t.id);
  const attempts = all('SELECT * FROM attempts WHERE user_id = ? AND task_id = ? ORDER BY id', u.id, t.id).map((a) => {
    const v = variants.get(a.variant_id);
    const spec = json(v?.answer, {});
    const answer = json(a.answer, null);
    return { id: a.id, variantId: a.variant_id, correct: a.correct, timeMs: a.time_ms, createdAt: a.created_at, answer, ...answerView(spec, answer) };
  });
  // Varianten, die das Kind gesehen hat (bearbeitet oder aktuell zugeteilt)
  const seen = [...new Set([...attempts.map((a) => a.variantId), prog?.variant_id].filter((x) => variants.has(x)))];
  const draft = json(prog?.draft, null);
  res.json({
    task: { id: t.id, title: t.title, no: ids.indexOf(t.id) + 1 },
    package: pkg,
    topic,
    progress: prog ? { attempts: prog.attempts, solved: !!prog.solved, solutionViewed: !!prog.solution_viewed, timeMs: prog.time_ms, updatedAt: prog.updated_at, variantId: prog.variant_id } : null,
    variants: seen.map((vid) => {
      const v = variants.get(vid);
      const spec = json(v.answer, {});
      return { id: v.id, no: v.no, prompt: v.prompt, context: v.context || '', hint: v.hint || '', solution: v.solution || '', source: v.source || '', points: v.points || 0, publicSpec: publicAnswerSpec(spec), summary: answerSummary(spec) };
    }),
    attempts,
    draft: draft && variants.has(draft.variantId) ? { variantId: draft.variantId, answer: draft.answer, ...answerView(json(variants.get(draft.variantId).answer, {}), draft.answer) } : null,
    rating: get('SELECT value, updated_at FROM task_ratings WHERE user_id = ? AND task_id = ?', u.id, t.id) || null,
    feedback: all('SELECT * FROM feedback WHERE user_id = ? AND task_id = ? ORDER BY created_at DESC', u.id, t.id),
    reports: all('SELECT * FROM reports WHERE user_id = ? AND task_id = ? ORDER BY created_at DESC', u.id, t.id),
  });
});

// Lernplan anpassen: Reihenfolge + Stufen
r.put('/students/:id/plan', (req, res) => {
  const uid = id(req.params.id);
  const items = req.body?.items;
  if (!Array.isArray(items)) return bad(res, 'Ungültige Daten.');
  tx(() => {
    items.forEach((it, i) => {
      const norm = (arr) => [...new Set((arr || []).map(Number).filter((l) => l >= 0 && l <= 3))].sort();
      const levels = norm(it.levels);
      const final = levels.length ? levels : [1];
      // Zusatzübungen (nach Nachtest) getrennt halten; eine Stufe ist entweder Lernplan oder Zusatz
      const extra = it.extraLevels ? norm(it.extraLevels).filter((l) => !final.includes(l)) : null;
      if (extra) run('UPDATE plan_items SET sort = ?, levels = ?, extra_levels = ? WHERE user_id = ? AND topic_id = ?', i, JSON.stringify(final), JSON.stringify(extra), uid, id(it.topicId));
      else run('UPDATE plan_items SET sort = ?, levels = ? WHERE user_id = ? AND topic_id = ?', i, JSON.stringify(final), uid, id(it.topicId));
    });
  });
  res.json({ ok: true });
});

// Stufen aus einem (Wiederholungs-)Test übernehmen
r.post('/students/:id/plan/from-run/:runId', (req, res) => {
  const uid = id(req.params.id);
  const d = get("SELECT * FROM diag_runs WHERE id = ? AND user_id = ? AND status = 'done'", id(req.params.runId), uid);
  if (!d) return res.status(404).json({ error: 'Test nicht gefunden.' });
  if (req.body?.mode === 'rebuild') {
    buildPlanFromRun(uid, d.id);
  } else {
    // Nur Stufen anpassen, Reihenfolge behalten; bereits freigeschaltete Stufen bleiben erhalten
    const scores = runTopicScores(d.id);
    for (const [topicId, s] of Object.entries(scores)) {
      const p = get('SELECT levels FROM plan_items WHERE user_id = ? AND topic_id = ?', uid, Number(topicId));
      if (!p) continue;
      const levels = [...new Set([...json(p.levels, []), s.level])].sort();
      run('UPDATE plan_items SET levels = ?, diag_level = ? WHERE user_id = ? AND topic_id = ?', JSON.stringify(levels), s.level, uid, Number(topicId));
    }
  }
  res.json({ ok: true });
});

// ---------- Feedback ----------
r.post('/students/:id/feedback', (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return bad(res, 'Text fehlt.');
  const task = req.body?.taskId ? get('SELECT id, topic_id FROM tasks WHERE id = ?', id(req.body.taskId)) : null;
  const topicId = task ? task.topic_id : req.body?.topicId ? id(req.body.topicId) : null;
  run('INSERT INTO feedback (user_id, topic_id, task_id, text) VALUES (?, ?, ?, ?)', id(req.params.id), topicId, task?.id ?? null, text);
  res.json({ ok: true });
});

// ---------- Rückmeldungen der Kinder: gemeldete Probleme + Bewertungen ----------
r.get('/reports', (_req, res) => {
  const reports = all(
    `SELECT r.*, u.display_name, u.course_id, pk.title AS package_title, pk.level, pk.topic_id, tp.title AS topic_title, t.title AS task_title
     FROM reports r JOIN users u ON u.id = r.user_id LEFT JOIN packages pk ON pk.id = r.package_id
     LEFT JOIN topics tp ON tp.id = pk.topic_id LEFT JOIN tasks t ON t.id = r.task_id
     ORDER BY r.resolved_at IS NOT NULL, r.created_at DESC`,
  );
  const ratings = all(
    `SELECT t.id, t.title, pk.id AS package_id, pk.title AS package_title, pk.level, tp.id AS topic_id, tp.title AS topic_title,
            SUM(CASE WHEN r.value > 0 THEN 1 ELSE 0 END) AS up, SUM(CASE WHEN r.value < 0 THEN 1 ELSE 0 END) AS down,
            MAX(r.updated_at) AS last
     FROM task_ratings r JOIN tasks t ON t.id = r.task_id JOIN packages pk ON pk.id = t.package_id JOIN topics tp ON tp.id = t.topic_id
     GROUP BY t.id ORDER BY down DESC, up ASC, last DESC`,
  ).map((x) => {
    const ids = all("SELECT id FROM tasks WHERE package_id = ? AND kind = 'practice' ORDER BY sort, id", x.package_id).map((y) => y.id);
    const voters = all(
      'SELECT u.id, u.display_name, r.value FROM task_ratings r JOIN users u ON u.id = r.user_id WHERE r.task_id = ? ORDER BY r.value, u.display_name',
      x.id,
    );
    return { ...x, no: ids.indexOf(x.id) + 1, voters };
  });
  res.json({ reports, ratings });
});
r.put('/reports/:id', (req, res) => {
  run(`UPDATE reports SET resolved_at = ${req.body?.resolved === false ? 'NULL' : 'CURRENT_TIMESTAMP'} WHERE id = ?`, id(req.params.id));
  res.json({ ok: true });
});
r.delete('/reports/:id', (req, res) => {
  run('DELETE FROM reports WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});
r.delete('/feedback/:id', (req, res) => {
  run('DELETE FROM feedback WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});

// ---------- Themen ----------
r.get('/topics', (_req, res) => {
  const topics = all('SELECT * FROM topics ORDER BY sort, id').map((t) => ({
    ...t,
    profiles: json(t.profiles, []),
    counts: get(
      `SELECT (SELECT COUNT(*) FROM tasks WHERE topic_id = ? AND kind = 'diagnose') AS diagnose,
              (SELECT COUNT(*) FROM tasks WHERE topic_id = ? AND kind = 'practice') AS practice,
              (SELECT COUNT(*) FROM packages WHERE topic_id = ?) AS packages,
              (SELECT COUNT(*) FROM script_sections WHERE topic_id = ?) AS sections`,
      t.id, t.id, t.id, t.id,
    ),
  }));
  res.json(topics);
});
r.post('/topics', (req, res) => {
  const b = req.body || {};
  if (!String(b.title || '').trim()) return bad(res, 'Titel fehlt.');
  const sort = (get('SELECT MAX(sort) AS m FROM topics').m ?? -1) + 1;
  const info = run('INSERT INTO topics (title, description, icon, color, sort, profiles, keywords, example) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    b.title.trim(), b.description || '', b.icon || 'Sigma', b.color || 'indigo', sort, JSON.stringify(b.profiles || PROFILE_KEYS), b.keywords || '', b.example || '');
  res.json({ id: Number(info.lastInsertRowid) });
});
r.put('/topics/:id', (req, res) => {
  const t = get('SELECT * FROM topics WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const b = req.body || {};
  run('UPDATE topics SET title = ?, description = ?, icon = ?, color = ?, profiles = ?, keywords = ?, example = ? WHERE id = ?',
    b.title ?? t.title, b.description ?? t.description, b.icon ?? t.icon, b.color ?? t.color,
    b.profiles ? JSON.stringify(b.profiles) : t.profiles, b.keywords ?? t.keywords, b.example ?? t.example, t.id);
  res.json({ ok: true });
});
r.put('/topics-order', (req, res) => {
  tx(() => (req.body?.ids || []).forEach((tid, i) => run('UPDATE topics SET sort = ? WHERE id = ?', i, id(tid))));
  res.json({ ok: true });
});
r.delete('/topics/:id', (req, res) => {
  run('DELETE FROM topics WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});

// ---------- Übungspakete ----------
r.get('/topics/:id/packages', (req, res) => {
  const pkgs = all('SELECT * FROM packages WHERE topic_id = ? ORDER BY level, sort, id', id(req.params.id)).map((p) => ({
    ...p,
    profiles: json(p.profiles, []),
    tasks: all(`SELECT id, title, sort, (SELECT COUNT(*) FROM task_variants v WHERE v.task_id = tasks.id) AS variants,
                       (SELECT source FROM task_variants v WHERE v.task_id = tasks.id AND v.source != '' ORDER BY sort, id LIMIT 1) AS source,
                       (SELECT COUNT(*) FROM task_ratings r WHERE r.task_id = tasks.id AND r.value > 0) AS up,
                       (SELECT COUNT(*) FROM task_ratings r WHERE r.task_id = tasks.id AND r.value < 0) AS down,
                       (SELECT COUNT(*) FROM reports r WHERE r.task_id = tasks.id AND r.resolved_at IS NULL) AS open_reports
                FROM tasks WHERE package_id = ? ORDER BY sort, id`, p.id),
    openReports: get('SELECT COUNT(*) AS n FROM reports WHERE package_id = ? AND resolved_at IS NULL', p.id).n,
  }));
  res.json(pkgs);
});
r.post('/packages', (req, res) => {
  const b = req.body || {};
  if (!b.topicId || !String(b.title || '').trim()) return bad(res, 'Thema und Titel angeben.');
  const sort = (get('SELECT MAX(sort) AS m FROM packages WHERE topic_id = ?', id(b.topicId)).m ?? -1) + 1;
  const info = run('INSERT INTO packages (topic_id, title, description, level, profiles, sort) VALUES (?, ?, ?, ?, ?, ?)',
    id(b.topicId), b.title.trim(), b.description || '', Number(b.level ?? 1), JSON.stringify(b.profiles || []), sort);
  res.json({ id: Number(info.lastInsertRowid) });
});
r.put('/packages/:id', (req, res) => {
  const p = get('SELECT * FROM packages WHERE id = ?', id(req.params.id));
  if (!p) return res.status(404).json({ error: 'Nicht gefunden.' });
  const b = req.body || {};
  run('UPDATE packages SET title = ?, description = ?, level = ?, profiles = ?, sort = ? WHERE id = ?',
    b.title ?? p.title, b.description ?? p.description, b.level ?? p.level, b.profiles ? JSON.stringify(b.profiles) : p.profiles, b.sort ?? p.sort, p.id);
  res.json({ ok: true });
});
r.delete('/packages/:id', (req, res) => {
  run('DELETE FROM packages WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});

// ---------- Aufgaben ----------
r.get('/diagnose-tasks', (req, res) => {
  const profile = String(req.query.profile || 'HS10');
  const topics = all('SELECT * FROM topics ORDER BY sort, id').map((t) => ({
    ...t,
    profiles: json(t.profiles, []),
    tasks: all(
      `SELECT id, title, difficulty, sort, (SELECT COUNT(*) FROM task_variants v WHERE v.task_id = tasks.id) AS variants,
              (SELECT COUNT(*) FROM task_variants v WHERE v.task_id = tasks.id AND v.source LIKE 'Abschlussprüfung%') AS exam_variants,
              (SELECT prompt FROM task_variants v WHERE v.task_id = tasks.id ORDER BY sort, id LIMIT 1) AS preview
       FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = ? ORDER BY difficulty, sort, id`,
      t.id, profile,
    ),
  }));
  res.json({ profile, topics });
});

r.get('/topics/:id/section-titles', (req, res) => {
  res.json(all('SELECT id, title FROM script_sections WHERE topic_id = ? ORDER BY sort, id', id(req.params.id)));
});

r.get('/tasks/:id', (req, res) => {
  const t = get('SELECT * FROM tasks WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const variants = all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort, id', t.id).map((v) => ({ ...v, answer: json(v.answer, {}) }));
  const sections = all('SELECT id, title FROM script_sections WHERE topic_id = ? ORDER BY sort, id', t.topic_id);
  const topic = get('SELECT id, title FROM topics WHERE id = ?', t.topic_id);
  const pkg = t.package_id ? get('SELECT id, title, level FROM packages WHERE id = ?', t.package_id) : null;
  const stats = get('SELECT COUNT(*) AS attempts, SUM(correct) AS correct, AVG(time_ms) AS avg_ms FROM attempts WHERE task_id = ?', t.id);
  const topics = all('SELECT id, title FROM topics ORDER BY sort, id');
  res.json({ task: t, variants, sections, topic, topics, package: pkg, stats });
});

function saveVariants(taskId, variants) {
  const keep = [];
  (variants || []).slice(0, 8).forEach((v, i) => {
    const data = [v.prompt || '', JSON.stringify(v.answer || { type: 'free' }), v.solution || '', v.hint || '', v.context || '', Math.max(0, Math.min(Number(v.points) || 0, 20)), String(v.source || '').slice(0, 500), i];
    if (v.id && get('SELECT id FROM task_variants WHERE id = ? AND task_id = ?', v.id, taskId)) {
      run('UPDATE task_variants SET prompt = ?, answer = ?, solution = ?, hint = ?, context = ?, points = ?, source = ?, sort = ? WHERE id = ?', ...data, v.id);
      keep.push(v.id);
    } else {
      keep.push(Number(run('INSERT INTO task_variants (task_id, prompt, answer, solution, hint, context, points, source, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', taskId, ...data).lastInsertRowid));
    }
  });
  const existing = all('SELECT id FROM task_variants WHERE task_id = ?', taskId).map((x) => x.id);
  for (const vid of existing) if (!keep.includes(vid)) run('DELETE FROM task_variants WHERE id = ?', vid);
}

r.post('/tasks', (req, res) => {
  const b = req.body || {};
  if (!['diagnose', 'practice'].includes(b.kind) || !b.topicId) return bad(res, 'Art und Thema angeben.');
  const newId = tx(() => {
    const sort = (get('SELECT MAX(sort) AS m FROM tasks WHERE topic_id = ? AND kind = ?', id(b.topicId), b.kind).m ?? -1) + 1;
    const info = run(
      'INSERT INTO tasks (kind, topic_id, package_id, profile, difficulty, title, script_section_id, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      b.kind, id(b.topicId), b.packageId || null, b.kind === 'diagnose' ? b.profile : null, b.kind === 'diagnose' ? Number(b.difficulty || 1) : null,
      b.title || 'Neue Aufgabe', b.scriptSectionId || null, sort,
    );
    const tid = Number(info.lastInsertRowid);
    saveVariants(tid, b.variants || [{ prompt: '', answer: { type: 'fields', parts: [{ label: '', kind: 'number', value: 0, tolerance: 0 }] }, solution: '' }]);
    return tid;
  });
  res.json({ id: newId });
});

r.put('/tasks/:id', (req, res) => {
  const t = get('SELECT * FROM tasks WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const b = req.body || {};
  // Anderes Thema: Paket (bei Übungsaufgaben) muss zum neuen Thema gehören, der Skript-Abschnitt ebenso
  const topicId = b.topicId ? id(b.topicId) : t.topic_id;
  if (topicId !== t.topic_id && !get('SELECT id FROM topics WHERE id = ?', topicId)) return bad(res, 'Thema unbekannt.');
  if (t.kind === 'practice' && (topicId !== t.topic_id || b.packageId) && !get('SELECT id FROM packages WHERE id = ? AND topic_id = ?', b.packageId ?? t.package_id, topicId)) return bad(res, 'Bitte ein Übungspaket des gewählten Themas wählen.');
  const sectionId = b.scriptSectionId === undefined ? t.script_section_id : b.scriptSectionId || null;
  tx(() => {
    run('UPDATE tasks SET topic_id = ?, title = ?, difficulty = ?, profile = ?, package_id = ?, script_section_id = ?, sort = ? WHERE id = ?',
      topicId, b.title ?? t.title, b.difficulty ?? t.difficulty, b.profile ?? t.profile, b.packageId === undefined ? t.package_id : b.packageId,
      sectionId && get('SELECT id FROM script_sections WHERE id = ? AND topic_id = ?', sectionId, topicId) ? sectionId : null, b.sort ?? t.sort, t.id);
    if (Array.isArray(b.variants)) saveVariants(t.id, b.variants);
  });
  res.json({ ok: true });
});

// Alle Aufgaben mit Gruppe (Diagnose: Abschluss + Schwierigkeit, Übung: Paket) als Ziele zum Kopieren einer Variante
r.get('/task-targets', (_req, res) => {
  res.json(all(
    `SELECT t.id, t.title, t.kind, t.profile, t.difficulty, t.topic_id, t.package_id, pk.title AS package_title,
            (SELECT COUNT(*) FROM task_variants v WHERE v.task_id = t.id) AS variants,
            (SELECT prompt FROM task_variants v WHERE v.task_id = t.id ORDER BY sort, id LIMIT 1) AS preview
     FROM tasks t LEFT JOIN packages pk ON pk.id = t.package_id
     ORDER BY t.kind, t.profile, t.difficulty, t.sort, t.id`,
  ));
});

// Eine Variante als neue (letzte) Variante an eine bestehende Aufgabe hängen
r.post('/tasks/:id/variants', (req, res) => {
  const t = get('SELECT id FROM tasks WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const n = get('SELECT COUNT(*) AS n FROM task_variants WHERE task_id = ?', t.id).n;
  if (n >= 8) return bad(res, 'Diese Aufgabe hat schon 8 Varianten.');
  const v = req.body?.variant || {};
  run('INSERT INTO task_variants (task_id, prompt, answer, solution, hint, context, points, source, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    t.id, v.prompt || '', JSON.stringify(v.answer || { type: 'free' }), v.solution || '', v.hint || '', v.context || '',
    Math.max(0, Math.min(Number(v.points) || 0, 20)), String(v.source || '').slice(0, 500), n);
  res.json({ ok: true, variants: n + 1 });
});

r.post('/tasks/:id/duplicate', (req, res) => {
  const t = get('SELECT * FROM tasks WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const newId = tx(() => {
    const info = run('INSERT INTO tasks (kind, topic_id, package_id, profile, difficulty, title, script_section_id, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      t.kind, t.topic_id, t.package_id, req.body?.profile || t.profile, t.difficulty, `${t.title} (Kopie)`, t.script_section_id, t.sort + 1);
    const nid = Number(info.lastInsertRowid);
    for (const v of all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort', t.id)) {
      run('INSERT INTO task_variants (task_id, prompt, answer, solution, hint, context, points, source, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', nid, v.prompt, v.answer, v.solution, v.hint, v.context, v.points, v.source, v.sort);
    }
    return nid;
  });
  res.json({ id: newId });
});

r.delete('/tasks/:id', (req, res) => {
  run('DELETE FROM tasks WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});

// ---------- Skript ----------
r.get('/topics/:id/script', (req, res) => {
  const topic = get('SELECT * FROM topics WHERE id = ?', id(req.params.id));
  if (!topic) return res.status(404).json({ error: 'Nicht gefunden.' });
  const sections = all('SELECT * FROM script_sections WHERE topic_id = ? ORDER BY sort, id', topic.id).map((s) => ({ ...s, blocks: json(s.blocks, []) }));
  res.json({ topic, sections });
});
r.post('/script-sections', (req, res) => {
  const b = req.body || {};
  const sort = (get('SELECT MAX(sort) AS m FROM script_sections WHERE topic_id = ?', id(b.topicId)).m ?? -1) + 1;
  const info = run('INSERT INTO script_sections (topic_id, title, sort, blocks) VALUES (?, ?, ?, ?)', id(b.topicId), b.title || 'Neuer Abschnitt', sort, JSON.stringify(b.blocks || [{ type: 'text', md: '' }]));
  res.json({ id: Number(info.lastInsertRowid) });
});
r.put('/script-sections/:id', (req, res) => {
  const s = get('SELECT * FROM script_sections WHERE id = ?', id(req.params.id));
  if (!s) return res.status(404).json({ error: 'Nicht gefunden.' });
  const b = req.body || {};
  run('UPDATE script_sections SET title = ?, blocks = ?, sort = ? WHERE id = ?', b.title ?? s.title, b.blocks ? JSON.stringify(b.blocks) : s.blocks, b.sort ?? s.sort, s.id);
  res.json({ ok: true });
});
r.put('/script-order', (req, res) => {
  tx(() => (req.body?.ids || []).forEach((sid, i) => run('UPDATE script_sections SET sort = ? WHERE id = ?', i, id(sid))));
  res.json({ ok: true });
});
r.delete('/script-sections/:id', (req, res) => {
  run('DELETE FROM script_sections WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});

// ---------- Termine ----------
r.get('/events', (_req, res) => {
  res.json(all(
    `SELECT e.*, c.name AS course_name, t.title AS topic_title FROM events e
     LEFT JOIN courses c ON c.id = e.course_id LEFT JOIN topics t ON t.id = e.topic_id ORDER BY e.date, e.time`,
  ));
});
r.post('/events', (req, res) => {
  const b = req.body || {};
  if (!b.date || !String(b.title || '').trim()) return bad(res, 'Datum und Titel angeben.');
  const courses = Array.isArray(b.courseIds) && b.courseIds.length ? b.courseIds : [null];
  tx(() => courses.forEach((cid) => run('INSERT INTO events (course_id, topic_id, title, date, time, room, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    cid ? id(cid) : null, b.topicId || null, b.title.trim(), b.date, b.time || '', b.room || '', b.note || '')));
  res.json({ ok: true });
});
r.put('/events/:id', (req, res) => {
  const b = req.body || {};
  run('UPDATE events SET course_id = ?, topic_id = ?, title = ?, date = ?, time = ?, room = ?, note = ? WHERE id = ?',
    b.courseId || null, b.topicId || null, b.title, b.date, b.time || '', b.room || '', b.note || '', id(req.params.id));
  res.json({ ok: true });
});
r.delete('/events/:id', (req, res) => {
  run('DELETE FROM events WHERE id = ?', id(req.params.id));
  res.json({ ok: true });
});

// ---------- Einstellungen ----------
const SETTING_KEYS = ['chatbot_url', 'school_name', ...PROFILE_KEYS.map((p) => `exam_date_${p}`)];
r.get('/settings', (_req, res) => {
  const out = {};
  for (const k of SETTING_KEYS) out[k] = getSetting(k, '');
  res.json(out);
});
r.put('/settings', (req, res) => {
  for (const k of SETTING_KEYS) if (req.body && k in req.body) setSetting(k, req.body[k]);
  res.json({ ok: true });
});

r.put('/password', (req, res) => {
  const pw = String(req.body?.password || '');
  if (pw.length < 8) return bad(res, 'Mindestens 8 Zeichen.');
  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(pw), req.user.id);
  res.json({ ok: true });
});

// ---------- Uploads (Bilder, GeoGebra-SVG) ----------
const ALLOWED = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ALLOWED[file.mimetype] || path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, !!ALLOWED[file.mimetype]),
});
r.post('/uploads', upload.single('file'), (req, res) => {
  if (!req.file) return bad(res, 'Nur Bilder (PNG, JPG, GIF, WebP) und SVG sind erlaubt.');
  run('INSERT INTO uploads (filename, original, mime) VALUES (?, ?, ?)', req.file.filename, req.file.originalname, req.file.mimetype);
  res.json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
});

export default r;
