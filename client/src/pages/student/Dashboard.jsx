import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ClipboardCheck, ArrowRight, Target, CalendarClock, MessageSquareHeart, BookOpen, Dumbbell, Sparkles, Clock, MapPin, PartyPopper, TrendingUp, RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, ProgressBar, formatDate, Empty, colorOf, Modal } from '../../components/ui.jsx';

export default function Dashboard() {
  const { data, error, loading, reload } = useLoad(() => api.get('/student/dashboard'));
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { user, diagnose, plan } = data;
  const first = user.displayName.split(' ')[0];

  // Allererster Besuch: nur der Diagnosetest
  if (!diagnose.hasPlan) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <GoalBanner data={data} compact />
        <DiagnoseStart diagnose={diagnose} first={first} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoalBanner data={data} />
      {data.feedback.some((f) => !f.read_at) && (
        <a href="#feedback" className="card flex items-center gap-3 border-rose-200 bg-rose-50/70 px-5 py-3 text-sm font-medium text-rose-800 hover:bg-rose-50">
          <MessageSquareHeart size={18} /> Du hast neues Feedback von deiner Lehrkraft! <ArrowRight size={16} className="ml-auto" />
        </a>
      )}
      {data.retest && <RetestResult retest={data.retest} />}
      {(diagnose.canStart || diagnose.active) && <RetestCard diagnose={diagnose} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dein Lernplan</h2>
              <p className="text-sm text-slate-500">Oben steht, womit du am besten anfängst. Du kannst aber jedes Thema frei wählen.</p>
            </div>
          </div>
          <div className="space-y-3">
            {plan.map((p, i) => <PlanCard key={p.topic.id} item={p} index={i} />)}
          </div>
        </section>
        <aside className="order-first grid gap-6 md:grid-cols-2 lg:order-none lg:block lg:space-y-6">
          <FeedbackBox feedback={data.feedback} onRead={reload} />
          <EventsBox events={data.events} />
        </aside>
      </div>
    </div>
  );
}

