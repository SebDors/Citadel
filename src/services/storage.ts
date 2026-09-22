import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitTrackerData, WorkoutSession, WorkoutTemplate, BodyMeasurement, WorkoutFolder, getSessionBlocks } from '../types';
import { INITIAL_MOCK_DATA } from './mockData';
import { SharedExercise } from '../constants/exerciseDatabase';

const STORAGE_KEY = '@citadel_app_data_v1';
const LEGACY_STORAGE_KEY = '@warriorfit_app_data_v1';
const COLLAPSED_CARDS_KEY = '@citadel_collapsed_cards_v1';
const LEGACY_COLLAPSED_CARDS_KEY = '@warriorfit_collapsed_cards_v1';
const CURRENT_WORKOUT_KEY = '@citadel_current_workout_v1';

let saveCurrentWorkoutDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPendingSession: WorkoutSession | null = null;

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

        // Vérifier si une session active isolée et plus récente existe
        try {
          const activeSessionJson = await AsyncStorage.getItem(CURRENT_WORKOUT_KEY);
          if (activeSessionJson !== null) {
            parsed.currentWorkout = JSON.parse(activeSessionJson) as WorkoutSession;
          }
        } catch {
          // Ignorer si échec de lecture de la clé isolée
        }

        return parsed;
      }
      // Première utilisation : Sauvegarder les données mock initiales
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
   * Sauvegarde non-bloquante et entièrement débouncée de la séance en cours.
   * Enregistre EXCLUSIVEMENT la clé isolée CURRENT_WORKOUT_KEY (~2 Ko) sans jamais
   * charger ni réécrire la base globale complète (évite les 2.1s de blocage du pont Android).
   */
  saveCurrentWorkout(session: WorkoutSession | null): void {
    lastPendingSession = session;

    if (saveCurrentWorkoutDebounceTimer) {
      clearTimeout(saveCurrentWorkoutDebounceTimer);
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
            if (s.type !== 'warmup' && s.weightKg && s.reps) {
              totalVolume += s.weightKg * s.reps;
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
                if (s.type !== 'warmup' && s.weightKg && s.reps) {
                  volume += s.weightKg * s.reps;
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
              if (s.type !== 'warmup' && s.weightKg && s.reps) {
                volume += s.weightKg * s.reps;
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
                if (s.type !== 'warmup' && s.weightKg && s.reps) {
                  volume += s.weightKg * s.reps;
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
              if (s.type !== 'warmup' && s.weightKg && s.reps) {
                volume += s.weightKg * s.reps;
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

