import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { FitTrackerData } from '../types';

const BACKUP_DIR = `${FileSystem.documentDirectory || ''}backups/`;
const MAX_ROTATION_BACKUPS = 7;

export interface LocalBackupInfo {
  filename: string;
  dateStr: string;
  sizeBytes: number;
}

export const BackupService = {
  /**
   * Assure une sauvegarde locale quotidienne rotative dans documentDirectory/backups/ (AJ-12).
   * Conserve uniquement les 7 derniers jours pour ne pas saturer le stockage.
   */
  async ensureDailyLocalBackup(data: FitTrackerData): Promise<void> {
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;

    try {
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const todayFile = `${BACKUP_DIR}citadel_auto_${todayStr}.json`;
      const fileInfo = await FileSystem.getInfoAsync(todayFile);

      if (!fileInfo.exists) {
        const json = JSON.stringify(data);
        await FileSystem.writeAsStringAsync(todayFile, json, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Rotation : ne garder que les MAX_ROTATION_BACKUPS plus récents
        const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
        const backupFiles = files
          .filter((f) => f.startsWith('citadel_auto_') && f.endsWith('.json'))
          .sort()
          .reverse();

        if (backupFiles.length > MAX_ROTATION_BACKUPS) {
          const toDelete = backupFiles.slice(MAX_ROTATION_BACKUPS);
          for (const f of toDelete) {
            await FileSystem.deleteAsync(`${BACKUP_DIR}${f}`, { idempotent: true });
          }
        }
      }
    } catch (e) {
      console.warn('[BackupService] Erreur auto-backup quotidien:', e);
    }
  },

  /**
   * Liste les sauvegardes locales automatiques disponibles.
   */
  async listLocalBackups(): Promise<LocalBackupInfo[]> {
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) return [];

    try {
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
      if (!dirInfo.exists) return [];

      const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
      const backupFiles = files
        .filter((f) => f.startsWith('citadel_auto_') && f.endsWith('.json'))
        .sort()
        .reverse();

      const infos: LocalBackupInfo[] = [];
      for (const f of backupFiles) {
        const info = await FileSystem.getInfoAsync(`${BACKUP_DIR}${f}`);
        const dateStr = f.replace('citadel_auto_', '').replace('.json', '');
        infos.push({
          filename: f,
          dateStr,
          sizeBytes: (info as any).size || 0,
        });
      }
      return infos;
    } catch {
      return [];
    }
  },

  /**
   * Restaure une sauvegarde automatique locale par nom de fichier.
   */
  async restoreLocalBackup(filename: string): Promise<FitTrackerData> {
    const content = await FileSystem.readAsStringAsync(`${BACKUP_DIR}${filename}`, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const parsed = JSON.parse(content);
    if (!parsed || !parsed.profile) {
      throw new Error('Sauvegarde locale invalide.');
    }
    return parsed as FitTrackerData;
  },

  /**
   * Synchronise / envoie la sauvegarde vers le Cloud (Google Drive / iCloud Drive via feuille de partage native).
   */
  async syncToCloudDrive(data: FitTrackerData): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `citadel_cloud_backup_${todayStr}.json`;
    const json = JSON.stringify(data, null, 2);

    if (Platform.OS === 'web') {
      throw new Error('Utilisez l’export JSON classique sur navigateur Web.');
    }

    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await isAvailableAsync()) {
      await shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Synchroniser vers Google Drive / iCloud',
        UTI: 'public.json',
      });
    } else {
      throw new Error('Partage Cloud indisponible sur cet appareil.');
    }
  },
};
