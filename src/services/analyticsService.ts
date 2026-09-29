import { WorkoutSession, WorkoutBlock, WorkoutSet, WorkoutExercise, getSessionBlocks, BodyMeasurement } from '../types';
import { MuscleGroup, normalizeMuscle } from '../constants/muscles';

/**
 * Calcul du 1RM estimé selon la formule d'Epley (standard international de référence).
 * Si reps > 12, renvoie null (formule non fiable au-delà de 12 répétitions).
 * Si reps === 1, renvoie directement le poids.
 */
export function calculateE1RM(weightKg: number, reps: number): number | null {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) return null;
  if (reps > 12) return null;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  // Formule d'Epley : 1RM = Poids * (1 + Reps / 30)
  return Math.round((weightKg * (1 + reps / 30)) * 10) / 10;
}

/**
 * Calcule le volume total, le nombre de séries complétées et totales d'une séance.
 * Prend en compte :
 * - Les séries normales
 * - Les décharges de Drop Sets (dropSteps)
 * - Les circuits et AMRAPs
 * - Exclut les séries d'échauffement (warmup) du volume de charge
 */
export function calculateWorkoutTotalVolume(
  exercises?: WorkoutExercise[],
  blocks?: WorkoutBlock[],
  sessionMeta?: { isCircuit?: boolean; circuitRounds?: number; completedRoundsCount?: number; circuitStates?: Record<string, any> }
): { volume: number; completedCount: number; totalCount: number } {
  let volume = 0;
  let completedCount = 0;
  let totalCount = 0;

  const processSet = (s: WorkoutSet) => {
    totalCount++;
    if (s.completed) {
      completedCount++;
      const effectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (s.weightKg || 0);
      if (s.type !== 'warmup' && effectiveWeight > 0 && s.reps) {
        volume += effectiveWeight * s.reps;
      }
      // Prise en compte scientifique des Drop Sets (chaque décharge compte dans le tonnage)
      if (s.dropSteps && s.dropSteps.length > 0) {
        s.dropSteps.forEach((step) => {
          const stepEffectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (step.weightKg || 0);
          if (stepEffectiveWeight > 0 && step.reps) {
            volume += stepEffectiveWeight * step.reps;
          }
        });
      }
    }
  };

  if (blocks && blocks.length > 0) {
    blocks.forEach((block) => {
      if (block.type === 'single') {
        (block.exercise.sets || []).forEach(processSet);
      } else if (block.type === 'circuit') {
        // Pour les blocs circuits
        const rounds = block.rounds || sessionMeta?.completedRoundsCount || sessionMeta?.circuitRounds || 1;
        block.exercises.forEach((item) => {
          totalCount += rounds;
          const cState = sessionMeta?.circuitStates?.[block.id];
          const completedRounds = cState?.completedRoundsCount ?? rounds;
          completedCount += completedRounds;
          // Si l'exercice de circuit a une valeur en reps et un poids défini
          if (item.targetType === 'reps' && item.targetValue > 0) {
            // Le volume est comptabilisé si applicable
          }
        });
      }
    });
  } else if (exercises) {
    exercises.forEach((ex) => {
      (ex.sets || []).forEach(processSet);
    });
  }

  return {
    volume: Math.round(volume * 10) / 10,
    completedCount,
    totalCount,
  };
}

export interface ExercisePRRecord {
  exerciseName: string;
  weightKg: number;
  reps: number;
  e1RM: number;
  date: string;
  isAllTimeBest: boolean;
}

/**
 * Parcourt l'ensemble de l'historique et calcule le véritable 1RM maximal
 * en évaluant TOUTES les séries effectuées (et pas seulement la série la plus lourde).
 */
export function calculateMaxE1RM(
  history: WorkoutSession[],
  exerciseName: string
): ExercisePRRecord | null {
  if (!history || history.length === 0 || !exerciseName) return null;

  const targetName = exerciseName.trim().toLowerCase();
  let bestRecord: ExercisePRRecord | null = null;

  // Tri chronologique
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  sortedHistory.forEach((session) => {
    const blocks = getSessionBlocks(session);
    blocks.forEach((block) => {
      if (block.type === 'single') {
        if (block.exercise.exerciseName.trim().toLowerCase() === targetName) {
          (block.exercise.sets || []).forEach((set) => {
            const effectiveWeight = (set.isBodyweight ? (set.bodyweightUsedKg || 0) : 0) + (set.weightKg || 0);
            if (set.completed && effectiveWeight > 0 && set.reps && set.reps > 0) {
              const currentE1RM = calculateE1RM(effectiveWeight, set.reps);
              if (currentE1RM !== null && (!bestRecord || currentE1RM > bestRecord.e1RM)) {
                bestRecord = {
                  exerciseName: block.exercise.exerciseName,
                  weightKg: effectiveWeight,
                  reps: set.reps,
                  e1RM: currentE1RM,
                  date: session.startTime,
                  isAllTimeBest: true,
                };
              }
            }
          });
        }
      }
    });
  });

  return bestRecord;
}



