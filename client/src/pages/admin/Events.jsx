import { useState } from 'react';
import { Plus, Pencil, Trash2, Clock, MapPin } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Modal, toast, Empty, formatDate } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';

export default function Events() {
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.get('/admin/events'), api.get('/admin/courses'), api.get('/admin/topics')]));
  const [edit, setEdit] = useState(null);
  const [showPast, setShowPast] = useState(false);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const [events, courses, topics] = data;
  const today = new Date().toISOString().slice(0, 10);
  const list = events.filter((e) => showPast || e.date >= today);

  const save = async () => {
    if (edit.id) await api.put(`/admin/events/${edit.id}`, edit);
    else await api.post('/admin/events', edit);
    toast('Termin gespeichert');
    setEdit(null);
    reload();
  };
  const remove = async (e) => {
    if (!confirm('Termin löschen?')) return;
    await api.del(`/admin/events/${e.id}`);
    reload();
  };

  return (
    <div className="max-w-5xl">
      <PageHeader title="Termine" subtitle="Input-Veranstaltungen: Wann wird welches Thema wiederholt? Die Kinder sehen die Termine ihres Kurses auf der Startseite.">
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Vergangene zeigen</label>
        <button className="btn-primary" onClick={() => setEdit({ title: '', date: today, time: '', room: '', note: '', courseIds: courses.map((c) => c.id), topicId: '' })}><Plus size={16} /> Neuer Termin</button>
      </PageHeader>
      <div className="card divide-y divide-slate-100 overflow-hidden">
        {list.length === 0 ? <Empty title="Keine Termine" /> : list.map((e) => (
          <div key={e.id} className={`flex flex-wrap items-center gap-4 px-5 py-3 ${e.date < today ? 'opacity-50' : ''}`}>
            <div className="w-28 text-sm font-semibold text-slate-900">{formatDate(e.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
            <div className="min-w-52 flex-1">
              <div className="font-medium text-slate-900">{e.title}</div>
              <div className="flex flex-wrap gap-x-3 text-xs text-slate-500">
                {e.time && <span className="flex items-center gap-1"><Clock size={11} /> {e.time}</span>}
                {e.room && <span className="flex items-center gap-1"><MapPin size={11} /> {e.room}</span>}
                {e.topic_title && <span>Thema: {e.topic_title}</span>}
              </div>
            </div>
            <span className="chip bg-slate-100 text-slate-600">{e.course_name || 'alle Kurse'}</span>
            <button className="btn-ghost btn-sm" onClick={() => setEdit({ ...e, courseId: e.course_id, topicId: e.topic_id || '' })}><Pencil size={14} /></button>
            <button className="btn-ghost btn-sm text-red-600" onClick={() => remove(e)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Termin bearbeiten' : 'Neuer Termin'}>
        {edit && (
          <div className="space-y-4">
            <div>
              <label className="label">Thema</label>
              <select className="input" value={edit.topicId || ''} onChange={(e) => {
                const t = topics.find((x) => String(x.id) === e.target.value);
                setEdit({ ...edit, topicId: e.target.value, title: edit.title || (t ? `Wiederholung: ${t.title}` : '') });
              }}>
                <option value="">– ohne Thema –</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div><label className="label">Titel</label><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">Datum</label><input type="date" className="input" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></div>
              <div><label className="label">Zeit</label><input className="input" placeholder="z. B. 7. Stunde" value={edit.time || ''} onChange={(e) => setEdit({ ...edit, time: e.target.value })} /></div>
              <div><label className="label">Raum</label><input className="input" value={edit.room || ''} onChange={(e) => setEdit({ ...edit, room: e.target.value })} /></div>
            </div>
            <div><label className="label">Hinweis</label><input className="input" placeholder="z. B. Taschenrechner mitbringen" value={edit.note || ''} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></div>
            {edit.id ? (
              <div>
                <label className="label">Kurs</label>
                <select className="input" value={edit.courseId || ''} onChange={(e) => setEdit({ ...edit, courseId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">alle Kurse</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">Für Kurse</label>
                <div className="flex flex-wrap gap-2">
                  {courses.map((c) => {
                    const on = edit.courseIds.includes(c.id);
                    return (
                      <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${on ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                        <input type="checkbox" checked={on} onChange={() => setEdit({ ...edit, courseIds: on ? edit.courseIds.filter((x) => x !== c.id) : [...edit.courseIds, c.id] })} /> {c.name}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-slate-500">Keine Auswahl = für alle Kinder sichtbar.</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEdit(null)}>Abbrechen</button>
              <button className="btn-primary" disabled={!edit.title.trim() || !edit.date} onClick={save}>Speichern</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
