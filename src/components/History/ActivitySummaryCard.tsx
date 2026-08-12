import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { WorkoutSession, getSessionBlocks } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Trash2, Clock, Dumbbell, Award, CheckCircle2 } from 'lucide-react-native';

interface ActivitySummaryCardProps {
  session?: WorkoutSession;
  history?: WorkoutSession[];
  onDeleteSession?: (sessionId: string) => void;
}

export const ActivitySummaryCard: React.FC<ActivitySummaryCardProps> = ({
  session,
  history,
  onDeleteSession,
}) => {
  const { theme } = useTheme();
  const { deleteWorkoutSession } = useWorkout();

  const handleDelete = (sessionId: string) => {
    Alert.alert(
      'Supprimer la séance',
      'Voulez-vous vraiment supprimer cette séance de votre historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteSession) {
              onDeleteSession(sessionId);
            } else {
              await deleteWorkoutSession(sessionId);
            }
          },
        },
      ]
    );
  };

  // Mode 1: Affichage d'une séance spécifique (Carte compacte d'historique)
  if (session) {
    const formattedDate = new Date(session.startTime).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const blocks = getSessionBlocks(session);
    const exerciseNames: string[] = [];
    const targetMusclesSet = new Set<string>();

    blocks.forEach((b) => {
      if (b.type === 'single') {
        exerciseNames.push(b.exercise.exerciseName);
        if (b.exercise.primaryMuscle) targetMusclesSet.add(b.exercise.primaryMuscle);
        if (b.exercise.targetMuscles) b.exercise.targetMuscles.forEach((m) => targetMusclesSet.add(m));
      } else if (b.type === 'circuit') {
        b.exercises.forEach((ex) => {
          exerciseNames.push(ex.exerciseName);
          if (ex.primaryMuscle) targetMusclesSet.add(ex.primaryMuscle);
          if (ex.targetMuscles) ex.targetMuscles.forEach((m) => targetMusclesSet.add(m));
        });
      }
    });

    const exercisesStr = exerciseNames.join(', ');
    const targetMusclesList = Array.from(targetMusclesSet);

    return (
      <Card style={styles.cardMargin}>
        {/* Header de la séance + Bouton de suppression 🗑️ */}
        <View style={styles.sessionHeaderRow}>
          <View style={styles.sessionTitleBox}>
            <Text style={[styles.sessionTitle, { color: theme.text }]} numberOfLines={1}>
              {session.title}
            </Text>
            <Text style={[styles.sessionDateText, { color: theme.textMuted }]}>
              {formattedDate}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: theme.surface }]}
            onPress={() => handleDelete(session.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Supprimer la séance"
          >
            <Trash2 size={16} color={theme.danger} />
          </TouchableOpacity>
        </View>

        {/* Métriques clés sur une ligne compacte */}
        <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Clock size={12} color={theme.textMuted} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {Math.floor(session.durationSeconds / 60)} min
            </Text>
          </View>

          <View style={styles.statItem}>
            <Dumbbell size={12} color={theme.secondary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {session.totalVolumeKg} kg
            </Text>
          </View>

          <View style={styles.statItem}>
            <CheckCircle2 size={12} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {session.completedSetsCount} séries
            </Text>
          </View>
        </View>

        {/* Ligne 1 : Liste des exercices de la séance à la suite sur une seule ligne */}
        <View style={styles.singleLineRow}>
          <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Exos : </Text>
          <Text
            style={[styles.exercisesText, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {exercisesStr || 'Aucun exercice enregistré'}
          </Text>
        </View>

        {/* Ligne 2 : Muscles ciblés en dessous à la suite sur une ligne compacte */}
        <View style={styles.singleLineRow}>
          <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Muscles : </Text>
          {targetMusclesList.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.compactMusclesScroll}
            >
              {targetMusclesList.map((muscle) => (
                <View key={muscle} style={{ marginRight: 4 }}>
                  <Badge label={muscle} variant="secondary" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.emptyMusclesText, { color: theme.textMuted }]}>-</Text>
          )}
        </View>
      </Card>
    );
  }

  // Mode 2: Bloc de statistiques globale d'activité (si history est fourni)
  const historyList = history || [];
  const totalVolume = historyList.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalSeconds = historyList.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  return (
    <Card style={styles.cardMargin}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Activité Récente</Text>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Award size={18} color={theme.accent} />
          <Text style={[styles.value, { color: theme.text }]}>{historyList.length}</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Séances</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Dumbbell size={18} color={theme.secondary} />
          <Text style={[styles.value, { color: theme.text }]}>{totalVolume} kg</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Volume Total</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Clock size={18} color={theme.primary} />
          <Text style={[styles.value, { color: theme.text }]}>{totalHours}h</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Temps Cumulé</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardMargin: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sessionDateText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  singleLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '700',
    width: 60,
  },
  exercisesText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  compactMusclesScroll: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  emptyMusclesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