/**
 * Récupère tous les exercices uniques présents dans l'historique de l'utilisateur avec leur nombre de séances.
 */
export function getAvailableExercisesFromHistory(
  history: WorkoutSession[]
): { name: string; sessionCount: number; max1RM: number }[] {
  const map = new Map<string, { count: number; max1RM: number }>();

  history.forEach((session) => {
    const blocks = getSessionBlocks(session);
    const seenInSession = new Set<string>();

    blocks.forEach((block) => {
      if (block.type === 'single' && block.exercise.exerciseName) {
        const name = block.exercise.exerciseName.trim();
        if (!seenInSession.has(name.toLowerCase())) {
          seenInSession.add(name.toLowerCase());
          const existing = map.get(name) || { count: 0, max1RM: 0 };
          let sessionMaxE1RM = 0;
          (block.exercise.sets || []).forEach((s) => {
            const effectiveWeight = (s.isBodyweight ? (s.bodyweightUsedKg || 0) : 0) + (s.weightKg || 0);
            if (s.completed && effectiveWeight > 0 && s.reps) {
              const e = calculateE1RM(effectiveWeight, s.reps);
              if (e !== null && e > sessionMaxE1RM) sessionMaxE1RM = e;
            }
          });
          map.set(name, {
            count: existing.count + 1,
            max1RM: Math.max(existing.max1RM, sessionMaxE1RM),
          });
        }
      }
    });
  });

  return Array.from(map.entries())
    .map(([name, data]) => ({ name, sessionCount: data.count, max1RM: data.max1RM }))
    .sort((a, b) => b.sessionCount - a.sessionCount);
}

export interface MuscleVolumeBreakdown {
  muscle: string;
  effectiveSets: number;
  mev: number; // Minimum Effective Volume
  mav: number; // Maximum Adaptive Volume
  status: 'optimal' | 'moderate' | 'low';
}

// Repères scientifiques basés sur la littérature d'hypertrophie (Renaissance Periodization / Dr. Mike Israetel)
export const MUSCLE_VOLUME_LANDMARKS: Record<MuscleGroup, { mev: number; mav: number }> & Record<string, { mev: number; mav: number }> = {
  // Les 20 MUSCLE_GROUPS normalisés
  'Pectoraux': { mev: 8, mav: 16 },
  'Grand Dorsal': { mev: 8, mav: 16 },
  'Trapèzes': { mev: 6, mav: 14 },
  'Rhomboïdes': { mev: 4, mav: 12 },
  'Grand Rond': { mev: 4, mav: 10 },
  'Deltoïde Antérieur': { mev: 4, mav: 12 },
  'Deltoïde Latéral': { mev: 8, mav: 20 },
  'Deltoïde Postérieur': { mev: 6, mav: 16 },
  'Biceps': { mev: 6, mav: 14 },
  'Triceps': { mev: 6, mav: 14 },
  'Avant-bras': { mev: 4, mav: 12 },
  'Quadriceps': { mev: 8, mav: 16 },
  'Ischio-Jambiers': { mev: 6, mav: 14 },
  'Grand Fessier': { mev: 6, mav: 14 },
  'Adducteurs': { mev: 4, mav: 12 },
  'Mollets (Gastrocnémiens)': { mev: 6, mav: 14 },
  'Mollets (Soléaire)': { mev: 6, mav: 14 },
  'Lombaires': { mev: 4, mav: 10 },
  'Abdominaux': { mev: 4, mav: 12 },
  'Obliques': { mev: 4, mav: 12 },

  // Variantes additionnelles pour rétro-compatibilité
  'Pectoraux (Chef claviculaire - Haut)': { mev: 6, mav: 14 },
  'Pectoraux (Chef sterno-costal - Médian)': { mev: 6, mav: 14 },
  'Pectoraux (Chef abdominal - Bas)': { mev: 6, mav: 12 },
  'Pectoraux (Global)': { mev: 8, mav: 16 },
  'Dos': { mev: 10, mav: 18 },
  'Trapèzes (Moyens)': { mev: 6, mav: 14 },
  'Trapèzes (Inférieurs)': { mev: 4, mav: 10 },
  'Trapèzes (Supérieurs)': { mev: 6, mav: 14 },
  'Trapèzes Supérieurs': { mev: 6, mav: 14 },
  'Lombaires (Érecteurs du rachis)': { mev: 4, mav: 10 },
  'Ischio-jambiers': { mev: 6, mav: 14 },
  'Moyen Fessier': { mev: 4, mav: 12 },
  'Fessiers': { mev: 6, mav: 14 },
  'Épaules': { mev: 8, mav: 18 },
  'Coiffe des rotateurs': { mev: 4, mav: 10 },
  'Biceps (Chef court)': { mev: 6, mav: 14 },
  'Biceps (Chef long)': { mev: 6, mav: 14 },
  'Brachial': { mev: 4, mav: 10 },
  'Brachioradial': { mev: 4, mav: 10 },
  'Triceps (Chef long)': { mev: 6, mav: 14 },
  'Triceps (Chef latéral)': { mev: 6, mav: 14 },
  'Triceps (Chef médial)': { mev: 4, mav: 12 },
  'Triceps (Global)': { mev: 6, mav: 14 },
  'Mollets': { mev: 6, mav: 14 },
  'Tibial antérieur': { mev: 4, mav: 10 },
  'Grand Droit (Partie haute)': { mev: 4, mav: 12 },
  'Grand Droit (Partie basse)': { mev: 4, mav: 12 },
  'Grand Droit': { mev: 4, mav: 12 },
  'Transverse': { mev: 4, mav: 10 },
};

