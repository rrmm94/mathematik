import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen, ChevronRight, Dumbbell, MessageSquareHeart, CalendarClock, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, ProgressBar, Empty, formatDate, colorOf } from '../../components/ui.jsx';

export default function Topic() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(() => api.get(`/student/topics/${id}`), [id]);

  useEffect(() => {
    const unread = data?.feedback?.filter((f) => !f.read_at).map((f) => f.id);
    if (unread?.length) api.post('/student/feedback/read', { ids: unread });
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { topic, progress, packages, sections, feedback, events } = data;
  const c = colorOf(topic.color);

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">← Zurück zum Lernplan</Link>
      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <TopicIcon topic={topic} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{topic.title}</h1>
          <p className="text-sm text-slate-500">{topic.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={progress.percent} color={topic.color} className="max-w-sm" height="h-2.5" />
            <span className={`text-sm font-semibold ${c.text}`}>{progress.percent} %</span>
          </div>
        </div>
        <Link to={`/skript/${topic.id}`} className="btn-secondary"><BookOpen size={16} /> Zum Skript</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900"><Dumbbell size={20} className={c.text} /> Übungspakete</h2>
          {packages.length === 0 ? (
            <div className="card"><Empty title="Hier gibt es noch keine Übungen">Schau bald wieder vorbei.</Empty></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {packages.map((p, i) => {
                const pct = p.total ? Math.round((p.solved / p.total) * 100) : 0;
                const complete = p.total > 0 && p.solved >= p.total;
                return (
                  <Link key={p.id} to={`/ueben/${p.id}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`chip ${c.bg} ${c.text}`}>Paket {i + 1}</span>
                      {complete && <CheckCircle2 size={20} className="text-emerald-500" />}
                    </div>
                    <div className="font-semibold text-slate-900">{p.title}</div>
                    <div className="mb-4 text-sm text-slate-500">{p.description}</div>
                    <div className="mt-auto flex items-center gap-3">
                      <ProgressBar value={pct} color={topic.color} />
                      <span className="shrink-0 text-xs font-medium text-slate-500">{p.solved}/{p.total}</span>
                      <ChevronRight size={18} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {feedback.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><MessageSquareHeart size={18} className="text-rose-500" /> Feedback deiner Lehrkraft</h3>
              <div className="space-y-3">
                {feedback.map((f) => (
                  <div key={f.id} className="rounded-xl bg-rose-50/70 p-3 text-sm text-slate-700">
                    <div className="mb-1 text-xs text-slate-500">{formatDate(f.created_at)}</div>
                    <p className="whitespace-pre-wrap">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><BookOpen size={18} className="text-brand-600" /> Im Skript nachlesen</h3>
            <ul className="space-y-1">
              {sections.map((s) => (
                <li key={s.id}>
                  <Link to={`/skript/${topic.id}#abschnitt-${s.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-700">
                    {s.title} <ChevronRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {events.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><CalendarClock size={18} className="text-brand-600" /> Wiederholung im Unterricht</h3>
              {events.map((e) => (
                <div key={e.id} className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{formatDate(e.date)}</span> {e.time && `· ${e.time}`} {e.room && `· ${e.room}`}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
