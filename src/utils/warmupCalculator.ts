export interface WarmupSetSuggestion {
  weightKg: number;
  reps: number;
  label: string;
  percentage: number;
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/**
 * Génère une rampe progressive de séries d'échauffement sans fatigue excessive
 * à partir de la charge de travail cible (en kg).
 */
export function generateWarmupSets(
  workingWeightKg: number,
  barWeightKg: number = 20
): WarmupSetSuggestion[] {
  if (!Number.isFinite(workingWeightKg) || workingWeightKg <= 0) {
    return [];
  }

  const step = workingWeightKg >= 25 ? 2.5 : workingWeightKg >= 10 ? 1 : 0.5;
  const round = (val: number) => {
    const rounded = roundToStep(val, step);
    return Math.round(rounded * 100) / 100;
  };

  let rawSuggestions: WarmupSetSuggestion[] = [];

  if (workingWeightKg <= barWeightKg) {
    rawSuggestions = [
      {
        weightKg: round(workingWeightKg * 0.5),
        reps: 10,
        label: 'Léger 50%',
        percentage: 50,
      },
      {
        weightKg: round(workingWeightKg * 0.75),
        reps: 5,
        label: 'Montée 75%',
        percentage: 75,
      },
    ];
  } else if (workingWeightKg <= 45) {
    rawSuggestions = [
      {
        weightKg: Math.min(barWeightKg, round(workingWeightKg * 0.45)),
        reps: 10,
        label: 'Barre / Léger',
        percentage: 45,
      },
      {
        weightKg: round(workingWeightKg * 0.65),
        reps: 5,
        label: '65%',
        percentage: 65,
      },
      {
        weightKg: round(workingWeightKg * 0.85),
        reps: 2,
        label: '85%',
        percentage: 85,
      },
    ];
  } else {
    const firstWeight = Math.min(barWeightKg, round(workingWeightKg * 0.4));
    rawSuggestions = [
      {
        weightKg: firstWeight > 0 ? firstWeight : barWeightKg,
        reps: 10,
        label: 'Barre / Léger',
        percentage: 40,
      },
      {
        weightKg: round(workingWeightKg * 0.5),
        reps: 5,
        label: '50%',
        percentage: 50,
      },
      {
        weightKg: round(workingWeightKg * 0.7),
        reps: 3,
        label: '70%',
        percentage: 70,
      },
      {
        weightKg: round(workingWeightKg * 0.85),
        reps: 1,
        label: '85%',
        percentage: 85,
      },
    ];
  }

  // Filtrer les séries invalides ou >= charge cible et dédupliquer les poids identiques
  const deduped: WarmupSetSuggestion[] = [];
  for (const item of rawSuggestions) {
    if (item.weightKg <= 0 || item.weightKg >= workingWeightKg) continue;
    const prev = deduped[deduped.length - 1];
    if (prev && prev.weightKg === item.weightKg) continue;
    deduped.push(item);
  }

  return deduped;
}
