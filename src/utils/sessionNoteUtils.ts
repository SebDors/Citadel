import { WorkoutSession, WorkoutExercise, SessionNote, SessionExceptionReason, EXCEPTION_REASONS_CONFIG } from '../types';

/**
 * Vérifie si un exercice contient au moins une observation de douleur de sévérité >= 2 (À surveiller ou Important)
 */
export function hasExercisePainAlert(exercise?: WorkoutExercise | null): boolean {
  if (!exercise || !exercise.sessionNotes || exercise.sessionNotes.length === 0) return false;
  return exercise.sessionNotes.some(
    (n) => n.type === 'douleur' && (n.severity !== undefined ? n.severity >= 2 : true)
  );
}

/**
 * Retourne le niveau maximal de sévérité de douleur rencontré sur un exercice (1, 2, 3 ou null)
 */
export function getExercisePainSeverity(exercise?: WorkoutExercise | null): (1 | 2 | 3) | null {
  if (!exercise || !exercise.sessionNotes || exercise.sessionNotes.length === 0) return null;
  const painNotes = exercise.sessionNotes.filter((n) => n.type === 'douleur');
  if (painNotes.length === 0) return null;

  let maxSev: 1 | 2 | 3 = 1;
  painNotes.forEach((n) => {
    const s = n.severity ?? 1;
    if (s > maxSev) maxSev = s as 1 | 2 | 3;
  });
  return maxSev;
}

/**
 * Vérifie si une séance contient au moins une alerte de douleur de sévérité >= 2
 * (sur la séance elle-même ou sur l'un de ses exercices)
 */
export function hasSessionPainAlert(session?: WorkoutSession | null): boolean {
  if (!session) return false;

  // 1. Notes au niveau de la séance
  if (session.sessionNotes && session.sessionNotes.some((n) => n.type === 'douleur' && (n.severity !== undefined ? n.severity >= 2 : true))) {
    return true;
  }

  // 2. Notes au niveau des blocs d'exercices
  const blocks = session.blocks || [];
  for (const block of blocks) {
    if (block.type === 'single' && hasExercisePainAlert(block.exercise)) {
      return true;
    }
  }

  // 3. Notes au niveau de session.exercises
  const exercises = session.exercises || [];
  for (const ex of exercises) {
    if (hasExercisePainAlert(ex)) {
      return true;
    }
  }

  return false;
}

/**
 * Retourne le libellé court ou complet de la raison d'exception
 */
export function formatExceptionReason(reason?: SessionExceptionReason, short = false): string {
  if (!reason) return 'Séance exceptionnelle';
  const cfg = EXCEPTION_REASONS_CONFIG[reason];
  if (!cfg) return reason;
  return short ? cfg.shortLabel : cfg.label;
}
