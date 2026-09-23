import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { EXERCISE_DATABASE, SharedExercise } from '../constants/exerciseDatabase';
import {
  FitTrackerData,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutExercise,
  WorkoutSet,
  SetType,
  BodyMeasurement,
  UserProfile,
  WorkoutFolder,
  WorkoutBlock,
  SingleExerciseBlock,
  CircuitBlock,
  CircuitExerciseItem,
  getTemplateBlocks,
  getSessionBlocks,
} from '../types';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';
import { calculateWorkoutTotalVolume } from '../services/analyticsService';
import { normalizeString } from '../utils/stringUtils';

export interface NextSetPreview {
  exerciseName: string;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  isNextExercise: boolean;
  isSuperset?: boolean;
  supersetGroup?: string;
  isTransition?: boolean;
}

export interface WorkoutContextType {
  data: FitTrackerData | null;
  loading: boolean;
  activeSession: WorkoutSession | null;
  startWorkout: (template?: WorkoutTemplate) => void;
  startSessionTimer: () => void;
  togglePauseWorkoutSession: () => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  updateSet: (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  addExerciseToActiveWorkout: (exerciseName: string, primaryMuscle: string, targetMuscles: string[], restSeconds?: number) => void;
  addBatchExercisesToActiveWorkout: (items: Array<{ exerciseName: string; primaryMuscle: string; targetMuscles: string[]; restSeconds?: number }>) => void;
  reorderActiveSessionBlocks: (newBlocks: WorkoutBlock[]) => void;
  addCircuitToActiveWorkout: () => void;
  removeExercise: (exerciseId: string) => void;
  duplicateExercise: (exerciseId: string) => void;
  replaceExerciseInActiveWorkout: (oldExerciseId: string, newExercise: { id: string; name: string; primaryMuscle: string; targetMuscles: string[] }) => void;
  updateExerciseRestTime: (exerciseId: string, newRestSeconds: number) => void;
  setExerciseSupersetGroup: (exerciseId: string, supersetGroup?: string) => void;
  updateSessionNotes: (notes: string) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  updateActiveSessionCircuitStates: (states: Record<string, any>) => void;
  addExerciseToCircuit: (blockId: string, exerciseName: string, primaryMuscle: string, targetMuscles?: string[]) => void;
  addBatchExercisesToCircuit: (blockId: string, items: Array<{ exerciseName: string; primaryMuscle: string; targetMuscles?: string[] }>) => void;
  updateCircuitItemSetType: (blockId: string, exerciseId: string, setType: SetType) => void;
  addMeasurement: (measurement: BodyMeasurement) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  saveTemplate: (template: WorkoutTemplate) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (templateId: string) => Promise<void>;
  renameTemplate: (templateId: string, newTitle: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  toggleFolderCollapse: (folderId: string) => Promise<void>;
  moveTemplateToFolder: (templateId: string, targetFolderId: string | null) => Promise<void>;
  logPastWorkout: (session: WorkoutSession) => Promise<void>;
  updatePastWorkout: (updatedSession: WorkoutSession) => Promise<void>;
  deleteWorkoutSession: (sessionId: string) => Promise<void>;
  deleteExerciseFromSession: (sessionId: string, exerciseId: string) => Promise<void>;
  deleteSetFromSession: (sessionId: string, exerciseId: string, setId: string) => Promise<void>;
  reloadAllData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  importFullData: (newData: FitTrackerData) => Promise<void>;
  completeOnboarding: (profileData?: { name?: string; currentWeightKg?: number }) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  markFirstSessionCreated: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  // Base d'exercices personnalisés
  customExercises: SharedExercise[];
  allExercises: SharedExercise[];
  addCustomExercise: (exerciseData: Omit<SharedExercise, 'id' | 'isCustom'>) => Promise<SharedExercise>;
  updateCustomExercise: (exercise: SharedExercise) => Promise<void>;
  deleteCustomExercise: (exerciseId: string) => Promise<void>;
  // Rest Timer State
  restTimer: {
    active: boolean;
    exerciseName: string;
    nextSetInfo?: NextSetPreview | null;
    targetEndTime: number | null;
    secondsRemaining: number;
    timerType?: 'rest' | 'transition';
  };
  startRestTimer: (
    exerciseName: string,
    seconds: number,
    nextSetInfo?: NextSetPreview | null,
    timerType?: 'rest' | 'transition'
  ) => void;
  dismissRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType>({} as WorkoutContextType);

function formatSetPerf(set: WorkoutSet): string {
  if (set.weightKg !== undefined && set.weightKg > 0 && set.reps !== undefined && set.reps > 0) {
    return `${set.weightKg}kg × ${set.reps}`;
  }
  if (set.weightKg !== undefined && set.weightKg > 0) {
    return `${set.weightKg}kg`;
  }
  if (set.reps !== undefined && set.reps > 0) {
    return `${set.reps} reps`;
  }
  return '-';
}

function getPreviousSetPerformance(
  history: WorkoutSession[],
  exerciseName: string,
  setIndex: number
): string | undefined {
  if (!history || history.length === 0 || !exerciseName) return undefined;

  const targetName = normalizeString(exerciseName);

  for (const session of history) {
    // 1. Blocks (SingleExerciseBlock)
    const blocks = session.blocks || [];
    for (const block of blocks) {
      if (block.type === 'single') {
        const ex = block.exercise;
        if (normalizeString(ex.exerciseName) === targetName) {
          const completedSets = (ex.sets || []).filter(
            (s) => s.completed && (s.weightKg !== undefined || s.reps !== undefined)
          );
          if (completedSets.length === 0) continue;

          const targetSet =
            completedSets.find((s) => s.setNumber === setIndex) ||
            completedSets[setIndex - 1] ||
            completedSets[completedSets.length - 1];

          if (targetSet) {
            return formatSetPerf(targetSet);
          }
        }
      }
    }

    // 2. Legacy exercises list
    const exercises = session.exercises || [];
    for (const ex of exercises) {
      if (normalizeString(ex.exerciseName) === targetName) {
        const completedSets = (ex.sets || []).filter(
          (s) => s.completed && (s.weightKg !== undefined || s.reps !== undefined)
        );
        if (completedSets.length === 0) continue;

        const targetSet =
          completedSets.find((s) => s.setNumber === setIndex) ||
          completedSets[setIndex - 1] ||
          completedSets[completedSets.length - 1];

        if (targetSet) {
          return formatSetPerf(targetSet);
        }
      }
    }
  }

  return undefined;
}

export function enrichSessionWithPreviousPerformances(
  session: WorkoutSession,
  history: WorkoutSession[]
): WorkoutSession {
  if (!session) return session;

  const updatedBlocks = session.blocks
    ? session.blocks.map((block) => {
        if (block.type === 'single') {
          const ex = block.exercise;
          const updatedSets = ex.sets.map((s) => ({
            ...s,
            previous: getPreviousSetPerformance(history, ex.exerciseName, s.setNumber) || s.previous,
          }));
          return { ...block, exercise: { ...ex, sets: updatedSets } };
        }
        return block;
      })
    : undefined;

  const updatedExercises = session.exercises
    ? session.exercises.map((ex) => {
        const updatedSets = ex.sets.map((s) => ({
          ...s,
          previous: getPreviousSetPerformance(history, ex.exerciseName, s.setNumber) || s.previous,
        }));
        return { ...ex, sets: updatedSets };
      })
    : undefined;

  return {
    ...session,
    blocks: updatedBlocks,
    exercises: updatedExercises,
  };
}

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FitTrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    exerciseName: string;
    nextSetInfo?: NextSetPreview | null;
    targetEndTime: number | null;
    secondsRemaining: number;
    timerType?: 'rest' | 'transition';
  }>({
    active: false,
    exerciseName: '',
    nextSetInfo: null,
    targetEndTime: null,
    secondsRemaining: 0,
    timerType: 'rest',
  });

  const hasPlayedEndSoundRef = React.useRef(false);

  const handleTimerExpired = () => {
    if (!hasPlayedEndSoundRef.current) {
      hasPlayedEndSoundRef.current = true;
      NotificationService.playTimerEndSound();
      NotificationService.cancelScheduledNotification();
    }
    setRestTimer({ active: false, exerciseName: '', targetEndTime: null, secondsRemaining: 0, timerType: 'rest' });
  };

  const startRestTimer = (
    exerciseName: string,
    seconds: number,
    nextSetInfo?: NextSetPreview | null,
    timerType: 'rest' | 'transition' = 'rest'
  ) => {
    if (seconds <= 0) return;
    hasPlayedEndSoundRef.current = false;
    const targetEnd = Date.now() + seconds * 1000;
    setRestTimer({
      active: true,
      exerciseName,
      nextSetInfo: nextSetInfo || null,
      targetEndTime: targetEnd,
      secondsRemaining: seconds,
      timerType,
    });
    NotificationService.scheduleTimerExpirationNotification(seconds, exerciseName, nextSetInfo);
  };

  const dismissRestTimer = () => {
    hasPlayedEndSoundRef.current = true;
    NotificationService.cancelScheduledNotification();
    setRestTimer({ active: false, exerciseName: '', targetEndTime: null, secondsRemaining: 0 });
  };

  const adjustRestTimer = (deltaSeconds: number) => {
    if (!restTimer.targetEndTime || !restTimer.active) return;
    const newTarget = restTimer.targetEndTime + deltaSeconds * 1000;
    const newRemaining = Math.max(0, Math.ceil((newTarget - Date.now()) / 1000));
    if (newRemaining <= 0) {
      handleTimerExpired();
    } else {
      hasPlayedEndSoundRef.current = false;
      setRestTimer((prev) => ({
        ...prev,
        targetEndTime: newTarget,
        secondsRemaining: newRemaining,
      }));
      NotificationService.scheduleTimerExpirationNotification(newRemaining, restTimer.exerciseName, restTimer.nextSetInfo);
    }
  };

  const reloadAllData = async () => {
    setLoading(true);
    const loaded = await StorageService.loadData();
    setData(loaded);
    if (loaded.currentWorkout) {
      const enriched = enrichSessionWithPreviousPerformances(loaded.currentWorkout, loaded.history || []);
      setActiveSession(enriched);
    }
    setLoading(false);
  };

  const resetAllData = async () => {
    setLoading(true);
    const reset = await StorageService.resetAllData();
    setData(reset);
    setActiveSession(null);
    setLoading(false);
  };

  const importFullData = async (newData: FitTrackerData) => {
    setLoading(true);
    const imported = await StorageService.importFullData(newData);
    setData(imported);
    setActiveSession(imported.currentWorkout || null);
    setLoading(false);
  };

  const completeOnboarding = async (profileData?: { name?: string; currentWeightKg?: number }) => {
    try {
      const updated = await StorageService.completeOnboarding(profileData);
      setData(updated);
    } catch (e) {
      console.error('Erreur completeOnboarding:', e);
      setData((prev) => (prev ? { ...prev, hasCompletedOnboarding: true } : prev));
    }
  };

  const skipOnboarding = async () => {
    try {
      const updated = await StorageService.skipOnboarding();
      setData(updated);
    } catch (e) {
      console.error('Erreur skipOnboarding:', e);
      setData((prev) => (prev ? { ...prev, hasCompletedOnboarding: true } : prev));
    }
  };

  const markFirstSessionCreated = async () => {
    const updated = await StorageService.markFirstSessionCreated();
    setData(updated);
  };

  const resetOnboarding = async () => {
    const updated = await StorageService.resetOnboarding();
    setData(updated);
  };

  useEffect(() => {
    reloadAllData();
    NotificationService.init();
  }, []);

  // Fin du Minuteur de Repos (géré par un unique timer de fin sans re-render perpétuel de l'arbre global)
  useEffect(() => {
    if (!restTimer.active || !restTimer.targetEndTime) return;

    const remainingMs = restTimer.targetEndTime - Date.now();
    if (remainingMs <= 0) {
      handleTimerExpired();
      return;
    }

    const timer = setTimeout(() => {
      handleTimerExpired();
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [restTimer.active, restTimer.targetEndTime]);

  // Gestion du Cycle de Vie AppState (Arrière-plan -> Premier plan)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        StorageService.flushCurrentWorkout();
      }

      if (!restTimer.active || !restTimer.targetEndTime) return;

      const remainingMs = restTimer.targetEndTime - Date.now();
      if (remainingMs <= 0) {
        handleTimerExpired();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [restTimer.active, restTimer.targetEndTime]);

  const startSessionTimer = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const updated: WorkoutSession = {
        ...prev,
        hasStarted: true,
        isPaused: false,
        startTime: new Date().toISOString(),
        durationSeconds: 0,
      };
      StorageService.saveCurrentWorkout(updated);
      return updated;
    });
  };

