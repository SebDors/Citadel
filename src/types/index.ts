export type SetType = 'normal' | 'warmup' | 'drop' | 'amrap' | 'failure';

export interface SetTypeInfo {
  type: SetType;
  label: string;
  code: string;
  description: string;
  color: string;
}

export const SET_TYPES_CONFIG: Record<SetType, SetTypeInfo> = {
  normal: { type: 'normal', label: 'Série Normale', code: 'N', description: 'Série de travail standard (Poids × Reps)', color: '#618764' },
  warmup: { type: 'warmup', label: 'Échauffement', code: 'W', description: 'Série préparatoire (exclue du volume total)', color: '#D97706' },
  drop: { type: 'drop', label: 'Drop Set', code: 'D', description: 'Série dégressive sans temps de repos', color: '#8B5CF6' },
  amrap: { type: 'amrap', label: 'AMRAP', code: 'A', description: 'Autant de répétitions que possible', color: '#EC4899' },
  failure: { type: 'failure', label: 'Échec', code: 'F', description: 'Poussée jusqu\'à l\'échec mécanique ultime', color: '#EF4444' },
};

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg?: number; // Optionnel (champ vide si non renseigné)
  reps?: number;     // Optionnel (champ vide si non renseigné)
  rir: number;       // Reps In Reserve (0 à 5+)
  durationSeconds?: number;
  previous?: string; // Ex: "100kg x 8" ou "45s"
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetMuscles: string[];
  primaryMuscle: string;
  notes?: string;
  restSeconds: number;
  supersetGroup?: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  templateId?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  totalVolumeKg: number;
  completedSetsCount: number;
  totalSetsCount: number;
  exercises: WorkoutExercise[];
  status: 'in_progress' | 'completed';
  isCircuit?: boolean;
  circuitRounds?: number;
  currentCircuitRound?: number;
  restBetweenRoundsSeconds?: number;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  description?: string;
  targetMuscles?: string[];
  exercises: WorkoutExercise[];
  isCircuit?: boolean;
  circuitRounds?: number;
  restBetweenRoundsSeconds?: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  thighCm?: number;
  bicepsCm?: number;
}

export interface WorkoutFolder {
  id: string;
  name: string;
  templateIds: string[];
  isCollapsed?: boolean;
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
  folders?: WorkoutFolder[];
  currentWorkout?: WorkoutSession | null;
}

/**
 * Calcule la VRAIE date du dernier entraînement effectué pour une séance (basée sur history).
 */
export function getRealLastWorkoutDate(
  history: WorkoutSession[],
  templateTitle: string
): { dateStr: string; dateFormatted: string } | null {
  if (!history || history.length === 0) return null;

  const matchingSessions = history.filter(
    (s) => s.status === 'completed' && s.title.trim().toLowerCase() === templateTitle.trim().toLowerCase()
  );

  if (matchingSessions.length === 0) return null;

  const sorted = [...matchingSessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const lastSession = sorted[0];
  const dateObj = new Date(lastSession.startTime);
  const dateStr = lastSession.startTime.split('T')[0];

  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return { dateStr, dateFormatted };
}

/**
 * Calculateur du temps estimé d'une séance (en minutes).
 * Basé sur une durée moyenne d'exécution de 45s par série + le temps de repos préconisé.
 */
export function calculateEstimatedWorkoutMinutes(exercises: WorkoutExercise[]): number {
  let totalSeconds = 0;
  exercises.forEach((ex) => {
    const setsCount = ex.sets.length;
    // Execution: ~45 sec par série
    totalSeconds += setsCount * 45;
    // Repos entre les séries de l'exercice
    if (setsCount > 1) {
      totalSeconds += (setsCount - 1) * (ex.restSeconds || 75);
    }
  });

  // Ajouter 2 minutes de transition entre les exercices
  if (exercises.length > 1) {
    totalSeconds += (exercises.length - 1) * 120;
  }

  return Math.ceil(totalSeconds / 60);
}
