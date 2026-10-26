// Einstiegstest für die erweiterte Realschule (ERS10): leitet die Aufgaben aus den RS10-Aufgaben ab.
//
// Läuft einmalig beim Start. Für jede Diagnoseaufgabe von RS10 (Thema, Stufe, Reihenfolge, Titel, Skript-Abschnitt) wird die Aufgabe
// bei ERS10 neu angelegt. Die bisherigen ERS10-Diagnoseaufgaben werden dabei ersetzt (hängen Testergebnisse daran, bleiben die Aufgaben
// unter dem Profil „ERS10-alt“ erhalten, sie werden den Kindern aber nicht mehr angezeigt).
//
// Inhalt der neuen ERS10-Aufgabe:
// - Originalaufgaben aus Prüfung und Schulbuch von RS10 werden unverändert übernommen (auch deine eigenen Varianten).
// - Die erzeugten Varianten von RS10 werden durch schwierigere Fassungen mit vertiefender Teilaufgabe ersetzt (ers-gen-a.js, ers-gen-b.js),
//   sofern es zu (Thema, Stufe, Titel) eine solche Vorlage gibt.
// - Aufgaben ohne Vorlage werden vollständig von RS10 übernommen.
import { all, get, run, tx, getSetting, setSetting } from '../db.js';
import { rng } from './helpers.js';
import { distinct } from './diag-gls-wachstum.js';
import * as A from './ers-gen-a.js';
import * as B from './ers-gen-b.js';

const SETTING = 'ers_diagnose_v1';
const PATCH_SCHNITT = 'ers_patch_schnittpunkt_v1';

// Schlüssel: Thema|Stufe|Titel der RS10-Aufgabe → Liste von [Vorlage, Anzahl]
const Z = 'Zahlen & Rechnen', G = 'Größen & Einheiten', P = 'Prozent & Zinsen', T = 'Terme, Gleichungen & Formeln', D = 'Zuordnungen & Dreisatz', LF = 'Lineare Funktionen';
const GL = 'Lineare Gleichungssysteme', Q = 'Quadratische Funktionen & Gleichungen', W = 'Wachstum & Exponentialfunktionen', F = 'Winkel, Dreiecke & Flächen';
const PY = 'Satz des Pythagoras', TR = 'Trigonometrie & Ähnlichkeit', K = 'Körper: Oberfläche & Volumen', DS = 'Daten & Statistik', WS = 'Wahrscheinlichkeit';

