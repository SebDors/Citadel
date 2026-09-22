import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ColorPalette,
  ThemeId,
  ThemeMode,
  ThemeDefinition,
  THEMES,
  THEME_LIST,
} from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  theme: ColorPalette;
  mode: ThemeMode;
  themeId: ThemeId;
  activeTheme: ThemeDefinition;
  allThemes: ThemeDefinition[];
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const THEME_MODE_STORAGE_KEY = '@citadel_theme_mode';
const THEME_ID_STORAGE_KEY = '@citadel_theme_id';

const DEFAULT_THEME_ID: ThemeId = 'citadel';

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[DEFAULT_THEME_ID].dark,
  mode: 'dark',
  themeId: DEFAULT_THEME_ID,
  activeTheme: THEMES[DEFAULT_THEME_ID],
  allThemes: THEME_LIST,
  setThemeId: () => {},
  setMode: () => {},
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    // Charger le mode et le thème sauvegardés
    Promise.all([
      AsyncStorage.getItem(THEME_MODE_STORAGE_KEY),
      AsyncStorage.getItem(THEME_ID_STORAGE_KEY),
    ])
      .then(([savedMode, savedThemeId]) => {
        if (savedMode === 'light' || savedMode === 'dark') {
          setModeState(savedMode);
        }
        if (savedThemeId && savedThemeId in THEMES) {
          setThemeIdState(savedThemeId as ThemeId);
        } else if (savedThemeId && savedThemeId.startsWith('emerald')) {
          setThemeIdState('emerald');
        } else if (savedThemeId) {
          // Fallback en cas d'ancien thème supprimé (ex: cyber, forge, ocean, etc.)
          setThemeIdState('citadel');
        }
      })
      .catch((e) => console.warn('[ThemeContext] Error loading theme preferences:', e));
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, newMode).catch((e) =>
      console.warn('[ThemeContext] Error saving theme mode:', e)
    );
  };

  const setThemeId = (newThemeId: ThemeId) => {
    if (newThemeId in THEMES) {
      setThemeIdState(newThemeId);
      AsyncStorage.setItem(THEME_ID_STORAGE_KEY, newThemeId).catch((e) =>
        console.warn('[ThemeContext] Error saving theme id:', e)
      );
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  const currentThemeDef = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const theme = currentThemeDef[mode];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        themeId,
        activeTheme: currentThemeDef,
        allThemes: THEME_LIST,
        setThemeId,
        setMode,
        toggleTheme,
        isDark: mode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

