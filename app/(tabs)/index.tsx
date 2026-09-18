import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import {
  Play,
  Plus,
  MoreHorizontal,
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Copy,
  Trash2,
  X,
  Import as ImportIcon,
  BookOpen,
  Share2,
} from "lucide-react-native";
import { ExerciseLibraryModal } from "../../src/components/Workout/ExerciseLibraryModal";
import { OnboardingModal } from "../../src/components/Onboarding/OnboardingModal";
import {
  WorkoutSession,
  WorkoutTemplate,
  WorkoutFolder,
  CircuitBlock,
  getRealLastWorkoutDate,
  getTemplateBlocks,
  getSessionBlocks,
  formatCircuitSummary,
  getAverageWorkoutDurationMinutes,
} from "../../src/types";
import { ExportService } from "../../src/services/exportService";
import {
  SWISS_COLORS,
  SWISS_TYPOGRAPHY,
  SWISS_GRID,
} from "../../src/constants/swissTheme";
import { SwissDivider } from "../../src/components/Swiss";

export default function HomeScreen() {
  const {
    data,
    activeSession,
    startWorkout,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    renameTemplate,
    createFolder,
    renameFolder,
    deleteFolder,
    moveTemplateToFolder,
    toggleFolderCollapse,
    markFirstSessionCreated,
    completeOnboarding,
    skipOnboarding,
  } = useWorkout();

  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;
  const router = useRouter();

  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [libraryModalVisible, setLibraryModalVisible] = useState(false);

  // Modals for template & folder management
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [showTemplateMenuModal, setShowTemplateMenuModal] = useState(false);
  const [showRenameTemplateModal, setShowRenameTemplateModal] = useState(false);
  const [renameTemplateTitle, setRenameTemplateTitle] = useState("");

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<WorkoutFolder | null>(null);
  const [showFolderMenuModal, setShowFolderMenuModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");

  // Calcul du volume hebdomadaire (commençant au lundi)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfCurrentWeek = new Date(now.setDate(diffToMonday));
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  const currentWeekSessions = (data?.history || []).filter(
    (s) => new Date(s.startTime) >= startOfCurrentWeek,
  );
  const currentWeekVolume = currentWeekSessions.reduce(
    (sum, s) => sum + (s.totalVolumeKg || 0),
    0,
  );

  const handleStartFreestyle = () => {
    startWorkout();
    router.push("/live-workout");
  };

  const handleStartTemplate = (templateId: string) => {
    const tpl = data?.templates.find((t) => t.id === templateId);
    if (tpl) {
      startWorkout(tpl);
      router.push("/live-workout");
    }
  };

  const handleOpenTemplateMenu = (tpl: WorkoutTemplate) => {
    setSelectedTemplate(tpl);
    setShowTemplateMenuModal(true);
  };

  const handleShareTemplate = async (tpl: WorkoutTemplate) => {
    try {
      await ExportService.shareTemplate(tpl);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'exporter la séance.");
    }
  };

  const handleImportTemplate = async () => {
    try {
      const imported = await ExportService.pickAndParseTemplateJSON();
      if (!imported) return;

      const title = imported.title?.trim() || "Séance importée";
      const existingTitles = (data?.templates || []).map((t) => t.title.toLowerCase());
      let finalTitle = title;
      if (existingTitles.includes(title.toLowerCase())) {
        finalTitle = `${title} (Importé)`;
      }

      const newTemplate: WorkoutTemplate = {
        ...imported,
        id: `tpl_${Date.now()}`,
        title: finalTitle,
        createdAt: new Date().toISOString(),
      };

      await saveTemplate(newTemplate);
      if (!data?.hasCreatedFirstSession) {
        await markFirstSessionCreated();
      }

      Alert.alert(
        "Séance importée",
        `Le programme "${finalTitle}" a été ajouté à votre sommaire.`,
      );
    } catch (error: any) {
      Alert.alert("Erreur d'importation", error?.message || "Fichier invalide.");
    }
  };

  const handleConfirmRenameTemplate = async () => {
    if (selectedTemplate && renameTemplateTitle.trim()) {
      await renameTemplate(selectedTemplate.id, renameTemplateTitle);
      setShowRenameTemplateModal(false);
      setSelectedTemplate(null);
    }
  };

  const handleConfirmCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName);
      setNewFolderName("");
      setShowCreateFolderModal(false);
    }
  };

  const handleConfirmRenameFolder = async () => {
    if (selectedFolder && renameFolderName.trim()) {
      await renameFolder(selectedFolder.id, renameFolderName);
      setShowRenameFolderModal(false);
      setSelectedFolder(null);
    }
  };

  // Group folders & unassigned templates
  const folders = [...(data?.folders || [])].sort((a, b) =>
    a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
  );
  const templatesInFolders = new Set(folders.flatMap((f) => f.templateIds));
  const unassignedTemplates = [...(data?.templates || [])]
    .filter((t) => !templatesInFolders.has(t.id))
    .sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
    );

  const currentFolder = selectedTemplate
    ? folders.find((f) => f.templateIds.includes(selectedTemplate.id))
    : null;
  const isNoFolderSelected = !currentFolder;

  // Render Swiss Editorial Row for a template
  const renderTemplateRow = (tpl: WorkoutTemplate, indexString: string) => {
    const blocks = getTemplateBlocks(tpl);
    const targetMusclesSet = new Set<string>();

    blocks.forEach((block) => {
      if (block.type === "single") {
        if (block.exercise.primaryMuscle) targetMusclesSet.add(block.exercise.primaryMuscle);
      } else if (block.type === "circuit") {
        block.exercises.forEach((ex) => {
          if (ex.primaryMuscle) targetMusclesSet.add(ex.primaryMuscle);
        });
      }
    });

    const muscleLabel = Array.from(targetMusclesSet).join(", ") || `${blocks.length} EXOS`;
    const realLastObj = getRealLastWorkoutDate(data?.history || [], tpl.title);
    const realLast = realLastObj?.dateFormatted;
    const estimatedMins = getAverageWorkoutDurationMinutes(tpl, data?.history);

    return (
      <View key={tpl.id} style={styles.editorialRowWrapper}>
        <SwissDivider subtle />
        <View style={styles.editorialRow}>
          {/* Numéro d'index rouge suisse */}
          <Text style={[styles.editorialIndex, { color: palette.accent }]}>
            {indexString}
          </Text>

          {/* Corps principal : Titre + Sous-titre */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => handleStartTemplate(tpl.id)}
            style={styles.editorialMainContent}
          >
            <Text
              style={[
                styles.editorialTitle,
                { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
              ]}
              numberOfLines={1}
            >
              {tpl.title.toUpperCase()}
            </Text>
            <Text style={[styles.editorialMeta, { color: palette.textMuted }]}>
              {estimatedMins > 0 ? `~${estimatedMins} MIN` : "45-60 MIN"}
              {realLast ? ` · DERNIER: ${realLast.toUpperCase()}` : ""}
            </Text>
          </TouchableOpacity>

          {/* Métadonnées musculaires à droite */}
          <View style={styles.editorialRightCol}>
            <Text
              style={[styles.editorialMuscleTag, { color: palette.textMuted }]}
              numberOfLines={1}
            >
              {muscleLabel.toUpperCase()}
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenTemplateMenu(tpl)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.editorialOptionsBtn}
            >
              <MoreHorizontal size={16} color={palette.textDimmed} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. EN-TÊTE DE STATUT MONUMENTAL */}
        <View style={styles.statusSection}>
          <View style={styles.statusHeaderRow}>
            <Text style={[styles.statusTag, { color: activeSession ? palette.accent : palette.textMuted }]}>
              {activeSession ? "STATUS // EN MISSION ACTIVE" : "STATUS // READY TO ENGAGE"}
            </Text>
          </View>

          <Text style={[styles.statusLabel, { color: palette.textMuted }]}>
            VOLUME HEBDOMADAIRE CUMULÉ
          </Text>
          <Text
            style={[
              styles.displayVolume,
              { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
            ]}
          >
            {currentWeekVolume > 0 ? currentWeekVolume.toLocaleString("fr-FR") : "0"}
            <Text style={[styles.displayUnit, { color: palette.accent }]}> KG</Text>
          </Text>
        </View>

        {/* 2. BANNIÈRE D'ENGAGEMENT ACTIF (Si séance en cours) */}
        {activeSession && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/live-workout")}
            style={[styles.activeSessionBanner, { borderLeftColor: palette.accent }]}
          >
            <Text style={[styles.activeSessionIndex, { color: palette.accent }]}>00</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeSessionTitle, { color: palette.accent }]}>
                SÉANCE EN COURS — REPRENDRE
              </Text>
              <Text style={[styles.activeSessionSub, { color: palette.textMuted }]}>
                {activeSession.title.toUpperCase()} · DÉJÀ ENGAGÉE
              </Text>
            </View>
            <Text style={[styles.arrowRight, { color: palette.accent }]}>→</Text>
          </TouchableOpacity>
        )}

        {/* 3. DÉCLENCHEUR D'ENTRAÎNEMENT LIBRE MAJEUR */}
        <View style={styles.heroActionSection}>
          <SwissDivider />
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleStartFreestyle}
            style={styles.freeWorkoutHero}
          >
            <View style={styles.heroTextRow}>
              <Text style={[styles.heroArrow, { color: palette.accent }]}>→</Text>
              <Text
                style={[
                  styles.heroTitle,
                  { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
                ]}
              >
                DÉMARRER ENTRAÎNEMENT LIBRE
              </Text>
            </View>
            <Text style={[styles.heroSubtitle, { color: palette.textMuted }]}>
              SESSION IMMÉDIATE SANS PROGRAMME PRÉALABLE
            </Text>
          </TouchableOpacity>
          <SwissDivider />
        </View>

        {/* 4. SOMMAIRE ÉDITORIAL DES PROGRAMMES */}
        <View style={styles.programsSection}>
          <View style={styles.programsHeaderRow}>
            <View>
              <Text style={[styles.sectionIndex, { color: palette.accent }]}>02</Text>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
                ]}
              >
                PROGRAMMES & PROTOCOLES
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/template-editor")}
              style={styles.createLink}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.createLinkText, { color: palette.accent }]}>
                [+ CRÉER]
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dossiers (Chapitres) */}
          {folders.map((folder, folderIdx) => {
            const folderTemplates = (data?.templates || []).filter((t) =>
              folder.templateIds.includes(t.id),
            );
            const isCollapsed = !!folder.isCollapsed;

            return (
              <View key={folder.id} style={styles.folderSection}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleFolderCollapse(folder.id)}
                  style={styles.folderHeaderRow}
                >
                  <Text style={[styles.folderIndex, { color: palette.accent }]}>
                    § {folderIdx + 1}
                  </Text>
                  <Text
                    style={[
                      styles.folderTitle,
                      { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
                    ]}
                  >
                    {folder.name.toUpperCase()}
                  </Text>
                  <Text style={[styles.folderCount, { color: palette.textMuted }]}>
                    ({folderTemplates.length})
                  </Text>
                  <View style={styles.folderArrow}>
                    {isCollapsed ? (
                      <ChevronDown size={14} color={palette.textMuted} />
                    ) : (
                      <ChevronUp size={14} color={palette.textMuted} />
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFolder(folder);
                      setShowFolderMenuModal(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 12 }}
                  >
                    <MoreHorizontal size={14} color={palette.textDimmed} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {!isCollapsed &&
                  folderTemplates.map((tpl, tplIdx) =>
                    renderTemplateRow(tpl, `${folderIdx + 1}.${tplIdx + 1}`),
                  )}
              </View>
            );
          })}

          {/* Programmes hors dossiers */}
          {unassignedTemplates.length > 0 ? (
            <View style={{ marginTop: folders.length > 0 ? 16 : 0 }}>
              {unassignedTemplates.map((tpl, idx) =>
                renderTemplateRow(
                  tpl,
                  (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`),
                ),
              )}
            </View>
          ) : folders.length === 0 ? (
            <View style={styles.emptyState}>
              <SwissDivider subtle />
              <Text style={[styles.emptyStateText, { color: palette.textMuted }]}>
                AUCUN PROGRAMME ENREGISTRÉ. INITIALISEZ VOTRE PREMIER PROTOCOLE CI-DESSOUS.
              </Text>
            </View>
          ) : null}

          <SwissDivider subtle style={{ marginTop: 8 }} />
        </View>

        {/* 5. COMMANDES COMPLÉMENTAIRES ÉPURÉES */}
        <View style={styles.actionLinksRow}>
          <TouchableOpacity
            style={styles.actionLinkItem}
            onPress={() => setShowCreateFolderModal(true)}
          >
            <Text style={[styles.actionLinkText, { color: palette.textMuted }]}>
              + NOUVEAU DOSSIER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionLinkItem}
            onPress={handleImportTemplate}
          >
            <Text style={[styles.actionLinkText, { color: palette.textMuted }]}>
              + IMPORTER PROGRAMME (.JSON)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionLinkItem}
            onPress={() => setLibraryModalVisible(true)}
          >
            <Text style={[styles.actionLinkText, { color: palette.textMuted }]}>
              BIBLIOTHÈQUE D'EXERCICES →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Espace négatif de fin de page */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* MODALES D'OPTIONS ET GESTION (PRÉSERVÉES ET ÉPURÉES) */}
      <ExerciseLibraryModal
        visible={libraryModalVisible}
        onClose={() => setLibraryModalVisible(false)}
      />

      <OnboardingModal
        visible={data?.hasCompletedOnboarding === false}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />

      {/* Menu Template Modal */}
      <Modal
        visible={showTemplateMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTemplateMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTemplateMenuModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {selectedTemplate?.title.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setShowTemplateMenuModal(false)}>
                <X size={18} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalActionItem}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  router.push({
                    pathname: "/template-editor",
                    params: { templateId: selectedTemplate.id },
                  });
                }
              }}
            >
              <Edit2 size={16} color={palette.text} />
              <Text style={[styles.modalActionLabel, { color: palette.text }]}>
                Modifier le programme
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalActionItem}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  setRenameTemplateTitle(selectedTemplate.title);
                  setShowRenameTemplateModal(true);
                }
              }}
            >
              <Edit2 size={16} color={palette.text} />
              <Text style={[styles.modalActionLabel, { color: palette.text }]}>
                Renommer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalActionItem}
              onPress={async () => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  await duplicateTemplate(selectedTemplate.id);
                }
              }}
            >
              <Copy size={16} color={palette.text} />
              <Text style={[styles.modalActionLabel, { color: palette.text }]}>
                Dupliquer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalActionItem}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  handleShareTemplate(selectedTemplate);
                }
              }}
            >
              <Share2 size={16} color={palette.text} />
              <Text style={[styles.modalActionLabel, { color: palette.text }]}>
                Partager le fichier (.json)
              </Text>
            </TouchableOpacity>

            <SwissDivider subtle style={{ marginVertical: 8 }} />

            <TouchableOpacity
              style={styles.modalActionItem}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  Alert.alert(
                    "Supprimer le programme ?",
                    `Êtes-vous certain de vouloir supprimer définitivement "${selectedTemplate.title}" ?`,
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: () => deleteTemplate(selectedTemplate.id),
                      },
                    ],
                  );
                }
              }}
            >
              <Trash2 size={16} color={palette.accent} />
              <Text style={[styles.modalActionLabel, { color: palette.accent }]}>
                Supprimer le programme
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Template Modal */}
      <Modal
        visible={showRenameTemplateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameTemplateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRenameTemplateModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text, marginBottom: 12 }]}>
              RENOMMER LE PROGRAMME
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
              ]}
              value={renameTemplateTitle}
              onChangeText={setRenameTemplateTitle}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setShowRenameTemplateModal(false)}
                style={styles.modalBtn}
              >
                <Text style={[styles.modalBtnText, { color: palette.textMuted }]}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmRenameTemplate}
                style={[styles.modalBtn, { borderBottomColor: palette.accent, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalBtnText, { color: palette.accent }]}>ENREGISTRER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateFolderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateFolderModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text, marginBottom: 12 }]}>
              NOUVEAU DOSSIER
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
              ]}
              placeholder="Ex: Push / Pull / Legs"
              placeholderTextColor={palette.textDimmed}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setShowCreateFolderModal(false)}
                style={styles.modalBtn}
              >
                <Text style={[styles.modalBtnText, { color: palette.textMuted }]}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmCreateFolder}
                style={[styles.modalBtn, { borderBottomColor: palette.accent, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalBtnText, { color: palette.accent }]}>CRÉER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Folder Options Menu Modal */}
      <Modal
        visible={showFolderMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFolderMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFolderMenuModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                DOSSIER : {selectedFolder?.name.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setShowFolderMenuModal(false)}>
                <X size={18} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalActionItem}
              onPress={() => {
                setShowFolderMenuModal(false);
                if (selectedFolder) {
                  setRenameFolderName(selectedFolder.name);
                  setShowRenameFolderModal(true);
                }
              }}
            >
              <Edit2 size={16} color={palette.text} />
              <Text style={[styles.modalActionLabel, { color: palette.text }]}>
                Renommer le dossier
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalActionItem}
              onPress={() => {
                setShowFolderMenuModal(false);
                if (selectedFolder) {
                  Alert.alert(
                    "Supprimer le dossier ?",
                    "Les programmes contenus dans ce dossier seront conservés dans la liste générale.",
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: () => deleteFolder(selectedFolder.id),
                      },
                    ],
                  );
                }
              }}
            >
              <Trash2 size={16} color={palette.accent} />
              <Text style={[styles.modalActionLabel, { color: palette.accent }]}>
                Supprimer le dossier
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        visible={showRenameFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameFolderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRenameFolderModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text, marginBottom: 12 }]}>
              RENOMMER LE DOSSIER
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
              ]}
              value={renameFolderName}
              onChangeText={setRenameFolderName}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setShowRenameFolderModal(false)}
                style={styles.modalBtn}
              >
                <Text style={[styles.modalBtnText, { color: palette.textMuted }]}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmRenameFolder}
                style={[styles.modalBtn, { borderBottomColor: palette.accent, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalBtnText, { color: palette.accent }]}>ENREGISTRER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SWISS_GRID.margin,
    paddingTop: SWISS_GRID.gapLarge,
  },
  statusSection: {
    marginBottom: SWISS_GRID.gapLarge,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusTag: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: "800",
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingLabel,
  },
  statusLabel: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: "700",
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingLabel,
    marginTop: 6,
  },
  displayVolume: {
    fontSize: SWISS_TYPOGRAPHY.display,
    fontWeight: "900",
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingDisplay,
    lineHeight: 62,
  },
  displayUnit: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0,
  },
  activeSessionBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 12,
    marginBottom: SWISS_GRID.gapLarge,
    gap: 12,
  },
  activeSessionIndex: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  activeSessionTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  activeSessionSub: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  arrowRight: {
    fontSize: 22,
    fontWeight: "800",
  },
  heroActionSection: {
    marginBottom: SWISS_GRID.gapSection,
  },
  freeWorkoutHero: {
    paddingVertical: 20,
  },
  heroTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroArrow: {
    fontSize: 24,
    fontWeight: "900",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: "700",
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingLabel,
    marginTop: 6,
    marginLeft: 34,
  },
  programsSection: {
    marginBottom: SWISS_GRID.gapSection,
  },
  programsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionIndex: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: "900",
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingLabel,
  },
  sectionTitle: {
    fontSize: SWISS_TYPOGRAPHY.h2,
    fontWeight: "900",
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingTitle,
    marginTop: 2,
  },
  createLink: {
    paddingBottom: 4,
  },
  createLinkText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  folderSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  folderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },
  folderIndex: {
    fontSize: 12,
    fontWeight: "900",
  },
  folderTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  folderCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  folderArrow: {
    marginLeft: 4,
  },
  editorialRowWrapper: {
    width: "100%",
  },
  editorialRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  editorialIndex: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    width: 24,
  },
  editorialMainContent: {
    flex: 1,
  },
  editorialTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  editorialMeta: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  editorialRightCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  editorialMuscleTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  editorialOptionsBtn: {
    padding: 2,
  },
  emptyState: {
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 16,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  actionLinksRow: {
    flexDirection: "column",
    gap: 14,
    paddingTop: 8,
  },
  actionLinkItem: {
    paddingVertical: 4,
  },
  actionLinkText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    width: "100%",
    padding: 24,
    borderTopWidth: 1,
  },
  modalCard: {
    width: "90%",
    alignSelf: "center",
    marginBottom: "auto",
    marginTop: "auto",
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  modalActionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  modalActionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