export const AUTHORED = {
  [`${Z}|1|Brüche addieren`]: [[A.zahlenBrueche, 3]],
  [`${Z}|2|Runden und Vorzeichen`]: [[A.zahlenRunden, 3]],
  [`${Z}|3|Wissenschaftliche Schreibweise`]: [[A.zahlenWissenschaftlich, 3]],
  [`${G}|1|Zeitspannen`]: [[A.groessenZeit, 3]],
  [`${G}|2|Flächeneinheiten`]: [[A.groessenFlaeche, 3]],
  [`${G}|3|Volumen und Geschwindigkeit`]: [[A.groessenVolumen, 3]],
  [`${P}|1|Rabatt`]: [[A.prozentRabatt, 3]],
  [`${P}|2|Grundwert und Zinsen`]: [[A.prozentGrundwert, 3]],
  [`${P}|3|Zinseszins`]: [[A.prozentZinseszins, 3]],
  [`${T}|1|Gleichungen mit x auf beiden Seiten`]: [[A.termeGleichung, 3]],
  [`${T}|2|Gleichungen mit Klammern`]: [[A.termeKlammern, 3]],
  [`${T}|3|Formeln umstellen`]: [[A.termeFormel, 3]],
  [`${D}|1|Dreisatz (proportional)`]: [[A.dreisatzProp, 2]],
  [`${D}|2|Dreisatz (antiproportional)`]: [[A.dreisatzAnti, 3]],
  [`${D}|3|Mehrstufiger Dreisatz`]: [[A.dreisatzMehr, 3]],
  [`${LF}|1|Steigung aus zwei Punkten`]: [[A.linSteigung, 3]],
  [`${LF}|2|Nullstelle berechnen`]: [[A.linNullstelle, 3]],
  [`${LF}|3|Schnittpunkt zweier Geraden`]: [[A.linSchnittpunkt, 3]],
  [`${GL}|1|Gleichungssysteme lösen`]: [[A.glsGleichsetzen, 2], [A.glsEinsetzen, 2]],
  [`${GL}|2|Gleichungssysteme lösen`]: [[A.glsAddition, 3], [A.glsAnzahl, 1]],
  [`${GL}|3|Gleichungssysteme in Sachaufgaben`]: [[A.glsSachEintritt, 1], [A.glsSachMischung, 1], [A.glsSachTarif, 1]],
  [`${Q}|1|Quadratische Funktion - Wertetabelle`]: [[B.quadWertetabelle, 2]],
  [`${Q}|1|Rein quadratische Gleichungen`]: [[B.quadRein, 3]],
  [`${Q}|2|p-q-Formel`]: [[B.quadPQ, 3]],
  [`${Q}|3|Flugbahnen`]: [[B.quadFlug, 3]],
  [`${W}|1|Wachstumsfaktor identifizieren`]: [[B.wachstumFaktor, 3]],
  [`${W}|1|Verlauf erkennen`]: [[B.wachstumVerlauf, 3]],
  [`${W}|2|Exponentialfunktionen und Wertetabellen`]: [[B.wachstumTabelle, 2]],
  [`${W}|2|Exponentialfunktionen erkennen`]: [[B.wachstumGraph, 2]],
  [`${W}|3|Wachstums- und Zerfallsprozesse`]: [[B.wachstumHalbwert, 3]],
  [`${F}|1|Flächeninhalt Dreieck`]: [[B.flaecheDreieck, 3]],
  [`${F}|2|Kreis`]: [[B.flaecheKreis, 3]],
  [`${F}|3|Zusammengesetzte Figuren`]: [[B.flaecheZusammen, 3]],
  [`${PY}|1|Hypotenuse berechnen`]: [[B.pythHyp, 3]],
  [`${PY}|2|Kathete berechnen`]: [[B.pythKathete, 2]],
  [`${PY}|3|Komplexe Figuren`]: [[B.pythRaum, 2]],
  [`${TR}|1|Seiten mit Sinus berechnen`]: [[B.trigSeiten, 2]],
  [`${TR}|2|Winkel mit Tangens berechnen`]: [[B.trigWinkel, 2]],
  [`${TR}|3|Anwendungsaufgabe`]: [[B.trigTurm, 2]],
  [`${K}|1|Volumen einfache Figur`]: [[B.koerperZylinder, 2]],
  [`${K}|2|Oberfläche Zylinder`]: [[B.koerperOberflaeche, 2]],
  [`${K}|3|Komplexe Körper`]: [[B.koerperKegel, 2]],
  [`${DS}|1|Mittelwert aus Tabelle`]: [[B.datenMittelwert, 3]],
  [`${DS}|2|Relative Häufigkeit & Kreisdiagramm`]: [[B.datenKreis, 3]],
  [`${DS}|3|Fehlenden Wert bestimmen`]: [[B.datenFehlend, 3]],
  [`${WS}|1|Einfache Wahrscheinlichkeit`]: [[B.wahrscheinlichkeitWuerfel, 2]],
  [`${WS}|2|Zweistufig mit Zurücklegen`]: [[B.wahrscheinlichkeitZurueck, 3]],
  [`${WS}|2|Baumdiagramme`]: [[B.wahrscheinlichkeitBaum, 2]],
  [`${WS}|3|Gegenereignis`]: [[B.wahrscheinlichkeitGegen, 3]],
};

const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

// Erzeugt die schwierigeren Varianten zu einem Schlüssel (deterministisch)
export function authoredVariants(key) {
  const spec = AUTHORED[key];
  if (!spec) return null;
  const out = [];
  spec.forEach(([gen, count], si) => {
    const seed = hash(key) + si * 17;
    // wachstumGraph braucht den Index der Variante, die anderen nur den Zufall
    if (gen === B.wachstumGraph) { for (let i = 0; i < count; i++) out.push(gen(rng(seed + i), i)); return; }
    out.push(...distinct(gen, count, seed));
  });
  return out;
}

const COLS = 'prompt, context, points, answer, solution, hint, source';

