import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { FitTrackerData, WorkoutTemplate, WorkoutSession } from '../types';

export const JsonExportService = {
  /**
   * Copie les données complètes au format JSON indenté dans le Presse-papier.
   */
  async copyJsonToClipboard(data: FitTrackerData): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await Clipboard.setStringAsync(jsonString);
      return true;
    } catch (e) {
      console.error('Erreur lors de la copie dans le presse-papier:', e);
      return false;
    }
  },

  /**
   * Génère un fichier local .json et ouvre la fenêtre de partage native (expo-sharing).
   */
  async shareJsonFile(data: FitTrackerData): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error("Le partage de fichiers n'est pas disponible sur cet appareil.");
      }

      const jsonString = JSON.stringify(data, null, 2);
      const filename = `warriorfit_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exporter mes données de musculation WarriorFit',
        UTI: 'public.json',
      });

      return true;
    } catch (e) {
      console.error('Erreur lors du partage du fichier JSON:', e);
      return false;
    }
  },

  /**
   * Exporte une séance vierge (WorkoutTemplate) sous forme de chaîne JSON partageable.
   */
  exportBlankTemplateJson(template: WorkoutTemplate): string {
    const exportObject = {
      type: 'warriorfit_blank_template',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      template: {
        id: template.id,
        title: template.title,
        description: template.description || '',
        targetMuscles: template.targetMuscles || [],
        isCircuit: template.isCircuit || false,
        circuitRounds: template.circuitRounds,
        restBetweenRoundsSeconds: template.restBetweenRoundsSeconds,
        exercises: template.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          primaryMuscle: ex.primaryMuscle,
          targetMuscles: ex.targetMuscles,
          restSeconds: ex.restSeconds,
          supersetGroup: ex.supersetGroup,
          setsCount: ex.sets.length,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            type: s.type,
            rir: s.rir,
            durationSeconds: s.durationSeconds,
          })),
        })),
      },
    };
    return JSON.stringify(exportObject, null, 2);
  },

  /**
   * Exporte l'historique complet d'entraînements dans un format structuré optimisé pour les IA.
   */
  exportFullHistoryJson(history: WorkoutSession[]): string {
    const completedHistory = history.filter((s) => s.status === 'completed');
    const exportObject = {
      type: 'warriorfit_ai_history_export',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalCompletedSessions: completedHistory.length,
      history: completedHistory.map((session) => ({
        id: session.id,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: Math.round((session.durationSeconds || 0) / 60),
        totalVolumeKg: session.totalVolumeKg,
        completedSetsCount: session.completedSetsCount,
        isCircuit: session.isCircuit || false,
        exercises: session.exercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          primaryMuscle: ex.primaryMuscle,
          targetMuscles: ex.targetMuscles,
          sets: ex.sets
            .filter((s) => s.completed)
            .map((s) => ({
              setNumber: s.setNumber,
              type: s.type,
              weightKg: s.weightKg ?? 0,
              reps: s.reps ?? 0,
              rir: s.rir,
              estimated1RMEpleyKg:
                s.weightKg && s.reps
                  ? Math.round(s.weightKg * (1 + s.reps / 30))
                  : 0,
              completedAt: s.completedAt,
            })),
        })),
      })),
    };
    return JSON.stringify(exportObject, null, 2);
  },

  /**
   * Génère le JSON d'une séance vierge et ouvre le panneau de partage natif.
   */
  async shareBlankTemplateJson(template: WorkoutTemplate): Promise<boolean> {
    try {
      const jsonString = this.exportBlankTemplateJson(template);
      const safeTitle = template.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `warriorfit_template_${safeTitle}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Partager la séance : ${template.title}`,
        UTI: 'public.json',
      });
      return true;
    } catch (e) {
      console.error('Erreur lors du partage de la séance vierge:', e);
      return false;
    }
  },

  /**
   * Génère le JSON d'historique IA et ouvre le panneau de partage natif.
   */
  async shareFullHistoryJson(history: WorkoutSession[]): Promise<boolean> {
    try {
      const jsonString = this.exportFullHistoryJson(history);
      const filename = `warriorfit_history_ai_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Partager l\'historique complet pour IA',
        UTI: 'public.json',
      });
      return true;
    } catch (e) {
      console.error('Erreur lors du partage de l\'historique IA:', e);
      return false;
    }
  },

  /**
   * Importe des données depuis une chaîne de caractères JSON (coller depuis presse-papier).
   */
  parseJsonImport(jsonString: string): FitTrackerData | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.profile && Array.isArray(parsed.templates) && Array.isArray(parsed.history)) {
        return parsed as FitTrackerData;
      }
      return null;
    } catch (e) {
      console.error('Format JSON invalide:', e);
      return null;
    }
  },
};

