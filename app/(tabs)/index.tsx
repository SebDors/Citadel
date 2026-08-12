import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
} from 'react-native';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/UI/Button';
import { Card } from '../../src/components/UI/Card';
import { RestTimerBar } from '../../src/components/Workout/RestTimerBar';
import { useRouter } from 'expo-router';
import {
  Play,
  Plus,
  Flame,
  TrendingUp,
  ChevronRight,
  MoreHorizontal,
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Copy,
  Trash2,
  Share2,
  X,
  Tag,
} from 'lucide-react-native';
import {
  WorkoutSession,
  WorkoutTemplate,
  WorkoutFolder,
  CircuitBlock,
  getRealLastWorkoutDate,
  getTemplateBlocks,
  getSessionBlocks,
} from '../../src/types';
import { JsonExportService } from '../../src/services/jsonExport';

function getActiveBannerSubtitle(session: WorkoutSession): string {
  const blocks = getSessionBlocks(session);
  const circuitBlock = blocks.find((b): b is CircuitBlock => b.type === 'circuit');

  if (circuitBlock || session.isCircuit) {
    const totalRounds = circuitBlock?.rounds || session.circuitRounds || 3;
    const isAmrap = circuitBlock?.circuitType === 'amrap';

    if (circuitBlock) {
      const cState = session.circuitStates?.[circuitBlock.id];
      if (cState && cState.started) {
        const currentRound = cState.currentRound || 1;
        const validatedCount = Object.values(cState.roundStatusMap || {}).filter(
          (st) => st === 'validated'
        ).length;

        if (isAmrap) {
          const roundsDone = cState.completedRoundsCount || 0;
          if (validatedCount > 0) {
            return `Tour ${currentRound} (AMRAP) · ${validatedCount} exo${validatedCount > 1 ? 's' : ''} validé${validatedCount > 1 ? 's' : ''}`;
          }
          return `${roundsDone} tour${roundsDone !== 1 ? 's' : ''} complété${roundsDone !== 1 ? 's' : ''}`;
        }

        if (validatedCount > 0) {
          return `Tour ${currentRound} / ${totalRounds} (${validatedCount} exo${validatedCount > 1 ? 's' : ''} validé${validatedCount > 1 ? 's' : ''})`;
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
    activeSession,
    startWorkout,
    duplicateTemplate,
    deleteTemplate,
    renameTemplate,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderCollapse,
  } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();

  // Modals state
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [showTemplateMenuModal, setShowTemplateMenuModal] = useState(false);

  const [showRenameTemplateModal, setShowRenameTemplateModal] = useState(false);
  const [renameTemplateTitle, setRenameTemplateTitle] = useState('');

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [selectedFolder, setSelectedFolder] = useState<WorkoutFolder | null>(null);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');

  // Compact cards state
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  const toggleCardCollapse = (id: string) => {
    setCollapsedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartFreestyle = () => {
    startWorkout();
    router.push('/live-workout');
  };

  const handleStartTemplate = (templateId: string) => {
    const tpl = data?.templates.find((t) => t.id === templateId);
    if (tpl) {
      startWorkout(tpl);
      router.push('/live-workout');
    }
  };

  const handleOpenTemplateMenu = (tpl: WorkoutTemplate) => {
    setSelectedTemplate(tpl);
    setShowTemplateMenuModal(true);
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
      setNewFolderName('');
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

  const handleExportTemplateJson = async (tpl: WorkoutTemplate) => {
    setShowTemplateMenuModal(false);
    await JsonExportService.shareBlankTemplateJson(tpl);
  };

  // Group templates by folder
  const folders = data?.folders || [];
  const templatesInFolders = new Set(folders.flatMap((f) => f.templateIds));
  const unassignedTemplates = (data?.templates || []).filter((t) => !templatesInFolders.has(t.id));

  // Render a Workout Template Card (High Density layout)
  const renderTemplateCard = (tpl: WorkoutTemplate) => {
    const isCompact = !!collapsedCards[tpl.id];
    const blocks = getTemplateBlocks(tpl);

    let totalExercises = 0;
    let hasCircuit = false;

    const blockSummaries: string[] = [];

    blocks.forEach((block) => {
      if (block.type === 'single') {
        totalExercises += 1;
        if (block.exercise.exerciseName) {
          blockSummaries.push(block.exercise.exerciseName);
        }
      } else if (block.type === 'circuit') {
        hasCircuit = true;
        totalExercises += block.exercises.length;
        const title = block.title || 'Circuit';
        const roundsText = `${block.rounds} tour${block.rounds > 1 ? 's' : ''}`;
        const exosText = `${block.exercises.length} exo${block.exercises.length > 1 ? 's' : ''}`;
        blockSummaries.push(`${title} (${roundsText} · ${exosText})`);
      }
    });

    const inlineExercisesText = blockSummaries.join(' · ') || 'Aucun exercice';
    const realLast = getRealLastWorkoutDate(data?.history || [], tpl.title);

    if (isCompact) {
      return (
        <Card key={tpl.id} style={[styles.programCard, { padding: 10 }]}>
          <View style={styles.compactCardRow}>
            <View style={styles.compactTitleArea}>
              <Text style={[styles.templateTitle, { color: theme.text }]} numberOfLines={1}>
                {tpl.title}
              </Text>
              <Text style={[styles.exCountText, { color: theme.textMuted }]}>
                {totalExercises} exos {hasCircuit ? '· ⚡ CIRCUIT' : ''}
              </Text>
            </View>

            <View style={styles.compactActionsRow}>
              <Button
                title="Démarrer"
                variant="primary"
                onPress={() => handleStartTemplate(tpl.id)}
                icon={<Play size={12} color="#FFFFFF" fill="#FFFFFF" />}
                style={styles.compactStartBtn}
                textStyle={styles.compactStartBtnText}
              />
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => toggleCardCollapse(tpl.id)}
                accessibilityLabel="Déplier la séance"
              >
                <ChevronDown size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      );
    }

    return (
      <Card key={tpl.id} style={[styles.programCard, { padding: 12 }]}>
        {/* Card Header: Title + Graph Icon + Options + Collapse Toggle */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleArea}>
            <Text style={[styles.templateTitle, { color: theme.text }]} numberOfLines={1}>
              {tpl.title}
            </Text>
            <Text style={[styles.exCountText, { color: theme.textMuted }]}>
              {totalExercises} exos {hasCircuit ? '· ⚡ CIRCUIT' : ''}
            </Text>
          </View>

          <View style={styles.cardHeaderIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push({ pathname: '/workout-analytics', params: { id: tpl.id } })}
            >
              <TrendingUp size={17} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenTemplateMenu(tpl)}>
              <MoreHorizontal size={19} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => toggleCardCollapse(tpl.id)}
              accessibilityLabel="Réduire la séance"
            >
              <ChevronUp size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline Exercises List */}
        <Text style={[styles.inlineExText, { color: theme.textMuted }]} numberOfLines={2}>
          {inlineExercisesText}
        </Text>

        {/* Last Workout Date Badge (Only displayed if realLast exists) */}
        {realLast && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.recapBadge, { backgroundColor: theme.surface }]}
            onPress={() => {
              router.push({ pathname: '/workout-analytics', params: { id: tpl.id } });
            }}
          >
            <View style={[styles.recapBar, { backgroundColor: theme.accent }]} />
            <View style={styles.recapTextRow}>
              <Text style={[styles.recapSub, { color: theme.textMuted }]}>DERNIER ENTRAÎNEMENT</Text>
              <Text style={[styles.recapDate, { color: theme.text }]}>
                {`${realLast.dateFormatted} - voir le récap`}
              </Text>
            </View>
            <ChevronRight size={14} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        {/* Big Green/Accent Start Button */}
        <Button
          title="Démarrer"
          variant="primary"
          onPress={() => handleStartTemplate(tpl.id)}
          icon={<Play size={14} color="#FFFFFF" fill="#FFFFFF" />}
          style={styles.startBtn}
        />
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.appTitle, { color: theme.text }]}>Séances</Text>
        </View>

        {/* Active Workout Banner */}
        {activeSession && (
          <View style={[styles.activeBanner, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
            <View style={styles.activeBannerInfo}>
              <Flame size={20} color={theme.accent} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeBannerTitle, { color: theme.text }]} numberOfLines={1}>
                  Séance en cours : {activeSession.title}
                </Text>
                <Text style={[styles.activeBannerSub, { color: theme.textMuted }]}>
                  {getActiveBannerSubtitle(activeSession)}
                </Text>
              </View>
            </View>
            <Button title="Reprendre" variant="primary" onPress={() => router.push('/live-workout')} style={styles.resumeBtn} />
          </View>
        )}

        {/* Top Action Buttons (Side by Side) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.mainActionBox, { backgroundColor: theme.accent }]}
            onPress={handleStartFreestyle}
          >
            <View style={styles.playIconCircle}>
              <Play size={16} color={theme.accent} fill={theme.accent} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.mainActionTitle}>Entraînement libre</Text>
              <Text style={styles.mainActionSub}>Démarre direct sans plan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.createActionBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/template-editor')}
          >
            <Plus size={22} color={theme.text} />
            <Text style={[styles.createActionTitle, { color: theme.text }]}>SÉANCE</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header with "Nouveau dossier" button */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MES DOSSIERS & SÉANCES</Text>
          <TouchableOpacity
            style={[styles.newFolderBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => setShowCreateFolderModal(true)}
          >
            <FolderPlus size={14} color={theme.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.newFolderText, { color: theme.accent }]}>Nouveau dossier</Text>
          </TouchableOpacity>
        </View>

        {/* Folders List */}
        {folders.map((folder) => {
          const folderTemplates = (data?.templates || []).filter((t) => folder.templateIds.includes(t.id));
          const isCollapsed = !!folder.isCollapsed;

          return (
            <View key={folder.id} style={[styles.folderContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.folderHeader}
                onPress={() => toggleFolderCollapse(folder.id)}
              >
                <View style={styles.folderHeaderLeft}>
                  <Folder size={18} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.folderTitle, { color: theme.text }]}>{folder.name}</Text>
                  <Text style={[styles.folderBadgeCount, { color: theme.textMuted, backgroundColor: theme.cardBg }]}>
                    {folderTemplates.length}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{ padding: 4, marginRight: 4 }}
                    onPress={() => {
                      setSelectedFolder(folder);
                      setRenameFolderName(folder.name);
                      setShowRenameFolderModal(true);
                    }}
                  >
                    <Edit2 size={15} color={theme.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 4, marginRight: 4 }}
                    onPress={() => deleteFolder(folder.id)}
                  >
                    <Trash2 size={15} color={theme.danger} />
                  </TouchableOpacity>

                  {isCollapsed ? <ChevronRight size={18} color={theme.textMuted} /> : <ChevronDown size={18} color={theme.textMuted} />}
                </View>
              </TouchableOpacity>

              {!isCollapsed && (
                <View style={styles.folderBody}>
                  {folderTemplates.length === 0 ? (
                    <Text style={[styles.emptyFolderText, { color: theme.textMuted }]}>
                      Aucune séance dans ce dossier.
                    </Text>
                  ) : (
                    folderTemplates.map((tpl) => renderTemplateCard(tpl))
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Unassigned Templates Section */}
        {unassignedTemplates.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {folders.length > 0 && (
              <Text style={[styles.sectionSubTitle, { color: theme.textMuted }]}>AUTRES SÉANCES</Text>
            )}
            {unassignedTemplates.map((tpl) => renderTemplateCard(tpl))}
          </View>
        )}
      </ScrollView>

      {/* Floating Rest Timer Bar */}
      <RestTimerBar />

      {/* ---------------- MODALE MENU ... DE SÉANCE ---------------- */}
      <Modal visible={showTemplateMenuModal} transparent animationType="fade" onRequestClose={() => setShowTemplateMenuModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTemplateMenuModal(false)}>
          <View style={[styles.menuModalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalMenuHeader}>
              <Text style={[styles.modalMenuTitle, { color: theme.text }]} numberOfLines={1}>
                {selectedTemplate?.title}
              </Text>
              <TouchableOpacity onPress={() => setShowTemplateMenuModal(false)}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* 1. Démarrer */}
            <TouchableOpacity
              style={[styles.menuOptionRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) handleStartTemplate(selectedTemplate.id);
              }}
            >
              <Play size={18} color={theme.accent} fill={theme.accent} />
              <Text style={[styles.menuOptionText, { color: theme.text, fontWeight: '800' }]}>Démarrer la séance</Text>
            </TouchableOpacity>

            {/* 2. Modifier */}
            <TouchableOpacity
              style={[styles.menuOptionRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  router.push({ pathname: '/template-editor', params: { id: selectedTemplate.id } });
                }
              }}
            >
              <Edit2 size={18} color={theme.text} />
              <Text style={[styles.menuOptionText, { color: theme.text }]}>Modifier la séance</Text>
            </TouchableOpacity>

            {/* 3. Renommer */}
            <TouchableOpacity
              style={[styles.menuOptionRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  setRenameTemplateTitle(selectedTemplate.title);
                  setShowRenameTemplateModal(true);
                }
              }}
            >
              <Tag size={18} color={theme.text} />
              <Text style={[styles.menuOptionText, { color: theme.text }]}>Renommer</Text>
            </TouchableOpacity>

            {/* 4. Dupliquer */}
            <TouchableOpacity
              style={[styles.menuOptionRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  duplicateTemplate(selectedTemplate.id);
                }
              }}
            >
              <Copy size={18} color={theme.text} />
              <Text style={[styles.menuOptionText, { color: theme.text }]}>Dupliquer la séance</Text>
            </TouchableOpacity>

            {/* 5. Exporter JSON (Séance vierge) */}
            <TouchableOpacity
              style={[styles.menuOptionRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                if (selectedTemplate) handleExportTemplateJson(selectedTemplate);
              }}
            >
              <Share2 size={18} color={theme.text} />
              <Text style={[styles.menuOptionText, { color: theme.text }]}>Exporter JSON (Séance vierge)</Text>
            </TouchableOpacity>

            {/* 6. Supprimer */}
            <TouchableOpacity
              style={styles.menuOptionRow}
              onPress={() => {
                setShowTemplateMenuModal(false);
                if (selectedTemplate) {
                  deleteTemplate(selectedTemplate.id);
                }
              }}
            >
              <Trash2 size={18} color={theme.danger} />
              <Text style={[styles.menuOptionText, { color: theme.danger }]}>Supprimer la séance</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ---------------- MODALE RENOMMER SÉANCE ---------------- */}
      <Modal visible={showRenameTemplateModal} transparent animationType="fade" onRequestClose={() => setShowRenameTemplateModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRenameTemplateModal(false)}>
          <View style={[styles.inputModalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Renommer la séance</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              value={renameTemplateTitle}
              onChangeText={setRenameTemplateTitle}
              placeholder="Nouveau titre..."
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <Button title="Annuler" variant="outline" onPress={() => setShowRenameTemplateModal(false)} style={{ flex: 1, marginRight: 6 }} />
              <Button title="Enregistrer" variant="primary" onPress={handleConfirmRenameTemplate} style={{ flex: 1, marginLeft: 6 }} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ---------------- MODALE CRÉATION DOSSIER ---------------- */}
      <Modal visible={showCreateFolderModal} transparent animationType="fade" onRequestClose={() => setShowCreateFolderModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreateFolderModal(false)}>
          <View style={[styles.inputModalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Nouveau Dossier</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="ex: Prise de masse, Upper/Lower..."
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <Button title="Annuler" variant="outline" onPress={() => setShowCreateFolderModal(false)} style={{ flex: 1, marginRight: 6 }} />
              <Button title="Créer" variant="primary" onPress={handleConfirmCreateFolder} style={{ flex: 1, marginLeft: 6 }} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ---------------- MODALE RENOMMER DOSSIER ---------------- */}
      <Modal visible={showRenameFolderModal} transparent animationType="fade" onRequestClose={() => setShowRenameFolderModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRenameFolderModal(false)}>
          <View style={[styles.inputModalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Renommer le dossier</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              value={renameFolderName}
              onChangeText={setRenameFolderName}
              placeholder="Nom du dossier..."
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <Button title="Annuler" variant="outline" onPress={() => setShowRenameFolderModal(false)} style={{ flex: 1, marginRight: 6 }} />
              <Button title="Enregistrer" variant="primary" onPress={handleConfirmRenameFolder} style={{ flex: 1, marginLeft: 6 }} />
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
    paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 110,
  },
  pageHeader: {
    marginTop: 6,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  activeBanner: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  activeBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  activeBannerSub: {
    fontSize: 11,
  },
  resumeBtn: {
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  mainActionBox: {
    flex: 0.66,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
  },
  playIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  mainActionSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
  },
  createActionBox: {
    flex: 0.31,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  createActionTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSubTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  newFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  newFolderText: {
    fontSize: 11,
    fontWeight: '700',
  },
  folderContainer: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  folderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  folderBadgeCount: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 8,
    overflow: 'hidden',
  },
  folderBody: {
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  emptyFolderText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  programCard: {
    marginBottom: 10,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleArea: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  exCountText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  cardHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 5,
    marginLeft: 4,
  },
  inlineExText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginVertical: 8,
  },
  recapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recapDate: {
    fontSize: 11,
    fontWeight: '700',
  },
  startBtn: {
    borderRadius: 10,
    paddingVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalMenuTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  menuOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  inputModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTitleArea: {
    flex: 1,
    marginRight: 8,
  },
  compactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
