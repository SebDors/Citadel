import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TabSwipeWrapperProps {
  children: React.ReactNode;
  tabIndex: number; // 0: Entraînement, 1: Historique, 2: Analyse, 3: Profil
  disabled?: boolean;
}

/**
 * Conteneur léger d'onglet : le swipe horizontal natif entre onglets est
 * désormais géré par `react-native-pager-view` dans `app/(tabs)/_layout.tsx` (MO-14),
 * supprimant les conflits tactiles avec les graphiques et listes horizontales.
 */
export const TabSwipeWrapper: React.FC<TabSwipeWrapperProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