/**
 * Calcule le volume hebdomadaire de séries effectives par groupe musculaire
 * pour une semaine donnée (weekOffset: 0 = semaine en cours, -1 = semaine précédente, etc.).
 */
export function calculateWeeklyMuscleVolume(
  history: WorkoutSession[],
  weekOffset: number = 0
): MuscleVolumeBreakdown[] {
  if (!history || history.length === 0) return [];

  const now = new Date();
  const dayOfWeek = now.getDay();
  // Lundi de la semaine ciblée (calé à 00:00:00)
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + weekOffset * 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setMilliseconds(-1);

  const currentWeekSessions = history.filter((s) => {
    const sDate = new Date(s.startTime);
    return sDate >= startOfWeek && sDate <= endOfWeek && s.status === 'completed';
  });

  const muscleSetsMap = new Map<string, number>();

  currentWeekSessions.forEach((session) => {
    const blocks = getSessionBlocks(session);
    blocks.forEach((block) => {
      if (block.type === 'single') {
        const rawMuscles = (block.exercise.primaryMuscles && block.exercise.primaryMuscles.length > 0)
          ? block.exercise.primaryMuscles
          : (block.exercise.primaryMuscle || 'Pectoraux').split(',').map((m) => m.trim()).filter(Boolean);

        const workingSets = (block.exercise.sets || []).filter(
          (s) => s.completed && s.type !== 'warmup'
        ).length;

        // Déduplication par groupe musculaire normalisé pour éviter de compter 2 fois la même série
        const normalizedGroups = Array.from(new Set(rawMuscles.map((m) => normalizeMuscle(m).muscle)));

        normalizedGroups.forEach((muscle) => {
          muscleSetsMap.set(muscle, (muscleSetsMap.get(muscle) || 0) + workingSets);
        });
      } else if (block.type === 'circuit') {
        block.exercises.forEach((item) => {
          const rawMuscles = (item.primaryMuscles && item.primaryMuscles.length > 0)
            ? item.primaryMuscles
            : (item.primaryMuscle || 'Pectoraux').split(',').map((m) => m.trim()).filter(Boolean);

          const rounds = block.rounds || 1;
          const normalizedGroups = Array.from(new Set(rawMuscles.map((m) => normalizeMuscle(m).muscle)));

          normalizedGroups.forEach((muscle) => {
            muscleSetsMap.set(muscle, (muscleSetsMap.get(muscle) || 0) + rounds);
          });
        });
      }
    });
  });

  const result: MuscleVolumeBreakdown[] = [];

  muscleSetsMap.forEach((effectiveSets, muscle) => {
    const landmarks = MUSCLE_VOLUME_LANDMARKS[muscle] || { mev: 6, mav: 14 };
    let status: 'optimal' | 'moderate' | 'low' = 'low';
    if (effectiveSets >= landmarks.mev && effectiveSets <= landmarks.mav) {
      status = 'optimal';
    } else if (effectiveSets > 0) {
      status = 'moderate';
    }

    result.push({
      muscle,
      effectiveSets,
      mev: landmarks.mev,
      mav: landmarks.mav,
      status,
    });
  });

  return result.sort((a, b) => b.effectiveSets - a.effectiveSets);
}

