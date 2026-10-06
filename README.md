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

Freitext-Aufgaben zählen im Diagnosetest nicht für die Stufe. Eine KI-Bewertung von Freitext ist in `server/ai.js` vorbereitet, aber noch nicht aktiv.

## Startinhalt
- 14 Themenbereiche mit Symbolen und Skript (Zahlen & Rechnen, Größen, Prozent & Zinsen, Zuordnungen, Terme & Gleichungen, Lineare Funktionen, Winkel & Flächen, Körper, Pythagoras, Statistik, Wahrscheinlichkeit, Quadratische Funktionen, Trigonometrie, Wachstum)
- Vollständiger Diagnosetest für 3 Abschlüsse (114 Aufgaben, je 3 Varianten)
- Übungspakete für jede Niveaustufe (305 Aufgaben, je 3 Varianten)
- Demo-Kurs (Kennungen `peter`, `lea`, `ali` – Passwort `demo1234`); abschaltbar mit `SEED_DEMO=false`

Alle Beispielinhalte können im Editor geändert oder gelöscht werden.

## Installation auf Unraid (Docker Compose)

➡️ **Ausführliche Schritt-für-Schritt-Anleitung: [UNRAID.md](UNRAID.md)**

1. Projektordner auf den Server kopieren nach `/mnt/user/appdata/mathematik` (oder per `git clone`).
2. In `docker-compose.yml` mindestens `ADMIN_PASSWORD` ändern.
3. Starten:
   ```bash
   docker compose up -d --build
   ```
4. Im Browser öffnen: `http://<server-ip>:3000` → mit `admin` und deinem Passwort anmelden.
5. Unter **Einstellungen** den Chatbot-Link und die Prüfungstermine eintragen.

**Daten:** Datenbank und hochgeladene Bilder liegen im Unterordner `data` (`/mnt/user/appdata/mathematik/data`). Für ein Backup einfach den Ordner `/mnt/user/appdata/mathematik` sichern.

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
