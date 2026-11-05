import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'mathe-plan-'));
process.env.DATA_DIR = dir;
const { db, run } = await import('./db.js');
const { practiceTasksFor, topicProgress, levelsWithMinTasks } = await import('./plan.js');
test.after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

test('Themenauswahl begrenzt Aufgaben, verteilt Pakete und zählt nur ausgewählten Fortschritt', () => {
  run("INSERT INTO users (id, username, password_hash, role, display_name) VALUES (1, 'test', 'unused', 'student', 'Test')");
  run("INSERT INTO topics (id, title) VALUES (1, 'Thema')");
  for (let p = 1; p <= 3; p++) {
    run('INSERT INTO packages (id, topic_id, title, level, profiles) VALUES (?, 1, ?, ?, ?)', p, `Paket ${p}`, p === 3 ? 2 : 1, p === 2 ? '["HS10"]' : '[]');
    for (let i = 0; i < 14; i++) {
      const id = p * 100 + i;
      run("INSERT INTO tasks (id, kind, topic_id, package_id, sort) VALUES (?, 'practice', 1, ?, ?)", id, p, i);
      run('INSERT INTO task_variants (task_id, prompt) VALUES (?, ?)', id, `Paket ${p}, Aufgabe ${i}`);
    }
  }
  const selected = practiceTasksFor(1, 1, 'HS10', [1]);
  assert.equal(selected.length, 14);
  assert.equal(selected.filter(t => t.package_id === 1).length, 7);
  assert.equal(selected.filter(t => t.package_id === 2).length, 7);
  run('INSERT INTO task_progress (user_id, task_id, attempts, solved) VALUES (1, ?, 1, 1)', selected[0].id);
  run('INSERT INTO task_progress (user_id, task_id, attempts, solved) VALUES (1, 113, 1, 1)');
  assert.deepEqual(practiceTasksFor(1, 1, 'HS10', [1]).map(t => t.id), selected.map(t => t.id));
  assert.deepEqual(topicProgress(1, 1, 'HS10', [1]), { total: 14, done: 1, solved: 1, percent: 7 });
  assert.ok(practiceTasksFor(1, 1, 'RS10', [1]).every(t => t.package_id === 1));
  assert.equal(practiceTasksFor(1, 1, 'HS10', [1, 2]).length, 14);
  assert.deepEqual(topicProgress(1, 1, 'HS10', []), { total: 0, done: 0, solved: 0, percent: 0 });
  run('DELETE FROM tasks WHERE id > 102');
  assert.equal(practiceTasksFor(1, 1, 'HS10', [1]).length, 3);
});

function addTask(id, packageId, variants) {
  run("INSERT INTO tasks (id, kind, topic_id, package_id, title, sort) VALUES (?, 'practice', 2, ?, ?, ?)", id, packageId, `Titel ${id}`, id);
  for (const v of variants) run('INSERT INTO task_variants (task_id, prompt, context, answer) VALUES (?, ?, ?, ?)', id, v.prompt, v.context || '', JSON.stringify(v.answer || { type: 'fields', parts: [{ value: 4 }] }));
}

test('Dubletten über Pakete und Varianten werden ersetzt; Kontext und Antwortoptionen bleiben unterscheidbar', () => {
  run("INSERT INTO topics (id, title) VALUES (2, 'Dubletten')");
  for (const [id, level] of [[10, 1], [11, 1], [12, 2]]) run('INSERT INTO packages (id, topic_id, title, level) VALUES (?, 2, ?, ?)', id, `Paket ${id}`, level);
  addTask(1000, 10, [{ prompt: 'Rechne 2 + 2.' }, { prompt: 'Rechne 3 + 3.' }]);
  addTask(1001, 10, [{ prompt: '  **a)** Rechne 2  + 2.\n', answer: { type: 'fields', parts: [{ value: 99 }] } }]);
  addTask(1100, 11, [{ prompt: 'Andere erste Variante' }, { prompt: 'Rechne 3 + 3.' }]);
  addTask(1101, 11, [{ prompt: 'Rechne 2 + 2.', context: 'Ein anderer Kontext' }]);
  addTask(1102, 11, [{ prompt: 'Rechne 2 + 2.', answer: { type: 'choice', options: [{ text: '4', correct: true }, { text: '5' }] } }]);
  for (let i = 0; i < 16; i++) addTask(1200 + i, 10, [{ prompt: `Berechne ${i} mal 7.` }]);
  const selected = practiceTasksFor(1, 2, 'HS10', [1]);
  assert.equal(selected.length, 14, 'Dubletten durch weitere Aufgaben auffüllen');
  assert.ok(selected.some(t => t.id === 1000));
  assert.ok(!selected.some(t => [1001, 1100].includes(t.id)));
  assert.ok(selected.some(t => t.id === 1101));
  assert.ok(selected.some(t => t.id === 1102));
  addTask(1300, 12, [{ prompt: 'Rechne 2 + 2.' }]);
  addTask(1301, 12, [{ prompt: 'Neue Zusatzaufgabe' }]);
  const extra = practiceTasksFor(1, 2, 'HS10', [2], selected);
  assert.deepEqual(extra.map(t => t.id), [1301]);
  assert.equal(topicProgress(1, 2, 'HS10', [2], selected).total, 1);
  assert.equal(topicProgress(1, 2, 'HS10', [1]).total, selected.length);
  // Zehn Kopien dürfen nicht verhindern, dass eine weitere Stufe ergänzt wird.
  run('DELETE FROM tasks WHERE id >= 1101 AND id < 1300');
  for (let i = 0; i < 12; i++) addTask(1400 + i, 10, [{ prompt: 'Rechne 2 + 2.' }]);
  assert.deepEqual(levelsWithMinTasks(2, 'HS10', [1]), [1, 2]);
  for (let i = 0; i < 12; i++) addTask(1500 + i, 12, [{ prompt: `Weitere Aufgabe ${i}` }]);
  const levels = levelsWithMinTasks(2, 'HS10', [1]);
  assert.deepEqual(levels, [1, 2]);
  assert.equal(practiceTasksFor(1, 2, 'HS10', levels).length, 14);
});
