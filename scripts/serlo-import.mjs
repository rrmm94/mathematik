// Holt die Abschlussprüfungen (Niedersachsen) von Serlo und wandelt sie in das Aufgabenformat des Trainers um.
//
//   node scripts/serlo-import.mjs            # alles (Realschule, Hauptschule G-/E-Kurs, 2021–2026)
//   node scripts/serlo-import.mjs rs 2025    # nur ein Ausschnitt (Schule: rs | hs-g | hs-e, optional Jahr)
//
// Ergebnis: server/seed/exams/data/<schule>-<jahr>-<teil>.json und server/seed/exams/img/*
// Beides wird ins Repository eingecheckt – der Trainer braucht danach keinen Zugriff auf Serlo mehr.
// Die Inhalte stehen bei Serlo unter CC BY-SA 4.0 (siehe README, Abschnitt „Quellen und Lizenz“).
//
// Hinter einem Proxy: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=<ca-bundle> node scripts/serlo-import.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseNumber } from '../shared/checker.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'server/seed/exams');
const DATA = path.join(OUT, 'data');
const IMG = path.join(OUT, 'img');
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

const SCHOOLS = [
  { key: 'rs', id: 297604, label: 'Realschule' },
  { key: 'hs-e', id: 315308, label: 'Hauptschule E-Kurs' },
  { key: 'hs-g', id: 315309, label: 'Hauptschule G-Kurs' },
];

// ---------------------------------------------------------------- Netzwerk
const pageCache = new Map();
async function getJson(id) {
  if (pageCache.has(id)) return pageCache.get(id);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`https://de.serlo.org/${id}`, { redirect: 'follow' });
      const html = await res.text();
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!m) throw new Error(`keine Daten auf Seite ${id}`);
      const data = JSON.parse(m[1]).props.pageProps.pageData.taxonomyData;
      pageCache.set(id, data);
      return data;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

const images = new Map(); // url -> lokaler Dateiname (null = nicht ladbar)
const missingImages = new Set(); // Hosts, von denen Bilder fehlten
const badHosts = new Set(); // Hosts, die nicht erreichbar sind (kein erneutes Probieren)
const NO_IMG = '⟪BILD-FEHLT⟫';
async function localImage(url) {
  if (images.has(url)) return images.get(url);
  if (badHosts.has(new URL(url).host)) { images.set(url, null); return null; }
  const ext = (url.match(/\.(png|jpe?g|gif|svg|webp)(?:\?|$)/i) || [, 'png'])[1].toLowerCase();
  const name = `${crypto.createHash('sha1').update(url).digest('hex').slice(0, 12)}.${ext}`;
  const file = path.join(IMG, name);
  if (!fs.existsSync(file)) {
    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        ok = true;
      } catch (e) {
        if (attempt === 1) { badHosts.add(new URL(url).host); missingImages.add(new URL(url).host); images.set(url, null); return null; }
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }
  images.set(url, name);
  return name;
}

