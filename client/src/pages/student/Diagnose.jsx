import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ArrowRight, Pause, Send, SkipForward } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, TaskContext, TopicIcon, ProgressBar, Modal } from '../../components/ui.jsx';
import { TaskBody, isEmptyAnswer } from '../../components/AnswerInput.jsx';

export default function Diagnose() {
  const navigate = useNavigate();
  const { data, error, loading } = useLoad(() => api.get('/student/diagnose'));
  const [idx, setIdx] = useState(null);
  const [answers, setAnswers] = useState({});
  const [answered, setAnswered] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => {
    if (!data?.items) return;
    const a = {}, d = {};
    data.items.forEach((it) => { a[it.id] = it.answer; d[it.id] = it.answered; });
    setAnswers(a);
    setAnswered(d);
    const firstOpen = data.items.findIndex((it) => !it.answered);
    setIdx(firstOpen === -1 ? data.items.length - 1 : firstOpen);
  }, [data]);

  useEffect(() => { started.current = Date.now(); }, [idx]);

  const topics = useMemo(() => {
    if (!data?.items) return [];
    const out = [];
    for (const it of data.items) if (!out.find((t) => t.id === it.topic.id)) out.push(it.topic);
    return out;
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  if (!data.run) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="text-slate-600">Gerade läuft kein Test.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>Zur Startseite</button>
      </div>
    );
  }
  if (idx === null) return <PageLoader />;

  const items = data.items;
  const item = items[idx];
  const topicNo = topics.findIndex((t) => t.id === item.topic.id) + 1;
  const inTopic = items.filter((i) => i.topic.id === item.topic.id);
  const posInTopic = inTopic.findIndex((i) => i.id === item.id) + 1;
  const doneCount = Object.values(answered).filter(Boolean).length;

  const save = async () => {
    const value = answers[item.id];
    await api.post(`/student/diagnose/items/${item.id}`, { answer: isEmptyAnswer(item.spec, value) ? null : value, time_ms: Date.now() - started.current });
    setAnswered((a) => ({ ...a, [item.id]: true }));
  };

  const next = async () => {
    setBusy(true);
    try {
      await save();
      if (idx < items.length - 1) setIdx(idx + 1);
      else setConfirm(true);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    const result = await api.post('/student/diagnose/finish');
    navigate('/auswertung', { state: result, replace: true });
  };

  const openCount = items.length - Object.values({ ...answered }).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">{data.run.retest ? 'Wiederholungstest' : 'Einstiegstest'}</div>
          <div className="text-sm text-slate-500">{doneCount} von {items.length} Aufgaben bearbeitet</div>
        </div>
        <button className="btn-secondary btn-sm" onClick={() => navigate('/')}><Pause size={14} /> Pause – später weitermachen</button>
      </div>
      <ProgressBar value={(doneCount / items.length) * 100} height="h-2.5" className="mb-6" />

      {/* Themen-Leiste */}
      <div className="mb-5 flex gap-2 overflow-x-auto p-1">
        {topics.map((t, i) => {
          const its = items.filter((x) => x.topic.id === t.id);
          const complete = its.every((x) => answered[x.id]);
          const current = t.id === item.topic.id;
          return (
            <button
              key={t.id}
              title={t.title}
              onClick={() => setIdx(items.findIndex((x) => x.topic.id === t.id))}
              className={`flex min-w-16 flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 transition ${current ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10' : complete ? 'border-brand-200 bg-brand-50/50 hover:bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              aria-label={`Thema ${i + 1}: ${t.title}`}
              aria-current={current}
            >
              <TopicIcon topic={t} size="sm" />
              <span className="max-w-full truncate text-[11px] font-medium leading-tight text-slate-600">{t.title}</span>
            </button>
          );
        })}
      </div>

      <div key={item.id} className="card animate-soft overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <TopicIcon topic={item.topic} size="sm" />
          <div className="min-w-48 flex-1">
            <div className="truncate font-semibold text-slate-900">{item.topic.title}</div>
            <div className="text-xs text-slate-500">Thema {topicNo} von {topics.length} · Aufgabe {posInTopic} von {inTopic.length}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {inTopic.map((x, n) => {
              const cur = x.id === item.id;
              const done = answered[x.id];
              return (
                <button
                  key={x.id}
                  onClick={() => setIdx(items.findIndex((y) => y.id === x.id))}
                  aria-label={`Aufgabe ${n + 1}${done ? ' (bearbeitet)' : ' (offen)'}`}
                  aria-current={cur}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${cur ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : done ? 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200' : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700'}`}
                >
                  {done && !cur && <Check size={12} strokeWidth={3} />}
                  <span><span className="hidden sm:inline">Aufgabe </span>{n + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-6 p-6">
          <TaskContext md={item.context} />
          <TaskBody prompt={item.prompt} spec={item.spec} value={answers[item.id]} onChange={(v) => setAnswers((a) => ({ ...a, [item.id]: v }))} onSubmit={next} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <button className="btn-ghost" disabled={idx === 0 || busy} onClick={() => setIdx(idx - 1)}><ArrowLeft size={16} /> Zurück</button>
          <div className="flex gap-2">
            {isEmptyAnswer(item.spec, answers[item.id]) ? (
              <button className="btn-secondary" disabled={busy} onClick={next}><SkipForward size={16} /> Weiß ich (noch) nicht</button>
            ) : (
              <button className="btn-primary" disabled={busy} onClick={next}>{idx === items.length - 1 ? 'Fertig' : 'Weiter'} <ArrowRight size={16} /></button>
            )}
          </div>
        </div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Test abgeben?">
        <p className="text-slate-600">
          {openCount > 0
            ? `Du hast noch ${openCount} Aufgabe${openCount === 1 ? '' : 'n'} ohne Antwort. Du kannst zurückgehen oder den Test jetzt abgeben.`
            : 'Du hast alle Aufgaben bearbeitet. Super!'}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirm(false)}>Noch einmal ansehen</button>
          <button className="btn-primary" disabled={busy} onClick={finish}><Send size={16} /> Abgeben</button>
        </div>
      </Modal>
    </div>
  );
}
