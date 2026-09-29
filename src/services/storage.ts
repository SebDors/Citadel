import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitTrackerData, WorkoutSession, WorkoutTemplate, BodyMeasurement, WorkoutFolder, CardioSession, getSessionBlocks } from '../types';
import { INITIAL_MOCK_DATA } from './mockData';
import { SharedExercise } from '../constants/exerciseDatabase';
import { normalizeMuscle, MuscleTarget } from '../constants/muscles';

const STORAGE_KEY = '@citadel_app_data_v1';
const LEGACY_STORAGE_KEY = '@warriorfit_app_data_v1';
const COLLAPSED_CARDS_KEY = '@citadel_collapsed_cards_v1';
const LEGACY_COLLAPSED_CARDS_KEY = '@warriorfit_collapsed_cards_v1';
const CURRENT_WORKOUT_KEY = '@citadel_current_workout_v1';

let saveCurrentWorkoutDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPendingSession: WorkoutSession | null | undefined = undefined;

/**
 * Migration transparente d'un exercice individuel :
 * - Sauvegarde l'ancien format sous *_legacy pour rollback/traçabilité
 * - Normalise primaryMuscle et primaryMuscles selon MUSCLE_GROUPS
 * - Normalise targetMuscles selon MUSCLE_GROUPS
 * - Construit la structure normalisée muscleTargets
 */
function migrateExercise(ex: any): boolean {
  if (!ex) return false;
  let changed = false;

  // 1. Sauvegarde legacy si pas encore fait
  if (ex.primaryMuscle && !ex.primaryMuscle_legacy) {
    ex.primaryMuscle_legacy = ex.primaryMuscle;
  }
  if (Array.isArray(ex.targetMuscles) && !ex.targetMuscles_legacy) {
    ex.targetMuscles_legacy = [...ex.targetMuscles];
  }

  // 2. Normalisation du primaryMuscle
  if (ex.primaryMuscle) {
    const norm = normalizeMuscle(ex.primaryMuscle);
    if (ex.primaryMuscle !== norm.muscle) {
      ex.primaryMuscle = norm.muscle;
      changed = true;
    }
  }

  // 3. Normalisation de primaryMuscles
  if (Array.isArray(ex.primaryMuscles) && ex.primaryMuscles.length > 0) {
    const normalizedPrimaries = Array.from(new Set(ex.primaryMuscles.map((m: string) => normalizeMuscle(m).muscle)));
    if (JSON.stringify(normalizedPrimaries) !== JSON.stringify(ex.primaryMuscles)) {
      ex.primaryMuscles = normalizedPrimaries;
      changed = true;
    }
  } else if (ex.primaryMuscle) {
    ex.primaryMuscles = [ex.primaryMuscle];
  }

  // 4. Normalisation de targetMuscles et génération de muscleTargets
  if (Array.isArray(ex.targetMuscles)) {
    const rawTargets = ex.targetMuscles_legacy || ex.targetMuscles;
    const normalizedTargets: string[] = [];
    const muscleTargets: MuscleTarget[] = [];

    // Ajouter le muscle principal dans muscleTargets
    if (ex.primaryMuscle) {
      const primaryNorm = normalizeMuscle(ex.primaryMuscle_legacy || ex.primaryMuscle);
      muscleTargets.push({
        muscle: primaryNorm.muscle,
        subRegion: primaryNorm.subRegion,
        role: 'primary',
        fraction: 1.0,
      });
    }

    rawTargets.forEach((item: any) => {
      if (typeof item === 'string') {
        const norm = normalizeMuscle(item);
        if (!normalizedTargets.includes(norm.muscle)) {
          normalizedTargets.push(norm.muscle);
        }
        if (!muscleTargets.some((t) => t.muscle === norm.muscle)) {
          muscleTargets.push({
            muscle: norm.muscle,
            subRegion: norm.subRegion,
            role: 'secondary',
            fraction: 0.5,
          });
        }
      } else if (item && typeof item === 'object' && item.muscle) {
        const norm = normalizeMuscle(item.muscle);
        if (!normalizedTargets.includes(norm.muscle)) {
          normalizedTargets.push(norm.muscle);
        }
        muscleTargets.push({
          muscle: norm.muscle,
          subRegion: item.subRegion || norm.subRegion,
          role: item.role || 'secondary',
          fraction: item.fraction ?? 0.5,
        });
      }
    });

    if (JSON.stringify(normalizedTargets) !== JSON.stringify(ex.targetMuscles)) {
      ex.targetMuscles = normalizedTargets;
      changed = true;
    }
    if (!ex.muscleTargets || ex.muscleTargets.length === 0) {
      ex.muscleTargets = muscleTargets;
      changed = true;
    }
  }

  return changed;
}

