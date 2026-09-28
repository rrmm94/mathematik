import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { all, get, run, json, tx, getSetting, setSetting, UPLOAD_DIR } from '../db.js';
import { requireAdmin, hashPassword, generatePassword } from '../auth.js';
import { runTopicScores, buildPlanFromRun, topicsForProfile, topicProgress, syncPlan } from '../plan.js';
import { PROFILE_KEYS } from '../../shared/constants.js';

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
  res.json({ courses, counts, recent });
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
  let solved = 0, total = 0;
  for (const p of plan) {
    const pr = topicProgress(u.id, p.topic_id, u.profile, json(p.levels, [1]));
    solved += pr.solved; total += pr.total;
  }
  const levelCounts = [0, 0, 0, 0];
  for (const p of plan) if (p.diag_level != null) levelCounts[p.diag_level]++;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    courseId: u.course_id,
    grade: u.grade,
    profile: u.profile,
    geCourse: u.ge_course,
    onboarded: !!u.onboarded,
    diagUnlocked: !!u.diag_unlocked,
    lastLogin: u.last_login,
    note: u.note,
    diagnose: runs.length ? { count: runs.filter((x) => x.status === 'done').length, active: runs.some((x) => x.status === 'active'), last: runs[runs.length - 1].finished_at } : null,
    progress: total ? Math.round((solved / total) * 100) : 0,
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

function createStudent({ displayName, username, password, courseId, grade, profile, geCourse }) {
  const uname = (username && String(username).trim()) || makeUsername(displayName);
  if (get('SELECT id FROM users WHERE username = ?', uname)) throw new Error(`Kennung „${uname}“ ist schon vergeben.`);
  const pw = password || generatePassword();
  const onboarded = grade && profile ? 1 : 0;
  const info = run(
    `INSERT INTO users (username, password_hash, role, display_name, course_id, grade, profile, ge_course, onboarded)
     VALUES (?, ?, 'student', ?, ?, ?, ?, ?, ?)`,
    uname, hashPassword(pw), displayName, courseId || null, grade || null, profile || null, geCourse || null, onboarded,
  );
  return { id: Number(info.lastInsertRowid), username: uname, password: pw, displayName };
}

