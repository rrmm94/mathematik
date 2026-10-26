// Selbsttest: Jede schwierigere Aufgabe für die erw. RS muss mit ihrer Musterlösung als richtig gelten; die Ableitung aus RS10 funktioniert.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ers-'));
const { AUTHORED, authoredVariants, seedErsDiagnose } = await import('./ers-diagnose.js');
const { checkAnswer, publicAnswerSpec } = await import('../../shared/checker.js');
const { seedIfEmpty } = await import('./index.js');
const { all, get, run } = await import('../db.js');

const fmt = (v) => String(v).replace('.', ',');
const ideal = (spec) => spec.parts.map((p) => (p.kind === 'select' || p.kind === 'text' || p.kind === 'expr' ? String(p.value) : fmt(p.value)));

for (const key of Object.keys(AUTHORED)) {
  const variants = authoredVariants(key);
  const wanted = AUTHORED[key].reduce((a, [, n]) => a + n, 0);
  test(`${key}: ${wanted} Varianten`, () => {
    assert.equal(variants.length, wanted, `nur ${variants.length} von ${wanted}`);
    assert.equal(new Set(variants.map((v) => v.prompt)).size, variants.length, 'doppelte Aufgabe');
  });
  variants.forEach((v, i) => test(`${key} [${i + 1}]: Musterlösung wird akzeptiert`, () => {
    assert.ok(v.prompt.length > 40 && v.solution.length > 20, 'Text fehlt');
    assert.ok(!/undefined|NaN|\[object|Infinity|\\,\\,/.test(v.prompt + v.solution + JSON.stringify(v.answer)), 'undefined/NaN im Text');
    assert.ok(!/\d\\,\d{3}[^$]*€(?![^$]*\$)/.test(v.prompt.replace(/\$[^$]*\$/g, '')), 'LaTeX-Leerzeichen im Fließtext');
    const res = checkAnswer(v.answer, ideal(v.answer));
    assert.equal(res.correct, true, JSON.stringify(res));
    assert.notEqual(checkAnswer(v.answer, v.answer.parts.map(() => '')).correct, true);
    const pub = JSON.stringify(publicAnswerSpec(v.answer));
    assert.ok(!/"value":|"correct":|"alternatives":/.test(pub), 'Lösung in öffentlicher Spezifikation');
  }));
}

test('Ableitung: ERS10 bekommt die Aufgaben von RS10, ersetzt die alten und hebt Aufgaben mit Ergebnissen auf', () => {
  seedIfEmpty(); // leitet beim ersten Start schon einmal ab
  run("DELETE FROM settings WHERE key = 'ers_diagnose_v1'");
  // RS10 anpassen wie im echten Betrieb: eine zusätzliche Aufgabe mit eigenem Titel und eine Aufgabe, die es nur dort gibt
  const rsBefore = all("SELECT * FROM tasks WHERE kind = 'diagnose' AND profile = 'RS10'");
  assert.ok(rsBefore.length > 30);
  const extra = rsBefore[0];
  const newId = Number(run("INSERT INTO tasks (kind, topic_id, profile, difficulty, title, sort) VALUES ('diagnose', ?, 'RS10', 1, 'Eigene Aufgabe', 9)", extra.topic_id).lastInsertRowid);
  run("INSERT INTO task_variants (task_id, prompt, answer, solution, source) VALUES (?, 'Wie viel ist $2+2$?', '{\"type\":\"fields\",\"parts\":[{\"kind\":\"number\",\"value\":4,\"tolerance\":0,\"label\":\"\"}]}', '4', 'eigene Aufgabe')", newId);
  // ERS10-Aufgabe mit Testergebnis
  const oldErs = get("SELECT * FROM tasks WHERE kind = 'diagnose' AND profile = 'ERS10' ORDER BY id LIMIT 1");
  const oldVar = get('SELECT id FROM task_variants WHERE task_id = ?', oldErs.id);
  const uid = Number(run("INSERT INTO users (username, display_name, role, password_hash, profile) VALUES ('t', 'T', 'student', 'x', 'ERS10')").lastInsertRowid);
  const runId = Number(run("INSERT INTO diag_runs (user_id, number, profile, status) VALUES (?, 1, 'ERS10', 'done')", uid).lastInsertRowid);
  run('INSERT INTO diag_items (run_id, task_id, variant_id, topic_id, difficulty, sort) VALUES (?, ?, ?, ?, 1, 0)', runId, oldErs.id, oldVar.id, oldErs.topic_id);

  seedErsDiagnose();

  const rs = all("SELECT t.*, tp.title AS topic FROM tasks t JOIN topics tp ON tp.id = t.topic_id WHERE t.kind = 'diagnose' AND t.profile = 'RS10' ORDER BY tp.sort, t.difficulty, t.sort, t.id");
  const ers = all("SELECT t.*, tp.title AS topic FROM tasks t JOIN topics tp ON tp.id = t.topic_id WHERE t.kind = 'diagnose' AND t.profile = 'ERS10' ORDER BY tp.sort, t.difficulty, t.sort, t.id");
  assert.deepEqual(ers.map((t) => [t.topic, t.difficulty, t.sort, t.title]), rs.map((t) => [t.topic, t.difficulty, t.sort, t.title]), 'gleiche Aufgaben wie RS10');
  for (const t of ers) assert.ok(get('SELECT COUNT(*) AS n FROM task_variants WHERE task_id = ?', t.id).n >= 1, t.title);
  // eigene Aufgabe wurde unverändert übernommen
  const own = ers.find((t) => t.title === 'Eigene Aufgabe');
  assert.ok(own);
  assert.equal(get('SELECT prompt FROM task_variants WHERE task_id = ?', own.id).prompt, 'Wie viel ist $2+2$?');
  // Beispiel: Brüche addieren hat jetzt die schwierigeren Varianten
  const fr = ers.find((t) => t.title === 'Brüche addieren');
  const vs = all('SELECT * FROM task_variants WHERE task_id = ?', fr.id);
  const neu = vs.filter((v) => !v.source);
  assert.equal(neu.length, 3);
  assert.ok(neu.every((v) => /b\) \$\\frac/.test(v.prompt)));
  assert.ok(vs.filter((v) => v.source).every((v) => v.source.startsWith('Abschlussprüfung')), 'Prüfungsaufgaben bleiben');
  // alte Aufgabe mit Ergebnis ist aufgehoben, Ergebnis noch da
  assert.equal(get('SELECT profile FROM tasks WHERE id = ?', oldErs.id).profile, 'ERS10-alt');
  assert.equal(get('SELECT COUNT(*) AS n FROM diag_items WHERE run_id = ?', runId).n, 1);
  // nur einmal
  const n = get('SELECT COUNT(*) AS n FROM tasks').n;
  seedErsDiagnose();
  assert.equal(get('SELECT COUNT(*) AS n FROM tasks').n, n);
});