/**
 * Migration transparente d'un item de circuit
 */
function migrateCircuitExercise(item: any): boolean {
  if (!item) return false;
  let changed = false;

  if (item.primaryMuscle && !item.primaryMuscle_legacy) {
    item.primaryMuscle_legacy = item.primaryMuscle;
  }
  if (Array.isArray(item.targetMuscles) && !item.targetMuscles_legacy) {
    item.targetMuscles_legacy = [...item.targetMuscles];
  }

  if (item.primaryMuscle) {
    const norm = normalizeMuscle(item.primaryMuscle);
    if (item.primaryMuscle !== norm.muscle) {
      item.primaryMuscle = norm.muscle;
      changed = true;
    }
  }

  if (Array.isArray(item.primaryMuscles) && item.primaryMuscles.length > 0) {
    const normalizedPrimaries = Array.from(new Set(item.primaryMuscles.map((m: string) => normalizeMuscle(m).muscle)));
    if (JSON.stringify(normalizedPrimaries) !== JSON.stringify(item.primaryMuscles)) {
      item.primaryMuscles = normalizedPrimaries;
      changed = true;
    }
  } else if (item.primaryMuscle) {
    item.primaryMuscles = [item.primaryMuscle];
  }

  if (Array.isArray(item.targetMuscles)) {
    const rawTargets = item.targetMuscles_legacy || item.targetMuscles;
    const normalizedTargets: string[] = [];
    const muscleTargets: MuscleTarget[] = [];

    if (item.primaryMuscle) {
      const primaryNorm = normalizeMuscle(item.primaryMuscle_legacy || item.primaryMuscle);
      muscleTargets.push({
        muscle: primaryNorm.muscle,
        subRegion: primaryNorm.subRegion,
        role: 'primary',
        fraction: 1.0,
      });
    }

    rawTargets.forEach((raw: any) => {
      if (typeof raw === 'string') {
        const norm = normalizeMuscle(raw);
        if (!normalizedTargets.includes(norm.muscle)) {
          normalizedTargets.push(norm.muscle);
        }
        if (!muscleTargets.some((t) => t.muscle === norm.muscle)) {
          muscleTargets.push({
            muscle: norm.muscle,
            subRegion: norm.subRegion,
            role: 'secondary',
            fraction: 0.5,
          });
        }
      } else if (raw && typeof raw === 'object' && raw.muscle) {
        const norm = normalizeMuscle(raw.muscle);
        if (!normalizedTargets.includes(norm.muscle)) {
          normalizedTargets.push(norm.muscle);
        }
        muscleTargets.push({
          muscle: norm.muscle,
          subRegion: raw.subRegion || norm.subRegion,
          role: raw.role || 'secondary',
          fraction: raw.fraction ?? 0.5,
        });
      }
    });

    if (JSON.stringify(normalizedTargets) !== JSON.stringify(item.targetMuscles)) {
      item.targetMuscles = normalizedTargets;
      changed = true;
    }
    if (!item.muscleTargets || item.muscleTargets.length === 0) {
      item.muscleTargets = muscleTargets;
      changed = true;
    }
  }

  return changed;
}

/**
 * Normalise l'intégralité du dataset applicatif (templates, historique, séance en cours, exercices personnalisés)
 */
