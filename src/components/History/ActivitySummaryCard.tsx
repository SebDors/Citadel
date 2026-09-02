import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { WorkoutSession, CircuitBlock, getSessionBlocks, formatCircuitSummary } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { useRouter } from 'expo-router';
import { Trash2, Clock, Dumbbell, Award, CheckCircle2, RotateCw, BookmarkPlus, Eye } from 'lucide-react-native';
import { PastSessionDetailModal } from './PastSessionDetailModal';

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
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  // Mode 1: Affichage d'une séance spécifique (Carte compacte d'historique)
  if (session) {
    const formattedDate = new Date(session.startTime).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const formattedTime = new Date(session.startTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const blocks = getSessionBlocks(session);
    const circuitBlock = blocks.find((b): b is CircuitBlock => b.type === 'circuit');

    const isAMRAP = circuitBlock
      ? (circuitBlock.circuitType === 'amrap' || circuitBlock.title?.toLowerCase().includes('amrap') || session.title?.toLowerCase().includes('amrap'))
      : (session.isCircuit && session.title?.toLowerCase().includes('amrap'));

    const isCircuitRound = !isAMRAP && (circuitBlock !== undefined || session.isCircuit === true);
    const circuitRounds = session.completedRoundsCount || session.circuitRounds || (circuitBlock?.rounds) || 0;

    const blockSummaries: string[] = [];
    const targetMusclesSet = new Set<string>();

    blocks.forEach((b) => {
      if (b.type === 'single') {
        if (b.exercise.exerciseName) {
          blockSummaries.push(b.exercise.exerciseName);
        }
        if (b.exercise.primaryMuscle) targetMusclesSet.add(b.exercise.primaryMuscle);
        if (b.exercise.targetMuscles) b.exercise.targetMuscles.forEach((m) => targetMusclesSet.add(m));
      } else if (b.type === 'circuit') {
        blockSummaries.push(formatCircuitSummary(b));

        b.exercises.forEach((ex) => {
          if (ex.primaryMuscle) targetMusclesSet.add(ex.primaryMuscle);
          if (ex.targetMuscles) ex.targetMuscles.forEach((m) => targetMusclesSet.add(m));
        });
      }
    });

    const exercisesStr = blockSummaries.join(' · ');
    const targetMusclesList = Array.from(targetMusclesSet);

    const [showDetail, setShowDetail] = useState(false);

    return (
      <Card style={styles.cardMargin}>
        {/* Header de la séance + Bouton de suppression 🗑️ */}
        <View style={styles.sessionHeaderRow}>
          <TouchableOpacity
            style={styles.sessionTitleBox}
            activeOpacity={0.7}
            onPress={() => setShowDetail(true)}
          >
            <Text style={[styles.sessionTitle, { color: theme.text }]} numberOfLines={1}>
              {session.title}
            </Text>
            <Text style={[styles.sessionDateText, { color: theme.textMuted }]}>
              {formattedDate} · {formattedTime}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface, marginRight: 8 }]}
              onPress={() => setShowDetail(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Voir le détail de la séance"
            >
              <Eye size={16} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface, marginRight: 8 }]}
              onPress={() => router.push({ pathname: '/template-editor', params: { fromSessionId: session.id } })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Enregistrer comme modèle"
            >
              <BookmarkPlus size={16} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleDelete(session.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Supprimer la séance"
            >
              <Trash2 size={16} color={theme.danger} />
            </TouchableOpacity>
          </View>
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
            {isAMRAP || isCircuitRound ? (
              <RotateCw size={12} color={theme.primary} />
            ) : (
              <CheckCircle2 size={12} color={theme.primary} />
            )}
            <Text style={[styles.statValue, { color: theme.text }]}>
              {isAMRAP || isCircuitRound
                ? `${circuitRounds} tour${circuitRounds > 1 ? 's' : ''}`
                : `${session.completedSetsCount} série${session.completedSetsCount > 1 ? 's' : ''}`}
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
        {/* Modal de confirmation de suppression personnalisée */}
        <Modal visible={!!sessionToDelete} transparent animationType="fade" onRequestClose={() => setSessionToDelete(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSessionToDelete(null)}>
            <View style={[styles.deleteModalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Supprimer la séance</Text>
              <Text style={[styles.deleteModalSub, { color: theme.textMuted }]}>
                Voulez-vous vraiment supprimer cette séance de votre historique ?
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
                      if (onDeleteSession) {
                        onDeleteSession(sessionToDelete);
                      } else {
                        await deleteWorkoutSession(sessionToDelete);
                      }
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
          visible={showDetail}
          session={session}
          onClose={() => setShowDetail(false)}
        />
      </Card>
    );
  }

  // Mode 2: Bloc de statistiques de l'activité de la semaine (commençant au lundi)
  const historyList = history || [];
  
  // Obtenir le lundi 00:00:00 de la semaine en cours
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: Dimanche, 1: Lundi, ...
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfCurrentWeek = new Date(now.setDate(diffToMonday));
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  // Filtrer les séances réalisées depuis le lundi de la semaine courante
  const currentWeekSessions = historyList.filter(
    (s) => new Date(s.startTime) >= startOfCurrentWeek
  );

  const totalVolume = currentWeekSessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalSeconds = currentWeekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  return (
    <Card style={styles.cardMargin}>
      <View style={styles.cardHeaderRow}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Activité de la Semaine</Text>
        <Text style={[styles.cardSubTitle, { color: theme.textMuted }]}>Lun. - Dim.</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Award size={18} color={theme.accent} />
          <Text style={[styles.value, { color: theme.text }]}>{currentWeekSessions.length}</Text>
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubTitle: {
    fontSize: 12,
    fontWeight: '600',
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
  actionBtn: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
