import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { TabSwipeWrapper } from '../../src/components/Navigation/TabSwipeWrapper';
import { WeeklyMuscleVolumeCard } from '../../src/components/Analytics/WeeklyMuscleVolumeCard';
import { FatigueMarkersCard } from '../../src/components/Analytics/FatigueMarkersCard';
import { OneRMChartCard } from '../../src/components/Profile/OneRMChartCard';

export default function AnalyticsTab() {
  const { data } = useWorkout();
  const { theme } = useTheme();

  return (
    <TabSwipeWrapper tabIndex={2}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* En-tête de page moderne */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Analyse & Progression
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Volume hebdomadaire, récupération et records
            </Text>
          </View>

          {/* 1. Volume musculaire hebdomadaire */}
          <WeeklyMuscleVolumeCard />

          {/* 2. Marqueurs de fatigue et récupération */}
          {data?.profile?.enableFatigueMarkers !== false && (
            <FatigueMarkersCard />
          )}

          {/* 3. Graphiques / Cartes de Performance 1RM & PRs */}
          <OneRMChartCard />
        </ScrollView>
      </SafeAreaView>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 2,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
    paddingTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});
