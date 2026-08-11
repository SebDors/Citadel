import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { FitTrackerData } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { JsonExportService } from '../../services/jsonExport';
import { FileJson, Share2, ClipboardCopy, Download, Moon, Sun } from 'lucide-react-native';

interface JsonActionsCardProps {
  data: FitTrackerData;
  onImportSuccess: (importedData: FitTrackerData) => void;
}

export const JsonActionsCard: React.FC<JsonActionsCardProps> = ({ data, onImportSuccess }) => {
  const { theme, mode, toggleTheme } = useTheme();
  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const handleCopyToClipboard = async () => {
    const success = await JsonExportService.copyJsonToClipboard(data);
    if (success) {
      Alert.alert('Succès', 'Les données JSON ont été copiées dans votre Presse-papier !');
    } else {
      Alert.alert('Erreur', 'Impossible de copier les données dans le presse-papier.');
    }
  };

  const handleShareFile = async () => {
    const success = await JsonExportService.shareJsonFile(data);
    if (!success) {
      Alert.alert('Erreur', 'Le partage du fichier JSON a échoué.');
    }
  };

  const handleConfirmImport = () => {
    const parsed = JsonExportService.parseJsonImport(jsonInput);
    if (parsed) {
      onImportSuccess(parsed);
      setShowImportModal(false);
      setJsonInput('');
      Alert.alert('Succès', 'Importation des données JSON réussie !');
    } else {
      Alert.alert('Erreur', 'Format JSON invalide. Assurez-vous d\'avoir collé un export validé.');
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <FileJson size={18} color={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>Gestion des Données & Réglages</Text>
      </View>

      {/* Theme Switcher Button */}
      <Button
        title={`Basculer en Thème ${mode === 'dark' ? 'Clair (Light)' : 'Sombre (Dark)'}`}
        variant="outline"
        onPress={toggleTheme}
        icon={mode === 'dark' ? <Sun size={16} color={theme.accent} /> : <Moon size={16} color={theme.accent} />}
        style={{ marginBottom: 8 }}
      />

      {/* Exporter en JSON (Presse-papier) */}
      <Button
        title="Exporter en JSON (Presse-papier)"
        variant="secondary"
        onPress={handleCopyToClipboard}
        icon={<ClipboardCopy size={16} color="#FFFFFF" />}
        style={{ marginBottom: 6 }}
      />

      {/* Partager le fichier JSON */}
      <Button
        title="Partager le fichier JSON"
        variant="primary"
        onPress={handleShareFile}
        icon={<Share2 size={16} color="#FFFFFF" />}
        style={{ marginBottom: 6 }}
      />

      {/* Importer un JSON */}
      <Button
        title="Importer un JSON"
        variant="outline"
        onPress={() => setShowImportModal(true)}
        icon={<Download size={16} color={theme.text} />}
      />

      {/* Modal Import JSON */}
      <Modal visible={showImportModal} transparent animationType="slide" onRequestClose={() => setShowImportModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowImportModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Importer un fichier / texte JSON</Text>
            <Text style={[styles.modalSub, { color: theme.textMuted }]}>
              Collez ci-dessous le contenu brut de votre sauvegarde JSON.
            </Text>

            <TextInput
              style={[styles.jsonInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              multiline
              numberOfLines={8}
              placeholder="Coller ici..."
              placeholderTextColor={theme.textMuted}
              value={jsonInput}
              onChangeText={setJsonInput}
            />

            <View style={styles.modalButtons}>
              <Button title="Annuler" variant="outline" onPress={() => setShowImportModal(false)} style={{ flex: 1, marginRight: 6 }} />
              <Button title="Valider l'import" variant="primary" onPress={handleConfirmImport} style={{ flex: 1, marginLeft: 6 }} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 10,
  },
  jsonInput: {
    height: 140,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
  },
});