r.post('/students', (req, res) => {
  const b = req.body || {};
  const names = Array.isArray(b.names) ? b.names : [b.displayName];
  const clean = names.map((n) => String(n || '').trim()).filter(Boolean);
  if (!clean.length) return bad(res, 'Bitte mindestens einen Namen angeben.');
  try {
    const created = tx(() => clean.map((displayName) => createStudent({
      displayName,
      username: clean.length === 1 ? b.username : null,
      password: clean.length === 1 ? b.password : null,
      courseId: b.courseId, grade: b.grade, profile: b.profile, geCourse: b.geCourse,
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
    `UPDATE users SET display_name = ?, username = ?, course_id = ?, grade = ?, profile = ?, ge_course = ?, note = ?,
       onboarded = CASE WHEN ? IS NOT NULL AND ? IS NOT NULL THEN 1 ELSE onboarded END WHERE id = ?`,
    b.displayName ?? u.display_name, b.username ?? u.username, b.courseId === undefined ? u.course_id : b.courseId || null,
    b.grade === undefined ? u.grade : b.grade || null, b.profile === undefined ? u.profile : b.profile || null,
    b.geCourse === undefined ? u.ge_course : b.geCourse || null, b.note ?? u.note,
    b.grade ?? u.grade, b.profile ?? u.profile, u.id,
  );
  if (b.profile && b.profile !== u.profile) syncPlan(u.id);
  res.json(studentSummary(get('SELECT * FROM users WHERE id = ?', u.id)));
});

r.post('/students/:id/password', (req, res) => {
  const pw = String(req.body?.password || '') || generatePassword();
  run("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'student'", hashPassword(pw), id(req.params.id));
  run('DELETE FROM sessions WHERE user_id = ?', id(req.params.id));
  res.json({ password: pw });
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
    for (const t of ['diag_runs', 'plan_items', 'attempts', 'task_progress']) run(`DELETE FROM ${t} WHERE user_id = ?`, uid);
    run('UPDATE users SET diag_unlocked = 1 WHERE id = ?', uid);
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
      `SELECT i.*, t.title AS task_title, v.prompt, v.answer AS spec, v.sort AS variant_sort, tp.title AS topic_title
       FROM diag_items i JOIN tasks t ON t.id = i.task_id JOIN task_variants v ON v.id = i.variant_id JOIN topics tp ON tp.id = i.topic_id
       WHERE i.run_id = ? ORDER BY i.sort`,
      d.id,
    ).map((i) => ({
      id: i.id, taskId: i.task_id, topicId: i.topic_id, topicTitle: i.topic_title, taskTitle: i.task_title, difficulty: i.difficulty,
      variant: i.variant_sort + 1, prompt: i.prompt, answer: json(i.answer), spec: json(i.spec, {}), correct: i.correct, timeMs: i.time_ms, answeredAt: i.answered_at,
    }));
    return { ...d, items, scores: runTopicScores(d.id) };
  });

  const plan = all(
    `SELECT p.*, t.title, t.icon, t.color FROM plan_items p JOIN topics t ON t.id = p.topic_id WHERE p.user_id = ? ORDER BY p.sort`,
    u.id,
  ).map((p) => {
    const levels = json(p.levels, [1]);
    const tasks = all(
      `SELECT t.id, t.title, pk.title AS package_title, pk.level, tp.attempts, tp.solved, tp.solution_viewed, tp.time_ms, tp.updated_at
       FROM tasks t JOIN packages pk ON pk.id = t.package_id
       LEFT JOIN task_progress tp ON tp.task_id = t.id AND tp.user_id = ?
       WHERE t.kind = 'practice' AND t.topic_id = ? ORDER BY pk.level, pk.sort, t.sort, t.id`,
      u.id, p.topic_id,
    );
    return {
      topicId: p.topic_id, title: p.title, icon: p.icon, color: p.color, sort: p.sort,
      diagLevel: p.diag_level, levels,
      progress: topicProgress(u.id, p.topic_id, u.profile, levels),
      tasks: tasks.filter((t) => t.attempts || t.solution_viewed),
    };
  });

  const feedback = all(
    `SELECT f.*, t.title AS topic_title FROM feedback f LEFT JOIN topics t ON t.id = f.topic_id WHERE f.user_id = ? ORDER BY f.created_at DESC`,
    u.id,
  );
  res.json({ student: studentSummary(u), runs, plan, feedback });
});

// Lernplan anpassen: Reihenfolge + Stufen
r.put('/students/:id/plan', (req, res) => {
  const uid = id(req.params.id);
  const items = req.body?.items;
  if (!Array.isArray(items)) return bad(res, 'Ungültige Daten.');
  tx(() => {
    items.forEach((it, i) => {
      const levels = [...new Set((it.levels || []).map(Number).filter((l) => l >= 0 && l <= 3))].sort();
      run('UPDATE plan_items SET sort = ?, levels = ? WHERE user_id = ? AND topic_id = ?', i, JSON.stringify(levels.length ? levels : [1]), uid, id(it.topicId));
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
  run('INSERT INTO feedback (user_id, topic_id, text) VALUES (?, ?, ?)', id(req.params.id), req.body?.topicId ? id(req.body.topicId) : null, text);
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
  const info = run('INSERT INTO topics (title, description, icon, color, sort, profiles) VALUES (?, ?, ?, ?, ?, ?)',
    b.title.trim(), b.description || '', b.icon || 'Sigma', b.color || 'indigo', sort, JSON.stringify(b.profiles || PROFILE_KEYS));
  res.json({ id: Number(info.lastInsertRowid) });
});
r.put('/topics/:id', (req, res) => {
  const t = get('SELECT * FROM topics WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const b = req.body || {};
  run('UPDATE topics SET title = ?, description = ?, icon = ?, color = ?, profiles = ? WHERE id = ?',
    b.title ?? t.title, b.description ?? t.description, b.icon ?? t.icon, b.color ?? t.color,
    b.profiles ? JSON.stringify(b.profiles) : t.profiles, t.id);
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
    tasks: all("SELECT id, title, sort, (SELECT COUNT(*) FROM task_variants v WHERE v.task_id = tasks.id) AS variants FROM tasks WHERE package_id = ? ORDER BY sort, id", p.id),
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
  const profile = String(req.query.profile || 'HS9');
  const topics = all('SELECT * FROM topics ORDER BY sort, id').map((t) => ({
    ...t,
    profiles: json(t.profiles, []),
    tasks: all(
      `SELECT id, title, difficulty, sort, (SELECT COUNT(*) FROM task_variants v WHERE v.task_id = tasks.id) AS variants,
              (SELECT prompt FROM task_variants v WHERE v.task_id = tasks.id ORDER BY sort, id LIMIT 1) AS preview
       FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = ? ORDER BY difficulty, sort, id`,
      t.id, profile,
    ),
  }));
  res.json({ profile, topics });
});

r.get('/tasks/:id', (req, res) => {
  const t = get('SELECT * FROM tasks WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const variants = all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort, id', t.id).map((v) => ({ ...v, answer: json(v.answer, {}) }));
  const sections = all('SELECT id, title FROM script_sections WHERE topic_id = ? ORDER BY sort, id', t.topic_id);
  const topic = get('SELECT id, title FROM topics WHERE id = ?', t.topic_id);
  const pkg = t.package_id ? get('SELECT id, title, level FROM packages WHERE id = ?', t.package_id) : null;
  const stats = get('SELECT COUNT(*) AS attempts, SUM(correct) AS correct, AVG(time_ms) AS avg_ms FROM attempts WHERE task_id = ?', t.id);
  res.json({ task: t, variants, sections, topic, package: pkg, stats });
});

function saveVariants(taskId, variants) {
  const keep = [];
  (variants || []).slice(0, 8).forEach((v, i) => {
    const data = [v.prompt || '', JSON.stringify(v.answer || { type: 'free' }), v.solution || '', v.hint || '', i];
    if (v.id && get('SELECT id FROM task_variants WHERE id = ? AND task_id = ?', v.id, taskId)) {
      run('UPDATE task_variants SET prompt = ?, answer = ?, solution = ?, hint = ?, sort = ? WHERE id = ?', ...data, v.id);
      keep.push(v.id);
    } else {
      keep.push(Number(run('INSERT INTO task_variants (task_id, prompt, answer, solution, hint, sort) VALUES (?, ?, ?, ?, ?, ?)', taskId, ...data).lastInsertRowid));
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
  tx(() => {
    run('UPDATE tasks SET title = ?, difficulty = ?, profile = ?, package_id = ?, script_section_id = ?, sort = ? WHERE id = ?',
      b.title ?? t.title, b.difficulty ?? t.difficulty, b.profile ?? t.profile, b.packageId === undefined ? t.package_id : b.packageId,
      b.scriptSectionId === undefined ? t.script_section_id : b.scriptSectionId || null, b.sort ?? t.sort, t.id);
    if (Array.isArray(b.variants)) saveVariants(t.id, b.variants);
  });
  res.json({ ok: true });
});

r.post('/tasks/:id/duplicate', (req, res) => {
  const t = get('SELECT * FROM tasks WHERE id = ?', id(req.params.id));
  if (!t) return res.status(404).json({ error: 'Nicht gefunden.' });
  const newId = tx(() => {
    const info = run('INSERT INTO tasks (kind, topic_id, package_id, profile, difficulty, title, script_section_id, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      t.kind, t.topic_id, t.package_id, req.body?.profile || t.profile, t.difficulty, `${t.title} (Kopie)`, t.script_section_id, t.sort + 1);
    const nid = Number(info.lastInsertRowid);
    for (const v of all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort', t.id)) {
      run('INSERT INTO task_variants (task_id, prompt, answer, solution, hint, sort) VALUES (?, ?, ?, ?, ?, ?)', nid, v.prompt, v.answer, v.solution, v.hint, v.sort);
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
const SETTING_KEYS = ['chatbot_url', 'school_name', 'ai_check_enabled', 'ai_api_url', ...PROFILE_KEYS.map((p) => `exam_date_${p}`)];
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
