import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ClipboardCheck, ArrowRight, Target, CalendarClock, MessageSquareHeart, BookOpen, Dumbbell, Sparkles, Clock, MapPin, PartyPopper, TrendingUp, RotateCcw,
  Lock, GraduationCap, CheckCircle2, PlusCircle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TopicIcon, ProgressBar, formatDate, Empty, colorOf, Modal, toast } from '../../components/ui.jsx';

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
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
      {!compact && data.progress && <OverallProgress data={data} />}
    </div>
  );
}

// Gesamtfortschritt über den Lernplan + Nachtest und Prüfung (beide ab 50 % freigeschaltet).
function OverallProgress({ data }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { progress, milestone, nachtest, exam } = data;
  const mark = milestone.percent;

  const startNachtest = async () => {
    if (nachtest.active) return navigate('/diagnose');
    if (!nachtest.canStart) {
      if (nachtest.last) return navigate(`/nachtest/${nachtest.last.id}`);
      return toast(`Den Nachtest kannst du machen, sobald du ${mark} % deines Lernplans geschafft hast.`, 'info');
    }
    setBusy(true);
    try {
      await api.post('/student/diagnose/start');
      navigate('/diagnose');
    } finally {
      setBusy(false);
    }
  };
  const openExam = () => {
    if (exam.unlocked) return navigate('/pruefung');
    toast(milestone.reached ? 'Die Prüfungen werden freigeschaltet, sobald du den Nachtest gemacht hast.' : `Die Prüfungen werden ab ${mark} % und nach dem Nachtest freigeschaltet.`, 'info');
  };

  const nState = nachtest.active ? 'active' : nachtest.canStart ? 'open' : nachtest.last ? 'done' : 'locked';
  const nLabel = { active: 'Nachtest', open: 'Nachtest starten', done: 'Nachtest', locked: 'Nachtest' }[nState];
  const nSub = { active: 'weitermachen', open: 'Zeig, was du kannst!', done: 'Ergebnis ansehen', locked: `ab ${mark} %` }[nState];

  return (
    <div className="relative mt-6 flex flex-col gap-4 border-t border-white/15 pt-5 lg:flex-row lg:items-center lg:gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-indigo-100">Dein Gesamtfortschritt</span>
          <span className="text-2xl font-extrabold tabular-nums leading-none">{progress.percent} %</span>
        </div>
        <div className="relative">
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-3 rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-700" style={{ width: `${Math.min(100, progress.percent)}%` }} />
          </div>
          {/* Markierung: ab hier Nachtest und Prüfung */}
          <div className="absolute -top-1 h-5 w-0.5 rounded bg-white/80" style={{ left: `${mark}%` }} aria-hidden />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-indigo-100">
          <span>{progress.solved} von {progress.total} Aufgaben gelöst</span>
          <span>{milestone.reached ? <><CheckCircle2 size={12} className="mr-1 inline" />{mark} % erreicht: Nachtest freigeschaltet</> : `Noch ${Math.max(0, Math.ceil((progress.total * mark) / 100) - progress.solved)} Aufgaben bis zum Nachtest`}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:w-[400px] lg:shrink-0">
        <BannerButton icon={nState === 'locked' ? Lock : nState === 'done' ? TrendingUp : RotateCcw} label={nLabel} sub={nSub} locked={nState === 'locked'} highlight={nState === 'open' || nState === 'active'} disabled={busy} onClick={startNachtest} />
        <BannerButton icon={exam.unlocked ? GraduationCap : Lock} label="Prüfung" sub={exam.unlocked ? 'Originale üben' : milestone.reached ? 'nach dem Nachtest' : `ab ${mark} % + Nachtest`} locked={!exam.unlocked} onClick={openExam} />
      </div>
    </div>
  );
}

