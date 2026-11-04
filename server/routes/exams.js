// Prüfungen unter Prüfungsbedingungen: Hauptteil 1 (50 min, ohne Hilfsmittel) → Hauptteil 2 + Wahlteil
// (100 min + 15 min Auswahlzeit, mit Taschenrechner und Formelsammlung). Während der Prüfung gibt es keine
// Rückmeldung; die Zeit läuft nicht hart ab (nur ein Hinweis). Ausgewertet wird nach der Abgabe.
import { Router } from 'express';
import { all, get, run, json } from '../db.js';
import { requireStudent } from '../auth.js';
import { progressState } from '../plan.js';
import {
  examsForProfile, examByKey, publicPart, reviewPart, scoreAttempt, maxPoints, SECTIONS, TIMING, WAHL_CHOOSE, PART_TITLES,
} from '../exams/index.js';

const r = Router();
r.use(requireStudent);

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const ms = (ts) => (ts ? new Date(ts.replace(' ', 'T') + 'Z').getTime() : null);

export function attemptSections(a) {
  const s = [];
  if (a.s1_finished) s.push('teil1');
  if (a.s2_finished) s.push('teil2');
  return s;
}

// Zeitlimit des laufenden Abschnitts. Wer Hauptteil 1 früher abgibt, bekommt die Restzeit für Hauptteil 2 dazu.
function limitMs(a, section) {
  if (section === 'teil1') return TIMING.teil1 * 60e3;
  let bonus = 0;
  if (a.s1_started && a.s1_finished) bonus = Math.max(0, TIMING.teil1 * 60e3 - (ms(a.s1_finished) - ms(a.s1_started)));
  return (TIMING.teil2 + TIMING.choose) * 60e3 + bonus;
}

export function attemptSummary(a) {
  const exam = examByKey(a.exam_key);
  if (!exam) return null;
  const sections = attemptSections(a);
  const sc = scoreAttempt(exam, { answers: json(a.answers, {}), self: json(a.self, {}), choice: json(a.choice, []), sections });
  return {
    id: a.id, examKey: a.exam_key, title: exam.title, status: a.status, section: a.section, sections,
    startedAt: a.started_at, finishedAt: a.finished_at, choice: json(a.choice, []),
    total: sc.total, max: sc.max, auto: sc.auto, selfOpen: sc.selfOpen,
    parts: Object.fromEntries(Object.entries(sc.parts).map(([k, p]) => [k, { title: p.title, score: p.score, max: p.max }])),
    durations: {
      teil1: a.s1_started && a.s1_finished ? ms(a.s1_finished) - ms(a.s1_started) : null,
      teil2: a.s2_started && a.s2_finished ? ms(a.s2_finished) - ms(a.s2_started) : null,
    },
  };
}

function gate(req, res) {
  const state = progressState(req.user);
  if (!state.exam.unlocked) {
    res.status(403).json({ error: 'Die Prüfungen sind noch nicht freigeschaltet.' });
    return null;
  }
  return state;
}

const own = (req) => get('SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?', Number(req.params.id), req.user.id);

// Übersicht: Freischaltung, Ablauf, verfügbare Prüfungen mit bisherigen Durchläufen
r.get('/', (req, res) => {
  const u = req.user;
  const state = progressState(u);
  const exams = examsForProfile(u.profile).map((e) => ({
    key: e.key, title: e.title, subtitle: e.subtitle, year: e.year, date: e.date, source: e.source,
    max: maxPoints(e), maxTeil1: maxPoints(e, ['teil1']), maxTeil2: maxPoints(e, ['teil2']),
    wahl: e.parts.wahl.length,
    attempts: all('SELECT * FROM exam_attempts WHERE user_id = ? AND exam_key = ? ORDER BY id DESC', u.id, e.key).map(attemptSummary).filter(Boolean),
  }));
  const active = get("SELECT * FROM exam_attempts WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1", u.id);
  res.json({
    unlocked: state.exam.unlocked, progress: state.progress, milestone: state.milestone, nachtestDone: state.nachtest.count > 0,
    timing: TIMING, choose: WAHL_CHOOSE, exams, active: active ? attemptSummary(active) : null,
  });
});

