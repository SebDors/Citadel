import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { FitTrackerData, WorkoutSession, BodyMeasurement, getSessionBlocks } from '../types';

function calculateEpley1RM(weight?: number, reps?: number): string {
  if (weight && reps && reps > 0) {
    return (weight * (1 + reps / 30)).toFixed(1);
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
  }
};
