import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sigma } from 'lucide-react';

const MAIL = 'kleine-huster@friedensschule-os.de';

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

const SchulKI = () => <a className="text-brand-600 hover:underline" href="https://schulki.de/" target="_blank" rel="noopener noreferrer">schulKI</a>;

const Sub = ({ children }) => <h3 className="pt-1 font-semibold text-slate-900">{children}</h3>;

const Address = () => (
  <p>
    Jonas Kleine-Huster<br />c/o Friedensschule Osnabrück<br />Hakenstraße 13<br />49074 Osnabrück
  </p>
);

function Impressum() {
  return (
    <>
      <p className="font-semibold text-slate-900">Angaben gemäß § 5 DDG</p>
      <Section title="Verantwortlicher"><Address /></Section>
      <Section title="Kontakt">
        <p>E-Mail: <a className="text-brand-600 hover:underline" href={`mailto:${MAIL}`}>{MAIL}</a></p>
        <p>Erreichbar auch über das Sekretariat der Friedensschule Osnabrück.</p>
      </Section>
      <Section title="Aufsichtsbehörde">
        <p>Niedersächsisches Landesinstitut für schulische Qualitätsentwicklung (NLQ)<br />Landesschulbehörde Niedersachsen</p>
      </Section>
      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>Jonas Kleine-Huster (Anschrift wie oben)</p>
      </Section>
      <Section title="Nutzungshinweise & Verhaltensregeln">
        <p className="font-semibold text-slate-900">Wichtige Hinweise für alle Nutzer:innen</p>
        <p>Diese Plattform dient ausschließlich schulischen und pädagogischen Zwecken. Die Nutzung ist nur unter Einhaltung folgender Regeln gestattet:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Keine illegalen Inhalte:</strong> Das Eingeben, Einreichen oder Teilen von Inhalten, die gegen geltendes Recht verstoßen, ist ausdrücklich verboten. Dazu zählen insbesondere urheberrechtlich geschützte Materialien ohne Erlaubnis, beleidigende, diskriminierende oder volksverhetzende Inhalte sowie Inhalte, die Minderjährige gefährden.</li>
          <li><strong>Wahrheit und Richtigkeit:</strong> Es dürfen keine bewusst falschen Angaben zur Person gemacht werden.</li>
          <li><strong>Datenschutz Dritter:</strong> Es dürfen keine personenbezogenen Daten anderer Schülerinnen, Schüler oder Personen ohne deren Einwilligung veröffentlicht oder eingegeben werden.</li>
        </ul>
        <p>Verstöße werden an die Schulleitung gemeldet. Im Wiederholungsfall wird der Zugang gesperrt.</p>
      </Section>
      <Section title="Haftungsausschluss">
        <Sub>Haftung für Inhalte</Sub>
        <p>Die Inhalte dieser Plattform wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird jedoch keine Gewähr übernommen. Als Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.</p>
        <p>Gemäß §§ 8 bis 10 DDG bin ich als Diensteanbieter nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.</p>
        <Sub>Haftung für Links</Sub>
        <p>Diese Plattform enthält Links zu externen Webseiten Dritter (z. B. zum KI-Chatbot von <SchulKI /> über den Button „Benötigst du Hilfe?“), auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.</p>
        <p>Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden derartige Links umgehend entfernt.</p>
        <Sub>KI-Chatbot (schulKI)</Sub>
        <p>Antworten des über „Benötigst du Hilfe?“ erreichbaren KI-Chatbots stammen von <SchulKI /> und nicht von mir. KI-Antworten können fehlerhaft sein und ersetzen weder die Lehrkraft noch eine eigene Kontrolle der Ergebnisse.</p>
        <Sub>Fremde Inhalte (Aufgaben und Bilder)</Sub>
        <p>Aufgaben aus früheren Abschlussprüfungen stammen vom Niedersächsischen Kultusministerium; weitere Aufgaben wurden aus Serlo (CC BY-SA 4.0) übernommen. Bilder und Grafiken von Dritten bleiben Eigentum der genannten Urheber. Sollte eine Quellenangabe fehlen oder ein Inhalt Ihre Rechte verletzen, bitte ich um eine kurze Nachricht an die oben genannte Kontaktadresse; der Inhalt wird dann umgehend geprüft und ggf. entfernt.</p>
        <Sub>Urheberrecht</Sub>
        <p>Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
        <p>Für den schulischen Eigengebrauch durch Schülerinnen und Schüler ist die Nutzung der bereitgestellten Materialien gestattet, sofern die Quelle angegeben wird.</p>
      </Section>
      <Section title="Technische Umsetzung">
        <p>Diese Plattform wurde von Jonas Kleine-Huster mithilfe von <a className="text-brand-600 hover:underline" href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer">Claude Code</a>, einem KI-gestützten Programmierwerkzeug von Anthropic, entwickelt.</p>
      </Section>
    </>
  );
}

