// Kurzbefehle aus den Prüfungsaufgaben (Einheiten), z. B. $5\,\cm^2$. \text funktioniert im Mathe- und im Textmodus.
const unit = (u) => `\\text{${u}}`;
export const KATEX_MACROS = {
  '\\m': unit('m'),
  '\\dm': unit('dm'),
  '\\cm': unit('cm'),
  '\\mm': unit('mm'),
  '\\km': unit('km'),
  '\\h': unit('h'),
  '\\l': unit('l'),
  '\\ml': unit('ml'),
};