// Prüfung starten: mit Hauptteil 1 (danach geht es mit Hauptteil 2 weiter) oder direkt mit Hauptteil 2 + Wahlteil
r.post('/:key/start', (req, res) => {
  if (!gate(req, res)) return;
  const exam = examByKey(req.params.key);
  if (!exam || !exam.profiles.includes(req.user.profile)) return res.status(404).json({ error: 'Prüfung nicht gefunden.' });
  const active = get("SELECT * FROM exam_attempts WHERE user_id = ? AND status = 'active'", req.user.id);
  if (active) return res.json({ id: active.id });
  const section = req.body?.section === 'teil2' ? 'teil2' : 'teil1';
  const id = Number(run(
    `INSERT INTO exam_attempts (user_id, exam_key, section, ${section === 'teil1' ? 's1_started' : 's2_started'}) VALUES (?, ?, ?, ?)`,
    req.user.id, exam.key, section, now(),
  ).lastInsertRowid);
  res.json({ id });
});

r.get('/attempts/:id', (req, res) => {
  const a = own(req);
  if (!a) return res.status(404).json({ error: 'Prüfung nicht gefunden.' });
  const exam = examByKey(a.exam_key);
  const meta = { key: exam.key, title: exam.title, subtitle: exam.subtitle, source: exam.source };
  const answers = json(a.answers, {});

  if (a.status === 'done') {
    const sections = attemptSections(a);
    const partKeys = sections.flatMap((s) => SECTIONS.find((x) => x.key === s).parts);
    return res.json({
      exam: meta, attempt: attemptSummary(a), answers, self: json(a.self, {}),
      score: scoreAttempt(exam, { answers, self: json(a.self, {}), choice: json(a.choice, []), sections }),
      review: Object.fromEntries(partKeys.map((pk) => [pk, { title: PART_TITLES[pk], groups: reviewPart(exam, pk) }])),
    });
  }
  if (a.section === 'between') return res.json({ exam: meta, attempt: attemptSummary(a), between: true, timing: TIMING });

  const sec = SECTIONS.find((x) => x.key === a.section);
  const startedAt = a.section === 'teil1' ? a.s1_started : a.s2_started;
  res.json({
    exam: meta,
    attempt: attemptSummary(a),
    section: { key: sec.key, title: sec.title, aids: sec.aids, startedAt: ms(startedAt), limitMs: limitMs(a, sec.key), serverNow: Date.now() },
    parts: sec.parts.map((pk) => ({ key: pk, title: PART_TITLES[pk], groups: publicPart(exam, pk) })),
    choose: WAHL_CHOOSE,
    choice: json(a.choice, []),
    answers,
  });
});

// Zwischenspeichern einer Antwort (nur im laufenden Abschnitt)
r.put('/attempts/:id/answers', (req, res) => {
  const a = own(req);
  if (!a || a.status !== 'active' || a.section === 'between') return res.status(400).json({ error: 'Diese Prüfung läuft gerade nicht.' });
  const exam = examByKey(a.exam_key);
  const itemId = String(req.body?.itemId || '');
  const sec = SECTIONS.find((x) => x.key === a.section);
  const known = sec.parts.some((pk) => exam.parts[pk].some((g) => g.items.some((i) => i.id === itemId)));
  if (!known) return res.status(400).json({ error: 'Unbekannte Aufgabe.' });
  const answers = json(a.answers, {});
  const value = req.body?.answer ?? null;
  if (value === null || value === '') delete answers[itemId];
  else answers[itemId] = value;
  const text = JSON.stringify(answers);
  if (text.length > 200000) return res.status(400).json({ error: 'Eingabe zu lang.' });
  run('UPDATE exam_attempts SET answers = ? WHERE id = ?', text, a.id);
  res.json({ ok: true });
});

