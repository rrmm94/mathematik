// Einfache SVG-Skizzen für die Beispielaufgaben (werden als Upload gespeichert).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { UPLOAD_DIR, run } from '../db.js';

const STROKE = '#334155';
const ACCENT = '#4f46e5';
const FONT = "font-family='Inter, Arial, sans-serif' font-size='15' fill='#0f172a'";

function save(svg, name) {
  const hash = crypto.createHash('md5').update(svg).digest('hex').slice(0, 10);
  const filename = `seed-${name}-${hash}.svg`;
  const file = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, svg);
    run('INSERT INTO uploads (filename, original, mime) VALUES (?, ?, ?)', filename, `${name}.svg`, 'image/svg+xml');
  }
  return `/uploads/${filename}`;
}

const wrap = (w, h, body) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'>${body}</svg>`;

const text = (x, y, t, anchor = 'middle', extra = '') => `<text x='${x}' y='${y}' text-anchor='${anchor}' ${FONT} ${extra}>${t}</text>`;

// Rechtwinkliges Dreieck mit rechtem Winkel unten links
export function rightTriangle({ a = 'a', b = 'b', c = 'c', alpha = '' } = {}) {
  const svg = wrap(300, 200, `
    <polygon points='40,170 260,170 40,40' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>
    <rect x='40' y='152' width='18' height='18' fill='none' stroke='${STROKE}' stroke-width='1.5'/>
    ${text(150, 192, b)}${text(25, 110, a, 'end')}${text(165, 95, c, 'start')}
    ${alpha ? `<path d='M 225 170 A 35 35 0 0 0 231 153' fill='none' stroke='${ACCENT}' stroke-width='2'/>${text(210, 162, alpha, 'end', `fill='${ACCENT}'`)}` : ''}
    <text x='278' y='182' ${FONT} font-size='11' fill='#64748b' text-anchor='end'>Skizze nicht maßstäblich</text>`);
  return save(svg, 'dreieck');
}

export function cuboid({ a, b, c }) {
  const svg = wrap(320, 210, `
    <polygon points='40,80 220,80 220,180 40,180' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>
    <polygon points='40,80 100,30 280,30 220,80' fill='#e0e7ff' stroke='${STROKE}' stroke-width='2'/>
    <polygon points='220,80 280,30 280,130 220,180' fill='#c7d2fe' stroke='${STROKE}' stroke-width='2'/>
    <line x1='40' y1='180' x2='100' y2='130' stroke='${STROKE}' stroke-dasharray='5 4'/>
    <line x1='100' y1='130' x2='280' y2='130' stroke='${STROKE}' stroke-dasharray='5 4'/>
    <line x1='100' y1='130' x2='100' y2='30' stroke='${STROKE}' stroke-dasharray='5 4'/>
    ${text(130, 200, a)}${text(262, 170, b, 'start')}${text(30, 135, c, 'end')}`);
  return save(svg, 'quader');
}

export function cylinder({ r, h }) {
  const svg = wrap(240, 230, `
    <ellipse cx='120' cy='190' rx='70' ry='20' fill='#e0e7ff' stroke='${STROKE}' stroke-width='2'/>
    <rect x='50' y='40' width='140' height='150' fill='#eef2ff' stroke='none'/>
    <line x1='50' y1='40' x2='50' y2='190' stroke='${STROKE}' stroke-width='2'/>
    <line x1='190' y1='40' x2='190' y2='190' stroke='${STROKE}' stroke-width='2'/>
    <ellipse cx='120' cy='40' rx='70' ry='20' fill='#e0e7ff' stroke='${STROKE}' stroke-width='2'/>
    <line x1='120' y1='40' x2='190' y2='40' stroke='${ACCENT}' stroke-width='2'/>
    ${text(155, 34, r, 'middle', `fill='${ACCENT}'`)}${text(205, 120, h, 'start')}`);
  return save(svg, 'zylinder');
}

export function triangleGH({ g, h }) {
  const svg = wrap(300, 190, `
    <polygon points='30,160 270,160 190,30' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>
    <line x1='190' y1='30' x2='190' y2='160' stroke='${ACCENT}' stroke-width='2' stroke-dasharray='6 4'/>
    <rect x='176' y='146' width='14' height='14' fill='none' stroke='${ACCENT}' stroke-width='1.5'/>
    ${text(150, 182, g)}${text(198, 100, h, 'start', `fill='${ACCENT}'`)}`);
  return save(svg, 'dreieck-gh');
}

export function angles({ alpha }) {
  const svg = wrap(300, 150, `
    <line x1='20' y1='120' x2='280' y2='120' stroke='${STROKE}' stroke-width='2'/>
    <line x1='150' y1='120' x2='90' y2='25' stroke='${STROKE}' stroke-width='2'/>
    <path d='M 185 120 A 35 35 0 0 0 132 90' fill='none' stroke='${ACCENT}' stroke-width='2'/>
    <path d='M 125 120 A 25 25 0 0 1 137 99' fill='none' stroke='#f59e0b' stroke-width='2'/>
    ${text(175, 95, alpha, 'start', `fill='${ACCENT}'`)}${text(110, 112, 'β', 'end', "fill='#b45309'")}`);
  return save(svg, 'winkel');
}

export function composite({ a, b }) {
  // Rechteck mit aufgesetztem Halbkreis
  const svg = wrap(300, 220, `
    <path d='M 60 200 L 240 200 L 240 110 A 90 90 0 0 0 60 110 Z' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>
    <line x1='60' y1='110' x2='240' y2='110' stroke='${STROKE}' stroke-dasharray='5 4'/>
    ${text(150, 216, a)}${text(250, 160, b, 'start')}`);
  return save(svg, 'figur');
}

export function coordLine({ m, b }) {
  // Graph einer linearen Funktion im Bereich -5..5
  const S = 22, O = 130;
  const X = (x) => O + x * S, Y = (y) => O - y * S;
  let grid = '';
  for (let i = -5; i <= 5; i++) {
    grid += `<line x1='${X(i)}' y1='${Y(-5)}' x2='${X(i)}' y2='${Y(5)}' stroke='#e2e8f0'/>`;
    grid += `<line x1='${X(-5)}' y1='${Y(i)}' x2='${X(5)}' y2='${Y(i)}' stroke='#e2e8f0'/>`;
  }
  const x1 = -5, x2 = 5;
  const svg = wrap(260, 260, `${grid}
    <line x1='${X(-5)}' y1='${O}' x2='${X(5)}' y2='${O}' stroke='${STROKE}' stroke-width='1.5'/>
    <line x1='${O}' y1='${Y(-5)}' x2='${O}' y2='${Y(5)}' stroke='${STROKE}' stroke-width='1.5'/>
    <clipPath id='c'><rect x='${X(-5)}' y='${Y(5)}' width='${10 * S}' height='${10 * S}'/></clipPath>
    <line clip-path='url(#c)' x1='${X(x1)}' y1='${Y(m * x1 + b)}' x2='${X(x2)}' y2='${Y(m * x2 + b)}' stroke='${ACCENT}' stroke-width='2.5'/>
    ${text(X(5) - 4, O - 6, 'x', 'end')}${text(O + 8, Y(5) + 12, 'y', 'start')}
    ${text(X(1), O + 16, '1')}${text(O - 8, Y(1) + 5, '1', 'end')}`);
  return save(svg, 'gerade');
}

export const img = (url, alt = 'Skizze') => `![${alt}](${url})`;
