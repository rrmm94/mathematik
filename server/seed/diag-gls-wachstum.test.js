// Selbsttest: Jede Einstiegstest-Aufgabe zu Gleichungssystemen und Wachstum muss mit ihrer Musterlösung als richtig
// gelten, die Ergebnisse stimmen mit einer unabhängigen Rechnung überein, und das Einspielen legt die Aufgaben an.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'diag-gw-'));
const { build, solve2, seedDiagGlsWachstum } = await import('./diag-gls-wachstum.js');
const { checkAnswer, publicAnswerSpec } = await import('../../shared/checker.js');
const { seedIfEmpty } = await import('./index.js');
const { all, get } = await import('../db.js');

const fmt = (v) => String(v).replace('.', ',');
function ideal(spec) {
  if (spec.constraint) return spec.constraint.type === 'parallel' ? ['10', '50'] : null;
  return spec.parts.map((p) => (p.kind === 'select' || p.kind === 'text' || p.kind === 'expr' ? String(p.value) : fmt(p.value)));
}

const data = build();
test('sechs Plätze mit mehreren Varianten', () => {
  assert.equal(data.length, 6);
  for (const e of data) assert.ok(e.variants.length >= 5, `${e.topic} Stufe ${e.level}: nur ${e.variants.length} Varianten`);
});