// ---------------------------------------------------------------- Slate → Markdown
const esc = (t) => t.replace(/\\/g, '\\\\').replace(/([*_`$<>|~\[\]])/g, '\\$1').replace(/^(#|-|\+|\d+\.)(\s)/, '\\$1$2');

// Benachbarte Inline-Formeln (ohne Text dazwischen) werden zu einer Formel verbunden, sonst entsteht „$$“.
function mergeMath(nodes) {
  const out = [];
  for (const n of nodes) {
    const prev = out[out.length - 1];
    if (n.type === 'math' && n.inline !== false && prev?.type === 'math' && prev.inline !== false) out[out.length - 1] = { ...prev, src: `${prev.src || ''}${n.src || ''}` };
    else if (typeof n.text === 'string' && !n.text && prev?.type === 'math') continue; // leere Textknoten zwischen zwei Formeln
    else out.push(n);
  }
  return out;
}

function inline(nodes, ctx) {
  let out = '';
  for (const n of mergeMath(nodes)) {
    if (typeof n.text === 'string') {
      if (!n.text) continue;
      let t = esc(n.text);
      const [, pre, core, post] = t.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if (core) {
        if (n.strong) t = `${pre}**${core}**${post}`;
        else if (n.em) t = `${pre}*${core}*${post}`;
      }
      out += t;
    } else if (n.type === 'math') {
      const src = (n.src || '').trim().replace(/(^|[^\\])\\$/, '$1').trim(); // ein einzelner Backslash am Ende ist ungültig
      if (!src || /^\\rule/.test(src)) continue; // Schreiblinien entfallen
      out += n.inline === false ? `\n\n$$${src}$$\n\n` : `$${src}$`;
    } else if (n.type === 'textBlank') {
      ctx.blanks.push(blankPart(n));
      out += `⟦${ctx.blanks.length}⟧`;
    } else if (n.type === 'a') {
      const label = inline(n.children || [], ctx).trim();
      out += n.href ? `[${label || n.href}](${n.href})` : label;
    } else if (n.children) {
      out += inline(n.children, ctx);
    }
  }
  return out;
}

function slate(nodes, ctx) {
  const blocks = [];
  for (const n of nodes) {
    if (n.type === 'p') {
      const t = inline(n.children || [], ctx).replace(/[ \t]+/g, ' ').trim();
      if (t) blocks.push(t);
    } else if (n.type === 'h') {
      const t = inline(n.children || [], ctx).trim();
      if (t) blocks.push(`**${t.replace(/\*\*/g, '')}**`);
    } else if (n.type === 'unordered-list' || n.type === 'ordered-list') {
      const items = (n.children || []).map((li, i) => `${n.type === 'ordered-list' ? `${i + 1}.` : '-'} ${inline(li.children?.flatMap((c) => c.children || []) || [], ctx).trim()}`);
      blocks.push(items.join('\n'));
    } else if (n.children) {
      const t = inline(n.children, ctx).trim();
      if (t) blocks.push(t);
    }
  }
  return blocks.join('\n\n');
}

const SIGN = { equals: '=', 'greater-than': '>', 'less-than': '<', 'greater-than-or-equal': '\\ge', 'less-than-or-equal': '\\le', 'not-equal': '\\ne', 'almost-equal': '\\approx' };
const tex = (s) => String(s || '').replace(/[%#&_^~\\{}$]/g, ' ').trim();

async function plugin(p, ctx) {
  if (!p || typeof p !== 'object') return '';
  const st = p.state;
  switch (p.plugin) {
    case 'rows': {
      const parts = [];
      for (const c of st) {
        const t = await plugin(c, ctx);
        if (t) parts.push(t);
      }
      return parts.join('\n\n');
    }
    case 'text': return slate(st, ctx);
    case 'image': {
      if (!st?.src) return '';
      const name = await localImage(st.src);
      return name ? `![Abbildung](/uploads/ex-${name})` : NO_IMG;
    }
    case 'imageGallery': {
      const parts = [];
      for (const i of st.images || []) parts.push(await plugin(i.imagePlugin, ctx));
      return parts.filter(Boolean).join('\n\n');
    }
    case 'multimedia': return [await plugin(st.explanation, ctx), await plugin(st.multimedia, ctx)].filter(Boolean).join('\n\n');
    case 'serloTable': {
      const rows = [];
      for (const r of st.rows) {
        const cells = [];
        for (const c of r.columns) cells.push((await plugin(c.content, ctx)).replace(/\n+/g, ' ').replace(/\|/g, '\\|') || ' ');
        rows.push(cells);
      }
      if (!rows.length) return '';
      const head = rows[0];
      return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`)].join('\n');
    }
    case 'equations': {
      const lines = (st.steps || []).map((s) => {
        const tr = s.transform ? ` \\qquad |\\; ${s.transform}` : '';
        return `${s.left || ''} &${SIGN[s.sign] || '='} ${s.right || ''}${tr}`;
      });
      return lines.length ? `$$\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}$$` : '';
    }
    case 'box': {
      const title = (await plugin(st.title, ctx)).replace(/\n+/g, ' ');
      const body = await plugin(st.content, ctx);
      return `> ${title ? `**${title}**\n>\n> ` : ''}${body.replace(/\n/g, '\n> ')}`;
    }
    case 'spoiler': {
      const body = await plugin(st.content, ctx);
      return body ? `> **${st.title || 'Hinweis'}**\n>\n> ${body.replace(/\n/g, '\n> ')}` : '';
    }
    default: return '';
  }
}

