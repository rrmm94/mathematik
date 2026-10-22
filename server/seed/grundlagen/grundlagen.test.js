// Selbsttest: Jede Aufgabe muss mit ihrer eigenen Musterlösung als richtig bewertet werden,
// und die öffentliche Spezifikation darf keine Lösungen verraten.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAll, buildGeometrie, buildDaten } from './index.js';
import { drawCore } from '../drawcore.js';
import { checkAnswer, publicAnswerSpec } from '../../../shared/checker.js';

const stubFig = { plot: ({ name }) => `/uploads/${name}.svg`, pie: ({ name }) => `/uploads/${name}.svg`, tree: ({ name }) => `/uploads/${name}.svg`, draw: { ...drawCore, svg: (name) => `/uploads/${name}.svg` } };
const data = [...buildAll(stubFig), ...buildGeometrie(stubFig), ...buildDaten(stubFig)];

const fmtNum = (v) => String(v).replace('.', ','); // so tippen Kinder Dezimalzahlen

// Die „ideale“ Antwort eines Kindes, aus der Spezifikation abgeleitet
function idealAnswer(spec) {
  if (spec.type === 'fields') {
    if (spec.constraint) {
      const c = spec.constraint;
      if (c.type === 'product') return ['5', '4', '3'];
      if (c.type === 'weighted') return ['20', '20'];
      if (c.type === 'line') return ['1', '0'];
      if (c.type === 'share') return ['5', '15'];
      throw new Error('unbekannte Bedingung');
    }
    return spec.parts.map((p) => {
      if (p.kind === 'sci') { const [m, e] = Number(p.value).toExponential().split('e'); return `${m}e${Number(e)}`; }
      if (p.kind === 'select' || p.kind === 'text' || p.kind === 'expr') return String(p.value);
      return fmtNum(p.value);
    });
  }
  if (spec.type === 'choice') return spec.options.map((o, i) => (o.correct ? i : null)).filter((i) => i !== null);
  if (spec.type === 'order') return spec.items.map((_, pos) => spec.perm.indexOf(pos));
  if (spec.type === 'graph' && spec.mode === 'points') return spec.points.map(([x, y]) => ({ x, y }));
  if (spec.type === 'graph') return spec.lines.flatMap((l) => [{ x: 0, y: l.b }, { x: 2, y: 2 * l.m + l.b }]);
  throw new Error(`Typ ${spec.type} nicht prüfbar`);
}

const all = [];
for (const entry of data) for (const pkg of entry.packages) for (const t of pkg.tasks) t.variants.forEach((v, i) => all.push({ topic: entry.topic, pkg, t, v, i }));

test('es gibt Aufgaben für alle drei Themen', () => {
  assert.ok(all.length > 120, `nur ${all.length} Varianten`);
  const topics = new Set(data.map((d) => d.topic));
  for (const t of ['Lineare Funktionen', 'Lineare Gleichungssysteme', 'Prozent & Zinsen', 'Wachstum & Exponentialfunktionen', 'Zahlen & Rechnen', 'Trigonometrie & Ähnlichkeit', 'Satz des Pythagoras', 'Körper: Oberfläche & Volumen', 'Daten & Statistik', 'Wahrscheinlichkeit']) assert.ok(topics.has(t), t);
});

for (const { t, v, i } of all) {
  test(`${t.title} [Variante ${i + 1}]: Musterlösung wird akzeptiert`, () => {
    assert.ok(v.prompt && v.prompt.length > 20, 'Aufgabentext fehlt');
    assert.ok(v.solution && v.solution.length > 10, 'Lösungsweg fehlt');
    assert.ok(!v.prompt.includes('%PIE%'), 'Platzhalter nicht ersetzt');
    assert.ok(!/undefined|NaN|\[object/.test(v.prompt + v.solution + JSON.stringify(v.answer)), 'undefined/NaN im Text');
    const spec = v.answer;
    if (spec.type === 'fields' && spec.layout) {
      assert.ok(spec.parts.length >= (spec.layout.from || 0) + spec.layout.rows.length * spec.layout.cols.length, 'Tabelle hat zu wenige Felder');
    }
    const res = checkAnswer(spec, idealAnswer(spec));
    assert.equal(res.correct, true, `Musterlösung wird nicht akzeptiert: ${JSON.stringify(res)}`);
    // leere / falsche Eingabe darf nicht richtig sein
    const blank = spec.type === 'fields' ? spec.parts.map(() => '') : [];
    assert.notEqual(checkAnswer(spec, blank).correct, true);
    // öffentliche Spezifikation
    const pub = JSON.stringify(publicAnswerSpec(spec));
    assert.ok(!/"correct":|"value":|"alternatives":|"lines":|"perm":|"constraint":|"tolerance":|"m":/.test(pub), 'Lösung in öffentlicher Spezifikation');
  });
}

test('Varianten einer Aufgabe unterscheiden sich', () => {
  for (const entry of data) for (const pkg of entry.packages) for (const t of pkg.tasks) {
    const prompts = t.variants.map((v) => v.prompt + JSON.stringify(v.answer));
    assert.equal(new Set(prompts).size, prompts.length, `doppelte Variante in ${t.title}`);
  }
});
