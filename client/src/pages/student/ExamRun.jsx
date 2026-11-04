import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlarmClock, ArrowRight, Ban, Calculator, Check, CheckCircle2, Clock, FileText, PenLine, Send, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Modal, TaskContext, toast } from '../../components/ui.jsx';
import { TaskBody, isEmptyAnswer } from '../../components/AnswerInput.jsx';
import { useAutosave } from '../../lib/autosave.js';
import { FORMELSAMMLUNG } from './Exams.jsx';

const pad = (n) => String(n).padStart(2, '0');
function clock(ms) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600);
  return h ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

// Prüfung unter Prüfungsbedingungen: alle Aufgaben eines Abschnitts untereinander, Timer oben, keine Rückmeldung.
export default function ExamRun() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => api.get(`/student/pruefung/attempts/${id}`), [id]);
  useEffect(() => {
    if (data?.attempt?.status === 'done') navigate(`/pruefung/ergebnis/${id}`, { replace: true });
  }, [data, id, navigate]);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  if (data.attempt.status === 'done') return <PageLoader />;
  if (data.between) return <Between data={data} onChanged={reload} />;
  return <Running key={data.section.key} data={data} onChanged={reload} />;
}

function Running({ data, onChanged }) {
  const navigate = useNavigate();
  const { section, parts, attempt } = data;
  const [answers, setAnswers] = useState(data.answers || {});
  const [choice, setChoice] = useState(data.choice || []);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(true);
  const [warned, setWarned] = useState(false);
  const dirty = useRef({});
  const hasWahl = parts.some((p) => p.key === 'wahl');

  // Zeit: Abstand zwischen Server- und Geräteuhr ausgleichen
  const offset = useMemo(() => data.section.serverNow - Date.now(), [data]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const h = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(h); }, []);
  const left = section.startedAt + section.limitMs - (now + offset);
  const over = left <= 0;
  useEffect(() => { if (over && !warned) setWarned(true); }, [over, warned]);

  const autosave = useAutosave((payload, keepalive) => Promise.all(Object.entries(payload).map(([itemId, answer]) =>
    api.put(`/student/pruefung/attempts/${attempt.id}/answers`, { itemId, answer }, { keepalive }).then(() => {
      if (dirty.current[itemId] === answer) delete dirty.current[itemId];
    }),
  )).then(() => setSaved(Object.keys(dirty.current).length === 0)), 700);

  const specs = useMemo(() => Object.fromEntries(parts.flatMap((p) => p.groups.flatMap((g) => g.items.map((i) => [i.id, i.spec])))), [parts]);
  const change = (itemId) => (v) => {
    setAnswers((a) => ({ ...a, [itemId]: v }));
    dirty.current[itemId] = isEmptyAnswer(specs[itemId], v) ? null : v;
    setSaved(false);
    autosave.schedule({ ...dirty.current });
  };

  const toggleChoice = async (no) => {
    const next = choice.includes(no) ? choice.filter((x) => x !== no) : [...choice, no].slice(-data.choose).sort();
    setChoice(next);
    await api.put(`/student/pruefung/attempts/${attempt.id}/choice`, { choice: next });
  };

  const answeredIn = (g) => g.items.filter((i) => !isEmptyAnswer(i.spec, answers[i.id])).length;
  const allItems = parts.flatMap((p) => p.groups.flatMap((g) => g.items));
  const open = allItems.filter((i) => !i.paper && isEmptyAnswer(i.spec, answers[i.id])).length;

  const submit = async () => {
    setBusy(true);
    try {
      await autosave.flush();
      const r = await api.post(`/student/pruefung/attempts/${attempt.id}/submit`, { choice });
      if (r.next === 'done') navigate(`/pruefung/ergebnis/${attempt.id}`, { replace: true });
      else { setConfirm(false); onChanged(); window.scrollTo(0, 0); }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const abort = async () => {
    if (!confirm_('Prüfung wirklich abbrechen? Deine Antworten in diesem Durchlauf werden gelöscht.')) return;
    autosave.cancel();
    await api.del(`/student/pruefung/attempts/${attempt.id}`);
    navigate('/pruefung', { replace: true });
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Kopfzeile mit Timer */}
      <div className="sticky top-16 z-30 -mx-3 mb-6 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5 sm:shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold uppercase tracking-wider text-brand-600">{data.exam.title}</div>
            <div className="truncate font-bold text-slate-900">{section.title}</div>
          </div>
          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${over ? 'bg-rose-100 text-rose-700' : left < 5 * 60e3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`} aria-live="polite">
            {over ? <AlarmClock size={18} /> : <Clock size={18} />}
            {over ? `+${clock(-left)}` : clock(left)}
          </div>
          <button className="btn-primary" onClick={() => setConfirm(true)}><Send size={16} /> Abgeben</button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {section.aids
            ? <span className="flex items-center gap-1 text-emerald-700"><Calculator size={13} /> Taschenrechner und <a href={FORMELSAMMLUNG} target="_blank" rel="noreferrer" className="font-semibold underline">Formelsammlung (PDF)</a> erlaubt</span>
            : <span className="flex items-center gap-1 text-rose-700"><Ban size={13} /> Ohne Hilfsmittel</span>}
          <span>{saved ? '✓ Alles gespeichert' : 'Wird gespeichert …'}</span>
          <button className="ml-auto text-slate-400 hover:text-rose-600" onClick={abort}>Prüfung abbrechen</button>
        </div>
      </div>

      {warned && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900">
          <AlarmClock size={22} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-semibold">Die Zeit ist abgelaufen.</div>
            <div className="text-sm">Komm langsam zum Ende und gib dann ab. In der echten Prüfung würden jetzt die Blätter eingesammelt.</div>
          </div>
          <button className="btn-ghost btn-sm" onClick={() => setWarned(false)} aria-label="Hinweis schließen"><X size={16} /></button>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <PenLine size={15} className="mr-1.5 inline text-slate-400" />
        Rechenwege, Zeichnungen und Begründungen schreibst du auf dein Papier. Ergebnisse trägst du hier ein. Ob sie stimmen, siehst du erst nach der Abgabe.
      </div>

      <div className="space-y-10">
        {parts.map((p) => (
          <section key={p.key}>
            <h2 className="mb-1 text-xl font-bold text-slate-900">{p.title}</h2>
            {p.key === 'wahl' && (
              <p className="mb-4 text-sm text-slate-600">Bearbeite <b>{data.choose} der 4 Wahlaufgaben</b>. Markiere die beiden, die gewertet werden sollen. Du kannst das bis zur Abgabe ändern.</p>
            )}
            <div className="space-y-5">
              {p.groups.map((g) => (
                <ExamGroup
                  key={g.no}
                  g={g}
                  wahl={p.key === 'wahl'}
                  chosen={choice.includes(g.no)}
                  onChoose={() => toggleChoice(g.no)}
                  answers={answers}
                  change={change}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <button className="btn-primary px-6 py-3 text-base" onClick={() => setConfirm(true)}><Send size={18} /> {section.key === 'teil1' ? 'Hauptteil 1 abgeben' : 'Prüfung abgeben'}</button>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={section.key === 'teil1' ? 'Hauptteil 1 abgeben?' : 'Prüfung abgeben?'}>
        <div className="space-y-4 text-sm text-slate-700">
          <p>Nach der Abgabe kannst du in {section.key === 'teil1' ? 'Hauptteil 1' : 'diesem Teil'} nichts mehr ändern.{open > 0 && <> Es sind noch <b>{open} Eingabefelder</b> leer.</>}</p>
          {hasWahl && (
            <div>
              <div className="mb-2 font-semibold text-slate-900">Welche {data.choose} Wahlaufgaben sollen gewertet werden?</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {parts.find((p) => p.key === 'wahl').groups.map((g) => {
                  const on = choice.includes(g.no);
                  return (
                    <button key={g.no} type="button" onClick={() => toggleChoice(g.no)} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${on ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>{on && <Check size={12} strokeWidth={3} />}</span>
                      <span className="flex-1"><span className="block font-semibold text-slate-900">Wahlaufgabe {g.no}</span><span className="text-xs text-slate-500">{answeredIn(g)} von {g.items.length} Teilaufgaben mit Eingabe</span></span>
                    </button>
                  );
                })}
              </div>
              {choice.length !== data.choose && <p className="mt-2 text-xs font-medium text-amber-700">Wähle genau {data.choose} Wahlaufgaben aus.</p>}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirm(false)}>Weiterarbeiten</button>
          <button className="btn-primary" disabled={busy || (hasWahl && choice.length !== data.choose)} onClick={submit}><Send size={16} /> Abgeben</button>
        </div>
      </Modal>
    </div>
  );
}

const confirm_ = (msg) => window.confirm(msg);

function ExamGroup({ g, wahl, chosen, onChoose, answers, change }) {
  return (
    <div id={`aufgabe-${wahl ? 'w' : ''}${g.no}`} className={`card scroll-mt-40 overflow-hidden ${wahl && chosen ? 'border-brand-300 ring-4 ring-brand-500/10' : ''}`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <span className="font-bold text-slate-900">{wahl ? `Wahlaufgabe ${g.no}` : `Aufgabe ${g.no}`}</span>
        <span className="text-xs text-slate-500">{g.points} Punkte</span>
        {wahl && (
          <button type="button" onClick={onChoose} className={`ml-auto inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${chosen ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-300'}`}>
            {chosen ? <CheckCircle2 size={14} /> : <span className="h-3.5 w-3.5 rounded border-2 border-slate-300" />} {chosen ? 'wird gewertet' : 'werten'}
          </button>
        )}
      </div>
      <div className="space-y-6 p-5">
        <TaskContext md={g.context} />
        {g.items.map((it) => (
          <div key={it.id} className="space-y-3">
            <div className="flex items-center gap-2">
              {it.label && <span className="font-bold text-slate-900">{it.label}</span>}
              <span className="text-xs text-slate-400">[{it.points} {it.points === 1 ? 'Punkt' : 'Punkte'}]</span>
              {it.paper && (
                <span className="chip bg-sky-50 text-sky-700 ring-1 ring-sky-200"><PenLine size={12} /> {it.spec.type === 'free' ? 'auf Papier' : `${it.selfLabel || 'Teil'} auf Papier`}</span>
              )}
            </div>
            <TaskBody prompt={it.prompt} spec={it.spec} value={answers[it.id] ?? null} onChange={change(it.id)} />
            {it.spec.type === 'free' && <p className="text-xs text-slate-400">Das Textfeld ist freiwillig, zum Beispiel für Notizen. Bewertet wird nach der Abgabe mit der Musterlösung.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Zwischen Hauptteil 1 und Hauptteil 2: Hilfsmittel werden „ausgegeben“
function Between({ data, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { attempt, timing } = data;
  const used = attempt.durations.teil1 || 0;
  const bonus = Math.max(0, Math.floor((timing.teil1 * 60e3 - used) / 60e3));
  const go = async () => {
    setBusy(true);
    await api.post(`/student/pruefung/attempts/${attempt.id}/continue`);
    onChanged();
  };
  const stop = async () => {
    setBusy(true);
    await api.post(`/student/pruefung/attempts/${attempt.id}/finish`);
    navigate(`/pruefung/ergebnis/${attempt.id}`, { replace: true });
  };
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 bg-emerald-50 px-6 py-4 text-emerald-800">
          <CheckCircle2 size={24} /> <span className="font-semibold">Hauptteil 1 ist abgegeben.</span>
        </div>
        <div className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Jetzt: Hauptteil 2 und Wahlteil</h1>
            <p className="mt-1 text-slate-600">In der echten Prüfung werden jetzt die Hilfsmittel ausgeteilt.</p>
          </div>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3"><Calculator size={20} className="shrink-0 text-emerald-600" /> <span>Ab jetzt darfst du deinen <b>Taschenrechner</b> benutzen.</span></li>
            <li className="flex gap-3"><FileText size={20} className="shrink-0 text-emerald-600" /> <span>Du darfst die <b>Formelsammlung</b> benutzen: <a href={FORMELSAMMLUNG} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">Formelsammlung als PDF öffnen</a></span></li>
            <li className="flex gap-3"><Clock size={20} className="shrink-0 text-brand-600" /> <span>Du hast <b>{timing.teil2 + timing.choose + bonus} Minuten</b>: {timing.teil2} min Bearbeitungszeit + {timing.choose} min Auswahlzeit{bonus > 0 && <> + {bonus} min, die du in Hauptteil 1 gespart hast</>}.</span></li>
            <li className="flex gap-3"><PenLine size={20} className="shrink-0 text-amber-600" /> <span>Bearbeite Hauptteil 2 und <b>zwei der vier Wahlaufgaben</b>. Welche gewertet werden, wählst du bei der Abgabe.</span></li>
          </ul>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button className="btn-secondary" disabled={busy} onClick={stop}>Hier aufhören und Hauptteil 1 auswerten</button>
            <button className="btn-primary" disabled={busy} onClick={go}>Hauptteil 2 starten <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
