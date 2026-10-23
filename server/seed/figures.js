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

// Zusätzliche Attribute (extra) überschreiben die Standard-Schrift – jedes Attribut darf nur einmal vorkommen,
// sonst ist das SVG ungültig und wird im Browser nicht angezeigt.
const text = (x, y, t, anchor = 'middle', extra = '') => {
  const attrs = { 'font-family': 'Inter, Arial, sans-serif', 'font-size': '15', fill: '#0f172a' };
  for (const m of extra.matchAll(/([\w-]+)='([^']*)'/g)) attrs[m[1]] = m[2];
  const a = Object.entries(attrs).map(([k, v]) => `${k}='${v}'`).join(' ');
  return `<text x='${x}' y='${y}' text-anchor='${anchor}' ${a}>${t}</text>`;
};

// Höhenbeschriftung: links neben der gestrichelten Höhe, mit weißem Rand – so liegt sie nicht auf einer Dreiecksseite
const HALO = `fill='${ACCENT}' stroke='white' stroke-width='4' paint-order='stroke'`;

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
    ${text(150, 182, g)}${text(182, 130, h, 'end', HALO)}`);
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


// ---------------------------------------------------------------------------
// Grafiken für die Prüfungsaufgaben (pruefung.js)
// ---------------------------------------------------------------------------
const GRID = '#e2e8f0';
const MUTED = '#64748b';
const PALETTE = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#a855f7'];
const PALE = ['#c7d2fe', '#fde68a', '#a7f3d0', '#fecaca', '#bae6fd', '#e9d5ff'];

const fmt = (v) => String(Math.round(v * 1e6) / 1e6).replace('.', ',').replace('-', '−');
const steps = (min, max, step) => {
  const out = [];
  const first = Math.ceil(min / step - 1e-9);
  for (let i = first; i * step <= max + 1e-9; i++) out.push(Math.round(i * step * 1e6) / 1e6);
  return out;
};

// Koordinatensystem mit Gitter, Achsen, Pfeilspitzen und Beschriftung.
function plane({ w = 320, h = 280, xmin = -5, xmax = 5, ymin = -5, ymax = 5, xstep = 1, ystep = 1, xlab = xstep, ylab = ystep, xname = 'x', yname = 'y' }) {
  const L = 36, R = 20, T = 20, B = 26;
  const sx = (w - L - R) / (xmax - xmin), sy = (h - T - B) / (ymax - ymin);
  const X = (x) => Math.round((L + (x - xmin) * sx) * 100) / 100;
  const Y = (y) => Math.round((h - B - (y - ymin) * sy) * 100) / 100;
  const ax = xmin <= 0 && xmax >= 0 ? 0 : xmin;
  const ay = ymin <= 0 && ymax >= 0 ? 0 : ymin;
  let g = '';
  for (const x of steps(xmin, xmax, xstep)) g += `<line x1='${X(x)}' y1='${Y(ymin)}' x2='${X(x)}' y2='${Y(ymax)}' stroke='${GRID}'/>`;
  for (const y of steps(ymin, ymax, ystep)) g += `<line x1='${X(xmin)}' y1='${Y(y)}' x2='${X(xmax)}' y2='${Y(y)}' stroke='${GRID}'/>`;
  g += `<line x1='${X(xmin)}' y1='${Y(ay)}' x2='${X(xmax) + 9}' y2='${Y(ay)}' stroke='${STROKE}' stroke-width='1.6'/>`;
  g += `<line x1='${X(ax)}' y1='${Y(ymin)}' x2='${X(ax)}' y2='${Y(ymax) - 9}' stroke='${STROKE}' stroke-width='1.6'/>`;
  g += `<polygon points='${X(xmax) + 11},${Y(ay)} ${X(xmax) + 3},${Y(ay) - 3.5} ${X(xmax) + 3},${Y(ay) + 3.5}' fill='${STROKE}'/>`;
  g += `<polygon points='${X(ax)},${Y(ymax) - 11} ${X(ax) - 3.5},${Y(ymax) - 3} ${X(ax) + 3.5},${Y(ymax) - 3}' fill='${STROKE}'/>`;
  for (const x of steps(xmin, xmax, xlab)) {
    if (x === 0 && ax === 0 && ay === 0) continue;
    g += `<line x1='${X(x)}' y1='${Y(ay) - 3}' x2='${X(x)}' y2='${Y(ay) + 3}' stroke='${STROKE}'/>` + text(X(x), Y(ay) + 17, fmt(x), 'middle', "font-size='12' fill='#475569'");
  }
  for (const y of steps(ymin, ymax, ylab)) {
    if (y === 0 && ax === 0 && ay === 0) continue;
    g += `<line x1='${X(ax) - 3}' y1='${Y(y)}' x2='${X(ax) + 3}' y2='${Y(y)}' stroke='${STROKE}'/>` + text(X(ax) - 7, Y(y) + 4, fmt(y), 'end', "font-size='12' fill='#475569'");
  }
  if (ax === 0 && ay === 0) g += text(X(0) - 7, Y(0) + 15, '0', 'end', "font-size='12' fill='#475569'");
  g += text(X(xmax) + 6, Y(ay) - 9, xname, 'start', "font-style='italic'") + text(X(ax) + 10, Y(ymax) - 6, yname, 'start', "font-style='italic'");
  const clip = `<clipPath id='cp'><rect x='${X(xmin)}' y='${Y(ymax)}' width='${X(xmax) - X(xmin)}' height='${Y(ymin) - Y(ymax)}'/></clipPath>`;
  return { X, Y, g, clip, w, h };
}

const dot = (cx, cy, color = ACCENT) => `<circle cx='${cx}' cy='${cy}' r='4.5' fill='${color}' stroke='white' stroke-width='1.5'/>`;

// Zahlenstrahl mit markierten Punkten A, B, C …
export function numberLine({ min, max, tick, labelEvery, points }) {
  const W = 360, H = 110, L = 24, R = 24, y = 70;
  const X = (v) => L + ((v - min) / (max - min)) * (W - L - R);
  let g = `<line x1='${L - 8}' y1='${y}' x2='${W - R + 12}' y2='${y}' stroke='${STROKE}' stroke-width='1.8'/><polygon points='${W - R + 16},${y} ${W - R + 8},${y - 3.5} ${W - R + 8},${y + 3.5}' fill='${STROKE}'/>`;
  const per = Math.round(labelEvery / tick);
  steps(min, max, tick).forEach((v, i) => {
    const big = i % per === 0;
    g += `<line x1='${X(v)}' y1='${y - (big ? 8 : 5)}' x2='${X(v)}' y2='${y + (big ? 8 : 5)}' stroke='${STROKE}' stroke-width='${big ? 1.8 : 1}'/>`;
    if (big) g += text(X(v), y + 26, fmt(v), 'middle', "font-size='13'");
  });
  for (const p of points) g += `<polygon points='${X(p.v)},${y - 3} ${X(p.v) - 6},${y - 15} ${X(p.v) + 6},${y - 15}' fill='${ACCENT}'/>` + text(X(p.v), y - 21, p.label, 'middle', `font-weight='700' fill='${ACCENT}'`);
  return save(wrap(W, H, g), 'zahlenstrahl');
}

// Säulendiagramm. bars: [{ label, value, unknown? }]; unknown = gestrichelte Säule mit „?“
export function barChart({ bars, max, step, unit = '', title = '', yname = '' }) {
  const W = 380, H = 250, L = 46, R = 14, T = title ? 34 : 18, B = 40;
  const Y = (v) => H - B - (v / max) * (H - T - B);
  let g = title ? text(W / 2, 18, title, 'middle', "font-weight='700'") : '';
  for (const v of steps(0, max, step)) {
    g += `<line x1='${L}' y1='${Y(v)}' x2='${W - R}' y2='${Y(v)}' stroke='${GRID}'/>` + text(L - 7, Y(v) + 4, `${fmt(v)}${unit}`, 'end', "font-size='12' fill='#475569'");
  }
  g += `<line x1='${L}' y1='${Y(0)}' x2='${W - R}' y2='${Y(0)}' stroke='${STROKE}' stroke-width='1.6'/><line x1='${L}' y1='${Y(0)}' x2='${L}' y2='${T - 6}' stroke='${STROKE}' stroke-width='1.6'/>`;
  if (yname) g += text(L + 6, T - 8, yname, 'start', "font-size='12' fill='#475569'");
  const slot = (W - L - R) / bars.length, bw = Math.min(46, slot * 0.6);
  bars.forEach((b, i) => {
    const cx = L + slot * (i + 0.5);
    if (b.unknown) {
      g += `<rect x='${cx - bw / 2}' y='${Y(max * 0.55)}' width='${bw}' height='${Y(0) - Y(max * 0.55)}' fill='none' stroke='${MUTED}' stroke-width='1.6' stroke-dasharray='5 4'/>` + text(cx, Y(max * 0.55) - 6, '?', 'middle', "font-weight='700' fill='#64748b'");
    } else {
      g += `<rect x='${cx - bw / 2}' y='${Y(b.value)}' width='${bw}' height='${Y(0) - Y(b.value)}' fill='${b.color || ACCENT}' rx='3'/>`;
    }
    g += text(cx, H - B + 18, b.label, 'middle', "font-size='13'");
  });
  return save(wrap(W, H, g), 'saeulen');
}

// Kreisdiagramm. sectors: [{ label, value (beliebige Einheit), caption? }]
export function pieChart({ sectors }) {
  const W = 400, H = 230, cx = 200, cy = 115, r = 78;
  const total = sectors.reduce((a, s) => a + s.value, 0);
  let a0 = -Math.PI / 2, g = '';
  sectors.forEach((s, i) => {
    const a1 = a0 + (s.value / total) * 2 * Math.PI;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a, rad) => `${Math.round((cx + Math.cos(a) * rad) * 100) / 100} ${Math.round((cy + Math.sin(a) * rad) * 100) / 100}`;
    g += `<path d='M ${cx} ${cy} L ${p(a0, r)} A ${r} ${r} 0 ${large} 1 ${p(a1, r)} Z' fill='${PALE[i % 6]}' stroke='white' stroke-width='2'/>`;
    const am = (a0 + a1) / 2, right = Math.cos(am) >= 0;
    const lx = cx + Math.cos(am) * (r + 10), ly = cy + Math.sin(am) * (r + 10);
    g += `<line x1='${cx + Math.cos(am) * (r - 6)}' y1='${cy + Math.sin(am) * (r - 6)}' x2='${lx}' y2='${ly}' stroke='${MUTED}' stroke-width='1'/>`;
    g += text(lx + (right ? 4 : -4), ly + 4, s.caption ? `${s.label}: ${s.caption}` : s.label, right ? 'start' : 'end', "font-size='13'");
    a0 = a1;
  });
  return save(wrap(W, H, g), 'kreis');
}

// Glücksrad mit gleich großen Feldern. cells: Beschriftungen, Farbe nach Beschriftung
export function spinner({ cells }) {
  const W = 240, H = 250, cx = 120, cy = 135, r = 90;
  const keys = [...new Set(cells)];
  let g = '';
  cells.forEach((c, i) => {
    const a0 = -Math.PI / 2 + (i / cells.length) * 2 * Math.PI, a1 = -Math.PI / 2 + ((i + 1) / cells.length) * 2 * Math.PI;
    const p = (a, rad) => `${Math.round((cx + Math.cos(a) * rad) * 100) / 100} ${Math.round((cy + Math.sin(a) * rad) * 100) / 100}`;
    g += `<path d='M ${cx} ${cy} L ${p(a0, r)} A ${r} ${r} 0 0 1 ${p(a1, r)} Z' fill='${PALE[keys.indexOf(c) % 6]}' stroke='${STROKE}' stroke-width='1.6'/>`;
    const am = (a0 + a1) / 2;
    g += text(cx + Math.cos(am) * r * 0.62, cy + Math.sin(am) * r * 0.62 + 5, c, 'middle', "font-size='17' font-weight='700'");
  });
  g += `<circle cx='${cx}' cy='${cy}' r='6' fill='${STROKE}'/><polygon points='${cx},${cy - r + 6} ${cx - 9},${cy - r - 14} ${cx + 9},${cy - r - 14}' fill='${ACCENT}'/>`;
  return save(wrap(W, H, g), 'gluecksrad');
}

// Zweistufiges Baumdiagramm. l1: [{ label, p }], l2: je Knoten der 1. Stufe [{ label, p }]; p als Text („3/8“ oder „?“)
export function tree({ l1, l2 }) {
  const n2 = l2[0].length, rows = l1.length * n2, H = 40 + rows * 38, W = 420;
  const y2 = (i, j) => 30 + (i * n2 + j) * 38 + 8;
  const y1 = (i) => (y2(i, 0) + y2(i, n2 - 1)) / 2;
  const yr = (y1(0) + y1(l1.length - 1)) / 2;
  let g = '';
  const label = (x, y, t, color = ACCENT) => `<rect x='${x - 30}' y='${y - 12}' width='60' height='22' fill='white' opacity='0.9'/>` + text(x, y + 4, t, 'middle', `font-size='14' font-weight='700' fill='${color}'`);
  l1.forEach((a, i) => {
    g += `<line x1='20' y1='${yr}' x2='170' y2='${y1(i)}' stroke='${STROKE}' stroke-width='1.6'/>` + label(95, (yr + y1(i)) / 2 + (i < l1.length / 2 ? -6 : 6), a.p);
    g += text(178, y1(i) + 5, a.label, 'start', "font-size='15' font-weight='700'");
    l2[i].forEach((b, j) => {
      g += `<line x1='196' y1='${y1(i)}' x2='320' y2='${y2(i, j)}' stroke='${STROKE}' stroke-width='1.6'/>` + label(258, (y1(i) + y2(i, j)) / 2 + (j < n2 / 2 ? -5 : 5), b.p);
      g += text(328, y2(i, j) + 5, b.label, 'start', "font-size='15' font-weight='700'");
    });
  });
  return save(wrap(W, H, g), 'baum');
}

// Punkte (und optional ein Vieleck) im Koordinatensystem. points: [{ x, y, label }]
export function coordPoints({ points, polygon = null, xmin = 0, xmax = 8, ymin = 0, ymax = 6, hideCoords = true }) {
  const pl = plane({ xmin, xmax, ymin, ymax });
  let g = pl.clip + pl.g;
  if (polygon) g += `<polygon points='${polygon.map((q) => `${pl.X(q.x)},${pl.Y(q.y)}`).join(' ')}' fill='${ACCENT}' fill-opacity='0.12' stroke='${ACCENT}' stroke-width='2'/>`;
  for (const q of points) g += dot(pl.X(q.x), pl.Y(q.y)) + text(pl.X(q.x) + 8, pl.Y(q.y) - 8, q.label, 'start', `font-weight='700' fill='${ACCENT}'`);
  return save(wrap(pl.w, pl.h, g), 'koordinaten');
}

// Geraden y = m·x + b, Punkte und optional gestrichelte Hilfslinien
export function linesGraph({ lines, points = [], xmin = 0, xmax = 10, ymin = 0, ymax = 10, xstep = 1, ystep = 1, xlab = xstep, ylab = ystep, xname = 'x', yname = 'y', w = 340, h = 290 }) {
  const pl = plane({ w, h, xmin, xmax, ymin, ymax, xstep, ystep, xlab, ylab, xname, yname });
  let g = pl.clip + pl.g;
  lines.forEach((ln, i) => {
    const c = ln.color || PALETTE[i % 6];
    g += `<line clip-path='url(#cp)' x1='${pl.X(xmin)}' y1='${pl.Y(ln.m * xmin + ln.b)}' x2='${pl.X(xmax)}' y2='${pl.Y(ln.m * xmax + ln.b)}' stroke='${c}' stroke-width='2.6'/>`;
    if (ln.label) {
      const lx = xmax - (xmax - xmin) * 0.04, ly = ln.m * lx + ln.b;
      g += text(pl.X(lx), pl.Y(Math.min(ly, ymax)) - 8, ln.label, 'end', `font-weight='700' fill='${c}'`);
    }
  });
  for (const q of points) g += dot(pl.X(q.x), pl.Y(q.y), q.color) + (q.label ? text(pl.X(q.x) + 8, pl.Y(q.y) + 16, q.label, 'start', `font-weight='700' fill='${q.color || ACCENT}'`) : '');
  return save(wrap(pl.w, pl.h, g), 'geraden');
}

// Parabeln y = a·x² + c; curves: [{ a, c, label }]
export function parabolas({ curves, xmin = -4, xmax = 4, ymin = -4, ymax = 8, xstep = 1, ystep = 1, ylab = 2 }) {
  const pl = plane({ w: 340, h: 300, xmin, xmax, ymin, ymax, xstep, ystep, xlab: 1, ylab });
  let g = pl.clip + pl.g;
  curves.forEach((cv, i) => {
    const c = PALETTE[i % 6];
    const pts = steps(xmin, xmax, 0.1).map((x) => `${pl.X(x)},${pl.Y(cv.a * x * x + cv.c)}`).join(' ');
    g += `<polyline clip-path='url(#cp)' points='${pts}' fill='none' stroke='${c}' stroke-width='2.6'/>`;
    const lx = cv.a > 0 ? Math.min(xmax - 0.2, Math.sqrt(Math.max(0, (ymax - 0.6 - cv.c) / cv.a))) : Math.min(xmax - 0.2, Math.sqrt(Math.max(0, (ymin + 0.6 - cv.c) / cv.a)));
    g += text(pl.X(lx) + 6, pl.Y(cv.a * lx * lx + cv.c) + (cv.a > 0 ? 4 : 10), cv.label, 'start', `font-weight='700' fill='${c}'`);
  });
  return save(wrap(pl.w, pl.h, g), 'parabeln');
}

// Leiter an der Wand. Beschriftungen als Text; alpha = Winkelbeschriftung oder ''
export function ladder({ l = '', h = '', x = '', alpha = '' }) {
  const W = 320, H = 240, F = { x: 70, y: 200 }, Tp = { x: 250, y: 46 };
  const th = Math.atan2(F.y - Tp.y, Tp.x - F.x), ar = 34;
  let g = `<rect x='250' y='20' width='14' height='180' fill='#cbd5e1' stroke='${STROKE}' stroke-width='1.5'/><line x1='30' y1='200' x2='290' y2='200' stroke='${STROKE}' stroke-width='2'/>`;
  g += `<rect x='232' y='182' width='18' height='18' fill='none' stroke='${STROKE}' stroke-width='1.5'/>`;
  g += `<line x1='${F.x}' y1='${F.y}' x2='${Tp.x}' y2='${Tp.y}' stroke='#b45309' stroke-width='5' stroke-linecap='round'/>`;
  for (let i = 1; i < 7; i++) {
    const px = F.x + ((Tp.x - F.x) * i) / 7, py = F.y + ((Tp.y - F.y) * i) / 7;
    g += `<line x1='${px - 7 * Math.sin(th)}' y1='${py - 7 * Math.cos(th)}' x2='${px + 7 * Math.sin(th)}' y2='${py + 7 * Math.cos(th)}' stroke='#b45309' stroke-width='2'/>`;
  }
  if (l) g += text(138, 104, l, 'end', `fill='#b45309' font-weight='700'`);
  if (h) g += text(272, 125, h, 'start', `fill='${ACCENT}' font-weight='700'`);
  if (x) g += text(160, 222, x, 'middle', `fill='${ACCENT}' font-weight='700'`);
  if (h) g += `<line x1='243' y1='${Tp.y}' x2='243' y2='182' stroke='${ACCENT}' stroke-width='1.5' stroke-dasharray='5 4'/>`;
  if (x) g += `<line x1='${F.x}' y1='210' x2='250' y2='210' stroke='${ACCENT}' stroke-width='1.5' stroke-dasharray='5 4'/>`;
  if (alpha) {
    g += `<path d='M ${F.x + ar} ${F.y} A ${ar} ${ar} 0 0 0 ${F.x + ar * Math.cos(th)} ${F.y - ar * Math.sin(th)}' fill='none' stroke='${ACCENT}' stroke-width='2'/>`;
    g += text(F.x + ar + 6, F.y - 10, alpha, 'start', `fill='${ACCENT}' font-weight='700'`);
  }
  g += `${text(312, 236, 'Skizze nicht maßstäblich', 'end', "font-size='11' fill='#64748b'")}`;
  return save(wrap(W, H, g), 'leiter');
}

// L-förmiger Grundriss. Beschriftungen (Texte) für die Seiten: top, right, bottom, left, plus die beiden Innenkanten
export function lShape({ top, right, step, bottom, left, inner }) {
  const W = 320, H = 230;
  const pts = '40,30 250,30 250,95 150,95 150,190 40,190';
  let g = `<polygon points='${pts}' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>`;
  g += text(145, 22, top) + text(262, 66, right, 'start') + text(200, 114, step) + text(158, 150, inner, 'start') + text(95, 210, bottom) + text(30, 114, left, 'end');
  g += `${text(312, 222, 'Skizze nicht maßstäblich', 'end', "font-size='11' fill='#64748b'")}`;
  return save(wrap(W, H, g), 'lform');
}

// Dreiecksprisma (z. B. Dachboden): Breite a, Höhe h, Länge l
export function prism({ a, h, l }) {
  const W = 330, H = 220, d = { x: 76, y: -42 };
  const A = { x: 36, y: 180 }, B = { x: 196, y: 180 }, C = { x: 116, y: 70 };
  const sh = (p) => ({ x: p.x + d.x, y: p.y + d.y });
  const A2 = sh(A), B2 = sh(B), C2 = sh(C);
  const P = (p) => `${p.x},${p.y}`;
  let g = `<polygon points='${P(B)} ${P(C)} ${P(C2)} ${P(B2)}' fill='#c7d2fe' stroke='${STROKE}' stroke-width='2'/>`;
  g += `<polygon points='${P(A)} ${P(B)} ${P(C)}' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>`;
  g += `<line x1='${A.x}' y1='${A.y}' x2='${A2.x}' y2='${A2.y}' stroke='${STROKE}' stroke-dasharray='5 4'/><line x1='${A2.x}' y1='${A2.y}' x2='${B2.x}' y2='${B2.y}' stroke='${STROKE}' stroke-dasharray='5 4'/><line x1='${A2.x}' y1='${A2.y}' x2='${C2.x}' y2='${C2.y}' stroke='${STROKE}' stroke-dasharray='5 4'/>`;
  g += `<line x1='${C.x}' y1='${C.y}' x2='${C.x}' y2='${A.y}' stroke='${ACCENT}' stroke-width='1.8' stroke-dasharray='6 4'/>`;
  g += text(116, 202, a) + text(C.x - 6, 138, h, 'end', `fill='${ACCENT}'`) + text(250, 168, l, 'start');
  return save(wrap(W, H, g), 'prisma');
}

// Gleichschenkliges Dreieck (Dachquerschnitt) mit Höhe; Beschriftungen als Text
export function gable({ b, h, s }) {
  const W = 320, H = 210;
  let g = `<polygon points='30,170 290,170 160,50' fill='#eef2ff' stroke='${STROKE}' stroke-width='2'/>`;
  g += `<line x1='160' y1='50' x2='160' y2='170' stroke='${ACCENT}' stroke-width='2' stroke-dasharray='6 4'/><rect x='160' y='156' width='14' height='14' fill='none' stroke='${ACCENT}' stroke-width='1.5'/>`;
  g += text(160, 192, b) + text(152, 128, h, 'end', HALO) + text(82, 100, s, 'end');
  g += `${text(312, 204, 'Skizze nicht maßstäblich', 'end', "font-size='11' fill='#64748b'")}`;
  return save(wrap(W, H, g), 'dach');
}

// Strahlensatz: Stab und Baum mit Schatten
export function shadows({ stick, stickShadow, treeShadow, tree = 'h = ?' }) {
  const W = 360, H = 240, g0 = 190;
  let g = `<line x1='10' y1='${g0}' x2='350' y2='${g0}' stroke='${STROKE}' stroke-width='2'/>`;
  g += `<line x1='70' y1='${g0}' x2='70' y2='40' stroke='#15803d' stroke-width='6'/><circle cx='70' cy='36' r='22' fill='#bbf7d0' stroke='#15803d' stroke-width='2'/>`;
  g += `<line x1='250' y1='${g0}' x2='250' y2='140' stroke='#b45309' stroke-width='5'/>`;
  g += `<line x1='70' y1='40' x2='190' y2='${g0}' stroke='#f59e0b' stroke-width='2' stroke-dasharray='6 4'/><line x1='250' y1='140' x2='310' y2='${g0}' stroke='#f59e0b' stroke-width='2' stroke-dasharray='6 4'/>`;
  g += `<line x1='70' y1='${g0 + 14}' x2='190' y2='${g0 + 14}' stroke='${ACCENT}' stroke-width='1.5'/><line x1='250' y1='${g0 + 14}' x2='310' y2='${g0 + 14}' stroke='${ACCENT}' stroke-width='1.5'/>`;
  g += text(130, g0 + 32, treeShadow, 'middle', `fill='${ACCENT}'`) + text(280, g0 + 32, stickShadow, 'middle', `fill='${ACCENT}'`);
  g += text(56, 120, tree, 'end', `fill='#15803d' font-weight='700'`) + text(262, 168, stick, 'start', `fill='#b45309' font-weight='700'`);
  return save(wrap(W, H, g), 'schatten');
}

// Plättchenmuster: Quadratrahmen mit n × n Plättchen außen
export function frames({ ns }) {
  const cell = 16, gap = 26;
  let x = 10, g = '';
  const H = Math.max(...ns) * cell + 52;
  ns.forEach((n, k) => {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i > 0 && i < n - 1 && j > 0 && j < n - 1) continue;
      g += `<rect x='${x + j * cell}' y='${12 + i * cell}' width='${cell - 2}' height='${cell - 2}' rx='2' fill='${ACCENT}'/>`;
    }
    g += text(x + (n * cell) / 2 - 1, H - 10, `Figur ${k + 1}`, 'middle', "font-size='13'");
    x += n * cell + gap;
  });
  return save(wrap(x - gap + 10, H, g), 'rahmen');
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
export function probTree({ branches, name = 'baum' }) {
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
