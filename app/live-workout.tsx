import React, { useState, useRef, useMemo, useEffect } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../src/context/WorkoutContext";
import { useTheme } from "../src/context/ThemeContext";
import { LiveWorkoutHeader } from "../src/components/Workout/LiveWorkoutHeader";
import { ExerciseCard } from "../src/components/Workout/ExerciseCard";
import { RestTimerBar } from "../src/components/Workout/RestTimerBar";
import { Button } from "../src/components/UI/Button";
import { useRouter } from "expo-router";
import {
  EXERCISE_DATABASE,
  SharedExercise,
} from "../src/constants/exerciseDatabase";
import { normalizeString } from "../src/utils/stringUtils";
import { CreateExerciseModal } from "../src/components/Workout/CreateExerciseModal";
import { ConfettiEffect } from "../src/components/UI/ConfettiEffect";
import {
  getSessionBlocks,
  WorkoutBlock,
  CircuitBlock,
  SingleExerciseBlock,
  CircuitExerciseItem,
  SET_TYPES_CONFIG,
  SetType,
} from "../src/types";
import {
  Plus,
  ArrowLeft,
  Check,
  Repeat,
  Search,
  SkipForward,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Play,
  Pause,
  Clock,
  X,
  Zap,
  Sparkles,
  Trophy,
  ArrowUpDown,
} from "lucide-react-native";
import { ReorderBlocksModal } from "../src/components/Workout/ReorderBlocksModal";

const formatMinutesSeconds = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatDuration = (seconds: number = 0): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

interface WorkoutDurationWidgetProps {
  startTime?: string;
  hasStarted?: boolean;
  isPaused?: boolean;
  durationSeconds?: number;
  onPress: () => void;
  theme: any;
}

