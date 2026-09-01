import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitTrackerData, WorkoutSession, WorkoutTemplate, BodyMeasurement, WorkoutFolder } from '../types';
import { INITIAL_MOCK_DATA } from './mockData';
import { SharedExercise } from '../constants/exerciseDatabase';

const STORAGE_KEY = '@citadel_app_data_v1';
const LEGACY_STORAGE_KEY = '@warriorfit_app_data_v1';
const COLLAPSED_CARDS_KEY = '@citadel_collapsed_cards_v1';
const LEGACY_COLLAPSED_CARDS_KEY = '@warriorfit_collapsed_cards_v1';

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
   * Sauvegarde ou met à jour la séance en cours (en direct).
   */
  async saveCurrentWorkout(session: WorkoutSession | null): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedData: FitTrackerData = {
      ...currentData,
      currentWorkout: session,
    };
    await this.saveData(updatedData);
    return updatedData;
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
        chestCm: measurement.chestCm !== undefined ? measurement.chestCm : existing.chestCm,
        thighCm: measurement.thighCm !== undefined ? measurement.thighCm : existing.thighCm,
        bicepsCm: measurement.bicepsCm !== undefined ? measurement.bicepsCm : existing.bicepsCm,
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
      const jsonValue = await AsyncStorage.getItem(COLLAPSED_CARDS_KEY);
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
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      await AsyncStorage.removeItem(COLLAPSED_CARDS_KEY);
      await AsyncStorage.removeItem(LEGACY_COLLAPSED_CARDS_KEY);
    } catch (e) {
      console.error('Erreur lors de la réinitialisation des données:', e);
    }
    await this.saveData(INITIAL_MOCK_DATA);
    return INITIAL_MOCK_DATA;
  },

  async completeOnboarding(profileData?: { name?: string; currentWeightKg?: number }): Promise<FitTrackerData> {
    const currentData = await this.loadData();
    const updatedData: FitTrackerData = {
      ...currentData,
      hasCompletedOnboarding: true,
      profile: {
        ...currentData.profile,
        name: profileData?.name?.trim() || currentData.profile.name || 'Athlète',
        currentWeightKg: profileData?.currentWeightKg || currentData.profile.currentWeightKg || 0,
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
};

