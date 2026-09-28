// Vorbereitung für eine spätere KI-Bewertung von Freitext-Antworten.
//
// Aktivierung (später): In den Einstellungen "ai_check_enabled" setzen und eine
// API anbinden. Diese Funktion wird dann in checker.js für type === 'free'
// aufgerufen und liefert eine Einschätzung { score: 0..1, comment: '...' }.
//
// Bis dahin gilt: Freitext wird nicht automatisch bewertet. Die Kinder sehen
// die Musterlösung zum Selbstvergleich, die Lehrkraft sieht die Antworten.

export async function assessFreeText(/* { prompt, sample, answer } */) {
  return null; // noch nicht aktiv
}
