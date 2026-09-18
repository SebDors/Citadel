import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTheme } from "../../src/context/ThemeContext";
import { OneRMChartCard } from "../../src/components/Profile/OneRMChartCard";
import { ModularMeasurementChartCard } from "../../src/components/Profile/ModularMeasurementChartCard";
import { BodyMeasurementsCard } from "../../src/components/Profile/BodyMeasurementsCard";
import { ThemeSelectorModal } from "../../src/components/UI/ThemeSelectorModal";
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import { ExportService } from "../../src/services/exportService";
import * as Clipboard from "expo-clipboard";
import { Palette, Edit2, ArrowRight } from "lucide-react-native";

export default function ProfileTab() {
  const {
    data,
    addMeasurement,
    deleteMeasurement,
    updateUserProfile,
    importFullData,
  } = useWorkout();
  const { theme } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [athleteName, setAthleteName] = useState(data?.profile.name || "");
  const [isExporting, setIsExporting] = useState(false);

  if (!data) return null;

  const handleSaveProfile = () => {
    if (athleteName.trim()) {
      updateUserProfile({ name: athleteName.trim() });
    }
    setEditProfileModal(false);
  };

  const handleCopyJson = async () => {
    try {
      const json = ExportService.exportFullDataToJSON(data);
      await Clipboard.setStringAsync(json);
      Alert.alert(
        "PRESSE-PAPIER",
        "Sauvegarde JSON intégrale copiée dans le presse-papier avec succès.",
      );
    } catch {
      Alert.alert("ERREUR", "Impossible de copier les données.");
    }
  };

  const handleShareJson = async () => {
    try {
      setIsExporting(true);
      const json = ExportService.exportFullDataToJSON(data);
      await ExportService.shareFile(
        "citadel_sauvegarde.json",
        json,
        "application/json",
      );
    } catch {
      Alert.alert("ERREUR", "Impossible de partager le fichier de sauvegarde.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setIsExporting(true);
      const importedData = await ExportService.pickAndParseJSONBackup();
      if (!importedData) {
        setIsExporting(false);
        return;
      }
      Alert.alert(
        "RESTAURATION DES DONNÉES",
        "Cette opération remplacera l'intégralité de vos séances, historiques et mensurations actuelles par le fichier importé. Confirmer ?",
        [
          { text: "ANNULER", style: "cancel" },
          {
            text: "RESTAURER",
            style: "destructive",
            onPress: async () => {
              try {
                await importFullData(importedData);
                Alert.alert(
                  "RESTAURATION TERMINÉE",
                  "Vos données ont été restaurées avec succès.",
                );
              } catch {
                Alert.alert(
                  "ERREUR",
                  "Échec lors de l'application de la sauvegarde.",
                );
              }
            },
          },
        ],
      );
    } catch {
      Alert.alert("ERREUR", "Impossible de charger le fichier sélectionné.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWorkoutsCsv = async () => {
    try {
      setIsExporting(true);
      const csv = ExportService.exportWorkoutsToCSV(data);
      const ok = await ExportService.saveOrDownloadFile(
        "citadel_seances.csv",
        csv,
        "text/csv",
      );
      if (ok) {
        Alert.alert(
          "EXPORT CSV",
          'Le fichier "citadel_seances.csv" a été généré avec succès.',
        );
      }
    } catch {
      Alert.alert("ERREUR", "Impossible d'exporter les séances en CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMeasurementsCsv = async () => {
    try {
      setIsExporting(true);
      const csv = ExportService.exportMeasurementsToCSV(data);
      const ok = await ExportService.saveOrDownloadFile(
        "citadel_mensurations.csv",
        csv,
        "text/csv",
      );
      if (ok) {
        Alert.alert(
          "EXPORT CSV",
          'Le fichier "citadel_mensurations.csv" a été généré avec succès.',
        );
      }
    } catch {
      Alert.alert("ERREUR", "Impossible d'exporter les mensurations en CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TabSwipeWrapper tabIndex={2}>
      <SafeAreaView
        edges={["left", "right"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Suédois / Éditorial */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.kicker}>SYSTÈME // EXPORTATION</Text>
                <Text style={[styles.title, { color: theme.text }]}>
                  DONNÉES
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setThemeModalVisible(true)}
                style={[styles.themeTrigger, { borderColor: theme.border }]}
              >
                <Palette size={14} color="#FF2A2A" style={{ marginRight: 6 }} />
                <Text style={[styles.themeTriggerText, { color: theme.text }]}>
                  THÈME
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 1. Dossier Opérateur (Éditorial Minimaliste) */}
          <View
            style={[
              styles.dossierBanner,
              { borderColor: theme.border, backgroundColor: theme.background },
            ]}
          >
            <View style={styles.dossierRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dossierLabel}>ATHLÈTE // IDENTITÉ</Text>
                <Text style={[styles.dossierName, { color: theme.text }]}>
                  {data.profile.name.toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setAthleteName(data.profile.name);
                  setEditProfileModal(true);
                }}
                style={styles.editIdentityBtn}
              >
                <Edit2 size={13} color="#737373" style={{ marginRight: 4 }} />
                <Text style={styles.editIdentityText}>ÉDITER</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.dossierDivider,
                { backgroundColor: theme.border },
              ]}
            />

            <View style={styles.dossierStatsRow}>
              <View style={styles.dossierStatItem}>
                <Text style={styles.dossierStatLabel}>POIDS ACTUEL</Text>
                <Text
                  style={[styles.dossierStatValue, { color: theme.text }]}
                >
                  {data.profile.currentWeightKg && data.profile.currentWeightKg > 0
                    ? `${data.profile.currentWeightKg} KG`
                    : "-- KG"}
                </Text>
              </View>

              <View style={styles.dossierStatItem}>
                <Text style={styles.dossierStatLabel}>SÉANCES ARCHIVÉES</Text>
                <Text
                  style={[styles.dossierStatValue, { color: theme.text }]}
                >
                  {data.history.length}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Gestion des Données & Exportation Typographique */}
          <View style={styles.dataSection}>
            <View
              style={[
                styles.sectionHeaderRow,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={styles.sectionHeaderLabel}>
                GESTION & EXPORTATION SUISSE
              </Text>
              {isExporting && <ActivityIndicator size="small" color="#FF2A2A" />}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCopyJson}
              style={[styles.linkRow, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.linkText, { color: theme.text }]}>
                [ COPIER LE JSON DANS LE PRESSE-PAPIER ]
              </Text>
              <ArrowRight size={14} color="#FF2A2A" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShareJson}
              style={[styles.linkRow, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.linkText, { color: theme.text }]}>
                [ PARTAGER LE FICHIER .JSON ]
              </Text>
              <ArrowRight size={14} color="#FF2A2A" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleImportBackup}
              style={[styles.linkRow, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.linkText, { color: theme.text }]}>
                [ IMPORTER UNE SAUVEGARDE EXTERNE ]
              </Text>
              <ArrowRight size={14} color="#FF2A2A" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleExportWorkoutsCsv}
              style={[styles.linkRow, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.linkText, { color: theme.text }]}>
                [ EXPORTER LES SÉANCES EN .CSV ]
              </Text>
              <ArrowRight size={14} color="#737373" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleExportMeasurementsCsv}
              style={[styles.linkRow, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.linkText, { color: theme.text }]}>
                [ EXPORTER LES MENSURATIONS EN .CSV ]
              </Text>
              <ArrowRight size={14} color="#737373" />
            </TouchableOpacity>
          </View>

          {/* 3. Graphique Modulable de Mensurations */}
          <View style={{ marginTop: 12 }}>
            <ModularMeasurementChartCard measurements={data.measurements} />
          </View>

          {/* 4. Performances 1RM */}
          <OneRMChartCard />

          {/* 5. Suivi du Poids et Mensurations */}
          <BodyMeasurementsCard
            measurements={data.measurements}
            onAddMeasurement={addMeasurement}
            onDeleteMeasurement={deleteMeasurement}
          />
        </ScrollView>

        {/* Modal Édition Profil Athlète */}
        <Modal
          visible={editProfileModal}
          transparent
          animationType="fade"
          onRequestClose={() => setEditProfileModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditProfileModal(false)}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <Text style={styles.modalKicker}>CONFIGURATION // PROFIL</Text>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                MODIFIER IDENTITÉ
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
                value={athleteName}
                onChangeText={setAthleteName}
                placeholder="NOM OU PSEUDO"
                placeholderTextColor="#737373"
                autoFocus
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setEditProfileModal(false)}
                  style={[styles.modalBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>
                    ANNULER
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSaveProfile}
                  style={[
                    styles.modalBtn,
                    {
                      borderColor: "#FF2A2A",
                      backgroundColor: "#FF2A2A",
                      marginLeft: 12,
                    },
                  ]}
                >
                  <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>
                    ENREGISTRER
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modale de sélection de Thème & Mode */}
        <ThemeSelectorModal
          visible={themeModalVisible}
          onClose={() => setThemeModalVisible(false)}
        />
      </SafeAreaView>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  kicker: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "700",
    color: "#737373",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontFamily: "monospace",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  themeTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  themeTriggerText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  dossierBanner: {
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },
  dossierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dossierLabel: {
    fontFamily: "monospace",
    fontSize: 9,
    fontWeight: "800",
    color: "#737373",
    letterSpacing: 1,
    marginBottom: 4,
  },
  dossierName: {
    fontFamily: "monospace",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  editIdentityBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editIdentityText: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "800",
    color: "#737373",
    letterSpacing: 1,
  },
  dossierDivider: {
    height: 1,
    marginVertical: 14,
  },
  dossierStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dossierStatItem: {
    flex: 1,
  },
  dossierStatLabel: {
    fontFamily: "monospace",
    fontSize: 9,
    fontWeight: "800",
    color: "#737373",
    letterSpacing: 1,
    marginBottom: 4,
  },
  dossierStatValue: {
    fontFamily: "monospace",
    fontSize: 16,
    fontWeight: "900",
  },
  dataSection: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  sectionHeaderLabel: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "800",
    color: "#737373",
    letterSpacing: 1.5,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  linkText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    borderWidth: 1,
    padding: 24,
  },
  modalKicker: {
    fontFamily: "monospace",
    fontSize: 9,
    fontWeight: "800",
    color: "#737373",
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: "monospace",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  modalInput: {
    fontFamily: "monospace",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBtnText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
