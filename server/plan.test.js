import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'mathe-plan-'));
process.env.DATA_DIR = dir;
const { db, run } = await import('./db.js');
const { practiceTasksFor, topicProgress } = await import('./plan.js');
test.after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

test('Themenauswahl begrenzt Aufgaben, verteilt Pakete und zählt nur ausgewählten Fortschritt', () => {
  run("INSERT INTO users (id, username, password_hash, role, display_name) VALUES (1, 'test', 'unused', 'student', 'Test')");
  run("INSERT INTO topics (id, title) VALUES (1, 'Thema')");
  for (let p = 1; p <= 3; p++) {
    run('INSERT INTO packages (id, topic_id, title, level, profiles) VALUES (?, 1, ?, ?, ?)', p, `Paket ${p}`, p === 3 ? 2 : 1, p === 2 ? '["HS10"]' : '[]');
    for (let i = 0; i < 14; i++) {
      const id = p * 100 + i;
      run("INSERT INTO tasks (id, kind, topic_id, package_id, sort) VALUES (?, 'practice', 1, ?, ?)", id, p, i);
      run('INSERT INTO task_variants (task_id, prompt) VALUES (?, ?)', id, `Aufgabe ${i}`);
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
