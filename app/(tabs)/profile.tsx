import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, StatusBar as RNStatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ProfileHeaderCard } from '../../src/components/Profile/ProfileHeaderCard';
import { OneRMChartCard } from '../../src/components/Profile/OneRMChartCard';
import { ModularMeasurementChartCard } from '../../src/components/Profile/ModularMeasurementChartCard';
import { BodyMeasurementsCard } from '../../src/components/Profile/BodyMeasurementsCard';
import { Sun, Moon } from 'lucide-react-native';

export default function ProfileTab() {
  const { data, addMeasurement, deleteMeasurement, updateUserProfile } = useWorkout();
  const { theme, toggleTheme, isDark } = useTheme();

  if (!data) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0 }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Header avec bouton de bascule Thème (Soleil / Lune) dans l'angle supérieur droit */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>Profil</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Progression 1RM et Suivi des Mensurations
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleTheme}
              style={[styles.themeToggleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              accessibilityLabel="Basculer le thème"
            >
              {isDark ? <Sun size={20} color={theme.accent} /> : <Moon size={20} color={theme.accent} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Carte En-tête Profil avec Réglages */}
        <ProfileHeaderCard profile={data.profile} onUpdateProfile={updateUserProfile} />

        {/* 2. Graphique Modulable de Mensurations (Poids, Poitrine, Cuisse, Bras) */}
        <ModularMeasurementChartCard measurements={data.measurements} />

        {/* 3. Graphiques / Cartes de Performance 1RM */}
        <OneRMChartCard />

        {/* 4. Suivi du Poids et Mensurations avec option de suppression */}
        <BodyMeasurementsCard
          measurements={data.measurements}
          onAddMeasurement={addMeasurement}
          onDeleteMeasurement={deleteMeasurement}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    marginTop: 10,
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
