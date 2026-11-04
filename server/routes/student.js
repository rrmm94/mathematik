import { Router } from 'express';
import { all, get, run, json, tx, getSetting } from '../db.js';
import { requireStudent, verifyPassword, hashPassword } from '../auth.js';
import { checkAnswer, publicAnswerSpec, answerSummary } from '../../shared/checker.js';
import {
  buildPlanFromRun, runTopicScores, topicsForProfile, packagesFor, topicProgress, syncPlan,
  visibleLevels, progressState, compareRuns, previousRun, addExtraPractice,
} from '../plan.js';
import { PROFILES, GOAL_OPTIONS, MIN_STUDENT_PASSWORD } from '../../shared/constants.js';
import { publicUser } from './auth.js';

// WICHTIG: Keine Antwort dieses Routers darf Niveaustufen, Schwierigkeitsgrade
// oder Leistungskurse enthalten. Die Kinder sollen ihr Niveau nicht erkennen.

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
  const profile = String(req.body?.profile || '');
  if (!GOAL_OPTIONS.some((o) => o.profile === profile)) {
    return res.status(400).json({ error: 'Bitte wähle deinen Abschluss aus.' });
  }
  run('UPDATE users SET profile = ?, onboarded = 1 WHERE id = ?', profile, req.user.id);
  res.json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

// Themenauswahl „Was ist dir bisher leichtgefallen?“ – änderbar, bis der erste Test beginnt.
const canEditEasyTopics = (userId) => !get('SELECT 1 FROM diag_runs WHERE user_id = ?', userId) && !get('SELECT 1 FROM plan_items WHERE user_id = ?', userId);

r.get('/onboarding/topics', (req, res) => {
  const u = req.user;
  if (!u.profile) return res.status(400).json({ error: 'Bitte wähle zuerst deinen Abschluss aus.' });
  res.json({
    topics: topicsForProfile(u.profile).map((t) => ({ ...topicPublic(t), keywords: t.keywords, example: t.example })),
    selected: json(u.easy_topics, []),
    editable: canEditEasyTopics(u.id),
  });
});

r.put('/onboarding/topics', (req, res) => {
  const u = req.user;
  if (!u.profile) return res.status(400).json({ error: 'Bitte wähle zuerst deinen Abschluss aus.' });
  if (!canEditEasyTopics(u.id)) return res.status(400).json({ error: 'Die Auswahl kann nach dem Start des Tests nicht mehr geändert werden.' });
  const allowed = new Set(topicsForProfile(u.profile).map((t) => t.id));
  const ids = [...new Set((Array.isArray(req.body?.topicIds) ? req.body.topicIds : []).map(Number))].filter((x) => allowed.has(x));
  run('UPDATE users SET easy_topics = ?, topics_asked = 1 WHERE id = ?', JSON.stringify(ids), u.id);
  res.json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', u.id)) });
});