function Datenschutz() {
  return (
    <>
      <Section title="1. Verantwortlicher">
        <Address />
        <p>E-Mail: {MAIL}</p>
      </Section>
      <Section title="2. Allgemeines">
        <p>Diese Plattform („Mathematik-Prüfungstrainer“) ist ein Lernangebot zur Vorbereitung auf die Mathematik-Abschlussprüfung an der Friedensschule Osnabrück. Sie läuft auf einem selbst betriebenen Server und ist sowohl im lokalen Netzwerk als auch von außerhalb über eine eigene Domain erreichbar (Näheres unter Punkt 3 e).</p>
        <p>Die Plattform bindet keine Analyse- oder Tracking-Tools, Werbenetzwerke oder externe Schriftarten ein, die automatisch im Hintergrund Daten an Dritte übertragen würden – alle dafür nötigen Programmbibliotheken werden direkt vom eigenen Server ausgeliefert. Über den Button „Benötigst du Hilfe?“ gelangst du zu einem externen KI-Chatbot von <SchulKI />. Dieser wird nicht von dieser Plattform betrieben; beim Anklicken öffnet sich ein neuer Tab und es gelten die Datenschutzbestimmungen von schulKI – siehe auch „Haftung für Links“ im Impressum. Von dieser Plattform werden dabei keine Daten an schulKI übermittelt. Bitte gib im Chat keine persönlichen Daten (z. B. Namen, Adresse) ein.</p>
      </Section>
      <Section title="3. Welche Daten werden verarbeitet?">
        <Sub>a) Zugangsdaten</Sub>
        <p>Die Zugangsdaten (Kennung, Name bzw. Anzeigename, Kurszugehörigkeit, Passwort) werden von der Lehrkraft angelegt. Das Passwort wird nur als nicht umkehrbarer Hash gespeichert.</p>
        <Sub>b) Angaben zum Lernen</Sub>
        <p>Gespeichert werden der gewählte Abschluss, die Selbsteinschätzung zu Themen, die Antworten im Einstiegstest und in den Übungen, Bearbeitungszeiten, Ergebnisse, der Lernplan und der Lernfortschritt. Diese Angaben dienen dazu, dass du einen passenden Lernplan bekommst und die Lehrkraft den Lernstand nachvollziehen kann.</p>
        <Sub>c) Technisch bedingte Zugriffsdaten</Sub>
        <p>Wie bei jedem Webserver werden beim Aufruf der Seite technisch bedingt kurzzeitig Verbindungsdaten verarbeitet (z. B. IP-Adresse, Zeitpunkt des Zugriffs, aufgerufene Seite, Browsertyp). Diese Daten fallen automatisiert durch die Serversoftware an und werden nicht mit anderen Datenquellen zusammengeführt.</p>
        <Sub>d) Cookie und lokaler Speicher im Browser</Sub>
        <p>Nach der Anmeldung wird ein technisch notwendiges Sitzungs-Cookie gesetzt, das dich eingeloggt hält. Es enthält keine persönlichen Daten und wird beim Abmelden gelöscht. Zusätzlich merkt sich der Browser im „localStorage“ einzelne technische Angaben (z. B. ob ein Hinweis zum Wiederholungstest bereits gesehen wurde). Diese verlassen das Gerät nicht und werden nicht an Dritte übertragen.</p>
        <Sub>e) Cloudflare (nur bei Zugriff von außerhalb des lokalen Netzwerks)</Sub>
        <p>Wird die Seite über die öffentliche Domain statt im lokalen Netzwerk aufgerufen, läuft die Verbindung über einen Cloudflare Tunnel des Anbieters Cloudflare, Inc. Cloudflare verarbeitet dabei technisch bedingt Verbindungsdaten (u. a. IP-Adresse), um die Verbindung zum Server herzustellen. Es handelt sich um einen US-amerikanischen Anbieter; Einzelheiten zur dortigen Verarbeitung sind der Datenschutzerklärung von Cloudflare zu entnehmen.</p>
      </Section>
      <Section title="4. Zweck der Verarbeitung">
        <p>Die Verarbeitung dient ausschließlich der Prüfungsvorbereitung: der Anmeldung, der Erstellung des Lernplans, der Anzeige des Lernfortschritts, der Rückmeldung an die Lehrkraft sowie der reibungslosen technischen Bereitstellung der Seite.</p>
      </Section>
      <Section title="5. Rechtsgrundlage">
        <p>Die Verarbeitung erfolgt im Rahmen der schulischen Aufgabenwahrnehmung (Art. 6 Abs. 1 lit. e DSGVO i. V. m. den einschlägigen niedersächsischen schulrechtlichen Vorschriften).</p>
      </Section>
      <Section title="6. Weitergabe an Dritte">
        <p>Die Lernergebnisse werden ausschließlich von dir selbst und den betreuenden Lehrkräften eingesehen – eine Weitergabe an sonstige Dritte findet nicht statt. Ausnahmen sind der Hilfe-Chat von schulKI (nur, wenn du ihn selbst öffnest; siehe Punkt 2) und die unter 3 e beschriebene technisch bedingte Verarbeitung von Verbindungsdaten durch Cloudflare beim Zugriff von außerhalb.</p>
      </Section>
      <Section title="7. Speicherdauer">
        <p>Die Daten werden gespeichert, solange sie für die Prüfungsvorbereitung benötigt werden, in der Regel nicht länger als bis zum Ende des jeweiligen Schuljahres bzw. bis zur Abschlussprüfung. Die Lehrkraft kann einzelne Konten und Ergebnisse jederzeit löschen.</p>
      </Section>
      <Section title="8. Datensicherheit">
        <p>Der Zugang ist durch Kennung und Passwort geschützt. Fehlerhafte Anmeldeversuche werden serverseitig automatisch begrenzt. Passwörter können von den Kindern selbst geändert werden.</p>
      </Section>
      <Section title="9. Ihre Rechte">
        <p>Betroffene Personen (bzw. deren Erziehungsberechtigte) haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung ihrer personenbezogenen Daten sowie ein Widerspruchsrecht gegen die Verarbeitung, unter den gesetzlichen Voraussetzungen. Wenden Sie sich dazu an die oben genannte Kontaktadresse. Außerdem besteht ein Beschwerderecht bei der zuständigen Aufsichtsbehörde.</p>
      </Section>
      <Section title="10. Änderungen dieser Datenschutzerklärung">
        <p>Diese Datenschutzerklärung wird bei Änderungen an der Funktionsweise der Seite entsprechend angepasst.</p>
      </Section>
    </>
  );
}

export default function Legal({ kind }) {
  const navigate = useNavigate();
  const title = kind === 'impressum' ? 'Impressum' : 'Datenschutz';
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
        <div className="card space-y-6 p-6 text-[15px] leading-relaxed text-slate-700 sm:p-8">
          {kind === 'impressum' ? <Impressum /> : <Datenschutz />}
        </div>
        <nav className="mt-6 flex gap-4 text-sm text-slate-500">
          <Link className="hover:text-slate-800 hover:underline" to="/impressum">Impressum</Link>
          <Link className="hover:text-slate-800 hover:underline" to="/datenschutz">Datenschutz</Link>
        </nav>
      </main>
    </div>
  );
}
