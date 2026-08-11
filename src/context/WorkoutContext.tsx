import React, { createContext, useContext, useState, useEffect } from 'react';
import { FitTrackerData, WorkoutSession, WorkoutTemplate, WorkoutExercise, WorkoutSet, SetType, BodyMeasurement } from '../types';
import { StorageService } from '../services/storage';

interface WorkoutContextType {
  data: FitTrackerData | null;
  loading: boolean;
  activeSession: WorkoutSession | null;
  startWorkout: (template?: WorkoutTemplate) => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  updateSet: (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  addExerciseToActiveWorkout: (exerciseName: string, primaryMuscle: string, targetMuscles: string[], restSeconds?: number) => void;
  removeExercise: (exerciseId: string) => void;
  duplicateExercise: (exerciseId: string) => void;
  addMeasurement: (measurement: BodyMeasurement) => Promise<void>;
  reloadAllData: () => Promise<void>;
  // Rest Timer State
  restTimer: {
    active: boolean;
    exerciseName: string;
    targetEndTime: number | null;
    secondsRemaining: number;
  };
  dismissRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType>({} as WorkoutContextType);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FitTrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  // Rest Timer State
  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    exerciseName: string;
    targetEndTime: number | null;
    secondsRemaining: number;
  }>({
    active: false,
    exerciseName: '',
    targetEndTime: null,
    secondsRemaining: 0,
  });

  const reloadAllData = async () => {
    setLoading(true);
    const loaded = await StorageService.loadData();
    setData(loaded);
    if (loaded.currentWorkout) {
      setActiveSession(loaded.currentWorkout);
    }
    setLoading(false);
  };

  useEffect(() => {
    reloadAllData();
  }, []);

