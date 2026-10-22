import { useRef, useState } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import { parseNumber } from '../../../shared/checker.js';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#e11d48'];
const fmt = (n) => String(Math.round(n * 1e6) / 1e6).replace('.', ',').replace('-', '−');

function niceStep(range, target = 5) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
}

function ticks(min, max, step) {
  const out = [];
  const start = Math.ceil(min / step - 1e-9) * step;
  for (let v = start; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

// Gemeinsames Koordinatensystem (SVG) mit Achsen, Gitter und Beschriftung.
function Frame({ view, W = 560, children, svgRef, onPointerDown, onPointerMove, onPointerLeave, interactive }) {
  const { xmin, xmax, ymin, ymax } = view;
  const xr = xmax - xmin;
  const yr = ymax - ymin;
  const L = 48, R = 18, T = 22, B = 38;
  const iw = W - L - R;
  const ih = Math.max(200, Math.min(400, iw * (yr / xr)));
  const H = ih + T + B;
  const X = (x) => L + ((x - xmin) / xr) * iw;
  const Y = (y) => T + ((ymax - y) / yr) * ih;
  const xs = ticks(xmin, xmax, view.xstep || niceStep(xr));
  const ys = ticks(ymin, ymax, view.ystep || niceStep(yr));
  const ax = xmin <= 0 && xmax >= 0 ? X(0) : X(xmin);
  const ay = ymin <= 0 && ymax >= 0 ? Y(0) : Y(ymin);
  const clipId = useRef(`clip-${Math.random().toString(36).slice(2, 8)}`).current;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full max-w-[600px] select-none rounded-xl border border-slate-200 bg-white ${interactive ? 'cursor-crosshair touch-manipulation' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      role="img"
      aria-label="Koordinatensystem"
    >
      <defs><clipPath id={clipId}><rect x={L} y={T} width={iw} height={ih} /></clipPath></defs>
      {xs.map((v) => <line key={`gx${v}`} x1={X(v)} x2={X(v)} y1={T} y2={T + ih} stroke="#e2e8f0" strokeWidth="1" />)}
      {ys.map((v) => <line key={`gy${v}`} x1={L} x2={L + iw} y1={Y(v)} y2={Y(v)} stroke="#e2e8f0" strokeWidth="1" />)}
      <line x1={L} x2={L + iw} y1={ay} y2={ay} stroke="#334155" strokeWidth="1.5" />
      <line x1={ax} x2={ax} y1={T} y2={T + ih} stroke="#334155" strokeWidth="1.5" />
      {xs.filter((v) => v !== 0 || ax !== X(0)).map((v) => (
        <text key={`tx${v}`} x={X(v)} y={ay + 15 > T + ih + 14 ? T + ih + 14 : ay + 15} textAnchor="middle" fontSize="11" fill="#64748b">{fmt(v)}</text>
      ))}
      {ys.filter((v) => v !== 0 || ay !== Y(0)).map((v) => (
        <text key={`ty${v}`} x={ax - 6 < L - 2 ? L - 6 : ax - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#64748b">{fmt(v)}</text>
      ))}
      {view.xlabel && <text x={L + iw} y={H - 6} textAnchor="end" fontSize="12" fontWeight="600" fill="#475569">{view.xlabel}</text>}
      {view.ylabel && <text x={L - 38} y={13} textAnchor="start" fontSize="12" fontWeight="600" fill="#475569">{view.ylabel}</text>}
      <g clipPath={`url(#${clipId})`}>{children({ X, Y, iw, ih, L, T })}</g>
    </svg>
  );
}

// Tabellenwerte als Graph – wächst mit, während die Tabelle ausgefüllt wird.
export function LivePlot({ plot, rows, values }) {
  const xs = plot.xs;
  const series = rows.map((label, r) => ({
    label,
    pts: xs.map((x, c) => ({ x, y: parseNumber(values[r * xs.length + c]) })).filter((p) => Number.isFinite(p.y)),
  }));
  const all = series.flatMap((s) => s.pts.map((p) => p.y));
  const ymax = Math.max(...all, 1) * 1.08;
  const ymin = Math.min(0, ...all);
  const view = { xmin: Math.min(...xs) - 0.0, xmax: Math.max(...xs), ymin, ymax, xlabel: plot.xlabel, ylabel: plot.ylabel, xstep: plot.xstep || (xs.length > 8 ? niceStep(Math.max(...xs) - Math.min(...xs)) : 1) };
  const hasData = all.length > 0;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="font-semibold">Dein Graph</span>
        {series.length > 1 && series.map((s, i) => (
          <span key={i} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.label}</span>
        ))}
        {!hasData && <span>– trage Werte in die Tabelle ein, dann erscheint der Graph.</span>}
      </div>
      <Frame view={view}>
        {({ X, Y }) => series.map((s, i) => (
          <g key={i} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]}>
            {s.pts.length > 1 && <polyline fill="none" strokeWidth="2.5" strokeLinejoin="round" points={s.pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} />}
            {s.pts.map((p, k) => <circle key={k} cx={X(p.x)} cy={Y(p.y)} r="4" stroke="white" strokeWidth="1.5" />)}
          </g>
        ))}
      </Frame>
    </div>
  );
}

