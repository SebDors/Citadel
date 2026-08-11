import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { FitTrackerData } from '../types';

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
