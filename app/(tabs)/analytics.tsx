import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { TabSwipeWrapper } from '../../src/components/Navigation/TabSwipeWrapper';
import { WeeklyMuscleVolumeCard } from '../../src/components/Analytics/WeeklyMuscleVolumeCard';
import { FatigueMarkersCard } from '../../src/components/Analytics/FatigueMarkersCard';
import { OneRMChartCard } from '../../src/components/Profile/OneRMChartCard';
import { SlidersHorizontal } from 'lucide-react-native';

export default function AnalyticsTab() {
  const { data } = useWorkout();
  const { theme } = useTheme();
  const [excludeExceptions, setExcludeExceptions] = useState(false);

  const filteredHistory = useMemo(() => {
    const raw = data?.history || [];
    if (!excludeExceptions) return raw;
    return raw.filter((s) => !s.isException);
  }, [data?.history, excludeExceptions]);

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

          {/* Filtre Séances d'Exception */}
          <View style={[styles.filterCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SlidersHorizontal size={14} color={excludeExceptions ? theme.accent : theme.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.filterTitle, { color: theme.text }]}>
                  Exclure les séances exceptionnelles
                </Text>
              </View>
              <Text style={[styles.filterSubtitle, { color: theme.textMuted }]}>
                Isole l'analyse au programme pur (exclut les séances sous contrainte)
              </Text>
            </View>
            <Switch
              value={excludeExceptions}
              onValueChange={setExcludeExceptions}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={Platform.OS === 'android' ? (excludeExceptions ? '#FFFFFF' : '#888888') : undefined}
            />
          </View>

          {/* 1. Volume musculaire hebdomadaire */}
          <WeeklyMuscleVolumeCard history={filteredHistory} />

          {/* 2. Marqueurs de fatigue et récupération */}
          {data?.profile?.enableFatigueMarkers !== false && (
            <FatigueMarkersCard history={filteredHistory} />
          )}

          {/* 3. Graphiques / Cartes de Performance 1RM & PRs */}
          <OneRMChartCard history={filteredHistory} />
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
  filterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 14,
  },
});
