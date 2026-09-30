import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import {
  Settings,
  X,
  Disc,
  Percent,
  Download,
  RefreshCw,
  ArrowUpCircle,
  Sparkles,
  RotateCcw,
  ChevronRight,
  ShieldAlert,
  Info,
  Activity,
  HeartPulse,
} from 'lucide-react-native';
import { TermInfoTooltip } from '../UI/TermInfoTooltip';
import { ExportDataModal } from './ExportDataModal';
import { UpdateModal } from './UpdateModal';
import { UpdateService, UpdateInfo } from '../../services/updateService';
import Constants from 'expo-constants';

interface AppSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
const ALL_PLATES = [0.5, 1.25, 2.5, 5, 10, 15, 20, 25];
const DROP_PERCENT_OPTIONS = [15, 20, 25, 30];

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  visible,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const { theme } = useTheme();
  const { resetAllData, resetOnboarding } = useWorkout();

  const [availablePlates, setAvailablePlates] = useState<number[]>(
    profile.availablePlates || DEFAULT_PLATES,
  );
  const [dropReductionPercent, setDropReductionPercent] = useState<number>(
    profile.dropSetReductionPercent ?? 20,
  );
  const [enableRir, setEnableRir] = useState<boolean>(
    profile.enableRir !== false,
  );
  const [enableFatigueMarkers, setEnableFatigueMarkers] = useState<boolean>(
    profile.enableFatigueMarkers !== false,
  );

  const [showExportModal, setShowExportModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    setAvailablePlates(profile.availablePlates || DEFAULT_PLATES);
    setDropReductionPercent(profile.dropSetReductionPercent ?? 20);
    setEnableRir(profile.enableRir !== false);
    setEnableFatigueMarkers(profile.enableFatigueMarkers !== false);
  }, [profile]);

  useEffect(() => {
    if (visible) {
      UpdateService.checkForUpdate()
        .then((info) => {
          if (info.hasUpdate) {
            setUpdateInfo(info);
          }
        })
        .catch(() => {
          // Mode silencieux : ignorer les erreurs
        });
    }
  }, [visible]);

  const handleTogglePlate = (weight: number) => {
    const updated = availablePlates.includes(weight)
      ? availablePlates.filter((w) => w !== weight)
      : [...availablePlates, weight].sort((a, b) => b - a);

    setAvailablePlates(updated);
    onUpdateProfile({ availablePlates: updated });
  };

  const handleSelectDropPercent = (pct: number) => {
    setDropReductionPercent(pct);
    onUpdateProfile({ dropSetReductionPercent: pct });
  };

  const handleToggleRir = (newVal: boolean) => {
    setEnableRir(newVal);
    onUpdateProfile({ enableRir: newVal });
  };

  const handleToggleFatigueMarkers = (val: boolean) => {
    setEnableFatigueMarkers(val);
    onUpdateProfile({ enableFatigueMarkers: val });
  };

  const handleCheckForUpdate = async (isManual: boolean) => {
    try {
      setIsCheckingUpdate(true);
      const info = await UpdateService.checkForUpdate();
      setUpdateInfo(info);
      if (info.hasUpdate) {
        setShowUpdateModal(true);
      } else if (isManual) {
        Alert.alert(
          'Application à jour',
          `Vous disposez déjà de la version la plus récente de Citadel (v${info.currentVersion}).`,
        );
      }
    } catch {
      if (isManual) {
        Alert.alert(
          'Vérification impossible',
          'Impossible de joindre GitHub pour le moment. Vérifiez votre connexion Internet.',
        );
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Relancer le tutoriel ?',
      'Le guidage de bienvenue sera réactivé lors de vos prochaines visites dans les onglets de l\'application.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Relancer',
          onPress: async () => {
            await resetOnboarding();
            Alert.alert('Guidage réinitialisé', 'Le tutoriel s\'affichera de nouveau.');
          },
        },
      ],
    );
  };

  const handleResetAllData = () => {
    Alert.alert(
      'Réinitialiser toute l\'application ?',
      'Cette action est IRRÉVERSIBLE. Toutes vos séances, mensurations, historiques et profils seront supprimés de cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            onClose();
            Alert.alert('Données réinitialisées', 'Votre application repart sur une base vierge.');
          },
        },
      ],
    );
  };

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        {/* En-tête Modal */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.headerIconContainer,
                { backgroundColor: `${theme.accent}15` },
              ]}
            >
              <Settings size={20} color={theme.accent} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Paramètres
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                Préférences et configuration de Citadel
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bannière mise à jour si disponible */}
          {updateInfo?.hasUpdate && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowUpdateModal(true)}
              style={[styles.updateBanner, { backgroundColor: theme.accent }]}
            >
              <View style={styles.updateBannerLeft}>
                <ArrowUpCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.updateBannerTitle}>
                    Mise à jour v{updateInfo.latestVersion} disponible !
                  </Text>
                  <Text style={styles.updateBannerSubtitle}>
                    Appuyez pour voir les nouveautés et installer
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* SECTION 1 : ENTRAÎNEMENT & CALCULATEUR */}
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            ENTRAÎNEMENT & CALCULATEUR
          </Text>

          <View
            style={[
              styles.cardSection,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            {/* Configuration des disques disponibles */}
            <View style={styles.itemHeaderRow}>
              <View style={styles.itemTitleWithIcon}>
                <Disc size={18} color={theme.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  Disques disponibles en salle
                </Text>
              </View>
            </View>
            <Text style={[styles.itemDescription, { color: theme.textMuted }]}>
              Sélectionnez les disques présents dans votre salle. Ils seront utilisés par le calculateur automatique de chargement de barre.
            </Text>

            <View style={styles.platesGrid}>
              {ALL_PLATES.map((weight) => {
                const isSelected = availablePlates.includes(weight);
                return (
                  <TouchableOpacity
                    key={weight}
                    activeOpacity={0.7}
                    onPress={() => handleTogglePlate(weight)}
                    style={[
                      styles.plateChip,
                      {
                        backgroundColor: isSelected ? theme.accent : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.plateChipText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.text,
                        },
                      ]}
                    >
                      {weight} kg
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

            {/* Pourcentage de décharge Drop Set */}
            <View style={styles.itemHeaderRow}>
              <View style={styles.itemTitleWithIcon}>
                <Percent size={18} color={theme.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  Décharge Drop Set par défaut
                </Text>
              </View>
            </View>
            <Text style={[styles.itemDescription, { color: theme.textMuted }]}>
              Pourcentage de réduction indicatif suggéré lors d'une série dégressive (Drop Set).
            </Text>

            <View style={styles.dropPercentRow}>
              {DROP_PERCENT_OPTIONS.map((pct) => {
                const isSelected = dropReductionPercent === pct;
                return (
                  <TouchableOpacity
                    key={pct}
                    activeOpacity={0.7}
                    onPress={() => handleSelectDropPercent(pct)}
                    style={[
                      styles.dropPercentBtn,
                      {
                        backgroundColor: isSelected ? theme.accent : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropPercentText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.text,
                        },
                      ]}
                    >
                      -{pct}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

            {/* Suivi du RIR (Répétitions en réserve) */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <View style={styles.itemTitleWithIcon}>
                  <Activity size={18} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Suivi du RIR (Répétitions en réserve)
                  </Text>
                  <View style={{ marginLeft: 6 }}>
                    <TermInfoTooltip
                      customTitle="Suivi du RIR"
                      customExplanation="Le RIR (Reps In Reserve) indique combien de répétitions supplémentaires vous auriez pu effectuer avant l'échec musculaire. Si vous le désactivez, la colonne RIR, les alertes d'auto-régulation et les cibles RIR sont masquées pour simplifier votre interface."
                      size={15}
                    />
                  </View>
                </View>
                <Text style={[styles.itemDescription, { color: theme.textMuted, marginTop: 4, marginBottom: 0 }]}>
                  Définit si les colonnes et cibles RIR sont affichées dans vos séances et programmes.
                </Text>
              </View>
              <Switch
                value={enableRir}
                onValueChange={handleToggleRir}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

            {/* Indicateurs de fatigue & Récupération */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <View style={styles.itemTitleWithIcon}>
                  <HeartPulse size={18} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Indicateurs de fatigue & Récupération
                  </Text>
                  <View style={{ marginLeft: 6 }}>
                    <TermInfoTooltip
                      customTitle="Indicateurs de fatigue & Récupération"
                      customExplanation="Analyse hebdomadaire de votre niveau de fatigue physique et de sous-récupération en comparant votre RIR moyen, la durée de vos séances et l'évolution de votre poids de corps sur 4 semaines. Désactivez si vous préférez un historique plus compact sans ces indicateurs."
                      size={15}
                    />
                  </View>
                </View>
                <Text style={[styles.itemDescription, { color: theme.textMuted, marginTop: 4, marginBottom: 0 }]}>
                  Affiche ou masque la carte de surveillance de la récupération dans l'onglet Historique.
                </Text>
              </View>
              <Switch
                value={enableFatigueMarkers}
                onValueChange={handleToggleFatigueMarkers}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* SECTION 2 : DONNÉES & SAUVEGARDE */}
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            DONNÉES & SAUVEGARDE
          </Text>

          <View
            style={[
              styles.cardSection,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowExportModal(true)}
              style={styles.actionRow}
            >
              <View
                style={[
                  styles.actionIconBox,
                  { backgroundColor: `${theme.primary || theme.accent}15` },
                ]}
              >
                <Download size={20} color={theme.primary || theme.accent} />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>
                  Sauvegarde & Exportation des données
                </Text>
                <Text style={[styles.actionSubtitle, { color: theme.textMuted }]}>
                  Télécharger vos séances en CSV, sauvegarder ou restaurer un backup JSON
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* SECTION 3 : APPLICATION & MISES À JOUR */}
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            APPLICATION & VERSION
          </Text>

          <View
            style={[
              styles.cardSection,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={styles.appInfoRow}>
              <View style={styles.appInfoLeft}>
                <View
                  style={[
                    styles.actionIconBox,
                    { backgroundColor: `${theme.accent}15` },
                  ]}
                >
                  <Info size={20} color={theme.accent} />
                </View>
                <View>
                  <Text style={[styles.actionTitle, { color: theme.text }]}>
                    Citadel
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: theme.textMuted }]}>
                    Version {currentVersion}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCheckForUpdate(true)}
                disabled={isCheckingUpdate}
                style={[
                  styles.checkUpdateBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                {isCheckingUpdate ? (
                  <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 6 }} />
                ) : (
                  <RefreshCw size={13} color={theme.accent} style={{ marginRight: 6 }} />
                )}
                <Text style={[styles.checkUpdateBtnText, { color: theme.accent }]}>
                  {isCheckingUpdate ? 'Recherche...' : 'Vérifier'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECTION 4 : ZONE DE DANGER & RÉINITIALISATION */}
          <Text style={[styles.sectionTitle, { color: theme.danger || '#EF4444' }]}>
            ZONE DE DANGER
          </Text>

          <View
            style={[
              styles.cardSection,
              {
                backgroundColor: theme.cardBg,
                borderColor: `${theme.danger || '#EF4444'}30`,
              },
            ]}
          >
            {/* Relancer l'onboarding */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResetOnboarding}
              style={styles.actionRow}
            >
              <View
                style={[
                  styles.actionIconBox,
                  { backgroundColor: `${theme.accent}15` },
                ]}
              >
                <Sparkles size={20} color={theme.accent} />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>
                  Relancer le tutoriel de bienvenue
                </Text>
                <Text style={[styles.actionSubtitle, { color: theme.textMuted }]}>
                  Réaffiche les bannières d'explications et conseils pour redécouvrir l'application
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

            {/* Réinitialiser toutes les données */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResetAllData}
              style={styles.actionRow}
            >
              <View
                style={[
                  styles.actionIconBox,
                  { backgroundColor: `${theme.danger || '#EF4444'}15` },
                ]}
              >
                <RotateCcw size={20} color={theme.danger || '#EF4444'} />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[styles.actionTitle, { color: theme.danger || '#EF4444' }]}>
                  Réinitialiser toutes les données
                </Text>
                <Text style={[styles.actionSubtitle, { color: theme.textMuted }]}>
                  Supprime définitivement tout l'historique, les modèles et les mensurations
                </Text>
              </View>
              <ShieldAlert size={18} color={theme.danger || '#EF4444'} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sous-modales : Export & Mise à jour */}
        <ExportDataModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
        />

        <UpdateModal
          visible={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          updateInfo={updateInfo}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  updateBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  updateBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  updateBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  cardSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 6,
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
    opacity: 0.5,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  platesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  plateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  plateChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropPercentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dropPercentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dropPercentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextBox: {
    flex: 1,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  checkUpdateBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
});
