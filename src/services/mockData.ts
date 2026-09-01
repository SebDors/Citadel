import { FitTrackerData } from '../types';

export const INITIAL_MOCK_DATA: FitTrackerData = {
  profile: {
    id: 'usr_01',
    name: 'Athlète',
    currentWeightKg: 0,
    totalWorkouts: 0,
  },
  templates: [],
  history: [],
  measurements: [],
  folders: [],
  customExercises: [],
  deletedExerciseIds: [],
  currentWorkout: null,
};