  const togglePauseWorkoutSession = () => {
    setActiveSession((prev) => {
      if (!prev || !prev.hasStarted || prev.status !== 'in_progress') return prev;
      const nextIsPaused = !prev.isPaused;
      let updated: WorkoutSession;

      if (nextIsPaused) {
        const currentElapsed = prev.startTime
          ? Math.max(0, Math.floor((Date.now() - new Date(prev.startTime).getTime()) / 1000))
          : (prev.durationSeconds || 0);
        updated = {
          ...prev,
          isPaused: true,
          pausedAt: new Date().toISOString(),
          durationSeconds: currentElapsed,
        };
      } else {
        const savedDuration = prev.durationSeconds || 0;
        const newStartTimeMs = Date.now() - savedDuration * 1000;
        updated = {
          ...prev,
          isPaused: false,
          pausedAt: undefined,
          durationSeconds: savedDuration,
          startTime: new Date(newStartTimeMs).toISOString(),
        };
      }
      StorageService.saveCurrentWorkout(updated);
      return updated;
    });
  };

  const startWorkout = (template?: WorkoutTemplate) => {
    const blocks = template ? getTemplateBlocks(template) : [];
    const sessionBlocks: WorkoutBlock[] = JSON.parse(JSON.stringify(blocks)).map((block: WorkoutBlock) => {
      if (block.type === 'single') {
        return {
          ...block,
          exercise: {
            ...block.exercise,
            sets: block.exercise.sets.map((s) => ({
              ...s,
              weightKg: undefined,
              reps: undefined,
              rir: undefined,
              completed: false,
            })),
          },
        };
      }
      return block;
    });

    const singleExercises: WorkoutExercise[] = sessionBlocks
      .filter((b): b is SingleExerciseBlock => b.type === 'single')
      .map((b) => b.exercise);

    const legacyExercises: WorkoutExercise[] = template?.exercises
      ? JSON.parse(JSON.stringify(template.exercises)).map((ex: WorkoutExercise) => ({
          ...ex,
          sets: ex.sets.map((s) => ({
            ...s,
            weightKg: undefined,
            reps: undefined,
            rir: undefined,
            completed: false,
          })),
        }))
      : singleExercises;

    let totalSets = 0;
    sessionBlocks.forEach((b) => {
      if (b.type === 'single') {
        totalSets += b.exercise.sets.length;
      } else if (b.type === 'circuit') {
        totalSets += b.rounds * b.exercises.length;
      }
    });
    if (sessionBlocks.length === 0 && legacyExercises.length > 0) {
      totalSets = legacyExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    }

    const newSession: WorkoutSession = {
      id: `sess_${Date.now()}`,
      title: template ? template.title : 'Entraînement Libre',
      templateId: template?.id,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      completedSetsCount: 0,
      totalSetsCount: totalSets,
      status: 'in_progress',
      hasStarted: template ? true : false,
      isCircuit: template?.isCircuit,
      circuitRounds: template?.circuitRounds || 3,
      currentCircuitRound: 1,
      restBetweenRoundsSeconds: template?.restBetweenRoundsSeconds || 105,
      notes: template?.notes,
      blocks: sessionBlocks,
      exercises: legacyExercises,
    };

    const enrichedSession = enrichSessionWithPreviousPerformances(newSession, data?.history || []);

    setActiveSession(enrichedSession);
    StorageService.saveCurrentWorkout(enrichedSession);
  };

