import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkout } from '../src/context/WorkoutContext';
import { useTheme } from '../src/context/ThemeContext';
import { LiveWorkoutHeader } from '../src/components/Workout/LiveWorkoutHeader';
import { ExerciseCard } from '../src/components/Workout/ExerciseCard';
import { RestTimerBar } from '../src/components/Workout/RestTimerBar';
import { Button } from '../src/components/UI/Button';
import { useRouter } from 'expo-router';
import { EXERCISE_DATABASE, SharedExercise } from '../src/constants/exerciseDatabase';
import { Plus, ArrowLeft, Check, Layers, Play, Zap, Repeat, Search, SkipForward, ChevronDown, ChevronUp } from 'lucide-react-native';

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
    startRestTimer,
  } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCircuitRound, setActiveCircuitRound] = useState(1);
  const [currentCircuitIdx, setCurrentCircuitIdx] = useState(0);

  // Status for each exercise in the current circuit round: 'pending' | 'validated' | 'skipped'
  const [roundStatusMap, setRoundStatusMap] = useState<Record<string, 'pending' | 'validated' | 'skipped'>>({});
  // Set of exercise IDs manually expanded when collapsed
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const totalRounds = activeSession?.circuitRounds || 3;

  // Check if all sets/rounds in the session are finished
  const isAllCompleted = useMemo(() => {
    const sessionExercises = activeSession?.exercises || [];
    if (!activeSession || sessionExercises.length === 0) return false;

    if (activeSession.isCircuit) {
      const totalEx = sessionExercises.length;
      const resolvedCount = sessionExercises.filter((ex) => {
        const status = roundStatusMap[ex.id];
        return status === 'validated' || status === 'skipped';
      }).length;
      const allSetsCompleted = sessionExercises.every(
        (ex) => ex.sets.length > 0 && ex.sets.every((s) => s.completed)
      );
      return (activeCircuitRound >= totalRounds && resolvedCount >= totalEx) || allSetsCompleted;
    }

    return sessionExercises.every(
      (ex) => ex.sets.length > 0 && ex.sets.every((s) => s.completed)
    );
  }, [activeSession, activeCircuitRound, totalRounds, roundStatusMap]);

  // Filter 52 exercises for search modal
  const filteredDatabase = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return EXERCISE_DATABASE;
    return EXERCISE_DATABASE.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.targetMuscles.some((m) => m.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!activeSession) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0 }]}>
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
    setSearchQuery('');
  };

  // Helper to check round completion and advance
  const advanceCircuitAfterAction = (
    nextStatusMap: Record<string, 'pending' | 'validated' | 'skipped'>,
    currentIdx: number
  ) => {
    if (!activeSession) return;
    const sessionExercises = activeSession.exercises || [];
    const totalEx = sessionExercises.length;
    // Count how many exercises are resolved (validated or skipped)
    const resolvedCount = sessionExercises.filter((ex) => {
      const status = nextStatusMap[ex.id];
      return status === 'validated' || status === 'skipped';
    }).length;

    if (resolvedCount >= totalEx) {
      // TOUR DE CIRCUIT TERMINÉ !
      const restTime = activeSession.restBetweenRoundsSeconds || 105;
      startRestTimer(`Tour ${activeCircuitRound} terminé`, restTime);

      if (activeCircuitRound < totalRounds) {
        // Pass to next round, reset statuses, reset index, auto-scroll to top!
        setActiveCircuitRound((prev) => prev + 1);
        setRoundStatusMap({});
        setExpandedMap({});
        setCurrentCircuitIdx(0);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        // Circuit fully complete
        setRoundStatusMap(nextStatusMap);
      }
    } else {
      // Find next pending exercise
      let nextIdx = (currentIdx + 1) % totalEx;
      let count = 0;
      while (
        (nextStatusMap[sessionExercises[nextIdx]?.id] === 'validated' ||
          nextStatusMap[sessionExercises[nextIdx]?.id] === 'skipped') &&
        count < totalEx
      ) {
        nextIdx = (nextIdx + 1) % totalEx;
        count++;
      }
      setCurrentCircuitIdx(nextIdx);
    }
  };

  const handleValidateCircuitExercise = (exId: string, setId: string, idx: number) => {
    // 1. Toggle set completion
    toggleSetComplete(exId, setId);

    // 2. Mark exercise as validated in current round
    const nextStatus = { ...roundStatusMap, [exId]: 'validated' as const };
    setRoundStatusMap(nextStatus);

    // 3. Advance to next pending exercise or next round with auto scroll to top
    advanceCircuitAfterAction(nextStatus, idx);
  };

  const handlePassCircuitExercise = (exId: string, idx: number) => {
    // Mark exercise as skipped for this round
    const nextStatus = { ...roundStatusMap, [exId]: 'skipped' as const };
    setRoundStatusMap(nextStatus);

    // Advance to next pending exercise or next round with auto scroll to top
    advanceCircuitAfterAction(nextStatus, idx);
  };

  const handleUnvalidateCircuitExercise = (exId: string, setId: string, idx: number) => {
    toggleSetComplete(exId, setId);
    setRoundStatusMap((prev) => ({ ...prev, [exId]: 'pending' }));
    setCurrentCircuitIdx(idx);
    setExpandedMap((prev) => ({ ...prev, [exId]: false }));
  };

  const handleUnpassCircuitExercise = (exId: string, idx: number) => {
    setRoundStatusMap((prev) => ({ ...prev, [exId]: 'pending' }));
    setCurrentCircuitIdx(idx);
    setExpandedMap((prev) => ({ ...prev, [exId]: false }));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0 }]}>
      {/* Top Bar Navigation */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Workout Tracker</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
        {/* 1. Carte d'En-tête de Séance (Fixe en haut) */}
        <LiveWorkoutHeader session={activeSession} onFinish={handleFinish} onCancel={handleCancel} />

        {/* MODE CIRCUIT (Couleurs Sauge/Accent, no violet) */}
        {activeSession.isCircuit ? (
          <View style={[styles.circuitContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.circuitBadgeHeader, { backgroundColor: `${theme.accent}20` }]}>
              <Repeat size={14} color={theme.accent} />
              <Text style={[styles.circuitBadgeText, { color: theme.accent }]}>⚡ CIRCUIT</Text>
            </View>

            <Text style={[styles.circuitTitle, { color: theme.text }]}>{activeSession.title}</Text>
            <Text style={[styles.circuitSub, { color: theme.textMuted }]}>
              {(activeSession.exercises || []).length} EXOS · {totalRounds} TOURS
            </Text>

            {/* Tour en cours et bar de progression */}
            <View style={[styles.roundProgressBox, { backgroundColor: theme.surface }]}>
              <Text style={[styles.roundLabel, { color: theme.accent }]}>
                TOUR EN COURS : {activeCircuitRound} / {totalRounds}
              </Text>
              <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: theme.accent, width: `${(activeCircuitRound / totalRounds) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {/* Liste des exercices du circuit */}
            {(activeSession.exercises || []).map((ex, idx) => {
              const currentSet = ex.sets[activeCircuitRound - 1] || ex.sets[0];
              const status = roundStatusMap[ex.id] || 'pending';
              const isCurrentActive = idx === currentCircuitIdx && status === 'pending';
              const isResolved = status === 'validated' || status === 'skipped';
              const isForceExpanded = !!expandedMap[ex.id];

              // Réduction de carte de ~50% quand l'exercice est validé ou passé
              if (isResolved && !isForceExpanded) {
                return (
                  <TouchableOpacity
                    key={ex.id}
                    activeOpacity={0.7}
                    style={[
                      styles.circuitItemCollapsedCard,
                      { backgroundColor: theme.surface, borderColor: status === 'validated' ? theme.accent : theme.border },
                    ]}
                    onPress={() => setExpandedMap((prev) => ({ ...prev, [ex.id]: true }))}
                  >
                    <View style={styles.collapsedLeft}>
                      <View style={[styles.numberCircle, { backgroundColor: status === 'validated' ? theme.accent : theme.border }]}>
                        <Text style={[styles.numberText, { color: status === 'validated' ? '#FFFFFF' : theme.text }]}>
                          {idx + 1}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.collapsedExName, { color: theme.text }]} numberOfLines={1}>
                          {ex.exerciseName}
                        </Text>
                        <Text style={[styles.collapsedSub, { color: theme.textMuted }]}>
                          {currentSet?.reps !== undefined ? `${currentSet.reps} reps` : '10 reps'} · {ex.primaryMuscle}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.collapsedRight}>
                      {status === 'validated' ? (
                        <View style={[styles.statusBadge, { backgroundColor: theme.accent }]}>
                          <Check size={12} color="#FFFFFF" />
                          <Text style={styles.statusBadgeText}>Validé</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusBadge, { backgroundColor: theme.border }]}>
                          <SkipForward size={12} color={theme.textMuted} />
                          <Text style={[styles.statusBadgeText, { color: theme.textMuted }]}>Passé</Text>
                        </View>
                      )}
                      <ChevronDown size={16} color={theme.textMuted} style={{ marginLeft: 6 }} />
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <View
                  key={ex.id}
                  style={[
                    styles.circuitItemCard,
                    { backgroundColor: theme.surface, borderColor: isCurrentActive ? theme.accent : theme.border },
                    isCurrentActive && { borderWidth: 2.5 },
                  ]}
                >
                  <View style={styles.circuitItemTop}>
                    <View style={[styles.numberCircle, { backgroundColor: isCurrentActive ? theme.accent : theme.cardBg }]}>
                      <Text style={[styles.numberText, { color: isCurrentActive ? '#FFFFFF' : theme.text }]}>
                        {idx + 1}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.circuitExName, { color: theme.text }]}>{ex.exerciseName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
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

                    {/* Round status dots */}
                    <View style={styles.dotsRow}>
                      {Array.from({ length: totalRounds }).map((_, rIdx) => (
                        <View
                          key={rIdx}
                          style={[
                            styles.roundDot,
                            { backgroundColor: ex.sets[rIdx]?.completed ? theme.accent : theme.border },
                          ]}
                        />
                      ))}
                    </View>

                    {isResolved && (
                      <TouchableOpacity
                        style={{ padding: 4, marginLeft: 4 }}
                        onPress={() => setExpandedMap((prev) => ({ ...prev, [ex.id]: false }))}
                      >
                        <ChevronUp size={16} color={theme.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Action Buttons: [Valider] et [Passer] pour l'exercice en cours */}
                  {isCurrentActive && (
                    <View style={styles.circuitActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.circuitDoneBtn,
                          { flex: 1, backgroundColor: theme.accent, marginRight: 6 },
                        ]}
                        onPress={() => handleValidateCircuitExercise(ex.id, currentSet.id, idx)}
                      >
                        <Check size={16} color="#FFFFFF" />
                        <Text style={styles.circuitDoneBtnText}>Valider</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.circuitPassBtn,
                          { borderColor: theme.border, backgroundColor: theme.cardBg },
                        ]}
                        onPress={() => handlePassCircuitExercise(ex.id, idx)}
                      >
                        <SkipForward size={14} color={theme.textMuted} />
                        <Text style={[styles.circuitPassBtnText, { color: theme.textMuted }]}>Passer</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Carte ré-expansée (isForceExpanded && isResolved) */}
                  {isForceExpanded && isResolved && !isCurrentActive && (
                    <View style={styles.circuitActionsRow}>
                      {status === 'validated' ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[
                            styles.circuitDoneBtn,
                            { flex: 1, backgroundColor: theme.accent },
                          ]}
                          onPress={() => handleUnvalidateCircuitExercise(ex.id, currentSet.id, idx)}
                        >
                          <Check size={16} color="#FFFFFF" />
                          <Text style={styles.circuitDoneBtnText}>Validé</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={[
                            styles.circuitPassBtn,
                            { flex: 1, borderColor: theme.border, backgroundColor: theme.cardBg },
                          ]}
                          onPress={() => handleUnpassCircuitExercise(ex.id, idx)}
                        >
                          <SkipForward size={14} color={theme.textMuted} />
                          <Text style={[styles.circuitPassBtnText, { color: theme.textMuted }]}>Passé</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* SÉANCE NORMALE OU LIBRE */
          (activeSession.exercises || []).map((ex) => (
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

        {/* Bouton Terminer l'entraînement */}
        <Button
          title="Terminer l'entraînement"
          variant={isAllCompleted ? 'primary' : 'outline'}
          onPress={handleFinish}
          icon={<Check size={18} color={isAllCompleted ? '#FFFFFF' : theme.text} />}
          style={{ marginTop: 10 }}
        />
      </ScrollView>

      {/* Modal Ajout d'Exercice avec Barre de Recherche */}
      <Modal visible={showAddExModal} transparent animationType="slide" onRequestClose={() => setShowAddExModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddExModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sélectionner un exercice</Text>

            {/* Barre de Recherche Clavier */}
            <View style={[styles.searchBarBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Rechercher par nom ou muscle..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredDatabase.length === 0 ? (
                <Text style={[styles.noResultText, { color: theme.textMuted }]}>Aucun exercice trouvé</Text>
              ) : (
                filteredDatabase.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[styles.dbRow, { borderBottomColor: theme.border }]}
                    onPress={() => handleSelectSharedExercise(ex)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dbExName, { color: theme.text }]}>{ex.name}</Text>
                      <Text style={[styles.dbExMuscle, { color: theme.textMuted }]}>
                        {ex.primaryMuscle} • {ex.category}
                      </Text>
                    </View>
                    <Plus size={18} color={theme.accent} />
                  </TouchableOpacity>
                ))
              )}
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
  circuitItemCollapsedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  collapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsedExName: {
    fontSize: 13,
    fontWeight: '800',
  },
  collapsedSub: {
    fontSize: 11,
  },
  collapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 3,
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
    width: 44,
    height: 36,
    paddingVertical: 2,
    marginTop: 2,
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
  circuitActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 6,
  },
  circuitPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  circuitPassBtnText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  noResultText: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
  },
  dbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  dbExName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dbExMuscle: {
    fontSize: 11,
  },
});
