// Von Hand geschriebene Varianten mit geänderten Zahlen zu einzelnen Originalaufgaben.
// Jeder Eintrag erkennt die Originalaufgabe am Text (match) und liefert mit make(r, original) weitere
// Varianten. Wo kein Eintrag passt, gibt es nur die Originalaufgabe.
import { rng } from './helpers.js';
import crypto from 'node:crypto';

export const VARIANTS = [];

const seedOf = (s) => parseInt(crypto.createHash('sha1').update(s).digest('hex').slice(0, 8), 16);

export function variantsFor(t) {
  const entry = VARIANTS.find((v) => v.match.test(`${t.context}\n${t.prompt}`));
  if (!entry) return [];
  const base = `${t.context}|${t.prompt}`;
  const out = [];
  for (let i = 0; i < (entry.count || 2); i++) {
    const v = entry.make(rng(seedOf(base) + i * 7919), t);
    if (!v || out.some((o) => o.prompt === v.prompt && o.context === v.context) || (v.prompt === t.prompt && (v.context || '') === t.context)) continue;
    out.push({ points: t.points, ...v, source: `Variante mit geänderten Zahlen zu: ${[...new Set(t.sources)].join('  |  ')}` });
  }
  return out;
}
