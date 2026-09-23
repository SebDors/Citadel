import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { UserProfile } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import { useWorkout } from "../../context/WorkoutContext";
import { Card } from "../UI/Card";
import { Button } from "../UI/Button";
import {
  User,
  Scale,
  Flame,
  Settings,
  RotateCcw,
  Sparkles,
  Download,
  RefreshCw,
  ArrowUpCircle,
} from "lucide-react-native";
import { ExportDataModal } from "./ExportDataModal";
import { UpdateModal } from "./UpdateModal";
import { UpdateService, UpdateInfo } from "../../services/updateService";
import { formatWeight } from "../../utils/numberUtils";
import Constants from "expo-constants";

interface ProfileHeaderCardProps {
  profile: UserProfile;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const { theme } = useTheme();
  const { resetAllData, resetOnboarding } = useWorkout();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [name, setName] = useState(profile.name);
  const [availablePlates, setAvailablePlates] = useState<number[]>(
    profile.availablePlates || [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
  );
  const [dropReductionPercent, setDropReductionPercent] = useState<number>(
    profile.dropSetReductionPercent ?? 20,
  );

  useEffect(() => {
    // Vérification silencieuse au chargement du profil
    UpdateService.checkForUpdate()
      .then((info) => {
        if (info.hasUpdate) {
          setUpdateInfo(info);
        }
      })
      .catch(() => {
        // Mode silencieux : ignorer les erreurs au chargement
      });
  }, []);

  const handleCheckForUpdate = async (isManual: boolean) => {
    try {
      setIsCheckingUpdate(true);
      const info = await UpdateService.checkForUpdate();
      setUpdateInfo(info);
      if (info.hasUpdate) {
        setShowUpdateModal(true);
      } else if (isManual) {
        Alert.alert(
          "Application à jour",
          `Vous disposez déjà de la version la plus récente de Citadel (v${info.currentVersion}).`,
        );
      }
    } catch (e) {
      if (isManual) {
        Alert.alert(
          "Vérification impossible",
          "Impossible de joindre GitHub pour le moment. Vérifiez votre connexion Internet.",
        );
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const togglePlate = (weight: number) => {
    setAvailablePlates((prev) =>
      prev.includes(weight)
        ? prev.filter((w) => w !== weight)
        : [...prev, weight].sort((a, b) => b - a),
    );
  };

  useEffect(() => {
    setName(profile.name);
    setAvailablePlates(
      profile.availablePlates || [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
    );
    setDropReductionPercent(profile.dropSetReductionPercent ?? 20);
  }, [profile]);

  const handleSave = () => {
    onUpdateProfile({
      name,
      availablePlates,
      dropSetReductionPercent: dropReductionPercent,
    });
    setShowEditModal(false);
  };

  return (
    <Card>
      <View style={styles.container}>
        <View
          style={[
            styles.avatarBox,
            { backgroundColor: theme.surface, borderColor: theme.accent },
          ]}
        >
          <User size={32} color={theme.accent} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>
            {profile.name}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Scale size={14} color={theme.textMuted} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>
                {profile.currentWeightKg && profile.currentWeightKg > 0
                  ? `${formatWeight(profile.currentWeightKg)} kg`
                  : "-- kg"}
              </Text>
            </View>

            <View style={[styles.statItem, { marginLeft: 16 }]}>
              <Flame size={14} color={theme.accent} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>
                {profile.totalWorkouts} séances
              </Text>
            </View>
          </View>
        </View>

        {/* Roue crantée Réglages Profil */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowEditModal(true)}
          style={styles.settingsBtn}
        >
          <Settings size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Bandeau interactif si mise à jour disponible */}
      {updateInfo?.hasUpdate && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowUpdateModal(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.accent,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginTop: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ArrowUpCircle
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>
              Mise à jour v{updateInfo.latestVersion} disponible !
            </Text>
          </View>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: "700",
              textDecorationLine: "underline",
            }}
          >
            Installer
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal Édition du Profil */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Réglages & Profil
            </Text>

            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Nom ou Pseudo
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
              value={name}
              onChangeText={setName}
            />

            {/* Réglage des disques disponibles en salle */}
            <Text
              style={[styles.inputLabel, { color: theme.text, marginTop: 14 }]}
            >
              Disques disponibles dans votre salle (kg)
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 6,
              }}
            >
              {[0.5, 1.25, 2.5, 5, 10, 15, 20, 25].map((w) => {
                const isSelected = availablePlates.includes(w);
                return (
                  <TouchableOpacity
                    key={w}
                    activeOpacity={0.7}
                    onPress={() => togglePlate(w)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.accent : theme.border,
                      backgroundColor: isSelected
                        ? theme.accent
                        : theme.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isSelected ? "#FFFFFF" : theme.textMuted,
                      }}
                    >
                      {w} kg
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Réglage du pourcentage de décharge Drop Set */}
            <Text
              style={[styles.inputLabel, { color: theme.text, marginTop: 14 }]}
            >
              Décharge Drop Set automatique (% indicatif)
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 6,
              }}
            >
              {[15, 20, 25, 30].map((pct) => {
                const isSelected = dropReductionPercent === pct;
                return (
                  <TouchableOpacity
                    key={pct}
                    activeOpacity={0.7}
                    onPress={() => setDropReductionPercent(pct)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.accent : theme.border,
                      backgroundColor: isSelected
                        ? theme.accent
                        : theme.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: isSelected ? "#FFFFFF" : theme.textMuted,
                      }}
                    >
                      -{pct}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => setShowEditModal(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Enregistrer"
                variant="primary"
                onPress={handleSave}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>

            {/* Délimitation horizontale subtile */}
            <View
              style={{
                height: 1,
                backgroundColor: theme.accent,
                opacity: 0.5,
                marginTop: 16,
                marginBottom: 6,
                borderRadius: 1,
              }}
            />

            {/* Bouton Sauvegarde & Exportation */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                marginTop: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.primary || theme.accent,
                backgroundColor: theme.surface,
              }}
              onPress={() => {
                setShowEditModal(false);
                setShowExportModal(true);
              }}
            >
              <Download
                size={15}
                color={theme.primary || theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: theme.primary || theme.accent,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Sauvegarde & Exportation des données
              </Text>
            </TouchableOpacity>

            {/* Bouton Relancer le tutoriel */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                marginTop: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.accent,
                backgroundColor: theme.surface,
              }}
              onPress={async () => {
                setShowEditModal(false);
                await resetOnboarding();
              }}
            >
              <Sparkles
                size={15}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{ color: theme.accent, fontSize: 13, fontWeight: "700" }}
              >
                Relancer le tutoriel de bienvenue
              </Text>
            </TouchableOpacity>

            {/* Bouton Réinitialiser l'application */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                marginTop: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.danger,
                backgroundColor: "rgba(235, 87, 87, 0.08)",
              }}
              onPress={() => {
                Alert.alert(
                  "Réinitialiser l'application ?",
                  "Cette action va effacer toutes les données de l'application sur votre téléphone pour repartir sur un compte 100% neuf sans données factices.",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Réinitialiser",
                      style: "destructive",
                      onPress: async () => {
                        setShowEditModal(false);
                        await resetAllData();
                      },
                    },
                  ],
                );
              }}
            >
              <RotateCcw
                size={15}
                color={theme.danger}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{ color: theme.danger, fontSize: 13, fontWeight: "700" }}
              >
                Réinitialiser les données de l'application
              </Text>
            </TouchableOpacity>

            {/* Bouton de mise à jour si disponible */}
            {updateInfo?.hasUpdate && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 10,
                  marginTop: 10,
                  borderRadius: 10,
                  backgroundColor: theme.accent,
                }}
                onPress={() => {
                  setShowEditModal(false);
                  setShowUpdateModal(true);
                }}
              >
                <ArrowUpCircle
                  size={15}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}
                >
                  Mise à jour v{updateInfo.latestVersion} disponible !
                </Text>
              </TouchableOpacity>
            )}

            {/* Version de l'application & Vérification des Mises à jour */}
            <View style={{ alignItems: "center", marginTop: 14 }}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: "500",
                  color: theme.textMuted,
                }}
              >
                Version {Constants.expoConfig?.version || "X.X.X"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCheckForUpdate(true)}
                disabled={isCheckingUpdate}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 14,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                {isCheckingUpdate ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.accent}
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <RefreshCw
                    size={11}
                    color={theme.accent}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: theme.accent,
                  }}
                >
                  {isCheckingUpdate
                    ? "Recherche en cours..."
                    : "Vérifier les mises à jour"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ExportDataModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <UpdateModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        updateInfo={updateInfo}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  settingsBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
});
