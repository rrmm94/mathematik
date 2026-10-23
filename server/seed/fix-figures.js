// Korrigiert die Höhenbeschriftung (h = …) in bereits gespeicherten Dreiecks-Skizzen:
// Sie lag auf der rechten Dreiecksseite und war schlecht lesbar. Die korrigierte Fassung wird als neue Datei
// gespeichert (neuer Name, damit der Browser-Cache nicht die alte zeigt) und in den Aufgaben ersetzt.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { UPLOAD_DIR, all, run } from '../db.js';

const HALO = " stroke='white' stroke-width='4' paint-order='stroke'";
const FIXES = [
  { prefix: 'seed-dreieck-gh-', name: 'dreieck-gh', from: /<text x='198' y='100' text-anchor='start'([^>]*)>/, to: `<text x='182' y='130' text-anchor='end'$1${HALO}>` },
  { prefix: 'seed-dach-', name: 'dach', from: /<text x='168' y='118' text-anchor='start'([^>]*)>/, to: `<text x='152' y='128' text-anchor='end'$1${HALO}>` },
];

export function fixFigures() {
  let fixed = 0;
  for (const { prefix, name, from, to } of FIXES) {
    const rows = all('SELECT filename FROM uploads WHERE filename LIKE ?', `${prefix}%`);
    for (const { filename } of rows) {
      const file = path.join(UPLOAD_DIR, filename);
      if (!fs.existsSync(file)) continue;
      const svg = fs.readFileSync(file, 'utf8');
      if (!from.test(svg)) continue;
      const next = svg.replace(from, to);
      const newName = `seed-${name}-${crypto.createHash('md5').update(next).digest('hex').slice(0, 10)}.svg`;
      if (!fs.existsSync(path.join(UPLOAD_DIR, newName))) {
        fs.writeFileSync(path.join(UPLOAD_DIR, newName), next);
        run('INSERT INTO uploads (filename, original, mime) VALUES (?, ?, ?)', newName, `${name}.svg`, 'image/svg+xml');
      }
      for (const col of ['prompt', 'context', 'solution', 'hint']) {
        run(`UPDATE task_variants SET ${col} = replace(${col}, ?, ?) WHERE ${col} LIKE ?`, `/uploads/${filename}`, `/uploads/${newName}`, `%/uploads/${filename}%`);
      }
      // Alte Fassung wird nirgends mehr verwendet
      run('DELETE FROM uploads WHERE filename = ?', filename);
      fs.rmSync(file, { force: true });
      fixed++;
    }
  }
  if (fixed) console.log(`Skizzen korrigiert: ${fixed}`);
}
