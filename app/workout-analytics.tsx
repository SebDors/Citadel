import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { useWorkout } from '../src/context/WorkoutContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, ChevronRight, Award, Repeat } from 'lucide-react-native';
import {
  getTemplateBlocks,
  formatCircuitSummary,
  calculateEstimatedWorkoutMinutes,
  getSessionBlocks,
  WorkoutBlock,
  WorkoutExercise,
  WorkoutSession,
} from '../src/types';

export default function WorkoutAnalyticsScreen() {
  const { theme } = useTheme();
  const { data } = useWorkout();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const templateId = (params.id as string) || 'tpl_upper_b';
  const template = data?.templates.find((t) => t.id === templateId) || data?.templates[0];

  const [activeMetricTab, setActiveMetricTab] = useState<'volume' | 'duree' | 'reps'>('volume');
  const [activeTimeFilter, setActiveTimeFilter] = useState<'30J' | '3M' | '6M' | '1A'>('30J');

  // 1. Extraction des Blocs & Exercices d'un Template (getTemplateBlocks)
  const blocks: WorkoutBlock[] = useMemo(() => {
    return template ? getTemplateBlocks(template) : [];
  }, [template]);

  // Récupération de l'historique associé à ce template (trié par date décroissante)
  const historySessions: WorkoutSession[] = useMemo(() => {
    if (!data?.history || !template) return [];
    return data.history
      .filter(
        (s) =>
          s.status === 'completed' &&
          (s.templateId === template.id || s.title.trim().toLowerCase() === template.title.trim().toLowerCase())
      )
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [data?.history, template]);

  const lastCompletedSession = historySessions[0] || null;

  // 4. Calculs Dynamiques des Métriques ("Metric Callout") depuis la dernière séance ou depuis les blocs
  const { actualVolume, actualDurationSec, actualReps } = useMemo(() => {
    if (lastCompletedSession) {
      let vol = lastCompletedSession.totalVolumeKg || 0;
      if (vol === 0 && lastCompletedSession.exercises) {
        lastCompletedSession.exercises.forEach((ex) => {
          (ex.sets || []).forEach((set) => {
            if (set.completed) {
              vol += (set.weightKg || 0) * (set.reps || 0);
            }
          });
        });
      }

      const dur = lastCompletedSession.durationSeconds || 0;

      let reps = 0;
      if (lastCompletedSession.exercises && lastCompletedSession.exercises.length > 0) {
        lastCompletedSession.exercises.forEach((ex) => {
          (ex.sets || []).forEach((set) => {
            if (set.completed) {
              reps += set.reps || 0;
            }
          });
        });
      } else {
        const sessBlocks = getSessionBlocks(lastCompletedSession);
        sessBlocks.forEach((b) => {
          if (b.type === 'single') {
            (b.exercise.sets || []).forEach((set) => {
              if (set.completed) reps += set.reps || 0;
            });
          } else if (b.type === 'circuit') {
            const rounds = b.rounds || 1;
            b.exercises.forEach((item) => {
              if (item.targetType === 'reps') {
                reps += (item.targetValue || 0) * rounds;
              }
            });
          }
        });
      }

      return { actualVolume: vol, actualDurationSec: dur, actualReps: reps };
    } else {
      let vol = 0;
      let reps = 0;

      blocks.forEach((b) => {
        if (b.type === 'single') {
          (b.exercise.sets || []).forEach((set) => {
            vol += (set.weightKg || 0) * (set.reps || 0);
            reps += set.reps || 0;
          });
        } else if (b.type === 'circuit') {
          const rounds = b.rounds || 1;
          b.exercises.forEach((item) => {
            if (item.targetType === 'reps') {
              reps += (item.targetValue || 0) * rounds;
            }
          });
        }
      });

      const estMins = calculateEstimatedWorkoutMinutes(blocks);
      const dur = estMins * 60;

      return { actualVolume: vol, actualDurationSec: dur, actualReps: reps };
    }
  }, [lastCompletedSession, blocks]);

  const metricCalloutValue = useMemo(() => {
    if (activeMetricTab === 'volume') {
      if (actualVolume >= 1000) {
        return `${(actualVolume / 1000).toFixed(1).replace('.', ',')}k kg`;
      }
      return `${actualVolume} kg`;
    }
    if (activeMetricTab === 'duree') {
      const hours = Math.floor(actualDurationSec / 3600);
      const mins = Math.round((actualDurationSec % 3600) / 60);
      if (hours > 0) {
        return `${hours} h ${mins < 10 ? '0' : ''}${mins}`;
      }
      return `${mins} min`;
    }
    return `${actualReps} reps`;
  }, [activeMetricTab, actualVolume, actualDurationSec, actualReps]);

  // 3. Extraction de l'ensemble des exercices (isolés et issus des circuits) pour les PRs
  const allExercises = useMemo(() => {
    const list: Array<{
      id: string;
      exerciseName: string;
      primaryMuscle?: string;
      isCircuit: boolean;
      targetText?: string;
      singleExercise?: WorkoutExercise;
    }> = [];

    blocks.forEach((b) => {
      if (b.type === 'single') {
        list.push({
          id: b.exercise.id || b.exercise.exerciseId,
          exerciseName: b.exercise.exerciseName,
          primaryMuscle: b.exercise.primaryMuscle,
          isCircuit: false,
          singleExercise: b.exercise,
        });
      } else if (b.type === 'circuit') {
        b.exercises.forEach((item) => {
          list.push({
            id: item.id,
            exerciseName: item.exerciseName,
            primaryMuscle: item.primaryMuscle,
            isCircuit: true,
            targetText: `${item.targetValue} ${item.targetType === 'time' ? 's' : 'reps'}`,
          });
        });
      }
    });

    return list;
  }, [blocks]);

  // Calcul des records pour chaque exercice (isolé et circuit)
  const exercisePRs = useMemo(() => {
    return allExercises.map((exItem) => {
      let bestWeight = 0;
      let bestReps = 0;
      let lastDateFormatted = '';

      if (historySessions.length > 0) {
        for (const session of historySessions) {
          const sessExercises = session.exercises || [];
          const matchEx = sessExercises.find(
            (e) => e.exerciseName.trim().toLowerCase() === exItem.exerciseName.trim().toLowerCase()
          );
          if (matchEx) {
            for (const s of matchEx.sets || []) {
              if (s.completed) {
                const w = s.weightKg || 0;
                const r = s.reps || 0;
                if (w > bestWeight || (w === bestWeight && r > bestReps)) {
                  bestWeight = w;
                  bestReps = r;
                  const dateObj = new Date(session.startTime);
                  lastDateFormatted = dateObj
                    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    .toUpperCase();
                }
              }
            }
          }
        }
      }

      if (bestWeight > 0 || bestReps > 0) {
        const e1RM = Math.round(bestWeight * (1 + bestReps / 30));
        return {
          name: exItem.exerciseName,
          dateText: lastDateFormatted || 'RÉCENT',
          valueText: bestWeight > 0 ? `${e1RM} kg e1RM` : `${bestReps} reps`,
          subText: bestWeight > 0 ? `${bestWeight} kg × ${bestReps}` : 'Poids de corps',
        };
      }

      if (exItem.singleExercise && exItem.singleExercise.sets?.length > 0) {
        const firstSet = exItem.singleExercise.sets[0];
        const w = firstSet.weightKg || 0;
        const r = firstSet.reps || 10;
        if (w > 0) {
          const e1RM = Math.round(w * (1 + r / 30));
          return {
            name: exItem.exerciseName,
            dateText: 'OBJECTIF',
            valueText: `${e1RM} kg e1RM`,
            subText: `${w} kg × ${r}`,
          };
        }
        return {
          name: exItem.exerciseName,
          dateText: 'OBJECTIF',
          valueText: `${r} reps`,
          subText: 'Poids de corps',
        };
      }

      return {
        name: exItem.exerciseName,
        dateText: 'OBJECTIF',
        valueText: exItem.targetText || 'Circuit',
        subText: 'Objectif circuit',
      };
    });
  }, [allExercises, historySessions]);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Navigation */}
      <View
        style={[
          styles.topBar,
          {
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 16) + 8,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <View style={styles.titleBox}>
          <Text style={[styles.topTitle, { color: theme.text }]}>{template?.title || 'Upper B'}</Text>
          <Text style={[styles.topSub, { color: theme.textMuted }]}>
            {historySessions.length} entraînement{historySessions.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Metric Callout (Volume / Dernier ou Estimé) */}
        <View style={styles.metricCallout}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
            {activeMetricTab.toUpperCase()} · {lastCompletedSession ? 'DERNIER' : 'ESTIMÉ'}
          </Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>{metricCalloutValue}</Text>
        </View>

        {/* Metric Selector Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeMetricTab === 'volume' && { backgroundColor: theme.cardBg }]}
            onPress={() => setActiveMetricTab('volume')}
          >
            <Text style={[styles.tabText, { color: theme.text }, activeMetricTab === 'volume' && { fontWeight: '900' }]}>
              Volume
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeMetricTab === 'duree' && { backgroundColor: theme.cardBg }]}
            onPress={() => setActiveMetricTab('duree')}
          >
            <Text style={[styles.tabText, { color: theme.text }, activeMetricTab === 'duree' && { fontWeight: '900' }]}>
              Durée
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeMetricTab === 'reps' && { backgroundColor: theme.cardBg }]}
            onPress={() => setActiveMetricTab('reps')}
          >
            <Text style={[styles.tabText, { color: theme.text }, activeMetricTab === 'reps' && { fontWeight: '900' }]}>
              Reps
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Canvas Card */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.chartArea}>
            <View style={styles.chartLineMock}>
              <View style={[styles.chartPoint, { backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.chartY, { color: theme.textMuted }]}>3081.7</Text>
            <Text style={[styles.chartYMid, { color: theme.textMuted }]}>1540.8</Text>
            <Text style={[styles.chartYZero, { color: theme.textMuted }]}>0.0</Text>
          </View>

          {/* Time Filter Controls (30J / 3M / 6M / 1A) */}
          <View style={styles.filtersRow}>
            {(['30J', '3M', '6M', '1A'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterBtn,
                  { borderColor: theme.border, backgroundColor: activeTimeFilter === filter ? theme.surface : 'transparent' },
                ]}
                onPress={() => setActiveTimeFilter(filter)}
              >
                <Text style={[styles.filterText, { color: theme.text }]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Records / PRs Section (Toutes les PRs isolées & circuits) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>PRs DANS CETTE SÉANCE</Text>
          <Text style={[styles.recordsBadgeText, { color: theme.accent }]}>Records</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.prSummaryRow}>
            <Award size={18} color={theme.accent} />
            <Text style={[styles.prSummaryText, { color: theme.text }]}>
              {allExercises.length} record{allExercises.length > 1 ? 's' : ''} dans {template?.title || 'la séance'}
            </Text>
          </View>

          {exercisePRs.map((pr, idx) => (
            <View key={idx} style={[styles.prRow, { borderTopColor: theme.border }]}>
              <View style={styles.prLeft}>
                <View style={[styles.starCircle, { backgroundColor: theme.surface }]}>
                  <Star size={12} color={theme.accent} fill={theme.accent} />
                </View>
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={[styles.prExName, { color: theme.text }]} numberOfLines={1}>
                    {pr.name}
                  </Text>
                  <Text style={[styles.prExDate, { color: theme.textMuted }]}>{pr.dateText}</Text>
                </View>
              </View>
              <View style={styles.prRight}>
                <Text style={[styles.prValue, { color: theme.text }]}>{pr.valueText}</Text>
                <Text style={[styles.prSub, { color: theme.textMuted }]}>{pr.subText}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 2. Exercices de la Séance Section (Singles & Circuits avec formatCircuitSummary) */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 18, marginBottom: 8 }]}>
          EXERCICES DE LA SÉANCE
        </Text>

        <View style={styles.blocksContainer}>
          {blocks.map((block, idx) => {
            if (block.type === 'single') {
              return (
                <View
                  key={block.id || idx}
                  style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 10 }]}
                >
                  <TouchableOpacity style={styles.exLinkRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exLinkName, { color: theme.text }]}>{block.exercise.exerciseName}</Text>
                      {block.exercise.primaryMuscle ? (
                        <Text style={[styles.exSubText, { color: theme.textMuted }]}>{block.exercise.primaryMuscle}</Text>
                      ) : null}
                    </View>
                    <ChevronRight size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            } else if (block.type === 'circuit') {
              return (
                <View
                  key={block.id || idx}
                  style={[
                    styles.cardBox,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      marginBottom: 10,
                      paddingHorizontal: 0,
                      paddingVertical: 0,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <View style={[styles.circuitHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <View style={styles.circuitBadge}>
                      <Repeat size={14} color={theme.accent} style={{ marginRight: 6 }} />
                      <Text style={[styles.circuitBadgeText, { color: theme.accent }]}>
                        {formatCircuitSummary(block)}
                      </Text>
                    </View>
                  </View>

                  {block.exercises.map((item, itemIdx) => (
                    <View
                      key={item.id || itemIdx}
                      style={[
                        styles.circuitItemRow,
                        itemIdx > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.circuitItemName, { color: theme.text }]}>{item.exerciseName}</Text>
                        {item.primaryMuscle ? (
                          <Text style={[styles.circuitItemMuscle, { color: theme.textMuted }]}>{item.primaryMuscle}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.targetBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.targetText, { color: theme.accent }]}>
                          {item.targetValue} {item.targetType === 'time' ? 's' : 'reps'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            }
            return null;
          })}
        </View>

        {/* Historique Passé */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 18, marginBottom: 8 }]}>
          HISTORIQUE
        </Text>

        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 30 }]}>
          {historySessions.length > 0 ? (
            historySessions.map((sess, idx) => {
              const dateObj = new Date(sess.startTime);
              const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const hours = Math.floor((sess.durationSeconds || 0) / 3600);
              const mins = Math.round(((sess.durationSeconds || 0) % 3600) / 60);
              const durStr = hours > 0 ? `${hours} h ${mins < 10 ? '0' : ''}${mins}` : `${mins} min`;

              return (
                <TouchableOpacity
                  key={sess.id || idx}
                  style={[styles.historyLinkRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
                >
                  <Text style={[styles.historyDate, { color: theme.text }]}>{formattedDate}</Text>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyVol, { color: theme.text }]}>
                      {sess.totalVolumeKg ? `${sess.totalVolumeKg} kg` : durStr}
                    </Text>
                    <Text style={[styles.historyDur, { color: theme.textMuted, marginLeft: 10 }]}>{durStr}</Text>
                    <ChevronRight size={16} color={theme.textMuted} style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>
                Aucune séance historique enregistrée
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  titleBox: {
    flex: 1,
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  topSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },
  metricCallout: {
    marginTop: 8,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  chartArea: {
    height: 140,
    position: 'relative',
    justifyContent: 'space-between',
  },
  chartLineMock: {
    position: 'absolute',
    left: 40,
    top: 30,
    width: 10,
    height: 10,
  },
  chartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartY: {
    fontSize: 10,
  },
  chartYMid: {
    fontSize: 10,
  },
  chartYZero: {
    fontSize: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recordsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  blocksContainer: {
    marginBottom: 8,
  },
  circuitHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  circuitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  circuitBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  circuitItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  circuitItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  circuitItemMuscle: {
    fontSize: 11,
    marginTop: 2,
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '800',
  },
  exSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  prSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prSummaryText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  prLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  starCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prExName: {
    fontSize: 14,
    fontWeight: '700',
  },
  prExDate: {
    fontSize: 10,
    fontWeight: '600',
  },
  prRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  prValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  prSub: {
    fontSize: 11,
  },
  exLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  exLinkName: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyVol: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyDur: {
    fontSize: 12,
  },
});

