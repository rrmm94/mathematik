import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { MathContent } from './ui.jsx';

export function youtubeId(url = '') {
  const m = String(url).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function QR({ url }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: '#0f172a', light: '#ffffff' } }).then(setSrc).catch(() => setSrc(null));
  }, [url]);
  return src ? <img src={src} alt="QR-Code" className="h-24 w-24 rounded-lg border border-slate-200 bg-white p-1" /> : null;
}

// Zeigt die Bausteine eines Skript-Abschnitts: Text/LaTeX, Bild/SVG, Video, Link + QR-Code
export default function ScriptBlocks({ blocks = [] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.type === 'text') return <MathContent key={i} md={b.md} />;
        if (b.type === 'image') {
          return (
            <figure key={i} className="my-2">
              {b.url && <img src={b.url} alt={b.caption || 'Abbildung'} className="max-h-96 max-w-full rounded-xl border border-slate-200 bg-white p-2" style={b.width ? { width: b.width } : undefined} />}
              {b.caption && <figcaption className="mt-1.5 text-xs text-slate-500">{b.caption}</figcaption>}
            </figure>
          );
        }
        if (b.type === 'video') {
          const id = youtubeId(b.url);
          return (
            <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
              {id ? (
                <div className="aspect-video">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={b.title || 'Video'}
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : (
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 text-white"><PlayCircle /> {b.title || b.url}</a>
              )}
              {b.title && id && <div className="bg-white px-4 py-2 text-sm font-medium text-slate-700">{b.title}</div>}
            </div>
          );
        }
        if (b.type === 'link') {
          return (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {b.qr && b.url && <QR url={b.url} />}
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weiterführend</div>
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                  {b.title || b.url} <ExternalLink size={14} />
                </a>
                {b.qr && <div className="mt-1 text-xs text-slate-500">Scanne den QR-Code mit deinem Handy.</div>}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