// ---------- Eigenes Passwort ändern ----------
r.put('/password', (req, res) => {
  const oldPw = String(req.body?.oldPassword || '');
  const newPw = String(req.body?.newPassword || '');
  if (!verifyPassword(oldPw, req.user.password_hash)) return res.status(400).json({ error: 'Dein bisheriges Passwort stimmt nicht.' });
  if (newPw.length < MIN_STUDENT_PASSWORD) return res.status(400).json({ error: `Das neue Passwort muss mindestens ${MIN_STUDENT_PASSWORD} Zeichen lang sein.` });
  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(newPw), req.user.id);
  run('DELETE FROM sessions WHERE user_id = ? AND token != ?', req.user.id, req.sessionToken || '');
  res.json({ ok: true });
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
  const state = progressState(u);
  const plan = planRows.map((p) => {
    const levels = json(p.levels, [1]);
    const sections = all('SELECT id FROM script_sections WHERE topic_id = ? LIMIT 1', p.topic_id);
    return {
      topic: { id: p.topic_id, title: p.title, description: p.description, icon: p.icon, color: p.color },
      progress: topicProgress(u.id, p.topic_id, u.profile, levels),
      extra: extraInfo(u, p, state.nachtest.last?.id),
      hasScript: sections.length > 0,
    };
  });

  const feedback = all(
    `SELECT f.id, f.text, f.created_at, f.read_at, f.task_id, t.title AS topic_title, t.id AS topic_id, t.icon
     FROM feedback f LEFT JOIN topics t ON t.id = f.topic_id WHERE f.user_id = ? ORDER BY f.created_at DESC LIMIT 20`,
    u.id,
  ).map((f) => ({ ...f, task: feedbackTask(u, f.task_id) }));

  const events = all(
    `SELECT e.id, e.title, e.date, e.time, e.room, e.note, t.title AS topic_title, t.icon, t.id AS topic_id
     FROM events e LEFT JOIN topics t ON t.id = e.topic_id
     WHERE (e.course_id = ? OR e.course_id IS NULL) AND e.date >= ? ORDER BY e.date, e.time LIMIT 8`,
    u.course_id, today(),
  );

  // Rückmeldung zum letzten Nachtest (ohne Stufen!)
  let retest = null;
  const last = finished[finished.length - 1];
  if (last && last.number > 1) {
    const cmp = compareRuns(previousRun(u.id, last)?.id, last.id);
    retest = {
      runId: last.id,
      finishedAt: last.finished_at,
      improved: improvedTopics(u.id, last.id),
      extraTopics: plan.filter((p) => p.extra?.isNew).map((p) => p.topic),
      better: cmp.filter((c) => c.status === 'better').length,
    };
  }

  res.json({
    user: publicUser(u),
    goal: PROFILES[u.profile]?.label,
    examDate,
    daysLeft,
    diagnose: {
      hasPlan: plan.length > 0,
      active: activeRun ? { id: activeRun.id, retest: activeRun.number > 1, ...runProgress(activeRun.id) } : null,
      canStart: plan.length ? state.nachtest.canStart : !activeRun && (!!u.diag_unlocked || finished.length === 0),
      isRetest: finished.length > 0,
    },
    plan,
    progress: state.progress,
    milestone: state.milestone,
    nachtest: state.nachtest,
    exam: state.exam,
    feedback,
    events,
    retest,
  });
});

// Zusatzübungen eines Themas (nach einem Nachtest freigeschaltet, zählen nicht zum Gesamtfortschritt).
function extraInfo(u, p, lastRetestId) {
  const extra = json(p.extra_levels, []).filter((l) => !json(p.levels, []).includes(l));
  if (!extra.length) return null;
  const pr = topicProgress(u.id, p.topic_id, u.profile, extra);
  if (!pr.total) return null;
  return { total: pr.total, solved: pr.solved, isNew: !!lastRetestId && p.extra_run_id === lastRetestId };
}

