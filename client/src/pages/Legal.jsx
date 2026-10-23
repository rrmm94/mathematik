import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sigma } from 'lucide-react';
import { api } from '../lib/api.js';
import { useLoad, PageLoader, ErrorBox } from '../components/ui.jsx';

const Missing = () => <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">[bitte in den Einstellungen ergänzen]</span>;
const Val = ({ v, multiline }) => (v?.trim() ? <span className={multiline ? 'whitespace-pre-line' : ''}>{v.trim()}</span> : <Missing />);

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Impressum({ d }) {
  return (
    <>
      <Section title="Angaben gemäß § 5 DDG">
        <p><Val v={d.legal_name} /><br /><Val v={d.legal_address} multiline /></p>
      </Section>
      <Section title="Kontakt">
        <p>E-Mail: <Val v={d.legal_email} />{d.legal_phone?.trim() && <><br />Telefon: {d.legal_phone.trim()}</>}</p>
      </Section>
      <Section title="Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)">
        <p><Val v={d.legal_name} />, Anschrift wie oben.</p>
      </Section>
      {d.legal_extra?.trim() && <Section title="Weitere Angaben"><p className="whitespace-pre-line">{d.legal_extra.trim()}</p></Section>}
      <Section title="Haftung für Inhalte und Links">
        <p>Die Inhalte dieser Lernplattform wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität kann jedoch keine Gewähr übernommen werden. Aufgaben aus früheren Abschlussprüfungen stammen vom Niedersächsischen Kultusministerium; weitere Aufgaben wurden aus Serlo (CC BY-SA 4.0) übernommen. Für Inhalte externer Seiten, auf die verlinkt wird (z. B. der Hilfe-Chat), sind ausschließlich deren Betreiber verantwortlich.</p>
      </Section>
    </>
  );
}

function Datenschutz({ d }) {
  return (
    <>
      <Section title="1. Verantwortliche Stelle">
        <p><Val v={d.legal_name} /><br /><Val v={d.legal_address} multiline /><br />E-Mail: <Val v={d.legal_email} /></p>
        {d.legal_dpo?.trim() && <p><strong>Datenschutzbeauftragte/r:</strong> <span className="whitespace-pre-line">{d.legal_dpo.trim()}</span></p>}
      </Section>
      <Section title="2. Wofür diese Plattform da ist">
        <p>Der Mathematik-Prüfungstrainer unterstützt Schülerinnen und Schüler bei der Vorbereitung auf die Mathematik-Abschlussprüfung. Die Nutzung ist Teil des Unterrichts bzw. der schulischen Prüfungsvorbereitung. Es gibt keine Registrierung durch die Kinder: Zugangsdaten werden von der Lehrkraft vergeben.</p>
      </Section>
      <Section title="3. Welche Daten verarbeitet werden">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Zugangsdaten:</strong> Kennung, Name bzw. Anzeigename, Kurszugehörigkeit und ein Passwort (nur als nicht umkehrbarer Hash gespeichert).</li>
          <li><strong>Angaben zum Lernen:</strong> gewählter Abschluss, Selbsteinschätzung zu Themen, Antworten im Einstiegstest und in den Übungen, Bearbeitungszeiten, Ergebnisse, Lernplan und Lernfortschritt.</li>
          <li><strong>Technisch notwendig:</strong> ein Sitzungs-Cookie, das dich nach dem Anmelden eingeloggt hält. Es enthält keine persönlichen Daten und wird beim Abmelden gelöscht. Der Server verarbeitet beim Aufruf der Seite kurzzeitig technische Verbindungsdaten (z. B. IP-Adresse), um die Seite auszuliefern.</li>
        </ul>
        <p>Es werden <strong>keine</strong> Tracking- oder Analyse-Dienste, keine Werbung und keine externen Schriftarten oder Skripte eingebunden. Alle Inhalte werden vom eigenen Server geladen.</p>
      </Section>
      <Section title="4. Zwecke und Rechtsgrundlage">
        <p>Die Daten werden ausschließlich verwendet, um dich anzumelden, einen passenden Lernplan zu erstellen, deinen Fortschritt anzuzeigen und der Lehrkraft einen Überblick über den Lernstand zu geben. Rechtsgrundlage ist die Erfüllung der schulischen Aufgabe (Art. 6 Abs. 1 lit. e DSGVO in Verbindung mit den schulrechtlichen Vorschriften des Landes Niedersachsen, insbesondere § 31 NSchG).</p>
      </Section>
      <Section title="5. Wer die Daten sieht">
        <p>Deine Ergebnisse sehen du selbst und die Lehrkräfte, die den Kurs betreuen. Die Daten werden nicht an Dritte weitergegeben und nicht verkauft. Der Betrieb erfolgt auf einem Server der verantwortlichen Stelle bzw. in deren Auftrag; die Daten werden nicht in Staaten außerhalb der EU übermittelt.</p>
      </Section>
      <Section title="6. Hilfe-Chat („Benötigst du Hilfe?“)">
        <p>Der Hilfe-Button öffnet in einem neuen Tab einen externen KI-Assistenten. Von dieser Plattform werden dabei keine Daten übermittelt. Was du dort eingibst, unterliegt den Datenschutzhinweisen des jeweiligen Dienstes. Bitte gib dort keine persönlichen Daten ein.</p>
      </Section>
      <Section title="7. Speicherdauer">
        <p>Die Daten werden gelöscht, sobald sie für die Prüfungsvorbereitung nicht mehr benötigt werden, spätestens wenn das Konto durch die Lehrkraft gelöscht wird (in der Regel nach der Abschlussprüfung bzw. mit Ende des Schuljahres).</p>
      </Section>
      <Section title="8. Deine Rechte">
        <p>Du hast das Recht auf Auskunft über die gespeicherten Daten (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Widerspruch (Art. 21). Wende dich dafür an die oben genannte verantwortliche Stelle oder an deine Lehrkraft. Bei Kindern können auch die Erziehungsberechtigten diese Rechte wahrnehmen.</p>
        <p>Außerdem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, in Niedersachsen: Die Landesbeauftragte für den Datenschutz Niedersachsen, Prinzenstraße 5, 30159 Hannover, <span className="whitespace-nowrap">poststelle@lfd.niedersachsen.de</span>.</p>
      </Section>
      <Section title="9. Sicherheit">
        <p>Passwörter werden nur verschlüsselt gespeichert. Die Plattform sollte ausschließlich über eine verschlüsselte Verbindung (HTTPS) betrieben werden.</p>
      </Section>
    </>
  );
}

export default function Legal({ kind }) {
  const navigate = useNavigate();
  const { data, error, loading } = useLoad(() => api.get('/legal'));
  const title = kind === 'impressum' ? 'Impressum' : 'Datenschutzerklärung';
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/85">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><Sigma size={20} strokeWidth={2.5} /></span>
            Mathematik-Prüfungstrainer
          </Link>
          <button className="btn-ghost" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}><ArrowLeft size={16} /> Zurück</button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {loading ? <PageLoader /> : error ? <ErrorBox error={error} /> : (
          <div className="card space-y-6 p-6 text-[15px] leading-relaxed text-slate-700 sm:p-8">
            {kind === 'impressum' ? <Impressum d={data} /> : <Datenschutz d={data} />}
          </div>
        )}
        <nav className="mt-6 flex gap-4 text-sm text-slate-500">
          <Link className="hover:text-slate-800 hover:underline" to="/impressum">Impressum</Link>
          <Link className="hover:text-slate-800 hover:underline" to="/datenschutz">Datenschutz</Link>
        </nav>
      </main>
    </div>
  );
}
