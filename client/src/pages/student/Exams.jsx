import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Lock, CheckCircle2, Circle, Clock, Calculator, BookOpenText, Ruler, Ban, ArrowRight, FileText, ListChecks, PenLine, Timer, MessageSquareOff, PlayCircle, History,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Modal, formatDate } from '../../components/ui.jsx';
import { fmtPts } from '../../components/ExamReview.jsx';

export const FORMELSAMMLUNG = '/formelsammlung-hs-rs.pdf';

// Prüfungen: erst die Hinweise zum Ablauf, dann die Auswahl einer Prüfung.
export default function Exams() {
  const { data, error, loading } = useLoad(() => api.get('/student/pruefung'));
  const [step, setStep] = useState('info');
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { unlocked, progress, milestone, nachtestDone, timing, choose, exams, active } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">← Zurück zur Startseite</Link>
      <div className="card flex items-center gap-4 p-6">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><GraduationCap size={28} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prüfungen üben</h1>
          <p className="text-sm text-slate-500">Rechne originale Abschlussprüfungen durch, so wie am Prüfungstag: mit Zeit und ohne Hilfe.</p>
        </div>
      </div>

      {!unlocked ? (
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><Lock size={18} className="text-slate-400" /> Noch nicht freigeschaltet</div>
          <ul className="space-y-2 text-sm">
            <Step done={milestone.reached}>Mindestens {milestone.percent} % deines Lernplans geschafft (gerade: {progress.percent} %)</Step>
            <Step done={nachtestDone}>Nachtest gemacht</Step>
          </ul>
        </div>
      ) : (
        <>
          {active && (
            <Link to={`/pruefung/durchlauf/${active.id}`} className="card flex items-center gap-4 border-amber-200 bg-amber-50/70 p-5 hover:bg-amber-50">
              <PlayCircle size={28} className="shrink-0 text-amber-600" />
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Du hast „{active.title}“ angefangen</div>
                <div className="text-sm text-slate-600">{active.section === 'between' ? 'Hauptteil 1 ist abgegeben. Weiter geht’s mit Hauptteil 2 und dem Wahlteil.' : 'Deine Antworten sind gespeichert. Mach dort weiter, wo du aufgehört hast.'}</div>
              </div>
              <span className="btn-primary">Fortsetzen <ArrowRight size={16} /></span>
            </Link>
          )}
          {step === 'info' ? <ExamInfo timing={timing} choose={choose} onNext={() => setStep('choose')} /> : <ExamList exams={exams} timing={timing} active={active} onBack={() => setStep('info')} />}
        </>
      )}
    </div>
  );
}

