// Tests für die Antwortprüfung: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, parseNumber, parseSci, exprEquals, publicAnswerSpec } from './checker.js';

const part = (over) => ({ kind: 'number', value: 0, tolerance: 0, ...over });
const ok = (spec, given) => checkAnswer(spec, given).correct;

test('parseNumber: bisherige Formate', () => {
  assert.equal(parseNumber('1.234,5'), 1234.5);
  assert.equal(parseNumber('3/4'), 0.75);
  assert.equal(parseNumber('25 cm²'), 25);
  assert.equal(parseNumber('37,5 %'), 37.5);
  assert.ok(Number.isNaN(parseNumber('abc')));
});

test('parseNumber: Zehnerpotenzen', () => {
  assert.equal(parseNumber('8 · 10^6'), 8e6);
  assert.equal(parseNumber('7,8*10^5'), 780000);
  assert.equal(parseNumber('4x10⁻⁴'), 4e-4);
  assert.equal(parseNumber('10^3'), 1000);
  assert.equal(parseNumber('1,3e6'), 1.3e6);
});

test('sci: nur die normierte Schreibweise zählt', () => {
  const spec = { type: 'fields', parts: [{ kind: 'sci', value: 800000 }] };
  assert.equal(ok(spec, ['8e5']), true);
  assert.equal(ok(spec, ['8 · 10^5']), true);
  assert.equal(ok(spec, ['80 · 10^4']), false); // Faktor nicht zwischen 1 und 10
  assert.equal(ok(spec, ['800000']), false);
  assert.equal(ok(spec, ['8e6']), false);
  const small = { type: 'fields', parts: [{ kind: 'sci', value: 0.0035 }] };
  assert.equal(ok(small, ['3,5e-3']), true);
  assert.equal(ok(small, ['3,5 · 10^-3']), true);
  assert.deepEqual(parseSci('5e-4'), { a: 5, n: -4 });
});

test('number: relative Toleranz für riesige Zahlen', () => {
  const spec = { type: 'fields', parts: [part({ value: 1.41e27, rel: 1e-6 })] };
  assert.equal(ok(spec, ['1 410 000 000 000 000 000 000 000 000']), true);
  assert.equal(ok(spec, ['1,41 · 10^27']), true);
  assert.equal(ok(spec, ['1,4 · 10^27']), false);
});

test('expr: gleichwertige Terme werden erkannt', () => {
  assert.equal(exprEquals('2x+85', '85+2x'), true);
  assert.equal(exprEquals('y = 2x + 85', '2x+85'), true);
  assert.equal(exprEquals('f(x)=2·x+85', '2x+85'), true);
  assert.equal(exprEquals('2x+58', '2x+85'), false);
  assert.equal(exprEquals('-0,5x+1', '1-x/2'), true);
  assert.equal(exprEquals('4^n', '4^n', ['n']), true);
  assert.equal(exprEquals('2^(2n)', '4^n', ['n']), true);
  assert.equal(exprEquals('1000·1,05^n', '1000*1.05^n', ['n']), true);
  assert.equal(exprEquals('1000·1,05^n', '1000*1.5^n', ['n']), false);
  assert.equal(exprEquals('2(x+1)', '2x+2'), true);
  assert.equal(exprEquals('x+', '2x'), false);
  assert.equal(exprEquals('2x=3', '2x'), false); // linke Seite muss ein Name sein
  assert.equal(exprEquals('alert(1)', '2x'), false);
});

test('select und text', () => {
  const spec = { type: 'fields', parts: [{ kind: 'select', options: ['linear', 'exponentiell'], value: 'exponentiell' }] };
  assert.equal(ok(spec, ['exponentiell']), true);
  assert.equal(ok(spec, ['linear']), false);
  assert.equal(ok(spec, ['']), false);
});

test('constraint: mehrere richtige Lösungen', () => {
  const quader = { type: 'fields', parts: [part({}), part({}), part({})], constraint: { type: 'product', value: 60, positive: true } };
  assert.equal(ok(quader, ['5', '4', '3']), true);
  assert.equal(ok(quader, ['10', '3', '2']), true);
  assert.equal(ok(quader, ['5', '4', '4']), false);
  assert.equal(ok(quader, ['-5', '-4', '3']), false);
  const ski = { type: 'fields', parts: [part({}), part({})], constraint: { type: 'weighted', weights: [1, 3], value: 80, positive: true } };
  assert.equal(ok(ski, ['20', '20']), true);
  assert.equal(ok(ski, ['35', '15']), true);
  assert.equal(ok(ski, ['20', '25']), false);
  const line = { type: 'fields', parts: [part({}), part({})], constraint: { type: 'line', through: [2, 2], notSlope: -1 } };
  assert.equal(ok(line, ['1', '0']), true);
  assert.equal(ok(line, ['-1', '4']), false); // wäre die Gerade h selbst
  assert.equal(ok(line, ['2', '0']), false);
});

test('order: Anzeigereihenfolge wird berücksichtigt', () => {
  const spec = { type: 'order', items: ['a', 'b', 'c'], perm: [2, 0, 1] }; // angezeigt: c, a, b
  assert.deepEqual(publicAnswerSpec(spec).items, ['c', 'a', 'b']);
  assert.equal(ok(spec, [1, 2, 0]), true); // a, b, c
  assert.equal(ok(spec, [0, 1, 2]), false);
  assert.equal(ok(spec, [1, 2]), false);
});

test('graph: Geraden durch beliebige zwei Punkte', () => {
  const spec = { type: 'graph', mode: 'lines', view: {}, lines: [{ m: 2, b: 1 }] };
  assert.equal(ok(spec, [{ x: 0, y: 1 }, { x: 1, y: 3 }]), true);
  assert.equal(ok(spec, [{ x: -2, y: -3 }, { x: 2, y: 5 }]), true);
  assert.equal(ok(spec, [{ x: 0, y: 1 }, { x: 1, y: 2 }]), false);
  assert.equal(ok(spec, [{ x: 1, y: 3 }, { x: 1, y: 5 }]), false); // senkrecht
  assert.equal(ok(spec, [{ x: 0, y: 1 }]), false);
  const two = { type: 'graph', mode: 'lines', view: {}, lines: [{ m: 1, b: 1 }, { m: -1, b: 3 }] };
  assert.equal(ok(two, [[0, 3], [1, 2], [0, 1], [1, 2]]), true);
  assert.equal(ok(two, [[0, 1], [1, 2], [0, 3], [1, 2]]), true); // Reihenfolge egal
  assert.equal(ok(two, [[0, 1], [1, 2], [0, 1], [1, 2]]), false);
});

test('graph: Punkte', () => {
  const spec = { type: 'graph', mode: 'points', view: {}, points: [[0, 1], [1, 2]], tolerance: 0 };
  assert.equal(ok(spec, [{ x: 1, y: 2 }, { x: 0, y: 1 }]), true);
  assert.equal(ok(spec, [{ x: 1, y: 2 }, { x: 0, y: 2 }]), false);
});

test('öffentliche Spezifikation enthält keine Lösungen', () => {
  const spec = {
    type: 'fields',
    parts: [{ kind: 'select', options: ['a', 'b'], value: 'b' }, { kind: 'number', value: 42 }],
    constraint: { type: 'sum', value: 1 },
  };
  const pub = JSON.stringify(publicAnswerSpec(spec));
  assert.ok(!pub.includes('42'));
  assert.ok(!pub.includes('constraint'));
  const g = JSON.stringify(publicAnswerSpec({ type: 'graph', mode: 'lines', view: {}, lines: [{ m: 7, b: 9 }] }));
  assert.ok(!g.includes('"m"'));
});