// ---------------------------------------------------------------- Antworten
const ROUND_TRIP = (v) => Math.round(v * 1e9) / 1e9;

function cleanAnswer(raw) {
  return String(raw ?? '').replace(/\\(?:,|;|:|!| \s*)/g, ' ').replace(/\\%/g, '%').replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\(?:d)?frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2').replace(/[{}$]/g, '').trim();
}

// Zahl (mit evtl. Einheit dahinter) oder Text. Sobald mindestens eine der richtigen Antworten eine Zahl ist, zählen alle Zahlen
// (andere Schreibweisen wie „0,0193…“ oder „18 Mio.“ werden ignoriert bzw. auf die Zahl reduziert).
// Zahl am Anfang, danach höchstens eine Einheit („63,13 cm^3“, „18 Mio.“, „90 °“) – Terme wie „3x+1“ sind keine Zahl.
const NUM_RE = String.raw`-?\d{1,3}(?:[ .]\d{3})+(?:,\d+)?(?:\/-?\d[\d.,]*)?|-?\d[\d.,]*(?:\/-?\d[\d.,]*)?`;
function numericValue(v) {
  const m = v.replace(/−/g, '-').trim().match(new RegExp(`^(${NUM_RE})\\s*(.*)$`));
  if (!m) return NaN;
  const rest = m[2].trim();
  const unitOk = !rest || /^(?:[°%€²³]|[a-zA-Zäöüß]{2,}\.?|[a-wA-W]\^?[23]?|[a-zA-Z]{1,3}\^[23])\s*$/.test(rest);
  return unitOk ? parseNumber(m[1].replace(/\s+/g, '')) : NaN;
}

function answerPart(values, { label = '', unit = '' } = {}) {
  const cleaned = values.map(cleanAnswer).filter(Boolean);
  const nums = cleaned.map(numericValue).filter((n) => !Number.isNaN(n));
  if (nums.length) {
    const uniq = [...new Set(nums.map(ROUND_TRIP))];
    return { label, kind: 'number', value: uniq[0], tolerance: 0, unit, alternatives: uniq.slice(1) };
  }
  const alts = cleaned.slice(1);
  for (const v of cleaned) { const m = v.match(/^(?:y|f\(x\))\s*=\s*(.+)$/i); if (m) alts.push(m[1]); } // „y=5x+100“ auch ohne „y=“
  return { label, kind: 'text', value: cleaned[0] ?? '', tolerance: 0, unit, alternatives: [...new Set(alts)] };
}

const blankPart = (n) => ({ ...answerPart((n.correctAnswers || []).map((a) => a.answer)), _blank: true });

