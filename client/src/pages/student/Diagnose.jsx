import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pause, Send, SkipForward } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, MathContent, TopicIcon, ProgressBar, Modal } from '../../components/ui.jsx';
import AnswerInput, { isEmptyAnswer } from '../../components/AnswerInput.jsx';

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
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {topics.map((t, i) => {
          const its = items.filter((x) => x.topic.id === t.id);
          const complete = its.every((x) => answered[x.id]);
          const current = t.id === item.topic.id;
          return (
            <button
              key={t.id}
              title={t.title}
              onClick={() => setIdx(items.findIndex((x) => x.topic.id === t.id))}
              className={`h-1.5 min-w-6 flex-1 rounded-full transition ${current ? 'bg-brand-600' : complete ? 'bg-brand-200' : 'bg-slate-200'}`}
              aria-label={`Thema ${i + 1}: ${t.title}`}
            />
          );
        })}
      </div>

      <div key={item.id} className="card animate-pop overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <TopicIcon topic={item.topic} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-900">{item.topic.title}</div>
            <div className="text-xs text-slate-500">Thema {topicNo} von {topics.length} · Aufgabe {posInTopic} von {inTopic.length}</div>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <MathContent md={item.prompt} />
          <AnswerInput spec={item.spec} value={answers[item.id]} onChange={(v) => setAnswers((a) => ({ ...a, [item.id]: v }))} onSubmit={next} />
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
      <p className="mt-4 text-center text-xs text-slate-500">Du bekommst während des Tests keine Rückmeldung zu deinen Antworten – das ist so gewollt. 🙂</p>

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
