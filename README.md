# Mathematik-Prüfungstrainer – Lernplattform für die Mathe-Abschlussprüfung

Eine Lernplattform für die Oberschule (Haupt- und Realschulzweig), mit der sich Schülerinnen und Schüler selbstständig auf die Mathematik-Abschlussprüfung vorbereiten. Die Plattform ist für den 10. Jahrgang gedacht; die Inhalte orientieren sich an den niedersächsischen Abschlussarbeiten nach Klasse 10 (HS, RS, erweiterter RS).

## Funktionen

### Für die Kinder
- **Login mit Kennung + Passwort** (vergeben durch die Lehrkraft, keine E-Mail-Adressen); das Passwort können die Kinder selbst ändern (Schlüssel-Symbol oben)
- **Erster Login:** angestrebten Abschluss wählen – Hauptschulabschluss nach Klasse 10, Realschulabschluss oder erweiterter Realschulabschluss (entfällt, wenn die Lehrkraft den Abschluss schon eingetragen hat), danach **„Welche Themen sind dir bisher leichtgefallen?“** – Themen mit Stichworten und Mini-Beispielaufgabe zum Anhaken (freiwillig, bis zum Teststart änderbar)
- **Einstiegstest (Diagnose):** je Thema 3 Aufgaben (leicht/mittel/schwer), pausierbar, ohne Richtig/Falsch-Rückmeldung
- **Animation „Dein Lernplan wird erstellt …“** nach dem Test
- **Individueller Lernplan:** schwächste Themen zuerst; Themen, die das Kind als leicht angehakt hat **und** im Test mindestens auf Regelstandard lagen, stehen am Ende. Alle Themen frei wählbar, Fortschrittsbalken je Thema
- **Übungspakete** mit Eingabefeldern, Multiple Choice oder Freitext; unbegrenzte Versuche, Tipp, Lösung auf Wunsch, „Neue Zahlen“ (Varianten)
- **„Skript“-Button** an jeder Aufgabe springt zum passenden Abschnitt im interaktiven Skript
- **Startseite:** Ziel, Countdown bis zur Prüfung, Lernplan, Feedback der Lehrkraft, nächste Termine
- **„Benötigst du Hilfe?“** oben rechts auf allen Seiten (Link zum KI-Chatbot)
- **Wiederholungstest** (wenn freigegeben): zeigt, in welchen Themen man sich verbessert hat
- Die **Niveaustufe ist für Kinder nirgends sichtbar** – auch nicht in den Daten, die an den Browser gehen.

### Für die Lehrkraft (`/admin`)
- **Kurse & Kinder** anlegen (mehrere Namen auf einmal mit gemeinsamem Startpasswort, Zugangsdaten druckbar), Abschluss bearbeiten, Passwort von Hand neu setzen
- **Detailansicht je Kind:**
  - Diagnose-Ergebnis je Aufgabe inkl. Antwort und **Bearbeitungszeit**
  - berechnete Niveaustufe je Thema (Basis / Mindest / Regel / Experte)
  - ⭐ „leicht“-Markierung bei Themen, die das Kind selbst als leicht angehakt hat
  - Lernplan anpassen: **Reihenfolge per Drag & Drop**, **mehrere Stufen gleichzeitig freischalten**
  - Fortschritt, **Anzahl der Versuche und Zeit je Übungsaufgabe**, „Lösung angesehen“
  - Vergleich Einstiegstest ↔ Wiederholungstest, Stufen per Klick übernehmen
  - **Feedback je Thema**
- **Diagnosetest-Editor:** je Profil und Thema die Aufgaben leicht/mittel/schwer
- **Übungsaufgaben-Editor:** Themen → Übungspakete (je Niveaustufe) → Aufgaben
- **Aufgaben-Editor:** Freitext + **LaTeX** (`$…$`) mit Live-Vorschau, **Bilder und GeoGebra-SVG** (Hochladen, Einfügen per Drag & Drop oder Zwischenablage), **mehrere Varianten** (Tabs), Musterlösung, Lösungsweg, Tipp, Test „als Kind“
- **Skript-Editor:** Abschnitte aus Bausteinen – Text/LaTeX, Bild/SVG, YouTube-Video (datenschutzfreundlich eingebettet), Link mit **QR-Code**
- **Themenbereiche** anlegen/sortieren, Symbol und Farbe wählen, Zuordnung zu Abschlüssen, Stichworte und Mini-Beispielaufgabe für die Themenauswahl beim ersten Login
- **Termine** (Input-Veranstaltungen) je Kurs
- **Einstellungen:** Chatbot-Link, Prüfungstermine je Abschluss (Countdown)

### Niveaustufen
| Richtige Diagnose-Aufgaben (von 3) | Stufe |
|---|---|
| 0 | Basisstandard |
| 1 (die leichte) | Mindeststandard |
| 2 | Regelstandard |
| 3 | Expertenstandard |

Freitext-Aufgaben zählen im Diagnosetest nicht für die Stufe.

