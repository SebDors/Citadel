import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { WorkoutSession, CircuitBlock, getSessionBlocks, formatCircuitSummary } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Clock,
  Dumbbell,
  Layers,
  RotateCw,
  BookmarkPlus,
  Eye,
} from 'lucide-react-native';
import { PastSessionDetailModal } from './PastSessionDetailModal';

interface CalendarViewProps {
  history: WorkoutSession[];
}

const MONTHS_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export const CalendarView: React.FC<CalendarViewProps> = ({ history }) => {
  const { theme } = useTheme();
  const { deleteWorkoutSession } = useWorkout();
  const router = useRouter();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  const [currentMonthIndex, setCurrentMonthIndex] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // État de la modale pour le jour sélectionné
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [selectedDetailSession, setSelectedDetailSession] = useState<WorkoutSession | null>(null);

  const isCurrentMonthView =
    currentMonthIndex === now.getMonth() && currentYear === now.getFullYear();

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleResetToToday = () => {
    setCurrentMonthIndex(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthStr = (currentMonthIndex + 1).toString().padStart(2, '0');

  // Filtrer les séances pour le mois en cours
  const workoutDates = history.map((s) => s.startTime.split('T')[0]);

  const handleDayPress = (dateStr: string, hasWorkout: boolean) => {
    if (!hasWorkout) return;
    setSelectedDate(dateStr);
    setModalVisible(true);
  };

  // Séances du jour sélectionné
  const daySessions = selectedDate
    ? history.filter((s) => s.startTime.split('T')[0] === selectedDate)
    : [];

  const formattedSelectedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  return (
    <Card style={styles.cardContainer}>
      {/* Selector Navigation (< Mois Année >) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <TouchableOpacity onPress={handleResetToToday} activeOpacity={0.7}>
            <Text style={[styles.title, { color: theme.text }]}>
              {MONTHS_NAMES[currentMonthIndex]} {currentYear}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {workoutDates.length} séances réalisées
          </Text>
        </View>

        <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
          <ChevronRight size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.daysHeader}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
          <Text key={idx} style={[styles.dayName, { color: theme.textMuted }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((d) => {
          const dayPad = d < 10 ? `0${d}` : `${d}`;
          const dateStr = `${currentYear}-${monthStr}-${dayPad}`;
          const hasWorkout = workoutDates.includes(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <TouchableOpacity
              key={d}
              disabled={!hasWorkout}
              onPress={() => handleDayPress(dateStr, hasWorkout)}
              style={[
                styles.dayCell,
                hasWorkout ? { backgroundColor: theme.surface, borderRadius: 8 } : null,
                isToday
                  ? {
                      borderColor: theme.accent,
                      borderWidth: 2,
                      borderRadius: 10,
                      backgroundColor: hasWorkout ? `${theme.accent}25` : `${theme.accent}15`,
                    }
                  : null,
              ]}
              activeOpacity={hasWorkout ? 0.6 : 1}
            >
              <Text
                style={[
                  styles.dayNum,
                  { color: theme.text },
                  hasWorkout ? { fontWeight: '900', color: theme.accent } : null,
                  isToday ? { fontWeight: '900', color: theme.accent } : null,
                ]}
              >
                {d}
              </Text>

              {hasWorkout && <View style={[styles.dot, { backgroundColor: theme.accent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* MODALE DU JOUR SELECTIONNE */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Détail de la journée
                </Text>
                <Text style={[styles.modalDateSubtitle, { color: theme.textMuted }]}>
                  {formattedSelectedDate}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.surface }]}
              >
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView contentContainerStyle={styles.modalScrollBody}>
              {daySessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    Aucune séance pour cette date.
                  </Text>
                </View>
              ) : (
                daySessions.map((session) => {
                  const blocks = getSessionBlocks(session);
                  const circuitBlock = blocks.find((b): b is CircuitBlock => b.type === 'circuit');

                  const isAMRAP = circuitBlock
                    ? (circuitBlock.circuitType === 'amrap' || circuitBlock.title?.toLowerCase().includes('amrap') || session.title?.toLowerCase().includes('amrap'))
                    : (session.isCircuit && session.title?.toLowerCase().includes('amrap'));

                  const isCircuitRound = !isAMRAP && (circuitBlock !== undefined || session.isCircuit === true);
                  const circuitRounds = session.completedRoundsCount || session.circuitRounds || (circuitBlock?.rounds) || 0;

                  const fallbackSetsCount = blocks.reduce((sum, b) => {
                    if (b.type === 'single') return sum + (b.exercise.sets?.length || 0);
                    if (b.type === 'circuit') return sum + (b.rounds * b.exercises.length);
                    return sum;
                  }, 0);

                  const setsCount =
                    session.completedSetsCount ??
                    session.totalSetsCount ??
                    fallbackSetsCount;

                  const blockSummaries = blocks.map((b) => {
                    if (b.type === 'single') {
                      return b.exercise.exerciseName;
                    } else if (b.type === 'circuit') {
                      return formatCircuitSummary(b);
                    }
                    return '';
                  }).filter(Boolean);

                  const summaryStr = blockSummaries.join(' · ');

                  return (
                    <View
                      key={session.id}
                      style={[
                        styles.sessionCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      {/* Session Header: Details & Delete Session Button */}
                      <View style={styles.sessionCardHeader}>
                        <TouchableOpacity
                          style={styles.sessionInfo}
                          activeOpacity={0.7}
                          onPress={() => setSelectedDetailSession(session)}
                        >
                          <Text style={[styles.sessionCardTitle, { color: theme.text }]}>
                            {session.title}
                          </Text>

                          <View style={styles.statsRow}>
                            <View style={styles.statBadge}>
                              <Clock size={14} color={theme.textMuted} />
                              <Text style={[styles.statBadgeText, { color: theme.text }]}>
                                {Math.floor(session.durationSeconds / 60)} min
                              </Text>
                            </View>

                            <View style={styles.statBadge}>
                              <Dumbbell size={14} color={theme.secondary} />
                              <Text style={[styles.statBadgeText, { color: theme.text }]}>
                                {session.totalVolumeKg} kg
                              </Text>
                            </View>

                            <View style={styles.statBadge}>
                              {isAMRAP || isCircuitRound ? (
                                <RotateCw size={14} color={theme.primary} />
                              ) : (
                                <Layers size={14} color={theme.primary} />
                              )}
                              <Text style={[styles.statBadgeText, { color: theme.text }]}>
                                {isAMRAP || isCircuitRound
                                  ? `${circuitRounds} tour${circuitRounds > 1 ? 's' : ''}`
                                  : `${setsCount} ${setsCount > 1 ? 'séries' : 'série'}`}
                              </Text>
                            </View>
                          </View>

                          {summaryStr ? (
                            <Text style={[styles.modalExercisesText, { color: theme.textMuted }]} numberOfLines={2}>
                              {summaryStr}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            style={[styles.actionIconButton, { backgroundColor: theme.cardBg, marginRight: 8 }]}
                            onPress={() => setSelectedDetailSession(session)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel="Voir le détail de la séance"
                          >
                            <Eye size={18} color={theme.accent} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionIconButton, { backgroundColor: theme.cardBg, marginRight: 8 }]}
                            onPress={() => {
                              setModalVisible(false);
                              router.push({ pathname: '/template-editor', params: { fromSessionId: session.id } });
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel="Enregistrer comme modèle"
                          >
                            <BookmarkPlus size={18} color={theme.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionIconButton, { backgroundColor: theme.cardBg }]}
                            onPress={() => handleDeleteSession(session.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel="Supprimer la séance"
                          >
                            <Trash2 size={18} color={theme.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation de suppression de séance personnalisée */}
      <Modal visible={!!sessionToDelete} transparent animationType="fade" onRequestClose={() => setSessionToDelete(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSessionToDelete(null)}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Supprimer la séance</Text>
            <Text style={[styles.deleteModalSub, { color: theme.textMuted }]}>
              Voulez-vous vraiment supprimer cette séance complète de l'historique ?
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => setSessionToDelete(null)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Supprimer"
                variant="danger"
                onPress={async () => {
                  if (sessionToDelete) {
                    await deleteWorkoutSession(sessionToDelete);
                  }
                  setSessionToDelete(null);
                }}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modale de détail en lecture seule de la séance */}
      <PastSessionDetailModal
        visible={!!selectedDetailSession}
        session={selectedDetailSession}
        onClose={() => setSelectedDetailSession(null)}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navBtn: {
    padding: 6,
  },
  titleBox: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayName: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '500',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalDateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  modalScrollBody: {
    padding: 16,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionIconButton: {
    padding: 10,
    borderRadius: 10,
  },
  modalExercisesText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 16,
  },
  deleteModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
