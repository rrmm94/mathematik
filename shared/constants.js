// Gemeinsame Konstanten für Server und Oberfläche.

// Prüfungsprofile: ergeben sich aus Jahrgang + angestrebtem Abschluss.
export const PROFILES = {
  HS9: { label: 'Hauptschulabschluss nach Klasse 9', short: 'HS 9', grade: 9 },
  RS9: { label: 'Ziel Realschulabschluss (Klasse 9)', short: 'Ziel RS', grade: 9 },
  HS10: { label: 'Hauptschulabschluss nach Klasse 10', short: 'HS 10', grade: 10 },
  RS10: { label: 'Realschulabschluss', short: 'RS 10', grade: 10 },
  ERS10: { label: 'Erweiterter Realschulabschluss', short: 'erw. RS', grade: 10 },
};
export const PROFILE_KEYS = Object.keys(PROFILES);

// Auswahl beim ersten Login, je Jahrgang.
export const GOAL_OPTIONS = {
  9: [
    { profile: 'HS9', title: 'Hauptschulabschluss', text: 'Ich schreibe am Ende von Klasse 9 die Hauptschulprüfung.' },
    { profile: 'RS9', title: 'Realschulabschluss', text: 'Mein Ziel ist der Realschulabschluss nach Klasse 10 – ich übe schon jetzt dafür.' },
  ],
  10: [
    { profile: 'HS10', title: 'Hauptschulabschluss', text: 'Ich schreibe am Ende von Klasse 10 die Hauptschulprüfung.' },
    { profile: 'RS10', title: 'Realschulabschluss', text: 'Ich schreibe die Realschulprüfung.' },
    { profile: 'ERS10', title: 'Erweiterter Realschulabschluss', text: 'Ich möchte den erweiterten Realschulabschluss – mit Blick auf Oberstufe/Abitur.' },
  ],
};

// Niveaustufen – NUR für Lehrkräfte sichtbar.
export const LEVELS = [
  { id: 0, key: 'basis', label: 'Basisstandard', short: 'Basis', color: '#ef4444' },
  { id: 1, key: 'mindest', label: 'Mindeststandard', short: 'Mindest', color: '#f59e0b' },
  { id: 2, key: 'regel', label: 'Regelstandard', short: 'Regel', color: '#3b82f6' },
  { id: 3, key: 'experte', label: 'Expertenstandard', short: 'Experte', color: '#10b981' },
];

export const DIFFICULTIES = [
  { id: 1, label: 'leicht' },
  { id: 2, label: 'mittel' },
  { id: 3, label: 'schwer' },
];

// Symbole für Themen (Namen aus lucide-react).
export const TOPIC_ICONS = [
  'Calculator', 'Ruler', 'Percent', 'ArrowLeftRight', 'Variable', 'TrendingUp', 'Triangle',
  'Box', 'Pyramid', 'BarChart3', 'Dices', 'Spline', 'Compass', 'Rocket', 'Sigma', 'Pi',
  'Coins', 'Clock', 'Shapes', 'Grid3x3', 'LineChart', 'Scale', 'Cylinder', 'Radical', 'TriangleRight', 'SquareFunction', 'ChartColumn',
];

export const TOPIC_COLORS = ['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet', 'teal', 'orange', 'cyan', 'fuchsia', 'lime', 'blue', 'pink', 'red'];
