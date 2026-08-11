export interface ColorPalette {
  primary: string;
  secondary: string;
  surface: string;
  background: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  cardBg: string;
  completedSet: string;
  supersetTag: string;
}

export const DarkTheme: ColorPalette = {
  primary: '#9CB080',       // Accent principal / Validation
  secondary: '#618764',     // Éléments actifs
  surface: '#2B5748',       // Cartes & conteneurs
  background: '#273338',    // Background principal
  text: '#F0F4F1',          // Texte principal clair
  textMuted: '#A0B2A6',     // Texte secondaire
  border: '#3A6B5B',        // Bordures
  accent: '#9CB080',        // Boutons principaux
  success: '#9CB080',       // Validation série
  warning: '#E2B056',       // AMRAP / Warning
  danger: '#E56B6B',        // Suppression / Échec
  cardBg: '#2B5748',
  completedSet: '#1E4034',
  supersetTag: '#618764',
};

export const LightTheme: ColorPalette = {
  primary: '#EB7D00',       // Accent / Boutons d'action
  secondary: '#2C5745',     // Cartes & Bordures
  surface: '#FFFFFF',       // Surface des cartes
  background: '#EBE3A7',    // Background principal
  text: '#2E2910',          // Texte principal & Titres
  textMuted: '#665F3B',     // Texte secondaire
  border: '#D4CB8C',        // Bordures
  accent: '#EB7D00',        // Accent principal orange
  success: '#2C5745',       // Validation
  warning: '#D97706',       // AMRAP
  danger: '#DC2626',        // Danger
  cardBg: '#FDFBF2',
  completedSet: '#D8E8D5',
  supersetTag: '#2C5745',
};