// Nachbesserung: Bei „Schnittpunkt zweier Geraden“ wird nur der Schnittpunkt berechnet (ohne Zusatzfrage).
// Ersetzt bei ERS10 nur die erzeugten Varianten dieser Aufgabe, alles andere bleibt.
function patchSchnittpunkt() {
  if (getSetting(PATCH_SCHNITT, '')) return;
  const tasks = all("SELECT t.id FROM tasks t JOIN topics tp ON tp.id = t.topic_id WHERE t.kind = 'diagnose' AND t.profile = 'ERS10' AND tp.title = ? AND t.title = 'Schnittpunkt zweier Geraden'", LF);
  if (!tasks.length) return;
  tx(() => {
    for (const t of tasks) {
      const used = all('SELECT variant_id FROM diag_items WHERE task_id = ?', t.id).map((x) => x.variant_id);
      for (const v of all("SELECT id FROM task_variants WHERE task_id = ? AND source = ''", t.id)) if (!used.includes(v.id)) run('DELETE FROM task_variants WHERE id = ?', v.id);
      let sort = (get('SELECT MAX(sort) AS m FROM task_variants WHERE task_id = ?', t.id).m ?? -1) + 1;
      for (const v of authoredVariants(`${LF}|3|Schnittpunkt zweier Geraden`)) {
        run(`INSERT INTO task_variants (task_id, sort, ${COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, t.id, sort++, v.prompt, '', 0, JSON.stringify(v.answer), v.solution || '', v.hint || '', '');
      }
    }
    setSetting(PATCH_SCHNITT, '1');
  });
  console.log('Einstiegstest erw. RS: „Schnittpunkt zweier Geraden“ nachgebessert (nur Schnittpunkt).');
}

export function seedErsDiagnose() {
  if (getSetting(SETTING, '')) { patchSchnittpunkt(); return; }
  const rsTasks = all("SELECT t.*, tp.title AS topic FROM tasks t JOIN topics tp ON tp.id = t.topic_id WHERE t.kind = 'diagnose' AND t.profile = 'RS10' ORDER BY tp.sort, t.difficulty, t.sort, t.id");
  if (!rsTasks.length) return;
  let nTasks = 0, nCopied = 0, nNew = 0, nArchived = 0, nDeleted = 0;
  const unmatched = [];

  tx(() => {
    for (const t of all("SELECT id FROM tasks WHERE kind = 'diagnose' AND profile = 'ERS10'")) {
      if (get('SELECT COUNT(*) AS n FROM diag_items WHERE task_id = ?', t.id).n) { run("UPDATE tasks SET profile = 'ERS10-alt' WHERE id = ?", t.id); nArchived++; } else { run('DELETE FROM tasks WHERE id = ?', t.id); nDeleted++; }
    }
    for (const rs of rsTasks) {
      const id = Number(run(
        "INSERT INTO tasks (kind, topic_id, profile, difficulty, title, script_section_id, sort) VALUES ('diagnose', ?, 'ERS10', ?, ?, ?, ?)",
        rs.topic_id, rs.difficulty, rs.title, rs.script_section_id, rs.sort,
      ).lastInsertRowid);
      nTasks++;
      const key = `${rs.topic}|${rs.difficulty}|${rs.title}`;
      const harder = authoredVariants(key);
      if (!harder) unmatched.push(key);
      // Originalaufgaben (Prüfung, Schulbuch, eigene Varianten) bleiben; erzeugte und „Variante mit geänderten Zahlen“ werden ersetzt
      const keep = all('SELECT * FROM task_variants WHERE task_id = ? ORDER BY sort, id', rs.id)
        .filter((v) => !harder || (v.source && !v.source.startsWith('Variante mit geänderten Zahlen zu:')));
      let sort = 0;
      for (const v of keep) {
        run(`INSERT INTO task_variants (task_id, sort, ${COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, sort++, v.prompt, v.context, v.points, v.answer, v.solution, v.hint, v.source);
        nCopied++;
      }
      for (const v of harder || []) {
        run(`INSERT INTO task_variants (task_id, sort, ${COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, sort++, v.prompt, '', 0, JSON.stringify(v.answer), v.solution || '', v.hint || '', v.source || '');
        nNew++;
      }
    }
    setSetting(SETTING, '1');
    setSetting(PATCH_SCHNITT, '1'); // die neue Fassung ist schon enthalten
  });
  console.log(`Einstiegstest erw. RS aus RS10 abgeleitet: ${nTasks} Aufgaben, ${nCopied} Varianten übernommen, ${nNew} schwierigere Varianten neu (${nDeleted} alte Aufgaben ersetzt, ${nArchived} mit Testergebnissen als „ERS10-alt“ aufgehoben).`);
  if (unmatched.length) console.log(`  ohne schwierigere Vorlage, unverändert von RS10 übernommen: ${unmatched.join('; ')}`);
}
