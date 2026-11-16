import { create } from 'zustand';
import { FitTrackerData } from '../types';
import { ExerciseRecordEntry } from '../services/database';

export interface WorkoutDataState {
  data: FitTrackerData | null;
  exerciseRecords: Record<string, ExerciseRecordEntry>;
  isLoading: boolean;
  setData: (data: FitTrackerData | null) => void;
  setExerciseRecords: (records: Record<string, ExerciseRecordEntry>) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useWorkoutDataStore = create<WorkoutDataState>((set) => ({
  data: null,
  exerciseRecords: {},
  isLoading: true,

  setData: (data) => set({ data }),
  setExerciseRecords: (exerciseRecords) => set({ exerciseRecords }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