  const calculateVolumeAndCompletedCount = (
    exercises?: WorkoutExercise[],
    blocks?: WorkoutBlock[],
    sessionMeta?: any
  ) => {
    return calculateWorkoutTotalVolume(exercises, blocks, sessionMeta);
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    setActiveSession((prevSession) => {
      if (!prevSession) return prevSession;

      const currentExercises = prevSession.exercises || [];
      const updatedExercises = currentExercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const updatedSets = ex.sets.map((s) => {
          if (s.id !== setId) return s;
          return { ...s, [field]: value };
        });

        return { ...ex, sets: updatedSets };
      });

      const updatedBlocks = prevSession.blocks
        ? prevSession.blocks.map((block) => {
            if (block.type === 'single' && block.exercise.id === exerciseId) {
              const updatedSets = block.exercise.sets.map((s) => {
                if (s.id !== setId) return s;
                return { ...s, [field]: value };
              });
              return { ...block, exercise: { ...block.exercise, sets: updatedSets } };
            }
            return block;
          })
        : undefined;

      const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
        updatedExercises,
        updatedBlocks
      );

      const updatedSession: WorkoutSession = {
        ...prevSession,
        blocks: updatedBlocks,
        exercises: updatedExercises,
        totalVolumeKg: volume,
        completedSetsCount: completedCount,
        totalSetsCount: totalCount,
      };

