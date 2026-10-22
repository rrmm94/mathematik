// Einfache SVG-Skizzen für die Beispielaufgaben (werden als Upload gespeichert).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { UPLOAD_DIR, run } from '../db.js';
import { drawCore } from './drawcore.js';

const STROKE = '#334155';
const ACCENT = '#4f46e5';

export function save(svg, name) {
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

// Standard-Schrift; fill/font-size aus `extra` überschreiben die Vorgaben (doppelte Attribute wären ungültiges SVG)
const text = (x, y, t, anchor = 'middle', extra = '') => {
  const size = extra.includes('font-size=') ? '' : " font-size='15'";
  const fill = extra.includes('fill=') ? '' : " fill='#0f172a'";
  return `<text x='${x}' y='${y}' text-anchor='${anchor}' font-family='Inter, Arial, sans-serif'${size}${fill} ${extra}>${t}</text>`;
};

// Rechtwinkliges Dreieck mit rechtem Winkel unten links
export function rightTriangle({ a = 'a', b = 'b', c = 'c', alpha = '' } = {}) {
  const svg = wrap(300, 200, `
    <polygon points='40,170 260,170 40,40' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>
    <rect x='40' y='152' width='18' height='18' fill='none' stroke='${STROKE}' stroke-width='1.5'/>
    ${text(150, 192, b)}${text(25, 110, a, 'end')}${text(165, 95, c, 'start')}
    ${alpha ? `<path d='M 225 170 A 35 35 0 0 0 231 153' fill='none' stroke='${ACCENT}' stroke-width='2'/>${text(210, 162, alpha, 'end', `fill='${ACCENT}'`)}` : ''}
    ${text(278, 182, 'Skizze nicht maßstäblich', 'end', "font-size='11' fill='#64748b'")}`);
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

const t2 = (x, y, t, anchor = 'middle', attrs = '') => `<text x='${x}' y='${y}' text-anchor='${anchor}' font-family='Inter, Arial, sans-serif' ${attrs}>${t}</text>`;

// Koordinatensystem mit Geraden/Punkten (für Aufgaben zum Ablesen und für Lösungswege).
// lines: [{ m, b, label?, color? }], points: [{ x, y, label? }]
export function plot({ polygons = [], title = '', xmin = -5, xmax = 5, ymin = -5, ymax = 5, xstep = 1, ystep = 1, lines = [], points = [], xlabel = 'x', ylabel = 'y', name = 'graph', width = 340 }) {
  const L = 34, R = 14, T = 18, B = 28;
  const iw = width - L - R;
  const ih = Math.round(Math.max(150, Math.min(300, iw * ((ymax - ymin) / (xmax - xmin)))));
  const W = width, H = ih + T + B;
  const X = (x) => L + ((x - xmin) / (xmax - xmin)) * iw;
  const Y = (y) => T + ((ymax - y) / (ymax - ymin)) * ih;
  const f = (n) => String(Math.round(n * 100) / 100).replace('.', ',').replace('-', '−');
  let g = '';
  for (let v = Math.ceil(xmin / xstep) * xstep; v <= xmax + 1e-9; v += xstep) {
    g += `<line x1='${X(v)}' y1='${T}' x2='${X(v)}' y2='${T + ih}' stroke='#e2e8f0'/>`;
    if (Math.abs(v) > 1e-9) g += t2(X(v), (ymin <= 0 && ymax >= 0 ? Y(0) : T + ih) + 14, f(v), 'middle', "font-size='11' fill='#64748b'");
  }
  for (let v = Math.ceil(ymin / ystep) * ystep; v <= ymax + 1e-9; v += ystep) {
    g += `<line x1='${L}' y1='${Y(v)}' x2='${L + iw}' y2='${Y(v)}' stroke='#e2e8f0'/>`;
    if (Math.abs(v) > 1e-9) g += t2((xmin <= 0 && xmax >= 0 ? X(0) : L) - 5, Y(v) + 4, f(v), 'end', "font-size='11' fill='#64748b'");
  }
  const ax = xmin <= 0 && xmax >= 0 ? X(0) : L;
  const ay = ymin <= 0 && ymax >= 0 ? Y(0) : T + ih;
  const cols = ['#4f46e5', '#f59e0b', '#10b981', '#e11d48'];
  const ls = lines.map((l, i) => {
    const c = l.color || cols[i % cols.length];
    const lab = l.label ? t2(X(xmax) - 6, Y(l.m * xmax + l.b) + (l.m * xmax + l.b > ymax - 1 ? 14 : -6), l.label, 'end', `font-size='13' font-weight='700' fill='${c}'`) : '';
    return `<line x1='${X(xmin)}' y1='${Y(l.m * xmin + l.b)}' x2='${X(xmax)}' y2='${Y(l.m * xmax + l.b)}' stroke='${c}' stroke-width='2.5' clip-path='url(#c)'/>${lab}`;
  }).join('');
  const polys = polygons.map((pg) => `<polygon points='${pg.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}' fill='${pg.fill || '#e0e7ff'}' fill-opacity='0.6' stroke='${pg.color || '#475569'}' stroke-width='2'/>`).join('');
  const ps = points.map((p) => `<circle cx='${X(p.x)}' cy='${Y(p.y)}' r='4.5' fill='#0f172a'/>${p.label ? t2(X(p.x) + 7, Y(p.y) - 7, p.label, 'start', "font-size='13' font-weight='700'") : ''}`).join('');
  const svg = wrap(W, H, `<clipPath id='c'><rect x='${L}' y='${T}' width='${iw}' height='${ih}'/></clipPath>${g}
    <line x1='${L}' y1='${ay}' x2='${L + iw}' y2='${ay}' stroke='${STROKE}' stroke-width='1.5'/>
    <line x1='${ax}' y1='${T}' x2='${ax}' y2='${T + ih}' stroke='${STROKE}' stroke-width='1.5'/>
    ${title ? t2(L + iw / 2, 13, title, 'middle', "font-size='15' font-weight='700' fill='#0f172a'") : ''}${polys}${ls}${ps}${t2(L + iw, H - 6, xlabel, 'end', "font-size='12' font-weight='600' fill='#475569'")}${t2(L - 28, 12, ylabel, 'start', "font-size='12' font-weight='600' fill='#475569'")}`);
  return save(svg, name);
}

// Kreisdiagramm: slices [{ label, value, color? }]
export function pie({ slices, name = 'kreis' }) {
  const palette = ['#334155', '#6366f1', '#38bdf8', '#f59e0b', '#94a3b8', '#10b981'];
  const total = slices.reduce((a, s) => a + s.value, 0);
  const cx = 150, cy = 130, r = 95;
  let a0 = -Math.PI / 2;
  let body = '';
  slices.forEach((s, i) => {
    const a1 = a0 + (s.value / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const P = (a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    body += `<path d='M ${cx} ${cy} L ${P(a0)} A ${r} ${r} 0 ${large} 1 ${P(a1)} Z' fill='${s.color || palette[i % palette.length]}' stroke='white' stroke-width='2'/>`;
    const am = (a0 + a1) / 2;
    const lx = cx + (r + 8) * Math.cos(am), ly = cy + (r + 8) * Math.sin(am);
    body += t2(lx, ly + 4, s.label, Math.cos(am) >= 0 ? 'start' : 'end', "font-size='12.5' fill='#0f172a'");
    a0 = a1;
  });
  return save(wrap(460, 260, body.replace(/<path /, '<g transform="translate(40 0)"><path ') + '</g>'), name);
}

// Baukasten für Skizzen: reine Bausteine (drawcore.js) plus Speichern als SVG-Datei
export const draw = { ...drawCore, svg: (name, w, h, body) => save(wrap(w, h, body), name) };

// Zweistufiges Baumdiagramm. branches: [{ label, p, kids: [{ label, p }] }]; p als Text (z. B. '3/5' oder '?')
export function tree({ branches, name = 'baum' }) {
  const leaves = branches.reduce((a, b) => a + b.kids.length, 0);
  const rowH = 34;
  const H = leaves * rowH + 30;
  const W = 400;
  const x0 = 20, x1 = 170, x2 = 340;
  const yTop = 22;
  let body = '';
  let leafIdx = 0;
  const rootY = H / 2;
  body += draw.dot(x0, rootY);
  branches.forEach((b) => {
    const ys = b.kids.map(() => yTop + (leafIdx++) * rowH + rowH / 2);
    const by = (ys[0] + ys[ys.length - 1]) / 2;
    body += draw.ln(x0, rootY, x1 - 14, by);
    body += draw.tx((x0 + x1) / 2 - 6, (rootY + by) / 2 + (by < rootY ? -6 : 14), b.p, 'middle', "font-size='12.5' fill='#4f46e5' font-weight='600'");
    body += draw.tx(x1, by + 5, b.label, 'middle', "font-size='15' font-weight='700' fill='#0f172a'");
    b.kids.forEach((k, i) => {
      body += draw.ln(x1 + 14, by, x2 - 14, ys[i]);
      body += draw.tx((x1 + x2) / 2 + 4, (by + ys[i]) / 2 + (ys[i] < by ? -4 : 13), k.p, 'middle', "font-size='12.5' fill='#4f46e5' font-weight='600'");
      body += draw.tx(x2, ys[i] + 5, k.label, 'middle', "font-size='15' font-weight='700' fill='#0f172a'");
    });
  });
  return save(wrap(W, H, body), name);
}
