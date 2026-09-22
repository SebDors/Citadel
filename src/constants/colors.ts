export type ThemeId =
  | 'citadel'
  | 'glacial'
  | 'chestnut'
  | 'amethyst'
  | 'onyx_teal'
  | 'emerald';
export type ThemeMode = 'dark' | 'light';

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

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  subtitle: string;
  description: string;
  dark: ColorPalette;
  light: ColorPalette;
  previewColors: {
    dark: [string, string, string, string]; // [bg, surface, accent, text]
    light: [string, string, string, string];
  };
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  citadel: {
    id: 'citadel',
    name: 'Citadel Original',
    subtitle: 'Kaki & Ardoise',
    description: 'La palette authentique de Citadel : nuances militaires épurées, kaki et ardoise.',
    previewColors: {
      dark: ['#273338', '#2B5748', '#9CB080', '#F0F4F1'],
      light: ['#EBE3A7', '#FFFFFF', '#EB7D00', '#2E2910'],
    },
    dark: {
      primary: '#9CB080',
      secondary: '#618764',
      surface: '#2B5748',
      background: '#273338',
      text: '#F0F4F1',
      textMuted: '#A0B2A6',
      border: '#3A6B5B',
      accent: '#9CB080',
      success: '#9CB080',
      warning: '#E2B056',
      danger: '#E56B6B',
      cardBg: '#2B5748',
      completedSet: '#1E4034',
      supersetTag: '#618764',
    },
    light: {
      primary: '#EB7D00',
      secondary: '#2C5745',
      surface: '#FFFFFF',
      background: '#EBE3A7',
      text: '#2E2910',
      textMuted: '#665F3B',
      border: '#D4CB8C',
      accent: '#EB7D00',
      success: '#2C5745',
      warning: '#D97706',
      danger: '#DC2626',
      cardBg: '#FDFBF2',
      completedSet: '#D8E8D5',
      supersetTag: '#2C5745',
    },
  },

  glacial: {
    id: 'glacial',
    name: 'Glacial Monolith',
    subtitle: 'Bleu Nuit & Acier',
    description: 'Structure monolithique imprenable : bleu nuit profond, cobalt sombre et acier givré.',
    previewColors: {
      dark: ['#0B132B', '#1C2541', '#4880C8', '#E0E6ED'],
      light: ['#EDF2F7', '#FFFFFF', '#1E3A8A', '#0B132B'],
    },
    dark: {
      background: '#0B132B',
      surface: '#1C2541',
      cardBg: '#1C2541',
      border: '#2D3D60',
      accent: '#4880C8',
      primary: '#4880C8',
      secondary: '#243354',
      text: '#E0E6ED',
      textMuted: '#7D8FA9',
      success: '#38B2AC',
      warning: '#E2A938',
      danger: '#E05D5D',
      completedSet: '#152238',
      supersetTag: '#2D3D60',
    },
    light: {
      background: '#EDF2F7',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#CBD5E1',
      accent: '#1E3A8A',
      primary: '#1E3A8A',
      secondary: '#E2E8F0',
      text: '#0B132B',
      textMuted: '#64748B',
      success: '#0D9488',
      warning: '#D97706',
      danger: '#DC2626',
      completedSet: '#DBEAFE',
      supersetTag: '#CBD5E1',
    },
  },

  chestnut: {
    id: 'chestnut',
    name: 'Chestnut & Kaki',
    subtitle: 'Terre Cuite & Kaki Minéral',
    description: 'Chaleur brute des éléments : rouge châtaigne patiné, beige kaki et albâtre.',
    previewColors: {
      dark: ['#1C1514', '#2A201F', '#8C271E', '#D9F7FA'],
      light: ['#D8DDDE', '#FFFFFF', '#8C271E', '#1C1514'],
    },
    dark: {
      background: '#1C1514',
      surface: '#2A201F',
      cardBg: '#2A201F',
      border: '#423432',
      accent: '#8C271E',
      primary: '#8C271E',
      secondary: '#3D302E',
      text: '#D9F7FA',
      textMuted: '#ABA194',
      success: '#7EA172',
      warning: '#ABA194',
      danger: '#BA3C30',
      completedSet: '#331E1C',
      supersetTag: '#423432',
    },
    light: {
      background: '#D8DDDE',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#CFCBCA',
      accent: '#8C271E',
      primary: '#8C271E',
      secondary: '#ABA194',
      text: '#1C1514',
      textMuted: '#6B6058',
      success: '#4D7C0F',
      warning: '#C2410C',
      danger: '#8C271E',
      completedSet: '#F0D5D3',
      supersetTag: '#CFCBCA',
    },
  },

  amethyst: {
    id: 'amethyst',
    name: 'Améthyste Nuit',
    subtitle: 'Violet Nocturne & Vanille',
    description: 'Mystère et intensité : améthyste sombre, violet nuit et accents crème vanille.',
    previewColors: {
      dark: ['#1F0421', '#38182F', '#EEE1B3', '#EEE1B3'],
      light: ['#F7F4EA', '#FFFFFF', '#38182F', '#220524'],
    },
    dark: {
      background: '#1F0421',
      surface: '#38182F',
      cardBg: '#38182F',
      border: '#522846',
      accent: '#EEE1B3',
      primary: '#EEE1B3',
      secondary: '#2F394D',
      text: '#EEE1B3',
      textMuted: '#A69BA0',
      success: '#68B684',
      warning: '#E5A84B',
      danger: '#E05252',
      completedSet: '#3A1C32',
      supersetTag: '#2F394D',
    },
    light: {
      background: '#F7F4EA',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#DCD4BF',
      accent: '#38182F',
      primary: '#38182F',
      secondary: '#2F394D',
      text: '#220524',
      textMuted: '#56666B',
      success: '#15803D',
      warning: '#B45309',
      danger: '#991B1B',
      completedSet: '#F2E8F0',
      supersetTag: '#DCD4BF',
    },
  },

  onyx_teal: {
    id: 'onyx_teal',
    name: 'Onyx & Sarcelle',
    subtitle: 'Onyx, Platine & Sarcelle',
    description: 'Élégance minérale contemporaine : noir onyx profond, sarcelle d\'orage et bleu givré.',
    previewColors: {
      dark: ['#0A090C', '#07393C', '#90DDF0', '#F0EDEE'],
      light: ['#F0EDEE', '#FFFFFF', '#07393C', '#0A090C'],
    },
    dark: {
      background: '#0A090C',
      surface: '#07393C',
      cardBg: '#07393C',
      border: '#1A5357',
      accent: '#90DDF0',
      primary: '#90DDF0',
      secondary: '#2C666E',
      text: '#F0EDEE',
      textMuted: '#7FA4AA',
      success: '#90DDF0',
      warning: '#E2B056',
      danger: '#E05A5A',
      completedSet: '#0B4A4E',
      supersetTag: '#2C666E',
    },
    light: {
      background: '#F0EDEE',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#D1CDCE',
      accent: '#07393C',
      primary: '#07393C',
      secondary: '#2C666E',
      text: '#0A090C',
      textMuted: '#4B666A',
      success: '#07393C',
      warning: '#B45309',
      danger: '#B91C1C',
      completedSet: '#CCEBEF',
      supersetTag: '#D1CDCE',
    },
  },


  emerald: {
    id: 'emerald',
    name: 'Émeraude & Jade',
    subtitle: 'Ardoise Jade & Sarcelle',
    description: 'Élégance minérale et feutrée : tons sarcelle doux (#77AF9C), surfaces jade et blanc menthe (#D7FFF1).',
    previewColors: {
      dark: ['#121A17', '#1E2C26', '#77AF9C', '#D7FFF1'],
      light: ['#F0F8F5', '#FFFFFF', '#77AF9C', '#121A17'],
    },
    dark: {
      background: '#121A17',
      surface: '#1E2C26',
      cardBg: '#1E2C26',
      border: '#324C41',
      accent: '#77AF9C',
      primary: '#77AF9C',
      secondary: '#285943',
      text: '#D7FFF1',
      textMuted: '#8CD790',
      success: '#8CD790',
      warning: '#E2B056',
      danger: '#E05A5A',
      completedSet: '#14211C',
      supersetTag: '#324C41',
    },
    light: {
      background: '#F0F8F5',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#CDE4DB',
      accent: '#77AF9C',
      primary: '#77AF9C',
      secondary: '#8CD790',
      text: '#121A17',
      textMuted: '#50695F',
      success: '#2F755A',
      warning: '#B45309',
      danger: '#B91C1C',
      completedSet: '#DBEFE7',
      supersetTag: '#CDE4DB',
    },
  },
};

export const THEME_LIST: ThemeDefinition[] = [
  THEMES.citadel,
  THEMES.glacial,
  THEMES.chestnut,
  THEMES.amethyst,
  THEMES.onyx_teal,
  THEMES.emerald,
];

// Compatibilité descendante pour les imports existants
export const DarkTheme: ColorPalette = THEMES.citadel.dark;
export const LightTheme: ColorPalette = THEMES.citadel.light;

