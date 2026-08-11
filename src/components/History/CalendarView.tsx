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
import { WorkoutSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Clock,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react-native';

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
  const { deleteWorkoutSession, deleteExerciseFromSession, deleteSetFromSession } = useWorkout();

  const now = new Date();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // État de la modale pour le jour sélectionné
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    Alert.alert(
      'Supprimer la séance',
      'Voulez-vous vraiment supprimer cette séance complète de l\'historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutSession(sessionId);
          },
        },
      ]
    );
  };

  const handleDeleteExercise = (sessionId: string, exerciseId: string, exerciseName: string) => {
    Alert.alert(
      'Supprimer l\'exercice',
      `Voulez-vous supprimer l'exercice "${exerciseName}" de cette séance ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteExerciseFromSession(sessionId, exerciseId);
          },
        },
      ]
    );
  };

  const handleDeleteSet = (sessionId: string, exerciseId: string, setId: string, setNum: number) => {
    Alert.alert(
      'Supprimer la série',
      `Voulez-vous supprimer la série n°${setNum} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteSetFromSession(sessionId, exerciseId, setId);
          },
        },
      ]
    );
  };

  return (
    <Card style={styles.cardContainer}>
      {/* Selector Navigation (< Mois Année >) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={[styles.title, { color: theme.text }]}>
            {MONTHS_NAMES[currentMonthIndex]} {currentYear}
          </Text>
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

          return (
            <TouchableOpacity
              key={d}
              disabled={!hasWorkout}
              onPress={() => handleDayPress(dateStr, hasWorkout)}
              style={[
                styles.dayCell,
                hasWorkout ? { backgroundColor: theme.surface, borderRadius: 8 } : null,
              ]}
              activeOpacity={hasWorkout ? 0.6 : 1}
            >
              <Text
                style={[
                  styles.dayNum,
                  { color: theme.text },
                  hasWorkout ? { fontWeight: '900', color: theme.accent } : null,
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
                daySessions.map((session) => (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    {/* Session Title & Delete Session Button */}
                    <View style={styles.sessionCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sessionCardTitle, { color: theme.text }]}>
                          {session.title}
                        </Text>
                        <Text style={[styles.sessionMetaText, { color: theme.textMuted }]}>
                          <Clock size={12} color={theme.textMuted} />{' '}
                          {Math.floor(session.durationSeconds / 60)} min •{' '}
                          <Dumbbell size={12} color={theme.secondary} /> {session.totalVolumeKg} kg
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.deleteIconButton, { backgroundColor: theme.cardBg }]}
                        onPress={() => handleDeleteSession(session.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={theme.danger} />
                      </TouchableOpacity>
                    </View>

                    {/* Exercices de la séance */}
                    {session.exercises.map((exercise) => (
                      <View
                        key={exercise.id}
                        style={[
                          styles.exerciseBox,
                          { backgroundColor: theme.cardBg, borderColor: theme.border },
                        ]}
                      >
                        <View style={styles.exerciseHeaderRow}>
                          <View style={styles.exerciseTitleArea}>
                            <Text style={[styles.exerciseName, { color: theme.text }]}>
                              {exercise.exerciseName}
                            </Text>
                            <Badge label={exercise.primaryMuscle} variant="secondary" />
                          </View>

                          <TouchableOpacity
                            onPress={() =>
                              handleDeleteExercise(session.id, exercise.id, exercise.exerciseName)
                            }
                            style={styles.deleteExBtn}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Trash2 size={14} color={theme.danger} />
                          </TouchableOpacity>
                        </View>

                        {/* Séries de l'exercice */}
                        <View style={styles.setsListContainer}>
                          {exercise.sets.map((s) => (
                            <View
                              key={s.id}
                              style={[
                                styles.setRowItem,
                                { backgroundColor: theme.surface, borderColor: theme.border },
                              ]}
                            >
                              <View style={styles.setInfoArea}>
                                <Text style={[styles.setNumText, { color: theme.text }]}>
                                  Série {s.setNumber}
                                </Text>
                                <Text style={[styles.setDetailText, { color: theme.textMuted }]}>
                                  {s.weightKg ? `${s.weightKg} kg` : '-'} ×{' '}
                                  {s.reps ? `${s.reps} reps` : '-'} (RIR {s.rir ?? 0})
                                </Text>
                              </View>

                              {s.completed && (
                                <CheckCircle2 size={14} color={theme.primary} style={{ marginRight: 8 }} />
                              )}

                              <TouchableOpacity
                                onPress={() =>
                                  handleDeleteSet(session.id, exercise.id, s.id, s.setNumber)
                                }
                                style={styles.deleteSetBtn}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Trash2 size={12} color={theme.danger} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 12,
    marginBottom: 14,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sessionMetaText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteIconButton: {
    padding: 8,
    borderRadius: 8,
  },
  exerciseBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteExBtn: {
    padding: 4,
  },
  setsListContainer: {
    gap: 4,
  },
  setRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  setInfoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  setNumText: {
    fontSize: 12,
    fontWeight: '700',
  },
  setDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteSetBtn: {
    padding: 4,
  },
});
