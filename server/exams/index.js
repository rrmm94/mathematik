// Originale Abschlussprüfungen zum Durchrechnen unter Prüfungsbedingungen (Timer, keine Rückmeldung, Wahlteil-Auswahl).
//
// Eine Prüfung besteht aus Hauptteil 1 (ohne Hilfsmittel), Hauptteil 2 und dem Wahlteil (zwei von vier Wahlaufgaben
// werden gewertet). Die Aufgabentexte kommen aus den Serlo-Daten (server/seed/exams/data), Punkte, Umbauten für den
// Bildschirm und Musterlösungen aus der jeweiligen Definition (z. B. rs-2026.js).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, get, UPLOAD_DIR } from '../db.js';
import { checkAnswer, publicAnswerSpec, answerSummary } from '../../shared/checker.js';
import { RS_2026 } from './rs-2026.js';

const SEED = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'exams');
const DEFS = [RS_2026];

// Ablauf laut „Hinweise zur Abschlussprüfung“ (Niedersachsen, Sjg. 10): 150 min + 15 min Auswahlzeit,
// Hauptteil 1 höchstens 50 min (früher abgeben verlängert die Zeit für Hauptteil 2 und Wahlteil).
export const TIMING = { teil1: 50, teil2: 100, choose: 15 };
export const SECTIONS = [
  { key: 'teil1', title: 'Hauptteil 1', parts: ['teil1'], minutes: TIMING.teil1, aids: false },
  { key: 'teil2', title: 'Hauptteil 2 und Wahlteil', parts: ['teil2', 'wahl'], minutes: TIMING.teil2 + TIMING.choose, aids: true },
];
export const PART_TITLES = { teil1: 'Hauptteil 1', teil2: 'Hauptteil 2', wahl: 'Wahlteil' };
export const WAHL_CHOOSE = 2;

const labelLetter = (label) => (label || '').replace(/\W/g, '');

function build(def) {
  const parts = {};
  for (const [partKey, file] of Object.entries(def.files)) {
    const raw = JSON.parse(fs.readFileSync(path.join(SEED, 'data', file), 'utf8'));
    parts[partKey] = raw.groups.map((g, gi) => ({
      no: g.no,
      context: g.context || '',
      items: g.subs.map((s, si) => {
        const key = `${partKey}|${g.no}|${s.label || ''}`;
        const o = def.overrides[key] || {};
        const points = def.points[partKey]?.[gi]?.[si] ?? s.points ?? 0;
        const answer = 'answer' in o ? o.answer : s.answer;
        const selfOnly = o.self === true || !answer || answer.type === 'free';
        let prompt = o.prompt ?? s.prompt ?? '';
        for (const img of o.dropImages || []) prompt = prompt.replace(new RegExp(`\\n*!\\[[^\\]]*\\]\\(/uploads/${img}\\.\\w+\\)`, 'g'), '');
        const selfPts = selfOnly ? points : typeof o.self === 'object' ? o.self.points : 0;
        return {
          id: `${partKey}-${g.no}${labelLetter(s.label)}`,
          no: g.no,
          label: s.label || '',
          prompt: prompt.trim(),
          answer: selfOnly ? null : answer,
          points,
          autoPoints: selfOnly ? 0 : o.autoPoints ?? points - selfPts,
          selfPoints: selfPts,
          selfLabel: typeof o.self === 'object' ? o.self.label : '',
          solution: o.solution ?? s.solution ?? '',
        };
      }),
    }));
  }
  const exam = { ...def, parts };
  exam.max = Object.fromEntries(Object.entries(parts).map(([k, groups]) => [k, groups.map((g) => g.items.reduce((s, i) => s + i.points, 0))]));
  return exam;
}

let cache = null;
export function allExams() {
  if (!cache) cache = DEFS.map(build);
  return cache;
}
export const examByKey = (key) => allExams().find((e) => e.key === key) || null;
export const examsForProfile = (profile) => allExams().filter((e) => e.profiles.includes(profile));

// Höchstpunktzahl: Hauptteile komplett + die zwei besten (gleich großen) Wahlaufgaben
export function maxPoints(exam, sectionKeys = ['teil1', 'teil2']) {
  let m = 0;
  if (sectionKeys.includes('teil1')) m += exam.max.teil1.reduce((a, b) => a + b, 0);
  if (sectionKeys.includes('teil2')) {
    m += exam.max.teil2.reduce((a, b) => a + b, 0);
    m += [...exam.max.wahl].sort((a, b) => b - a).slice(0, WAHL_CHOOSE).reduce((a, b) => a + b, 0);
  }
  return m;
}

