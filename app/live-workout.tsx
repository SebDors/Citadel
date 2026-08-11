import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useWorkout } from '../src/context/WorkoutContext';
import { useTheme } from '../src/context/ThemeContext';
import { LiveWorkoutHeader } from '../src/components/Workout/LiveWorkoutHeader';
import { ExerciseCard } from '../src/components/Workout/ExerciseCard';
import { RestTimerBar } from '../src/components/Workout/RestTimerBar';
import { Button } from '../src/components/UI/Button';
import { useRouter } from 'expo-router';
import { EXERCISE_DATABASE, SharedExercise } from '../src/constants/exerciseDatabase';
import { Plus, ArrowLeft, Check, Layers, Play, Zap, Repeat } from 'lucide-react-native';

export default function LiveWorkoutScreen() {
  const {
    activeSession,
    finishWorkout,
    cancelWorkout,
    updateSet,
    toggleSetComplete,
    addSet,
    removeSet,
    addExerciseToActiveWorkout,
    removeExercise,
    duplicateExercise,
    updateExerciseRestTime,
    setExerciseSupersetGroup,
  } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [activeCircuitRound, setActiveCircuitRound] = useState(1);

  if (!activeSession) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune séance en cours</Text>
          <Button title="Retour à l'accueil" variant="primary" onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  const handleFinish = async () => {
    await finishWorkout();
    router.replace('/(tabs)/history');
  };

  const handleCancel = () => {
    cancelWorkout();
    router.replace('/(tabs)');
  };

  const handleSelectSharedExercise = (ex: SharedExercise) => {
    addExerciseToActiveWorkout(ex.name, ex.primaryMuscle, ex.targetMuscles, ex.defaultRestSeconds);
    setShowAddExModal(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Bar Navigation */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Workout Tracker</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Carte d'En-tête de Séance (Fixe en haut) */}
        <LiveWorkoutHeader session={activeSession} onFinish={handleFinish} onCancel={handleCancel} />

        {/* SI MODE CIRCUIT : Interface réinventée correspondant exactement à la capture Epilog 1 */}
        {activeSession.isCircuit ? (
          <View style={[styles.circuitContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.circuitBadgeHeader}>
              <Repeat size={14} color="#8B5CF6" />
              <Text style={[styles.circuitBadgeText, { color: '#8B5CF6' }]}>⚡ CIRCUIT</Text>
            </View>

            <Text style={[styles.circuitTitle, { color: theme.text }]}>{activeSession.title}</Text>
            <Text style={[styles.circuitSub, { color: theme.textMuted }]}>
              {activeSession.exercises.length} EXOS · {activeSession.circuitRounds || 3} TOURS · 44%
            </Text>

            {/* Tour en cours et bar de progression */}
            <View style={[styles.roundProgressBox, { backgroundColor: theme.surface }]}>
              <Text style={[styles.roundLabel, { color: '#8B5CF6' }]}>
                TOUR EN COURS : {activeCircuitRound} / {activeSession.circuitRounds || 3}
              </Text>
              <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.progressBarFill, { backgroundColor: '#8B5CF6', width: `${(activeCircuitRound / (activeSession.circuitRounds || 3)) * 100}%` }]} />
              </View>
            </View>

            {/* Liste des exercices du circuit */}
            {activeSession.exercises.map((ex, idx) => {
              const currentSet = ex.sets[activeCircuitRound - 1] || ex.sets[0];
              const isCompleted = currentSet?.completed;

              return (
                <View
                  key={ex.id}
                  style={[
                    styles.circuitItemCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    idx === 2 && { borderColor: '#8B5CF6', borderWidth: 2 }, // Highlight active item
                  ]}
                >
                  <View style={styles.circuitItemTop}>
                    <View style={[styles.numberCircle, { backgroundColor: theme.cardBg }]}>
                      <Text style={[styles.numberText, { color: theme.text }]}>{idx + 1}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.circuitExName, { color: theme.text }]}>{ex.exerciseName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <TextInput
                          style={[styles.repsInput, { color: theme.text, borderColor: theme.border }]}
                          keyboardType="numeric"
                          value={currentSet?.reps !== undefined ? String(currentSet.reps) : ''}
                          onChangeText={(val) => updateSet(ex.id, currentSet.id, 'reps', parseInt(val, 10) || 0)}
                          placeholder="10"
                          placeholderTextColor={theme.textMuted}
                        />
                        <Text style={[styles.circuitExSub, { color: theme.textMuted, marginLeft: 6 }]}>
                          reps · {ex.primaryMuscle}
                        </Text>
                      </View>
                    </View>

                    {/* Round status dots (e.g. ● ● ◯) */}
                    <View style={styles.dotsRow}>
                      {Array.from({ length: activeSession.circuitRounds || 3 }).map((_, rIdx) => (
                        <View
                          key={rIdx}
                          style={[
                            styles.roundDot,
                            { backgroundColor: ex.sets[rIdx]?.completed ? '#8B5CF6' : theme.border },
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Big Action Button [✓ Fait] */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.circuitDoneBtn,
                      { backgroundColor: isCompleted ? '#8B5CF6' : theme.accent },
                    ]}
                    onPress={() => toggleSetComplete(ex.id, currentSet.id)}
                  >
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.circuitDoneBtnText}>
                      {isCompleted ? 'Validé' : '✓ Fait'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          /* SÉANCE NORMALE OU LIBRE */
          activeSession.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onUpdateSet={(setId, field, val) => updateSet(ex.id, setId, field, val)}
              onToggleSetComplete={(setId) => toggleSetComplete(ex.id, setId)}
              onAddSet={() => addSet(ex.id)}
              onRemoveSet={(setId) => removeSet(ex.id, setId)}
              onDuplicateExercise={() => duplicateExercise(ex.id)}
              onRemoveExercise={() => removeExercise(ex.id)}
              onUpdateRestTime={(newRest) => updateExerciseRestTime(ex.id, newRest)}
              onSetSupersetGroup={(grp) => setExerciseSupersetGroup(ex.id, grp)}
            />
          ))
        )}

        {/* Bouton Ajouter un exercice */}
        <Button
          title="Ajouter un exercice à la séance"
          variant="outline"
          onPress={() => setShowAddExModal(true)}
          icon={<Plus size={18} color={theme.accent} />}
          style={{ marginTop: 14 }}
        />
      </ScrollView>

      {/* Modal Ajout d'Exercice depuis la Base de Données */}
      <Modal visible={showAddExModal} transparent animationType="slide" onRequestClose={() => setShowAddExModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddExModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sélectionner un exercice</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {EXERCISE_DATABASE.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.dbRow, { borderBottomColor: theme.border }]}
                  onPress={() => handleSelectSharedExercise(ex)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dbExName, { color: theme.text }]}>{ex.name}</Text>
                    <Text style={[styles.dbExMuscle, { color: theme.textMuted }]}>{ex.primaryMuscle}</Text>
                  </View>
                  <Plus size={18} color={theme.accent} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Rest Timer Bar */}
      <RestTimerBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  circuitContainer: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  circuitBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  circuitBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 4,
  },
  circuitTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  circuitSub: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  roundProgressBox: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  roundLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  circuitItemCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  circuitItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 13,
    fontWeight: '900',
  },
  circuitExName: {
    fontSize: 15,
    fontWeight: '800',
  },
  repsInput: {
    width: 40,
    height: 28,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
  },
  circuitExSub: {
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  circuitDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  circuitDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  dbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  dbExName: {
    fontSize: 15,
    fontWeight: '700',
  },
  dbExMuscle: {
    fontSize: 12,
  },
});
