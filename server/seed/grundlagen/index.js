// Alle Aufgaben aus dem „Grundlagen-Training“; fig liefert die SVG-Figuren (plot, pie, tree, draw).
import { build as buildZahlenProzent } from './zahlen-prozent.js';
import { build as buildFunktionenGls } from './funktionen-gls.js';
import { build as buildWachstum } from './wachstum.js';
import { build as buildGeometrieContent } from './geometrie.js';
import { build as buildDatenContent } from './daten.js';

export function buildAll(fig) {
  const ctx = { fig };
  return [...buildZahlenProzent(ctx), ...buildFunktionenGls(ctx), ...buildWachstum(ctx)];
}
export const buildGeometrie = (fig) => buildGeometrieContent({ fig });
export const buildDaten = (fig) => buildDatenContent({ fig });
