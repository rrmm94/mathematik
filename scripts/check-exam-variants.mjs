// Prüft die Varianten mit geänderten Zahlen (server/seed/exam-variants.js):
//  1. Jede Vorlage rechnet die Originalaufgabe aus den Originalzahlen nach und muss deren Lösung aus der Prüfung ergeben.
//  2. Jede Variante besteht ihre eigene Musterlösung, hat so viele Lücken wie Felder und rendert in KaTeX ohne Fehler.
// Aufruf: DATA_DIR=/tmp/x node --no-warnings scripts/check-exam-variants.mjs [-v]
import katex from 'katex';
import { checkAnswer } from '../shared/checker.js';
import { KATEX_MACROS } from '../client/src/lib/katexMacros.js';
import { VARIANTS, paramsFor, validated, variantsFor } from '../server/seed/exam-variants.js';
import { loadExams, sourceOf } from '../server/seed/exams.js';

const verbose = process.argv.includes('-v');
const seen = new Map();
for (const t of loadExams()) {
  const key = `${t.context}\n${t.prompt}`;
  if (seen.has(key)) seen.get(key).sources.push(sourceOf(t)); else seen.set(key, { ...t, sources: [sourceOf(t)] });
}
const tasks = [...seen.values()].filter((t) => t.answer.type !== 'free');

const problems = [], notes = [];
const perEntry = {};
const mathOk = (md, where) => {
  for (const m of md.matchAll(/\$\$([\s\S]+?)\$\$|(^|[^\\])\$([^$\n]+?)\$/g)) {
    try { katex.renderToString(m[1] ?? m[3], { throwOnError: true, strict: 'ignore', macros: { ...KATEX_MACROS } }); }
    catch (e) { problems.push(`${where}: KaTeX ${e.message.slice(0, 60)} in ${(m[1] ?? m[3]).slice(0, 40)}`); }
  }
};
const valuesOf = (spec) => spec.parts.map((p) => String(p.value).replace('.', ','));
let withVariants = 0, nVariants = 0;
for (const t of tasks) {
  for (const entry of VARIANTS) {
    const p0 = paramsFor(entry, t);
    if (!p0) continue;
    const e = (perEntry[entry.id] ||= { tasks: 0, variants: 0 });
    e.tasks++;
    // 1. Passt die Vorlage? (Nachrechnen der Originalaufgabe aus den Originalzahlen)
    if (!validated(entry, t)) {
      let why = 'rechnet anders';
      try { const g = entry.make({ ...p0 }).answer.parts; why = g.length !== t.answer.parts.length ? `${g.length} statt ${t.answer.parts.length} Felder` : `Prüfung ${t.answer.parts.map((x) => x.value)}, nachgerechnet ${g.map((x) => x.value)}`; } catch (err) { why = err.message; }
      notes.push(`[${entry.id}] passt nicht zu ${t.sources[0]} (${why})`);
      e.rejected = (e.rejected || 0) + 1;
      continue;
    }
    // 2. Varianten
    const vs = variantsFor(t, 2);
    if (!vs.length) problems.push(`[${entry.id}] ${t.sources[0]}: keine Variante erzeugt`);
    if (vs.length) { withVariants++; nVariants += vs.length; e.variants += vs.length; }
    for (const v of vs) {
      const gapsN = (v.prompt.match(/⟦\d+⟧/g) || []).length;
      if (v.answer.type === 'fields' && v.answer.inline && gapsN !== v.answer.parts.length) problems.push(`[${entry.id}] Variante: ${gapsN} Lücken, ${v.answer.parts.length} Felder: ${v.prompt.slice(0, 60)}`);
      const r = checkAnswer(v.answer, valuesOf(v.answer));
      if (!r.correct) problems.push(`[${entry.id}] Variante besteht eigene Lösung nicht: ${v.prompt.slice(0, 70)}`);
      mathOk(`${v.context || ''}\n${v.prompt}\n${v.solution || ''}`, `[${entry.id}] Variante`);
      if (verbose) console.log(`\n[${entry.id}] ${t.sources[0]}\n  ${v.context ? `K: ${v.context.replace(/\n+/g, ' / ')}\n  ` : ''}P: ${v.prompt.replace(/\n+/g, ' / ')}\n  A: ${JSON.stringify(v.answer.parts.map((p) => p.value))}`);
    }
    break; // jede Aufgabe gehört zu höchstens einer Vorlage
  }
}
console.log(`\nAufgaben mit Variante: ${withVariants} von ${tasks.length} prüfbaren (${nVariants} Varianten)`);
for (const [k, v] of Object.entries(perEntry)) console.log(`  ${k.padEnd(26)} ${String(v.tasks).padStart(3)} Aufgaben, ${String(v.variants).padStart(3)} Varianten`);
if (notes.length) console.log(`\nVorlage passt nicht (keine Variante, in Ordnung):\n${[...new Set(notes)].slice(0, 20).join('\n')}`);
console.log(problems.length ? `\n${problems.length} PROBLEME:\n${[...new Set(problems)].slice(0, 60).join('\n')}` : '\nKeine Probleme.');
process.exit(problems.length ? 1 : 0);
