import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { X, Trophy, Activity, Calendar, Dumbbell } from 'lucide-react-native';
import { WorkoutSession, getSessionBlocks } from '../../types';
import { useTheme } from '../../context/ThemeContext';

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

  // Extract history and PRs for this specific exercise
  const { exerciseHistory, prs } = useMemo(() => {
    let bestWeight = 0;
    let bestReps = 0;
    let prDate = '';

    const historyItems: {
      date: string;
      dateFormatted: string;
      sets: { weightKg: number; reps: number; isPr: boolean }[];
    }[] = [];

    const sortedSessions = [...history].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    sortedSessions.forEach(session => {
      let foundSets: { weightKg: number; reps: number; isPr: boolean }[] = [];
      const sessionDate = new Date(session.startTime);
      const dateFormatted = sessionDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const dateStr = sessionDate.toISOString();

      const targetName = exerciseName.trim().toLowerCase();
      const blocks = getSessionBlocks(session);

      blocks.forEach(block => {
        if (block.type === 'single') {
          if (block.exercise.exerciseName.trim().toLowerCase() === targetName) {
            block.exercise.sets.forEach(set => {
              if (set.completed) {
                const w = set.weightKg || 0;
                const r = set.reps || 0;
                let isPr = false;
                if (w > bestWeight || (w === bestWeight && r > bestReps)) {
                  bestWeight = w;
                  bestReps = r;
                  prDate = dateFormatted;
                  isPr = true;
                }
                foundSets.push({ weightKg: w, reps: r, isPr });
              }
            });
          }
        }
      });

      if (foundSets.length > 0) {
        historyItems.push({
          date: dateStr,
          dateFormatted,
          sets: foundSets
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

    const e1RM = bestWeight > 0 ? Math.round(bestWeight * (1 + bestReps / 30)) : 0;

    return {
      exerciseHistory: historyItems,
      prs: { bestWeight, bestReps, e1RM, prDate }
    };
  }, [history, exerciseName]);

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
                    {prs.e1RM > 0 ? `${prs.e1RM} kg` : '-'}
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
                      <Calendar size={14} color={theme.textMuted} />
                      <Text style={[styles.historyDateText, { color: theme.text }]}>
                        {item.dateFormatted}
                      </Text>
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
});
