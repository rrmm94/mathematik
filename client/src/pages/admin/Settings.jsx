import { useEffect, useState } from 'react';
import { Save, LifeBuoy, CalendarClock, KeyRound, Bot, Scale } from 'lucide-react';
import { PROFILES, PROFILE_KEYS } from '../../../../shared/constants.js';
import { api } from '../../lib/api.js';
import { useLoad, PageLoader, ErrorBox, toast, useAuth } from '../../components/ui.jsx';
import { PageHeader } from '../../components/Layout.jsx';

export default function SettingsPage() {
  const { refresh } = useAuth();
  const { data, error, loading } = useLoad(() => api.get('/admin/settings'));
  const [s, setS] = useState(null);
  const [pw, setPw] = useState('');
  useEffect(() => { if (data) setS(data); }, [data]);
  if (loading || !s) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;

  const save = async () => {
    await api.put('/admin/settings', s);
    toast('Einstellungen gespeichert');
    refresh();
  };
  const changePw = async () => {
    try {
      await api.put('/admin/password', { password: pw });
      setPw('');
      toast('Passwort geändert');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Einstellungen">
        <button className="btn-primary" onClick={save}><Save size={16} /> Speichern</button>
      </PageHeader>

      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><LifeBuoy size={18} className="text-amber-500" /> „Benötigst du Hilfe?“-Button</h2>
        <div>
          <label className="label">Link zum KI-Mathe-Chatbot</label>
          <input className="input" placeholder="https://…" value={s.chatbot_url} onChange={(e) => setS({ ...s, chatbot_url: e.target.value })} />
          <p className="mt-1 text-xs text-slate-500">Wird auf allen Seiten oben rechts verlinkt und in einem neuen Tab geöffnet (z. B. telli, fobizz oder ein eigener Assistent).</p>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><CalendarClock size={18} className="text-brand-600" /> Prüfungstermine (Countdown)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROFILE_KEYS.map((k) => (
            <div key={k}>
              <label className="label">{PROFILES[k].label}</label>
              <input type="date" className="input" value={s[`exam_date_${k}`] || ''} onChange={(e) => setS({ ...s, [`exam_date_${k}`]: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Bot size={18} className="text-violet-600" /> KI-Bewertung von Freitext (Vorbereitung)</h2>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={s.ai_check_enabled === 'true'} onChange={(e) => setS({ ...s, ai_check_enabled: e.target.checked ? 'true' : 'false' })} disabled />
          Freitext-Antworten per KI einschätzen lassen <span className="chip bg-slate-100 text-slate-500">demnächst</span>
        </label>
        <p className="text-xs text-slate-500">Die Schnittstelle ist im Code vorbereitet (server/ai.js). Vor der Aktivierung sollte der Datenschutz (Auftragsverarbeitung) geklärt werden.</p>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Scale size={18} className="text-slate-600" /> Impressum &amp; Datenschutz</h2>
        <p className="text-xs text-slate-500">Diese Angaben erscheinen auf den öffentlichen Seiten „Impressum“ und „Datenschutz“ (Link unten auf der Anmeldeseite). Bitte vollständig ausfüllen. Die Datenschutzerklärung ist ein Entwurf und sollte von der Schulleitung bzw. dem/der Datenschutzbeauftragten geprüft werden.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Verantwortlich (Name / Schule)</label><input className="input" value={s.legal_name} onChange={(e) => setS({ ...s, legal_name: e.target.value })} /></div>
          <div><label className="label">E-Mail</label><input type="email" className="input" value={s.legal_email} onChange={(e) => setS({ ...s, legal_email: e.target.value })} /></div>
          <div><label className="label">Anschrift (mehrzeilig)</label><textarea className="input min-h-20" value={s.legal_address} onChange={(e) => setS({ ...s, legal_address: e.target.value })} /></div>
          <div><label className="label">Telefon (optional)</label><input className="input" value={s.legal_phone} onChange={(e) => setS({ ...s, legal_phone: e.target.value })} /></div>
          <div><label className="label">Datenschutzbeauftragte/r (optional)</label><textarea className="input min-h-20" value={s.legal_dpo} onChange={(e) => setS({ ...s, legal_dpo: e.target.value })} /></div>
          <div><label className="label">Weitere Angaben im Impressum (optional)</label><textarea className="input min-h-20" value={s.legal_extra} onChange={(e) => setS({ ...s, legal_extra: e.target.value })} /></div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><KeyRound size={18} className="text-slate-600" /> Eigenes Passwort ändern</h2>
        <div className="flex gap-2">
          <input type="password" className="input max-w-xs" placeholder="Neues Passwort (mind. 8 Zeichen)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn-secondary" disabled={pw.length < 8} onClick={changePw}>Ändern</button>
        </div>
      </section>
      <p className="pb-4 text-center text-xs text-slate-400">Mathematik-Prüfungstrainer · Version {__APP_VERSION__}</p>
    </div>
  );
}