// Wahlaufgaben vormerken (können bis zur Abgabe geändert werden)
r.put('/attempts/:id/choice', (req, res) => {
  const a = own(req);
  if (!a || a.status !== 'active') return res.status(400).json({ error: 'Diese Prüfung läuft gerade nicht.' });
  const exam = examByKey(a.exam_key);
  const valid = new Set(exam.parts.wahl.map((g) => g.no));
  const choice = [...new Set((req.body?.choice || []).map(Number))].filter((n) => valid.has(n)).slice(0, WAHL_CHOOSE).sort();
  run('UPDATE exam_attempts SET choice = ? WHERE id = ?', JSON.stringify(choice), a.id);
  res.json({ choice });
});

// Abschnitt abgeben. Hauptteil 2 + Wahlteil nur mit genau zwei gewählten Wahlaufgaben.
r.post('/attempts/:id/submit', (req, res) => {
  const a = own(req);
  if (!a || a.status !== 'active' || a.section === 'between') return res.status(400).json({ error: 'Diese Prüfung läuft gerade nicht.' });
  if (a.section === 'teil1') {
    run("UPDATE exam_attempts SET s1_finished = ?, section = 'between' WHERE id = ?", now(), a.id);
    return res.json({ next: 'between' });
  }
  const exam = examByKey(a.exam_key);
  const valid = new Set(exam.parts.wahl.map((g) => g.no));
  const choice = [...new Set((req.body?.choice || json(a.choice, [])).map(Number))].filter((n) => valid.has(n)).sort();
  if (choice.length !== WAHL_CHOOSE) return res.status(400).json({ error: `Wähle genau ${WAHL_CHOOSE} Wahlaufgaben aus, die gewertet werden sollen.` });
  const t = now();
  run("UPDATE exam_attempts SET s2_finished = ?, choice = ?, section = 'done', status = 'done', finished_at = ? WHERE id = ?", t, JSON.stringify(choice), t, a.id);
  res.json({ next: 'done' });
});

// Nach Hauptteil 1: weiter mit Hauptteil 2 + Wahlteil …
r.post('/attempts/:id/continue', (req, res) => {
  const a = own(req);
  if (!a || a.status !== 'active' || a.section !== 'between') return res.status(400).json({ error: 'Das geht gerade nicht.' });
  run("UPDATE exam_attempts SET section = 'teil2', s2_started = ? WHERE id = ?", now(), a.id);
  res.json({ ok: true });
});

// … oder hier aufhören und nur Hauptteil 1 auswerten
r.post('/attempts/:id/finish', (req, res) => {
  const a = own(req);
  if (!a || a.status !== 'active' || a.section !== 'between') return res.status(400).json({ error: 'Das geht gerade nicht.' });
  run("UPDATE exam_attempts SET section = 'done', status = 'done', finished_at = ? WHERE id = ?", now(), a.id);
  res.json({ ok: true });
});

// Prüfung abbrechen (laufender Durchlauf wird verworfen)
r.delete('/attempts/:id', (req, res) => {
  const a = own(req);
  if (!a || a.status !== 'active') return res.status(400).json({ error: 'Nur eine laufende Prüfung kann abgebrochen werden.' });
  run('DELETE FROM exam_attempts WHERE id = ?', a.id);
  res.json({ ok: true });
});

// Selbsteinschätzung nach der Abgabe (Aufgaben, die auf Papier bearbeitet wurden)
r.put('/attempts/:id/self', (req, res) => {
  const a = own(req);
  if (!a || a.status !== 'done') return res.status(400).json({ error: 'Die Prüfung ist noch nicht abgegeben.' });
  const exam = examByKey(a.exam_key);
  const itemId = String(req.body?.itemId || '');
  const item = Object.values(exam.parts).flat().flatMap((g) => g.items).find((i) => i.id === itemId);
  if (!item || !item.selfPoints) return res.status(400).json({ error: 'Unbekannte Aufgabe.' });
  const self = json(a.self, {});
  const p = req.body?.points;
  if (p === null || p === undefined) delete self[itemId];
  else self[itemId] = Math.max(0, Math.min(item.selfPoints, Math.round(Number(p) * 2) / 2 || 0));
  run('UPDATE exam_attempts SET self = ? WHERE id = ?', JSON.stringify(self), a.id);
  const sections = attemptSections(a);
  res.json({ self, score: scoreAttempt(exam, { answers: json(a.answers, {}), self, choice: json(a.choice, []), sections }) });
});

export default r;