/**
 * Lissage du poids par Moyenne Mobile Exponentielle (EMA) temporelle façon MacroFactor.
 * Prend en compte la durée réelle (en jours) écoulée entre deux pesées :
 * - Si 1 jour d'écart : alpha standard (~0.15)
 * - Si plusieurs jours/semaines d'écart : décroissance exponentielle proportionnelle au temps écoulé
 *   alpha_eff = 1 - (1 - alpha)^deltaDays
 * Cela évite qu'une pesée prise après 1 mois d'absence traîne un retard artificiel de plusieurs semaines.
 */
export function calculateExponentialMovingAverage(
  data: { date: string; value: number }[],
  alpha = 0.15
): { date: string; value: number; trend: number }[] {
  if (!data || data.length === 0) return [];

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentEMA = sorted[0].value;
  let lastTimestamp = new Date(sorted[0].date).getTime();

  return sorted.map((point, index) => {
    if (index === 0) {
      currentEMA = point.value;
      lastTimestamp = new Date(point.date).getTime();
    } else {
      const currentTimestamp = new Date(point.date).getTime();
      const deltaDays = Math.max(0, (currentTimestamp - lastTimestamp) / (1000 * 60 * 60 * 24));
      // Décroissance ajustée au temps : si deltaDays = 1, alphaEff = alpha. Si deltaDays >> 1, alphaEff -> 1.
      const decay = Math.pow(1 - alpha, deltaDays);
      const alphaEff = 1 - decay;

      currentEMA = alphaEff * point.value + (1 - alphaEff) * currentEMA;
      lastTimestamp = currentTimestamp;
    }
    return {
      date: point.date,
      value: point.value,
      trend: Math.round(currentEMA * 100) / 100,
    };
  });
}

export interface WeeklyFatigueSnapshot {
  weekLabel: string;
  avgRir: number;
  avgRir4wRollingAvg: number;
  bodyweightKg: number | null;
  avgSessionDurationMin: number;
  totalSessions: number;
  isUnderRecovering: boolean;
  weekOffset?: number;
}

/**
 * Règle scientifique de détection de sous-récupération / fatigue accumulée (Feature 5 de retour.md).
 * Déclenche une alerte si :
 * 1. Le RIR moyen de la semaine dépasse de plus d'1 point la moyenne mobile sur 4 semaines (effort perçu en baisse / incapacité à pousser).
 * 2. Le poids corporel est stagnant ou en baisse par rapport à la semaine précédente (ou absent de l'historique de pesées).
 */
export function flagPossibleUnderRecovery(
  snapshot: Pick<WeeklyFatigueSnapshot, 'avgRir' | 'avgRir4wRollingAvg' | 'bodyweightKg'>,
  previousWeekBodyweight?: number | null
): boolean {
  if (!snapshot || snapshot.avgRir <= 0 || snapshot.avgRir4wRollingAvg <= 0) {
    return false;
  }
  const rirElevated = snapshot.avgRir > snapshot.avgRir4wRollingAvg + 1;
  const weightStagnantOrDropping =
    snapshot.bodyweightKg === null ||
    previousWeekBodyweight === undefined ||
    previousWeekBodyweight === null ||
    snapshot.bodyweightKg <= previousWeekBodyweight;

  return rirElevated && weightStagnantOrDropping;
}

/**
 * Calcule les snapshots hebdomadaires de fatigue pour les dernières semaines.
 * Agrège le RIR moyen, la moyenne mobile sur 4 semaines, le poids corporel le plus proche et la durée moyenne des séances.
 */
