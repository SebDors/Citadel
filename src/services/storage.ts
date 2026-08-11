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
};

