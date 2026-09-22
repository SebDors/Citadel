import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { FitTrackerData, WorkoutSession, BodyMeasurement, WorkoutTemplate, getSessionBlocks } from '../types';

function calculateEpley1RM(weight?: number, reps?: number): string {
  if (weight && reps && reps > 0) {
    return (weight * (1 + reps / 30)).toFixed(2);
  }
  return '';
}

export const ExportService = {
  exportWorkoutsToCSV(data: FitTrackerData): string {
    let csv = '\uFEFFDate;Heure;Séance;Exercice;N° Série;Type;Poids (kg);Répétitions;RIR;1RM Estimé (kg);Temps Repos (s);Statut\n';

    data.history.forEach((session: WorkoutSession) => {
      const dateObj = new Date(session.startTime);
      const date = dateObj.toLocaleDateString('fr-FR');
      const heure = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const seanceTitle = session.title.replace(/;/g, ',');

      const blocks = getSessionBlocks(session);
      blocks.forEach((block) => {
        if (block.type === 'single') {
          const ex = block.exercise;
          const exName = ex.exerciseName.replace(/;/g, ',');
          ex.sets.forEach((set) => {
            const row = [
              date,
              heure,
              seanceTitle,
              exName,
              set.setNumber,
              set.type,
              set.weightKg || '',
              set.reps || '',
              set.rir || '',
              calculateEpley1RM(set.weightKg, set.reps),
              ex.restSeconds || '',
              set.completed ? 'Terminée' : 'Ignorée',
            ];
            csv += row.join(';') + '\n';
          });
        }
      });
    });

    return csv;
  },

  exportMeasurementsToCSV(data: FitTrackerData): string {
    let csv = '\uFEFFDate;Heure;Poids (kg);Poitrine (cm);Bras (cm);Taille (cm);Hanches (cm);Cuisses (cm);Mollets (cm);Notes\n';

    data.measurements.forEach((m: BodyMeasurement) => {
      let date = m.date;
      let heure = '';
      if (m.date.includes('T')) {
        const d = new Date(m.date);
        date = d.toLocaleDateString('fr-FR');
        heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      } else {
         const parts = m.date.split('-');
         if (parts.length === 3) {
            date = `${parts[2]}/${parts[1]}/${parts[0]}`;
         }
      }

      const row = [
        date,
        heure,
        m.weightKg || '',
        m.chestCm || '',
        m.bicepsCm || '',
        m.waistCm || '',
        '', // Hanches (not in BodyMeasurement currently but in columns)
        m.thighCm || '',
        '', // Mollets
        '', // Notes
      ];
      csv += row.join(';') + '\n';
    });

    return csv;
  },

  exportFullDataToJSON(data: FitTrackerData): string {
    return JSON.stringify(data, null, 2);
  },


  async shareFile(filename: string, content: string, mimeType: string): Promise<void> {
    const fileUri = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
    await shareAsync(fileUri, { mimeType, dialogTitle: filename, UTI: mimeType });
  },

  async saveOrDownloadFile(filename: string, content: string, mimeType: string): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          return false;
        }
        const fileNameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileNameWithoutExt,
          mimeType
        );
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return true;
      } catch (err) {
        console.warn('StorageAccessFramework error, fallback to shareFile:', err);
        await this.shareFile(filename, content, mimeType);
        return true;
      }
    } else {
      await this.shareFile(filename, content, mimeType);
      return true;
    }
  },

  async pickAndParseJSONBackup(): Promise<FitTrackerData | null> {
    const result = await getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const file = result.assets[0];
    const content = await FileSystem.readAsStringAsync(file.uri);
    const parsed = JSON.parse(content);

    if (parsed && typeof parsed === 'object' && parsed.profile && (parsed.templates || parsed.history)) {
      return parsed as FitTrackerData;
    }

    throw new Error('Fichier de sauvegarde invalide.');
  },

  exportTemplateToJSON(template: WorkoutTemplate): string {
    const payload = {
      citadel_version: 1,
      type: 'citadel_workout_template',
      exportedAt: new Date().toISOString(),
      template: {
        title: template.title,
        description: template.description || '',
        targetMuscles: template.targetMuscles || [],
        exercises: template.exercises || [],
        blocks: template.blocks || [],
        isCircuit: template.isCircuit || false,
        circuitRounds: template.circuitRounds,
        restBetweenRoundsSeconds: template.restBetweenRoundsSeconds,
        defaultRestSeconds: template.defaultRestSeconds,
      },
    };
    return JSON.stringify(payload, null, 2);
  },

  async shareTemplate(template: WorkoutTemplate): Promise<void> {
    const json = this.exportTemplateToJSON(template);
    const safeTitle = (template.title || 'seance')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    const filename = `citadel_seance_${safeTitle || 'partage'}.json`;
    await this.shareFile(filename, json, 'application/json');
  },

  async pickAndParseTemplateJSON(): Promise<WorkoutTemplate | null> {
    const result = await getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    const content = await FileSystem.readAsStringAsync(file.uri);
    const parsed = JSON.parse(content);

    if (parsed && typeof parsed === 'object') {
      if (parsed.type === 'citadel_workout_template' && parsed.template && parsed.template.title) {
        return parsed.template as WorkoutTemplate;
      }
      if (parsed.title && (parsed.blocks || parsed.exercises)) {
        return parsed as WorkoutTemplate;
      }
    }

    throw new Error('Fichier de séance invalide.');
  },
};