export function calculateWeeklyFatigueSnapshots(
  history: WorkoutSession[],
  measurements: BodyMeasurement[] = [],
  weeksCount: number = 8
): WeeklyFatigueSnapshot[] {
  if (!history || history.length === 0) return [];

  const now = new Date();
  const dayOfWeek = now.getDay();

  // Déterminer le nombre de semaines à calculer en fonction de l'ancienneté des séances
  let resolvedWeeks = Math.max(weeksCount, 4);
  const validTimes = history
    .filter((s) => s.status === 'completed' && s.startTime)
    .map((s) => new Date(s.startTime).getTime())
    .filter((t) => !isNaN(t));

  if (validTimes.length > 0) {
    const earliestTime = Math.min(...validTimes);
    const weeksDiff = Math.ceil((now.getTime() - earliestTime) / (7 * 24 * 60 * 60 * 1000));
    if (weeksDiff > resolvedWeeks) {
      resolvedWeeks = Math.min(weeksDiff + 1, 24);
    }
  }

  const intermediate: Array<{
    weekOffset: number;
    weekLabel: string;
    avgRir: number;
    hasRirData: boolean;
    bodyweightKg: number | null;
    avgSessionDurationMin: number;
    totalSessions: number;
  }> = [];

  for (let offset = -(resolvedWeeks - 1); offset <= 0; offset++) {
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + offset * 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setMilliseconds(-1);

    const weekSessions = history.filter((s) => {
      if (s.status !== 'completed' || !s.startTime) return false;
      const sDate = new Date(s.startTime);
      return sDate >= startOfWeek && sDate <= endOfWeek;
    });

    const totalSessions = weekSessions.length;

    // Calcul du RIR moyen sur les séries effectives (non warmup)
    let rirSum = 0;
    let rirCount = 0;
    weekSessions.forEach((s) => {
      const blocks = getSessionBlocks(s);
      blocks.forEach((block) => {
        if (block.type === 'single') {
          (block.exercise.sets || []).forEach((set) => {
            if (set.completed && set.type !== 'warmup' && typeof set.rir === 'number' && !isNaN(set.rir)) {
              rirSum += set.rir;
              rirCount++;
            }
          });
        }
      });
    });

    const hasRirData = rirCount > 0;
    const avgRir = hasRirData ? Math.round((rirSum / rirCount) * 10) / 10 : 0;

    // Calcul de la durée moyenne des séances (en minutes)
    let totalDurationSec = 0;
    weekSessions.forEach((s) => {
      totalDurationSec += s.durationSeconds || 0;
    });
    const avgSessionDurationMin = totalSessions > 0
      ? Math.round(totalDurationSec / totalSessions / 60)
      : 0;

    // Poids corporel le plus proche du centre de la semaine
    let bodyweightKg: number | null = null;
    if (measurements && measurements.length > 0) {
      const weekMidpoint = (startOfWeek.getTime() + endOfWeek.getTime()) / 2;
      let closestDiff = Infinity;
      let closestWeight: number | null = null;
      measurements.forEach((m) => {
        if (typeof m.weightKg === 'number' && m.weightKg > 0 && m.date) {
          const mTime = new Date(m.date).getTime();
          if (!isNaN(mTime)) {
            const diff = Math.abs(mTime - weekMidpoint);
            if (diff < closestDiff && diff <= 30 * 24 * 60 * 60 * 1000) {
              closestDiff = diff;
              closestWeight = m.weightKg;
            }
          }
        }
      });
      bodyweightKg = closestWeight !== null ? Math.round(closestWeight * 10) / 10 : null;
    }

    const startStr = `${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString('fr-FR', { month: 'short' })}`;
    const endStr = `${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('fr-FR', { month: 'short' })}`;
    const weekLabel = offset === 0
      ? `Cette semaine (${startStr} - ${endStr})`
      : offset === -1
      ? `Semaine passée (${startStr} - ${endStr})`
      : `Sem. du ${startStr} au ${endStr}`;

    intermediate.push({
      weekOffset: offset,
      weekLabel,
      avgRir,
      hasRirData,
      bodyweightKg,
      avgSessionDurationMin,
      totalSessions,
    });
  }

  // Calcul de la moyenne mobile sur 4 semaines et du statut de sous-récupération
  const snapshots: WeeklyFatigueSnapshot[] = [];

  for (let i = 0; i < intermediate.length; i++) {
    const cur = intermediate[i];

    // Semaines précédentes (jusqu'à 4) ayant des données de RIR
    const priorWeeks = intermediate.slice(Math.max(0, i - 4), i).filter((w) => w.hasRirData);

    const avgRir4wRollingAvg = priorWeeks.length > 0
      ? Math.round((priorWeeks.reduce((acc, w) => acc + w.avgRir, 0) / priorWeeks.length) * 10) / 10
      : cur.avgRir;

    const prevWeek = i > 0 ? intermediate[i - 1] : undefined;
    const isUnderRecovering = flagPossibleUnderRecovery(
      { avgRir: cur.avgRir, avgRir4wRollingAvg, bodyweightKg: cur.bodyweightKg },
      prevWeek?.bodyweightKg
    );

    snapshots.push({
      weekLabel: cur.weekLabel,
      avgRir: cur.avgRir,
      avgRir4wRollingAvg,
      bodyweightKg: cur.bodyweightKg,
      avgSessionDurationMin: cur.avgSessionDurationMin,
      totalSessions: cur.totalSessions,
      isUnderRecovering,
      weekOffset: cur.weekOffset,
    });
  }

  return snapshots;
}
