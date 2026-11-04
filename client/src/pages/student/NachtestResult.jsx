import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, PlusCircle, Star, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, formatDate } from '../../components/ui.jsx';

// Ergebnis eines Nachtests: je Thema „vorher“ und „jetzt“ (Anzahl richtig, ohne Stufen).
export default function NachtestResult() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(() => api.get(`/student/nachtest/${id}`), [id]);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { topics, total, previous } = data;
  const prevName = previous?.kind || 'Einstiegstest';

  const better = topics.filter((t) => t.status === 'better');
  const isFull = (t) => t.after.total > 0 && t.after.correct >= t.after.total;
  const perfect = topics.filter((t) => t.status === 'perfect' || (t.status === 'new' && isFull(t)));
  const fresh = topics.filter((t) => t.status === 'new' && !isFull(t));
  const todo = topics.filter((t) => t.status === 'same' || t.status === 'worse');
  const pct = (x) => (total.of ? Math.round((x / total.of) * 100) : 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">← Zurück zur Startseite</Link>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-50"><TrendingUp size={18} /> Dein Nachtest{data.run.finishedAt && ` vom ${formatDate(data.run.finishedAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}`}</div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {better.length ? `Du hast dich in ${better.length} ${better.length === 1 ? 'Thema' : 'Themen'} verbessert!` : 'Danke fürs Mitmachen!'}
          </h1>
          <p className="mt-1 text-sm text-emerald-50">Hier siehst du, wie du im Vergleich zum {prevName} abgeschnitten hast.</p>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <ScoreBar label={prevName} value={total.before} of={total.of} tone="slate" />
          <ScoreBar label="Nachtest" value={total.after} of={total.of} tone="emerald" />
          {total.after > total.before && (
            <p className="text-sm font-medium text-emerald-700 sm:col-span-2">
              <Sparkles size={15} className="mr-1 inline" /> {total.after - total.before} Aufgaben mehr richtig als beim {prevName} (+{pct(total.after) - pct(total.before)} Prozentpunkte).
            </p>
          )}
        </div>
      </div>

      {better.length > 0 && (
        <Group title="Hier bist du besser geworden" icon={<ArrowUpRight size={18} className="text-emerald-600" />} prevName={prevName} topics={better} />
      )}
      {perfect.length > 0 && (
        <Group title="Weiterhin alles richtig" icon={<Star size={18} className="fill-amber-400 text-amber-500" />} prevName={prevName} topics={perfect} />
      )}
      {todo.length > 0 && (
        <Group
          title="Hier ist noch Luft nach oben"
          icon={<PlusCircle size={18} className="text-violet-600" />}
          hint="Das ist ganz normal. Für diese Themen bekommst du Zusatzübungen. Dein Fortschritt im Lernplan bleibt dabei, wie er ist."
          prevName={prevName}
          topics={todo}
        />
      )}

      {fresh.length > 0 && (
        <Group title="Zum ersten Mal getestet" icon={<Sparkles size={18} className="text-brand-600" />} hint={`Diese Themen waren im ${prevName} noch nicht dabei.`} prevName={prevName} topics={fresh} />
      )}

      <div className="flex justify-end">
        <Link to="/" className="btn-primary">Zu meinem Lernplan <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, of, tone }) {
  const pct = of ? Math.round((value / of) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold tabular-nums text-slate-900">{value} von {of} richtig</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-3 rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : 'bg-slate-400'} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Group({ title, icon, hint, topics, prevName }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">{icon} {title}</h2>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className="card mt-3 divide-y divide-slate-100 overflow-hidden">
        {topics.map((t) => <TopicRow key={t.topicId} t={t} prevName={prevName} />)}
      </div>
    </section>
  );
}

function Dots({ correct, total, tone }) {
  return (
    <span className="flex gap-1" aria-label={`${correct} von ${total} richtig`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-3 w-3 rounded-full ${i < correct ? (tone === 'emerald' ? 'bg-emerald-500' : 'bg-slate-400') : 'bg-slate-200'}`} />
      ))}
    </span>
  );
}

function TopicRow({ t, prevName }) {
  const diff = t.before ? t.after.correct - t.before.correct : null;
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <TopicIcon topic={t.topic} size="sm" />
        <div className="min-w-0">
          <Link to={`/thema/${t.topic.id}`} className="font-semibold text-slate-900 hover:text-brand-700">{t.topic.title}</Link>
          {t.extra && (
            <Link to={`/thema/${t.topic.id}#zusatz`} className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline">
              <PlusCircle size={12} /> Neue Zusatzübungen ({t.extra.total} Aufgaben)
            </Link>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:w-72">
        {t.before && <><span>{prevName}</span><span className="flex items-center gap-2"><Dots correct={t.before.correct} total={t.before.total} /> {t.before.correct}/{t.before.total}</span></>}
        <span className="font-semibold text-slate-700">Nachtest</span>
        <span className="flex items-center gap-2 font-semibold text-slate-700"><Dots correct={t.after.correct} total={t.after.total} tone="emerald" /> {t.after.correct}/{t.after.total}</span>
      </div>
      {diff !== null && (
        <span className={`chip w-20 shrink-0 justify-center ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : diff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
          {diff > 0 ? <ArrowUpRight size={12} /> : diff < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
          {diff > 0 ? `+${diff}` : diff < 0 ? diff : 'gleich'}
        </span>
      )}
    </div>
  );
}
