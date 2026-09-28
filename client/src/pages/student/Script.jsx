import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, Empty } from '../../components/ui.jsx';
import ScriptBlocks from '../../components/ScriptBlocks.jsx';

export default function Script() {
  const { topicId } = useParams();
  const { hash } = useLocation();
  const { data, error, loading } = useLoad(() => api.get(`/student/script/${topicId}`), [topicId]);
  const [highlight, setHighlight] = useState(null);

  // Zum passenden Abschnitt springen (Skript-Button bei den Aufgaben)
  useEffect(() => {
    if (!data || !hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      setHighlight(hash.slice(1));
      const h = setTimeout(() => setHighlight(null), 2500);
      return () => clearTimeout(h);
    }
  }, [data, hash]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { topic, sections, topics } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="card p-3">
          <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Skript · Themen</div>
          <nav className="space-y-0.5">
            {topics.map((t) => (
              <Link key={t.id} to={`/skript/${t.id}`} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${String(t.id) === String(topicId) ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <TopicIcon topic={t} size="sm" /> <span className="truncate">{t.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 space-y-5">
        <div className="card flex items-center gap-4 p-6">
          <TopicIcon topic={topic} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600"><BookOpen size={14} /> Skript</div>
            <h1 className="text-2xl font-bold text-slate-900">{topic.title}</h1>
          </div>
          <Link to={`/thema/${topic.id}`} className="btn-primary hidden sm:inline-flex">Jetzt üben</Link>
        </div>
        {sections.length > 1 && (
          <div className="card flex flex-wrap gap-2 p-4">
            {sections.map((s, i) => (
              <a key={s.id} href={`#abschnitt-${s.id}`} className="chip bg-slate-100 py-1 text-slate-700 hover:bg-brand-50 hover:text-brand-700">{i + 1}. {s.title}</a>
            ))}
          </div>
        )}
        {sections.length === 0 && <div className="card"><Empty title="Zu diesem Thema gibt es noch kein Skript." /></div>}
        {sections.map((s, i) => (
          <section key={s.id} id={`abschnitt-${s.id}`} className={`card scroll-mt-24 p-6 transition ${highlight === `abschnitt-${s.id}` ? 'ring-4 ring-amber-300' : ''}`}>
            <h2 className="mb-3 text-lg font-bold text-slate-900"><span className="mr-2 text-brand-600">{i + 1}.</span>{s.title}</h2>
            <ScriptBlocks blocks={s.blocks} />
          </section>
        ))}
      </div>
    </div>
  );
}
