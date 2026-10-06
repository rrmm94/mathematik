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