for (const e of data) {
  e.variants.forEach((v, i) => test(`${e.topic} · Stufe ${e.level} · Variante ${i + 1}: Musterlösung wird akzeptiert`, () => {
    assert.ok(v.prompt.length > 30 && v.solution.length > 20);
    assert.ok(!/undefined|NaN|\[object|Infinity/.test(v.prompt + v.solution + JSON.stringify(v.answer)));
    const res = checkAnswer(v.answer, ideal(v.answer));
    assert.equal(res.correct, true, JSON.stringify(res));
    const blank = v.answer.parts.map(() => '');
    assert.notEqual(checkAnswer(v.answer, blank).correct, true);
    const pub = JSON.stringify(publicAnswerSpec(v.answer));
    assert.ok(!/"value":|"correct":|"constraint":|"alternatives":/.test(pub), 'Lösung in öffentlicher Spezifikation');
  }));
}

test('Varianten eines Platzes unterscheiden sich', () => {
  for (const e of data) assert.equal(new Set(e.variants.map((v) => v.prompt + JSON.stringify(v.answer))).size, e.variants.length, `${e.topic} ${e.level}`);
});

test('Ergebnisse der Buchaufgaben (unabhängig gerechnet)', () => {
  const find = (topic, level, src) => data.find((e) => e.topic === topic && e.level === level).variants.find((v) => v.source?.includes(src));
  const vals = (v) => v.answer.parts.map((p) => p.value);
  const lin = 'Lineare Gleichungssysteme';
  assert.deepEqual(vals(find(lin, 1, '96 a)')), [-9, -22]);
  assert.deepEqual(vals(find(lin, 1, '95 a)')), [-4, 1]);
  assert.deepEqual(vals(find(lin, 2, '97 a)')), [2, 1]);
  assert.deepEqual(vals(find(lin, 2, '97 b)')), [7, 2]);
  assert.deepEqual(vals(find(lin, 2, '98 a)')), [3, -1]);
  assert.deepEqual(vals(find(lin, 2, '98 b)')), [14, 4]);
  assert.deepEqual(vals(find(lin, 2, '98 c)')), [3, 6]);
  assert.deepEqual(vals(find(lin, 2, '98 d)')), [3, 4]);
  assert.deepEqual(vals(find(lin, 2, '95 b)')), [4, 2]);
  assert.deepEqual(vals(find(lin, 2, '96 b)')), [-6, 8]);
  assert.deepEqual(vals(find(lin, 3, 'Aufgabe 99')), [25, 18]);
  assert.deepEqual(vals(find(lin, 3, 'Aufgabe 100')), [12, 6]);
  assert.deepEqual(vals(find(lin, 3, 'Aufgabe 101')), [20, 14]);
  assert.deepEqual(vals(find(lin, 3, 'Aufgabe 102')), [8, 4, 32]);
  assert.deepEqual(vals(find(lin, 3, 'Aufgabe 103')), [6, 4]);
  assert.deepEqual(vals(find(lin, 3, '2020 · Realschule · Wahlaufgabe 3 a)')), [575, 75, 50, 9, 611, 'Wohnung I', 'Wohnung II']);
  const w = 'Wachstum & Exponentialfunktionen';
  assert.deepEqual(vals(find(w, 1, '155')), [RISE_, FALL_, RISE_, FLAT_]);
  assert.deepEqual(vals(find(w, 1, '158 a)')), [500, 1.8, 80]);
  assert.deepEqual(vals(find(w, 2, 'Aufgabe 154')), ['y = 0,8ˣ', 'y = 2·0,8ˣ', 'y = 2·1,2ˣ', 'y = 1,2ˣ']);
  assert.deepEqual(vals(find(w, 2, '158 b)')).map(Math.round), [500, 900, 1620, 2916, 5249, 9448, 17006]);
  assert.deepEqual(vals(find(w, 2, 'Aufgabe 159')), [245760]);
  assert.deepEqual(vals(find(w, 2, '160 a)')), [40, 20, 10]);
  const z = vals(find(w, 3, '156'));
  assert.equal(z[0], '1000*1.045^x');
  assert.ok(Math.abs(z[1] - 1000 * 1.045 ** 12) < 1e-6 && Math.abs(z[1] - 1695.88) < 0.01);
  assert.equal(z[2], 16);
  const car = vals(find(w, 3, '157'));
  assert.ok(Math.abs(car[0] - 34200) < 1e-5);
  assert.ok(Math.abs(car[2] - 34200 * 0.9 ** 3) < 1e-6 && Math.abs(car[3] - 34200 * 0.9 ** 5) < 1e-6 && Math.abs(car[4] - 34200 * 0.9 ** 10) < 1e-6);
  const caf = vals(find(w, 3, '160 b)'));
  assert.ok(Math.abs(caf[1] - 80 * 0.5 ** 1.5) < 1e-5);
});
const RISE_ = 'steigend', FALL_ = 'fallend', FLAT_ = 'waagerecht';

test('Eingabe wie ein Kind: Dezimalkomma, Malpunkt, Klammern', () => {
  const v = data.find((e) => e.topic.startsWith('Wachstum') && e.level === 3).variants.find((x) => x.source?.includes('160 b)'));
  assert.equal(checkAnswer(v.answer, ['80 · 0,5^(x/4)', '28,28']).correct, true);
  assert.equal(checkAnswer(v.answer, ['80 · 0,5^x', '28,28']).correct, false);
});

test('Gleichungssystem ohne Lösung: parallel, aber nicht gleich', () => {
  const v = data.find((e) => e.topic.startsWith('Lineare') && e.level === 3).variants.find((x) => x.source?.endsWith('e)'));
  assert.equal(checkAnswer(v.answer, ['10', '50']).correct, true);
  assert.equal(checkAnswer(v.answer, ['75', '50']).correct, false); // dieselbe Gerade: unendlich viele Lösungen
  assert.equal(checkAnswer(v.answer, ['10', '40']).correct, false); // schneiden sich
  assert.ok(solve2(1, -1, 10, 1, -1, 75) === null);
});

test('Einspielen: Aufgaben für RS und erw. RS, Wachstum für RS geöffnet, nur einmal', () => {
  seedIfEmpty();
  const topics = Object.fromEntries(all('SELECT * FROM topics').map((t) => [t.title, t]));
  for (const title of ['Lineare Gleichungssysteme', 'Wachstum & Exponentialfunktionen']) {
    for (const profile of ['RS10', 'ERS10']) {
      const tasks = all("SELECT * FROM tasks WHERE kind = 'diagnose' AND topic_id = ? AND profile = ? ORDER BY difficulty", topics[title].id, profile);
      assert.deepEqual(tasks.map((t) => t.difficulty), [1, 2, 3], `${title} ${profile}`);
      for (const t of tasks) assert.ok(get('SELECT COUNT(*) AS n FROM task_variants WHERE task_id = ?', t.id).n >= 5);
    }
  }
  assert.ok(JSON.parse(topics['Wachstum & Exponentialfunktionen'].profiles).includes('RS10'));
  const before = get('SELECT COUNT(*) AS n FROM task_variants').n;
  seedDiagGlsWachstum();
  assert.equal(get('SELECT COUNT(*) AS n FROM task_variants').n, before);
});
