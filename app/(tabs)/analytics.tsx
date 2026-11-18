import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { TabSwipeWrapper } from '../../src/components/Navigation/TabSwipeWrapper';
import { WeeklyMuscleVolumeCard } from '../../src/components/Analytics/WeeklyMuscleVolumeCard';
import { MuscleBalanceRadarCard } from '../../src/components/Analytics/MuscleBalanceRadarCard';
import { calculateWeeklyMuscleVolume } from '../../src/services/analyticsService';
import { FatigueMarkersCard } from '../../src/components/Analytics/FatigueMarkersCard';
import { OneRMChartCard } from '../../src/components/Profile/OneRMChartCard';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';

export default function AnalyticsTab() {
  const { data } = useWorkout();
  const { theme } = useTheme();
  const [excludeExceptions, setExcludeExceptions] = useState(false);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);

  const filteredHistory = useMemo(() => {
    const raw = data?.history || [];
    if (!excludeExceptions) return raw;
    return raw.filter((s) => !s.isException);
  }, [data?.history, excludeExceptions]);

  const weeklyVolume = useMemo(
    () => calculateWeeklyMuscleVolume(filteredHistory, selectedWeekOffset),
    [filteredHistory, selectedWeekOffset]
  );

  const weekLabel = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMon + selectedWeekOffset * 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const fmt = (d: Date) =>
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const rangeStr = `${fmt(startOfWeek)} - ${fmt(endOfWeek)}`;

    if (selectedWeekOffset === 0) return `Cette semaine · ${rangeStr}`;
    if (selectedWeekOffset === -1) return `Semaine dernière · ${rangeStr}`;
    return `Il y a ${Math.abs(selectedWeekOffset)} sem. · ${rangeStr}`;
  }, [selectedWeekOffset]);

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

          {/* Sélecteur Global de Semaine pour Volume, Équilibre & Fatigue */}
          <View style={[styles.weekSelectorCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedWeekOffset((prev) => prev - 1)}
              style={[styles.weekNavBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Semaine précédente"
            >
              <ChevronLeft size={18} color={theme.text} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color={theme.accent} />
                <Text style={[styles.weekNavLabel, { color: theme.text }]} numberOfLines={1}>
                  {weekLabel}
                </Text>
              </View>
              {selectedWeekOffset !== 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedWeekOffset(0)}
                  style={[styles.todayBtn, { backgroundColor: `${theme.accent}20`, borderColor: theme.accent }]}
                >
                  <Text style={[styles.todayBtnText, { color: theme.accent }]}>
                    Revenir à cette semaine
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedWeekOffset((prev) => Math.min(0, prev + 1))}
              disabled={selectedWeekOffset >= 0}
              style={[
                styles.weekNavBtn,
                { backgroundColor: theme.surface, opacity: selectedWeekOffset >= 0 ? 0.3 : 1 },
              ]}
              accessibilityLabel="Semaine suivante"
            >
              <ChevronRight size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* 1. Volume musculaire hebdomadaire */}
          <WeeklyMuscleVolumeCard
            history={filteredHistory}
            weekOffset={selectedWeekOffset}
            hideWeekSelector
          />

          {/* 1B. Graphique Radar d'Équilibre Musculaire (AJ-14) */}
          <MuscleBalanceRadarCard volumeData={weeklyVolume} />

          {/* 2. Marqueurs de fatigue et récupération */}
          {data?.profile?.enableFatigueMarkers !== false && (
            <FatigueMarkersCard
              history={filteredHistory}
              weekOffset={selectedWeekOffset}
              hideWeekSelector
            />
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
  weekSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  weekNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  todayBtn: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
