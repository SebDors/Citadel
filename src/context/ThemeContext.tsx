import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorPalette, DarkTheme, LightTheme } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ColorPalette;
  mode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@warriorfit_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  theme: DarkTheme,
  mode: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedMode) => {
      if (savedMode === 'light' || savedMode === 'dark') {
        setMode(savedMode);
      }
    });
  }, []);

  const toggleTheme = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  const theme = mode === 'dark' ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
