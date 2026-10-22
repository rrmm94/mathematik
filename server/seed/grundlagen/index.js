// Alle Aufgaben aus dem „Grundlagen-Training“; fig liefert die SVG-Figuren (plot, pie).
import { build as buildZahlenProzent } from './zahlen-prozent.js';
import { build as buildFunktionenGls } from './funktionen-gls.js';
import { build as buildWachstum } from './wachstum.js';

export function buildAll(fig) {
  const ctx = { fig };
  return [...buildZahlenProzent(ctx), ...buildFunktionenGls(ctx), ...buildWachstum(ctx)];
}
