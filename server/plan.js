import { all, get, run, json, tx } from './db.js';

// Stufe aus der Anzahl richtig gelöster Diagnoseaufgaben (0..3).
// Bei weniger/mehr als 3 bewertbaren Aufgaben wird auf 0..3 skaliert.
export function levelFromScore(correct, total) {
  if (!total) return 1;
  if (total === 3) return correct;
  return Math.max(0, Math.min(3, Math.round((correct / total) * 3)));
}

// Ergebnis eines Diagnose-Durchlaufs je Thema.
export function runTopicScores(runId) {
  const rows = all(
    `SELECT topic_id, SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct,
            SUM(CASE WHEN correct IS NOT NULL AND answered_at IS NOT NULL THEN 1 ELSE 0 END) AS answered,
            SUM(CASE WHEN correct IS NOT NULL OR answered_at IS NULL THEN 1 ELSE 0 END) AS total,
            SUM(time_ms) AS time_ms
     FROM diag_items WHERE run_id = ? GROUP BY topic_id`,
    runId,
  );
  const out = {};
  for (const r of rows) out[r.topic_id] = { correct: r.correct, total: r.total, level: levelFromScore(r.correct, r.total), time_ms: r.time_ms };
  return out;
}

// Ab dieser Stufe (Regelstandard) gilt ein Thema im Test als „gekonnt“.
export const GOOD_LEVEL = 2;

// Erstellt den Lernplan aus dem ersten Diagnosetest: schwächste Themen zuerst.
// Themen, die dem Kind nach eigener Aussage leichtfallen UND im Test mindestens
// auf Regelstandard lagen, kommen ans Ende – sie müssen nicht zuerst geübt werden.
export function buildPlanFromRun(userId, runId) {
  const scores = runTopicScores(runId);
  const user = get('SELECT profile, easy_topics FROM users WHERE id = ?', userId);
  const easy = new Set(json(user.easy_topics, []));
  const topics = topicsForProfile(user.profile);
  const items = topics.map((t) => {
    const s = scores[t.id];
    const level = s ? s.level : 1;
    const ratio = s && s.total ? s.correct / s.total : 0.5;
    const confirmed = easy.has(t.id) && !!s && level >= GOOD_LEVEL;
    return { topic: t, level, ratio, confirmed };
  });
  items.sort((a, b) => a.confirmed - b.confirmed || a.ratio - b.ratio || a.level - b.level || a.topic.sort - b.topic.sort);
  tx(() => {
    run('DELETE FROM plan_items WHERE user_id = ?', userId);
    items.forEach((it, i) => {
      run('INSERT INTO plan_items (user_id, topic_id, sort, diag_level, levels) VALUES (?, ?, ?, ?, ?)', userId, it.topic.id, i, it.level, JSON.stringify([it.level]));
    });
  });
}

export function topicsForProfile(profile) {
  return all('SELECT * FROM topics ORDER BY sort, id').filter((t) => {
    const p = json(t.profiles, []);
    return p.length === 0 || p.includes(profile);
  });
}

// Stellt sicher, dass neu angelegte Themen auch im Plan auftauchen.
export function syncPlan(userId) {
  const user = get('SELECT profile FROM users WHERE id = ?', userId);
  const existing = all('SELECT * FROM plan_items WHERE user_id = ?', userId);
  if (!existing.length) return;
  const have = new Set(existing.map((e) => e.topic_id));
  let max = Math.max(...existing.map((e) => e.sort));
  for (const t of topicsForProfile(user.profile)) {
    if (!have.has(t.id)) run('INSERT INTO plan_items (user_id, topic_id, sort, diag_level, levels) VALUES (?, ?, ?, NULL, ?)', userId, t.id, ++max, '[1]');
  }
}

// Übungspakete, die ein Kind in einem Thema sieht.
export function packagesFor(userId, topicId, profile, levels) {
  return all('SELECT * FROM packages WHERE topic_id = ? ORDER BY level, sort, id', topicId).filter((p) => {
    const pr = json(p.profiles, []);
    return levels.includes(p.level) && (pr.length === 0 || pr.includes(profile));
  });
}