## Startinhalt
- 14 Themenbereiche mit Symbolen und Skript (Zahlen & Rechnen, Größen, Prozent & Zinsen, Zuordnungen, Terme & Gleichungen, Lineare Funktionen, Winkel & Flächen, Körper, Pythagoras, Statistik, Wahrscheinlichkeit, Quadratische Funktionen, Trigonometrie, Wachstum)
- Vollständiger Diagnosetest für 3 Abschlüsse (114 Aufgaben, je 3 Varianten)
- Übungspakete für jede Niveaustufe (305 Aufgaben, je 3 Varianten)
- Demo-Kurs (Kennungen `peter`, `lea`, `ali` – Passwort `demo1234`); abschaltbar mit `SEED_DEMO=false`

Alle Beispielinhalte können im Editor geändert oder gelöscht werden.

## Grundlagen-Training (Hauptschule Klasse 10)

Beim Start importiert die Plattform automatisch die Aufgaben aus dem „Grundlagen-Training“ für HS 10: Rechnen, Funktionen, Wachstum (`Grundlagen des Rechnens` usw.), Geometrie (Streckung, Strahlensätze, Pythagoras, Thales, Trigonometrie, Kreisteile, Körper) sowie Daten und Zufall (Statistik, Wahrscheinlichkeit) – 33 Übungspakete mit rund 185 Aufgaben und über 300 Varianten, jeweils mit Tipp und Lösungsweg. Vorhandene Inhalte bleiben unberührt; jeder der drei Importe läuft nur einmal (Version in `server/seed/import-grundlagen.js`). Die Aufgaben liegen in `server/seed/grundlagen/`.

- Pakete sind für **HS 10** freigegeben (Thema „Wachstum“ wird dafür ebenfalls für HS 10 geöffnet, „Lineare Gleichungssysteme“ ist ein neues Thema).
- Neue Antworttypen: Wertetabelle mit **Live-Graph**, **Koordinatensystem zum Anklicken** (Geraden/Punkte), **Karten sortieren**, **Termeingabe** (`2x+85`), **a·10ⁿ**-Felder, Auswahllisten, Aufgaben mit mehreren richtigen Lösungen. Im Aufgaben-Editor werden diese Typen als JSON bearbeitet.
- `npm test` prüft die Antwortlogik und dass jede importierte Aufgabe ihre eigene Musterlösung akzeptiert.


## Originalaufgaben aus den Abschlussprüfungen
Beim ersten Start (auch bei bestehenden Installationen) werden die Abschlussprüfungen Niedersachsen 2021–2026 (Realschule, Hauptschule G- und E-Kurs) eingebunden:

