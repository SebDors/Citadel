import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { X, Trophy, Activity, Calendar, Dumbbell, AlertTriangle, TrendingUp } from 'lucide-react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useUserPreferencesStore } from '../../stores/useUserPreferencesStore';
import { WorkoutSession, getSessionBlocks, SessionNote, NOTE_TYPES_CONFIG, SessionExceptionReason } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { calculateE1RM } from '../../services/analyticsService';
import { getBodyweightFactor } from '../../constants/exerciseDatabase';
import {
  hasExercisePainAlert,
  getExercisePainSeverity,
  formatExceptionReason,
} from '../../utils/sessionNoteUtils';

interface ExerciseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseName: string;
  primaryMuscle?: string;
  targetMuscles?: string[];
  history: WorkoutSession[];
}

export default function ExerciseDetailModal({
  visible,
  onClose,
  exerciseName,
  primaryMuscle,
  targetMuscles,
  history,
}: ExerciseDetailModalProps) {
  const { theme } = useTheme();
  const oneRmFormula = useUserPreferencesStore((s) => s.oneRmFormula);
  const [chartMetric, setChartMetric] = useState<'e1rm' | 'maxWeight'>('e1rm');
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);

  // Extract history and PRs for this specific exercise
  const { exerciseHistory, prs } = useMemo(() => {
    let bestWeight = 0;
    let bestReps = 0;
    let bestRir: number | undefined = undefined;
    let prDate = '';
    const historyItems: {
      date: string;
      dateFormatted: string;
      sets: { weightKg: number; reps: number; rir?: number; isPr?: boolean }[];
      isException?: boolean;
      exceptionReason?: SessionExceptionReason;
      sessionNotes?: SessionNote[];
      painAlert?: boolean;
      painSeverity?: number;
    }[] = [];

    // Tri chronologique décroissant pour l'affichage de l'historique
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    sortedHistory.forEach(session => {
      const foundSets: { weightKg: number; reps: number; rir?: number; isPr?: boolean }[] = [];
      const sessionDate = new Date(session.startTime);
      const timeFormatted = sessionDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const dateFormatted = `${sessionDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })} · ${timeFormatted}`;
      const dateStr = sessionDate.toISOString();

      const targetName = exerciseName.trim().toLowerCase();
      const blocks = getSessionBlocks(session);
      let matchingNotes: SessionNote[] = [];
      let painAlert = false;
      let painSeverity: number | undefined = undefined;

      blocks.forEach(block => {
        if (block.type === 'single') {
          if (block.exercise.exerciseName.trim().toLowerCase() === targetName) {
            matchingNotes = block.exercise.sessionNotes || [];
            painAlert = hasExercisePainAlert(block.exercise);
            const sev = getExercisePainSeverity(block.exercise);
            painSeverity = sev !== null ? sev : undefined;
            const bwFactor = getBodyweightFactor(block.exercise.exerciseId, block.exercise.exerciseName);
            block.exercise.sets.forEach(set => {
              if (set.completed && set.type !== 'warmup') {
                const w = Math.max(0, (set.isBodyweight ? (set.bodyweightUsedKg || 0) * bwFactor : 0) + (set.weightKg || 0));
                const r = set.reps || 0;
                if (w > bestWeight || (w === bestWeight && r > bestReps)) {
                  bestWeight = w;
                  bestReps = r;
                  bestRir = set.rir;
                  prDate = dateFormatted;
                }
                foundSets.push({ weightKg: w, reps: r, rir: set.rir });
              }
            });
          }
        }
      });

      if (foundSets.length > 0) {
        historyItems.push({
          date: dateStr,
          dateFormatted,
          sets: foundSets,
          isException: session.isException,
          exceptionReason: session.exceptionReason,
          sessionNotes: matchingNotes,
          painAlert,
          painSeverity,
        });
      }
    });

    // Mark absolute best as true PR
    historyItems.forEach(item => {
      item.sets.forEach(set => {
        if (set.weightKg === bestWeight && set.reps === bestReps && bestWeight > 0) {
          set.isPr = true;
        } else {
          set.isPr = false;
        }
      });
    });

    const e1RM = (bestWeight > 0 && bestReps > 0 && bestReps <= 12) ? calculateE1RM(bestWeight, bestReps, oneRmFormula, bestRir) : null;

    return {
      exerciseHistory: historyItems,
      prs: { bestWeight, bestReps, e1RM, prDate }
    };
  }, [history, exerciseName, oneRmFormula]);


  // Données chronologiques pour le graphique de surcharge progressive (AJ-09)
  const chartPoints = useMemo(() => {
    const asc = [...exerciseHistory].reverse();
    return asc
      .map((item) => {
        let maxW = 0;
        let maxE1rm = 0;
        item.sets.forEach((s) => {
          if (s.weightKg > maxW) maxW = s.weightKg;
          const est = calculateE1RM(s.weightKg, s.reps, oneRmFormula, s.rir);
          if (est && est > maxE1rm) maxE1rm = est;
        });
        const d = new Date(item.date);
        const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
        return {
          date: shortDate,
          fullDate: item.dateFormatted,
          value: chartMetric === 'e1rm' ? (maxE1rm || maxW) : maxW,
        };
      })
      .filter((pt) => pt.value > 0);
  }, [exerciseHistory, chartMetric, oneRmFormula]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {exerciseName}
              </Text>
              {primaryMuscle && (
                <View style={[styles.muscleBadge, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.muscleBadgeText, { color: theme.textMuted }]}>
                    {primaryMuscle}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surface }]}>
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            
            {/* PRs Section */}
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Trophy size={20} color={theme.accent} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Records Personnels</Text>
              </View>
              
              <View style={styles.prGrid}>
                <View style={[styles.prItem, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.prLabel, { color: theme.textMuted }]}>Est. 1RM</Text>
                  <Text style={[styles.prValue, { color: theme.text }]}>
                    {prs.e1RM ? `${prs.e1RM} kg` : (prs.bestReps > 12 ? 'Non fiable (>12 reps)' : '—')}
                  </Text>
                </View>
                <View style={[styles.prItem, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.prLabel, { color: theme.textMuted }]}>Max Charge</Text>
                  <Text style={[styles.prValue, { color: theme.text }]}>
                    {prs.bestWeight > 0 ? `${prs.bestWeight} kg × ${prs.bestReps}` : '-'}
                  </Text>
                </View>
                <View style={[styles.prItem, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.prLabel, { color: theme.textMuted }]}>Dernier PR</Text>
                  <Text style={[styles.prValue, { color: theme.text }]}>
                    {prs.prDate || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progression Chart Section (AJ-09) */}
            {chartPoints.length >= 2 && (
              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 16 }]}>
                <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Progression</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => { setChartMetric('e1rm'); setSelectedPointIdx(null); }}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: chartMetric === 'e1rm' ? theme.accent : theme.surface,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: chartMetric === 'e1rm' ? '#FFFFFF' : theme.textMuted }}>
                        1RM Est.
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setChartMetric('maxWeight'); setSelectedPointIdx(null); }}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: chartMetric === 'maxWeight' ? theme.accent : theme.surface,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: chartMetric === 'maxWeight' ? '#FFFFFF' : theme.textMuted }}>
                        Charge Max
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedPointIdx !== null && chartPoints[selectedPointIdx] && (
                  <View style={{ backgroundColor: theme.surface, padding: 8, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>{chartPoints[selectedPointIdx].fullDate}</Text>
                    <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '800' }}>{chartPoints[selectedPointIdx].value} kg</Text>
                  </View>
                )}

                {(() => {
                  const chartW = 290;
                  const chartH = 120;
                  const padX = 24;
                  const padY = 16;
                  const vals = chartPoints.map((p) => p.value);
                  let minV = Math.min(...vals);
                  let maxV = Math.max(...vals);
                  if (minV === maxV) { minV = Math.max(0, minV - 5); maxV += 5; }
                  const range = maxV - minV || 1;
                  const coords = chartPoints.map((p, idx) => ({
                    x: padX + (idx / (chartPoints.length - 1)) * (chartW - padX * 2),
                    y: padY + (chartH - padY * 2) - ((p.value - minV) / range) * (chartH - padY * 2),
                    val: p.value,
                    date: p.date,
                  }));
                  const dPath = coords.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
                  return (
                    <View style={{ alignItems: 'center' }}>
                      <Svg width={chartW} height={chartH}>
                        <Line x1={padX} y1={padY} x2={chartW - padX} y2={padY} stroke={theme.border} strokeDasharray="4,4" strokeWidth={1} />
                        <Line x1={padX} y1={chartH - padY} x2={chartW - padX} y2={chartH - padY} stroke={theme.border} strokeDasharray="4,4" strokeWidth={1} />
                        <Path d={dPath} fill="none" stroke={theme.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        {coords.map((pt, i) => (
                          <Circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r={selectedPointIdx === i ? 6 : 4}
                            fill={selectedPointIdx === i ? theme.accent : theme.cardBg}
                            stroke={theme.accent}
                            strokeWidth={2}
                            onPress={() => setSelectedPointIdx(i)}
                          />
                        ))}
                      </Svg>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: chartW, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>{chartPoints[0].date} ({chartPoints[0].value} kg)</Text>
                        <Text style={{ fontSize: 10, color: theme.accent, fontWeight: '700' }}>
                          {chartPoints[chartPoints.length - 1].date} ({chartPoints[chartPoints.length - 1].value} kg)
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* History Section */}
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <Activity size={20} color={theme.accent} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Historique des séries</Text>
              </View>

              {exerciseHistory.length > 0 ? (
                exerciseHistory.map((item, idx) => (
                  <View key={idx} style={[styles.historyRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                    <View style={styles.historyDate}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 6 }}>
                        <Calendar size={14} color={theme.textMuted} />
                        <Text style={[styles.historyDateText, { color: theme.text }]}>
                          {item.dateFormatted}
                        </Text>
                        {item.isException && (
                          <View style={[styles.exceptionBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
                            <AlertTriangle size={10} color="#F59E0B" style={{ marginRight: 3 }} />
                            <Text style={[styles.exceptionBadgeText, { color: '#F59E0B' }]}>
                              Exception{item.exceptionReason ? ` · ${formatExceptionReason(item.exceptionReason, true)}` : ''}
                            </Text>
                          </View>
                        )}
                        {item.painAlert && (
                          <View style={[styles.painBadge, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
                            <AlertTriangle size={10} color="#EF4444" style={{ marginRight: 3 }} />
                            <Text style={[styles.painBadgeText, { color: '#EF4444' }]}>
                              Douleur{item.painSeverity ? ` Niv.${item.painSeverity}` : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.setsContainer}>
                      {item.sets.map((set, sIdx) => (
                        <View key={sIdx} style={[styles.setRow, set.isPr && { backgroundColor: theme.surface }]}>
                          <Text style={[styles.setText, { color: theme.text }]}>
                            {set.weightKg > 0 ? `${set.weightKg} kg` : 'PDC'} × {set.reps} reps
                          </Text>
                          {set.isPr && (
                            <Trophy size={14} color={theme.accent} style={{ marginLeft: 8 }} />
                          )}
                        </View>
                      ))}
                    </View>
                    {item.sessionNotes && item.sessionNotes.length > 0 && (
                      <View style={styles.sessionNotesBox}>
                        {item.sessionNotes.map((sn) => {
                          const typeCfg = NOTE_TYPES_CONFIG[sn.type] || NOTE_TYPES_CONFIG.autre;
                          return (
                            <View
                              key={sn.id}
                              style={[
                                styles.sessionNoteChip,
                                {
                                  backgroundColor: sn.type === 'douleur' ? '#EF444415' : `${typeCfg.color}15`,
                                  borderColor: sn.type === 'douleur' ? '#EF444440' : `${typeCfg.color}35`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.sessionNoteChipTag,
                                  { color: sn.type === 'douleur' ? '#EF4444' : typeCfg.color },
                                ]}
                              >
                                {typeCfg.label}{sn.severity ? ` (Niv.${sn.severity})` : ''} :
                              </Text>
                              <Text style={[styles.sessionNoteChipText, { color: theme.text }]}>
                                {sn.text}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted }}>Aucun historique pour cet exercice</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  muscleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  muscleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  prGrid: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  prItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  prLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  prValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyRow: {
    padding: 16,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDateText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  setsContainer: {
    gap: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  setText: {
    fontSize: 15,
    fontWeight: '500',
  },
  exceptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  exceptionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  painBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  painBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sessionNotesBox: {
    marginTop: 8,
    gap: 4,
  },
  sessionNoteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  sessionNoteChipTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginRight: 4,
  },
  sessionNoteChipText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
