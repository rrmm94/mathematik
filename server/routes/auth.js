import { Router } from 'express';
import { get, run, getSetting } from '../db.js';
import { verifyPassword, createSession, destroySession, setSessionCookie, clearSessionCookie } from '../auth.js';
import { PROFILES } from '../../shared/constants.js';

const r = Router();

// Einfacher Schutz gegen Durchprobieren von Passwörtern
const failures = new Map();

r.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const key = `${req.ip}|${String(username).toLowerCase()}`;
  const f = failures.get(key);
  if (f && f.count >= 8 && Date.now() - f.last < 5 * 60e3) {
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte warte ein paar Minuten.' });
  }
  const user = get('SELECT * FROM users WHERE username = ?', String(username).trim());
  if (!user || !verifyPassword(password, user.password_hash)) {
    failures.set(key, { count: (f?.count || 0) + 1, last: Date.now() });
    return res.status(401).json({ error: 'Kennung oder Passwort ist falsch.' });
  }
  failures.delete(key);
  run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', user.id);
  setSessionCookie(res, createSession(user.id));
  res.json({ user: publicUser(user) });
});

r.post('/logout', (req, res) => {
  if (req.sessionToken) destroySession(req.sessionToken);
  clearSessionCookie(res);
  res.json({ ok: true });
});

r.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null, chatbotUrl: getSetting('chatbot_url', '') });
});

export function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    role: u.role,
    profile: u.profile,
    goalLabel: u.profile ? PROFILES[u.profile]?.label : null,
    onboarded: !!u.onboarded,
    topicsAsked: !!u.topics_asked,
  };
}

export default r;
