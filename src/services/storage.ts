import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitTrackerData, WorkoutSession, WorkoutTemplate, BodyMeasurement, WorkoutFolder } from '../types';
import { INITIAL_MOCK_DATA } from './mockData';

const STORAGE_KEY = '@warriorfit_app_data_v1';

export const StorageService = {
  /**
   * Charge toutes les données de l'application depuis AsyncStorage.
   * Si aucune donnée n'existe, initialise avec les données de démonstration.
   */
  async loadData(): Promise<FitTrackerData> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
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
    const updatedMeasurements = [measurement, ...currentData.measurements.filter((m) => m.id !== measurement.id)];
    const updatedData: FitTrackerData = {
      ...currentData,
      measurements: updatedMeasurements,
      profile: {
        ...currentData.profile,
        currentWeightKg: measurement.weightKg,
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
   * Remplace intégralement les données par un objet importé depuis un JSON.
   */
  async importFullData(data: FitTrackerData): Promise<void> {
    await this.saveData(data);
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

      const updatedExercises = session.exercises.filter((ex) => ex.id !== exerciseId);

      let volume = 0;
      let completedCount = 0;
      let totalCount = 0;

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

      return {
        ...session,
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

      const updatedExercises = session.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const updatedSets = ex.sets
          .filter((s) => s.id !== setId)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

        return { ...ex, sets: updatedSets };
      });

      let volume = 0;
      let completedCount = 0;
      let totalCount = 0;

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

      return {
        ...session,
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
};