// ---------------------------------------------------------------- Themenzuordnung
const TOPICS = [
  ['Wachstum & Exponentialfunktionen', /wachstum|exponentiell/i],
  ['Trigonometrie & Ähnlichkeit', /sinus|kosinus|tangens|strahlensatz|vierstreckensatz|ähnlichkeit|steigungswinkel/i],
  ['Quadratische Funktionen & Gleichungen', /pq-formel|quadratisch|parabel|scheitel|nullstelle/i],
  ['Wahrscheinlichkeit', /baumdiagramm|pfadregel|wahrscheinlichkeit|gegenereignis|laplace|urnenmodell|mehrstufig|unabhängigkeit|vierfelder|zufall/i],
  ['Satz des Pythagoras', /pythagoras|rechtwinkliges dreieck$/i],
  ['Körper: Oberfläche & Volumen', /kugel|zylinder|kegel|pyramide|prisma|quader|würfel|kubus|körper|volumen|oberfläche|räumliche|dichte/i],
  ['Daten & Statistik', /durchschnitt|diagramm|schaubild|häufigkeit|mittelwert|median/i],
  ['Prozent & Zinsen', /prozent|grundwert|zins/i],
  ['Zuordnungen & Dreisatz', /dreisatz|proportional|zuordnung/i],
  ['Lineare Funktionen', /linear.* funktion|geradengleichung|steigung|gerade im koordinaten|y-achsenabschnitt|schnittpunkt|wertetabelle|graph einer funktion|^funktionen$|geraden/i],
  ['Terme, Gleichungen & Formeln', /äquivalenzumformung|gleichung|terme|variable|ausklammern|belegung/i],
  ['Winkel, Dreiecke & Flächen', /winkel|dreieck|rechteck|quadrat|parallelogramm|kreis|fläche(?!neinheit)|achsensymmetrie|spiegeln|zeichnen|lot|radius|pi$|koordinatensystem|figur/i],
  ['Größen & Einheiten', /einheit|umrechnen|größen|maßstab|längen|gewicht|zeit/i],
  ['Zahlen & Rechnen', /grundrechenart|multiplikation|division|addition|subtraktion|rechenregel|punkt- vor|brüche|bruch|dezimal|runden|zehnerpotenz|potenz|zahlengerade|klammern|schriftlich|zerlegungs/i],
];
const TEXT_HINTS = [
  [/wahrscheinlichkeit|glücksrad|baumdiagramm|würfel(?!n)|zufällig/i, 'Wahrscheinlichkeit'],
  [/pythagoras|leiter/i, 'Satz des Pythagoras'],
  [/sinus|kosinus|tangens|winkel.*berechne|strahlensatz/i, 'Trigonometrie & Ähnlichkeit'],
  [/prozent|rabatt|zinsen|mehrwertsteuer|%/i, 'Prozent & Zinsen'],
  [/volumen|oberfläche|zylinder|kugel|kegel|pyramide|prisma/i, 'Körper: Oberfläche & Volumen'],
  [/durchschnitt|diagramm|umfrage|mittelwert|median/i, 'Daten & Statistik'],
  [/funktionsgleichung|gerade|koordinatensystem/i, 'Lineare Funktionen'],
  [/gleichung|term/i, 'Terme, Gleichungen & Formeln'],
  [/winkel|dreieck|fläche|umfang|kreis/i, 'Winkel, Dreiecke & Flächen'],
  [/umrechn|einheit|\bkm\b|\bkg\b|liter/i, 'Größen & Einheiten'],
];
// Allgemeine Verweise, die nichts über das Thema verraten (z. B. „Wertetabelle“ bei einer Parabel)
const WEAK = /wertetabelle|graph einer funktion|^funktionen$|koordinatensystem|diagramm|schnittpunkt|wie wertet|parallele geraden zeichnen|lot zeichnen|zahlengerade/i;
function topicOf(prereqs, text, groupTopic = null) {
  if (groupTopic && prereqs.every((p) => WEAK.test(p))) return groupTopic;
  const votes = {};
  for (const p of prereqs) {
    const hit = TOPICS.find(([, re]) => re.test(p));
    if (hit) votes[hit[0]] = (votes[hit[0]] || 0) + 1;
  }
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  if (best) return best[0];
  const hint = TEXT_HINTS.find(([re]) => re.test(text));
  return hint ? hint[1] : 'Zahlen & Rechnen';
}

// ---------------------------------------------------------------- Aufgaben umwandeln
// Punkte stehen als „[2 Pkte]“, „(2 Pkt.)“ oder „(1 BE)“ im Text (im Markdown sind eckige Klammern maskiert)
const POINTS_RE = /\s*(?:\*\*)?\\?[\[(]\s*(\d+)\s*(?:Pkte|Pkt|BE|P)\.?\s*\\?[\])](?:\*\*)?/gi;
function takePoints(md) {
  let points = 0;
  const cleaned = md.replace(POINTS_RE, (_, n) => { if (!points) points = Number(n); return ''; });
  return { md: cleaned.replace(/^\*\*(?:Wahl)?[Aa]ufgabe\s*\d+[^*]*\*\*\s*/, '').replace(/\n{3,}/g, '\n\n').trim(), points };
}

function findPrereqs(o, acc = []) {
  if (Array.isArray(o)) o.forEach((x) => findPrereqs(x, acc));
  else if (o && typeof o === 'object') {
    if (o.plugin === 'solution' && o.state?.prerequisite?.title) acc.push(o.state.prerequisite.title.trim());
    Object.values(o).forEach((x) => findPrereqs(x, acc));
  }
  return acc;
}