// Hinweise zur Abschlussprüfung (Niedersachsen, Schuljahrgang 10)
function ExamInfo({ timing, choose, onNext }) {
  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">So läuft die Abschlussprüfung ab</h2>
          <p className="text-sm text-slate-500">Mathematik, Schuljahrgang 10: <b>{timing.teil1 + timing.teil2} Minuten</b> Bearbeitungszeit + <b>{timing.choose} Minuten</b> Auswahlzeit</p>
        </div>
        <ol className="relative space-y-0 px-6 py-5">
          <Phase n={1} title="Hauptteil 1" time={`höchstens ${timing.teil1} min`} tone="rose">
            <p><b>Ohne Hilfsmittel:</b> kein Taschenrechner, keine Formelsammlung. Geprüft werden Grundlagen wie Rechnen, Brüche, Prozente, Einheiten, Winkel, Flächen und Wahrscheinlichkeiten.</p>
            <p className="text-slate-500">Wer früher abgibt, hat die gesparte Zeit zusätzlich für Hauptteil 2 und den Wahlteil.</p>
          </Phase>
          <Phase n={2} title="Ausgabe der Hilfsmittel" tone="slate">
            <p>Jetzt bekommst du <b>Taschenrechner</b> und <b>Formelsammlung</b>, dazu Hauptteil 2 und den Wahlteil.</p>
          </Phase>
          <Phase n={3} title="Auswahl im Wahlteil" time={`${timing.choose} min`} tone="amber">
            <p>Der Wahlteil hat <b>4 Wahlaufgaben</b>. Du suchst dir <b>{choose}</b> davon aus. Nur diese werden gewertet.</p>
          </Phase>
          <Phase n={4} title="Hauptteil 2 und zwei Wahlaufgaben" time={`${timing.teil2} min (+ Restzeit aus Hauptteil 1)`} tone="brand" last>
            <p>Mit Taschenrechner und Formelsammlung. Schreibe deinen <b>Lösungsweg nachvollziehbar</b> auf, mit Antwortsatz und Begründung, wo es verlangt ist.</p>
          </Phase>
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Ruler size={18} className="text-brand-600" /> Arbeitsmittel (immer erlaubt)</h3>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• Kariertes Papier mit Rand</li>
            <li>• Geodreieck, Parabelschablone, Zirkel, Bleistift</li>
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Calculator size={18} className="text-brand-600" /> Hilfsmittel (erst ab Hauptteil 2)</h3>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• Taschenrechner (nicht grafikfähig, nicht programmierbar)</li>
            <li>• Formelsammlung: <a href={FORMELSAMMLUNG} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">als PDF ansehen</a></li>
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><ListChecks size={18} className="text-brand-600" /> So funktioniert das Üben hier</h3>
        <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <li className="flex gap-2"><Timer size={16} className="mt-0.5 shrink-0 text-slate-400" /> Oben läuft ein Timer mit. Ist die Zeit um, bekommst du einen Hinweis und kannst in Ruhe zum Ende kommen.</li>
          <li className="flex gap-2"><Ban size={16} className="mt-0.5 shrink-0 text-slate-400" /> Während der Prüfung siehst du nicht, ob eine Antwort richtig ist, genau wie in echt.</li>
          <li className="flex gap-2"><MessageSquareOff size={16} className="mt-0.5 shrink-0 text-slate-400" /> Der Hilfe-Chat ist während der Prüfung ausgeschaltet.</li>
          <li className="flex gap-2"><PenLine size={16} className="mt-0.5 shrink-0 text-slate-400" /> Rechenwege, Zeichnungen und Begründungen machst du auf Papier. Ergebnisse trägst du hier ein.</li>
          <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-slate-400" /> Nach der Abgabe siehst du sofort deine Punkte. Aufgaben auf Papier vergleichst du mit der Musterlösung und schätzt dich selbst ein.</li>
          <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-slate-400" /> Deine Eingaben werden automatisch gespeichert. Du kannst auch nur einen Teil üben.</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary px-6 py-3 text-base" onClick={onNext}>Ich möchte eine Prüfung durchführen <ArrowRight size={18} /></button>
      </div>
    </div>
  );
}