function migrateData(data: FitTrackerData): boolean {
  if (!data) return false;
  let anyChange = false;

  // 1. Templates
  if (Array.isArray(data.templates)) {
    data.templates.forEach((tmpl) => {
      if (Array.isArray(tmpl.targetMuscles)) {
        const normalized = Array.from(new Set(tmpl.targetMuscles.map((m) => normalizeMuscle(m).muscle)));
        if (JSON.stringify(normalized) !== JSON.stringify(tmpl.targetMuscles)) {
          tmpl.targetMuscles = normalized;
          anyChange = true;
        }
      }
      if (Array.isArray(tmpl.exercises)) {
        tmpl.exercises.forEach((ex) => {
          if (migrateExercise(ex)) anyChange = true;
        });
      }
      if (Array.isArray(tmpl.blocks)) {
        tmpl.blocks.forEach((block) => {
          if (block.type === 'single' && block.exercise) {
            if (migrateExercise(block.exercise)) anyChange = true;
          } else if (block.type === 'circuit' && Array.isArray(block.exercises)) {
            block.exercises.forEach((item) => {
              if (migrateCircuitExercise(item)) anyChange = true;
            });
          }
        });
      }
    });
  }

  // 2. Historique
  if (Array.isArray(data.history)) {
    data.history.forEach((session) => {
      if (Array.isArray(session.exercises)) {
        session.exercises.forEach((ex) => {
          if (migrateExercise(ex)) anyChange = true;
        });
      }
      if (Array.isArray(session.blocks)) {
        session.blocks.forEach((block) => {
          if (block.type === 'single' && block.exercise) {
            if (migrateExercise(block.exercise)) anyChange = true;
          } else if (block.type === 'circuit' && Array.isArray(block.exercises)) {
            block.exercises.forEach((item) => {
              if (migrateCircuitExercise(item)) anyChange = true;
            });
          }
        });
      }
    });
  }

  // 3. Séance active en cours
  if (data.currentWorkout) {
    if (Array.isArray(data.currentWorkout.exercises)) {
      data.currentWorkout.exercises.forEach((ex) => {
        if (migrateExercise(ex)) anyChange = true;
      });
    }
    if (Array.isArray(data.currentWorkout.blocks)) {
      data.currentWorkout.blocks.forEach((block) => {
        if (block.type === 'single' && block.exercise) {
          if (migrateExercise(block.exercise)) anyChange = true;
        } else if (block.type === 'circuit' && Array.isArray(block.exercises)) {
          block.exercises.forEach((item) => {
            if (migrateCircuitExercise(item)) anyChange = true;
          });
        }
      });
    }
  }

  // 4. Exercices personnalisés
  if (Array.isArray(data.customExercises)) {
    data.customExercises.forEach((ex) => {
      if (migrateExercise(ex)) anyChange = true;
    });
  }

  return anyChange;
}

