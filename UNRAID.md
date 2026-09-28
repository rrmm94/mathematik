# Mathe-Coach auf Unraid installieren

Diese Anleitung führt dich Schritt für Schritt durch die Installation. Du brauchst etwa 15 Minuten.

## 1. Docker Compose nachrüsten (einmalig)

Unraid bringt Docker mit, aber nicht „Docker Compose“.

1. Unraid-Weboberfläche öffnen → Reiter **Apps** (Community Applications).
2. Nach **„Docker Compose Manager“** suchen und installieren.
3. Danach steht im Terminal der Befehl `docker compose` zur Verfügung.

## 2. Programmdateien auf den Server holen

**Variante A – per ZIP (am einfachsten):**
1. Auf GitHub das Repository `rrmm94/mathematik` öffnen, Branch **main** wählen → **Code → Download ZIP**.
2. ZIP entpacken und den Ordner über die Netzwerkfreigabe nach `appdata` kopieren und in `mathe-coach-src` umbenennen, sodass es diesen Pfad gibt:
   `/mnt/user/appdata/mathe-coach-src/docker-compose.yml`

**Variante B – per git im Unraid-Terminal** (Symbol `>_` oben rechts):
```bash
cd /mnt/user/appdata
git clone -b main https://github.com/rrmm94/mathematik.git mathe-coach-src
```
Falls `git` nicht gefunden wird, nimm Variante A. Bei einem privaten Repository fragt git nach Benutzername und einem **Personal Access Token** (GitHub → Settings → Developer settings → Tokens) statt des Passworts.

## 3. Einstellungen anpassen

Die Datei `/mnt/user/appdata/mathe-coach-src/docker-compose.yml` öffnen (z. B. im Terminal mit `nano`, oder über die Freigabe mit einem Texteditor):

| Eintrag | Bedeutung |
|---|---|
| `ADMIN_PASSWORD` | **Unbedingt ändern!** Dein Passwort für den Lehrkraft-Zugang (Benutzer: `admin`). |
| `SEED_DEMO` | `"true"` legt einen Demo-Kurs mit Beispielkindern an. Für den echten Einsatz `"false"`. |
| `ports: "3000:3000"` | Die **linke** Zahl ist der Port im Browser. Ist 3000 schon belegt, z. B. `"3080:3000"` eintragen. |
| `volumes` | Hier liegen Datenbank und hochgeladene Bilder: `/mnt/user/appdata/mathe-coach` |

In `nano`: speichern mit `Strg+O`, `Enter`, beenden mit `Strg+X`.

## 4. Starten

Im Unraid-Terminal:
```bash
cd /mnt/user/appdata/mathe-coach-src
docker compose up -d --build
```
Beim ersten Mal dauert das ein paar Minuten. Danach erscheint der Container **mathe-coach** im Reiter **Docker** und startet ab jetzt automatisch mit dem Server.

Prüfen, ob alles läuft:
```bash
docker logs mathe-coach
```
Dort sollte stehen: `Mathe-Abschluss-Coach läuft auf http://localhost:3000`.

## 5. Erste Anmeldung

1. Im Browser öffnen: `http://<IP-deines-Servers>:3000` (die IP steht oben rechts in der Unraid-Oberfläche).
2. Anmelden mit `admin` und deinem Passwort.
3. **Einstellungen** öffnen:
   - Link zum KI-Chatbot eintragen („Benötigst du Hilfe?“-Button)
   - Prüfungstermine je Abschluss eintragen (für den Countdown)
4. **Kurse & Kinder** → Kurs anlegen → „Kinder hinzufügen“ → Namen einfügen → Zugangsdaten ausdrucken.
5. Falls der Demo-Kurs angelegt wurde: Kurs löschen und die Demo-Kinder (peter, lea, ali, mia) entfernen.

Auf dem iPad: Seite in Safari öffnen → **Teilen → Zum Home-Bildschirm**. Dann startet der Mathe-Coach wie eine App.

## 6. Update auf eine neue Version

Deine Daten (Kinder, Aufgaben, Fortschritt) bleiben dabei erhalten.
```bash
cd /mnt/user/appdata/mathe-coach-src
git pull            # bei Variante A: stattdessen neues ZIP hineinkopieren (docker-compose.yml vorher sichern)
docker compose up -d --build
```

## 7. Datensicherung

Alles Wichtige liegt in **`/mnt/user/appdata/mathe-coach`** (Datenbank `mathe.db` + Ordner `uploads`).
- Am bequemsten mit dem Plugin **„Appdata Backup“** aus den Apps automatisch sichern lassen.
- Oder von Hand: Container kurz stoppen und den Ordner kopieren.

## 8. Zugriff von zu Hause (optional)

Solange nichts weiter eingerichtet ist, funktioniert die Plattform **nur im Heim-/Schulnetz**. Damit die Kinder auch von zu Hause üben können:

- **Empfohlen:** Reverse Proxy mit HTTPS, z. B. **Nginx Proxy Manager** (aus den Apps) + eigene (Sub-)Domain + Let's-Encrypt-Zertifikat. Weiterleitung auf `http://<Server-IP>:3000`.
- Alternativ: **Cloudflare Tunnel** (ohne Portfreigabe am Router).
- Danach in `docker-compose.yml` `COOKIE_SECURE: "true"` setzen und neu starten (`docker compose up -d`).
- **Nie** Port 3000 direkt ohne HTTPS im Router freigeben.
- Datenschutz: Die Plattform speichert nur Namen, Kennungen und Lernstände. Kläre den Betrieb trotzdem kurz mit der Schulleitung bzw. dem Datenschutzbeauftragten ab.

## Hilfe bei Problemen

| Problem | Lösung |
|---|---|
| Seite lädt nicht | `docker ps` → läuft `mathe-coach`? Sonst `docker logs mathe-coach` ansehen. |
| „port is already allocated“ | Anderen Port wählen (siehe Schritt 3), dann `docker compose up -d`. |
| Admin-Passwort vergessen | In `docker-compose.yml` neues `ADMIN_PASSWORD` eintragen und `ADMIN_RESET: "true"` setzen → `docker compose up -d` → anmelden → `ADMIN_RESET` wieder auf `"false"` setzen und erneut `docker compose up -d`. |
| Kind hat Passwort vergessen | Admin → Kurse & Kinder → Schlüssel-Symbol beim Kind. |
| Alles neu anfangen | Container stoppen, Ordner `/mnt/user/appdata/mathe-coach` löschen, neu starten. **Achtung: löscht alle Daten!** |
