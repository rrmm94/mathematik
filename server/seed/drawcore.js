// Reine Zeichen-Bausteine für SVG-Skizzen (ohne Dateizugriff, daher auch in Tests nutzbar).
const STROKE = '#334155';
export const t2 = (x, y, t, anchor = 'middle', attrs = '') => `<text x='${x}' y='${y}' text-anchor='${anchor}' font-family='Inter, Arial, sans-serif' ${attrs}>${t}</text>`;
export const wrapSvg = (w, h, body) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'>${body}</svg>`;
export const drawCore = {
  ln: (x1, y1, x2, y2, o = '') => `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' ${o.includes('stroke=') ? '' : `stroke='${STROKE}'`} stroke-width='2' ${o}/>`,
  poly: (pts, fill = '#eef2ff', o = '') => `<polygon points='${pts.map((p) => p.join(',')).join(' ')}' fill='${fill}' stroke='${STROKE}' stroke-width='2' stroke-linejoin='round' ${o}/>`,
  tx: (x, y, t, anchor = 'middle', attrs = "font-size='14' fill='#0f172a'") => t2(x, y, t, anchor, attrs),
  circle: (cx, cy, r, fill = 'none', o = '') => `<circle cx='${cx}' cy='${cy}' r='${r}' fill='${fill}' stroke='${STROKE}' stroke-width='2' ${o}/>`,
  dot: (x, y, r = 3.5) => `<circle cx='${x}' cy='${y}' r='${r}' fill='#0f172a'/>`,
  // Rechter Winkel bei (x, y); d1, d2: Einheitsvektoren der beiden Schenkel
  ra: (x, y, d1, d2, s = 12) => `<polyline points='${x + d1[0] * s},${y + d1[1] * s} ${x + (d1[0] + d2[0]) * s},${y + (d1[1] + d2[1]) * s} ${x + d2[0] * s},${y + d2[1] * s}' fill='none' stroke='${STROKE}' stroke-width='1.5'/>`,
  dashed: "stroke-dasharray='5 4'",
};
