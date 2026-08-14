import React, { createContext, useContext } from 'react';
import { ColorPalette, DarkTheme } from '../constants/colors';

type ThemeMode = 'dark';

interface ThemeContextType {
  theme: ColorPalette;
  mode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DarkTheme,
  mode: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme: DarkTheme, mode: 'dark', toggleTheme: () => {}, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