// Bilder der Prüfung in den Upload-Ordner kopieren (einmalig je Datei).
export function ensureExamImages() {
  for (const exam of allExams()) {
    const names = new Set();
    for (const groups of Object.values(exam.parts)) {
      for (const g of groups) for (const it of [{ prompt: g.context }, ...g.items]) {
        for (const m of `${it.prompt || ''}\n${it.solution || ''}`.matchAll(/\/uploads\/(ex-[a-z0-9]+\.\w+)/g)) names.add(m[1]);
      }
    }
    for (const name of names) {
      const dest = path.join(UPLOAD_DIR, name);
      if (fs.existsSync(dest)) continue;
      const src = path.join(SEED, 'img', name.replace(/^ex-/, ''));
      if (!fs.existsSync(src)) continue;
      fs.copyFileSync(src, dest);
      if (!get('SELECT 1 FROM uploads WHERE filename = ?', name)) {
        run('INSERT INTO uploads (filename, original, mime) VALUES (?, ?, ?)', name, name, `image/${name.endsWith('.svg') ? 'svg+xml' : name.split('.').pop().replace('jpg', 'jpeg')}`);
      }
    }
  }
}

// Ansicht für das Kind während der Prüfung: ohne Lösungen und ohne Bewertung.
export function publicPart(exam, partKey) {
  return exam.parts[partKey].map((g) => ({
    no: g.no,
    context: g.context,
    points: g.items.reduce((s, i) => s + i.points, 0),
    items: g.items.map((i) => ({
      id: i.id, label: i.label, prompt: i.prompt, points: i.points,
      spec: i.answer ? publicAnswerSpec(i.answer) : { type: 'free' },
      paper: i.selfPoints > 0, // ganz oder teilweise auf Papier (zeichnen, begründen …)
      selfLabel: i.selfLabel,
    })),
  }));
}

// Punkte einer automatisch bewerteten Teilaufgabe: anteilig je richtigem Feld, auf halbe Punkte gerundet.
function autoScore(item, answer) {
  if (!item.answer || !item.autoPoints) return { points: 0, correct: null };
  if (answer == null) return { points: 0, correct: false, parts: null };
  const r = checkAnswer(item.answer, answer);
  if (r.correct) return { points: item.autoPoints, correct: true, parts: r.parts || null };
  const parts = r.parts || [];
  const share = parts.length > 1 ? parts.filter(Boolean).length / parts.length : 0;
  return { points: Math.floor(item.autoPoints * share * 2) / 2, correct: false, parts: r.parts || null };
}

// Auswertung eines Durchlaufs. answers: {itemId: Antwort}, self: {itemId: Punkte}, choice: [Wahlaufgabe, …]
export function scoreAttempt(exam, { answers = {}, self = {}, choice = [], sections = ['teil1', 'teil2'] }) {
  const partKeys = sections.flatMap((s) => SECTIONS.find((x) => x.key === s).parts);
  const out = { parts: {}, total: 0, max: maxPoints(exam, sections), auto: 0, selfDone: 0, selfOpen: 0 };
  for (const pk of partKeys) {
    const groups = exam.parts[pk].map((g) => {
      const counted = pk !== 'wahl' || choice.includes(g.no);
      const items = g.items.map((it) => {
        const a = autoScore(it, answers[it.id]);
        const sp = self[it.id];
        const selfVal = it.selfPoints ? (sp == null ? null : Math.max(0, Math.min(it.selfPoints, Number(sp) || 0))) : 0;
        return {
          id: it.id, label: it.label, points: it.points, autoPoints: it.autoPoints, selfPoints: it.selfPoints, selfLabel: it.selfLabel,
          auto: a.points, correct: a.correct, parts: a.parts, self: selfVal,
          score: a.points + (selfVal || 0),
        };
      });
      const score = items.reduce((s, i) => s + i.score, 0);
      if (counted) {
        out.total += score;
        out.auto += items.reduce((s, i) => s + i.auto, 0);
        for (const i of items) if (i.selfPoints) (i.self == null ? out.selfOpen++ : out.selfDone++);
      }
      return { no: g.no, counted, score, max: g.items.reduce((s, i) => s + i.points, 0), items };
    });
    out.parts[pk] = { title: PART_TITLES[pk], groups, score: groups.filter((g) => g.counted).reduce((s, g) => s + g.score, 0), max: groups.filter((g) => g.counted).reduce((s, g) => s + g.max, 0) };
  }
  return out;
}

// Volle Ansicht nach der Abgabe: Aufgaben, eigene Antworten, Musterlösungen.
export function reviewPart(exam, partKey) {
  return exam.parts[partKey].map((g) => ({
    no: g.no,
    context: g.context,
    items: g.items.map((i) => ({
      id: i.id, label: i.label, prompt: i.prompt, points: i.points,
      spec: i.answer ? publicAnswerSpec(i.answer) : { type: 'free' },
      solution: i.solution, summary: i.answer ? answerSummary(i.answer) : '',
      autoPoints: i.autoPoints, selfPoints: i.selfPoints, selfLabel: i.selfLabel,
    })),
  }));
}