- **Übungen:** je Thema eigene Pakete „Prüfungsaufgaben“, nach Prüfungsteil (Teil 1 / Teil 2 / Wahlteil) und Kurs einer Niveaustufe zugeordnet; Einpunktaufgaben im Teil 2/Wahlteil (meist die Einstiegsteilaufgaben) rutschen eine Stufe nach unten. Dieselbe Aufgabe aus G- und E-Kurs oder mehreren Jahren erscheint je Abschlussgruppe nur einmal, auf der niedrigsten Stufe.
- **Einstiegstest:** Im Diagnosetest stehen neben den erzeugten Aufgaben nur **einzeln geprüfte** Originalaufgaben (`DIAG_PICKS` in `server/seed/exam-curation.js`): am Bildschirm lösbar, alle Angaben vorhanden, Thema und Schwierigkeit (leicht/mittel/schwer) passen. Die Übersicht zum Gegenlesen steht in [DIAGNOSETEST.md](DIAGNOSETEST.md) (erzeugt mit `scripts/diagnose-report.mjs`).
- **Herkunft nur für Lehrkräfte:** Im Aufgaben-Editor (Feld „Herkunft“), in der Aufgabenliste und in der Detailansicht eines Kindes steht z. B. „Abschlussprüfung 2025 · Hauptschule E-Kurs · Teil 2 · Aufgabe 3 b)“. Kinder sehen nur die Aufgabe, keinen Hinweis auf Jahr, Prüfung oder Niveau.
- **Gleichungssysteme und Wachstum im Einstiegstest (RS 10 und erw. RS):** `server/seed/diag-gls-wachstum.js` legt je drei Aufgaben (leicht, mittel, schwer) mit Varianten an, aus Schulbuch-Aufgaben (Nr. 94 bis 103, 154 bis 160) und der Abschlussprüfung 2020 (Wahlaufgabe 3). Das Thema Wachstum wird dafür auch für RS 10 geöffnet. `npm test` prüft jede Musterlösung.
- **Themenfreigabe:** Trigonometrie, Quadratische Funktionen und Wachstum bleiben der Realschule vorbehalten; Hauptschulkinder bekommen dazu keine Aufgaben.
- **Nur, was am iPad lösbar ist** (`server/seed/exam-curation.js`): ausgelassen werden Aufgaben zum Zeichnen/Messen, Aufgaben, bei denen am Bild etwas angekreuzt oder ergänzt werden müsste und darunter nur ein Freitextfeld stünde, Aufgaben, die auf eine Abbildung oder Angabe einer anderen Teilaufgabe verweisen, sowie frei einzutippende Gleichungen/Formeln. Umgebaut werden Ja/Nein-Fragen und Wörter („rechtwinkliges Dreieck“, „exponentiell“) zu Auswahlfeldern, Geradengleichungen zu zwei Zahlenfeldern *y = ◻ · x + ◻*; „Notiere deinen Rechenweg“ und Punktangaben entfallen. Beim Runden werden sinnvoll gerundete Ergebnisse akzeptiert. Einzelne Aufgaben sind per Hand korrigiert (`FIXES`: Thema, falscher Kontext, überflüssige Bilder …). Übrig bleiben außerdem reine Begründungsaufgaben („Begründe …“) als Freitext ohne automatische Prüfung – die Lösung wird danach angezeigt.
- Bilder, Tabellen und Lücken im Text werden wie in der Prüfung dargestellt.
- **Varianten mit neuen Zahlen:** Zu etwa 90 Aufgaben (Rechen- und Lückenaufgaben, Einheiten, Terme, Prozent und Zinsen, Wahrscheinlichkeit, Wertetabellen …) gibt es je zwei weitere Varianten; das Kind bekommt sie über „Neue Zahlen“, im Diagnosetest wechseln sie beim Wiederholungstest. Sie stehen in `server/seed/exam-variants.js`. Aufgaben, deren Zahlen in einem Bild stehen, haben nur die Originalfassung.
- **Kontrolle:** `DATA_DIR=/tmp/x node --no-warnings scripts/check-exam-variants.mjs` rechnet jede Vorlage gegen die Originalaufgabe nach, prüft jede Variante und jede aufbereitete Originalaufgabe auf eine bestehende eigene Lösung, passende Lückenzahl und fehlerfreie Formeln.
- **Update bestehender Installationen:** Beim ersten Start nach dem Update wird die erste, ungeprüfte Fassung der Prüfungsaufgaben entfernt und neu aufgebaut (Setting `exams_v2`). Aufgaben, die Kinder schon bearbeitet haben, und bereits beantwortete Diagnose-Aufgaben bleiben erhalten.

Die Aufgaben wurden mit `scripts/serlo-import.mjs` aus Serlo (CC BY-SA 4.0) übernommen; Aufgabentexte: Niedersächsisches Kultusministerium.

## Installation auf einem Ubuntu-Server (Docker Compose)

➡️ **Ausführliche Schritt-für-Schritt-Anleitung: [UBUNTU.md](UBUNTU.md)**

1. Docker installieren und das Projekt holen:
   ```bash
   cd /opt/stacks
   git clone -b main https://github.com/rrmm94/mathematik.git mathematik
   ```
2. In `docker-compose.yml` mindestens `ADMIN_PASSWORD` ändern.
3. Starten:
   ```bash
   cd /opt/stacks/mathematik
   docker compose up -d --build
   ```
4. Im Browser öffnen: `http://<server-ip>:3141` → mit `admin` und deinem Passwort anmelden.
5. Unter **Einstellungen** den Chatbot-Link und die Prüfungstermine eintragen.

Der Container heißt `mathematik`, der Port im Browser ist `3141`.

**Update:** `cd /opt/stacks/mathematik && git pull origin main && docker compose up -d --build`

**Daten:** Datenbank und hochgeladene Bilder liegen im Unterordner `data` (`/opt/stacks/mathematik/data`). Für ein Backup den Container kurz stoppen und den Ordner `/opt/stacks/mathematik` sichern.

**Zugriff von außen / HTTPS:** Am besten hinter einen Reverse Proxy (z. B. Caddy oder Nginx Proxy Manager) mit Let's-Encrypt-Zertifikat stellen und dann `COOKIE_SECURE: "true"` setzen.

**iPad:** Die Seite lässt sich über „Teilen → Zum Home-Bildschirm“ wie eine App ablegen.

## Entwicklung
```bash
npm install
npm run dev      # API auf :3000, Oberfläche mit Hot-Reload auf :5173
npm run build    # Oberfläche bauen
npm start        # Produktion (liefert dist/ aus)
```
Technik: Node.js 22 (Express, eingebautes `node:sqlite`), React 19, Tailwind CSS 4, KaTeX. Alle Schriften und Bibliotheken werden lokal ausgeliefert (keine externen CDNs → DSGVO-freundlich).

### Aufbau
```
server/          API (auth, student, admin), Datenbank, Lernplan-Logik
server/seed/     Beispielinhalte: Themen, Skripte, Aufgaben-Generatoren
shared/          gemeinsam genutzt: Konstanten, Antwortprüfung
client/          React-Oberfläche (Schüler- und Admin-Bereich)
```
