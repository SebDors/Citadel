export type ThemeId = 'cyber' | 'forge' | 'glacial' | 'spartan' | 'gold' | 'citadel';
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
  cyber: {
    id: 'cyber',
    name: 'Cyber-Athletic',
    subtitle: 'Onyx & Acid Volt',
    description: 'High-tech de la performance pure (Whoop, Gymshark). Focus mental et contraste néon.',
    previewColors: {
      dark: ['#0B0E14', '#161B26', '#CCFF00', '#FFFFFF'],
      light: ['#F4F6F9', '#FFFFFF', '#16A34A', '#0F172A'],
    },
    dark: {
      background: '#0B0E14',
      surface: '#161B26',
      cardBg: '#161B26',
      border: '#242C3D',
      accent: '#CCFF00',
      primary: '#CCFF00',
      secondary: '#1E2638',
      text: '#FFFFFF',
      textMuted: '#8F9CAE',
      success: '#CCFF00',
      warning: '#F59E0B',
      danger: '#EF4444',
      completedSet: '#18261A',
      supersetTag: '#1E2638',
    },
    light: {
      background: '#F4F6F9',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#E2E7F0',
      accent: '#16A34A',
      primary: '#16A34A',
      secondary: '#E9ECEF',
      text: '#0F172A',
      textMuted: '#64748B',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      completedSet: '#DCFCE7',
      supersetTag: '#E2E7F0',
    },
  },
  forge: {
    id: 'forge',
    name: 'Raw Iron & Forge',
    subtitle: 'Fonte Brute & Ambre',
    description: 'Forge spartiate, fonte brute et métal en fusion. Ambiance robuste et puissante.',
    previewColors: {
      dark: ['#121214', '#1C1D21', '#FF6B00', '#F4F4F6'],
      light: ['#F8F7F5', '#FFFFFF', '#D95200', '#1A1918'],
    },
    dark: {
      background: '#121214',
      surface: '#1C1D21',
      cardBg: '#1C1D21',
      border: '#2C2D35',
      accent: '#FF6B00',
      primary: '#FF6B00',
      secondary: '#25272E',
      text: '#F4F4F6',
      textMuted: '#92939E',
      success: '#22C55E',
      warning: '#FF6B00',
      danger: '#EF4444',
      completedSet: '#2B1D14',
      supersetTag: '#2C2D35',
    },
    light: {
      background: '#F8F7F5',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#E7E5E0',
      accent: '#D95200',
      primary: '#D95200',
      secondary: '#EFECE6',
      text: '#1A1918',
      textMuted: '#706E68',
      success: '#16A34A',
      warning: '#D95200',
      danger: '#DC2626',
      completedSet: '#FFEDD5',
      supersetTag: '#E7E5E0',
    },
  },
  glacial: {
    id: 'glacial',
    name: 'Glacial Monolith',
    subtitle: 'Bleu Abyssal & Cyan Titane',
    description: 'Structure monolithique imprenable, précision chirurgicale et rigueur scientifique.',
    previewColors: {
      dark: ['#080D1A', '#0F172A', '#00D2FF', '#F8FAFC'],
      light: ['#F0F4F8', '#FFFFFF', '#0284C7', '#0B132B'],
    },
    dark: {
      background: '#080D1A',
      surface: '#0F172A',
      cardBg: '#0F172A',
      border: '#1E293B',
      accent: '#00D2FF',
      primary: '#00D2FF',
      secondary: '#1A2338',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      success: '#00D2FF',
      warning: '#FBBF24',
      danger: '#F87171',
      completedSet: '#0E2538',
      supersetTag: '#1E293B',
    },
    light: {
      background: '#F0F4F8',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#D9E2EC',
      accent: '#0284C7',
      primary: '#0284C7',
      secondary: '#E1E8F0',
      text: '#0B132B',
      textMuted: '#627D98',
      success: '#0284C7',
      warning: '#D97706',
      danger: '#DC2626',
      completedSet: '#E0F2FE',
      supersetTag: '#D9E2EC',
    },
  },
  spartan: {
    id: 'spartan',
    name: 'Spartan Crimson',
    subtitle: 'Titane Furtif & Rouge Égide',
    description: 'Armée spartiate, adrénaline et détermination absolue. Noir mat et rouge carmin.',
    previewColors: {
      dark: ['#0D0D0D', '#171717', '#FF2A42', '#FFFFFF'],
      light: ['#FAF9F8', '#FFFFFF', '#DC2626', '#141414'],
    },
    dark: {
      background: '#0D0D0D',
      surface: '#171717',
      cardBg: '#171717',
      border: '#262626',
      accent: '#FF2A42',
      primary: '#FF2A42',
      secondary: '#222222',
      text: '#FFFFFF',
      textMuted: '#888888',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#FF2A42',
      completedSet: '#2A1316',
      supersetTag: '#262626',
    },
    light: {
      background: '#FAF9F8',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#E5E5E5',
      accent: '#DC2626',
      primary: '#DC2626',
      secondary: '#F0EFEB',
      text: '#141414',
      textMuted: '#6B7280',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      completedSet: '#FEE2E2',
      supersetTag: '#E5E5E5',
    },
  },
  gold: {
    id: 'gold',
    name: 'Golden Citadel',
    subtitle: 'Bronze, Noyer & Straw Gold',
    description: 'Palette noble et chaleureuse. Bois de noyer profond, or paille et bronze patiné.',
    previewColors: {
      dark: ['#16110B', '#241C14', '#E3C567', '#FAF6EE'],
      light: ['#FAF7F0', '#FFFFFF', '#C8963E', '#2C1E0F'],
    },
    dark: {
      background: '#16110B',
      surface: '#241C14',
      cardBg: '#241C14',
      border: '#3D2E1F',
      accent: '#E3C567',
      primary: '#E3C567',
      secondary: '#332519',
      text: '#FAF6EE',
      textMuted: '#D9AE61',
      success: '#C8963E',
      warning: '#D9AE61',
      danger: '#D1462F',
      completedSet: '#2E2314',
      supersetTag: '#3D2E1F',
    },
    light: {
      background: '#FAF7F0',
      surface: '#FFFFFF',
      cardBg: '#FFFFFF',
      border: '#EADBCE',
      accent: '#C8963E',
      primary: '#C8963E',
      secondary: '#F3ECE0',
      text: '#2C1E0F',
      textMuted: '#7D654E',
      success: '#573D1C',
      warning: '#C8963E',
      danger: '#D1462F',
      completedSet: '#FBF1D9',
      supersetTag: '#EADBCE',
    },
  },
  citadel: {
    id: 'citadel',
    name: 'Citadel Original',
    subtitle: 'Kaki Tactique & Ardoise',
    description: 'La palette originale de Citadel. Teintes militaires épurées, kaki et ardoise.',
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
};

export const THEME_LIST: ThemeDefinition[] = [
  THEMES.cyber,
  THEMES.forge,
  THEMES.glacial,
  THEMES.spartan,
  THEMES.gold,
  THEMES.citadel,
];

// Compatibilité descendante pour les imports existants
export const DarkTheme: ColorPalette = THEMES.citadel.dark;
export const LightTheme: ColorPalette = THEMES.citadel.light;

