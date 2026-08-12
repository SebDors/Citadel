import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ProfileHeaderCard } from '../../src/components/Profile/ProfileHeaderCard';
import { OneRMChartCard } from '../../src/components/Profile/OneRMChartCard';
import { ModularMeasurementChartCard } from '../../src/components/Profile/ModularMeasurementChartCard';
import { BodyMeasurementsCard } from '../../src/components/Profile/BodyMeasurementsCard';
import { JsonActionsCard } from '../../src/components/Profile/JsonActionsCard';

export default function ProfileTab() {
  const { data, addMeasurement, deleteMeasurement, updateUserProfile, reloadAllData } = useWorkout();
  const { theme } = useTheme();

  if (!data) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0 }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Performances & Profil</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Progression 1RM, Mensurations et Sauvegardes JSON
          </Text>
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

        {/* 5. Zone Réglages & Données JSON */}
        <JsonActionsCard data={data} onImportSuccess={reloadAllData} />
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
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});