// Geraden bzw. Punkte per Klick ins Koordinatensystem setzen.
export function CoordinateInput({ spec, value, onChange, status, disabled }) {
  const view = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, snapX: 1, snapY: 1, ...spec.view };
  const pts = (Array.isArray(value) ? value : []).map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p));
  const need = spec.need || 2;
  const lineMode = spec.mode !== 'points';
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const state = useRef({});
  const handle = (e, commit) => {
    if (disabled) return;
    const { L, T, iw, ih } = state.current;
    if (iw == null) return;
    const svg = svgRef.current;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    if (p.x < L - 8 || p.x > L + iw + 8 || p.y < T - 8 || p.y > T + ih + 8) { setHover(null); return; }
    const x = view.xmin + ((p.x - L) / iw) * (view.xmax - view.xmin);
    const y = view.ymax - ((p.y - T) / ih) * (view.ymax - view.ymin);
    const sx = Math.round(x / view.snapX) * view.snapX;
    const sy = Math.round(y / view.snapY) * view.snapY;
    const pt = { x: Math.round(Math.max(view.xmin, Math.min(view.xmax, sx)) * 1e6) / 1e6, y: Math.round(Math.max(view.ymin, Math.min(view.ymax, sy)) * 1e6) / 1e6 };
    if (!commit) { setHover(pt); return; }
    const same = pts.findIndex((q) => Math.abs(q.x - pt.x) < 1e-9 && Math.abs(q.y - pt.y) < 1e-9);
    if (same >= 0) onChange(pts.filter((_, i) => i !== same)); // erneutes Antippen entfernt den Punkt
    else if (pts.length < need) onChange([...pts, pt]);
  };

  const stroke = status ? (status.correct ? '#059669' : '#dc2626') : null;
  const labels = spec.labels || [];
  const pairs = lineMode ? Array.from({ length: Math.ceil(need / 2) }, (_, k) => pts.slice(2 * k, 2 * k + 2)) : [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          {lineMode
            ? `Tippe ${need === 2 ? 'zwei Punkte der Geraden' : `je zwei Punkte für ${need / 2} Geraden`} an. Ein Punkt kann durch erneutes Antippen entfernt werden.`
            : `Tippe ${need} Punkte im Koordinatensystem an.`}
        </span>
        <span className="flex gap-1">
          <button type="button" className="btn-ghost btn-sm" disabled={disabled || !pts.length} onClick={() => onChange(pts.slice(0, -1))}><Undo2 size={14} /> Rückgängig</button>
          <button type="button" className="btn-ghost btn-sm" disabled={disabled || !pts.length} onClick={() => onChange([])}><RotateCcw size={14} /> Neu</button>
        </span>
      </div>
      {lineMode && need > 2 && labels.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {labels.slice(0, need / 2).map((l, i) => <span key={i} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{l}</span>)}
        </div>
      )}
      <div className="relative">
        <Frame
          view={view}
          svgRef={svgRef}
          interactive={!disabled}
          onPointerDown={(e) => handle(e, true)}
          onPointerMove={(e) => handle(e, false)}
          onPointerLeave={() => setHover(null)}
        >
          {(geo) => {
            state.current = geo;
            const { X, Y } = geo;
            return (
              <>
                {(spec.polygons || []).map((poly, i) => (
                  <polygon key={`poly${i}`} points={poly.map(([px, py]) => `${X(px)},${Y(py)}`).join(' ')} fill="#e0e7ff" fillOpacity="0.55" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" />
                ))}
                {spec.connect && pts.length > 1 && (
                  <polygon points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="#fde68a" fillOpacity="0.5" stroke={stroke || '#f59e0b'} strokeWidth="2.5" strokeLinejoin="round" />
                )}
                {pairs.map((pr, k) => {
                  if (pr.length < 2 || Math.abs(pr[1].x - pr[0].x) < 1e-9) return null;
                  const m = (pr[1].y - pr[0].y) / (pr[1].x - pr[0].x);
                  const b = pr[0].y - m * pr[0].x;
                  return <line key={k} x1={X(view.xmin)} y1={Y(m * view.xmin + b)} x2={X(view.xmax)} y2={Y(m * view.xmax + b)} stroke={stroke || COLORS[k % COLORS.length]} strokeWidth="2.5" strokeLinecap="round" />;
                })}
                {(spec.given || []).map(([gx, gy, name], i) => (
                  <g key={`g${i}`}>
                    <circle cx={X(gx)} cy={Y(gy)} r="5" fill="#0f172a" stroke="white" strokeWidth="1.5" />
                    <text x={X(gx) + 8} y={Y(gy) - 8} fontSize="13" fontWeight="700" fill="#0f172a">{name}</text>
                  </g>
                ))}
                {pts.map((p, i) => (
                  <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="6" fill={stroke || COLORS[(lineMode ? Math.floor(i / 2) : 0) % COLORS.length]} stroke="white" strokeWidth="2" />
                ))}
                {hover && !disabled && pts.length < need && <circle cx={X(hover.x)} cy={Y(hover.y)} r="5" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 2" />}
              </>
            );
          }}
        </Frame>
        {hover && !disabled && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-medium tabular-nums text-white">({fmt(hover.x)} | {fmt(hover.y)})</div>
        )}
      </div>
    </div>
  );
}
