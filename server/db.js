import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_DIR = process.env.DATA_DIR || path.resolve('data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'mathe.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','student')),
  display_name TEXT NOT NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  grade INTEGER,                 -- 9 oder 10
  profile TEXT,                  -- HS9, RS9, HS10, RS10, ERS10
  ge_course TEXT,                -- 'G' / 'E' (nur Info für Lehrkraft)
  onboarded INTEGER DEFAULT 0,
  diag_unlocked INTEGER DEFAULT 1, -- darf (erneut) einen Diagnosetest starten
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'Sigma',
  color TEXT DEFAULT 'indigo',
  sort INTEGER DEFAULT 0,
  profiles TEXT DEFAULT '[]'     -- JSON: Profile, für die das Thema gilt
);

CREATE TABLE IF NOT EXISTS script_sections (
  id INTEGER PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  blocks TEXT DEFAULT '[]'       -- JSON: [{type:'text'|'image'|'video'|'link', ...}]
);

CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1,      -- 0 Basis .. 3 Experte
  profiles TEXT DEFAULT '[]',            -- JSON; leer = alle Profile
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('diagnose','practice')),
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
  profile TEXT,                  -- nur Diagnose
  difficulty INTEGER,            -- nur Diagnose: 1 leicht, 2 mittel, 3 schwer
  title TEXT DEFAULT '',
  script_section_id INTEGER REFERENCES script_sections(id) ON DELETE SET NULL,
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_variants (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sort INTEGER DEFAULT 0,
  prompt TEXT DEFAULT '',        -- Markdown + LaTeX
  answer TEXT DEFAULT '{}',      -- JSON-Spezifikation der Lösung
  solution TEXT DEFAULT '',      -- Lösungsweg (Markdown + LaTeX)
  hint TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS diag_runs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,       -- 1 = erster Test, 2.. = Wiederholungen
  profile TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS diag_items (
  id INTEGER PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES diag_runs(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES task_variants(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL,
  difficulty INTEGER,
  sort INTEGER NOT NULL,
  answer TEXT,
  correct INTEGER,               -- NULL = nicht automatisch bewertbar
  time_ms INTEGER DEFAULT 0,
  answered_at TEXT
);

CREATE TABLE IF NOT EXISTS plan_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  sort INTEGER NOT NULL,
  diag_level INTEGER,            -- Stufe laut Diagnose
  levels TEXT NOT NULL,          -- JSON: freigeschaltete Stufen, z. B. [1,2]
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  variant_id INTEGER,
  answer TEXT,
  correct INTEGER,
  time_ms INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 0,
  solved INTEGER DEFAULT 0,
  solution_viewed INTEGER DEFAULT 0,
  time_ms INTEGER DEFAULT 0,
  variant_id INTEGER,            -- aktuell zugeteilte Variante (Zufall pro Kind)
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, task_id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,            -- YYYY-MM-DD
  time TEXT DEFAULT '',
  room TEXT DEFAULT '',
  note TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY,
  filename TEXT NOT NULL,
  original TEXT,
  mime TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Hilfsfunktionen
export const all = (sql, ...p) => db.prepare(sql).all(...p);
export const get = (sql, ...p) => db.prepare(sql).get(...p);
export const run = (sql, ...p) => db.prepare(sql).run(...p);

let txDepth = 0;
export function tx(fn) {
  if (txDepth > 0) return fn(); // verschachtelt: äußere Transaktion übernimmt
  txDepth++;
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    txDepth--;
  }
}

export const json = (s, fallback = null) => {
  if (s == null || s === '') return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
};

export function getSetting(key, fallback = '') {
  const r = get('SELECT value FROM settings WHERE key = ?', key);
  return r ? r.value : fallback;
}
export function setSetting(key, value) {
  run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, String(value ?? ''));
}
