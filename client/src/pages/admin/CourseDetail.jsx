import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserPlus, KeyRound, Pencil, Unlock, Printer, Trash2, ChevronRight } from 'lucide-react';
import { PROFILES, LEVELS } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Modal, toast, Empty, ProgressBar, formatDate } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.get(`/admin/courses/${id}`), api.get('/admin/courses')]), [id]);
  const [adding, setAdding] = useState(false);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const [{ course, students }, courses] = data;

  const unlockAll = async () => {
    if (!confirm('Den Diagnosetest für alle Kinder dieses Kurses (erneut) freigeben? Die Lernpläne bleiben erhalten.')) return;
    await api.post(`/admin/courses/${course.id}/unlock-diagnose`);
    toast('Test für den Kurs freigegeben');
    reload();
  };

  return (
    <div className="max-w-7xl">
      <PageHeader title={course.name} subtitle={course.description} back={{ to: '/admin/kurse', label: 'Kurse' }}>
        <button className="btn-secondary" onClick={unlockAll}><Unlock size={16} /> Test für alle freigeben</button>
        <button className="btn-primary" onClick={() => setAdding(true)}><UserPlus size={16} /> Kinder hinzufügen</button>
      </PageHeader>
      <StudentTable students={students} courses={courses} onChange={reload} />
      <AddStudents open={adding} onClose={() => { setAdding(false); reload(); }} courseId={course.id} courseName={course.name} />
    </div>
  );
}

export function LevelMix({ counts }) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return <span className="text-xs text-slate-400">–</span>;
  return (
    <div className="flex w-28 overflow-hidden rounded-full" title={LEVELS.map((l, i) => `${l.short}: ${counts[i]}`).join(' · ')}>
      {counts.map((n, i) => n > 0 && <div key={i} className="h-2.5" style={{ width: `${(n / total) * 100}%`, background: LEVELS[i].color }} />)}
    </div>
  );
}

