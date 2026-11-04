// Notenspiegel für die Prüfungen (Anteil der erreichten Punkte in Prozent).
export const GRADE_SCALE = [
  { grade: 1, label: 'sehr gut', min: 96 },
  { grade: 2, label: 'gut', min: 80 },
  { grade: 3, label: 'befriedigend', min: 60 },
  { grade: 4, label: 'ausreichend', min: 45 },
  { grade: 5, label: 'mangelhaft', min: 16 },
  { grade: 6, label: 'ungenügend', min: 0 },
];

// Bereich einer Note als Text, z. B. „80–95 %“
export function gradeRange(g) {
  const i = GRADE_SCALE.findIndex((x) => x.grade === g);
  const upper = i === 0 ? 100 : GRADE_SCALE[i - 1].min - 1;
  return `${GRADE_SCALE[i].min}–${upper} %`;
}

// Note aus Punkten. Der Prozentwert wird auf eine Nachkommastelle gerundet; Grenzen gelten ab dem vollen Prozent
// (95,9 % ist noch eine 2, 96 % eine 1).
export function gradeFor(points, max) {
  if (!max) return null;
  const percent = Math.round((points / max) * 1000) / 10;
  const g = GRADE_SCALE.find((x) => percent >= x.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
  return { ...g, percent, range: gradeRange(g.grade) };
}