function BannerButton({ icon: Icon, label, sub, locked, highlight, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={locked}
      className={`flex min-h-16 items-center gap-2.5 rounded-2xl px-3 py-3 text-left sm:gap-3 sm:px-4 transition ${
        highlight ? 'bg-white text-brand-700 shadow-lg hover:bg-indigo-50' : locked ? 'cursor-not-allowed bg-white/5 text-indigo-200 ring-1 ring-white/15' : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25'
      }`}
    >
      <Icon size={22} className="shrink-0" />
      <span className="min-w-0">
        <span className="block font-semibold leading-tight">{label}</span>
        <span className={`block text-xs ${highlight ? 'text-brand-600/80' : 'text-indigo-200'}`}>{sub}</span>
      </span>
    </button>
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
          : 'Starte mit dem Einstiegstest. Er zeigt uns, wo du gerade stehst. Danach bekommst du deinen persönlichen Lernplan.'}
      </p>
      {a && (
        <div className="mx-auto mt-5 max-w-xs">
          <ProgressBar value={(a.answered / Math.max(1, a.total)) * 100} />
          <div className="mt-1 text-xs text-slate-500">{a.answered} von {a.total} Aufgaben bearbeitet</div>
        </div>
      )}
      <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-slate-600">
        <li className="flex gap-2"><span className="text-brand-600">✓</span> Kein Zeitdruck. Du kannst jederzeit pausieren.</li>
        <li className="flex gap-2"><span className="text-brand-600">✓</span> Es gibt keine Noten. Wenn du etwas nicht weißt, lass es einfach leer.</li>
        <li className="flex gap-2"><span className="text-brand-600">✓</span> Taschenrechner, Stift und Papier bereitlegen.</li>
      </ul>
      <button className="btn-primary mt-7 px-8 py-3 text-base" disabled={busy} onClick={a ? () => navigate('/diagnose') : start}>
        {a ? 'Test fortsetzen' : 'Einstiegstest starten'} <ArrowRight size={18} />
      </button>
      {!a && !diagnose.isRetest && (
        <div className="mt-4"><Link to="/start" className="text-sm font-medium text-slate-500 hover:text-brand-700">Themen, die dir leichtfallen, noch einmal ändern</Link></div>
      )}
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
          {item.extra && (
            <Link to={`/thema/${topic.id}#zusatz`} className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${item.extra.isNew ? 'bg-violet-50 text-violet-700 ring-violet-200' : 'bg-slate-50 text-slate-600 ring-slate-200'} hover:brightness-95`}>
              <PlusCircle size={13} /> {item.extra.isNew ? 'Neu: ' : ''}Zusatzübungen · {item.extra.solved}/{item.extra.total}
            </Link>
          )}
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
                  <span className="block text-xs font-medium text-slate-500">{f.topic_title || 'Allgemein'}{f.task ? ` · Aufgabe ${f.task.no}` : ''} · {formatDate(f.created_at)}</span>
                  <span className={`line-clamp-2 text-sm ${f.read_at ? 'text-slate-600' : 'font-medium text-slate-900'}`}>{f.text}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.topic_title ? `Feedback zu „${open.topic_title}“` : 'Feedback'}>
        <p className="whitespace-pre-wrap text-slate-700">{open?.text}</p>
        {open?.task && (
          <p className="mt-3 text-sm text-slate-500">Zu Aufgabe {open.task.no} im Übungspaket „{open.task.packageTitle}“</p>
        )}
        {(open?.task || open?.topic_id) && (
          <div className="mt-5 flex justify-end gap-2">
            {open.task && <Link to={`/ueben/${open.task.packageId}#aufgabe-${open.task.id}`} className="btn-primary">Zur Aufgabe <ArrowRight size={16} /></Link>}
            {open.topic_id && <Link to={`/thema/${open.topic_id}`} className={open.task ? 'btn-secondary' : 'btn-primary'}>Zum Thema <ArrowRight size={16} /></Link>}
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm"><TrendingUp size={22} /></div>
        <div className="min-w-0 flex-1">
          {retest.improved.length ? (
            <>
              <div className="font-semibold text-slate-900">Stark! Im Nachtest hast du dich in {retest.improved.length === 1 ? 'einem Thema' : `${retest.improved.length} Themen`} verbessert:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {retest.improved.map((t) => (
                  <span key={t.id} className="chip gap-2 bg-white py-1 pl-1 pr-3 text-sm text-slate-700 shadow-sm ring-1 ring-emerald-200"><TopicIcon topic={t} size="xs" /> {t.title}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="font-semibold text-slate-900">Danke fürs Mitmachen beim Nachtest! Bleib dran, denn Übung macht den Unterschied.</div>
          )}
          {retest.extraTopics.length > 0 && (
            <p className="mt-3 text-sm text-slate-700">
              <PlusCircle size={14} className="mr-1 inline text-violet-600" />
              Für {retest.extraTopics.map((t) => t.title).join(', ')} hast du <b>neue Zusatzübungen</b> bekommen. Dein Fortschritt bleibt dabei, wie er ist.
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link to={`/nachtest/${retest.runId}`} className="btn-primary btn-sm">Ergebnis ansehen <ArrowRight size={14} /></Link>
          <button className="btn-ghost btn-sm" onClick={close}>Ausblenden</button>
        </div>
      </div>
    </div>
  );
}