export function StudentTable({ students, courses, onChange }) {
  const [edit, setEdit] = useState(null);
  const [pw, setPw] = useState(null);

  const resetPw = async (s) => {
    if (!confirm(`Neues Passwort für ${s.displayName} erzeugen?`)) return;
    const r = await api.post(`/admin/students/${s.id}/password`);
    setPw({ name: s.displayName, username: s.username, password: r.password });
  };
  const unlock = async (s) => {
    await api.post(`/admin/students/${s.id}/unlock-diagnose`, { unlock: !s.diagUnlocked });
    toast(s.diagUnlocked ? 'Freigabe zurückgenommen' : 'Diagnosetest freigegeben');
    onChange();
  };

  if (!students.length) return <div className="card"><Empty icon="Inbox" title="Noch keine Kinder in diesem Kurs" /></div>;

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Jahrgang</th>
              <th className="px-4 py-3">Ziel</th>
              <th className="px-4 py-3">Kurs</th>
              <th className="px-4 py-3">Diagnose</th>
              <th className="px-4 py-3">Niveaus</th>
              <th className="px-4 py-3">Fortschritt</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link to={`/admin/kinder/${s.id}`} className="whitespace-nowrap font-semibold text-slate-900 hover:text-brand-700">{s.displayName}</Link>
                  <div className="whitespace-nowrap text-xs text-slate-500">{s.username}{s.lastLogin && ` · zuletzt ${formatDate(s.lastLogin)}`}</div>
                </td>
                <td className="px-4 py-3">{s.grade ? `${s.grade}.` : <span className="text-slate-400">offen</span>}</td>
                <td className="px-4 py-3">{s.profile ? <span className="chip bg-brand-50 text-brand-700">{PROFILES[s.profile]?.short}</span> : <span className="text-slate-400">offen</span>}</td>
                <td className="px-4 py-3">{s.geCourse ? <span className="chip bg-slate-100 text-slate-700">{s.geCourse}-Kurs</span> : <span className="text-slate-400">–</span>}</td>
                <td className="px-4 py-3">
                  {s.diagnose?.active ? <span className="chip bg-amber-100 text-amber-800">läuft</span>
                    : s.diagnose?.count ? <span className="chip bg-emerald-100 text-emerald-700">{s.diagnose.count}× gemacht</span>
                      : <span className="chip bg-slate-100 text-slate-500">ausstehend</span>}
                  {s.diagUnlocked && s.diagnose?.count > 0 && <span className="chip ml-1 bg-sky-100 text-sky-700">freigegeben</span>}
                </td>
                <td className="px-4 py-3"><LevelMix counts={s.levelCounts} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2"><ProgressBar value={s.progress} className="w-20" /><span className="whitespace-nowrap text-xs text-slate-500">{s.progress} %</span></div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button className="btn-ghost btn-sm" onClick={() => setEdit({ ...s })} title="Bearbeiten"><Pencil size={14} /></button>
                  <button className="btn-ghost btn-sm" onClick={() => resetPw(s)} title="Neues Passwort"><KeyRound size={14} /></button>
                  {s.diagnose?.count > 0 && (
                    <button className={`btn-ghost btn-sm ${s.diagUnlocked ? 'text-sky-600' : ''}`} onClick={() => unlock(s)} title={s.diagUnlocked ? 'Freigabe zurücknehmen' : 'Diagnosetest erneut freigeben'}><Unlock size={14} /></button>
                  )}
                  <Link to={`/admin/kinder/${s.id}`} className="btn-ghost btn-sm" title="Details"><ChevronRight size={14} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EditStudent student={edit} courses={courses} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); onChange(); }} />
      <Modal open={!!pw} onClose={() => setPw(null)} title="Neues Passwort">
        {pw && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Bitte notieren und an {pw.name} weitergeben. Das Passwort wird nicht erneut angezeigt.</p>
            <div className="rounded-xl bg-slate-50 p-4 font-mono text-sm">Kennung: <b>{pw.username}</b><br />Passwort: <b>{pw.password}</b></div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function EditStudent({ student, ...props }) {
  if (!student) return null;
  return <EditStudentForm key={student.id} student={student} {...props} />;
}

function EditStudentForm({ student, courses, onClose, onSaved }) {
  const [s, setS] = useState(student);
  const [err, setErr] = useState(null);
  const save = async () => {
    try {
      await api.put(`/admin/students/${s.id}`, {
        displayName: s.displayName, username: s.username, courseId: s.courseId || null, grade: s.grade ? Number(s.grade) : null,
        profile: s.profile || null, geCourse: s.geCourse || null, note: s.note || '',
      });
      toast('Gespeichert');
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  const remove = async () => {
    if (!confirm(`${s.displayName} und alle Daten (Tests, Fortschritt) endgültig löschen?`)) return;
    await api.del(`/admin/students/${s.id}`);
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title="Kind bearbeiten">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Name</label><input className="input" value={s.displayName} onChange={(e) => setS({ ...s, displayName: e.target.value })} /></div>
        <div><label className="label">Kennung</label><input className="input" value={s.username} onChange={(e) => setS({ ...s, username: e.target.value })} /></div>
        <div>
          <label className="label">Kurs</label>
          <select className="input" value={s.courseId || ''} onChange={(e) => setS({ ...s, courseId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">– kein Kurs –</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Jahrgang</label>
          <select className="input" value={s.grade || ''} onChange={(e) => setS({ ...s, grade: e.target.value })}>
            <option value="">– offen –</option><option value="9">9</option><option value="10">10</option>
          </select>
        </div>
        <div>
          <label className="label">Ziel / Abschluss</label>
          <select className="input" value={s.profile || ''} onChange={(e) => setS({ ...s, profile: e.target.value })}>
            <option value="">– offen –</option>
            {Object.entries(PROFILES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Kurs-Niveau (nur Info)</label>
          <select className="input" value={s.geCourse || ''} onChange={(e) => setS({ ...s, geCourse: e.target.value })}>
            <option value="">–</option><option value="G">G-Kurs</option><option value="E">E-Kurs</option>
          </select>
        </div>
        <div className="sm:col-span-2"><label className="label">Notiz (nur für dich)</label><textarea className="input" rows={2} value={s.note || ''} onChange={(e) => setS({ ...s, note: e.target.value })} /></div>
      </div>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      <p className="mt-3 text-xs text-slate-500">Wird das Ziel geändert, bleibt der Lernplan bestehen; neue Themen werden ergänzt. Für einen kompletten Neustart nutze „Zurücksetzen“ in der Detailansicht.</p>
      <div className="mt-5 flex justify-between gap-2">
        <button className="btn-danger" onClick={remove}><Trash2 size={16} /> Löschen</button>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={save}>Speichern</button>
        </div>
      </div>
    </Modal>
  );
}

function AddStudents({ open, onClose, courseId, courseName }) {
  const [names, setNames] = useState('');
  const [grade, setGrade] = useState('');
  const [profile, setProfile] = useState('');
  const [created, setCreated] = useState(null);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setErr(null);
    try {
      const list = names.split('\n').map((n) => n.trim()).filter(Boolean);
      const r = await api.post('/admin/students', { names: list, courseId, grade: grade ? Number(grade) : null, profile: profile || null });
      setCreated(r.created);
    } catch (e) {
      setErr(e.message);
    }
  };
  const close = () => { setNames(''); setCreated(null); setErr(null); onClose(); };

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
    const cards = created.map((c) => `<div class="c"><div class="n">${esc(c.displayName)}</div><div>Kennung: <b>${esc(c.username)}</b></div><div>Passwort: <b>${esc(c.password)}</b></div><div class="u">${esc(location.origin)}</div></div>`).join('');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Zugangsdaten ${esc(courseName)}</title><style>body{font-family:system-ui,sans-serif;margin:24px}.g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.c{border:1px dashed #94a3b8;border-radius:10px;padding:14px;font-size:14px;line-height:1.6}.n{font-weight:700;font-size:16px}.u{color:#64748b;font-size:12px}</style><h2>Zugangsdaten – ${esc(courseName)}</h2><div class="g">${cards}</div><script>print()</script>`);
    w.document.close();
  };

  return (
    <Modal open={open} onClose={close} title={created ? 'Zugangsdaten' : 'Kinder hinzufügen'} wide>
      {!created ? (
        <div className="space-y-4">
          <div>
            <label className="label">Namen (eine Zeile pro Kind)</label>
            <textarea className="input font-mono" rows={8} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Peter Neumann\nLea Beispiel\n…'} autoFocus />
            <p className="mt-1 text-xs text-slate-500">Kennung und Startpasswort werden automatisch erzeugt (z. B. „peter.n“ / „kreis4821“).</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Jahrgang (optional)</label>
              <select className="input" value={grade} onChange={(e) => { setGrade(e.target.value); setProfile(''); }}>
                <option value="">Kind wählt beim ersten Login</option><option value="9">9</option><option value="10">10</option>
              </select>
            </div>
            <div>
              <label className="label">Ziel (optional)</label>
              <select className="input" value={profile} disabled={!grade} onChange={(e) => setProfile(e.target.value)}>
                <option value="">Kind wählt beim ersten Login</option>
                {Object.entries(PROFILES).filter(([, p]) => String(p.grade) === grade).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
            </div>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={close}>Abbrechen</button>
            <button className="btn-primary" disabled={!names.trim()} onClick={submit}><UserPlus size={16} /> Anlegen</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Die Passwörter werden nur jetzt angezeigt. Drucke die Zugangsdaten am besten direkt aus.</p>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Kennung</th><th className="px-4 py-2">Passwort</th></tr></thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {created.map((c) => <tr key={c.id}><td className="px-4 py-2 font-sans">{c.displayName}</td><td className="px-4 py-2">{c.username}</td><td className="px-4 py-2">{c.password}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={print}><Printer size={16} /> Drucken</button>
            <button className="btn-primary" onClick={close}>Fertig</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
