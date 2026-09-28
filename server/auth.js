import crypto from 'node:crypto';
import { get, run } from './db.js';

const SESSION_DAYS = 30;
export const COOKIE = 'mathe_session';

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(String(pw), salt, 64);
  const ref = Buffer.from(hash, 'hex');
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}

// Leicht lesbare Startpasswörter (ohne verwechselbare Zeichen).
export function generatePassword() {
  const words = ['mathe', 'zahl', 'kreis', 'prisma', 'winkel', 'summe', 'kegel', 'punkt', 'gerade', 'wurzel', 'bruch', 'term'];
  const w = words[crypto.randomInt(words.length)];
  return `${w}${crypto.randomInt(1000, 9999)}`;
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', token, userId, Date.now() + SESSION_DAYS * 864e5);
  return token;
}

export function destroySession(token) {
  run('DELETE FROM sessions WHERE token = ?', token);
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function setSessionCookie(res, token) {
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure}`);
}
export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function loadUser(req, _res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  req.sessionToken = token;
  if (token) {
    const s = get('SELECT * FROM sessions WHERE token = ?', token);
    if (s && s.expires_at > Date.now()) {
      req.user = get('SELECT * FROM users WHERE id = ?', s.user_id);
    } else if (s) {
      destroySession(token);
    }
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  next();
}
export function requireStudent(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Nur für Schülerinnen und Schüler.' });
  next();
}
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Lehrkräfte.' });
  next();
}