// Verweis auf die Aufgabe, zu der die Lehrkraft Feedback gegeben hat (nur wenn das Paket freigeschaltet ist).
function feedbackTask(u, taskId) {
  if (!taskId) return null;
  const t = get("SELECT id, package_id FROM tasks WHERE id = ? AND kind = 'practice'", taskId);
  if (!t || !allowedPackage(u, t.package_id)) return null;
  const ids = all("SELECT id FROM tasks WHERE package_id = ? AND kind = 'practice' ORDER BY sort, id", t.package_id).map((x) => x.id);
  const pkg = get('SELECT title FROM packages WHERE id = ?', t.package_id);
  return { id: t.id, packageId: t.package_id, packageTitle: pkg?.title || '', no: ids.indexOf(t.id) + 1 };
}

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
  const hasPlan = !!get('SELECT 1 FROM plan_items WHERE user_id = ? LIMIT 1', u.id);
  if (doneCount > 0) {
    const st = hasPlan ? progressState(u) : null;
    if (!(st ? st.nachtest.canStart : u.diag_unlocked)) {
      return res.status(403).json({
        error: st && st.nachtest.count > 0
          ? 'Einen weiteren Nachtest kann deine Lehrkraft für dich freischalten.'
          : 'Der Nachtest ist noch nicht freigeschaltet. Bearbeite zuerst mindestens die Hälfte deiner Lernplan-Aufgaben.',
      });
    }
  }
  // Nachtest: möglichst Varianten (andere Zahlen), die das Kind in früheren Tests noch nicht hatte
  const seen = new Map();
  for (const x of all('SELECT i.variant_id FROM diag_items i JOIN diag_runs d ON d.id = i.run_id WHERE d.user_id = ?', u.id)) {
    seen.set(x.variant_id, (seen.get(x.variant_id) || 0) + 1);
  }
  const pickVariant = (variants) => {
    const fewest = Math.min(...variants.map((v) => seen.get(v.id) || 0));
    return pick(variants.filter((v) => (seen.get(v.id) || 0) === fewest));
  };

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
        run('INSERT INTO diag_items (run_id, task_id, variant_id, topic_id, difficulty, sort) VALUES (?, ?, ?, ?, ?, ?)', id, task.id, pickVariant(variants).id, t.id, task.difficulty, sort++);
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
    `SELECT i.id, i.topic_id, i.answer, i.answered_at, v.prompt, v.context, v.answer AS spec, t.title AS topic_title, t.icon, t.color
     FROM diag_items i JOIN task_variants v ON v.id = i.variant_id JOIN topics t ON t.id = i.topic_id
     WHERE i.run_id = ? ORDER BY i.sort`,
    active.id,
  );
  res.json({
    run: { id: active.id, retest: active.number > 1, currentItem: active.current_item || null },
    items: items.map((i) => ({
      id: i.id,
      topic: { id: i.topic_id, title: i.topic_title, icon: i.icon, color: i.color },
      prompt: i.prompt,
      context: i.context || '',
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
  const ms = clampTime(req.body?.time_ms);
  // Zwischenspeichern während der Eingabe: Eine leere Eingabe macht eine Aufgabe nicht zu „bearbeitet“
  // (außer sie wurde vorher bewusst mit „Weiß ich (noch) nicht“ übersprungen).
  if (req.body?.draft && answer === null) {
    run(
      `UPDATE diag_items SET time_ms = time_ms + ?,
         answered_at = CASE WHEN answer IS NULL OR answer = 'null' THEN answered_at ELSE NULL END,
         answer = NULL, correct = NULL WHERE id = ?`,
      ms, item.id,
    );
    return res.json({ ok: true, answered: !!get('SELECT answered_at FROM diag_items WHERE id = ?', item.id).answered_at });
  }
  const { correct } = checkAnswer(json(item.spec, {}), answer);
  run(
    'UPDATE diag_items SET answer = ?, correct = ?, time_ms = time_ms + ?, answered_at = CURRENT_TIMESTAMP WHERE id = ?',
    JSON.stringify(answer), correct === null ? null : correct ? 1 : 0, ms, item.id,
  );
  res.json({ ok: true, answered: true }); // bewusst ohne Richtig/Falsch-Rückmeldung
});

// Merkt sich, bei welcher Aufgabe das Kind gerade ist (Weitermachen nach einer Pause).
r.post('/diagnose/position', (req, res) => {
  const active = get("SELECT * FROM diag_runs WHERE user_id = ? AND status = 'active'", req.user.id);
  if (!active) return res.status(404).json({ error: 'Kein laufender Test.' });
  const item = get('SELECT id FROM diag_items WHERE id = ? AND run_id = ?', Number(req.body?.itemId), active.id);
  if (item) run('UPDATE diag_runs SET current_item = ? WHERE id = ?', item.id, active.id);
  res.json({ ok: true });
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
  addExtraPractice(u.id, active.id);
  res.json({ kind: 'retest', runId: active.id, improved: improvedTopics(u.id, active.id) });
});

// Ergebnis eines Nachtests im Vergleich zum vorherigen Test – je Thema, ohne Stufen.
r.get('/nachtest/:runId', (req, res) => {
  const u = req.user;
  const d = get("SELECT * FROM diag_runs WHERE id = ? AND user_id = ? AND status = 'done' AND number > 1", Number(req.params.runId), u.id);
  if (!d) return res.status(404).json({ error: 'Nachtest nicht gefunden.' });
  const prev = previousRun(u.id, d);
  const plan = new Map(all('SELECT * FROM plan_items WHERE user_id = ?', u.id).map((p) => [p.topic_id, p]));
  const order = all('SELECT topic_id FROM plan_items WHERE user_id = ? ORDER BY sort', u.id).map((x) => x.topic_id);
  const topics = compareRuns(prev?.id, d.id)
    .map((c) => {
      const t = get('SELECT * FROM topics WHERE id = ?', c.topicId);
      const p = plan.get(c.topicId);
      return t && { ...c, topic: topicPublic(t), extra: p && p.extra_run_id === d.id ? extraInfo(u, p, d.id) : null };
    })
    .filter(Boolean)
    .sort((a, b) => order.indexOf(a.topicId) - order.indexOf(b.topicId));
  const sum = (k) => topics.reduce((s, t) => s + (t[k]?.correct || 0), 0);
  res.json({
    run: { id: d.id, number: d.number - 1, finishedAt: d.finished_at },
    previous: prev ? { kind: prev.number === 1 ? 'Einstiegstest' : `Nachtest ${prev.number - 1}`, finishedAt: prev.finished_at } : null,
    total: { before: sum('before'), after: sum('after'), of: topics.reduce((s, t) => s + (t.after.total || 0), 0) },
    topics,
  });
});

// ---------- Prüfungen (originale Abschlussprüfungen) ----------
r.get('/exams', (req, res) => {
  const u = req.user;
  const state = progressState(u);
  const exams = state.exam.unlocked
    ? all('SELECT e.id, e.title, e.year, e.description, (SELECT COUNT(*) FROM exam_items x WHERE x.exam_id = e.id) AS tasks FROM exams e WHERE e.profile = ? AND e.published = 1 ORDER BY e.sort, e.year DESC, e.id', u.profile)
    : [];
  res.json({ unlocked: state.exam.unlocked, progress: state.progress, milestone: state.milestone, nachtestDone: state.nachtest.count > 0, exams });
});

// ---------- Themen & Übungen ----------
function planLevels(userId, topicId) {
  const p = get('SELECT levels, extra_levels FROM plan_items WHERE user_id = ? AND topic_id = ?', userId, topicId);
  return p ? visibleLevels(p) : null;
}

r.get('/topics/:id', (req, res) => {
  const u = req.user;
  const topic = get('SELECT * FROM topics WHERE id = ?', Number(req.params.id));
  const pi = topic && get('SELECT * FROM plan_items WHERE user_id = ? AND topic_id = ?', u.id, topic.id);
  if (!topic || !pi) return res.status(404).json({ error: 'Thema nicht gefunden.' });
  const levels = visibleLevels(pi);
  const core = json(pi.levels, [1]);
  const pkgs = packagesFor(u.id, topic.id, u.profile, levels).map((p) => {
    const s = get(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN tp.solved = 1 THEN 1 ELSE 0 END) AS solved
       FROM tasks t LEFT JOIN task_progress tp ON tp.task_id = t.id AND tp.user_id = ? WHERE t.package_id = ?`,
      u.id, p.id,
    );
    // extra: Zusatzübung nach dem Nachtest (zählt nicht zum Fortschritt) – ohne Stufe zu verraten
    return { id: p.id, title: p.title, description: p.description, total: s.total, solved: s.solved || 0, extra: !core.includes(p.level) };
  });
  pkgs.sort((a, b) => a.extra - b.extra);
  const sections = all('SELECT id, title FROM script_sections WHERE topic_id = ? ORDER BY sort, id', topic.id);
  const feedback = all('SELECT id, text, created_at, read_at, task_id FROM feedback WHERE user_id = ? AND topic_id = ? ORDER BY created_at DESC', u.id, topic.id)
    .map((f) => ({ ...f, task: feedbackTask(u, f.task_id) }));
  const events = all('SELECT id, title, date, time, room FROM events WHERE topic_id = ? AND (course_id = ? OR course_id IS NULL) AND date >= ? ORDER BY date', topic.id, u.course_id, today());
  res.json({ topic: topicPublic(topic), progress: topicProgress(u.id, topic.id, u.profile, core), packages: pkgs, sections, feedback, events });
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
  // Versuche mit der aktuellen Variante (für Lösungsfreigabe und Wiederherstellung)
  const tries = all('SELECT answer, correct FROM attempts WHERE user_id = ? AND task_id = ? AND variant_id = ? ORDER BY id', u.id, task.id, variant.id);
  const last = tries[tries.length - 1];
  const spec = json(variant.answer, {});
  const draft = json(prog?.draft, null);
  const solutionShown = prog?.solution_variant === variant.id;
  const rating = get('SELECT value FROM task_ratings WHERE user_id = ? AND task_id = ?', u.id, task.id);
  return {
    id: task.id,
    title: task.title,
    variantId: variant.id,
    variantCount: variants.length,
    prompt: variant.prompt,
    context: variant.context || '',
    points: variant.points || 0,
    hint: variant.hint || '',
    spec: publicAnswerSpec(json(variant.answer, {})),
    scriptSectionId: task.script_section_id,
    topicId: task.topic_id,
    solved: !!prog?.solved,
    attempts: prog?.attempts || 0,
    wrong: tries.filter((t) => t.correct === 0).length,
    solutionUnlocked: solutionUnlocked(spec, tries),
    // zuletzt eingegebene Antwort (Entwurf oder letzter Versuch) + Ergebnis des letzten Versuchs
    draft: draft && draft.variantId === variant.id ? draft.answer : last ? json(last.answer, null) : null,
    lastResult: last && (!draft || draft.variantId !== variant.id || JSON.stringify(draft.answer) === last.answer)
      ? { correct: last.correct === null ? null : !!last.correct, parts: checkAnswer(spec, json(last.answer, null)).parts || null }
      : null,
    solution: solutionShown || (spec.type === 'free' && tries.length) ? { solution: variant.solution, summary: answerSummary(spec) } : null,
    rating: rating?.value || 0,
  };
}

// Lösung + Erklärung gibt es erst nach zwei falschen Versuchen mit denselben Zahlen
// (oder wenn die Aufgabe richtig gelöst bzw. eine Freitext-Antwort abgegeben wurde).
const SOLUTION_AFTER_WRONG = 2;
function solutionUnlocked(spec, tries) {
  if (tries.some((t) => t.correct === 1)) return true;
  if (spec.type === 'free') return tries.length > 0;
  return tries.filter((t) => t.correct === 0).length >= SOLUTION_AFTER_WRONG;
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
    run('UPDATE task_progress SET draft = NULL WHERE user_id = ? AND task_id = ?', u.id, task.id);
  });
  const tries = all('SELECT correct FROM attempts WHERE user_id = ? AND task_id = ? AND variant_id = ?', u.id, task.id, variant.id);
  const out = { correct: result.correct, parts: result.parts || null, wrong: tries.filter((t) => t.correct === 0).length, solutionUnlocked: solutionUnlocked(spec, tries) };
  if (spec.type === 'free') Object.assign(out, { solution: variant.solution, summary: answerSummary(spec) });
  res.json(out);
});

r.post('/tasks/:id/solution', (req, res) => {
  const u = req.user;
  const task = allowedTask(u, Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
  const variant = get('SELECT * FROM task_variants WHERE id = ? AND task_id = ?', Number(req.body?.variantId), task.id);
  if (!variant) return res.status(400).json({ error: 'Variante unbekannt.' });
  const spec = json(variant.answer, {});
  const tries = all('SELECT correct FROM attempts WHERE user_id = ? AND task_id = ? AND variant_id = ?', u.id, task.id, variant.id);
  if (!solutionUnlocked(spec, tries)) {
    return res.status(403).json({ error: 'Die Lösung kannst du dir anschauen, wenn du es zweimal versucht hast. Probier es zuerst selbst oder schau dir den Tipp an.' });
  }
  run(
    `INSERT INTO task_progress (user_id, task_id, solution_viewed, solution_variant, variant_id) VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(user_id, task_id) DO UPDATE SET solution_viewed = 1, solution_variant = excluded.solution_variant, updated_at = CURRENT_TIMESTAMP`,
    u.id, task.id, variant.id, variant.id,
  );
  res.json({ solution: variant.solution, summary: answerSummary(json(variant.answer, {})) });
});

// Zwischenspeichern der aktuellen Eingabe, damit nach dem Schließen des Browsers nichts verloren geht.
r.post('/tasks/:id/draft', (req, res) => {
  const u = req.user;
  const task = allowedTask(u, Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
  const variantId = Number(req.body?.variantId);
  if (!get('SELECT 1 FROM task_variants WHERE id = ? AND task_id = ?', variantId, task.id)) return res.status(400).json({ error: 'Variante unbekannt.' });
  const answer = req.body?.answer ?? null;
  const draft = JSON.stringify({ variantId, answer });
  if (draft.length > 20000) return res.status(400).json({ error: 'Eingabe zu lang.' });
  run(
    `INSERT INTO task_progress (user_id, task_id, variant_id, draft, time_ms) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, task_id) DO UPDATE SET draft = excluded.draft, time_ms = time_ms + excluded.time_ms`,
    u.id, task.id, variantId, draft, clampTime(req.body?.time_ms),
  );
  res.json({ ok: true });
});

// Freiwillige Bewertung: 1 = fand ich gut, -1 = fand ich nicht so gut, 0 = zurücknehmen
r.post('/tasks/:id/rating', (req, res) => {
  const u = req.user;
  const task = allowedTask(u, Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
  const value = Math.sign(Number(req.body?.value) || 0);
  if (value === 0) run('DELETE FROM task_ratings WHERE user_id = ? AND task_id = ?', u.id, task.id);
  else {
    run(
      `INSERT INTO task_ratings (user_id, task_id, value) VALUES (?, ?, ?)
       ON CONFLICT(user_id, task_id) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      u.id, task.id, value,
    );
  }
  res.json({ rating: value });
});

// Problem melden (z. B. „Bei Aufgabe 5 passt das Bild nicht“)
r.post('/packages/:id/report', (req, res) => {
  const u = req.user;
  const p = allowedPackage(u, Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Übungspaket nicht gefunden.' });
  const text = String(req.body?.text || '').trim().slice(0, 4000);
  if (!text) return res.status(400).json({ error: 'Bitte beschreibe kurz das Problem.' });
  let taskId = null, taskNo = null;
  if (req.body?.taskId) {
    const ids = all("SELECT id FROM tasks WHERE package_id = ? AND kind = 'practice' ORDER BY sort, id", p.id).map((t) => t.id);
    const idx = ids.indexOf(Number(req.body.taskId));
    if (idx >= 0) { taskId = ids[idx]; taskNo = idx + 1; }
  }
  run('INSERT INTO reports (user_id, package_id, task_id, task_no, text) VALUES (?, ?, ?, ?, ?)', u.id, p.id, taskId, taskNo, text);
  res.json({ ok: true });
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