export function topicProgress(userId, topicId, profile, levels) {
  const pkgs = packagesFor(userId, topicId, profile, levels);
  if (!pkgs.length) return { total: 0, done: 0, solved: 0, percent: 0 };
  const ids = pkgs.map((p) => p.id);
  const r = get(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN tp.attempts > 0 OR tp.solution_viewed = 1 THEN 1 ELSE 0 END) AS done,
            SUM(CASE WHEN tp.solved = 1 THEN 1 ELSE 0 END) AS solved
     FROM tasks t LEFT JOIN task_progress tp ON tp.task_id = t.id AND tp.user_id = ?
     WHERE t.kind = 'practice' AND t.package_id IN (${ids.map(() => '?').join(',')})`,
    userId, ...ids,
  );
  const total = r.total || 0;
  return { total, done: r.done || 0, solved: r.solved || 0, percent: total ? Math.round(((r.solved || 0) / total) * 100) : 0 };
}

// ---------------------------------------------------------------- Gesamtfortschritt, Nachtest, Prüfung

// Ab diesem Anteil gelöster Lernplan-Aufgaben werden Nachtest und Prüfungen freigeschaltet.
export const MILESTONE_PERCENT = 50;

// Für das Kind sichtbare Stufen eines Plan-Eintrags: Lernplan + Zusatzübungen nach einem Nachtest.
export function visibleLevels(p) {
  return [...new Set([...json(p.levels, [1]), ...json(p.extra_levels, [])])].sort();
}

// Gesamtfortschritt über den Lernplan. Zusatzübungen aus einem Nachtest zählen NICHT mit,
// damit der Balken durch neue Übungen nicht zurückfällt.
export function planProgress(userId, profile) {
  const plan = all('SELECT topic_id, levels FROM plan_items WHERE user_id = ?', userId);
  let solved = 0, total = 0, done = 0;
  for (const p of plan) {
    const pr = topicProgress(userId, p.topic_id, profile, json(p.levels, [1]));
    solved += pr.solved; total += pr.total; done += pr.done;
  }
  return { solved, done, total, percent: total ? Math.round((solved / total) * 100) : 0 };
}

// Stand des Kindes: Fortschritt, Nachtest und Prüfung (für Startseite und Lehrkraft).
// Wer die 50 % einmal erreicht hat, behält die Freischaltung, auch wenn die Lehrkraft später Aufgaben ergänzt.
export function progressState(u) {
  const progress = planProgress(u.id, u.profile);
  let milestoneAt = u.milestone_at || null;
  if (!milestoneAt && progress.total > 0 && progress.percent >= MILESTONE_PERCENT) {
    milestoneAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    run('UPDATE users SET milestone_at = ? WHERE id = ?', milestoneAt, u.id);
  }
  const runs = all('SELECT id, number, status, finished_at FROM diag_runs WHERE user_id = ? ORDER BY number', u.id);
  const active = runs.find((x) => x.status === 'active');
  const done = runs.filter((x) => x.status === 'done');
  const retests = done.filter((x) => x.number > 1);
  const hasPlan = !!get('SELECT 1 FROM plan_items WHERE user_id = ? LIMIT 1', u.id);
  const reached = !!milestoneAt;
  // Den ersten Nachtest schaltet das Erreichen der 50 % frei, jeden weiteren die Lehrkraft.
  const unlocked = hasPlan && (reached && retests.length === 0 || (done.length > 0 && !!u.diag_unlocked));
  return {
    progress,
    milestone: { percent: MILESTONE_PERCENT, reached, at: milestoneAt },
    nachtest: {
      active: active && active.number > 1 ? { id: active.id } : null,
      canStart: !active && unlocked,
      count: retests.length,
      last: retests.length ? { id: retests[retests.length - 1].id, finishedAt: retests[retests.length - 1].finished_at } : null,
      byTeacher: !!u.diag_unlocked && done.length > 0,
    },
    exam: { unlocked: reached && retests.length > 0 },
  };
}

// Vergleich zweier Diagnose-Durchläufe je Thema (Anzahl richtig, ohne Stufen).
// status: better | same | worse | perfect (vorher und jetzt alles richtig)
export function compareRuns(prevRunId, runId) {
  const a = prevRunId ? runTopicScores(prevRunId) : {};
  const b = runTopicScores(runId);
  const out = [];
  for (const [topicId, s] of Object.entries(b)) {
    const before = a[topicId] || null;
    const ratio = (x) => (x && x.total ? x.correct / x.total : 0);
    let status;
    if (!before) status = 'new';
    else if (ratio(s) > ratio(before)) status = 'better';
    else if (ratio(s) < ratio(before)) status = 'worse';
    else status = s.total && s.correct >= s.total ? 'perfect' : 'same';
    out.push({ topicId: Number(topicId), before: before && { correct: before.correct, total: before.total }, after: { correct: s.correct, total: s.total }, status });
  }
  return out;
}

// Vorheriger abgeschlossener Durchlauf (für den Vergleich beim Nachtest).
export function previousRun(userId, run) {
  return get("SELECT * FROM diag_runs WHERE user_id = ? AND number < ? AND status = 'done' ORDER BY number DESC LIMIT 1", userId, run.number);
}

// Nach einem Nachtest: In Themen ohne Verbesserung (oder mit Verschlechterung) werden Zusatzübungen
// freigeschaltet. Zuerst die nächstleichtere Stufe (Grundlagen festigen), sonst die nächsthöhere.
// Die Zusatz-Stufen zählen nicht zum Gesamtfortschritt.
export function addExtraPractice(userId, runId) {
  const user = get('SELECT profile FROM users WHERE id = ?', userId);
  const runRow = get('SELECT * FROM diag_runs WHERE id = ?', runId);
  const prev = previousRun(userId, runRow);
  if (!prev) return [];
  const added = [];
  tx(() => {
    for (const c of compareRuns(prev.id, runId)) {
      if (c.status !== 'worse' && c.status !== 'same') continue;
      const p = get('SELECT * FROM plan_items WHERE user_id = ? AND topic_id = ?', userId, c.topicId);
      if (!p) continue;
      const have = visibleLevels(p);
      const hasPkgs = (lvl) => packagesFor(userId, c.topicId, user.profile, [lvl]).length > 0;
      const lo = Math.min(...have), hi = Math.max(...have);
      const candidates = [lo - 1, hi + 1, ...[0, 1, 2, 3].filter((l) => !have.includes(l))];
      const lvl = candidates.find((l) => l >= 0 && l <= 3 && !have.includes(l) && hasPkgs(l));
      if (lvl == null) continue;
      const extra = [...new Set([...json(p.extra_levels, []), lvl])].sort();
      run('UPDATE plan_items SET extra_levels = ?, extra_run_id = ? WHERE user_id = ? AND topic_id = ?', JSON.stringify(extra), runId, userId, c.topicId);
      added.push(c.topicId);
    }
  });
  return added;
}

// ---------------------------------------------------------------- Kennzahlen für die Lehrkraft

// Ergebnis des letzten Nachtests im Vergleich zum vorherigen Test: Anteil richtiger Antworten über alle Themen,
// die in beiden Tests vorkamen (Durchschnitt), dazu die Anzahl besserer/gleicher/schlechterer Themen.
export function nachtestTrend(userId) {
  const last = get("SELECT * FROM diag_runs WHERE user_id = ? AND status = 'done' AND number > 1 ORDER BY number DESC LIMIT 1", userId);
  if (!last) return null;
  const prev = previousRun(userId, last);
  if (!prev) return null;
  const cmp = compareRuns(prev.id, last.id).filter((c) => c.before && c.before.total && c.after.total);
  const sum = (k, f) => cmp.reduce((s, c) => s + c[k][f], 0);
  const before = sum('before', 'total') ? sum('before', 'correct') / sum('before', 'total') : 0;
  const after = sum('after', 'total') ? sum('after', 'correct') / sum('after', 'total') : 0;
  const delta = Math.round((after - before) * 100);
  return {
    runId: last.id,
    finishedAt: last.finished_at,
    before: Math.round(before * 100),
    after: Math.round(after * 100),
    delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
    better: cmp.filter((c) => c.status === 'better').length,
    same: cmp.filter((c) => c.status === 'same' || c.status === 'perfect').length,
    worse: cmp.filter((c) => c.status === 'worse').length,
  };
}

// Übungsaufgaben: Wie viele wurden beim allerersten Versuch richtig gelöst, wie oft wurde die Lösung angesehen?
// Gezählt werden nur automatisch prüfbare Aufgaben (Freitext hat kein Richtig/Falsch).
export function practiceStats(userId) {
  const first = get(
    `SELECT COUNT(*) AS n, SUM(CASE WHEN a.correct = 1 THEN 1 ELSE 0 END) AS ok
     FROM attempts a JOIN tasks t ON t.id = a.task_id AND t.kind = 'practice'
     WHERE a.id IN (SELECT MIN(id) FROM attempts WHERE user_id = ? GROUP BY task_id) AND a.correct IS NOT NULL`,
    userId,
  );
  const worked = get(
    `SELECT COUNT(*) AS n, SUM(CASE WHEN tp.solution_viewed = 1 THEN 1 ELSE 0 END) AS viewed,
            SUM(CASE WHEN tp.solution_viewed = 1 AND tp.solved = 1 THEN 1 ELSE 0 END) AS viewedSolved
     FROM task_progress tp JOIN tasks t ON t.id = tp.task_id AND t.kind = 'practice'
     WHERE tp.user_id = ? AND (tp.attempts > 0 OR tp.solution_viewed = 1)`,
    userId,
  );
  const n = first.n || 0;
  return {
    firstTry: { tasks: n, correct: first.ok || 0, percent: n ? Math.round(((first.ok || 0) / n) * 100) : null },
    solution: { tasks: worked.n || 0, viewed: worked.viewed || 0, viewedThenSolved: worked.viewedSolved || 0, percent: worked.n ? Math.round(((worked.viewed || 0) / worked.n) * 100) : null },
  };
}
