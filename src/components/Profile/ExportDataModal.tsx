import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  FileSpreadsheet,
  Scale,
  FileJson,
  Upload,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { ExportService } from '../../services/exportService';

interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { data, importFullData } = useWorkout();
  const [loading, setLoading] = useState(false);

  const handleExportWorkouts = async () => {
    if (!data) return;
    try {
      setLoading(true);
      const csv = ExportService.exportWorkoutsToCSV(data);
      await ExportService.shareFile('citadel_seances.csv', csv, 'text/csv');
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'exporter les séances.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportMeasurements = async () => {
    if (!data) return;
    try {
      setLoading(true);
      const csv = ExportService.exportMeasurementsToCSV(data);
      await ExportService.shareFile('citadel_mensurations.csv', csv, 'text/csv');
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'exporter les mensurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportFullData = async () => {
    if (!data) return;
    try {
      setLoading(true);
      const json = ExportService.exportFullDataToJSON(data);
      await ExportService.shareFile('citadel_backup.json', json, 'application/json');
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'exporter la sauvegarde complète.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setLoading(true);
      const newData = await ExportService.pickAndParseJSONBackup();
      if (newData) {
        Alert.alert(
          'Confirmer la restauration',
          'Toutes vos données actuelles seront remplacées par cette sauvegarde. Voulez-vous continuer ?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Restaurer',
              style: 'destructive',
              onPress: async () => {
                try {
                  setLoading(true);
                  await importFullData(newData);
                  Alert.alert('Restauration réussie', 'Vos données ont été restaurées avec succès !');
                  onClose();
                } catch (err) {
                  Alert.alert('Erreur', 'Échec lors de la restauration des données.');
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Fichier de sauvegarde invalide ou lecture impossible.');
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      id: 'export-workouts',
      title: 'Exporter les Séances (CSV)',
      description: 'Format tableur pour vos séances',
      icon: FileSpreadsheet,
      onPress: handleExportWorkouts,
      color: theme.primary,
    },
    {
      id: 'export-measurements',
      title: 'Exporter les Mensurations (CSV)',
      description: 'Format tableur pour vos mensurations',
      icon: Scale,
      onPress: handleExportMeasurements,
      color: theme.secondary,
    },
    {
      id: 'export-full',
      title: 'Sauvegarde Intégrale (JSON)',
      description: 'Copie complète de vos données Citadel',
      icon: FileJson,
      onPress: handleExportFullData,
      color: theme.success || '#4caf50',
    },
    {
      id: 'import-backup',
      title: 'Restaurer / Importer (.json)',
      description: 'Restaurer depuis une sauvegarde JSON Citadel',
      icon: Upload,
      onPress: handleImportBackup,
      color: theme.danger,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        >
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Sauvegarde & Exportation
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={loading}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} bounces={false}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={action.onPress}
                disabled={loading}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
                  <action.icon size={18} color={action.color} />
                </View>
                <View style={styles.actionTexts}>
                  <Text style={[styles.actionTitle, { color: theme.text }]}>
                    {action.title}
                  </Text>
                  <Text style={[styles.actionDescription, { color: theme.textMuted }]}>
                    {action.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 420,
  },
  contentContainer: {
    padding: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