function Phase({ n, title, time, tone, last, children }) {
  const tones = { rose: 'bg-rose-500', slate: 'bg-slate-400', amber: 'bg-amber-500', brand: 'bg-brand-600' };
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last && <span className="absolute left-4 top-9 h-[calc(100%-2rem)] w-0.5 bg-slate-200" aria-hidden />}
      <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${tones[tone]}`}>{n}</span>
      <div className="min-w-0 flex-1 space-y-1 text-sm text-slate-700">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-semibold text-slate-900">{title}</span>
          {time && <span className="chip bg-slate-100 text-slate-600"><Clock size={12} /> {time}</span>}
        </div>
        {children}
      </div>
    </li>
  );
}

function ExamList({ exams, timing, active, onBack }) {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null); // { exam, section }
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/student/pruefung/${confirm.exam.key}/start`, { section: confirm.section });
      navigate(`/pruefung/durchlauf/${r.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Wähle eine Prüfung</h2>
        <button className="btn-ghost btn-sm" onClick={onBack}>Ablauf noch einmal ansehen</button>
      </div>
      {exams.length === 0 && <div className="card p-6 text-sm text-slate-600">Für deinen Abschluss gibt es hier noch keine Prüfung. Deine Lehrkraft stellt bald eine bereit.</div>}
      {exams.map((e) => (
        <div key={e.key} className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-6 py-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-lg font-extrabold text-white">{String(e.year).slice(2)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-slate-900">{e.title}</div>
              <div className="text-sm text-slate-500">{e.subtitle}{e.date && ` · Prüfungstag ${e.date}`} · {e.max} Punkte</div>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <StartOption
              title="Hauptteil 1"
              text={`${timing.teil1} Minuten · ohne Hilfsmittel · ${e.maxTeil1} Punkte. Danach geht es direkt mit Hauptteil 2 weiter.`}
              icon={Ban}
              disabled={!!active}
              onClick={() => setConfirm({ exam: e, section: 'teil1' })}
            />
            <StartOption
              title="Hauptteil 2 und Wahlteil"
              text={`${timing.teil2 + timing.choose} Minuten · mit Taschenrechner und Formelsammlung · ${e.maxTeil2} Punkte (2 von ${e.wahl} Wahlaufgaben)`}
              icon={Calculator}
              disabled={!!active}
              onClick={() => setConfirm({ exam: e, section: 'teil2' })}
            />
          </div>
          {active && <p className="px-6 pb-4 text-xs text-slate-500">Beende zuerst die angefangene Prüfung, bevor du eine neue startest.</p>}
          {e.attempts.filter((a) => a.status === 'done').length > 0 && (
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><History size={13} /> Deine Durchläufe</div>
              <ul className="divide-y divide-slate-100">
                {e.attempts.filter((a) => a.status === 'done').map((a) => (
                  <li key={a.id}>
                    <Link to={`/pruefung/ergebnis/${a.id}`} className="flex flex-wrap items-center gap-3 py-2 text-sm hover:text-brand-700">
                      <FileText size={15} className="text-slate-400" />
                      <span className="font-medium">{formatDate(a.finishedAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      <span className="text-slate-500">{a.sections.length === 2 ? 'komplett' : a.sections[0] === 'teil1' ? 'nur Hauptteil 1' : 'Hauptteil 2 + Wahlteil'}</span>
                      <span className="ml-auto font-semibold tabular-nums">{fmtPts(a.total)} / {a.max} Punkte</span>
                      {a.selfOpen > 0 && <span className="chip bg-amber-100 text-amber-800">{a.selfOpen} selbst einschätzen</span>}
                      <ArrowRight size={14} className="text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="border-t border-slate-100 px-6 py-3 text-[11px] text-slate-400">{e.source}</p>
        </div>
      ))}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.section === 'teil1' ? 'Hauptteil 1 starten?' : 'Hauptteil 2 und Wahlteil starten?'}>
        {confirm?.section === 'teil1' ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="flex gap-2"><Clock size={18} className="shrink-0 text-brand-600" /> Du hast <b>{timing.teil1} Minuten</b> Zeit. Der Timer startet sofort.</p>
            <p className="flex gap-2"><Ban size={18} className="shrink-0 text-rose-500" /> <span><b>Ohne Hilfsmittel</b>: Leg Taschenrechner und Formelsammlung weg.</span></p>
            <p className="flex gap-2"><PenLine size={18} className="shrink-0 text-slate-400" /> Leg Papier, Stift, Geodreieck und Zirkel bereit.</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="flex gap-2"><Clock size={18} className="shrink-0 text-brand-600" /> Du hast <b>{timing.teil2 + timing.choose} Minuten</b> Zeit ({timing.teil2} min + {timing.choose} min Auswahlzeit). Der Timer startet sofort.</p>
            <p className="flex gap-2"><Calculator size={18} className="shrink-0 text-emerald-600" /> <span>Taschenrechner und <a href={FORMELSAMMLUNG} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">Formelsammlung</a> sind erlaubt.</span></p>
            <p className="flex gap-2"><BookOpenText size={18} className="shrink-0 text-amber-600" /> Bearbeite Hauptteil 2 und <b>zwei</b> der vier Wahlaufgaben. Welche gewertet werden, legst du bei der Abgabe fest.</p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirm(null)}>Abbrechen</button>
          <button className="btn-primary" disabled={busy} onClick={start}>Los geht’s <ArrowRight size={16} /></button>
        </div>
      </Modal>
    </div>
  );
}

function StartOption({ title, text, icon: Icon, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} className="group flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition enabled:hover:border-brand-300 enabled:hover:bg-brand-50/40 disabled:opacity-50">
      <Icon size={22} className="mt-0.5 shrink-0 text-brand-600" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{text}</div>
      </div>
      <ArrowRight size={18} className="mt-1 shrink-0 text-slate-400 transition group-enabled:group-hover:translate-x-0.5" />
    </button>
  );
}

function Step({ done, children }) {
  return (
    <li className={`flex items-center gap-2 ${done ? 'text-emerald-700' : 'text-slate-600'}`}>
      {done ? <CheckCircle2 size={18} className="shrink-0 text-emerald-500" /> : <Circle size={18} className="shrink-0 text-slate-300" />}
      {children}
    </li>
  );
}
