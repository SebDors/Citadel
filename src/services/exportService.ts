import { calculateE1RM } from './analyticsService';
import { EXERCISE_DATABASE, getBodyweightFactor } from '../constants/exerciseDatabase';
import { SingleExerciseBlock, WorkoutSet } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import { FitTrackerData, WorkoutSession, BodyMeasurement, WorkoutTemplate, getSessionBlocks } from '../types';



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
              (() => {
                const bwFactor = set.isBodyweight ? getBodyweightFactor(ex.exerciseId, ex.exerciseName) : 0;
                const effW = Math.max(0, (set.isBodyweight ? (set.bodyweightUsedKg || 0) * bwFactor : 0) + (set.weightKg || 0));
                return effW > 0 && set.reps ? (calculateE1RM(effW, set.reps, 'epley', set.rir) ?? '') : '';
              })(),
              ex.restSeconds || '',
              set.completed ? 'Terminée' : 'Ignorée',
            ];
            csv += row.join(';') + '\n';
          });
        } else if (block.type === 'circuit') {
          const circuitTitle = (block.title || 'Circuit').replace(/;/g, ',');
          const rounds = block.rounds || 1;
          const cState = session.circuitStates?.[block.id];
          const completedRounds = cState?.completedRoundsCount ?? rounds;

          block.exercises.forEach((item) => {
            const exName = item.exerciseName.replace(/;/g, ',');
            for (let round = 1; round <= rounds; round++) {
              const isCompleted = round <= completedRounds;
              const reps = item.targetType === 'reps' ? item.targetValue : '';
              const row = [
                date,
                heure,
                seanceTitle,
                `[${circuitTitle}] ${exName}`,
                round,
                item.setType || 'normal',
                '',
                reps,
                '',
                '',
                block.restBetweenRoundsSeconds || '',
                isCompleted ? 'Terminée' : 'Ignorée',
              ];
              csv += row.join(';') + '\n';
            }
          });
        }
      });
    });

    return csv;
  },

  exportMeasurementsToCSV(data: FitTrackerData): string {
    let csv = '\uFEFFDate;Heure;Poids (kg);Masse Grasse (%);Poitrine (cm);Bras (cm);Taille (cm);Cuisses (cm)\n';

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
        m.weightKg ?? '',
        m.bodyFatPercentage ?? '',
        m.chestCm ?? '',
        m.bicepsCm ?? '',
        m.waistCm ?? '',
        m.thighCm ?? '',
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

  /**
   * Parseur universel d'import CSV (Strong, Hevy, Citadel, JeFit) (AJ-11).
   */
  parseWorkoutsFromCSV(csvContent: string): {
    sessions: WorkoutSession[];
    importedCount: number;
    setsCount: number;
    sourceApp: 'Strong' | 'Hevy' | 'Citadel' | 'Générique';
  } {
    const cleanContent = csvContent.replace(/^\uFEFF/, '').trim();
    const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('Fichier CSV vide ou sans données.');
    }

    const headerLine = lines[0];
    const separator = headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';

    const splitCSVRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === separator && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitCSVRow(headerLine).map((h) => h.toLowerCase());
    let sourceApp: 'Strong' | 'Hevy' | 'Citadel' | 'Générique' = 'Générique';

    const colDate = headers.findIndex((h) => h.includes('date') || h.includes('start_time'));
    const colTitle = headers.findIndex((h) => h.includes('workout') || h === 'title' || h.includes('séance') || h.includes('seance'));
    const colExercise = headers.findIndex((h) => h.includes('exercise') || h.includes('exercice'));
    const colWeight = headers.findIndex((h) => h.includes('weight') || h.includes('poids'));
    const colReps = headers.findIndex((h) => h === 'reps' || h.includes('répétitions') || h.includes('repetitions'));
    const colRirOrRpe = headers.findIndex((h) => h === 'rir' || h === 'rpe');

    if (headers.includes('exercise_title') || headers.includes('start_time')) {
      sourceApp = 'Hevy';
    } else if (headers.includes('workout name') || headers.includes('exercise name')) {
      sourceApp = 'Strong';
    } else if (headers.includes('séance') || headers.includes('n° série')) {
      sourceApp = 'Citadel';
    }

    if (colExercise === -1) {
      throw new Error('Colonne d\'exercice introuvable dans le fichier CSV.');
    }

    const sessionsMap = new Map<string, {
      title: string;
      startTime: string;
      exercisesMap: Map<string, WorkoutSet[]>;
    }>();

    let setsCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVRow(lines[i]);
      if (cols.length < 2) continue;

      const rawDate = colDate >= 0 ? cols[colDate] : new Date().toISOString();
      const rawTitle = colTitle >= 0 && cols[colTitle] ? cols[colTitle] : 'Séance Importée';
      const rawExercise = cols[colExercise];
      if (!rawExercise) continue;

      let isoDate = new Date().toISOString();
      if (rawDate) {
        if (rawDate.includes('/')) {
          const [d, m, y] = rawDate.split('/');
          const parsed = new Date(`${y}-${m}-${d}T12:00:00Z`);
          if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString();
        } else {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString();
        }
      }

      const dayKey = `${isoDate.slice(0, 10)}::${rawTitle}`;
      if (!sessionsMap.has(dayKey)) {
        sessionsMap.set(dayKey, {
          title: rawTitle,
          startTime: isoDate,
          exercisesMap: new Map(),
        });
      }

      const sessEntry = sessionsMap.get(dayKey)!;
      if (!sessEntry.exercisesMap.has(rawExercise)) {
        sessEntry.exercisesMap.set(rawExercise, []);
      }

      const setsArr = sessEntry.exercisesMap.get(rawExercise)!;
      const weightVal = colWeight >= 0 ? parseFloat((cols[colWeight] || '').replace(',', '.')) : undefined;
      const repsVal = colReps >= 0 ? parseInt(cols[colReps] || '', 10) : undefined;
      const rpeOrRir = colRirOrRpe >= 0 ? parseFloat((cols[colRirOrRpe] || '').replace(',', '.')) : undefined;

      let rirVal: number | undefined = undefined;
      if (rpeOrRir !== undefined && !isNaN(rpeOrRir)) {
        if (headers[colRirOrRpe] === 'rpe') {
          rirVal = Math.max(0, Math.round(10 - rpeOrRir));
        } else {
          rirVal = Math.max(0, Math.round(rpeOrRir));
        }
      }

      setsArr.push({
        id: `csv_s_${Date.now()}_${i}_${setsArr.length}`,
        setNumber: setsArr.length + 1,
        type: 'normal',
        weightKg: weightVal && !isNaN(weightVal) ? weightVal : undefined,
        reps: repsVal && !isNaN(repsVal) ? repsVal : undefined,
        rir: rirVal,
        completed: true,
      });
      setsCount++;
    }

    const sessions: WorkoutSession[] = [];
    let sIdx = 0;
    sessionsMap.forEach((entry) => {
      sIdx++;
      const blocks: SingleExerciseBlock[] = [];
      let totalVol = 0;
      let totalSets = 0;
      let eIdx = 0;

      entry.exercisesMap.forEach((sets, exName) => {
        eIdx++;
        const cleanName = exName.toLowerCase().trim();
        const catalogEx = EXERCISE_DATABASE.find(
          (e) => e.name.toLowerCase().trim() === cleanName || e.id.toLowerCase() === cleanName
        );

        sets.forEach((s) => {
          totalSets++;
          if (s.weightKg && s.reps) totalVol += s.weightKg * s.reps;
        });

        blocks.push({
          id: `csv_blk_${Date.now()}_${sIdx}_${eIdx}`,
          type: 'single',
          exercise: {
            id: `csv_ex_${Date.now()}_${sIdx}_${eIdx}`,
            exerciseId: catalogEx?.id || `csv_${cleanName.replace(/[^a-z0-9]/g, '_')}`,
            exerciseName: catalogEx?.name || exName,
            primaryMuscle: catalogEx?.primaryMuscle || 'Pectoraux',
            primaryMuscles: catalogEx?.primaryMuscles || [catalogEx?.primaryMuscle || 'Pectoraux'],
            targetMuscles: catalogEx?.targetMuscles || [],
            muscleTargets: catalogEx?.muscleTargets,
            restSeconds: catalogEx?.defaultRestSeconds || 75,
            isBodyweight: catalogEx?.isBodyweight,
            sets,
          },
        });
      });

      sessions.push({
        id: `csv_sess_${Date.now()}_${sIdx}`,
        title: entry.title,
        startTime: entry.startTime,
        endTime: entry.startTime,
        durationSeconds: 3600,
        status: 'completed',
        totalVolumeKg: Math.round(totalVol),
        completedSetsCount: totalSets,
        totalSetsCount: totalSets,
        blocks,
      });
    });

    return {
      sessions,
      importedCount: sessions.length,
      setsCount,
      sourceApp,
    };
  },

  async pickAndParseWorkoutsCSV(): Promise<{
    sessions: WorkoutSession[];
    importedCount: number;
    setsCount: number;
    sourceApp: 'Strong' | 'Hevy' | 'Citadel' | 'Générique';
  } | null> {
    const result = await getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    const content = await FileSystem.readAsStringAsync(file.uri);
    return this.parseWorkoutsFromCSV(content);
  },
};
