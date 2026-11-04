import { Link } from 'react-router-dom';
import { GraduationCap, Lock, FileText, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Empty } from '../../components/ui.jsx';

// Originale Abschlussprüfungen. Freigeschaltet ab 50 % Lernplan-Fortschritt und nach dem Nachtest.
export default function Exams() {
  const { data, error, loading } = useLoad(() => api.get('/student/exams'));
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const { unlocked, progress, milestone, nachtestDone, exams } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">← Zurück zur Startseite</Link>
      <div className="card flex items-center gap-4 p-6">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><GraduationCap size={28} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prüfungen üben</h1>
          <p className="text-sm text-slate-500">Rechne originale Abschlussprüfungen durch, so wie sie am Prüfungstag aussehen.</p>
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
      ) : exams.length === 0 ? (
        <div className="card">
          <Empty icon="Inbox" title="Die Prüfungen kommen bald">Deine Lehrkraft stellt hier in Kürze originale Abschlussprüfungen für dich bereit.</Empty>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {exams.map((e) => (
            <div key={e.id} className="card flex flex-col p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-900"><FileText size={18} className="text-brand-600" /> {e.title}</div>
              {e.description && <p className="mt-1 text-sm text-slate-500">{e.description}</p>}
              <div className="mt-3 text-xs text-slate-500">{e.tasks} Aufgaben</div>
            </div>
          ))}
        </div>
      )}
    </div>
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