const WorkoutDurationWidget: React.FC<WorkoutDurationWidgetProps> = React.memo(({
  startTime,
  hasStarted,
  isPaused,
  durationSeconds,
  onPress,
  theme,
}) => {
  const [elapsed, setElapsed] = useState<number>(() => {
    if (!hasStarted || !startTime) return 0;
    if (isPaused) return durationSeconds || 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  });

  useEffect(() => {
    if (!hasStarted || isPaused || !startTime) {
      if (isPaused) setElapsed(durationSeconds || 0);
      return;
    }

    const tick = () => {
      const start = new Date(startTime).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, hasStarted, isPaused, durationSeconds]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.bottomTimerLeftRow}
    >
      <Clock
        size={18}
        color={
          hasStarted === false
            ? theme.textMuted
            : isPaused
              ? theme.danger
              : theme.accent
        }
      />
      <View style={{ marginLeft: 9 }}>
        <Text
          style={[
            styles.bottomTimerValueText,
            {
              color:
                hasStarted === false
                  ? theme.textMuted
                  : isPaused
                    ? theme.danger
                    : theme.text,
            },
          ]}
        >
          {formatDuration(elapsed)}
        </Text>
        <Text
          style={[
            styles.bottomTimerLabelText,
            {
              color:
                hasStarted === false
                  ? theme.textMuted
                  : isPaused
                    ? theme.danger
                    : theme.textMuted,
              fontWeight: isPaused ? "800" : "600",
            },
          ]}
        >
          {hasStarted === false
            ? "Séance non démarrée"
            : isPaused
              ? "EN PAUSE"
              : "Temps écoulé"}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

interface CircuitState {
  started: boolean;
  currentRound: number;
  activeExerciseIdx: number;
  roundStatusMap: Record<string, "pending" | "validated" | "skipped">;
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
    addBatchExercisesToActiveWorkout,
    addCircuitToActiveWorkout,
    addExerciseToCircuit,
    addBatchExercisesToCircuit,
    removeExercise,
    duplicateExercise,
    updateExerciseRestTime,
    setExerciseSupersetGroup,
    startRestTimer,
    restTimer,
    startSessionTimer,
    togglePauseWorkoutSession,
    updateActiveSessionCircuitStates,
    updateCircuitItemSetType,
    allExercises,
    data,
  } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleCycleCircuitSetType = (
    blockId: string,
    exId: string,
    currentSetType?: SetType
  ) => {
    const typesOrder: SetType[] = ["normal", "warmup", "drop", "amrap", "failure"];
    const cur = currentSetType || "normal";
    const nextIdx = (typesOrder.indexOf(cur) + 1) % typesOrder.length;
    updateCircuitItemSetType(blockId, exId, typesOrder[nextIdx]);
  };

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetCircuitBlockId, setTargetCircuitBlockId] = useState<
    string | null
  >(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set(),
  );
  
  const { reorderActiveSessionBlocks } = useWorkout();

  const isInitialMount = useRef(true);

  // Local state per CircuitBlock ID
  const [circuitStates, setCircuitStates] = useState<
    Record<string, CircuitState>
  >(() => activeSession?.circuitStates || {});

  // Sync circuitStates if activeSession.circuitStates changes externally
  useEffect(() => {
    if (
      activeSession?.circuitStates &&
      Object.keys(activeSession.circuitStates).length > 0
    ) {
      setCircuitStates(activeSession.circuitStates);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (circuitStates && Object.keys(circuitStates).length > 0) {
      updateActiveSessionCircuitStates(circuitStates);
    }
  }, [circuitStates]);

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
    updater: (prev: CircuitState) => CircuitState,
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
      return {
        ...prev,
        [blockId]: updater(current),
      };
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
          const block = blocks.find(
            (b) => b.id === blockId && b.type === "circuit",
          ) as CircuitBlock | undefined;
          if (
            state &&
            state.started &&
            block &&
            block.circuitType === "amrap" &&
            (state.amrapSecondsLeft ?? 0) > 0
          ) {
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
      if (block.type === "single") {
        const sets = block.exercise.sets || [];
        return sets.length > 0 && sets.every((s) => s.completed);
      } else if (block.type === "circuit") {
        const cState = getCircuitState(block);
        if (!cState.started) return false;
        if (block.circuitType === "amrap") {
          return (
            (cState.completedRoundsCount || 0) > 0 ||
            (cState.amrapSecondsLeft ?? 0) === 0
          );
        }
        const totalEx = block.exercises.length;
        const resolvedCount = block.exercises.filter((ex) => {
          const st = cState.roundStatusMap[ex.id];
          return st === "validated" || st === "skipped";
        }).length;
        return cState.currentRound >= block.rounds && resolvedCount >= totalEx;
      }
      return false;
    });
  }, [activeSession, blocks, circuitStates]);

  // Filter & sort exercises database for search modal (alphabetical order + top checked items)
  const filteredDatabase = useMemo(() => {
    const q = normalizeString(searchQuery);
    if (!q) {
      const selected = allExercises
        .filter((ex) => selectedExerciseIds.has(ex.id))
        .sort((a, b) =>
          a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
        );
      const unselected = allExercises
        .filter((ex) => !selectedExerciseIds.has(ex.id))
        .sort((a, b) =>
          a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
        );
      return [...selected, ...unselected];
    }
    return allExercises
      .filter(
        (ex) =>
          normalizeString(ex.name).includes(q) ||
          normalizeString(ex.primaryMuscle).includes(q) ||
          normalizeString(ex.category).includes(q) ||
          ex.targetMuscles.some((m) => normalizeString(m).includes(q)),
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
      );
  }, [allExercises, searchQuery, selectedExerciseIds]);

  const circuitInfo = useMemo(() => {
    const circuitBlock = blocks.find(
      (b): b is CircuitBlock => b.type === "circuit",
    );
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
    const isAmrap = circuitBlock.circuitType === "amrap";

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
    if (showCelebrationModal) {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
          <Modal visible transparent animationType="fade">
            <View style={styles.celebrationOverlay}>
              <ConfettiEffect />
              <View style={[styles.celebrationCard, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
                <View style={[styles.celebrationIconCircle, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                  <Trophy size={44} color={theme.accent} />
                </View>

                <Text style={[styles.celebrationBadge, { color: theme.accent, backgroundColor: theme.surface }]}>
                  PREMIÈRE SÉANCE TERMINÉE
                </Text>

                <Text style={[styles.celebrationTitle, { color: theme.text }]}>
                  Bravo {data?.profile?.name || 'Athlète'} !
                </Text>

                <Text style={[styles.celebrationDesc, { color: theme.textMuted }]}>
                  Vous avez franchi le tout premier pas dans Citadel. Vos statistiques, votre volume d'entraînement et vos repères 1RM sont désormais enregistrés.
                </Text>

                <Text style={[styles.celebrationSub, { color: theme.text }]}>
                  Bon courage pour vos futurs entraînements !
                </Text>

                <Button
                  title="Retour à l'accueil"
                  variant="primary"
                  onPress={() => {
                    setShowCelebrationModal(false);
                    router.replace("/(tabs)");
                  }}
                  style={{ marginTop: 18, width: '100%' }}
                />
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
            paddingTop:
              Platform.OS === "android"
                ? Math.min(RNStatusBar.currentHeight || 0, 16)
                : 0,
          },
        ]}
      >
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Aucune séance en cours
          </Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            Démarrez une nouvelle séance depuis l'onglet Entraînement.
          </Text>
          <Button
            title="Retour à l'accueil"
            variant="primary"
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleFinish = async () => {
    const isFirstEverCompletedSession = !data?.hasCompletedFirstWorkout;

    const totalCompletedRounds = Object.values(circuitStates).reduce(
      (sum, state) => sum + (state.completedRoundsCount || 0),
      0,
    );

    if (activeSession) {
      activeSession.completedRoundsCount = totalCompletedRounds;
    }

    await finishWorkout();

    if (isFirstEverCompletedSession) {
      setShowCelebrationModal(true);
    } else {
      router.replace("/(tabs)/history");
    }
  };

  const handleCancel = () => {
    cancelWorkout();
    router.replace("/(tabs)");
  };

  const toggleSelectExercise = (exId: string) => {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) {
        next.delete(exId);
      } else {
        next.add(exId);
      }
      return next;
    });
  };

  const handleCloseModal = () => {
    setShowAddExModal(false);
    setSearchQuery("");
    setTargetCircuitBlockId(null);
    setSelectedExerciseIds(new Set());
  };

  const handleBatchAddSharedExercises = () => {
    if (selectedExerciseIds.size === 0) return;

    const selectedExercises = allExercises.filter((ex) =>
      selectedExerciseIds.has(ex.id),
    );

    if (targetCircuitBlockId) {
      addBatchExercisesToCircuit(
        targetCircuitBlockId,
        selectedExercises.map((ex) => ({
          exerciseName: ex.name,
          primaryMuscle: ex.primaryMuscle,
          targetMuscles: ex.targetMuscles,
        })),
      );
    } else {
      addBatchExercisesToActiveWorkout(
        selectedExercises.map((ex) => ({
          exerciseName: ex.name,
          primaryMuscle: ex.primaryMuscle,
          targetMuscles: ex.targetMuscles,
          restSeconds: ex.defaultRestSeconds,
        })),
      );
    }

    handleCloseModal();
  };

  // Advance logic for CircuitBlock after an exercise action (Validate / Pass)
  const advanceCircuitBlock = (
    block: CircuitBlock,
    nextStatusMap: Record<string, "pending" | "validated" | "skipped">,
    currentState: CircuitState,
  ) => {
    const totalEx = block.exercises.length;
    const resolvedCount = block.exercises.filter((ex) => {
      const st = nextStatusMap[ex.id];
      return st === "validated" || st === "skipped";
    }).length;

    if (resolvedCount >= totalEx) {
      // Round completed!
      if (block.circuitType === "amrap") {
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
        (nextStatusMap[block.exercises[nextIdx]?.id] === "validated" ||
          nextStatusMap[block.exercises[nextIdx]?.id] === "skipped") &&
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
    const nextStatus = {
      ...currentState.roundStatusMap,
      [exId]: "validated" as const,
    };
    advanceCircuitBlock(block, nextStatus, currentState);
  };

  const handlePassCircuitExercise = (block: CircuitBlock, exId: string) => {
    const currentState = getCircuitState(block);
    if (!currentState.started) return;
    const nextStatus = {
      ...currentState.roundStatusMap,
      [exId]: "skipped" as const,
    };
    advanceCircuitBlock(block, nextStatus, currentState);
  };

  const handleUnvalidateCircuitExercise = (
    block: CircuitBlock,
    exId: string,
    idx: number,
  ) => {
    updateCircuitState(block.id, (prev) => ({
      ...prev,
      activeExerciseIdx: idx,
      roundStatusMap: { ...prev.roundStatusMap, [exId]: "pending" },
      expandedMap: { ...prev.expandedMap, [exId]: false },
    }));
  };

  const handleUnpassCircuitExercise = (
    block: CircuitBlock,
    exId: string,
    idx: number,
  ) => {
    updateCircuitState(block.id, (prev) => ({
      ...prev,
      activeExerciseIdx: idx,
      roundStatusMap: { ...prev.roundStatusMap, [exId]: "pending" },
      expandedMap: { ...prev.expandedMap, [exId]: false },
    }));
  };

  const handleToggleExpandCircuitExercise = (blockId: string, exId: string) => {
    updateCircuitState(blockId, (prev) => ({
      ...prev,
      expandedMap: { ...prev.expandedMap, [exId]: !prev.expandedMap[exId] },
    }));
  };

  const handleUpdateCustomValue = (
    blockId: string,
    exId: string,
    value: number,
  ) => {
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
          paddingTop:
            Platform.OS === "android"
              ? Math.min(RNStatusBar.currentHeight || 0, 16)
              : 0,
        },
      ]}
    >
      {/* Top Bar Navigation */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>
          Workout Tracker
        </Text>
        <View style={{ flexDirection: 'row', width: 60, justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={() => setShowReorderModal(true)} style={{ padding: 4 }}>
            <ArrowUpDown size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Carte d'En-tête de Séance Sticky (Collée en haut au défilement) */}
        <View style={[styles.stickyHeaderWrapper]}>
          <LiveWorkoutHeader
            session={activeSession}
            onFinish={handleFinish}
            onCancel={handleCancel}
            onTogglePause={togglePauseWorkoutSession}
            circuitInfo={circuitInfo}
          />

          {/* Card de Guidage Pas-à-Pas pendant la 1ère Séance en Direct */}
          {data?.hasCompletedOnboarding && !data?.hasCompletedFirstWorkout && (
            <View style={[styles.guidedLiveCard, { backgroundColor: theme.cardBg, borderColor: theme.accent, marginTop: 8, marginBottom: 4 }]}>
              <View style={styles.guidedLiveHeader}>
                <Sparkles size={16} color={theme.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.guidedLiveTitle, { color: theme.accent }]}>
                  Guide 1er Entraînement (Étape 2/2)
                </Text>
              </View>
              <Text style={[styles.guidedLiveText, { color: theme.text }]}>
                1. Renseignez vos poids (kg) et répétitions pour chaque série.{"\n"}
                2. Cochez la case <Text style={{ fontWeight: '800', color: theme.primary }}>✓</Text> à droite pour valider chaque série.{"\n"}
                3. Une fois fini, cliquez sur <Text style={{ fontWeight: '800', color: theme.text }}>"Terminer la séance"</Text> en bas de la page !
              </Text>
            </View>
          )}

          {/* Bannière "Commencer la séance" si la séance est en préparation (hasStarted = false) */}
          {activeSession.hasStarted === false && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.startSessionBanner,
                { backgroundColor: theme.accent },
              ]}
              onPress={startSessionTimer}
            >
              <View style={styles.startSessionIconCircle}>
                <Play size={18} color={theme.accent} fill={theme.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.startSessionBannerTitle}>
                  Commencer la séance
                </Text>
                <Text style={styles.startSessionBannerSub}>
                  Préparez vos exercices puis appuyez pour lancer le chrono
                </Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}


        </View>

        {/* 2. Rendu séquentiel des Blocs (Exercices Individuels & Circuits) */}
        {blocks.map((block, blockIdx) => {
          if (block.type === "single") {
            const ex = block.exercise;
            return (
              <ExerciseCard
                key={block.id || `single_${ex.id}_${blockIdx}`}
                exercise={ex}
                onUpdateSet={(setId, field, val) =>
                  updateSet(ex.id, setId, field, val)
                }
                onToggleSetComplete={(setId) => toggleSetComplete(ex.id, setId)}
                onAddSet={() => addSet(ex.id)}
                onRemoveSet={(setId) => removeSet(ex.id, setId)}
                onDuplicateExercise={() => duplicateExercise(ex.id)}
                onRemoveExercise={() => removeExercise(ex.id)}
                onUpdateRestTime={(newRest) =>
                  updateExerciseRestTime(ex.id, newRest)
                }
                onSetSupersetGroup={(grp) =>
                  setExerciseSupersetGroup(ex.id, grp)
                }
              />
            );
          } else if (block.type === "circuit") {
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
            const isAmrap = block.circuitType === "amrap";
            return (
              <View
                key={block.id || `circuit_${blockIdx}`}
                style={[
                  styles.circuitContainer,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                ]}
              >
                {/* En-tête Circuit avec Badge C */}
                <View style={styles.circuitHeaderRow}>
                  <View
                    style={[
                      styles.circuitBadge,
                      { backgroundColor: theme.accent },
                    ]}
                  >
                    <Text style={styles.circuitBadgeText}>C</Text>
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.circuitTag, { color: theme.accent }]}>
                      CIRCUIT
                    </Text>
                  </View>
                </View>

                <Text style={[styles.circuitTitle, { color: theme.text }]}>
                  {block.title}
                </Text>
                <Text style={[styles.circuitSub, { color: theme.textMuted }]}>
                  {block.exercises.length} EXOS ·{" "}
                  {isAmrap
                    ? `AMRAP ${block.amrapDurationMinutes || 12} MIN`
                    : `${totalRounds} TOURS`}
                </Text>

                {/* Bouton [Commencer le circuit] ou Progression & Chrono AMRAP */}
                {!started ? (
                  <View style={styles.startCircuitContainer}>
                    <View
                      style={[
                        styles.roundProgressBox,
                        { backgroundColor: theme.surface, marginBottom: 10 },
                      ]}
                    >
                      <Text
                        style={[styles.roundLabel, { color: theme.accent }]}
                      >
                        TOUR EN COURS : Tour 0 / {isAmrap ? "∞" : totalRounds}{" "}
                        (Non démarré)
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.startCircuitBtn,
                        { backgroundColor: theme.accent },
                      ]}
                      onPress={() => handleStartCircuit(block)}
                    >
                      <Play
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.startCircuitBtnText}>
                        Commencer le circuit
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.roundProgressBox,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    {isAmrap ? (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View>
                          <Text
                            style={[
                              styles.roundLabel,
                              { color: theme.accent, marginBottom: 2 },
                            ]}
                          >
                            AMRAP · TOUR {currentRound} (
                            {completedRoundsCount || 0} tour(s) complété(s))
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.amrapTimerBadge,
                            { backgroundColor: theme.accent },
                          ]}
                        >
                          <Clock
                            size={12}
                            color="#FFFFFF"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.amrapTimerText}>
                            {formatMinutesSeconds(amrapSecondsLeft ?? 0)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text
                          style={[styles.roundLabel, { color: theme.accent }]}
                        >
                          TOUR EN COURS : {currentRound} / {totalRounds}
                        </Text>
                        <View
                          style={[
                            styles.progressBarTrack,
                            { backgroundColor: theme.border },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                backgroundColor: theme.accent,
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
                  const status = roundStatusMap[ex.id] || "pending";
                  const isCurrentActive =
                    started &&
                    idx === activeExerciseIdx &&
                    status === "pending";
                  const isResolved =
                    status === "validated" || status === "skipped";
                  const isForceExpanded = !!expandedMap[ex.id];

                  const targetVal = customValues[ex.id] ?? ex.targetValue ?? 10;
                  const valLabel =
                    ex.targetType === "time"
                      ? `${targetVal}s`
                      : `${targetVal} reps`;

                  if (isResolved && !isForceExpanded) {
                    return (
                      <TouchableOpacity
                        key={ex.id}
                        activeOpacity={0.7}
                        style={[
                          styles.circuitItemCollapsedCard,
                          {
                            backgroundColor: theme.surface,
                            borderColor:
                              status === "validated"
                                ? theme.accent
                                : theme.border,
                          },
                        ]}
                        onPress={() =>
                          handleToggleExpandCircuitExercise(block.id, ex.id)
                        }
                      >
                        <View style={styles.collapsedLeft}>
                          <View
                            style={[
                              styles.numberCircle,
                              {
                                backgroundColor:
                                  status === "validated"
                                    ? theme.accent
                                    : theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.numberText,
                                {
                                  color:
                                    status === "validated"
                                      ? "#FFFFFF"
                                      : theme.text,
                                },
                              ]}
                            >
                              {idx + 1}
                            </Text>
                          </View>
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text
                                style={[
                                  styles.collapsedExName,
                                  { color: theme.text },
                                ]}
                                numberOfLines={1}
                              >
                                {ex.exerciseName}
                              </Text>
                              {(() => {
                                const currentSetType = ex.setType || 'normal';
                                const cfg = SET_TYPES_CONFIG[currentSetType] || SET_TYPES_CONFIG.normal;
                                return (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      handleCycleCircuitSetType(block.id, ex.id, ex.setType);
                                    }}
                                    style={{
                                      backgroundColor: currentSetType === 'normal' ? `${theme.border}90` : cfg.color,
                                      paddingHorizontal: 6,
                                      paddingVertical: 1,
                                      borderRadius: 4,
                                      marginLeft: 6,
                                    }}
                                  >
                                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{cfg.code} · {cfg.label}</Text>
                                  </TouchableOpacity>
                                );
                              })()}
                            </View>
                            <Text
                              style={[
                                styles.collapsedSub,
                                { color: theme.textMuted },
                              ]}
                            >
                              {valLabel} · {ex.primaryMuscle}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.collapsedRight}>
                          {status === "validated" ? (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: theme.accent },
                              ]}
                            >
                              <Check size={12} color="#FFFFFF" />
                              <Text style={styles.statusBadgeText}>Validé</Text>
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: theme.border },
                              ]}
                            >
                              <SkipForward size={12} color={theme.textMuted} />
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  { color: theme.textMuted },
                                ]}
                              >
                                Passer
                              </Text>
                            </View>
                          )}
                          <ChevronDown
                            size={16}
                            color={theme.textMuted}
                            style={{ marginLeft: 6 }}
                          />
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
                          borderColor: isCurrentActive
                            ? theme.accent
                            : theme.border,
                        },
                        isCurrentActive && { borderWidth: 2.5 },
                      ]}
                    >
                      <View style={styles.circuitItemTop}>
                        <View
                          style={[
                            styles.numberCircle,
                            {
                              backgroundColor: isCurrentActive
                                ? theme.accent
                                : theme.cardBg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.numberText,
                              {
                                color: isCurrentActive ? "#FFFFFF" : theme.text,
                              },
                            ]}
                          >
                            {idx + 1}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text
                              style={[
                                styles.circuitExName,
                                { color: theme.text },
                              ]}
                            >
                              {ex.exerciseName}
                            </Text>
                            {(() => {
                              const currentSetType = ex.setType || 'normal';
                              const cfg = SET_TYPES_CONFIG[currentSetType] || SET_TYPES_CONFIG.normal;
                              return (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => handleCycleCircuitSetType(block.id, ex.id, ex.setType)}
                                  style={{
                                    backgroundColor: currentSetType === 'normal' ? `${theme.border}90` : cfg.color,
                                    paddingHorizontal: 6,
                                    paddingVertical: 1,
                                    borderRadius: 4,
                                    marginLeft: 6,
                                  }}
                                >
                                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{cfg.code} · {cfg.label}</Text>
                                </TouchableOpacity>
                              );
                            })()}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 4,
                            }}
                          >
                            <TextInput
                              style={[
                                styles.repsInput,
                                {
                                  color: theme.text,
                                  borderColor: theme.border,
                                },
                              ]}
                              keyboardType="numeric"
                              value={String(targetVal)}
                              onChangeText={(val) =>
                                handleUpdateCustomValue(
                                  block.id,
                                  ex.id,
                                  parseInt(val, 10) || 0,
                                )
                              }
                              placeholder="10"
                              placeholderTextColor={theme.textMuted}
                            />
                            <Text
                              style={[
                                styles.circuitExSub,
                                { color: theme.textMuted, marginLeft: 6 },
                              ]}
                            >
                              {ex.targetType === "time" ? "sec" : "reps"} ·{" "}
                              {ex.primaryMuscle}
                            </Text>
                          </View>
                        </View>

                        {/* Round status dots */}
                        <View style={styles.dotsRow}>
                          {Array.from({
                            length: isAmrap
                              ? (completedRoundsCount || 1) + 1
                              : totalRounds,
                          }).map((_, rIdx) => (
                            <View
                              key={rIdx}
                              style={[
                                styles.roundDot,
                                {
                                  backgroundColor:
                                    rIdx + 1 < currentRound ||
                                    (rIdx + 1 === currentRound &&
                                      status === "validated")
                                      ? theme.accent
                                      : theme.border,
                                },
                              ]}
                            />
                          ))}
                        </View>

                        {isResolved && isForceExpanded && (
                          <TouchableOpacity
                            style={{ padding: 4, marginLeft: 4 }}
                            onPress={() =>
                              handleToggleExpandCircuitExercise(block.id, ex.id)
                            }
                          >
                            <ChevronUp size={16} color={theme.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Action Buttons: [Valider] et [Passer] pour l'exercice actif */}
                      {(isCurrentActive ||
                        (!started && idx === activeExerciseIdx)) && (
                        <View style={styles.circuitActionsRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={!started}
                            style={[
                              styles.circuitDoneBtn,
                              {
                                flex: 1,
                                backgroundColor: started
                                  ? theme.accent
                                  : theme.border,
                                marginRight: 6,
                                opacity: started ? 1 : 0.6,
                              },
                            ]}
                            onPress={() =>
                              handleValidateCircuitExercise(block, ex.id)
                            }
                          >
                            <Check size={16} color="#FFFFFF" />
                            <Text style={styles.circuitDoneBtnText}>
                              Valider
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            disabled={!started}
                            style={[
                              styles.circuitPassBtn,
                              {
                                borderColor: theme.border,
                                backgroundColor: theme.cardBg,
                                opacity: started ? 1 : 0.6,
                              },
                            ]}
                            onPress={() =>
                              handlePassCircuitExercise(block, ex.id)
                            }
                          >
                            <SkipForward size={14} color={theme.textMuted} />
                            <Text
                              style={[
                                styles.circuitPassBtnText,
                                { color: theme.textMuted },
                              ]}
                            >
                              Passer
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Carte ré-expansée pour corriger / décocher une erreur */}
                      {isForceExpanded && isResolved && !isCurrentActive && (
                        <View style={styles.circuitActionsRow}>
                          {status === "validated" ? (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              style={[
                                styles.circuitDoneBtn,
                                { flex: 1, backgroundColor: theme.accent },
                              ]}
                              onPress={() =>
                                handleUnvalidateCircuitExercise(
                                  block,
                                  ex.id,
                                  idx,
                                )
                              }
                            >
                              <Check size={16} color="#FFFFFF" />
                              <Text style={styles.circuitDoneBtnText}>
                                Validé (Cliquer pour annuler)
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.circuitPassBtn,
                                {
                                  flex: 1,
                                  borderColor: theme.border,
                                  backgroundColor: theme.cardBg,
                                },
                              ]}
                              onPress={() =>
                                handleUnpassCircuitExercise(block, ex.id, idx)
                              }
                            >
                              <SkipForward size={14} color={theme.textMuted} />
                              <Text
                                style={[
                                  styles.circuitPassBtnText,
                                  { color: theme.textMuted },
                                ]}
                              >
                                Passé (Cliquer pour reprendre)
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Bouton [+ Ajouter un exercice au circuit] */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.addCircuitExBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setTargetCircuitBlockId(block.id);
                    setShowAddExModal(true);
                  }}
                >
                  <Plus
                    size={16}
                    color={theme.accent}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.addCircuitExBtnText,
                      { color: theme.accent },
                    ]}
                  >
                    Ajouter un exercice au circuit
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        })}

        {/* BOUTONS JUMEAUX AU BAS DE LA SÉANCE (+ EXERCICE & + CIRCUIT) */}
        <View style={styles.twinButtonsRow}>
          {/* [Exercice] (Contour pointillé accent) */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.twinBtn,
              {
                borderColor: theme.accent,
                backgroundColor: theme.cardBg,
              },
            ]}
            onPress={() => {
              setTargetCircuitBlockId(null);
              setShowAddExModal(true);
            }}
          >
            <Plus size={16} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.twinBtnText, { color: theme.accent }]}>
              Exercice
            </Text>
          </TouchableOpacity>

          {/* [Circuit] (Contour pointillé accent) */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.twinBtn,
              {
                borderColor: theme.accent,
                backgroundColor: theme.surface,
              },
            ]}
            onPress={addCircuitToActiveWorkout}
          >
            <Plus size={16} color={theme.accent} style={{ marginRight: 4 }} />
            <Zap size={16} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.twinBtnText, { color: theme.accent }]}>
              Circuit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton Terminer l'entraînement (Cliquable à tout moment, vert/accent si tous les blocs sont complétés) */}
        <Button
          title="Terminer la séance"
          variant={isAllCompleted ? "primary" : "outline"}
          onPress={handleFinish}
          icon={
            <Check size={18} color={isAllCompleted ? "#FFFFFF" : theme.text} />
          }
          style={{ marginTop: 10 }}
        />

        {/* Bouton Abandonner la séance (Texte rouge centré sans contour) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCancel}
          style={{
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 6,
            marginBottom: 10,
          }}
        >
          <Text
            style={{ color: theme.danger, fontSize: 15, fontWeight: "700" }}
          >
            Abandonner la séance
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Ajout d'Exercice avec Barre de Recherche */}
      <Modal
        visible={showAddExModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.pickerModalContent,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <View style={styles.pickerModalHeaderRow}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text, flex: 1, marginBottom: 0 },
                  ]}
                >
                  {targetCircuitBlockId
                    ? "Ajouter au circuit"
                    : "Sélectionner un exercice"}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={{ padding: 4 }}
                >
                  <X size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Barre de Recherche Clavier */}
              <View
                style={[
                  styles.searchBarBox,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    marginTop: 8,
                  },
                ]}
              >
                <Search
                  size={16}
                  color={theme.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Rechercher par nom ou muscle..."
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              <ScrollView
                style={{ maxHeight: 270 }}
                keyboardShouldPersistTaps="handled"
              >
                {filteredDatabase.length === 0 ? (
                  <Text
                    style={[styles.noResultText, { color: theme.textMuted }]}
                  >
                    Aucun exercice trouvé
                  </Text>
                ) : (
                  filteredDatabase.map((ex) => {
                    const isSelected = selectedExerciseIds.has(ex.id);
                    return (
                      <TouchableOpacity
                        key={ex.id}
                        activeOpacity={0.7}
                        style={[
                          styles.dbRow,
                          { borderBottomColor: theme.border },
                          isSelected && { backgroundColor: theme.surface },
                        ]}
                        onPress={() => toggleSelectExercise(ex.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.dbExName,
                              { color: theme.text },
                              isSelected && {
                                fontWeight: "900",
                                color: theme.accent,
                              },
                            ]}
                          >
                            {ex.name}
                          </Text>
                          <Text
                            style={[
                              styles.dbExMuscle,
                              { color: theme.textMuted },
                            ]}
                          >
                            {ex.primaryMuscle} • {ex.category}
                          </Text>
                        </View>
                        {/* Checkbox Icon */}
                        <View
                          style={[
                            styles.checkboxBox,
                            {
                              borderColor: isSelected
                                ? theme.accent
                                : theme.border,
                              backgroundColor: isSelected
                                ? theme.accent
                                : "transparent",
                            },
                          ]}
                        >
                          {isSelected && (
                            <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Barre d'action fixe en bas avec bouton Ajouter (X) et Créer un exercice */}
              <View style={styles.pickerActionBar}>
                <Button
                  title={
                    selectedExerciseIds.size > 0
                      ? `Ajouter (${selectedExerciseIds.size})`
                      : "Ajouter (0)"
                  }
                  variant="primary"
                  disabled={selectedExerciseIds.size === 0}
                  onPress={handleBatchAddSharedExercises}
                  style={{ width: "100%" }}
                />
                <Button
                  title="+ Créer un exercice"
                  variant="outline"
                  onPress={() => setShowCreateExerciseModal(true)}
                  style={{ width: "100%", marginTop: 8 }}
                />
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Modale de création d'exercice */}
      <CreateExerciseModal
        visible={showCreateExerciseModal}
        onClose={() => setShowCreateExerciseModal(false)}
        onSuccess={(created) => {
          setSelectedExerciseIds((prev) => new Set(prev).add(created.id));
        }}
      />

      {/* 3. Card Sticky Bottom Timer Bar */}
      <View
        style={[
          styles.bottomTimerBar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            bottom: restTimer.active ? 78 : 22,
          },
        ]}
      >
        {/* Gauche : Icône Horloge + Timer (mm:ss ou hh:mm:ss) */}
        <WorkoutDurationWidget
          startTime={activeSession.startTime}
          hasStarted={activeSession.hasStarted}
          isPaused={activeSession.isPaused}
          durationSeconds={activeSession.durationSeconds}
          onPress={() => {
            if (activeSession.hasStarted !== false) {
              togglePauseWorkoutSession();
            }
          }}
          theme={theme}
        />

        {/* Droite : Bouton Logo Pause / Reprendre (Bouton circulaire sans texte) */}
        {activeSession.hasStarted !== false ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.bottomPauseCircleBtn,
              {
                backgroundColor: activeSession.isPaused
                  ? theme.danger
                  : theme.accent,
              },
            ]}
            onPress={togglePauseWorkoutSession}
          >
            {activeSession.isPaused ? (
              <Play size={17} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Pause size={17} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.bottomPauseCircleBtn,
              { backgroundColor: theme.accent },
            ]}
            onPress={startSessionTimer}
          >
            <Play size={17} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Floating Rest Timer Bar */}
      <RestTimerBar />

      {/* ---------------- MODALE FÉLICITATIONS 1ÈRE SÉANCE TERMINÉE ---------------- */}
      <Modal visible={showCelebrationModal} transparent animationType="fade">
        <View style={styles.celebrationOverlay}>
          <ConfettiEffect />
          <View style={[styles.celebrationCard, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
            <View style={[styles.celebrationIconCircle, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
              <Trophy size={44} color={theme.accent} />
            </View>

            <Text style={[styles.celebrationBadge, { color: theme.accent, backgroundColor: theme.surface }]}>
              PREMIÈRE SÉANCE TERMINÉE
            </Text>

            <Text style={[styles.celebrationTitle, { color: theme.text }]}>
              Bravo {data?.profile?.name || 'Athlète'} !
            </Text>

            <Text style={[styles.celebrationDesc, { color: theme.textMuted }]}>
              Vous avez franchi le tout premier pas dans Citadel. Vos statistiques, votre volume d'entraînement et vos repères 1RM sont désormais enregistrés.
            </Text>

            <Text style={[styles.celebrationSub, { color: theme.text }]}>
              Bon courage pour vos futurs entraînements !
            </Text>

            <Button
              title="Retour à l'accueil"
              variant="primary"
              onPress={() => {
                setShowCelebrationModal(false);
                router.replace("/(tabs)");
              }}
              style={{ marginTop: 18, width: '100%' }}
            />
          </View>
        </View>
      </Modal>

      <ReorderBlocksModal
        visible={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        blocks={blocks}
        onReorder={reorderActiveSessionBlocks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 130,
  },
  bottomTimerBar: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 90,
  },
  bottomTimerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bottomTimerValueText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bottomTimerLabelText: {
    fontSize: 9.5,
    fontWeight: "600",
  },
  bottomPauseCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },
  circuitContainer: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  circuitHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  circuitBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  circuitBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  circuitTag: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  circuitTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  circuitSub: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
  startCircuitContainer: {
    marginBottom: 12,
  },
  startCircuitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  startCircuitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  roundProgressBox: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  roundLabel: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },
  amrapTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amrapTimerText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  circuitItemCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  circuitItemCollapsedCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  collapsedLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  collapsedExName: {
    fontSize: 13,
    fontWeight: "800",
  },
  collapsedSub: {
    fontSize: 11,
  },
  collapsedRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 4,
  },
  circuitItemTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 13,
    fontWeight: "800",
  },
  circuitExName: {
    fontSize: 15,
    fontWeight: "800",
  },
  circuitExSub: {
    fontSize: 11,
    fontWeight: "600",
  },
  repsInput: {
    height: 30,
    width: 48,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    paddingVertical: 2,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  circuitActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  circuitDoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  circuitDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 6,
  },
  circuitPassBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  circuitPassBtnText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingHorizontal: 16,
  },
  pickerModalContent: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  pickerModalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  pickerActionBar: {
    marginTop: 10,
    paddingTop: 8,
  },
  modalContent: {
    width: "90%",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  searchBarBox: {
    flexDirection: "row",
    alignItems: "center",
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
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14,
  },
  dbRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dbExName: {
    fontSize: 14,
    fontWeight: "700",
  },
  dbExMuscle: {
    fontSize: 12,
    marginTop: 2,
  },
  addCircuitExBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  stickyHeaderWrapper: {
    paddingTop: 10,
    paddingBottom: 8,
    marginHorizontal: 10,
    zIndex: 10,
    elevation: 4,
  },
  startSessionBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  startSessionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  startSessionBannerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  startSessionBannerSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  addCircuitExBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  twinButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    marginBottom: 6,
  },
  twinBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  twinBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  guidedLiveCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  guidedLiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  guidedLiveTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  guidedLiveText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    width: '90%',
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
  },
  celebrationIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  celebrationBadge: {
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationDesc: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  celebrationSub: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
});
