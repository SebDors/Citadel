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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTheme } from "../../src/context/ThemeContext";
import { OneRMChartCard } from "../../src/components/Profile/OneRMChartCard";
import { ModularMeasurementChartCard } from "../../src/components/Profile/ModularMeasurementChartCard";
import { BodyMeasurementsCard } from "../../src/components/Profile/BodyMeasurementsCard";
import { ThemeSelectorModal } from "../../src/components/UI/ThemeSelectorModal";
import { ExportDataModal } from "../../src/components/Profile/ExportDataModal";
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import { FINTECH_COLORS } from "../../src/constants/fintechTheme";
import { formatWeight } from "../../src/utils/numberUtils";
import {
  User,
  Palette,
  Download,
  Sparkles,
  Trash2,
  ChevronRight,
  Scale,
  Flame,
  Edit2,
  ShieldCheck,
} from "lucide-react-native";

export default function ProfileTab() {
  const {
    data,
    addMeasurement,
    deleteMeasurement,
    updateUserProfile,
    resetAllData,
    resetOnboarding,
  } = useWorkout();
  const { theme } = useTheme();

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState(data?.profile?.name || "Athlète");

  if (!data) return null;

  const handleSaveProfile = () => {
    updateUserProfile({ name: nameInput.trim() || "Athlète" });
    setEditProfileModalVisible(false);
  };

  const handleResetData = () => {
    Alert.alert(
      "Réinitialiser Citadel",
      "Êtes-vous absolument sûr ? Toutes vos séances, mensurations, historiques et modèles personnalisés seront définitivement effacés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: async () => {
            await resetAllData();
          },
        },
      ]
    );
  };

  return (
    <TabSwipeWrapper tabIndex={2}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: FINTECH_COLORS.black }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Compact FinTech */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerCategory}>COMPTE & PARAMÈTRES</Text>
              <Text style={styles.headerTitle}>Profil</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setThemeModalVisible(true)}
              style={styles.themeBtn}
            >
              <Palette size={15} color={FINTECH_COLORS.textPrimary} style={{ marginRight: 5 }} />
              <Text style={styles.themeBtnText}>Thème</Text>
            </TouchableOpacity>
          </View>

          {/* Carte Compte Athlète (Trade Republic Style) */}
          <View style={styles.accountCard}>
            <View style={styles.accountTopRow}>
              <View style={styles.avatarCircle}>
                <User size={24} color="#FFFFFF" />
              </View>

              <View style={styles.accountDetails}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {data.profile.name || "Athlète"}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setNameInput(data.profile.name || "Athlète");
                      setEditProfileModalVisible(true);
                    }}
                    style={{ marginLeft: 6, padding: 4 }}
                  >
                    <Edit2 size={13} color={FINTECH_COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.accountBadgeRow}>
                  <ShieldCheck size={12} color={FINTECH_COLORS.green} style={{ marginRight: 4 }} />
                  <Text style={styles.accountBadgeText}>Compte Athlète Actif</Text>
                </View>
              </View>
            </View>

            {/* Micro métriques de compte */}
            <View style={styles.accountMetricsGrid}>
              <View style={styles.accountMetricBox}>
                <View style={styles.metricIconRow}>
                  <Scale size={13} color={FINTECH_COLORS.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.metricLabel}>POIDS ACTUEL</Text>
                </View>
                <Text style={styles.metricValue}>
                  {data.profile.currentWeightKg && data.profile.currentWeightKg > 0
                    ? `${formatWeight(data.profile.currentWeightKg)}`
                    : "--"}
                  <Text style={styles.metricUnit}> KG</Text>
                </Text>
              </View>

              <View style={styles.accountMetricBox}>
                <View style={styles.metricIconRow}>
                  <Flame size={13} color={FINTECH_COLORS.green} style={{ marginRight: 4 }} />
                  <Text style={styles.metricLabel}>SÉANCES VALIDÉES</Text>
                </View>
                <Text style={styles.metricValue}>
                  {data.profile.totalWorkouts || 0}
                  <Text style={styles.metricUnit}> SESSIONS</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1 : Performances 1RM */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>PERFORMANCES & 1RM</Text>
            <OneRMChartCard />
          </View>

          {/* Section 2 : Évolution Corporelle & Graphiques */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>ANALYSE DES MENSURATIONS</Text>
            <ModularMeasurementChartCard measurements={data.measurements} />
          </View>

          {/* Section 3 : Suivi & Journal des Mensurations */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>JOURNAL DU POIDS</Text>
            <BodyMeasurementsCard
              measurements={data.measurements}
              onAddMeasurement={addMeasurement}
              onDeleteMeasurement={deleteMeasurement}
            />
          </View>

          {/* Section 4 : Paramètres Système & Données (Trade Republic Flush Settings) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>DONNÉES & SYSTÈME</Text>

            <View style={styles.settingsCard}>
              {/* Row: Sauvegarde & Exportation */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExportModalVisible(true)}
                style={[styles.settingsRow, styles.settingsBorder]}
              >
                <View style={styles.settingsIconCircle}>
                  <Download size={16} color="#FFFFFF" />
                </View>
                <View style={styles.settingsCenter}>
                  <Text style={styles.settingsTitle}>Sauvegarde & Exportation</Text>
                  <Text style={styles.settingsSub}>Exporter en CSV / JSON ou restaurer</Text>
                </View>
                <ChevronRight size={15} color={FINTECH_COLORS.textMuted} />
              </TouchableOpacity>

              {/* Row: Thème de l'application */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setThemeModalVisible(true)}
                style={[styles.settingsRow, styles.settingsBorder]}
              >
                <View style={styles.settingsIconCircle}>
                  <Palette size={16} color="#FFFFFF" />
                </View>
                <View style={styles.settingsCenter}>
                  <Text style={styles.settingsTitle}>Thème d'affichage</Text>
                  <Text style={styles.settingsSub}>Clean FinTech, Cyber Tactical, Dark...</Text>
                </View>
                <ChevronRight size={15} color={FINTECH_COLORS.textMuted} />
              </TouchableOpacity>

              {/* Row: Relancer le tutoriel */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  await resetOnboarding();
                  Alert.alert("Tutoriel", "Le tutoriel de bienvenue sera affiché lors du prochain redémarrage.");
                }}
                style={[styles.settingsRow, styles.settingsBorder]}
              >
                <View style={styles.settingsIconCircle}>
                  <Sparkles size={16} color="#FFFFFF" />
                </View>
                <View style={styles.settingsCenter}>
                  <Text style={styles.settingsTitle}>Tutoriel de bienvenue</Text>
                  <Text style={styles.settingsSub}>Revoir le guidage initial de l'application</Text>
                </View>
                <ChevronRight size={15} color={FINTECH_COLORS.textMuted} />
              </TouchableOpacity>

              {/* Row: Réinitialiser les données */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetData}
                style={styles.settingsRow}
              >
                <View style={[styles.settingsIconCircle, { backgroundColor: "#2C1214" }]}>
                  <Trash2 size={16} color="#FF453A" />
                </View>
                <View style={styles.settingsCenter}>
                  <Text style={[styles.settingsTitle, { color: "#FF453A" }]}>
                    Réinitialiser les données
                  </Text>
                  <Text style={styles.settingsSub}>Effacer l'historique et repartir à zéro</Text>
                </View>
                <ChevronRight size={15} color={FINTECH_COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal Modification Pseudo */}
        <Modal
          visible={editProfileModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditProfileModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditProfileModalVisible(false)}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Modifier votre Nom d'Athlète</Text>
              <TextInput
                style={styles.modalInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Ex: Sébastien"
                placeholderTextColor={FINTECH_COLORS.textMuted}
                autoFocus
              />
              <View style={styles.modalBtnsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setEditProfileModalVisible(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSaveProfile}
                  style={styles.modalSaveBtn}
                >
                  <Text style={styles.modalSaveText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal Choix du Thème */}
        <ThemeSelectorModal
          visible={themeModalVisible}
          onClose={() => setThemeModalVisible(false)}
        />

        {/* Modal Export / Import */}
        <ExportDataModal
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  headerCategory: {
    fontSize: 10,
    fontWeight: "800",
    color: FINTECH_COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: FINTECH_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  themeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FINTECH_COLORS.surfaceElevated,
    borderColor: FINTECH_COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  themeBtnText: {
    color: FINTECH_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  accountCard: {
    backgroundColor: FINTECH_COLORS.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FINTECH_COLORS.borderSubtle,
    padding: 16,
    marginBottom: 20,
  },
  accountTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FINTECH_COLORS.surfaceActive,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: "800",
    color: FINTECH_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  accountBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  accountBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: FINTECH_COLORS.green,
  },
  accountMetricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  accountMetricBox: {
    flex: 1,
    backgroundColor: FINTECH_COLORS.surfaceActive,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: FINTECH_COLORS.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "900",
    color: FINTECH_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: FINTECH_COLORS.textMuted,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: FINTECH_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: FINTECH_COLORS.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FINTECH_COLORS.borderSubtle,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: FINTECH_COLORS.borderSubtle,
  },
  settingsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FINTECH_COLORS.surfaceActive,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingsCenter: {
    flex: 1,
    marginRight: 8,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: FINTECH_COLORS.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  settingsSub: {
    fontSize: 11,
    fontWeight: "500",
    color: FINTECH_COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    backgroundColor: FINTECH_COLORS.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FINTECH_COLORS.borderSubtle,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: FINTECH_COLORS.textPrimary,
    marginBottom: 14,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: FINTECH_COLORS.surfaceActive,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FINTECH_COLORS.borderSubtle,
    color: FINTECH_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  modalBtnsRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FINTECH_COLORS.surfaceActive,
  },
  modalCancelText: {
    color: FINTECH_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  modalSaveText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "800",
  },
});
