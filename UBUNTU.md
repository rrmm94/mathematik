# Mathematik-Prüfungstrainer auf einem Ubuntu-Server installieren

Diese Anleitung führt Schritt für Schritt durch die Installation per Docker Compose. Du brauchst etwa 15 Minuten.

Festlegungen in dieser Anleitung:

| | |
|---|---|
| Ordner auf dem Server | `/opt/stacks/mathematik` (Programmdateien **und** Daten der Kinder) |
| Port im Browser | `3141` → `http://<IP-des-Servers>:3141` |
| Name des Containers | `mathematik` |

## 1. Docker installieren (einmalig)

```bash
sudo apt update
sudo apt install -y git curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```
Danach einmal ab- und wieder anmelden (damit `docker` ohne `sudo` funktioniert). Prüfen:
```bash
docker --version
docker compose version
```

## 2. Programmdateien holen

```bash
sudo mkdir -p /opt/stacks
sudo chown $USER:$USER /opt/stacks
cd /opt/stacks
git clone -b main https://github.com/rrmm94/mathematik.git mathematik
```
Bei einem privaten Repository fragt git nach Benutzername und einem **Personal Access Token** (GitHub → Settings → Developer settings → Tokens) statt des Passworts.

## 3. Einstellungen anpassen

```bash
cd /opt/stacks/mathematik
nano docker-compose.yml
```

| Eintrag | Bedeutung |
|---|---|
| `ADMIN_PASSWORD` | **Unbedingt ändern!** Dein Passwort für den Lehrkraft-Zugang (Benutzer: `admin`). |
| `SEED_DEMO` | Steht auf `"false"`: Es wird kein Demo-Kurs angelegt. Zum Ausprobieren `"true"` setzen (Beispielkinder `peter`, `lea`, `ali`, Passwort `demo1234`). |
| `ports: "3141:3000"` | Die **linke** Zahl ist der Port im Browser. Die rechte nicht ändern. |
| `volumes: ./data:/data` | Datenbank und hochgeladene Bilder liegen in `/opt/stacks/mathematik/data`. |

In `nano`: speichern mit `Strg+O`, `Enter`, beenden mit `Strg+X`.

## 4. Starten

```bash
cd /opt/stacks/mathematik
docker compose up -d --build
```
Beim ersten Mal dauert das ein paar Minuten. Der Container `mathematik` startet danach automatisch mit dem Server (`restart: unless-stopped`).

Prüfen, ob alles läuft:
```bash
docker ps
docker logs mathematik
```
Dort sollte stehen: `Originalaufgaben eingebunden: 170 Übungspakete, 906 Aufgaben, …` und `Mathematik-Prüfungstrainer läuft auf http://localhost:3000` (das ist der Port **im** Container; von außen gilt 3141).

Falls eine Firewall aktiv ist (`sudo ufw status`):
```bash
sudo ufw allow 3141/tcp
```

## 5. Erste Anmeldung

1. Im Browser öffnen: `http://<IP-des-Servers>:3141` (die IP zeigt `hostname -I`).
2. Anmelden mit `admin` und deinem Passwort.
3. **Einstellungen** öffnen:
   - Link zum KI-Chatbot eintragen („Benötigst du Hilfe?“-Button)
   - Prüfungstermine je Abschluss eintragen (für den Countdown)
4. **Kurse & Kinder** → Kurs anlegen → „Kinder hinzufügen“ → Namen einfügen, Startpasswort für alle eintippen → Zugangsdaten ausdrucken.

Auf dem iPad: Seite in Safari öffnen → **Teilen → Zum Home-Bildschirm**. Dann startet der Mathematik-Prüfungstrainer wie eine App.

## 6. Update auf eine neue Version

Deine Daten (Kinder, Aufgaben, Fortschritt) bleiben dabei erhalten. Neue Inhalte werden beim Start automatisch nachgezogen.
```bash
cd /opt/stacks/mathematik
git pull origin main
docker compose up -d --build
docker image prune -f      # optional: alte Images aufräumen
```
Hast du in `docker-compose.yml` das Passwort geändert und meldet `git pull` einen Konflikt, sichere die Datei (`cp docker-compose.yml ../compose-backup.yml`), hole die neue (`git checkout docker-compose.yml`, `git pull origin main`) und trage deine Werte wieder ein.

## 7. Datensicherung

Alles Wichtige liegt in **`/opt/stacks/mathematik`**: die Daten in `data` (Datenbank `mathe.db` + Ordner `uploads`) und deine `docker-compose.yml`.

Sicherung von Hand (Container kurz anhalten, damit die Datenbank konsistent ist):
```bash
cd /opt/stacks/mathematik
docker compose stop
sudo tar czf ~/mathematik-backup-$(date +%F).tar.gz data docker-compose.yml
docker compose start
```
Das lässt sich per `cron` automatisieren. Lege die Sicherung außerdem auf einem **anderen** Datenträger oder Rechner ab.

Zurückspielen: `docker compose stop`, Ordner `data` ersetzen, `docker compose start`.

## 8. Zugriff von zu Hause (optional)

Solange nichts weiter eingerichtet ist, funktioniert die Plattform **nur im Heim-/Schulnetz**. Damit die Kinder auch von zu Hause üben können:

- **Empfohlen:** Reverse Proxy mit HTTPS, z. B. **Caddy** oder **Nginx Proxy Manager** + eigene (Sub-)Domain + Let's-Encrypt-Zertifikat. Weiterleitung auf `http://<Server-IP>:3141`.
- Alternativ: **Cloudflare Tunnel** (ohne Portfreigabe am Router).
- Danach in `docker-compose.yml` `COOKIE_SECURE: "true"` setzen und neu starten (`docker compose up -d`).
- **Nie** Port 3141 direkt ohne HTTPS im Router freigeben.
- Datenschutz: Die Plattform speichert nur Namen, Kennungen und Lernstände. Kläre den Betrieb trotzdem kurz mit der Schulleitung bzw. dem Datenschutzbeauftragten ab.

## Hilfe bei Problemen

| Problem | Lösung |
|---|---|
| Seite lädt nicht | `docker ps` → läuft `mathematik`? Sonst `docker logs mathematik` ansehen. Firewall: `sudo ufw allow 3141/tcp`. |
| „port is already allocated“ | Anderen Port links in `ports:` wählen (z. B. `"3142:3000"`), dann `docker compose up -d`. |
| „permission denied“ bei `docker` | Ab- und wieder anmelden (Gruppe `docker`) oder `sudo docker …` verwenden. |
| Admin-Passwort vergessen | In `docker-compose.yml` neues `ADMIN_PASSWORD` eintragen und `ADMIN_RESET: "true"` setzen → `docker compose up -d` → anmelden → `ADMIN_RESET` wieder auf `"false"` setzen und erneut `docker compose up -d`. |
| Kind hat Passwort vergessen | Admin → Kurse & Kinder → Schlüssel-Symbol beim Kind → neues Passwort eintippen. |
| Alles neu anfangen | `docker compose down`, Ordner `/opt/stacks/mathematik/data` löschen, neu starten. **Achtung: löscht alle Daten!** |
