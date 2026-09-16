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
import { normalizeString } from '../utils/stringUtils';

export interface NextSetPreview {
  exerciseName: string;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  isNextExercise: boolean;
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
  updateExerciseRestTime: (exerciseId: string, newRestSeconds: number) => void;
  setExerciseSupersetGroup: (exerciseId: string, supersetGroup?: string) => void;
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
  deleteWorkoutSession: (sessionId: string) => Promise<void>;
  deleteExerciseFromSession: (sessionId: string, exerciseId: string) => Promise<void>;
  deleteSetFromSession: (sessionId: string, exerciseId: string, setId: string) => Promise<void>;
  reloadAllData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  importFullData: (newData: FitTrackerData) => Promise<void>;
  completeOnboarding: (profileData?: { name?: string; currentWeightKg?: number }) => Promise<void>;
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
  };
  startRestTimer: (exerciseName: string, seconds: number, nextSetInfo?: NextSetPreview | null) => void;
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
  }>({
    active: false,
    exerciseName: '',
    nextSetInfo: null,
    targetEndTime: null,
    secondsRemaining: 0,
  });

  const hasPlayedEndSoundRef = React.useRef(false);

  const handleTimerExpired = () => {
    if (!hasPlayedEndSoundRef.current) {
      hasPlayedEndSoundRef.current = true;
      NotificationService.playTimerEndSound();
      NotificationService.cancelScheduledNotification();
    }
    setRestTimer({ active: false, exerciseName: '', targetEndTime: null, secondsRemaining: 0 });
  };

  const startRestTimer = (exerciseName: string, seconds: number, nextSetInfo?: NextSetPreview | null) => {
    if (seconds <= 0) return;
    hasPlayedEndSoundRef.current = false;
    const targetEnd = Date.now() + seconds * 1000;
    setRestTimer({
      active: true,
      exerciseName,
      nextSetInfo: nextSetInfo || null,
      targetEndTime: targetEnd,
      secondsRemaining: seconds,
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
    const updated = await StorageService.completeOnboarding(profileData);
    setData(updated);
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

  // Décompte du Minuteur de Repos
  useEffect(() => {
    if (!restTimer.active || !restTimer.targetEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restTimer.targetEndTime! - Date.now()) / 1000));
      if (remaining <= 0) {
        handleTimerExpired();
        clearInterval(interval);
      } else {
        setRestTimer((prev) => ({ ...prev, secondsRemaining: remaining }));
      }
    }, 500);

    return () => clearInterval(interval);
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
      } else {
        const remainingSec = Math.ceil(remainingMs / 1000);
        setRestTimer((prev) => ({ ...prev, secondsRemaining: remainingSec }));
      }
    });

    return () => {
      subscription.remove();
    };
  }, [restTimer.active, restTimer.targetEndTime, restTimer.exerciseName]);

  // Durée de la séance en cours (ne tourne que si la séance est officiellement lancée et non en pause)
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'in_progress' || !activeSession.hasStarted || activeSession.isPaused) return;

    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || !prev.hasStarted || prev.isPaused) return prev;
        const start = new Date(prev.startTime).getTime();
        const duration = Math.floor((Date.now() - start) / 1000);
        return { ...prev, durationSeconds: duration };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.status, activeSession?.startTime, activeSession?.hasStarted, activeSession?.isPaused]);

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
        updated = {
          ...prev,
          isPaused: true,
        };
      } else {
        const newStartTimeMs = Date.now() - (prev.durationSeconds || 0) * 1000;
        updated = {
          ...prev,
          isPaused: false,
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
      blocks: sessionBlocks,
      exercises: legacyExercises,
    };

    const enrichedSession = enrichSessionWithPreviousPerformances(newSession, data?.history || []);

    setActiveSession(enrichedSession);
    StorageService.saveCurrentWorkout(enrichedSession);
  };

  const calculateVolumeAndCompletedCount = (
    exercises?: WorkoutExercise[],
    blocks?: WorkoutBlock[]
  ) => {
    let volume = 0;
    let completedCount = 0;
    let totalCount = 0;

    if (blocks && blocks.length > 0) {
      blocks.forEach((block) => {
        if (block.type === 'single') {
          block.exercise.sets.forEach((s) => {
            totalCount++;
            if (s.completed) {
              completedCount++;
              if (s.type !== 'warmup' && s.weightKg && s.reps) {
                volume += s.weightKg * s.reps;
              }
            }
          });
        }
      });
    } else if (exercises) {
      exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          totalCount++;
          if (s.completed) {
            completedCount++;
            if (s.type !== 'warmup' && s.weightKg && s.reps) {
              volume += s.weightKg * s.reps;
            }
          }
        });
      });
    }

    return { volume, completedCount, totalCount };
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
    if (session.blocks && session.blocks.length > 0) {
      let foundCurrentEx = false;
      for (let i = 0; i < session.blocks.length; i++) {
        const block = session.blocks[i];
        if (block.type === 'single') {
          const ex = block.exercise;
          if (ex.id === currentExerciseId) {
            foundCurrentEx = true;
            let foundCurrentSet = false;
            for (const s of ex.sets) {
              if (s.id === currentSetId) {
                foundCurrentSet = true;
                continue;
              }
              if (foundCurrentSet && !s.completed) {
                return {
                  exerciseName: ex.exerciseName,
                  setNumber: s.setNumber,
                  weightKg: s.weightKg,
                  reps: s.reps,
                  isNextExercise: false,
                };
              }
            }
          } else if (foundCurrentEx) {
            for (const s of ex.sets) {
              if (!s.completed) {
                return {
                  exerciseName: ex.exerciseName,
                  setNumber: s.setNumber,
                  weightKg: s.weightKg,
                  reps: s.reps,
                  isNextExercise: true,
                };
              }
            }
          }
        }
      }
    } else if (session.exercises && session.exercises.length > 0) {
      let foundCurrentEx = false;
      for (let i = 0; i < session.exercises.length; i++) {
        const ex = session.exercises[i];
        if (ex.id === currentExerciseId) {
          foundCurrentEx = true;
          let foundCurrentSet = false;
          for (const s of ex.sets) {
            if (s.id === currentSetId) {
              foundCurrentSet = true;
              continue;
            }
            if (foundCurrentSet && !s.completed) {
              return {
                exerciseName: ex.exerciseName,
                setNumber: s.setNumber,
                weightKg: s.weightKg,
                reps: s.reps,
                isNextExercise: false,
              };
            }
          }
        } else if (foundCurrentEx) {
          for (const s of ex.sets) {
            if (!s.completed) {
              return {
                exerciseName: ex.exerciseName,
                setNumber: s.setNumber,
                weightKg: s.weightKg,
                reps: s.reps,
                isNextExercise: true,
              };
            }
          }
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
        startRestTimer(exerciseName, targetRestSeconds, nextSetInfo);
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

  const updateExerciseRestTime = (exerciseId: string, newRestSeconds: number) => {
    if (!activeSession) return;

    const updatedExercises = (activeSession.exercises || []).map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, restSeconds: newRestSeconds };
    });

    const updatedBlocks = activeSession.blocks
      ? activeSession.blocks.map((block) => {
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
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const setExerciseSupersetGroup = (exerciseId: string, supersetGroup?: string) => {
    if (!activeSession) return;

    const updatedExercises = (activeSession.exercises || []).map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, supersetGroup };
    });

    const updatedBlocks = activeSession.blocks
      ? activeSession.blocks.map((block) => {
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
      ...activeSession,
      blocks: updatedBlocks,
      exercises: updatedExercises,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
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

    const completedSession: WorkoutSession = {
      ...activeSession,
      endTime: new Date().toISOString(),
      status: 'completed',
    };

    const updatedData = await StorageService.saveWorkoutSession(completedSession);
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
      updateExerciseRestTime,
      setExerciseSupersetGroup,
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
      deleteWorkoutSession,
      deleteExerciseFromSession,
      deleteSetFromSession,
      reloadAllData,
      resetAllData,
      importFullData,
      completeOnboarding,
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
