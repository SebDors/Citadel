import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTheme } from "../../src/context/ThemeContext";
import { Button } from "../../src/components/UI/Button";
import { Card } from "../../src/components/UI/Card";
import { RestTimerBar } from "../../src/components/Workout/RestTimerBar";
import { useRouter } from "expo-router";
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import {
  Play,
  Plus,
  Flame,
  ChevronRight,
  MoreHorizontal,
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Copy,
  Trash2,
  X,
  Tag,
  Check,
  Import as ImportIcon,
  BookOpen,
  Dumbbell,
  Sparkles,
  Share2,
  TrendingUp,
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
  calculateEstimatedWorkoutMinutes,
  getAverageWorkoutDurationMinutes,
} from "../../src/types";
import { StorageService } from "../../src/services/storage";
import { ExportService } from "../../src/services/exportService";

function getActiveBannerSubtitle(session: WorkoutSession): string {
  if (session.hasStarted === false) {
    return "Séance en préparation · 00:00";
  }
  if (session.isPaused) {
    const mins = Math.floor((session.durationSeconds || 0) / 60);
    const secs = (session.durationSeconds || 0) % 60;
    const timeStr = `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
    return `Séance en pause · ${timeStr}`;
  }
  const blocks = getSessionBlocks(session);
  const circuitBlock = blocks.find(
    (b): b is CircuitBlock => b.type === "circuit",
  );

  if (circuitBlock || session.isCircuit) {
    const totalRounds = circuitBlock?.rounds || session.circuitRounds || 3;
    const isAmrap = circuitBlock?.circuitType === "amrap";

    if (circuitBlock) {
      const cState = session.circuitStates?.[circuitBlock.id];
      if (cState && cState.started) {
        const currentRound = cState.currentRound || 1;
        const validatedCount = Object.values(
          cState.roundStatusMap || {},
        ).filter((st) => st === "validated").length;

        if (isAmrap) {
          const roundsDone = cState.completedRoundsCount || 0;
          if (validatedCount > 0) {
            return `Tour ${currentRound} (AMRAP) · ${validatedCount} exo${validatedCount > 1 ? "s" : ""} validé${validatedCount > 1 ? "s" : ""}`;
          }
          return `${roundsDone} tour${roundsDone !== 1 ? "s" : ""} complété${roundsDone !== 1 ? "s" : ""}`;
        }

        if (validatedCount > 0) {
          return `Tour ${currentRound} / ${totalRounds} (${validatedCount} exo${validatedCount > 1 ? "s" : ""} validé${validatedCount > 1 ? "s" : ""})`;
        }
        return `Tour ${currentRound} / ${totalRounds}`;
      }
    }

    const currentRound = session.currentCircuitRound || 1;
    return `Tour ${currentRound} / ${totalRounds}`;
  }

  return `${session.completedSetsCount} / ${session.totalSetsCount} séries complétées`;
}

export default function WorkoutTab() {
  const {
    data,
    loading,
    activeSession,
    startWorkout,
    duplicateTemplate,
    deleteTemplate,
    renameTemplate,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderCollapse,
    moveTemplateToFolder,
    saveTemplate,
    markFirstSessionCreated,
    completeOnboarding,
    skipOnboarding,
    allExercises,
  } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();

  // Modals state
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [showTemplateMenuModal, setShowTemplateMenuModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showMoveFolderModal, setShowMoveFolderModal] = useState(false);

  const [showRenameTemplateModal, setShowRenameTemplateModal] = useState(false);
  const [renameTemplateTitle, setRenameTemplateTitle] = useState("");

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [selectedFolder, setSelectedFolder] = useState<WorkoutFolder | null>(
    null,
  );
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");

  // Compact cards state
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(
    {},
  );

  // Restauration de l'état de réduction des cartes depuis AsyncStorage au lancement
  useEffect(() => {
    let isMounted = true;
    StorageService.loadCollapsedCards().then((savedState) => {
      if (isMounted && savedState) {
        setCollapsedCards(savedState);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Animation de pulsation du bouton + Séance pendant le guidage première séance
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (data?.hasCompletedOnboarding && !data?.hasCreatedFirstSession) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [data?.hasCompletedOnboarding, data?.hasCreatedFirstSession]);

  const toggleCardCollapse = (id: string) => {
    setCollapsedCards((prev) => {
      const nextState = { ...prev, [id]: !prev[id] };
      StorageService.saveCollapsedCards(nextState);
      return nextState;
    });
  };

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
        "Séance importée avec succès !",
        `La séance "${finalTitle}" a été ajoutée à votre bibliothèque.`
      );
    } catch (error: any) {
      Alert.alert("Erreur d'importation", error?.message || "Impossible d'importer le fichier de séance.");
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

  // Group folders & unassigned templates alphabetically by name/title
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

  // FinTech Weekly Volume & Trend Calculations
  const { currentWeekVolume, weeklyTrendPercentage } = React.useMemo(() => {
    const history = data?.history || [];
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - dayOfWeek);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    let thisWeekVol = 0;
    let lastWeekVol = 0;

    history.forEach((s) => {
      const sDate = new Date(s.startTime);
      const vol = s.totalVolumeKg || 0;
      if (sDate >= startOfThisWeek) {
        thisWeekVol += vol;
      } else if (sDate >= startOfLastWeek && sDate < startOfThisWeek) {
        lastWeekVol += vol;
      }
    });

    let trend = 12;
    if (lastWeekVol > 0) {
      trend = Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100);
    } else if (thisWeekVol > 0) {
      trend = 100;
    }

    return {
      currentWeekVolume: Math.round(thisWeekVol),
      weeklyTrendPercentage: trend,
    };
  }, [data?.history]);

  const [activeFilter, setActiveFilter] = useState("Tout");

  const filterCategories = React.useMemo(() => {
    const cats = ["Tout"];
    folders.forEach((f) => {
      if (!cats.includes(f.name)) cats.push(f.name);
    });
    return cats;
  }, [folders]);

  const displayedTemplates = React.useMemo(() => {
    const all = data?.templates || [];
    if (activeFilter === "Tout") return all;
    const targetFolder = folders.find((f) => f.name === activeFilter);
    if (!targetFolder) return all;
    return all.filter((t) => targetFolder.templateIds.includes(t.id));
  }, [data?.templates, activeFilter, folders]);

  // Render a Workout Template as a Clean FinTech Flush Row
  const renderTemplateCard = (tpl: WorkoutTemplate) => {
    const blocks = getTemplateBlocks(tpl);
    let totalExercises = 0;
    const blockSummaries: string[] = [];

    blocks.forEach((block) => {
      if (block.type === "single") {
        totalExercises += 1;
        if (block.exercise.exerciseName) {
          blockSummaries.push(block.exercise.exerciseName);
        }
      } else if (block.type === "circuit") {
        totalExercises += block.exercises.length;
        blockSummaries.push(formatCircuitSummary(block));
      }
    });

    const estimatedMins = getAverageWorkoutDurationMinutes(tpl, data?.history);
    const timeTag = estimatedMins > 0 ? `${estimatedMins} min` : "45 min";
    const sub = `${totalExercises} exercices · ${blockSummaries.slice(0, 2).join(", ") || "Préparé"}`;

    return (
      <TouchableOpacity
        key={tpl.id}
        activeOpacity={0.7}
        onPress={() => handleStartTemplate(tpl.id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 4,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "#1F1F23",
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#1C1C1E",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Dumbbell size={19} color="#00C805" />
        </View>

        <View style={{ flex: 1, marginRight: 8 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#FFFFFF",
              letterSpacing: -0.2,
              marginBottom: 3,
            }}
            numberOfLines={1}
          >
            {tpl.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#8E8E93",
            }}
            numberOfLines={1}
          >
            {sub}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
          >
            {timeTag}
          </Text>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenTemplateMenu(tpl);
            }}
            style={{ marginTop: 4 }}
          >
            <MoreHorizontal size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TabSwipeWrapper tabIndex={0}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 },
          ]}
        >
          {/* 1. Solde de Performance Monumental (Trade Republic Style) */}
          <View style={{ paddingTop: 8, paddingBottom: 16 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#8E8E93",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              PORTEFEUILLE ATHLÉTIQUE // SEMAINE
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={{
                  fontSize: 44,
                  fontWeight: "900",
                  color: "#FFFFFF",
                  letterSpacing: -1,
                }}
              >
                {currentWeekVolume.toLocaleString("fr-FR")}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#8E8E93",
                  marginLeft: 6,
                }}
              >
                KG
              </Text>
            </View>

            {/* Micro-gélule de tendance */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                backgroundColor: "#07240E",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 9999,
                marginTop: 8,
              }}
            >
              <TrendingUp size={13} color="#00C805" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#00C805" }}>
                ▲ +{weeklyTrendPercentage}% cette semaine
              </Text>
            </View>
          </View>

          {/* 2. Ordre en Cours (Active Workout Banner) */}
          {activeSession && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/live-workout")}
              style={{
                backgroundColor: "#141416",
                borderWidth: 1,
                borderColor: "#00C805",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#00C805",
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: "#00C805",
                      letterSpacing: 0.8,
                    }}
                  >
                    ORDRE EN COURS · SÉANCE ACTIVE
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}
                  numberOfLines={1}
                >
                  {activeSession.title || "Entraînement libre"}
                </Text>
                <Text style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>
                  {getActiveBannerSubtitle(activeSession)}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#00C805",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: "#000000",
                    marginRight: 4,
                  }}
                >
                  Reprendre
                </Text>
                <ChevronRight size={14} color="#000000" />
              </View>
            </TouchableOpacity>
          )}

          {/* 3. Filtres en Capsules Horizontales (Trade Republic Chips) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {filterCategories.map((cat) => {
              const isActive = activeFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setActiveFilter(cat)}
                  style={{
                    backgroundColor: isActive ? "#FFFFFF" : "#1C1C1E",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 9999,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: isActive ? "#000000" : "#8E8E93",
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 4. Section Header: POSITIONS // SÉANCES & Actions Dossiers */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 10,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: "#1F1F23",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#8E8E93",
                letterSpacing: 1,
              }}
            >
              POSITIONS // SÉANCES ({displayedTemplates.length})
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TouchableOpacity
                onPress={handleImportTemplate}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <ImportIcon size={13} color="#00C805" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#00C805" }}>
                  Importer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowCreateFolderModal(true)}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <FolderPlus size={13} color="#00C805" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#00C805" }}>
                  + Dossier
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Liste des Séances (Lignes Affleurantes) */}
          {displayedTemplates.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: "#8E8E93" }}>
                Aucune séance dans cette sélection.
              </Text>
            </View>
          ) : (
            displayedTemplates.map((tpl) => renderTemplateCard(tpl))
          )}

          {/* 6. Bibliothèque d'Exercices en ligne épurée */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowLibraryModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 18,
              marginTop: 12,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: "#1F1F23",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#1C1C1E",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <BookOpen size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                Bibliothèque d'Exercices
              </Text>
              <Text style={{ fontSize: 13, color: "#8E8E93" }}>
                {allExercises.length} exercices référencés
              </Text>
            </View>
            <ChevronRight size={18} color="#8E8E93" />
          </TouchableOpacity>
        </ScrollView>

        {/* 7. Floating Action Bar Ancrée au Bas de l'Écran */}
        <View
          style={{
            position: "absolute",
            bottom: Platform.OS === "android" ? 18 : 26,
            left: 20,
            right: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStartFreestyle}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 9999,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Plus size={18} color="#000000" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#000000" }}>
              Entraînement Libre
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/template-editor")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#141416",
              borderWidth: 1,
              borderColor: "#2C2C2E",
              paddingVertical: 14,
              paddingHorizontal: 22,
              borderRadius: 9999,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
              Créer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Rest Timer Bar */}
        <RestTimerBar />

        {/* Modale Bibliothèque d'Exercices */}
        <ExerciseLibraryModal
          visible={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
        />

        {/* ---------------- MODALE MENU ... DE SÉANCE ---------------- */}
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
            <View
              style={[
                styles.menuModalContent,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <View style={styles.modalMenuHeader}>
                <Text
                  style={[styles.modalMenuTitle, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {selectedTemplate?.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTemplateMenuModal(false)}
                >
                  <X size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* 1. Démarrer */}
              <TouchableOpacity
                style={[
                  styles.menuOptionRow,
                  { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
                ]}
                onPress={() => {
                  setShowTemplateMenuModal(false);
                  if (selectedTemplate)
                    handleStartTemplate(selectedTemplate.id);
                }}
              >
                <Play size={18} color={theme.accent} fill={theme.accent} />
                <Text
                  style={[
                    styles.menuOptionText,
                    { color: theme.text, fontWeight: "800" },
                  ]}
                >
                  Démarrer la séance
                </Text>
              </TouchableOpacity>

              {/* 2. Modifier */}
              <TouchableOpacity
                style={[
                  styles.menuOptionRow,
                  { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
                ]}
                onPress={() => {
                  setShowTemplateMenuModal(false);
                  if (selectedTemplate) {
                    router.push({
                      pathname: "/template-editor",
                      params: { id: selectedTemplate.id },
                    });
                  }
                }}
              >
                <Edit2 size={18} color={theme.text} />
                <Text style={[styles.menuOptionText, { color: theme.text }]}>
                  Modifier la séance
                </Text>
              </TouchableOpacity>

              {/* 3. Renommer */}
              <TouchableOpacity
                style={[
                  styles.menuOptionRow,
                  { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
                ]}
                onPress={() => {
                  setShowTemplateMenuModal(false);
                  if (selectedTemplate) {
                    setRenameTemplateTitle(selectedTemplate.title);
                    setShowRenameTemplateModal(true);
                  }
                }}
              >
                <Tag size={18} color={theme.text} />
                <Text style={[styles.menuOptionText, { color: theme.text }]}>
                  Renommer
                </Text>
              </TouchableOpacity>

              {/* 4. Dupliquer */}
              <TouchableOpacity
                style={[
                  styles.menuOptionRow,
                  { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
                ]}
                onPress={() => {
                  setShowTemplateMenuModal(false);
                  if (selectedTemplate) {
                    duplicateTemplate(selectedTemplate.id);
                  }
                }}
              >
                <Copy size={18} color={theme.text} />
                <Text style={[styles.menuOptionText, { color: theme.text }]}>
                  Dupliquer la séance
                </Text>
              </TouchableOpacity>

              {/* 5. Partager la séance */}
              <TouchableOpacity
                style={[
                  styles.menuOptionRow,
                  { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
                ]}
                onPress={() => {
                  const tpl = selectedTemplate;
                  setShowTemplateMenuModal(false);
                  if (tpl) {
                    handleShareTemplate(tpl);
                  }
                }}
              >
                <Share2 size={18} color={theme.text} />
                <Text style={[styles.menuOptionText, { color: theme.text }]}>
                  Partager la séance (.json)
                </Text>
              </TouchableOpacity>

              {/* Déplacer dans un dossier */}
              <TouchableOpacity
                style={[
                  styles.menuOptionRow,
                  { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
                ]}
                onPress={() => {
                  setShowTemplateMenuModal(false);
                  setShowMoveFolderModal(true);
                }}
              >
                <FolderPlus size={18} color={theme.text} />
                <Text style={[styles.menuOptionText, { color: theme.text }]}>
                  Déplacer dans un dossier
                </Text>
              </TouchableOpacity>

              {/* Supprimer (sans bordure inférieure) */}
              <TouchableOpacity
                style={[styles.menuOptionRow, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowTemplateMenuModal(false);
                  if (selectedTemplate) {
                    deleteTemplate(selectedTemplate.id);
                  }
                }}
              >
                <Trash2 size={18} color={theme.danger} />
                <Text style={[styles.menuOptionText, { color: theme.danger }]}>
                  Supprimer la séance
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ---------------- MODALE RENOMMER SÉANCE ---------------- */}
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
            <View
              style={[
                styles.inputModalContent,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Renommer la séance
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
                value={renameTemplateTitle}
                onChangeText={setRenameTemplateTitle}
                placeholder="Nouveau titre..."
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
              <View style={styles.modalBtnRow}>
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={() => setShowRenameTemplateModal(false)}
                  style={{ flex: 1, marginRight: 6 }}
                />
                <Button
                  title="Enregistrer"
                  variant="primary"
                  onPress={handleConfirmRenameTemplate}
                  style={{ flex: 1, marginLeft: 6 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ---------------- MODALE CRÉATION DOSSIER ---------------- */}
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
            <View
              style={[
                styles.inputModalContent,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Nouveau Dossier
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
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="ex: Prise de masse, Upper/Lower..."
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
              <View style={styles.modalBtnRow}>
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={() => setShowCreateFolderModal(false)}
                  style={{ flex: 1, marginRight: 6 }}
                />
                <Button
                  title="Créer"
                  variant="primary"
                  onPress={handleConfirmCreateFolder}
                  style={{ flex: 1, marginLeft: 6 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ---------------- MODALE RENOMMER DOSSIER ---------------- */}
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
            <View
              style={[
                styles.inputModalContent,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Renommer le dossier
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
                value={renameFolderName}
                onChangeText={setRenameFolderName}
                placeholder="Nom du dossier..."
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
              <View style={styles.modalBtnRow}>
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={() => setShowRenameFolderModal(false)}
                  style={{ flex: 1, marginRight: 6 }}
                />
                <Button
                  title="Enregistrer"
                  variant="primary"
                  onPress={handleConfirmRenameFolder}
                  style={{ flex: 1, marginLeft: 6 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ---------------- MODALE DÉPLACER DANS UN DOSSIER ---------------- */}
        <Modal
          visible={showMoveFolderModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMoveFolderModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMoveFolderModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.menuModalContent,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <View style={styles.modalMenuHeader}>
                <Text
                  style={[styles.modalMenuTitle, { color: theme.text }]}
                  numberOfLines={1}
                >
                  Déplacer "{selectedTemplate?.title}"
                </Text>
                <TouchableOpacity onPress={() => setShowMoveFolderModal(false)}>
                  <X size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 280 }}>
                {/* Option Aucun dossier (Hors dossier) */}
                <TouchableOpacity
                  style={[
                    styles.menuOptionRow,
                    {
                      borderBottomColor: theme.border,
                      justifyContent: "space-between",
                    },
                  ]}
                  onPress={async () => {
                    if (selectedTemplate) {
                      await moveTemplateToFolder(selectedTemplate.id, null);
                      setShowMoveFolderModal(false);
                    }
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      marginRight: 8,
                    }}
                  >
                    <Folder size={18} color={theme.textMuted} />
                    <Text
                      style={[styles.menuOptionText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      Aucun dossier (Hors dossier)
                    </Text>
                  </View>
                  {isNoFolderSelected && (
                    <Check size={18} color={theme.accent} />
                  )}
                </TouchableOpacity>

                {/* Dossiers existants */}
                {folders.map((f) => {
                  const isSelected = currentFolder?.id === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.menuOptionRow,
                        {
                          borderBottomColor: theme.border,
                          justifyContent: "space-between",
                        },
                      ]}
                      onPress={async () => {
                        if (selectedTemplate) {
                          await moveTemplateToFolder(selectedTemplate.id, f.id);
                          setShowMoveFolderModal(false);
                        }
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        <Folder size={18} color={theme.accent} />
                        <Text
                          style={[styles.menuOptionText, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color={theme.accent} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Bouton + Créer un nouveau dossier */}
              <TouchableOpacity
                style={[
                  styles.createNewFolderOption,
                  { borderColor: theme.accent, backgroundColor: theme.surface },
                ]}
                onPress={() => {
                  setShowMoveFolderModal(false);
                  setShowCreateFolderModal(true);
                }}
              >
                <Plus
                  size={16}
                  color={theme.accent}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.createNewFolderText, { color: theme.accent }]}
                >
                  + Créer un nouveau dossier
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ---------------- MODALE DE PREMIÈRE UTILISATION (ONBOARDING) ---------------- */}
        <OnboardingModal
          visible={!loading && !!data && !data.hasCompletedOnboarding}
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
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
    padding: 12,
    paddingTop: 2,
    paddingBottom: 20,
  },
  pageHeader: {
    marginTop: 2,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "900",
  },
  activeBanner: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  activeBannerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  activeBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  activeBannerSub: {
    fontSize: 11,
  },
  resumeBtn: {
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 14,
  },
  mainActionBox: {
    flex: 1.8,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
  },
  playIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  mainActionSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
  },
  createActionBox: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  createActionTitle: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sectionSubTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  newFolderBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  newFolderText: {
    fontSize: 11,
    fontWeight: "700",
  },
  folderContainer: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  folderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  folderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  folderTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  folderBadgeCount: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 8,
    overflow: "hidden",
  },
  folderBody: {
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  emptyFolderText: {
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  programCard: {
    marginBottom: 10,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitleArea: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  exCountText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  cardHeaderIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 5,
    marginLeft: 4,
  },
  inlineExText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    marginVertical: 8,
  },
  recapBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  recapBar: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  recapTextRow: {
    flex: 1,
  },
  recapSub: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  recapDate: {
    fontSize: 11,
    fontWeight: "700",
  },
  startBtn: {
    borderRadius: 10,
    paddingVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  libraryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  libraryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  libraryTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  librarySub: {
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  modalMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalMenuTitle: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  menuOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuOptionText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  inputModalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compactCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactTitleArea: {
    flex: 1,
    marginRight: 8,
  },
  compactActionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactStartBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 0,
    marginRight: 4,
  },
  compactStartBtnText: {
    fontSize: 13,
  },
  createNewFolderOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  createNewFolderText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyStateBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  guidedBanner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  guidedBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  guidedStepBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  guidedStepText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  guidedBannerTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  guidedBannerSub: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
});
