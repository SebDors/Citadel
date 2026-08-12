import React, { useState, useRef, useMemo, useEffect } from 'react';
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
import {
  getSessionBlocks,
  WorkoutBlock,
  CircuitBlock,
  SingleExerciseBlock,
  CircuitExerciseItem,
} from '../src/types';
import {
  Plus,
  ArrowLeft,
  Check,
  Repeat,
  Search,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Play,
  Clock,
} from 'lucide-react-native';

const EPILOG_PURPLE = '#8B5CF6';
const EPILOG_PURPLE_BG = 'rgba(139, 92, 246, 0.12)';
const EPILOG_PURPLE_BORDER = 'rgba(139, 92, 246, 0.4)';

const formatMinutesSeconds = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface CircuitState {
  started: boolean;
  currentRound: number;
  activeExerciseIdx: number;
  roundStatusMap: Record<string, 'pending' | 'validated' | 'skipped'>;
  expandedMap: Record<string, boolean>;
  customValues: Record<string, number>;
  amrapSecondsLeft?: number;
  completedRoundsCount?: number;
}

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
    updateActiveSessionCircuitStates,
  } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Local state per CircuitBlock ID
  const [circuitStates, setCircuitStates] = useState<Record<string, CircuitState>>(
    () => activeSession?.circuitStates || {}
  );

  // Sync circuitStates if activeSession.circuitStates changes externally
  useEffect(() => {
    if (activeSession?.circuitStates && Object.keys(activeSession.circuitStates).length > 0) {
      setCircuitStates(activeSession.circuitStates);
    }
  }, [activeSession?.id]);

  // Extract blocks sequentially (mixed single exercises & circuits)
  const blocks = useMemo(() => {
    if (!activeSession) return [];
    return getSessionBlocks(activeSession);
  }, [activeSession]);

  // Helper to get state of a specific CircuitBlock
  const getCircuitState = (block: CircuitBlock): CircuitState => {
    const existing = circuitStates[block.id];
    if (existing) return existing;

    return {
      started: false,
      currentRound: 0,
      activeExerciseIdx: 0,
      roundStatusMap: {},
      expandedMap: {},
      customValues: {},
      amrapSecondsLeft: (block.amrapDurationMinutes || 12) * 60,
      completedRoundsCount: 0,
    };
  };

  const updateCircuitState = (
    blockId: string,
    updater: (prev: CircuitState) => CircuitState
  ) => {
    setCircuitStates((prev) => {
      const current = prev[blockId] || {
        started: false,
        currentRound: 0,
        activeExerciseIdx: 0,
        roundStatusMap: {},
        expandedMap: {},
        customValues: {},
        completedRoundsCount: 0,
      };
      const nextState = {
        ...prev,
        [blockId]: updater(current),
      };
      updateActiveSessionCircuitStates(nextState);
      return nextState;
    });
  };

  const handleStartCircuit = (block: CircuitBlock) => {
    updateCircuitState(block.id, (prev) => ({
      ...prev,
      started: true,
      currentRound: 1,
      amrapSecondsLeft: (block.amrapDurationMinutes || 12) * 60,
    }));
  };

  // Timer dégressif AMRAP
  useEffect(() => {
    const interval = setInterval(() => {
      setCircuitStates((prevStates) => {
        let hasChanges = false;
        const nextStates = { ...prevStates };

        Object.keys(nextStates).forEach((blockId) => {
          const state = nextStates[blockId];
          const block = blocks.find((b) => b.id === blockId && b.type === 'circuit') as CircuitBlock | undefined;
          if (state && state.started && block && block.circuitType === 'amrap' && (state.amrapSecondsLeft ?? 0) > 0) {
            hasChanges = true;
            nextStates[blockId] = {
              ...state,
              amrapSecondsLeft: Math.max(0, (state.amrapSecondsLeft ?? 0) - 1),
            };
          }
        });

        return hasChanges ? nextStates : prevStates;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [blocks]);

  // Check if all blocks (single exercises and circuits) are completed
  const isAllCompleted = useMemo(() => {
    if (!activeSession || blocks.length === 0) return false;

    return blocks.every((block) => {
      if (block.type === 'single') {
        const sets = block.exercise.sets || [];
        return sets.length > 0 && sets.every((s) => s.completed);
      } else if (block.type === 'circuit') {
        const cState = getCircuitState(block);
        if (!cState.started) return false;
        if (block.circuitType === 'amrap') {
          return (cState.completedRoundsCount || 0) > 0 || (cState.amrapSecondsLeft ?? 0) === 0;
        }
        const totalEx = block.exercises.length;
        const resolvedCount = block.exercises.filter((ex) => {
          const st = cState.roundStatusMap[ex.id];
          return st === 'validated' || st === 'skipped';
        }).length;
        return cState.currentRound >= block.rounds && resolvedCount >= totalEx;
      }
      return false;
    });
  }, [activeSession, blocks, circuitStates]);

  // Filter exercises database for search modal
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

  const circuitInfo = useMemo(() => {
    const circuitBlock = blocks.find((b): b is CircuitBlock => b.type === 'circuit');
    if (!circuitBlock) {
      if (activeSession?.isCircuit) {
        return {
          isCircuit: true,
          isAmrap: false,
          currentRound: activeSession.currentCircuitRound || 1,
          totalRounds: activeSession.circuitRounds || 3,
        };
      }
      return undefined;
    }

    const cState = getCircuitState(circuitBlock);
    const isAmrap = circuitBlock.circuitType === 'amrap';

    return {
      isCircuit: true,
      isAmrap,
      currentRound: cState.currentRound,
      totalRounds: circuitBlock.rounds || 3,
      amrapSecondsLeft: cState.amrapSecondsLeft,
      amrapDurationMinutes: circuitBlock.amrapDurationMinutes || 12,
    };
  }, [blocks, circuitStates, activeSession]);

  if (!activeSession) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0,
          },
        ]}
      >
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

  // Advance logic for CircuitBlock after an exercise action (Validate / Pass)
  const advanceCircuitBlock = (
    block: CircuitBlock,
    nextStatusMap: Record<string, 'pending' | 'validated' | 'skipped'>,
    currentState: CircuitState
  ) => {
    const totalEx = block.exercises.length;
    const resolvedCount = block.exercises.filter((ex) => {
      const st = nextStatusMap[ex.id];
      return st === 'validated' || st === 'skipped';
    }).length;

    if (resolvedCount >= totalEx) {
      // Round completed!
      if (block.circuitType === 'amrap') {
        updateCircuitState(block.id, (prev) => ({
          ...prev,
          currentRound: prev.currentRound + 1,
          completedRoundsCount: (prev.completedRoundsCount || 0) + 1,
          activeExerciseIdx: 0,
          roundStatusMap: {},
          expandedMap: {},
        }));
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        const restTime = block.restBetweenRoundsSeconds || 90;
        startRestTimer(`Tour ${currentState.currentRound} terminé`, restTime);

        if (currentState.currentRound < block.rounds) {
          updateCircuitState(block.id, (prev) => ({
            ...prev,
            currentRound: prev.currentRound + 1,
            completedRoundsCount: (prev.completedRoundsCount || 0) + 1,
            activeExerciseIdx: 0,
            roundStatusMap: {},
            expandedMap: {},
          }));
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          updateCircuitState(block.id, (prev) => ({
            ...prev,
            completedRoundsCount: (prev.completedRoundsCount || 0) + 1,
            roundStatusMap: nextStatusMap,
          }));
        }
      }
    } else {
      let nextIdx = (currentState.activeExerciseIdx + 1) % totalEx;
      let count = 0;
      while (
        (nextStatusMap[block.exercises[nextIdx]?.id] === 'validated' ||
          nextStatusMap[block.exercises[nextIdx]?.id] === 'skipped') &&
        count < totalEx
      ) {
        nextIdx = (nextIdx + 1) % totalEx;
        count++;
      }
      updateCircuitState(block.id, (prev) => ({
        ...prev,
        activeExerciseIdx: nextIdx,
        roundStatusMap: nextStatusMap,
      }));
    }
  };

  const handleValidateCircuitExercise = (block: CircuitBlock, exId: string) => {
    const currentState = getCircuitState(block);
    if (!currentState.started) return;
    const nextStatus = { ...currentState.roundStatusMap, [exId]: 'validated' as const };
    advanceCircuitBlock(block, nextStatus, currentState);
  };

  const handlePassCircuitExercise = (block: CircuitBlock, exId: string) => {
    const currentState = getCircuitState(block);
    if (!currentState.started) return;
    const nextStatus = { ...currentState.roundStatusMap, [exId]: 'skipped' as const };
    advanceCircuitBlock(block, nextStatus, currentState);
  };

  const handleUnvalidateCircuitExercise = (block: CircuitBlock, exId: string, idx: number) => {
    updateCircuitState(block.id, (prev) => ({
      ...prev,
      activeExerciseIdx: idx,
      roundStatusMap: { ...prev.roundStatusMap, [exId]: 'pending' },
      expandedMap: { ...prev.expandedMap, [exId]: false },
    }));
  };

  const handleUnpassCircuitExercise = (block: CircuitBlock, exId: string, idx: number) => {
    updateCircuitState(block.id, (prev) => ({
      ...prev,
      activeExerciseIdx: idx,
      roundStatusMap: { ...prev.roundStatusMap, [exId]: 'pending' },
      expandedMap: { ...prev.expandedMap, [exId]: false },
    }));
  };

  const handleToggleExpandCircuitExercise = (blockId: string, exId: string) => {
    updateCircuitState(blockId, (prev) => ({
      ...prev,
      expandedMap: { ...prev.expandedMap, [exId]: !prev.expandedMap[exId] },
    }));
  };

  const handleUpdateCustomValue = (blockId: string, exId: string, value: number) => {
    updateCircuitState(blockId, (prev) => ({
      ...prev,
      customValues: { ...prev.customValues, [exId]: value },
    }));
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0,
        },
      ]}
    >
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
        <LiveWorkoutHeader
          session={activeSession}
          onFinish={handleFinish}
          onCancel={handleCancel}
          circuitInfo={circuitInfo}
        />

        {/* 2. Rendu séquentiel des Blocs (Exercices Individuels & Circuits) */}
        {blocks.map((block, blockIdx) => {
          if (block.type === 'single') {
            const ex = block.exercise;
            return (
              <ExerciseCard
                key={block.id || `single_${ex.id}_${blockIdx}`}
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
            );
          } else if (block.type === 'circuit') {
            const circuitState = getCircuitState(block);
            const {
              started,
              currentRound,
              activeExerciseIdx,
              roundStatusMap,
              expandedMap,
              customValues,
              amrapSecondsLeft,
              completedRoundsCount,
            } = circuitState;
            const totalRounds = block.rounds || 3;
            const isAmrap = block.circuitType === 'amrap';

            return (
              <View
                key={block.id || `circuit_${blockIdx}`}
                style={[
                  styles.circuitContainer,
                  { backgroundColor: theme.cardBg, borderColor: EPILOG_PURPLE_BORDER },
                ]}
              >
                {/* En-tête Moteur Violet avec Badge C */}
                <View style={styles.epilogHeaderRow}>
                  <View style={styles.epilogBadge}>
                    <Text style={styles.epilogBadgeText}>C</Text>
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.epilogTag, { color: EPILOG_PURPLE }]}>CIRCUIT</Text>
                  </View>
                </View>

                <Text style={[styles.circuitTitle, { color: theme.text }]}>{block.title}</Text>
                <Text style={[styles.circuitSub, { color: theme.textMuted }]}>
                  {block.exercises.length} EXOS · {isAmrap ? `AMRAP ${block.amrapDurationMinutes || 12} MIN` : `${totalRounds} TOURS`}
                </Text>

                {/* Bouton [Commencer le circuit] ou Progression & Chrono AMRAP */}
                {!started ? (
                  <View style={styles.startCircuitContainer}>
                    <View style={[styles.roundProgressBox, { backgroundColor: EPILOG_PURPLE_BG, marginBottom: 10 }]}>
                      <Text style={[styles.roundLabel, { color: EPILOG_PURPLE }]}>
                        TOUR EN COURS : Tour 0 / {isAmrap ? '∞' : totalRounds} (Non démarré)
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.startCircuitBtn, { backgroundColor: EPILOG_PURPLE }]}
                      onPress={() => handleStartCircuit(block)}
                    >
                      <Play size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.startCircuitBtnText}>Commencer le circuit</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.roundProgressBox, { backgroundColor: EPILOG_PURPLE_BG }]}>
                    {isAmrap ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={[styles.roundLabel, { color: EPILOG_PURPLE, marginBottom: 2 }]}>
                            AMRAP · TOUR {currentRound} ({completedRoundsCount || 0} tour(s) complété(s))
                          </Text>
                        </View>
                        <View style={[styles.amrapTimerBadge, { backgroundColor: EPILOG_PURPLE }]}>
                          <Clock size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.amrapTimerText}>{formatMinutesSeconds(amrapSecondsLeft ?? 0)}</Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.roundLabel, { color: EPILOG_PURPLE }]}>
                          TOUR EN COURS : {currentRound} / {totalRounds}
                        </Text>
                        <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                backgroundColor: EPILOG_PURPLE,
                                width: `${(currentRound / totalRounds) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                      </>
                    )}
                  </View>
                )}

                {/* Liste des exercices du circuit */}
                {block.exercises.map((ex: CircuitExerciseItem, idx: number) => {
                  const status = roundStatusMap[ex.id] || 'pending';
                  const isCurrentActive = started && idx === activeExerciseIdx && status === 'pending';
                  const isResolved = status === 'validated' || status === 'skipped';
                  const isForceExpanded = !!expandedMap[ex.id];

                  const targetVal = customValues[ex.id] ?? ex.targetValue ?? 10;
                  const valLabel = ex.targetType === 'time' ? `${targetVal}s` : `${targetVal} reps`;

                  if (isResolved && !isForceExpanded) {
                    return (
                      <TouchableOpacity
                        key={ex.id}
                        activeOpacity={0.7}
                        style={[
                          styles.circuitItemCollapsedCard,
                          {
                            backgroundColor: theme.surface,
                            borderColor: status === 'validated' ? EPILOG_PURPLE : theme.border,
                          },
                        ]}
                        onPress={() => handleToggleExpandCircuitExercise(block.id, ex.id)}
                      >
                        <View style={styles.collapsedLeft}>
                          <View
                            style={[
                              styles.numberCircle,
                              { backgroundColor: status === 'validated' ? EPILOG_PURPLE : theme.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.numberText,
                                { color: status === 'validated' ? '#FFFFFF' : theme.text },
                              ]}
                            >
                              {idx + 1}
                            </Text>
                          </View>
                          <View style={{ marginLeft: 10 }}>
                            <Text style={[styles.collapsedExName, { color: theme.text }]} numberOfLines={1}>
                              {ex.exerciseName}
                            </Text>
                            <Text style={[styles.collapsedSub, { color: theme.textMuted }]}>
                              {valLabel} · {ex.primaryMuscle}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.collapsedRight}>
                          {status === 'validated' ? (
                            <View style={[styles.statusBadge, { backgroundColor: EPILOG_PURPLE }]}>
                              <Check size={12} color="#FFFFFF" />
                              <Text style={styles.statusBadgeText}>Validé</Text>
                            </View>
                          ) : (
                            <View style={[styles.statusBadge, { backgroundColor: theme.border }]}>
                              <SkipForward size={12} color={theme.textMuted} />
                              <Text style={[styles.statusBadgeText, { color: theme.textMuted }]}>
                                Passé
                              </Text>
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
                        {
                          backgroundColor: theme.surface,
                          borderColor: isCurrentActive ? EPILOG_PURPLE : theme.border,
                        },
                        isCurrentActive && { borderWidth: 2.5 },
                      ]}
                    >
                      <View style={styles.circuitItemTop}>
                        <View
                          style={[
                            styles.numberCircle,
                            { backgroundColor: isCurrentActive ? EPILOG_PURPLE : theme.cardBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.numberText,
                              { color: isCurrentActive ? '#FFFFFF' : theme.text },
                            ]}
                          >
                            {idx + 1}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.circuitExName, { color: theme.text }]}>
                            {ex.exerciseName}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <TextInput
                              style={[styles.repsInput, { color: theme.text, borderColor: theme.border }]}
                              keyboardType="numeric"
                              value={String(targetVal)}
                              onChangeText={(val) =>
                                handleUpdateCustomValue(block.id, ex.id, parseInt(val, 10) || 0)
                              }
                              placeholder="10"
                              placeholderTextColor={theme.textMuted}
                            />
                            <Text style={[styles.circuitExSub, { color: theme.textMuted, marginLeft: 6 }]}>
                              {ex.targetType === 'time' ? 'sec' : 'reps'} · {ex.primaryMuscle}
                            </Text>
                          </View>
                        </View>

                        {/* Round status dots */}
                        <View style={styles.dotsRow}>
                          {Array.from({ length: isAmrap ? (completedRoundsCount || 1) + 1 : totalRounds }).map((_, rIdx) => (
                            <View
                              key={rIdx}
                              style={[
                                styles.roundDot,
                                {
                                  backgroundColor:
                                    rIdx + 1 < currentRound ||
                                    (rIdx + 1 === currentRound && status === 'validated')
                                      ? EPILOG_PURPLE
                                      : theme.border,
                                },
                              ]}
                            />
                          ))}
                        </View>

                        {isResolved && isForceExpanded && (
                          <TouchableOpacity
                            style={{ padding: 4, marginLeft: 4 }}
                            onPress={() => handleToggleExpandCircuitExercise(block.id, ex.id)}
                          >
                            <ChevronUp size={16} color={theme.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Action Buttons: [Valider] et [Passer] pour l'exercice actif */}
                      {(isCurrentActive || (!started && idx === activeExerciseIdx)) && (
                        <View style={styles.circuitActionsRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={!started}
                            style={[
                              styles.circuitDoneBtn,
                              {
                                flex: 1,
                                backgroundColor: started ? EPILOG_PURPLE : theme.border,
                                marginRight: 6,
                                opacity: started ? 1 : 0.6,
                              },
                            ]}
                            onPress={() => handleValidateCircuitExercise(block, ex.id)}
                          >
                            <Check size={16} color="#FFFFFF" />
                            <Text style={styles.circuitDoneBtnText}>Valider</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            disabled={!started}
                            style={[
                              styles.circuitPassBtn,
                              { borderColor: theme.border, backgroundColor: theme.cardBg, opacity: started ? 1 : 0.6 },
                            ]}
                            onPress={() => handlePassCircuitExercise(block, ex.id)}
                          >
                            <SkipForward size={14} color={theme.textMuted} />
                            <Text style={[styles.circuitPassBtnText, { color: theme.textMuted }]}>
                              Passer
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Carte ré-expansée pour corriger / décocher une erreur */}
                      {isForceExpanded && isResolved && !isCurrentActive && (
                        <View style={styles.circuitActionsRow}>
                          {status === 'validated' ? (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              style={[
                                styles.circuitDoneBtn,
                                { flex: 1, backgroundColor: EPILOG_PURPLE },
                              ]}
                              onPress={() => handleUnvalidateCircuitExercise(block, ex.id, idx)}
                            >
                              <Check size={16} color="#FFFFFF" />
                              <Text style={styles.circuitDoneBtnText}>Validé (Cliquer pour annuler)</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.circuitPassBtn,
                                { flex: 1, borderColor: theme.border, backgroundColor: theme.cardBg },
                              ]}
                              onPress={() => handleUnpassCircuitExercise(block, ex.id, idx)}
                            >
                              <SkipForward size={14} color={theme.textMuted} />
                              <Text style={[styles.circuitPassBtnText, { color: theme.textMuted }]}>
                                Passé (Cliquer pour reprendre)
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          }
          return null;
        })}

        {/* Bouton Ajouter un exercice à la séance */}
        <Button
          title="Ajouter un exercice à la séance"
          variant="outline"
          onPress={() => setShowAddExModal(true)}
          icon={<Plus size={18} color={theme.accent} />}
          style={{ marginTop: 14 }}
        />

        {/* Bouton Terminer l'entraînement (Cliquable à tout moment, vert/accent si tous les blocs sont complétés) */}
        <Button
          title="Terminer l'entraînement"
          variant={isAllCompleted ? 'primary' : 'outline'}
          onPress={handleFinish}
          icon={<Check size={18} color={isAllCompleted ? '#FFFFFF' : theme.text} />}
          style={{ marginTop: 10 }}
        />
      </ScrollView>

      {/* Modal Ajout d'Exercice avec Barre de Recherche */}
      <Modal
        visible={showAddExModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddExModal(false)}
      >
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
    borderWidth: 1.5,
    marginBottom: 16,
  },
  epilogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  epilogBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: EPILOG_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epilogBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  epilogTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  startCircuitContainer: {
    marginBottom: 12,
  },
  startCircuitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  startCircuitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
  amrapTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amrapTimerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  circuitItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
  },
  circuitExName: {
    fontSize: 15,
    fontWeight: '800',
  },
  circuitExSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  repsInput: {
    height: 30,
    width: 48,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 10,
  },
  circuitDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  circuitDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  circuitPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  circuitPassBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  noResultText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  dbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dbExName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dbExMuscle: {
    fontSize: 12,
    marginTop: 2,
  },
});
