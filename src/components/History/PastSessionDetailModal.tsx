import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { WorkoutSession, SingleExerciseBlock, CircuitBlock, getSessionBlocks, formatCircuitSummary } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import {
  X,
  Clock,
  Dumbbell,
  CheckCircle2,
  BookmarkPlus,
  Layers,
  RotateCw,
  Award,
  Calendar as CalendarIcon,
} from 'lucide-react-native';

interface PastSessionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
}

export const PastSessionDetailModal: React.FC<PastSessionDetailModalProps> = ({
  visible,
  onClose,
  session,
}) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  if (!session) return null;

  const formattedDate = new Date(session.startTime).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(session.startTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const blocks = getSessionBlocks(session);

  const handleConvertToTemplate = () => {
    onClose();
    router.push({ pathname: '/template-editor', params: { fromSessionId: session.id } });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Header de la Modale */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {session.title}
              </Text>
              <Text style={[styles.dateText, { color: theme.textMuted }]}>
                {formattedDate} · {formattedTime}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={handleConvertToTemplate}
                accessibilityLabel="Transformer en programme"
              >
                <BookmarkPlus size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bandeau Récapitulatif des Métriques */}
          <View style={[styles.metricsBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.metricCell}>
              <Clock size={14} color={theme.textMuted} />
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {Math.floor((session.durationSeconds || 0) / 60)} min
              </Text>
              <Text style={[styles.metricSub, { color: theme.textMuted }]}>Durée</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.metricCell}>
              <Dumbbell size={14} color={theme.accent} />
              <Text style={[styles.metricVal, { color: theme.accent }]}>
                {(session.totalVolumeKg || 0).toFixed(1)} kg
              </Text>
              <Text style={[styles.metricSub, { color: theme.textMuted }]}>Volume total</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.metricCell}>
              <CheckCircle2 size={14} color={theme.primary} />
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {session.completedSetsCount || 0} / {session.totalSetsCount || 0}
              </Text>
              <Text style={[styles.metricSub, { color: theme.textMuted }]}>Séries validées</Text>
            </View>
          </View>

          {/* Contenu Défilant des Exercices et Séries (LECTURE SEULE) */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {blocks.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Aucun exercice enregistré pour cette séance.
              </Text>
            ) : (
              blocks.map((block, bIdx) => {
                if (block.type === 'single') {
                  const ex = block.exercise;
                  const sets = ex.sets || [];

                  return (
                    <View
                      key={block.id || bIdx}
                      style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      {/* Titre de l'exercice */}
                      <View style={styles.blockHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.exerciseTitle, { color: theme.text }]}>
                            {ex.exerciseName}
                          </Text>
                          <Text style={[styles.exerciseSub, { color: theme.textMuted }]}>
                            {ex.primaryMuscle} {ex.restSeconds ? `• ${ex.restSeconds}s repos` : ''}
                          </Text>
                        </View>
                      </View>

                      {/* En-tête du tableau des séries */}
                      <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.colHead, styles.colSet, { color: theme.textMuted }]}>SÉRIE</Text>
                        <Text style={[styles.colHead, styles.colVal, { color: theme.textMuted }]}>CHARGE</Text>
                        <Text style={[styles.colHead, styles.colVal, { color: theme.textMuted }]}>REPS</Text>
                        <Text style={[styles.colHead, styles.colStatus, { color: theme.textMuted }]}>STATUT</Text>
                      </View>

                      {/* Liste des séries en lecture seule */}
                      {sets.map((s, sIdx) => {
                        const weightStr = s.weightKg !== undefined && s.weightKg !== null ? `${s.weightKg.toFixed(1)} kg` : '-';
                        const repsStr = s.reps !== undefined && s.reps !== null ? `${s.reps}` : '-';

                        return (
                          <View key={s.id || sIdx} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                            <View style={styles.colSet}>
                              <Text style={[styles.setNumText, { color: theme.text }]}>#{s.setNumber || sIdx + 1}</Text>
                              {s.type && s.type !== 'normal' && (
                                <Text style={[styles.setTypeText, { color: theme.accent }]}>
                                  {s.type.toUpperCase()}
                                </Text>
                              )}
                            </View>

                            <Text style={[styles.colVal, styles.valText, { color: theme.text }]}>
                              {weightStr}
                            </Text>

                            <Text style={[styles.colVal, styles.valText, { color: theme.text }]}>
                              {repsStr}
                            </Text>

                            <View style={styles.colStatus}>
                              {s.completed ? (
                                <View style={[styles.statusBadge, { backgroundColor: theme.primary + '22' }]}>
                                  <CheckCircle2 size={12} color={theme.primary} />
                                  <Text style={[styles.statusText, { color: theme.primary }]}>Fait</Text>
                                </View>
                              ) : (
                                <Text style={[styles.statusTextPending, { color: theme.textMuted }]}>-</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                } else if (block.type === 'circuit') {
                  const circuit = block as CircuitBlock;
                  return (
                    <View
                      key={circuit.id || bIdx}
                      style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <View style={styles.blockHeader}>
                        <RotateCw size={16} color={theme.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.exerciseTitle, { color: theme.text }]}>
                          {circuit.title || 'Circuit'}
                        </Text>
                        <Text style={[styles.exerciseSub, { color: theme.textMuted, marginLeft: 8 }]}>
                          ({circuit.rounds} tour{circuit.rounds > 1 ? 's' : ''})
                        </Text>
                      </View>

                      {circuit.exercises.map((cEx, cIdx) => (
                        <View key={cEx.id || cIdx} style={[styles.circuitRow, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.itemName, { color: theme.text }]}>{cEx.exerciseName}</Text>
                          <Text style={[styles.itemDetail, { color: theme.textMuted }]}>
                            {cEx.targetValue} {cEx.targetType === 'reps' ? 'reps' : 'sec'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                }
                return null;
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
  },
  scrollBody: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 30,
  },
  blockCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  colHead: {
    fontSize: 10,
    fontWeight: '800',
  },
  colSet: {
    width: 60,
  },
  colVal: {
    flex: 1,
    textAlign: 'center',
  },
  colStatus: {
    width: 70,
    alignItems: 'flex-end',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  setNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  setTypeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  valText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPending: {
    fontSize: 12,
  },
  circuitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemDetail: {
    fontSize: 12,
    fontWeight: '600',
  },
});
