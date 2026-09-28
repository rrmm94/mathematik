# Mathe-Coach – Lernplattform für die Mathe-Abschlussprüfung

Eine Lernplattform für die Oberschule (Haupt- und Realschulzweig), mit der sich Schülerinnen und Schüler selbstständig auf die Mathematik-Abschlussprüfung vorbereiten. Die Inhalte orientieren sich an den niedersächsischen Abschlussarbeiten (HS 9, HS 10 jeweils G/E, RS).

## Funktionen

### Für die Kinder
- **Login mit Kennung + Passwort** (vergeben durch die Lehrkraft, keine E-Mail-Adressen)
- **Erster Login:** Jahrgang (9/10) und Ziel wählen
  - Kl. 9: Hauptschulabschluss **oder Ziel Realschulabschluss** (dann Aufgaben überwiegend auf E-Kurs-Niveau)
  - Kl. 10: Hauptschulabschluss, Realschulabschluss, erweiterter Realschulabschluss
- **Einstiegstest (Diagnose):** je Thema 3 Aufgaben (leicht/mittel/schwer), pausierbar, ohne Richtig/Falsch-Rückmeldung
- **Animation „Dein Lernplan wird erstellt …“** nach dem Test
- **Individueller Lernplan:** schwächste Themen zuerst, alle Themen frei wählbar, Fortschrittsbalken je Thema
- **Übungspakete** mit Eingabefeldern, Multiple Choice oder Freitext; unbegrenzte Versuche, Tipp, Lösung auf Wunsch, „Neue Zahlen“ (Varianten)
- **„Skript“-Button** an jeder Aufgabe springt zum passenden Abschnitt im interaktiven Skript
- **Startseite:** Ziel, Countdown bis zur Prüfung, Lernplan, Feedback der Lehrkraft, nächste Termine
- **„Benötigst du Hilfe?“** oben rechts auf allen Seiten (Link zum KI-Chatbot)
- **Wiederholungstest** (wenn freigegeben): zeigt, in welchen Themen man sich verbessert hat
- Die **Niveaustufe ist für Kinder nirgends sichtbar** – auch nicht in den Daten, die an den Browser gehen.

### Für die Lehrkraft (`/admin`)
- **Kurse & Kinder** anlegen (mehrere Namen auf einmal, Zugangsdaten druckbar), Jahrgang/Ziel/G-E-Kurs bearbeiten, Passwort zurücksetzen
- **Detailansicht je Kind:**
  - Diagnose-Ergebnis je Aufgabe inkl. Antwort und **Bearbeitungszeit**
  - berechnete Niveaustufe je Thema (Basis / Mindest / Regel / Experte)
  - Lernplan anpassen: **Reihenfolge per Drag & Drop**, **mehrere Stufen gleichzeitig freischalten**
  - Fortschritt, **Anzahl der Versuche und Zeit je Übungsaufgabe**, „Lösung angesehen“
  - Vergleich Einstiegstest ↔ Wiederholungstest, Stufen per Klick übernehmen
  - **Feedback je Thema**
- **Diagnosetest-Editor:** je Profil und Thema die Aufgaben leicht/mittel/schwer
- **Übungsaufgaben-Editor:** Themen → Übungspakete (je Niveaustufe) → Aufgaben
- **Aufgaben-Editor:** Freitext + **LaTeX** (`$…$`) mit Live-Vorschau, **Bilder und GeoGebra-SVG** (Hochladen, Einfügen per Drag & Drop oder Zwischenablage), **mehrere Varianten** (Tabs), Musterlösung, Lösungsweg, Tipp, Test „als Kind“
- **Skript-Editor:** Abschnitte aus Bausteinen – Text/LaTeX, Bild/SVG, YouTube-Video (datenschutzfreundlich eingebettet), Link mit **QR-Code**
- **Themenbereiche** anlegen/sortieren, Symbol und Farbe wählen, Zuordnung zu Abschlüssen
- **Termine** (Input-Veranstaltungen) je Kurs
- **Einstellungen:** Chatbot-Link, Prüfungstermine je Abschluss (Countdown)

### Niveaustufen
| Richtige Diagnose-Aufgaben (von 3) | Stufe | entspricht |
|---|---|---|
| 0 | Basisstandard | G-Kurs |
| 1 (die leichte) | Mindeststandard | G-Kurs |
| 2 | Regelstandard | E-Kurs |
| 3 | Expertenstandard | E-Kurs |

Freitext-Aufgaben zählen im Diagnosetest nicht für die Stufe. Eine KI-Bewertung von Freitext ist in `server/ai.js` vorbereitet, aber noch nicht aktiv.

## Startinhalt
- 14 Themenbereiche mit Symbolen und Skript (Zahlen & Rechnen, Größen, Prozent & Zinsen, Zuordnungen, Terme & Gleichungen, Lineare Funktionen, Winkel & Flächen, Körper, Pythagoras, Statistik, Wahrscheinlichkeit, Quadratische Funktionen, Trigonometrie, Wachstum)
- Vollständiger Diagnosetest für 5 Profile (168 Aufgaben, je 3 Varianten)
- Übungspakete für jede Niveaustufe (305 Aufgaben, je 3 Varianten)
- Demo-Kurs (Kennungen `peter`, `lea`, `ali`, `mia` – Passwort `demo1234`); abschaltbar mit `SEED_DEMO=false`

Alle Beispielinhalte können im Editor geändert oder gelöscht werden.

## Installation auf Unraid (Docker Compose)

1. Projektordner auf den Server kopieren (z. B. `/mnt/user/appdata/mathe-coach-src`), oder per `git clone`.
2. In `docker-compose.yml` mindestens `ADMIN_PASSWORD` ändern.
3. Starten:
   ```bash
   docker compose up -d --build
   ```
4. Im Browser öffnen: `http://<server-ip>:3000` → mit `admin` und deinem Passwort anmelden.
5. Unter **Einstellungen** den Chatbot-Link und die Prüfungstermine eintragen.

**Daten:** Datenbank und hochgeladene Bilder liegen im Volume (`/mnt/user/appdata/mathe-coach`). Für ein Backup einfach diesen Ordner sichern.

**Zugriff von außen / HTTPS:** Am besten hinter einen Reverse Proxy (z. B. Nginx Proxy Manager oder SWAG auf Unraid) mit Let's-Encrypt-Zertifikat stellen und dann `COOKIE_SECURE: "true"` setzen.

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
