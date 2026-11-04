// Selbsttest der Prüfung 2026: Punkte wie im Original, jede automatisch bewertete Teilaufgabe akzeptiert die
// richtige Antwort (auch in üblichen Schreibweisen), falsche Antworten geben keine Punkte, Wahlteil zählt zwei Aufgaben.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'exams-'));
const { examByKey, maxPoints, scoreAttempt, publicPart } = await import('./index.js');
const { checkAnswer } = await import('../../shared/checker.js');

const exam = examByKey('rs-2026');
const items = Object.values(exam.parts).flat().flatMap((g) => g.items);
const item = (id) => items.find((i) => i.id === id);

test('Punkte wie im Original: 28 + 36 + 2 × 10 = 84', () => {
  assert.equal(maxPoints(exam, ['teil1']), 28);
  assert.equal(maxPoints(exam, ['teil2']), 56);
  assert.equal(maxPoints(exam), 84);
  for (const i of items) assert.equal(i.autoPoints + i.selfPoints, i.points, i.id);
});

test('jede Teilaufgabe hat eine Musterlösung oder ein prüfbares Ergebnis', () => {
  for (const i of items) assert.ok(i.solution || i.answer, i.id);
  for (const i of items.filter((x) => x.selfPoints)) assert.ok(i.solution, `${i.id}: Selbsteinschätzung braucht eine Musterlösung`);
});

test('Lückentexte haben genug Lücken für alle Eingabefelder', () => {
  for (const i of items.filter((x) => x.answer?.type === 'fields' && x.answer.inline)) {
    assert.ok((i.prompt.match(/⟦\d+⟧/g) || []).length >= i.answer.parts.length, i.id);
  }
});

const RIGHT = {
  'teil1-1b': ['13,85'], 'teil1-2': ['50'], 'teil1-3a': ['9:57'], 'teil1-3b': ['27', '11:13 Uhr'], 'teil1-4b': [2], 'teil1-7c': [3, 1],
  'teil2-1a': ['fitness', '21'], 'teil2-1b': ['1488'], 'teil2-2a': ['1/20'], 'teil2-2b': ['12 %'], 'teil2-2c': ['66,5%'], 'teil2-3c': ['-3', '1'],
  'teil2-4a': ['10,5'], 'teil2-4b': ['191,44'], 'teil2-5a': ['0,588'], 'teil2-5b': ['2,57'], 'teil2-5c': ['4,4'],
  'wahl-1b': ['2/77'], 'wahl-1c': ['90,9 %'], 'wahl-3b': ['42124'], 'wahl-3c': ['353,13'], 'wahl-4b': ['191,07'], 'wahl-4d': ['254,1'],
};
const WRONG = { 'teil1-4a': ['141'], 'teil1-7c': [0, 1], 'teil2-2b': ['0,15'], 'teil2-4b': ['255,25'], 'wahl-4c': ['171'] };

test('richtige Antworten werden erkannt, falsche nicht', () => {
  for (const [id, a] of Object.entries(RIGHT)) assert.equal(checkAnswer(item(id).answer, a).correct, true, id);
  for (const [id, a] of Object.entries(WRONG)) assert.equal(checkAnswer(item(id).answer, a).correct, false, id);
});

test('Auswertung: Teilpunkte, Wahlteil mit zwei gewählten Aufgaben, Selbsteinschätzung', () => {
  const sc = scoreAttempt(exam, {
    answers: { 'teil1-3b': ['27', '10:00'], 'wahl-4d': ['254,1'], 'wahl-1b': ['2/77'] },
    self: { 'teil1-6b': 2, 'wahl-4a': 9 },
    choice: [1, 4],
  });
  assert.equal(sc.parts.teil1.score, 1 + 2); // 3b halb richtig (1 von 2), 6b selbst 2
  assert.equal(sc.parts.wahl.score, 2 + 4 + 2); // 1b, 4d, 4a (Selbsteinschätzung auf 2 begrenzt)
  assert.equal(sc.max, 84);
  const other = scoreAttempt(exam, { answers: { 'wahl-4d': ['254,1'] }, choice: [1, 2] });
  assert.equal(other.parts.wahl.score, 0);
});

test('während der Prüfung keine Lösungen in der Ansicht', () => {
  const text = JSON.stringify(['teil1', 'teil2', 'wahl'].map((p) => publicPart(exam, p)));
  assert.ok(!/"correct"|"value"|"solution"|"alternatives"/.test(text));
});

test('Notenspiegel', async () => {
  const { gradeFor } = await import('../../shared/grades.js');
  const g = (p) => gradeFor(p, 100).grade;
  assert.deepEqual([g(100), g(96), g(95.9), g(80), g(79.9), g(60), g(59), g(45), g(44), g(16), g(15), g(0)], [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  assert.equal(gradeFor(81, 84).grade, 1); // 96,4 %
  assert.equal(gradeFor(80, 84).grade, 2); // 95,2 %
  assert.equal(gradeFor(38, 84).grade, 4); // 45,2 %
});