  // Décompte du Minuteur de Repos (basé sur horodatage cible pour fiabilité en arrière-plan)
  useEffect(() => {
    if (!restTimer.active || !restTimer.targetEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restTimer.targetEndTime! - Date.now()) / 1000));
      if (remaining <= 0) {
        setRestTimer((prev) => ({ ...prev, active: false, secondsRemaining: 0, targetEndTime: null }));
        clearInterval(interval);
      } else {
        setRestTimer((prev) => ({ ...prev, secondsRemaining: remaining }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.targetEndTime]);

  // Durée de la séance en cours (Chronomètre)
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'in_progress') return;

    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const start = new Date(prev.startTime).getTime();
        const duration = Math.floor((Date.now() - start) / 1000);
        return { ...prev, durationSeconds: duration };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.status, activeSession?.startTime]);

  const startWorkout = (template?: WorkoutTemplate) => {
    const newSession: WorkoutSession = {
      id: `sess_${Date.now()}`,
      title: template ? template.title : 'Entraînement Libre',
      templateId: template?.id,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      completedSetsCount: 0,
      totalSetsCount: template ? template.exercises.reduce((acc, ex) => acc + ex.sets.length, 0) : 0,
      status: 'in_progress',
      isCircuit: template?.isCircuit,
      circuitRounds: template?.circuitRounds,
      restBetweenRoundsSeconds: template?.restBetweenRoundsSeconds,
      exercises: template
        ? JSON.parse(JSON.stringify(template.exercises)) // Deep copy
        : [],
    };

    setActiveSession(newSession);
    StorageService.saveCurrentWorkout(newSession);
  };

  const calculateVolumeAndCompletedCount = (exercises: WorkoutExercise[]) => {
    let volume = 0;
    let completedCount = 0;
    let totalCount = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        totalCount++;
        if (s.completed) {
          completedCount++;
          // Seules les séries non-échauffement sont comptabilisées dans le volume
          if (s.type !== 'warmup') {
            volume += (s.weightKg || 0) * (s.reps || 0);
          }
        }
      });
    });

    return { volume, completedCount, totalCount };
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    if (!activeSession) return;

    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const updatedSets = ex.sets.map((s) => {
        if (s.id !== setId) return s;
        return { ...s, [field]: value };
      });

      return { ...ex, sets: updatedSets };
    });

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(updatedExercises);
    const updatedSession: WorkoutSession = {
      ...activeSession,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    if (!activeSession) return;

    let targetRestSeconds = 60;
    let exerciseName = '';

    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      exerciseName = ex.exerciseName;
      targetRestSeconds = ex.restSeconds || 75;

      const updatedSets = ex.sets.map((s) => {
        if (s.id !== setId) return s;
        const newCompleted = !s.completed;

        // Si la série passe à validée, déclencher le minuteur de repos
        if (newCompleted) {
          const targetEnd = Date.now() + targetRestSeconds * 1000;
          setRestTimer({
            active: true,
            exerciseName: ex.exerciseName,
            targetEndTime: targetEnd,
            secondsRemaining: targetRestSeconds,
          });
        }

        return {
          ...s,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : undefined,
        };
      });

      return { ...ex, sets: updatedSets };
    });

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(updatedExercises);
    const updatedSession: WorkoutSession = {
      ...activeSession,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const addSet = (exerciseId: string) => {
    if (!activeSession) return;

    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: WorkoutSet = {
        id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        setNumber: ex.sets.length + 1,
        type: lastSet ? lastSet.type : 'normal',
        weightKg: lastSet ? lastSet.weightKg : 0,
        reps: lastSet ? lastSet.reps : 10,
        rir: lastSet ? lastSet.rir : 2,
        completed: false,
        previous: lastSet ? `${lastSet.weightKg}kg x ${lastSet.reps}` : undefined,
      };

      return { ...ex, sets: [...ex.sets, newSet] };
    });

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(updatedExercises);
    const updatedSession: WorkoutSession = {
      ...activeSession,
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

    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const filteredSets = ex.sets
        .filter((s) => s.id !== setId)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

      return { ...ex, sets: filteredSets };
    });

    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(updatedExercises);
    const updatedSession: WorkoutSession = {
      ...activeSession,
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
    if (!activeSession) return;

    const newEx: WorkoutExercise = {
      id: `ex_${Date.now()}`,
      exerciseId: exerciseName.toLowerCase().replace(/\s+/g, '_'),
      exerciseName,
      primaryMuscle,
      targetMuscles,
      restSeconds,
      sets: [
        {
          id: `s_${Date.now()}_1`,
          setNumber: 1,
          type: 'normal',
          weightKg: 20,
          reps: 10,
          rir: 2,
          completed: false,
        },
      ],
    };

    const updatedExercises = [...activeSession.exercises, newEx];
    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(updatedExercises);

    const updatedSession: WorkoutSession = {
      ...activeSession,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
    };

    setActiveSession(updatedSession);
    StorageService.saveCurrentWorkout(updatedSession);
  };

  const removeExercise = (exerciseId: string) => {
    if (!activeSession) return;

    const updatedExercises = activeSession.exercises.filter((ex) => ex.id !== exerciseId);
    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(updatedExercises);

    const updatedSession: WorkoutSession = {
      ...activeSession,
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

    const targetEx = activeSession.exercises.find((ex) => ex.id === exerciseId);
    if (!targetEx) return;

    const duplicated: WorkoutExercise = {
      ...JSON.parse(JSON.stringify(targetEx)),
      id: `ex_${Date.now()}`,
      exerciseName: `${targetEx.exerciseName} (Copie)`,
    };

    const updatedExercises = [...activeSession.exercises, duplicated];
    const { volume, completedCount, totalCount } = calculateVolumeAndCompletedCount(updatedExercises);

    const updatedSession: WorkoutSession = {
      ...activeSession,
      exercises: updatedExercises,
      totalVolumeKg: volume,
      completedSetsCount: completedCount,
      totalSetsCount: totalCount,
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
    setRestTimer({ active: false, exerciseName: '', targetEndTime: null, secondsRemaining: 0 });
  };

  const cancelWorkout = () => {
    setActiveSession(null);
    StorageService.saveCurrentWorkout(null);
    setRestTimer({ active: false, exerciseName: '', targetEndTime: null, secondsRemaining: 0 });
  };

  const addMeasurement = async (measurement: BodyMeasurement) => {
    const updatedData = await StorageService.addMeasurement(measurement);
    setData(updatedData);
  };

  const dismissRestTimer = () => {
    setRestTimer({ active: false, exerciseName: '', targetEndTime: null, secondsRemaining: 0 });
  };

  const adjustRestTimer = (deltaSeconds: number) => {
    if (!restTimer.targetEndTime) return;
    const newTarget = restTimer.targetEndTime + deltaSeconds * 1000;
    const newRemaining = Math.max(0, Math.ceil((newTarget - Date.now()) / 1000));
    setRestTimer((prev) => ({
      ...prev,
      targetEndTime: newTarget,
      secondsRemaining: newRemaining,
    }));
  };

  return (
    <WorkoutContext.Provider
      value={{
        data,
        loading,
        activeSession,
        startWorkout,
        finishWorkout,
        cancelWorkout,
        updateSet,
        toggleSetComplete,
        addSet,
        removeSet,
        addExerciseToActiveWorkout,
        removeExercise,
        duplicateExercise,
        addMeasurement,
        reloadAllData,
        restTimer,
        dismissRestTimer,
        adjustRestTimer,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