function GoalBanner({ data, compact }) {
  const { user, goal, daysLeft, examDate } = data;
  const first = user.displayName.split(' ')[0];
  return (
    <div className={`card relative overflow-hidden ${compact ? 'mb-6 p-5' : 'p-6'} bg-gradient-to-br from-brand-600 to-indigo-700 text-white`}>
      <div className="pointer-events-none absolute -right-10 -top-10 text-[180px] font-black leading-none text-white/5 select-none">∑</div>
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          {!compact && <p className="text-sm font-medium text-indigo-200">Hallo {first}!</p>}
          <div className="mt-1 flex items-center gap-2 text-indigo-100"><Target size={18} /> <span className="text-sm">Dein Ziel</span></div>
          <div className="text-2xl font-bold tracking-tight sm:text-3xl">{goal}</div>
        </div>
        {daysLeft != null && (
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20 backdrop-blur">
            <CalendarClock size={28} className="text-indigo-200" />
            <div>
              <div className="text-3xl font-extrabold tabular-nums leading-none">{Math.max(0, daysLeft)}</div>
              <div className="text-xs text-indigo-100">{daysLeft === 1 ? 'Tag' : 'Tage'} bis zur Prüfung{examDate && <> · {formatDate(examDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}</>}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiagnoseStart({ diagnose, first }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    await api.post('/student/diagnose/start');
    navigate('/diagnose');
  };
  const a = diagnose.active;
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/60"><ClipboardCheck size={32} /></div>
      <h1 className="text-2xl font-bold text-slate-900">{a ? `Weiter geht’s, ${first}!` : `Willkommen, ${first}!`}</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-600">
        {a
          ? 'Du hast den Einstiegstest schon angefangen. Mach einfach dort weiter, wo du aufgehört hast.'
          : 'Starte mit dem Einstiegstest. Er zeigt uns, wo du gerade stehst – danach bekommst du deinen persönlichen Lernplan.'}
      </p>
      {a && (
        <div className="mx-auto mt-5 max-w-xs">
          <ProgressBar value={(a.answered / Math.max(1, a.total)) * 100} />
          <div className="mt-1 text-xs text-slate-500">{a.answered} von {a.total} Aufgaben bearbeitet</div>
        </div>
      )}
      <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-slate-600">
        <li className="flex gap-2"><span className="text-brand-600">✓</span> Kein Zeitdruck – du kannst jederzeit pausieren.</li>
        <li className="flex gap-2"><span className="text-brand-600">✓</span> Es gibt keine Noten. Wenn du etwas nicht weißt, lass es einfach leer.</li>
        <li className="flex gap-2"><span className="text-brand-600">✓</span> Taschenrechner, Stift und Papier bereitlegen.</li>
      </ul>
      <button className="btn-primary mt-7 px-8 py-3 text-base" disabled={busy} onClick={a ? () => navigate('/diagnose') : start}>
        {a ? 'Test fortsetzen' : 'Einstiegstest starten'} <ArrowRight size={18} />
      </button>
    </div>
  );
}

function PlanCard({ item, index }) {
  const { topic, progress } = item;
  const c = colorOf(topic.color);
  const done = progress.total > 0 && progress.solved >= progress.total;
  return (
    <div className="card group flex flex-col gap-4 p-4 transition hover:border-slate-300 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative">
          <TopicIcon topic={topic} />
          <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white ring-2 ring-white">{index + 1}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/thema/${topic.id}`} className="truncate font-semibold text-slate-900 hover:text-brand-700">{topic.title}</Link>
            {index === 0 && !done && <span className="chip bg-amber-100 text-amber-800"><Sparkles size={12} /> Als Nächstes empfohlen</span>}
            {done && <span className="chip bg-emerald-100 text-emerald-700"><PartyPopper size={12} /> Geschafft</span>}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={progress.percent} color={topic.color} className="max-w-xs" />
            <span className={`whitespace-nowrap text-xs font-semibold tabular-nums ${c.text}`}>{progress.percent} %</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">{progress.solved} von {progress.total} Aufgaben gelöst</div>
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        {item.hasScript && <Link to={`/skript/${topic.id}`} className="btn-secondary flex-1 sm:flex-none"><BookOpen size={16} /> Skript</Link>}
        <Link to={`/thema/${topic.id}`} className="btn-primary flex-1 sm:flex-none"><Dumbbell size={16} /> Üben</Link>
      </div>
    </div>
  );
}

function FeedbackBox({ feedback, onRead }) {
  const [open, setOpen] = useState(null);
  const unread = feedback.filter((f) => !f.read_at);
  const show = async (f) => {
    setOpen(f);
    if (!f.read_at) {
      await api.post('/student/feedback/read', { ids: [f.id] });
      onRead();
    }
  };
  return (
    <div id="feedback" className="card scroll-mt-24 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><MessageSquareHeart size={18} className="text-rose-500" /> Feedback</h3>
        {unread.length > 0 && <span className="chip bg-rose-500 text-white">{unread.length} neu</span>}
      </div>
      {feedback.length === 0 ? (
        <Empty icon="Inbox" title="Noch kein Feedback">Hier siehst du Rückmeldungen deiner Lehrkraft.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {feedback.slice(0, 5).map((f) => (
            <li key={f.id}>
              <button onClick={() => show(f)} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-slate-50">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${f.read_at ? 'bg-slate-200' : 'bg-rose-500'}`} />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-slate-500">{f.topic_title || 'Allgemein'} · {formatDate(f.created_at)}</span>
                  <span className={`line-clamp-2 text-sm ${f.read_at ? 'text-slate-600' : 'font-medium text-slate-900'}`}>{f.text}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.topic_title ? `Feedback zu „${open.topic_title}“` : 'Feedback'}>
        <p className="whitespace-pre-wrap text-slate-700">{open?.text}</p>
        {open?.topic_id && (
          <div className="mt-5 flex justify-end">
            <Link to={`/thema/${open.topic_id}`} className="btn-primary">Zum Thema <ArrowRight size={16} /></Link>
          </div>
        )}
      </Modal>
    </div>
  );
}

function EventsBox({ events }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><CalendarClock size={18} className="text-brand-600" /> Nächste Termine</h3>
      </div>
      {events.length === 0 ? (
        <Empty icon="Inbox" title="Keine Termine geplant" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {events.map((e) => {
            const d = new Date(e.date + 'T12:00:00');
            return (
              <li key={e.id} className="flex gap-4 px-5 py-3">
                <div className="w-12 shrink-0 rounded-xl bg-brand-50 py-1.5 text-center text-brand-700">
                  <div className="text-[10px] font-semibold uppercase">{d.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                  <div className="text-lg font-bold leading-none">{d.getDate()}.</div>
                  <div className="text-[10px]">{d.toLocaleDateString('de-DE', { month: 'short' })}</div>
                </div>
                <div className="min-w-0 text-sm">
                  <div className="font-semibold text-slate-900">{e.title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                    {e.time && <span className="flex items-center gap-1"><Clock size={12} /> {e.time}</span>}
                    {e.room && <span className="flex items-center gap-1"><MapPin size={12} /> {e.room}</span>}
                  </div>
                  {e.note && <div className="mt-1 text-xs text-slate-500">{e.note}</div>}
                  {e.topic_id && <Link to={`/skript/${e.topic_id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"><BookOpen size={12} /> Vorher im Skript nachlesen</Link>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RetestCard({ diagnose }) {
  const navigate = useNavigate();
  const start = async () => {
    if (!diagnose.active) await api.post('/student/diagnose/start');
    navigate('/diagnose');
  };
  return (
    <div className="card flex flex-col items-start gap-4 border-brand-200 bg-brand-50/60 p-5 sm:flex-row sm:items-center">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><RotateCcw size={22} /></div>
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{diagnose.active ? 'Dein Test wartet auf dich' : 'Neuer Test freigeschaltet!'}</div>
        <div className="text-sm text-slate-600">Finde heraus, in welchen Themen du dich schon verbessert hast. Dein Lernplan bleibt dabei erhalten.</div>
      </div>
      <button className="btn-primary" onClick={start}>{diagnose.active ? 'Fortsetzen' : 'Test starten'} <ArrowRight size={16} /></button>
    </div>
  );
}

function RetestResult({ retest }) {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('retest-seen') === retest.finishedAt; } catch { return false; }
  });
  if (hidden) return null;
  const close = () => {
    try { localStorage.setItem('retest-seen', retest.finishedAt); } catch { /* egal */ }
    setHidden(true);
  };
  return (
    <div className="card border-emerald-200 bg-emerald-50/70 p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm"><TrendingUp size={22} /></div>
        <div className="flex-1">
          {retest.improved.length ? (
            <>
              <div className="font-semibold text-slate-900">Stark! In diesen Themen hast du dich verbessert:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {retest.improved.map((t) => (
                  <span key={t.id} className="chip bg-white py-1 pl-1 pr-3 text-slate-700 ring-1 ring-emerald-200"><TopicIcon topic={t} size="sm" /> {t.title}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="font-semibold text-slate-900">Danke fürs Mitmachen beim Test! Bleib dran – Übung macht den Unterschied.</div>
          )}
          <p className="mt-3 text-sm text-slate-600">Deine Lehrkraft sieht dein Ergebnis und kann dir bei Bedarf auch schwierigere Aufgaben freischalten.</p>
        </div>
        <button className="btn-ghost btn-sm" onClick={close}>Ausblenden</button>
      </div>
    </div>
  );
}