async function solutionMd(sol, ctx) {
  if (!sol || sol.plugin !== 'solution') return '';
  const strategy = await plugin(sol.state.strategy, ctx);
  const steps = await plugin(sol.state.steps, ctx);
  return [strategy && `*${strategy.replace(/\n+/g, ' ')}*`, steps].filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

const DRAW_RE = /\b(verbinde|zeichne|zeichnen|markiere|markieren|färbe|schraffiere|konstruiere|miss|messe|male|schneide)\b|trage .{0,60}\bein\b|(ergänze|vervollständige).{0,70}(im|in der|in dem|im\b).{0,30}(koordinatensystem|diagramm|baumdiagramm|zeichnung|skizze|säulendiagramm|netz)|verbinde.{0,40}punkte|kreuze.{0,40}körper/i;

async function convertSub(ex, label, many) {
  const ctx = { blanks: [] };
  const st = ex.state;
  const inter = st.interactive;
  const kind = inter?.plugin || 'frei';
  const out = { label: many ? label : '', kind, skip: null };
  if (kind === 'h5p') return { ...out, skip: 'h5p' };

  let content = await plugin(st.content, ctx);
  if (/\{\{injection\}\}/.test(content)) return { ...out, skip: 'injection' };
  const { md: base, points } = takePoints(content);
  let prompt = base;

  let answer = { type: 'free', sample: '' };
  if (kind === 'blanksExercise') {
    const text = await plugin(inter.state.text, ctx);
    const t = takePoints(text);
    prompt = [prompt, t.md].filter(Boolean).join('\n\n');
    answer = { type: 'fields', inline: true, parts: ctx.blanks.map(({ _blank, ...p }) => p) };
    if (!answer.parts.length) answer = { type: 'free', sample: '' };
  } else if (kind === 'scMcExercise') {
    const options = [];
    for (const a of inter.state.answers || []) {
      const c = { blanks: [] };
      options.push({ text: (await plugin(a.content, c)).replace(/\n+/g, ' ').trim(), correct: !!a.isCorrect });
    }
    answer = { type: 'choice', multiple: !inter.state.isSingleChoice, options };
  } else if (kind === 'inputExercise') {
    const correct = (inter.state.answers || []).filter((a) => a.isCorrect).map((a) => a.value);
    const unit = (inter.state.unit || '').trim();
    const part = answerPart(correct, { unit });
    answer = { type: 'fields', parts: [part] };
  }

  const sol = await solutionMd(st.solution, ctx);
  if (answer.type === 'free') {
    answer.sample = sol.replace(/[*>$\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 600);
    if (DRAW_RE.test(prompt)) out.skip = 'zeichnen';
  }
  if (answer.type === 'fields' && DRAW_RE.test(prompt) && /\b(miss|messe)\b/i.test(prompt)) out.skip = 'messen';
  // Auch mit Lücken nicht lösbar, wenn erst etwas gezeichnet werden soll („Zeichne ein Koordinatensystem …“, „Verbinde …“)
  // Steht die Lücke aber in einer Tabelle („Vervollständige die Wertetabelle und zeichne den Graphen“), bleibt die Aufgabe und der Zeichenauftrag entfällt.
  if (answer.type !== 'free' && /\b(zeichne|zeichnen|verbinde|konstruiere|schraffiere|färbe)\b/i.test(prompt)) {
    if (/^\|.*⟦\d+⟧/m.test(prompt)) prompt = prompt.replace(/\s*(?:und|,)\s*(?:zeichne|zeichnen)\b[^.\n|]*\.?/i, '.').replace(/\.\./g, '.');
    else out.skip = out.skip || 'zeichnen';
  }
  if (!prompt.trim()) out.skip = out.skip || 'leer';
  if (answer.type === 'choice' && (answer.options.length < 2 || !answer.options.some((o) => o.correct))) out.skip = out.skip || 'Auswahl ohne richtige Antwort';
  if (answer.type === 'fields' && answer.parts.some((p) => p.value === '' || p.value == null)) out.skip = out.skip || 'leere Lösung';
  if (!sol && answer.type === 'free') out.skip = out.skip || 'ohne Lösung';
  return {
    ...out, prompt, answer, solution: sol, points,
    prereqs: [...new Set(findPrereqs(st.solution))],
  };
}

async function convertFolder(folder, meta) {
  const groups = [];
  let no = 0;
  for (const e of folder.exercisesContent) {
    no++;
    const o = e.exerciseOrGroup;
    const isGroup = o.plugin === 'exerciseGroup';
    const gctx = { blanks: [] };
    const context = isGroup ? takePoints(await plugin(o.state.content, gctx)).md : '';
    const exs = isGroup ? o.state.exercises : [o];
    const subs = [];
    for (let i = 0; i < exs.length; i++) {
      const s = await convertSub(exs[i], `${String.fromCharCode(97 + i)})`, exs.length > 1);
      subs.push(s);
    }
    const groupPrereqs = subs.flatMap((s) => s.prereqs || []);
    const strong = {};
    for (const s of subs) for (const p of s.prereqs || []) if (!WEAK.test(p)) { const t = topicOf([p], ''); strong[t] = (strong[t] || 0) + 1; }
    const groupTopic = Object.entries(strong).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    for (const s of subs) {
      s.topic = topicOf(s.prereqs?.length ? s.prereqs : groupPrereqs, `${context} ${s.prompt || ''}`, groupTopic);
      delete s.prereqs;
    }
    for (const s of subs) {
      if ((context + (s.prompt || '')).includes(NO_IMG)) s.skip = s.skip || 'Bild fehlt';
      if (s.solution) s.solution = s.solution.split(NO_IMG).join('').trim();
      if (s.prompt) s.prompt = s.prompt.split(NO_IMG).join('').trim();
    }
    groups.push({ no, context: context.split(NO_IMG).join('').trim(), subs });
  }
  return { ...meta, groups };
}

// ---------------------------------------------------------------- Baum durchlaufen
async function walk(id, trail, found) {
  const t = await getJson(id);
  const title = (t.title || '').trim();
  const here = [...trail, title];
  for (const c of [...(t.subterms || []), ...(t.exercises || [])]) {
    if ((t.exercises || []).includes(c)) found.push({ id: c.id, title: c.title.trim(), trail: here });
    else await walk(c.id, here, found);
  }
}

const [onlySchool, onlyYear] = process.argv.slice(2);
const slug = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '');
const summary = [];
for (const school of SCHOOLS) {
  if (onlySchool && school.key !== onlySchool) continue;
  const folders = [];
  await walk(school.id, [], folders);
  for (const f of folders) {
    const year = Number(f.trail.find((x) => /^\d{4}$/.test(x)));
    if (onlyYear && String(year) !== onlyYear) continue;
    const data = await getJson(f.id);
    const meta = { school: school.key, schoolLabel: school.label, year, part: f.title, folderId: f.id, url: `https://de.serlo.org${data.alias || `/${f.id}`}` };
    const conv = await convertFolder(data, meta);
    const file = path.join(DATA, `${school.key}-${year}-${slug(f.title)}.json`);
    fs.writeFileSync(file, JSON.stringify(conv, null, 1));
    const subs = conv.groups.flatMap((g) => g.subs);
    summary.push({ file: path.basename(file), groups: conv.groups.length, subs: subs.length, skipped: subs.filter((s) => s.skip).length });
    console.log(`${path.basename(file).padEnd(28)} ${String(conv.groups.length).padStart(2)} Aufgaben, ${String(subs.length).padStart(3)} Teilaufgaben, ${subs.filter((s) => s.skip).length} übersprungen`);
  }
}
console.log(`\nFertig: ${summary.length} Dateien, ${summary.reduce((a, s) => a + s.subs, 0)} Teilaufgaben, ${[...images.values()].filter(Boolean).length} Bilder.`);
if (missingImages.size) console.log(`ACHTUNG: Bilder von ${[...missingImages].join(', ')} nicht erreichbar – betroffene Aufgaben sind übersprungen. Host freigeben und das Skript erneut starten.`);
