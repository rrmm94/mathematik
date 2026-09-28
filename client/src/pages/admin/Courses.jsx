import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, Modal, toast, Empty } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';
import { StudentTable } from './CourseDetail.jsx';

export default function Courses() {
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.get('/admin/overview'), api.get('/admin/students')]));
  const [edit, setEdit] = useState(null);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const [{ courses }, students] = data;
  const noCourse = students.filter((s) => !s.courseId);

  const save = async () => {
    if (edit.id) await api.put(`/admin/courses/${edit.id}`, edit);
    else await api.post('/admin/courses', edit);
    toast('Kurs gespeichert');
    setEdit(null);
    reload();
  };
  const remove = async (c) => {
    if (!confirm(`Kurs „${c.name}“ löschen? Die Kinder bleiben erhalten (ohne Kurs).`)) return;
    await api.del(`/admin/courses/${c.id}`);
    reload();
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="Kurse & Kinder" subtitle="Lege Kurse an und verwalte die Kinder darin.">
        <button className="btn-primary" onClick={() => setEdit({ name: '', description: '' })}><Plus size={16} /> Neuer Kurs</button>
      </PageHeader>
      {courses.length === 0 ? <div className="card"><Empty title="Noch keine Kurse angelegt" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <div key={c.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Users size={22} /></div>
                <div className="flex gap-1">
                  <button className="btn-ghost btn-sm" onClick={() => setEdit(c)} title="Bearbeiten"><Pencil size={14} /></button>
                  <button className="btn-ghost btn-sm text-red-600" onClick={() => remove(c)} title="Löschen"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 text-lg font-semibold text-slate-900">{c.name}</div>
              <div className="text-sm text-slate-500">{c.description || '–'}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-600">{c.students} Kinder</span>
                <Link to={`/admin/kurse/${c.id}`} className="btn-secondary btn-sm">Öffnen <ArrowRight size={14} /></Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {noCourse.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-semibold text-slate-900">Kinder ohne Kurs</h2>
          <StudentTable students={noCourse} courses={courses} onChange={reload} />
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Kurs bearbeiten' : 'Neuer Kurs'}>
        {edit && (
          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="z. B. 10a Mathe" autoFocus />
            </div>
            <div>
              <label className="label">Beschreibung</label>
              <input className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="optional" />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEdit(null)}>Abbrechen</button>
              <button className="btn-primary" disabled={!edit.name.trim()} onClick={save}>Speichern</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
