import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { get, run, UPLOAD_DIR } from './db.js';
import { loadUser, hashPassword } from './auth.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import adminRoutes from './routes/admin.js';
import { seedIfEmpty } from './seed/index.js';

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(loadUser);

// Admin-Konto beim ersten Start anlegen
if (!get("SELECT id FROM users WHERE role = 'admin'")) {
  const user = process.env.ADMIN_USER || 'admin';
  const pw = process.env.ADMIN_PASSWORD || 'admin1234';
  run("INSERT INTO users (username, password_hash, role, display_name, onboarded) VALUES (?, ?, 'admin', ?, 1)", user, hashPassword(pw), 'Lehrkraft');
  console.log(`Admin-Konto angelegt: ${user} (Passwort aus ADMIN_PASSWORD bzw. Standard "admin1234" – bitte ändern!)`);
}
// Notfall: Admin-Passwort zurücksetzen (ADMIN_RESET=true + ADMIN_PASSWORD setzen, Container neu starten)
if (process.env.ADMIN_RESET === 'true' && process.env.ADMIN_PASSWORD) {
  run("UPDATE users SET password_hash = ? WHERE role = 'admin'", hashPassword(process.env.ADMIN_PASSWORD));
  run("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')");
  console.log('Admin-Passwort wurde aus ADMIN_PASSWORD zurückgesetzt. Bitte ADMIN_RESET wieder entfernen.');
}
seedIfEmpty();

app.use('/api', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Unbekannte Anfrage.' }));

// Hochgeladene Dateien: SVGs dürfen keine Skripte ausführen
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(UPLOAD_DIR, { maxAge: '7d' }));

// Gebaute Oberfläche ausliefern
const dist = path.resolve('dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Serverfehler. Bitte später erneut versuchen.' });
});

app.listen(PORT, () => console.log(`Mathematik-Prüfungstrainer läuft auf http://localhost:${PORT}`));
