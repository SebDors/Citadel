export type SetType = 'normal' | 'warmup' | 'drop' | 'amrap' | 'failure';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  rir: number; // Reps In Reserve (0 à 5+)
  durationSeconds?: number; // Pour les exercices de gainage / planche
  previous?: string; // Ex: "100kg x 8" ou "45s"
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetMuscles: string[]; // Indication explicite du/des muscle(s) travaillé(s)
  primaryMuscle: string;   // Muscle principal pour les badges
  notes?: string;
  restSeconds: number;     // Temps de repos préconisé en secondes
  supersetGroup?: string;  // Ex: "Superset A"
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  templateId?: string;
  startTime: string; // ISO String
  endTime?: string;
  durationSeconds: number;
  totalVolumeKg: number;
  completedSetsCount: number;
  totalSetsCount: number;
  exercises: WorkoutExercise[];
  status: 'in_progress' | 'completed';
  isCircuit?: boolean;
  circuitRounds?: number;
  restBetweenRoundsSeconds?: number;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  description: string;
  targetMuscles: string[];
  exercises: WorkoutExercise[];
  isCircuit?: boolean;
  circuitRounds?: number;
  restBetweenRoundsSeconds?: number;
}

export interface BodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  thighCm?: number;
  bicepsCm?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  currentWeightKg: number;
  totalWorkouts: number;
}

export interface FitTrackerData {
  profile: UserProfile;
  templates: WorkoutTemplate[];
  history: WorkoutSession[];
  measurements: BodyMeasurement[];
  currentWorkout?: WorkoutSession | null;
}