export const StorageService = {
  /**
   * Charge toutes les données de l'application depuis AsyncStorage.
   * Si aucune donnée n'existe, initialise avec les données de démonstration.
   */
  async loadData(): Promise<FitTrackerData> {
    try {
      let jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) {
        // Fallback pour migrer les données préexistantes de l'ancienne clé warriorfit
        jsonValue = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      }

      if (jsonValue !== null) {
        const parsed = JSON.parse(jsonValue) as FitTrackerData;
        if (!parsed.folders) {
          parsed.folders = INITIAL_MOCK_DATA.folders || [];
        }
        if (!parsed.cardioSessions) {
          parsed.cardioSessions = INITIAL_MOCK_DATA.cardioSessions || [];
        }

        // Vérifier si une session active isolée et plus récente existe
        try {
          const activeSessionJson = await AsyncStorage.getItem(CURRENT_WORKOUT_KEY);
          if (activeSessionJson !== null) {
            parsed.currentWorkout = JSON.parse(activeSessionJson) as WorkoutSession;
            lastPendingSession = parsed.currentWorkout;
          } else {
            parsed.currentWorkout = null;
            lastPendingSession = null;
          }
        } catch {
          // Ignorer si échec de lecture de la clé isolée
        }

        // Migration transparente des référentiels musculaires
        const hasChanges = migrateData(parsed);
        if (hasChanges) {
          // Persistance silencieuse en tâche de fond pour pérenniser les modifications
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)).catch((err) => {
            console.error('[StorageService] Erreur lors de la persistance de la migration:', err);
          });
        }

        return parsed;
      }
      // Première utilisation : Sauvegarder les données mock initiales migrées
      migrateData(INITIAL_MOCK_DATA);
      await this.saveData(INITIAL_MOCK_DATA);
      return INITIAL_MOCK_DATA;
    } catch (e) {
      console.error('Erreur lors du chargement des données locales:', e);
      return INITIAL_MOCK_DATA;
    }
  },

  /**
   * Importe et écrase toutes les données avec une nouvelle sauvegarde.
   */
  async importFullData(newData: FitTrackerData): Promise<FitTrackerData> {
    if (saveCurrentWorkoutDebounceTimer) {
      clearTimeout(saveCurrentWorkoutDebounceTimer);
      saveCurrentWorkoutDebounceTimer = null;
    }
    if (newData.currentWorkout) {
      lastPendingSession = newData.currentWorkout;
      try {
        await AsyncStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(newData.currentWorkout));
      } catch (e) {
        console.error('Erreur import CURRENT_WORKOUT_KEY:', e);
      }
    } else {
      lastPendingSession = null;
      try {
        await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
      } catch (e) {
        console.error('Erreur suppression import CURRENT_WORKOUT_KEY:', e);
      }
    }
    migrateData(newData);
    await this.saveData(newData);
    return newData;
  },

  /**
   * Sauvegarde globale de l'état applicatif.
   */
  async saveData(data: FitTrackerData): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des données locales:', e);
    }
  },

  /**
   * Enregistre une séance terminée dans l'historique et met à jour le profil.
   */
  async saveWorkoutSession(session: WorkoutSession): Promise<FitTrackerData> {
    if (saveCurrentWorkoutDebounceTimer) {
      clearTimeout(saveCurrentWorkoutDebounceTimer);
      saveCurrentWorkoutDebounceTimer = null;
    }
    lastPendingSession = null;
    try {
      await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
    } catch (e) {
      console.error('Erreur suppression CURRENT_WORKOUT_KEY:', e);
    }

    const currentData = await this.loadData();
    const updatedHistory = [session, ...currentData.history.filter((s) => s.id !== session.id)];
    const updatedData: FitTrackerData = {
      ...currentData,
      history: updatedHistory,
      currentWorkout: null,
      hasCompletedFirstWorkout: true,
      profile: {
        ...currentData.profile,
        totalWorkouts: currentData.profile.totalWorkouts + 1,
      },
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Enregistre une séance passée rétroactive.
   */
  async logPastWorkout(session: WorkoutSession): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedHistory = [session, ...currentData.history];
    updatedHistory.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const updatedData: FitTrackerData = {
      ...currentData,
      history: updatedHistory,
      profile: {
        ...currentData.profile,
        totalWorkouts: (currentData.profile.totalWorkouts || 0) + 1,
      },
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Enregistre une séance de cardio / boxe hors musculation.
   */
  async logCardioSession(session: CardioSession): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedSessions = [session, ...(currentData.cardioSessions || [])];
    updatedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const updatedData: FitTrackerData = {
      ...currentData,
      cardioSessions: updatedSessions,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Supprime une séance de cardio par son ID.
   */
  async deleteCardioSession(id: string): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedSessions = (currentData.cardioSessions || []).filter((s) => s.id !== id);
    const updatedData: FitTrackerData = {
      ...currentData,
      cardioSessions: updatedSessions,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Sauvegarde non-bloquante et entièrement débouncée de la séance en cours.
   * Enregistre EXCLUSIVEMENT la clé isolée CURRENT_WORKOUT_KEY (~2 Ko) sans jamais
   * charger ni réécrire la base globale complète (évite les 2.1s de blocage du pont Android).
   */
  saveCurrentWorkout(session: WorkoutSession | null): void {
    lastPendingSession = session;

    if (saveCurrentWorkoutDebounceTimer) {
      clearTimeout(saveCurrentWorkoutDebounceTimer);
      saveCurrentWorkoutDebounceTimer = null;
    }

    if (session === null) {
      AsyncStorage.removeItem(CURRENT_WORKOUT_KEY).catch((e) => {
        console.error('Erreur suppression immédiate CURRENT_WORKOUT_KEY:', e);
      });
      return;
    }

    saveCurrentWorkoutDebounceTimer = setTimeout(async () => {
      const targetSession = lastPendingSession;
      try {
        if (targetSession === null) {
          await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
        } else {
          await AsyncStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(targetSession));
        }
      } catch (e) {
        console.error('Erreur debounce saveCurrentWorkout:', e);
      }
    }, 2000);
  },

  /**
   * Abandonne et supprime définitivement la séance en cours :
   * - Annule tout timer de debounce actif
   * - Définit lastPendingSession = null
   * - Supprime immédiatement la clé isolée CURRENT_WORKOUT_KEY
   * - Met à jour currentWorkout: null dans la base globale STORAGE_KEY si nécessaire
   */
  async discardCurrentWorkout(): Promise<void> {
    if (saveCurrentWorkoutDebounceTimer) {
      clearTimeout(saveCurrentWorkoutDebounceTimer);
      saveCurrentWorkoutDebounceTimer = null;
    }
    lastPendingSession = null;

    try {
      await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
    } catch (e) {
      console.error('Erreur suppression CURRENT_WORKOUT_KEY dans discardCurrentWorkout:', e);
    }

    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        const parsed = JSON.parse(jsonValue) as FitTrackerData;
        if (parsed.currentWorkout) {
          parsed.currentWorkout = null;
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.error('Erreur nettoyage global currentWorkout dans discardCurrentWorkout:', e);
    }
  },

  /**
   * Force l'écriture immédiate de la session active en cours (ex: fermeture de l'app ou mise en arrière-plan).
   */
  async flushCurrentWorkout(): Promise<void> {
    if (saveCurrentWorkoutDebounceTimer) {
      clearTimeout(saveCurrentWorkoutDebounceTimer);
      saveCurrentWorkoutDebounceTimer = null;
    }
    const targetSession = lastPendingSession;
    if (targetSession !== undefined) {
      try {
        if (targetSession === null) {
          await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
        } else {
          await AsyncStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(targetSession));
        }
      } catch (e) {
        console.error('Erreur flushCurrentWorkout:', e);
      }
    }
  },

  /**
   * Ajoute ou met à jour une mensuration corporelle.
   */
  async addMeasurement(measurement: BodyMeasurement): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const existingIndex = currentData.measurements.findIndex(
      (m) => m.date === measurement.date || m.id === measurement.id
    );

    let updatedMeasurements: BodyMeasurement[];
    if (existingIndex >= 0) {
      const existing = currentData.measurements[existingIndex];
      const merged: BodyMeasurement = {
        ...existing,
        ...measurement,
        id: existing.id,
        date: measurement.date,
        weightKg: measurement.weightKg,
        chestCm: measurement.chestCm,
        thighCm: measurement.thighCm,
        bicepsCm: measurement.bicepsCm,
      };
      updatedMeasurements = [...currentData.measurements];
      updatedMeasurements[existingIndex] = merged;
    } else {
      updatedMeasurements = [measurement, ...currentData.measurements];
    }

    // Tri chronologique croissant par date
    updatedMeasurements.sort((a, b) => a.date.localeCompare(b.date));

    // Récupérer le poids de la mesure la plus récente par date
    const latestMeasurement = updatedMeasurements[updatedMeasurements.length - 1];
    const latestWeight = latestMeasurement ? latestMeasurement.weightKg : currentData.profile.currentWeightKg;

    const updatedData: FitTrackerData = {
      ...currentData,
      measurements: updatedMeasurements,
      profile: {
        ...currentData.profile,
        currentWeightKg: latestWeight,
      },
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Supprime une mensuration corporelle par ID.
   */
  async deleteMeasurement(id: string): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedMeasurements = currentData.measurements.filter((m) => m.id !== id);
    const updatedData: FitTrackerData = {
      ...currentData,
      measurements: updatedMeasurements,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Sauvegarde les dossiers de programmes (WorkoutFolder[]).
   */
  async saveFolders(folders: WorkoutFolder[]): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedData: FitTrackerData = {
      ...currentData,
      folders,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Met à jour une séance passée existante dans l'historique.
   */
  async updateWorkoutSession(updatedSession: WorkoutSession): Promise<FitTrackerData> {
    const currentData = await this.loadData();

    let totalVolume = 0;
    let completedSetsCount = 0;
    let totalSetsCount = 0;

    const blocks = getSessionBlocks(updatedSession);
    blocks.forEach((b) => {
      if (b.type === 'single') {
        b.exercise.sets.forEach((s) => {
          totalSetsCount++;
          if (s.completed) {
            completedSetsCount++;
            const effectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (s.weightKg || 0);
            if (s.type !== 'warmup' && effectiveWeight > 0 && s.reps) {
              totalVolume += effectiveWeight * s.reps;
            }
          }
        });
      } else if (b.type === 'circuit') {
        totalSetsCount += b.rounds * b.exercises.length;
        completedSetsCount += b.rounds * b.exercises.length;
      }
    });

    const refreshedSession: WorkoutSession = {
      ...updatedSession,
      totalVolumeKg: Math.round(totalVolume * 10) / 10,
      completedSetsCount,
      totalSetsCount,
    };

    const updatedHistory = currentData.history.map((s) => (s.id === refreshedSession.id ? refreshedSession : s));
    updatedHistory.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const updatedData: FitTrackerData = {
      ...currentData,
      history: updatedHistory,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Supprime une séance complète de l'historique par ID.
   */
  async deleteWorkoutSession(sessionId: string): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedHistory = currentData.history.filter((s) => s.id !== sessionId);
    const updatedData: FitTrackerData = {
      ...currentData,
      history: updatedHistory,
      profile: {
        ...currentData.profile,
        totalWorkouts: Math.max(0, currentData.profile.totalWorkouts - 1),
      },
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Supprime un exercice spécifique d'une séance dans l'historique.
   */
  async deleteExerciseFromSession(sessionId: string, exerciseId: string): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedHistory = currentData.history.map((session) => {
      if (session.id !== sessionId) return session;

      const updatedExercises = (session.exercises || []).filter((ex) => ex.id !== exerciseId);
      const updatedBlocks = session.blocks
        ? session.blocks.filter((block) => {
            if (block.type === 'single') {
              return block.exercise.id !== exerciseId;
            }
            return true;
          })
        : undefined;

      let volume = 0;
      let completedCount = 0;
      let totalCount = 0;

      if (updatedBlocks && updatedBlocks.length > 0) {
        updatedBlocks.forEach((block) => {
          if (block.type === 'single') {
            block.exercise.sets.forEach((s) => {
              totalCount++;
              if (s.completed) {
                completedCount++;
                const effectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (s.weightKg || 0);
                if (s.type !== 'warmup' && effectiveWeight > 0 && s.reps) {
                  volume += effectiveWeight * s.reps;
                }
              }
            });
          }
        });
      } else {
        updatedExercises.forEach((ex) => {
          ex.sets.forEach((s) => {
            totalCount++;
            if (s.completed) {
              completedCount++;
              const effectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (s.weightKg || 0);
              if (s.type !== 'warmup' && effectiveWeight > 0 && s.reps) {
                volume += effectiveWeight * s.reps;
              }
            }
          });
        });
      }

      return {
        ...session,
        blocks: updatedBlocks,
        exercises: updatedExercises,
        totalVolumeKg: volume,
        completedSetsCount: completedCount,
        totalSetsCount: totalCount,
      };
    });

    const updatedData: FitTrackerData = {
      ...currentData,
      history: updatedHistory,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Supprime une série spécifique d'un exercice d'une séance dans l'historique.
   */
  async deleteSetFromSession(sessionId: string, exerciseId: string, setId: string): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedHistory = currentData.history.map((session) => {
      if (session.id !== sessionId) return session;

      const updatedExercises = (session.exercises || []).map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const updatedSets = ex.sets
          .filter((s) => s.id !== setId)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

        return { ...ex, sets: updatedSets };
      });

      const updatedBlocks = session.blocks
        ? session.blocks.map((block) => {
            if (block.type === 'single' && block.exercise.id === exerciseId) {
              const updatedSets = block.exercise.sets
                .filter((s) => s.id !== setId)
                .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
              return { ...block, exercise: { ...block.exercise, sets: updatedSets } };
            }
            return block;
          })
        : undefined;

      let volume = 0;
      let completedCount = 0;
      let totalCount = 0;

      if (updatedBlocks && updatedBlocks.length > 0) {
        updatedBlocks.forEach((block) => {
          if (block.type === 'single') {
            block.exercise.sets.forEach((s) => {
              totalCount++;
              if (s.completed) {
                completedCount++;
                const effectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (s.weightKg || 0);
                if (s.type !== 'warmup' && effectiveWeight > 0 && s.reps) {
                  volume += effectiveWeight * s.reps;
                }
              }
            });
          }
        });
      } else {
        updatedExercises.forEach((ex) => {
          ex.sets.forEach((s) => {
            totalCount++;
            if (s.completed) {
              completedCount++;
              const effectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (s.weightKg || 0);
              if (s.type !== 'warmup' && effectiveWeight > 0 && s.reps) {
                volume += effectiveWeight * s.reps;
              }
            }
          });
        });
      }

      return {
        ...session,
        blocks: updatedBlocks,
        exercises: updatedExercises,
        totalVolumeKg: volume,
        completedSetsCount: completedCount,
        totalSetsCount: totalCount,
      };
    });

    const updatedData: FitTrackerData = {
      ...currentData,
      history: updatedHistory,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Ajoute un exercice personnalisé à la base de données locale.
   */
  async addCustomExercise(exerciseData: Omit<SharedExercise, 'id' | 'isCustom'>): Promise<{ updatedData: FitTrackerData; newExercise: SharedExercise }> {
    const currentData = await this.loadData();
    const customList = currentData.customExercises || [];

    const newExercise: SharedExercise = {
      ...exerciseData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isCustom: true,
      defaultRestSeconds: exerciseData.defaultRestSeconds || 75,
    };

    const updatedData: FitTrackerData = {
      ...currentData,
      customExercises: [newExercise, ...customList],
    };

    await this.saveData(updatedData);
    return { updatedData, newExercise };
  },

  /**
   * Met à jour un exercice (système ou personnalisé) dans la base locale.
   */
  async updateCustomExercise(exercise: SharedExercise): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const customList = currentData.customExercises || [];

    const existsInCustom = customList.some((ex) => ex.id === exercise.id);
    let updatedList: SharedExercise[];

    if (existsInCustom) {
      updatedList = customList.map((ex) => (ex.id === exercise.id ? exercise : ex));
    } else {
      updatedList = [exercise, ...customList];
    }

    const updatedData: FitTrackerData = {
      ...currentData,
      customExercises: updatedList,
    };

    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Supprime un exercice (système ou personnalisé) de la base locale.
   */
  async deleteCustomExercise(exerciseId: string): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const customList = currentData.customExercises || [];
    const deletedIds = currentData.deletedExerciseIds || [];

    const updatedCustomList = customList.filter((ex) => ex.id !== exerciseId);
    const updatedDeletedIds = deletedIds.includes(exerciseId)
      ? deletedIds
      : [...deletedIds, exerciseId];

    const updatedData: FitTrackerData = {
      ...currentData,
      customExercises: updatedCustomList,
      deletedExerciseIds: updatedDeletedIds,
    };

    await this.saveData(updatedData);
    return updatedData;
  },

  /**
   * Charge l'état de réduction/extension des cartes de séances.
   */
  async loadCollapsedCards(): Promise<Record<string, boolean>> {
    try {
      let jsonValue = await AsyncStorage.getItem(COLLAPSED_CARDS_KEY);
      if (jsonValue === null) {
        jsonValue = await AsyncStorage.getItem(LEGACY_COLLAPSED_CARDS_KEY);
      }
      if (jsonValue !== null) {
        return JSON.parse(jsonValue) as Record<string, boolean>;
      }
      return {};
    } catch (e) {
      console.error('Erreur lors du chargement de collapsedCards:', e);
      return {};
    }
  },

  /**
   * Sauvegarde l'état de réduction/extension des cartes de séances.
   */
  async saveCollapsedCards(collapsedMap: Record<string, boolean>): Promise<void> {
    try {
      const jsonValue = JSON.stringify(collapsedMap);
      await AsyncStorage.setItem(COLLAPSED_CARDS_KEY, jsonValue);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde de collapsedCards:', e);
    }
  },

  /**
   * Efface toutes les données de stockage local pour repartir sur une application neuve.
   */
  async resetAllData(): Promise<FitTrackerData> {
    if (saveCurrentWorkoutDebounceTimer) {
      clearTimeout(saveCurrentWorkoutDebounceTimer);
      saveCurrentWorkoutDebounceTimer = null;
    }
    lastPendingSession = null;
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      await AsyncStorage.removeItem(COLLAPSED_CARDS_KEY);
      await AsyncStorage.removeItem(LEGACY_COLLAPSED_CARDS_KEY);
      await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
    } catch (e) {
      console.error('Erreur lors de la réinitialisation des données:', e);
    }
    await this.saveData(INITIAL_MOCK_DATA);
    return INITIAL_MOCK_DATA;
  },

  async completeOnboarding(profileData?: { name?: string; currentWeightKg?: number }): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const currentProfile = currentData.profile || { name: 'Athlète', currentWeightKg: 0 };
    const updatedData: FitTrackerData = {
      ...currentData,
      hasCompletedOnboarding: true,
      profile: {
        ...currentProfile,
        name: profileData?.name?.trim() || currentProfile.name || 'Athlète',
        currentWeightKg: profileData?.currentWeightKg || currentProfile.currentWeightKg || 0,
      },
    };
    if (profileData?.currentWeightKg && profileData.currentWeightKg > 0) {
      const today = new Date().toISOString().split('T')[0];
      const newM: BodyMeasurement = {
        id: `m_onboarding_${Date.now()}`,
        date: today,
        weightKg: profileData.currentWeightKg,
      };
      updatedData.measurements = [newM, ...(updatedData.measurements || [])];
    }
    await this.saveData(updatedData);
    return updatedData;
  },

  async skipOnboarding(): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const currentProfile = currentData.profile || { name: 'Athlète', currentWeightKg: 0 };
    const updatedData: FitTrackerData = {
      ...currentData,
      hasCompletedOnboarding: true,
      hasCreatedFirstSession: true,
      hasCompletedFirstWorkout: true,
      profile: {
        ...currentProfile,
        name: currentProfile.name || 'Athlète',
      },
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  async markFirstSessionCreated(): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedData: FitTrackerData = {
      ...currentData,
      hasCreatedFirstSession: true,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  async resetOnboarding(): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedData: FitTrackerData = {
      ...currentData,
      hasCompletedOnboarding: false,
      hasCreatedFirstSession: false,
      hasCompletedFirstWorkout: false,
    };
    await this.saveData(updatedData);
    return updatedData;
  },

  async getStorageUsage(): Promise<{ totalBytes: number; formattedSize: string }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      let totalBytes = 0;
      items.forEach(([key, val]) => {
        totalBytes += (key ? key.length : 0) + (val ? val.length : 0);
      });
      let formattedSize = `${totalBytes} B`;
      if (totalBytes > 1024 * 1024) {
        formattedSize = `${(totalBytes / (1024 * 1024)).toFixed(1)} Mo`;
      } else if (totalBytes > 1024) {
        formattedSize = `${(totalBytes / 1024).toFixed(1)} Ko`;
      }
      return { totalBytes, formattedSize };
    } catch (e) {
      return { totalBytes: 0, formattedSize: '0 Ko' };
    }
  },
};

