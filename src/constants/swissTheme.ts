import { Platform } from 'react-native';

/**
 * INTERNATIONAL TYPOGRAPHIC STYLE / SWISS MINIMALISM DESIGN TOKENS
 * Inspiration : Josef Müller-Brockmann, Dieter Rams, Kinfolk, Apple Fitness+ Editorial.
 * Principes fondamentaux :
 * 1. Zéro boîte / Zéro carte délimitée.
 * 2. Espace négatif prédominant (rhythm 8, 16, 24, 32, 48, 64px).
 * 3. Lignes de séparation ultra-fines (0.5px à 1px).
 * 4. Hiérarchie typographique monumentale (44px à 64px).
 * 5. Accent unique Swiss Crimson (#FF2A2A).
 */

export const SWISS_COLORS = {
  dark: {
    background: '#0A0A0A',
    surface: '#121212',
    border: '#262626',
    hairline: '#1E1E1E',
    text: '#FFFFFF',
    textMuted: '#737373',
    textDimmed: '#404040',
    accent: '#FF2A2A',
    accentMuted: 'rgba(255, 42, 42, 0.15)',
    completed: '#141414',
    strikeThrough: '#525252',
  },
  light: {
    background: '#F6F6F4',
    surface: '#FFFFFF',
    border: '#E5E5E5',
    hairline: '#EAEAEA',
    text: '#0F0F0F',
    textMuted: '#737373',
    textDimmed: '#A3A3A3',
    accent: '#FF2A2A',
    accentMuted: 'rgba(255, 42, 42, 0.08)',
    completed: '#EBEBEA',
    strikeThrough: '#A3A3A3',
  },
};

export const SWISS_TYPOGRAPHY = {
  displayHuge: 64,
  display: 56,
  h1: 36,
  h2: 24,
  h3: 18,
  body: 15,
  caption: 13,
  label: 10,
  
  letterSpacingDisplay: -1.5,
  letterSpacingTitle: -0.8,
  letterSpacingBody: 0,
  letterSpacingLabel: 1.5,
  
  fonts: {
    sans: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'sans-serif',
    }),
    mono: Platform.select({
      ios: 'Courier New',
      android: 'monospace',
      default: 'monospace',
    }),
  },
};

export const SWISS_GRID = {
  margin: 20,
  hairline: 0.5,
  divider: 1,
  dividerThick: 2,
  gapSmall: 8,
  gapMedium: 16,
  gapLarge: 24,
  gapSection: 36,
  gapMonumental: 56,
};