      StorageService.saveCurrentWorkout(updatedSession);
      return updatedSession;
    });
  };

  const findNextSetPreview = (
    session: WorkoutSession,
    currentExerciseId: string,
    currentSetId: string
  ): NextSetPreview | null => {
    const exercises: WorkoutExercise[] = [];
    if (session.blocks && session.blocks.length > 0) {
      session.blocks.forEach((b) => {
        if (b.type === 'single') exercises.push(b.exercise);
      });
    } else if (session.exercises && session.exercises.length > 0) {
      exercises.push(...session.exercises);
    }

    if (exercises.length === 0) return null;

    const currentEx = exercises.find((e) => e.id === currentExerciseId);
    if (!currentEx) return null;

    const currentSetIndex = currentEx.sets.findIndex((s) => s.id === currentSetId);

    // CAS 1 : Moteur intelligent d'enchaînement de Superset (Exo A1 -> Exo B1 -> Repos Tour -> Exo A2)
    if (currentEx.supersetGroup) {
      const groupExercises = exercises.filter(
        (e) => e.supersetGroup === currentEx.supersetGroup
      );
      const currIndexInGroup = groupExercises.findIndex((e) => e.id === currentExerciseId);

      // Si l'exercice n'est pas le dernier du groupe superset :
      // Transition courte immédiate vers l'exercice suivant du groupe (même tour)
      if (currIndexInGroup >= 0 && currIndexInGroup < groupExercises.length - 1) {
        const nextExInGroup = groupExercises[currIndexInGroup + 1];
        const targetSet =
          nextExInGroup.sets[currentSetIndex] || nextExInGroup.sets.find((s) => !s.completed);
        if (targetSet && !targetSet.completed) {
          return {
            exerciseName: nextExInGroup.exerciseName,
            setNumber: targetSet.setNumber,
            weightKg: targetSet.weightKg,
            reps: targetSet.reps,
            isNextExercise: true,
            isSuperset: true,
            supersetGroup: currentEx.supersetGroup,
            isTransition: true, // Transition courte 10s
          };
        }
      } else if (currIndexInGroup === groupExercises.length - 1) {
        // Dernier exercice du superset complété : Fin de tour !
        // Prochain set = tour suivant du PREMIER exercice du superset
        const firstExInGroup = groupExercises[0];
        const nextRoundSet =
          firstExInGroup.sets[currentSetIndex + 1] || firstExInGroup.sets.find((s) => !s.completed);
        if (nextRoundSet && !nextRoundSet.completed) {
          return {
            exerciseName: firstExInGroup.exerciseName,
            setNumber: nextRoundSet.setNumber,
            weightKg: nextRoundSet.weightKg,
            reps: nextRoundSet.reps,
            isNextExercise: true,
            isSuperset: true,
            supersetGroup: currentEx.supersetGroup,
            isTransition: false, // Vrai temps de repos complet du superset
          };
        }
      }
    }

    // CAS 2 : Exercice standard (ou toutes les séries du superset sont finies)
    // 2.a : Prochaine série non complétée dans le même exercice
    for (let i = currentSetIndex + 1; i < currentEx.sets.length; i++) {
      const s = currentEx.sets[i];
      if (!s.completed) {
        return {
          exerciseName: currentEx.exerciseName,
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          isNextExercise: false,
        };
      }
    }

    // 2.b : Premier exercice suivant avec une série non complétée
    const currGlobalIndex = exercises.findIndex((e) => e.id === currentExerciseId);
    for (let i = currGlobalIndex + 1; i < exercises.length; i++) {
      const nextEx = exercises[i];
      for (const s of nextEx.sets) {
        if (!s.completed) {
          return {
            exerciseName: nextEx.exerciseName,
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            isNextExercise: true,
          };
        }
      }
    }

    return null;
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    setActiveSession((prevSession) => {
      if (!prevSession) return prevSession;

      let targetRestSeconds = 75;
      let exerciseName = '';
      let isMarkingCompleted = false;

      const currentExercises = prevSession.exercises || [];
      const updatedExercises = currentExercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        exerciseName = ex.exerciseName;
        targetRestSeconds = ex.restSeconds || 75;

        const updatedSets = ex.sets.map((s) => {
          if (s.id !== setId) return s;
          const newCompleted = !s.completed;
          if (newCompleted) isMarkingCompleted = true;

          return {
            ...s,
            completed: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : undefined,
          };
        });

        return { ...ex, sets: updatedSets };
      });

      const updatedBlocks = prevSession.blocks
        ? prevSession.blocks.map((block) => {
            if (block.type === 'single' && block.exercise.id === exerciseId) {
              exerciseName = block.exercise.exerciseName;
              targetRestSeconds = block.exercise.restSeconds || 75;

              const updatedSets = block.exercise.sets.map((s) => {
                if (s.id !== setId) return s;
                const newCompleted = !s.completed;
                if (newCompleted) isMarkingCompleted = true;

                return {
                  ...s,
                  completed: newCompleted,
                  completedAt: newCompleted ? new Date().toISOString() : undefined,
                };
              });

              return { ...block, exercise: { ...block.exercise, sets: updatedSets } };
            }
            return block;
          })
        : undefined;

      const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
        updatedExercises,
        updatedBlocks
      );

      const autoStartTimer = !prevSession.hasStarted && isMarkingCompleted;
      const shouldResumePause = prevSession.isPaused && isMarkingCompleted;

      let newStartTime = prevSession.startTime;
      if (autoStartTimer) {
        newStartTime = new Date().toISOString();
      } else if (shouldResumePause) {
        newStartTime = new Date(Date.now() - (prevSession.durationSeconds || 0) * 1000).toISOString();
      }

      const updatedSession: WorkoutSession = {
        ...prevSession,
        hasStarted: autoStartTimer ? true : prevSession.hasStarted,
        isPaused: shouldResumePause ? false : prevSession.isPaused,
        startTime: newStartTime,
        durationSeconds: autoStartTimer ? 0 : prevSession.durationSeconds,
        blocks: updatedBlocks,
        exercises: updatedExercises,
        totalVolumeKg: volume,
        completedSetsCount: completedCount,
        totalSetsCount: totalCount,
      };

      StorageService.saveCurrentWorkout(updatedSession);

      if (isMarkingCompleted) {
        const nextSetInfo = findNextSetPreview(updatedSession, exerciseId, setId);
        let restTime = targetRestSeconds;
        let timerKind: 'rest' | 'transition' = 'rest';

        if (nextSetInfo?.isTransition) {
          // Transition courte intra-superset (10s)
          restTime = 10;
          timerKind = 'transition';
        }

        startRestTimer(exerciseName, restTime, nextSetInfo, timerKind);
      }

      return updatedSession;
    });
  };

  const addSet = (exerciseId: string) => {
    if (!activeSession) return;

    const currentExercises = activeSession.exercises || [];
    const updatedExercises = currentExercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const lastSet = ex.sets[ex.sets.length - 1];
      const nextSetNum = ex.sets.length + 1;
      const prevPerf = getPreviousSetPerformance(data?.history || [], ex.exerciseName, nextSetNum);
      const newSet: WorkoutSet = {
        id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        setNumber: nextSetNum,
        type: lastSet ? lastSet.type : 'normal',
        weightKg: undefined,
        reps: undefined,
        rir: undefined,
        completed: false,
        previous: prevPerf || lastSet?.previous || undefined,
      };

      return { ...ex, sets: [...ex.sets, newSet] };
    });

    const updatedBlocks = activeSession.blocks
      ? activeSession.blocks.map((block) => {
          if (block.type === 'single' && block.exercise.id === exerciseId) {
            const lastSet = block.exercise.sets[block.exercise.sets.length - 1];
            const nextSetNum = block.exercise.sets.length + 1;
            const prevPerf = getPreviousSetPerformance(data?.history || [], block.exercise.exerciseName, nextSetNum);
            const newSet: WorkoutSet = {
              id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              setNumber: nextSetNum,
              type: lastSet ? lastSet.type : 'normal',
              weightKg: undefined,
              reps: undefined,
              rir: undefined,
              completed: false,
              previous: prevPerf || lastSet?.previous || undefined,
            };

            return {
              ...block,
              exercise: { ...block.exercise, sets: [...block.exercise.sets, newSet] },
            };
          }
          return block;
        })
      : undefined;

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
      updatedExercises,
      updatedBlocks
    );

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const removeSet = (exerciseId: string, setId: string) => {
    if (!activeSession) return;

    const currentExercises = activeSession.exercises || [];
    const updatedExercises = currentExercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const filteredSets = ex.sets
        .filter((s) => s.id !== setId)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

      return { ...ex, sets: filteredSets };
    });

    const updatedBlocks = activeSession.blocks
      ? activeSession.blocks.map((block) => {
          if (block.type === 'single' && block.exercise.id === exerciseId) {
            const filteredSets = block.exercise.sets
              .filter((s) => s.id !== setId)
              .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

            return {
              ...block,
              exercise: { ...block.exercise, sets: filteredSets },
            };
          }
          return block;
        })
      : undefined;

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
      updatedExercises,
      updatedBlocks
    );

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const addBatchExercisesToActiveWorkout = (
    items: Array<{
      exerciseName: string;
      primaryMuscle: string;
      targetMuscles: string[];
      restSeconds?: number;
    }>
  ) => {
    if (!activeSession || items.length === 0) return;

    const now = Date.now();
    const newExercises: WorkoutExercise[] = [];
    const newSingleBlocks: SingleExerciseBlock[] = [];

    items.forEach((item, index) => {
      const uniqueId = `ex_${now}_${index}_${Math.random().toString(36).substr(2, 4)}`;
      const newEx: WorkoutExercise = {
        id: uniqueId,
        exerciseId: item.exerciseName.toLowerCase().replace(/\s+/g, '_'),
        exerciseName: item.exerciseName,
        primaryMuscle: item.primaryMuscle,
        targetMuscles: item.targetMuscles,
        restSeconds: item.restSeconds || 75,
        sets: [
          {
            id: `s_${now}_${index}_1`,
            setNumber: 1,
            type: 'normal',
            weightKg: undefined,
            reps: undefined,
            rir: undefined,
            completed: false,
            previous: getPreviousSetPerformance(data?.history || [], item.exerciseName, 1),
          },
        ],
      };

      const newBlock: SingleExerciseBlock = {
        id: `blk_single_${newEx.id}`,
        type: 'single',
        exercise: newEx,
      };

      newExercises.push(newEx);
      newSingleBlocks.push(newBlock);
    });

    const updatedExercises = [...(activeSession.exercises || []), ...newExercises];
    const updatedBlocks = activeSession.blocks
      ? [...activeSession.blocks, ...newSingleBlocks]
      : [...newSingleBlocks];

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
      updatedExercises,
      updatedBlocks
    );

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const addExerciseToActiveWorkout = (
    exerciseName: string,
    primaryMuscle: string,
    targetMuscles: string[],
    restSeconds: number = 75
  ) => {
    addBatchExercisesToActiveWorkout([
      { exerciseName, primaryMuscle, targetMuscles, restSeconds },
    ]);
  };

  const reorderActiveSessionBlocks = (newBlocks: WorkoutBlock[]) => {
    if (!activeSession) return;

    let totalSets = 0;
    newBlocks.forEach((b) => {
      if (b.type === 'single') {
        totalSets += b.exercise.sets.length;
      } else if (b.type === 'circuit') {
        totalSets += (b.rounds || 3) * b.exercises.length;
      }
    });

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: newBlocks,
      totalSetsCount: totalSets,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const addCircuitToActiveWorkout = () => {
    if (!activeSession) return;

    const currentBlocks = getSessionBlocks(activeSession);
    const circuitCount = currentBlocks.filter((b) => b.type === 'circuit').length;

    const newCircuitBlock: CircuitBlock = {
      id: `cb_${Date.now()}`,
      type: 'circuit',
      title: `Circuit ${circuitCount + 1}`,
      circuitType: 'rounds',
      rounds: 3,
      amrapDurationMinutes: 12,
      restBetweenRoundsSeconds: 60,
      exercises: [],
    };

    const updatedBlocks = [...currentBlocks, newCircuitBlock];

    let totalSets = 0;
    updatedBlocks.forEach((b) => {
      if (b.type === 'single') {
        totalSets += b.exercise.sets.length;
      } else if (b.type === 'circuit') {
        totalSets += b.rounds * b.exercises.length;
      }
    });

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      totalSetsCount: totalSets,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const removeExercise = (exerciseId: string) => {
    if (!activeSession) return;

    const updatedExercises = (activeSession.exercises || []).filter((ex) => ex.id !== exerciseId);
    const updatedBlocks = activeSession.blocks
      ? activeSession.blocks.filter((block) => {
          if (block.type === 'single') {
            return block.exercise.id !== exerciseId;
          }
          return true;
        })
      : undefined;

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
      updatedExercises,
      updatedBlocks
    );

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const duplicateExercise = (exerciseId: string) => {
    if (!activeSession) return;

    const currentExercises = activeSession.exercises || [];
    const targetEx = currentExercises.find((ex) => ex.id === exerciseId);

    let updatedExercises = [...currentExercises];
    if (targetEx) {
      const duplicated: WorkoutExercise = {
        ...JSON.parse(JSON.stringify(targetEx)),
        id: `ex_${Date.now()}`,
        exerciseName: `${targetEx.exerciseName} (Copie)`,
      };
      updatedExercises.push(duplicated);
    }

    let updatedBlocks = activeSession.blocks ? [...activeSession.blocks] : undefined;
    if (updatedBlocks) {
      const targetBlockIndex = updatedBlocks.findIndex(
        (b) => b.type === 'single' && b.exercise.id === exerciseId
      );
      if (targetBlockIndex >= 0) {
        const targetBlock = updatedBlocks[targetBlockIndex] as SingleExerciseBlock;
        const duplicatedEx: WorkoutExercise = {
          ...JSON.parse(JSON.stringify(targetBlock.exercise)),
          id: `ex_${Date.now()}`,
          exerciseName: `${targetBlock.exercise.exerciseName} (Copie)`,
        };
        const duplicatedBlock: SingleExerciseBlock = {
          id: `blk_single_${duplicatedEx.id}`,
          type: 'single',
          exercise: duplicatedEx,
        };
        updatedBlocks.splice(targetBlockIndex + 1, 0, duplicatedBlock);
      }
    }

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
      updatedExercises,
      updatedBlocks
    );

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const replaceExerciseInActiveWorkout = (
    oldExerciseId: string,
    newExercise: { id: string; name: string; primaryMuscle: string; targetMuscles: string[] }
  ) => {
    if (!activeSession) return;

    const updatedExercises = (activeSession.exercises || []).map((ex) => {
      if (ex.id !== oldExerciseId) return ex;
      return {
        ...ex,
        exerciseId: newExercise.id,
        exerciseName: newExercise.name,
        primaryMuscle: newExercise.primaryMuscle,
        targetMuscles: newExercise.targetMuscles,
      };
    });

    const updatedBlocks = activeSession.blocks
      ? activeSession.blocks.map((block) => {
          if (block.type === 'single' && block.exercise.id === oldExerciseId) {
            return {
              ...block,
              exercise: {
                ...block.exercise,
                exerciseId: newExercise.id,
                exerciseName: newExercise.name,
                primaryMuscle: newExercise.primaryMuscle,
                targetMuscles: newExercise.targetMuscles,
              },
            };
          }
          if (block.type === 'circuit') {
            const hasEx = block.exercises.some((item) => item.id === oldExerciseId);
            if (hasEx) {
              return {
                ...block,
                exercises: block.exercises.map((item) =>
                  item.id === oldExerciseId
                    ? {
                        ...item,
                        exerciseName: newExercise.name,
                        primaryMuscle: newExercise.primaryMuscle,
                        targetMuscles: newExercise.targetMuscles,
                      }
                    : item
                ),
              };
            }
          }
          return block;
        })
      : undefined;

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(
      updatedExercises,
      updatedBlocks
    );

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const updateExerciseRestTime = (exerciseId: string, newRestSeconds: number) => {
    setActiveSession((prevSession) => {
      if (!prevSession) return prevSession;

      const updatedExercises = (prevSession.exercises || []).map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, restSeconds: newRestSeconds };
      });

      const updatedBlocks = prevSession.blocks
        ? prevSession.blocks.map((block) => {
            if (block.type === 'single' && block.exercise.id === exerciseId) {
              return {
                ...block,
                exercise: { ...block.exercise, restSeconds: newRestSeconds },
              };
            }
            return block;
          })
        : undefined;

      const updatedSession: WorkoutSession = {
        ...prevSession,
        blocks: updatedBlocks,
        exercises: updatedExercises,
      };

      StorageService.saveCurrentWorkout(updatedSession);
      return updatedSession;
    });
  };

  const setExerciseSupersetGroup = (exerciseId: string, supersetGroup?: string) => {
    setActiveSession((prevSession) => {
      if (!prevSession) return prevSession;

      const updatedExercises = (prevSession.exercises || []).map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, supersetGroup };
      });

      const updatedBlocks = prevSession.blocks
        ? prevSession.blocks.map((block) => {
            if (block.type === 'single' && block.exercise.id === exerciseId) {
              return {
                ...block,
                exercise: { ...block.exercise, supersetGroup },
              };
            }
            return block;
          })
        : undefined;

      const updatedSession: WorkoutSession = {
        ...prevSession,
        blocks: updatedBlocks,
        exercises: updatedExercises,
      };

      StorageService.saveCurrentWorkout(updatedSession);
      return updatedSession;
    });
  };

  const updateSessionNotes = (notes: string) => {
    const trimmedNotes = notes.trim() || undefined;
    setActiveSession((prevSession) => {
      if (!prevSession) return prevSession;
      const updatedSession: WorkoutSession = {
        ...prevSession,
        notes: trimmedNotes,
      };
      StorageService.saveCurrentWorkout(updatedSession);
      return updatedSession;
    });
  };

  const updateExerciseNotes = (exerciseId: string, notes: string) => {
    const trimmedNotes = notes.trim() || undefined;

    setActiveSession((prevSession) => {
      if (!prevSession) return prevSession;

      // Chercher le nom de l'exercice pour match robuste ID et nom
      let matchedExName: string | undefined;
      const singleBlock = (prevSession.blocks || []).find(
        (b): b is SingleExerciseBlock => b.type === 'single' && b.exercise.id === exerciseId
      );
      if (singleBlock) {
        matchedExName = singleBlock.exercise.exerciseName;
      } else {
        const foundInEx = (prevSession.exercises || []).find((ex) => ex.id === exerciseId);
        if (foundInEx) {
          matchedExName = foundInEx.exerciseName;
        } else {
          // Chercher dans circuit
          (prevSession.blocks || []).forEach((b) => {
            if (b.type === 'circuit') {
              const cEx = b.exercises.find((item) => item.id === exerciseId);
              if (cEx) matchedExName = cEx.exerciseName;
            }
          });
        }
      }

      const updatedExercises = (prevSession.exercises || []).map((ex) => {
        const isMatch =
          ex.id === exerciseId ||
          (matchedExName && ex.exerciseName && ex.exerciseName.trim().toLowerCase() === matchedExName.trim().toLowerCase());
        if (!isMatch) return ex;
        return { ...ex, notes: trimmedNotes };
      });

      const updatedBlocks = prevSession.blocks
        ? prevSession.blocks.map((block) => {
            if (block.type === 'single') {
              const isMatch =
                block.exercise.id === exerciseId ||
                (matchedExName &&
                  block.exercise.exerciseName &&
                  block.exercise.exerciseName.trim().toLowerCase() === matchedExName.trim().toLowerCase());
              if (isMatch) {
                return {
                  ...block,
                  exercise: { ...block.exercise, notes: trimmedNotes },
                };
              }
            }
            if (block.type === 'circuit') {
              const hasEx = block.exercises.some(
                (item) =>
                  item.id === exerciseId ||
                  (matchedExName &&
                    item.exerciseName &&
                    item.exerciseName.trim().toLowerCase() === matchedExName.trim().toLowerCase())
              );
              if (hasEx) {
                return {
                  ...block,
                  exercises: block.exercises.map((item) => {
                    const isMatch =
                      item.id === exerciseId ||
                      (matchedExName &&
                        item.exerciseName &&
                        item.exerciseName.trim().toLowerCase() === matchedExName.trim().toLowerCase());
                    return isMatch ? { ...item, notes: trimmedNotes } : item;
                  }),
                };
              }
            }
            return block;
          })
        : undefined;

      const updatedSession: WorkoutSession = {
        ...prevSession,
        blocks: updatedBlocks,
        exercises: updatedExercises,
      };

      StorageService.saveCurrentWorkout(updatedSession);
      return updatedSession;
    });
  };

  const updateActiveSessionCircuitStates = (states: Record<string, any>) => {
    if (!activeSession) return;
    const updatedSession: WorkoutSession = {
      ...activeSession,
      circuitStates: states,
    };
    setActiveSession(updatedSession);
    if (data) {
      const updatedData: FitTrackerData = {
        ...data,
        currentWorkout: updatedSession,
      };
      setData(updatedData);
      StorageService.saveData(updatedData);
    } else {
      StorageService.saveCurrentWorkout(updatedSession);
    }
  };

  const addBatchExercisesToCircuit = (
    blockId: string,
    items: Array<{
      exerciseName: string;
      primaryMuscle: string;
      targetMuscles?: string[];
    }>
  ) => {
    if (!activeSession || !activeSession.blocks || items.length === 0) return;

    const now = Date.now();
    const newItems: CircuitExerciseItem[] = items.map((item, index) => ({
      id: `circ_ex_${now}_${index}_${Math.random().toString(36).substr(2, 4)}`,
      exerciseName: item.exerciseName,
      primaryMuscle: item.primaryMuscle,
      targetMuscles: item.targetMuscles,
      targetValue: 10,
      targetType: 'reps',
    }));

    const updatedBlocks = activeSession.blocks.map((block) => {
      if (block.id === blockId && block.type === 'circuit') {
        return {
          ...block,
          exercises: [...block.exercises, ...newItems],
        };
      }
      return block;
    });

    let totalSets = 0;
    updatedBlocks.forEach((b) => {
      if (b.type === 'single') {
        totalSets += b.exercise.sets.length;
      } else if (b.type === 'circuit') {
        totalSets += b.rounds * b.exercises.length;
      }
    });

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
      totalSetsCount: totalSets,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const addExerciseToCircuit = (
    blockId: string,
    exerciseName: string,
    primaryMuscle: string,
    targetMuscles?: string[]
  ) => {
    addBatchExercisesToCircuit(blockId, [
      { exerciseName, primaryMuscle, targetMuscles },
    ]);
  };

  const updateCircuitItemSetType = (
    blockId: string,
    exerciseId: string,
    setType: SetType
  ) => {
    if (!activeSession || !activeSession.blocks) return;

    const updatedBlocks = activeSession.blocks.map((block) => {
      if (block.id === blockId && block.type === 'circuit') {
        const updatedExercises = block.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, setType } : ex
        );
        return { ...block, exercises: updatedExercises };
      }
      return block;
    });

    const updatedSession: WorkoutSession = {
      ...activeSession,
      blocks: updatedBlocks,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const finishWorkout = async () => {
    if (!activeSession) return;

    let finalDuration = activeSession.durationSeconds || 0;
    if (activeSession.hasStarted && !activeSession.isPaused && activeSession.startTime) {
      const elapsed = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000);
      finalDuration = Math.max(finalDuration, elapsed);
    }

    const completedSession: WorkoutSession = {
      ...activeSession,
      durationSeconds: finalDuration,
      endTime: new Date().toISOString(),
      status: 'completed',
    };

    let updatedData = await StorageService.saveWorkoutSession(completedSession);

    // Synchronisation des notes de la séance et des exercices vers le template source (s'il existe)
    if (activeSession.templateId && updatedData.templates) {
      const tplIndex = updatedData.templates.findIndex((t) => t.id === activeSession.templateId);
      if (tplIndex >= 0) {
        const targetTemplate = updatedData.templates[tplIndex];

        // Map des notes d'exercices depuis la séance
        const sessionExerciseNotesMap: Record<string, string | undefined> = {};
        (activeSession.exercises || []).forEach((ex) => {
          if (ex.exerciseName) {
            sessionExerciseNotesMap[ex.exerciseName.trim().toLowerCase()] = ex.notes;
          }
        });
        (activeSession.blocks || []).forEach((b) => {
          if (b.type === 'single' && b.exercise.exerciseName) {
            sessionExerciseNotesMap[b.exercise.exerciseName.trim().toLowerCase()] = b.exercise.notes;
          } else if (b.type === 'circuit') {
            b.exercises.forEach((item) => {
              if (item.exerciseName) {
                sessionExerciseNotesMap[item.exerciseName.trim().toLowerCase()] = item.notes;
              }
            });
          }
        });

        // Mise à jour des notes dans le template
        const updatedTemplate: WorkoutTemplate = {
          ...targetTemplate,
          notes: activeSession.notes !== undefined ? activeSession.notes : targetTemplate.notes,
          exercises: targetTemplate.exercises
            ? targetTemplate.exercises.map((ex) => {
                const key = ex.exerciseName.trim().toLowerCase();
                if (key in sessionExerciseNotesMap) {
                  return { ...ex, notes: sessionExerciseNotesMap[key] };
                }
                return ex;
              })
            : targetTemplate.exercises,
          blocks: targetTemplate.blocks
            ? targetTemplate.blocks.map((b) => {
                if (b.type === 'single') {
                  const key = b.exercise.exerciseName.trim().toLowerCase();
                  if (key in sessionExerciseNotesMap) {
                    return {
                      ...b,
                      exercise: { ...b.exercise, notes: sessionExerciseNotesMap[key] },
                    };
                  }
                } else if (b.type === 'circuit') {
                  return {
                    ...b,
                    exercises: b.exercises.map((item) => {
                      const key = item.exerciseName.trim().toLowerCase();
                      if (key in sessionExerciseNotesMap) {
                        return { ...item, notes: sessionExerciseNotesMap[key] };
                      }
                      return item;
                    }),
                  };
                }
                return b;
              })
            : targetTemplate.blocks,
        };

        const updatedTemplates = [...updatedData.templates];
        updatedTemplates[tplIndex] = updatedTemplate;
        updatedData = { ...updatedData, templates: updatedTemplates };
        await StorageService.saveData(updatedData);
      }
    }

    setData(updatedData);
    setActiveSession(null);
    dismissRestTimer();
  };

  const cancelWorkout = () => {
    setActiveSession(null);
    StorageService.saveCurrentWorkout(null);
    dismissRestTimer();
  };

  const addMeasurement = async (measurement: BodyMeasurement) => {
    const updatedData = await StorageService.addMeasurement(measurement);
    setData(updatedData);
  };

  const deleteMeasurement = async (id: string) => {
    if (!data) return;
    const updated = {
      ...data,
      measurements: data.measurements.filter((m) => m.id !== id),
    };
    await StorageService.saveData(updated);
    setData(updated);
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!data) return;
    const updated = {
      ...data,
      profile: {
        ...data.profile,
        ...profileData,
      },
    };
    await StorageService.saveData(updated);
    setData(updated);
  };

  const saveTemplate = async (template: WorkoutTemplate) => {
    if (!data) return;
    const templateToSave = {
      ...template,
      createdAt: template.createdAt || new Date().toISOString(),
    };
    const existingIndex = data.templates.findIndex((t) => t.id === templateToSave.id);
    let updatedTemplates = [...data.templates];
    if (existingIndex >= 0) {
      updatedTemplates[existingIndex] = templateToSave;
    } else {
      updatedTemplates.push(templateToSave);
    }
    const updated = { ...data, templates: updatedTemplates };
    await StorageService.saveData(updated);
    setData(updated);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!data) return;
    const updatedFolders = (data.folders || []).map((f) => ({
      ...f,
      templateIds: f.templateIds.filter((id) => id !== templateId),
    }));
    const updated = {
      ...data,
      templates: data.templates.filter((t) => t.id !== templateId),
      folders: updatedFolders,
    };
    await StorageService.saveData(updated);
    setData(updated);
  };

  const duplicateTemplate = async (templateId: string) => {
    if (!data) return;
    const tpl = data.templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const duplicated: WorkoutTemplate = JSON.parse(JSON.stringify(tpl));
    duplicated.id = `tpl_${Date.now()}`;
    duplicated.title = `${tpl.title} (Copie)`;
    duplicated.createdAt = new Date().toISOString();

    const updatedTemplates = [...data.templates, duplicated];
    // Optionnel : ajouter dans le même dossier si applicable
    const updatedFolders = (data.folders || []).map((f) => {
      if (f.templateIds.includes(templateId)) {
        return { ...f, templateIds: [...f.templateIds, duplicated.id] };
      }
      return f;
    });

    const updated = { ...data, templates: updatedTemplates, folders: updatedFolders };
    await StorageService.saveData(updated);
    setData(updated);
  };

  const renameTemplate = async (templateId: string, newTitle: string) => {
    if (!data || !newTitle.trim()) return;
    const updatedTemplates = data.templates.map((t) => {
      if (t.id === templateId) {
        return { ...t, title: newTitle.trim() };
      }
      return t;
    });
    const updated = { ...data, templates: updatedTemplates };
    await StorageService.saveData(updated);
    setData(updated);
  };

  const createFolder = async (name: string) => {
    if (!data || !name.trim()) return;
    const newFolder: WorkoutFolder = {
      id: `fld_${Date.now()}`,
      name: name.trim(),
      templateIds: [],
      isCollapsed: false,
    };
    const currentFolders = data.folders || [];
    const updated = { ...data, folders: [...currentFolders, newFolder] };
    await StorageService.saveFolders(updated.folders);
    setData(updated);
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!data || !newName.trim()) return;
    const currentFolders = data.folders || [];
    const updatedFolders = currentFolders.map((f) => (f.id === folderId ? { ...f, name: newName.trim() } : f));
    const updated = { ...data, folders: updatedFolders };
    await StorageService.saveFolders(updatedFolders);
    setData(updated);
  };

  const deleteFolder = async (folderId: string) => {
    if (!data) return;
    const currentFolders = data.folders || [];
    const updatedFolders = currentFolders.filter((f) => f.id !== folderId);
    const updated = { ...data, folders: updatedFolders };
    await StorageService.saveFolders(updatedFolders);
    setData(updated);
  };

  const toggleFolderCollapse = async (folderId: string) => {
    if (!data) return;
    const currentFolders = data.folders || [];
    const updatedFolders = currentFolders.map((f) => (f.id === folderId ? { ...f, isCollapsed: !f.isCollapsed } : f));
    const updated = { ...data, folders: updatedFolders };
    await StorageService.saveFolders(updatedFolders);
    setData(updated);
  };

  const moveTemplateToFolder = async (templateId: string, targetFolderId: string | null) => {
    if (!data) return;
    const currentFolders = data.folders || [];
    const updatedFolders = currentFolders.map((f) => {
      const filteredTemplateIds = f.templateIds.filter((id) => id !== templateId);
      if (targetFolderId !== null && f.id === targetFolderId) {
        return { ...f, templateIds: [...filteredTemplateIds, templateId] };
      }
      return { ...f, templateIds: filteredTemplateIds };
    });
    const updated = { ...data, folders: updatedFolders };
    await StorageService.saveFolders(updatedFolders);
    setData(updated);
  };

  const logPastWorkout = async (session: WorkoutSession) => {
    const updated = await StorageService.logPastWorkout(session);
    setData(updated);
  };

  const updatePastWorkout = async (updatedSession: WorkoutSession) => {
    const updated = await StorageService.updateWorkoutSession(updatedSession);
    setData(updated);
  };

  const deleteWorkoutSession = async (sessionId: string) => {
    const updated = await StorageService.deleteWorkoutSession(sessionId);
    setData(updated);
  };

  const deleteExerciseFromSession = async (sessionId: string, exerciseId: string) => {
    const updated = await StorageService.deleteExerciseFromSession(sessionId, exerciseId);
    setData(updated);
  };

  const deleteSetFromSession = async (sessionId: string, exerciseId: string, setId: string) => {
    const updated = await StorageService.deleteSetFromSession(sessionId, exerciseId, setId);
    setData(updated);
  };


  const customExercises = data?.customExercises || [];
  const deletedExerciseIds = useMemo(() => new Set(data?.deletedExerciseIds || []), [data?.deletedExerciseIds]);

  const allExercises = useMemo(() => {
    const customMap = new Map(customExercises.map((ex) => [ex.id, ex]));

    // Exercices système non supprimés (avec remplacement si modifié par l'utilisateur)
    const systemFiltered = EXERCISE_DATABASE
      .filter((ex) => !deletedExerciseIds.has(ex.id))
      .map((ex) => customMap.get(ex.id) || ex);

    // Exercices purement personnalisés (non-système)
    const customOnly = customExercises.filter(
      (ex) => !EXERCISE_DATABASE.some((sys) => sys.id === ex.id)
    );

    return [...customOnly, ...systemFiltered];
  }, [customExercises, deletedExerciseIds]);

  const addCustomExercise = async (exerciseData: Omit<SharedExercise, 'id' | 'isCustom'>): Promise<SharedExercise> => {
    const { updatedData, newExercise } = await StorageService.addCustomExercise(exerciseData);
    setData(updatedData);
    return newExercise;
  };

  const updateCustomExercise = async (exercise: SharedExercise): Promise<void> => {
    const updatedData = await StorageService.updateCustomExercise(exercise);
    setData(updatedData);
  };

  const deleteCustomExercise = async (exerciseId: string): Promise<void> => {
    const updatedData = await StorageService.deleteCustomExercise(exerciseId);
    setData(updatedData);
  };

  const contextValue = useMemo<WorkoutContextType>(
    () => ({
      data,
      loading,
      activeSession,
      startWorkout,
      startSessionTimer,
      togglePauseWorkoutSession,
      finishWorkout,
      cancelWorkout,
      updateSet,
      toggleSetComplete,
      addSet,
      removeSet,
      addExerciseToActiveWorkout,
      addBatchExercisesToActiveWorkout,
      reorderActiveSessionBlocks,
      addCircuitToActiveWorkout,
      removeExercise,
      duplicateExercise,
      replaceExerciseInActiveWorkout,
      updateExerciseRestTime,
      setExerciseSupersetGroup,
      updateSessionNotes,
      updateExerciseNotes,
      updateActiveSessionCircuitStates,
      addExerciseToCircuit,
      addBatchExercisesToCircuit,
      updateCircuitItemSetType,
      addMeasurement,
      deleteMeasurement,
      updateUserProfile,
      saveTemplate,
      deleteTemplate,
      duplicateTemplate,
      renameTemplate,
      createFolder,
      renameFolder,
      deleteFolder,
      toggleFolderCollapse,
      moveTemplateToFolder,
      logPastWorkout,
      updatePastWorkout,
      deleteWorkoutSession,
      deleteExerciseFromSession,
      deleteSetFromSession,
      reloadAllData,
      resetAllData,
      importFullData,
      completeOnboarding,
      skipOnboarding,
      markFirstSessionCreated,
      resetOnboarding,
      customExercises,
      allExercises,
      addCustomExercise,
      updateCustomExercise,
      deleteCustomExercise,
      restTimer,
      startRestTimer,
      dismissRestTimer,
      adjustRestTimer,
    }),
    [
      data,
      loading,
      activeSession,
      customExercises,
      allExercises,
      restTimer,
    ]
  );

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
