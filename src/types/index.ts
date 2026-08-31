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

export interface DropStep {
  id: string;
  weightKg?: number;
  reps?: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg?: number; // Optionnel (champ vide si non renseigné)
  reps?: number;     // Optionnel (champ vide si non renseigné)
  rir?: number;      // Reps In Reserve (0 à 5+)
  dropSteps?: DropStep[]; // Décharges (Drop Sets)
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

export interface CircuitExerciseItem {
  id: string;
  exerciseName: string;
  primaryMuscle: string;
  targetMuscles?: string[];
  targetValue: number;
  targetType: 'reps' | 'time';
}

export interface CircuitBlock {
  id: string;
  type: 'circuit';
  title: string;
  rounds: number;
  restBetweenRoundsSeconds: number;
  exercises: CircuitExerciseItem[];
  circuitType?: 'rounds' | 'amrap';
  amrapDurationMinutes?: number;
}

export interface SingleExerciseBlock {
  id: string;
  type: 'single';
  exercise: WorkoutExercise;
}

export type WorkoutBlock = SingleExerciseBlock | CircuitBlock;

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
  exercises?: WorkoutExercise[];
  blocks?: WorkoutBlock[];
  status: 'in_progress' | 'completed';
  hasStarted?: boolean;
  isCircuit?: boolean;
  circuitRounds?: number;
  currentCircuitRound?: number;
  completedRoundsCount?: number;
  restBetweenRoundsSeconds?: number;
  circuitStates?: Record<string, any>;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  description?: string;
  targetMuscles?: string[];
  exercises?: WorkoutExercise[];
  blocks?: WorkoutBlock[];
  isCircuit?: boolean;
  circuitRounds?: number;
  restBetweenRoundsSeconds?: number;
  defaultRestSeconds?: number;
  createdAt?: string;
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

import { SharedExercise } from '../constants/exerciseDatabase';

export interface FitTrackerData {
  profile: UserProfile;
  templates: WorkoutTemplate[];
  history: WorkoutSession[];
  measurements: BodyMeasurement[];
  folders?: WorkoutFolder[];
  customExercises?: SharedExercise[];
  deletedExerciseIds?: string[];
  currentWorkout?: WorkoutSession | null;
}

/**
 * Renvoie un tableau de WorkoutBlock[] pour un WorkoutTemplate (gère la rétrocompatibilité legacy).
 */
export function getTemplateBlocks(template: WorkoutTemplate): WorkoutBlock[] {
  if (template.blocks && template.blocks.length > 0) {
    return template.blocks;
  }

  if (template.isCircuit && template.exercises && template.exercises.length > 0) {
    const circuitBlock: CircuitBlock = {
      id: `blk_circuit_${template.id}`,
      type: 'circuit',
      title: template.title || 'Circuit',
      rounds: template.circuitRounds || 3,
      restBetweenRoundsSeconds: template.restBetweenRoundsSeconds || 120,
      exercises: template.exercises.map((ex, index) => {
        const firstSet = ex.sets?.[0];
        const isTime = !!(firstSet?.durationSeconds && firstSet.durationSeconds > 0);
        return {
          id: ex.id || `circ_ex_${index}`,
          exerciseName: ex.exerciseName,
          primaryMuscle: ex.primaryMuscle,
          targetMuscles: ex.targetMuscles,
          targetValue: isTime ? firstSet!.durationSeconds! : (firstSet?.reps || 10),
          targetType: isTime ? 'time' : 'reps',
        };
      }),
    };
    return [circuitBlock];
  }

  if (template.exercises && template.exercises.length > 0) {
    return template.exercises.map((ex) => ({
      id: `blk_single_${ex.id}`,
      type: 'single',
      exercise: ex,
    }));
  }

  return [];
}

/**
 * Renvoie un tableau de WorkoutBlock[] pour une WorkoutSession (gère la rétrocompatibilité legacy).
 */
export function getSessionBlocks(session: WorkoutSession): WorkoutBlock[] {
  if (session.blocks && session.blocks.length > 0) {
    return session.blocks;
  }

  if (session.isCircuit && session.exercises && session.exercises.length > 0) {
    const circuitBlock: CircuitBlock = {
      id: `blk_circuit_${session.id}`,
      type: 'circuit',
      title: session.title || 'Circuit',
      rounds: session.circuitRounds || 3,
      restBetweenRoundsSeconds: session.restBetweenRoundsSeconds || 120,
      exercises: session.exercises.map((ex, index) => {
        const firstSet = ex.sets?.[0];
        const isTime = !!(firstSet?.durationSeconds && firstSet.durationSeconds > 0);
        return {
          id: ex.id || `circ_ex_${index}`,
          exerciseName: ex.exerciseName,
          primaryMuscle: ex.primaryMuscle,
          targetMuscles: ex.targetMuscles,
          targetValue: isTime ? firstSet!.durationSeconds! : (firstSet?.reps || 10),
          targetType: isTime ? 'time' : 'reps',
        };
      }),
    };
    return [circuitBlock];
  }

  if (session.exercises && session.exercises.length > 0) {
    return session.exercises.map((ex) => ({
      id: `blk_single_${ex.id}`,
      type: 'single',
      exercise: ex,
    }));
  }

  return [];
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
 * Accepte WorkoutExercise[] ou WorkoutBlock[].
 */
export function calculateEstimatedWorkoutMinutes(items: WorkoutExercise[] | WorkoutBlock[]): number {
  if (!items || items.length === 0) return 0;
  let totalSeconds = 0;

  if ('type' in items[0]) {
    const blocks = items as WorkoutBlock[];
    blocks.forEach((block) => {
      if (block.type === 'single') {
        const setsCount = block.exercise.sets.length;
        totalSeconds += setsCount * 45;
        if (setsCount > 1) {
          totalSeconds += (setsCount - 1) * (block.exercise.restSeconds || 75);
        }
      } else if (block.type === 'circuit') {
        if (block.circuitType === 'amrap' && block.amrapDurationMinutes) {
          totalSeconds += (block.amrapDurationMinutes * 60) + (block.restBetweenRoundsSeconds || 120);
        } else {
          const exercisesCount = block.exercises.length;
          const totalCircuitWork = block.rounds * exercisesCount * 45;
          const totalCircuitRest = (block.rounds - 1) * (block.restBetweenRoundsSeconds || 120);
          totalSeconds += totalCircuitWork + totalCircuitRest;
        }
      }
    });

    if (blocks.length > 1) {
      totalSeconds += (blocks.length - 1) * 120;
    }
  } else {
    const exercises = items as WorkoutExercise[];
    exercises.forEach((ex) => {
      const setsCount = ex.sets.length;
      totalSeconds += setsCount * 45;
      if (setsCount > 1) {
        totalSeconds += (setsCount - 1) * (ex.restSeconds || 75);
      }
    });

    if (exercises.length > 1) {
      totalSeconds += (exercises.length - 1) * 120;
    }
  }

  return Math.ceil(totalSeconds / 60);
}

/**
 * Formate le texte résumé d'un bloc circuit.
 * Ex: "Circuit AMRAP (20 min · 3 exos)", "Circuit Round (3 tours · 3 exos)"
 * Titre personnalisé: "Abdos Round (3 tours · 3 exos)"
 */
export function formatCircuitSummary(block: CircuitBlock): string {
  const isAmrap = block.circuitType === 'amrap';
  const typeSuffix = isAmrap ? 'AMRAP' : 'Round';

  let baseTitle = block.title ? block.title.trim() : '';
  baseTitle = baseTitle.replace(/\s*\(?(AMRAP|Round)\)?$/i, '').trim();

  if (!baseTitle || /^circuit(\s*#?\s*\d+)?$/i.test(baseTitle)) {
    baseTitle = 'Circuit';
  }

  const title = `${baseTitle} ${typeSuffix}`;

  const roundsCount = block.rounds || 1;
  const roundsOrDurationText = isAmrap
    ? `${block.amrapDurationMinutes || 20} min`
    : `${roundsCount} tour${roundsCount > 1 ? 's' : ''}`;

  const exosCount = block.exercises?.length || 0;
  const exosText = `${exosCount} exo${exosCount > 1 ? 's' : ''}`;

  return `${title} (${roundsOrDurationText} · ${exosText})`;
}

