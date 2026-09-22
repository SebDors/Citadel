import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  WorkoutSession,
  SingleExerciseBlock,
  CircuitBlock,
  WorkoutBlock,
  WorkoutSet,
  getSessionBlocks,
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useRouter } from 'expo-router';
import { formatWeight } from '../../utils/numberUtils';
import {
  X,
  Clock,
  Dumbbell,
  CheckCircle2,
  BookmarkPlus,
  RotateCw,
  Edit2,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Check,
  Search,
} from 'lucide-react-native';
import { CustomNumericKeypad, NumericFieldType } from '../UI/CustomNumericKeypad';
import { SharedExercise } from '../../constants/exerciseDatabase';

interface PastSessionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
}

export const PastSessionDetailModal: React.FC<PastSessionDetailModalProps> = ({
  visible,
  onClose,
  session,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { updatePastWorkout, deleteWorkoutSession, allExercises } = useWorkout();

  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(session);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('18:00');
  const [editDurationMin, setEditDurationMin] = useState('45');
  const [editBlocks, setEditBlocks] = useState<WorkoutBlock[]>([]);

  // Keypad & Exercise selector state
  const [keypadTarget, setKeypadTarget] = useState<{
    blockId: string;
    setId: string;
    field: NumericFieldType;
    setNumber: number;
    value: string;
  } | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return allExercises;
    const q = searchQuery.toLowerCase();
    return allExercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        (ex.primaryMuscle && ex.primaryMuscle.toLowerCase().includes(q))
    );
  }, [allExercises, searchQuery]);

  useEffect(() => {
    if (session) {
      setCurrentSession(session);
      setIsEditing(false);
      setKeypadTarget(null);
      setShowExerciseSelector(false);
    }
  }, [session, visible]);

  if (!currentSession) return null;

  const formattedDate = new Date(currentSession.startTime).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(currentSession.startTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const blocks = getSessionBlocks(currentSession);

  const handleConvertToTemplate = () => {
    onClose();
    router.push({ pathname: '/template-editor', params: { fromSessionId: currentSession.id } });
  };

  const handleStartEdit = () => {
    setEditTitle(currentSession.title || 'Séance');
    const d = new Date(currentSession.startTime);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    setEditDate(`${day}/${month}/${year}`);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    setEditTime(`${hours}:${minutes}`);
    setEditDurationMin(String(Math.max(1, Math.round((currentSession.durationSeconds || 2700) / 60))));
    setEditBlocks(JSON.parse(JSON.stringify(getSessionBlocks(currentSession))));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setKeypadTarget(null);
    setShowExerciseSelector(false);
  };

  const handleDeleteSession = () => {
    Alert.alert(
      'Supprimer cette séance',
      'Êtes-vous sûr de vouloir supprimer définitivement cette séance de votre historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutSession(currentSession.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleAddSet = (blockId: string) => {
    setEditBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === 'single') {
          const lastSet = b.exercise.sets[b.exercise.sets.length - 1];
          const newSet: WorkoutSet = {
            id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            setNumber: b.exercise.sets.length + 1,
            type: lastSet ? lastSet.type : 'normal',
            completed: true,
            weightKg: lastSet?.weightKg,
            reps: lastSet?.reps,
            rir: lastSet?.rir,
          };
          return {
            ...b,
            exercise: {
              ...b.exercise,
              sets: [...b.exercise.sets, newSet],
            },
          };
        }
        return b;
      })
    );
  };

  const handleRemoveSet = (blockId: string, setId: string) => {
    setEditBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === 'single') {
          return {
            ...b,
            exercise: {
              ...b.exercise,
              sets: b.exercise.sets
                .filter((s) => s.id !== setId)
                .map((s, idx) => ({ ...s, setNumber: idx + 1 })),
            },
          };
        }
        return b;
      })
    );
  };

  const handleRemoveBlock = (blockId: string) => {
    setEditBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const handleAddExercise = (ex: SharedExercise) => {
    const newBlock: SingleExerciseBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'single',
      exercise: {
        id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        exerciseId: ex.id,
        exerciseName: ex.name,
        primaryMuscle: ex.primaryMuscle,
        targetMuscles: ex.targetMuscles || [],
        restSeconds: 90,
        sets: [
          {
            id: `set_${Date.now()}_1`,
            setNumber: 1,
            type: 'normal',
            completed: true,
            weightKg: undefined,
            reps: 10,
          },
        ],
      },
    };
    setEditBlocks((prev) => [...prev, newBlock]);
    setShowExerciseSelector(false);
  };

  const handleCommitSetField = useCallback(
    (blockId: string, setId: string, field: NumericFieldType, rawVal: string) => {
      const num = parseFloat(rawVal);
      const cleanNum = isNaN(num) ? undefined : num;
      setEditBlocks((prev) =>
        prev.map((b) => {
          if (b.id === blockId && b.type === 'single') {
            return {
              ...b,
              exercise: {
                ...b.exercise,
                sets: b.exercise.sets.map((s) =>
                  s.id === setId ? { ...s, [field]: cleanNum } : s
                ),
              },
            };
          }
          return b;
        })
      );
    },
    []
  );

  const isLastWorkoutField = useMemo(() => {
    if (!keypadTarget) return false;
    if (keypadTarget.field !== 'rir') return false;
    const currentBlock = editBlocks.find((b) => b.id === keypadTarget.blockId);
    if (!currentBlock || currentBlock.type !== 'single') return true;
    const sets = currentBlock.exercise.sets;
    const setIdx = sets.findIndex((s) => s.id === keypadTarget.setId);
    if (setIdx !== sets.length - 1) return false;
    const blockIdx = editBlocks.findIndex((b) => b.id === keypadTarget.blockId);
    for (let i = blockIdx + 1; i < editBlocks.length; i++) {
      const nb = editBlocks[i];
      if (nb.type === 'single' && (nb as SingleExerciseBlock).exercise.sets.length > 0) {
        return false;
      }
    }
    return true;
  }, [keypadTarget, editBlocks]);

  const handleKeypadNext = useCallback(
    (currentVal: string) => {
      if (!keypadTarget) return;
      const { blockId, setId, field } = keypadTarget;
      handleCommitSetField(blockId, setId, field, currentVal);

      const currentBlock = editBlocks.find((b) => b.id === blockId);
      if (!currentBlock || currentBlock.type !== 'single') {
        setKeypadTarget(null);
        return;
      }

      const sets = currentBlock.exercise.sets;
      const currentSetIndex = sets.findIndex((s) => s.id === setId);
      if (currentSetIndex === -1) {
        setKeypadTarget(null);
        return;
      }
      const currentSet = sets[currentSetIndex];

      if (field === 'weightKg') {
        setKeypadTarget({
          blockId,
          setId: currentSet.id,
          field: 'reps',
          setNumber: currentSet.setNumber,
          value: currentSet.reps !== undefined && currentSet.reps !== null ? String(currentSet.reps) : '',
        });
      } else if (field === 'reps') {
        setKeypadTarget({
          blockId,
          setId: currentSet.id,
          field: 'rir',
          setNumber: currentSet.setNumber,
          value: currentSet.rir !== undefined && currentSet.rir !== null ? String(currentSet.rir) : '',
        });
      } else {
        if (currentSetIndex < sets.length - 1) {
          const nextSet = sets[currentSetIndex + 1];
          setKeypadTarget({
            blockId,
            setId: nextSet.id,
            field: 'weightKg',
            setNumber: nextSet.setNumber,
            value: nextSet.weightKg !== undefined && nextSet.weightKg !== null ? String(nextSet.weightKg) : '',
          });
        } else {
          const blockIndex = editBlocks.findIndex((b) => b.id === blockId);
          let foundNext = false;
          for (let i = blockIndex + 1; i < editBlocks.length; i++) {
            const nb = editBlocks[i];
            if (nb.type === 'single' && nb.exercise.sets.length > 0) {
              const firstSet = nb.exercise.sets[0];
              setKeypadTarget({
                blockId: nb.id,
                setId: firstSet.id,
                field: 'weightKg',
                setNumber: firstSet.setNumber,
                value: firstSet.weightKg !== undefined && firstSet.weightKg !== null ? String(firstSet.weightKg) : '',
              });
              foundNext = true;
              break;
            }
          }
          if (!foundNext) {
            setKeypadTarget(null);
          }
        }
      }
    },
    [keypadTarget, editBlocks, handleCommitSetField]
  );

  const handleKeypadPrevious = useCallback(
    (currentVal: string) => {
      if (!keypadTarget) return;
      const { blockId, setId, field } = keypadTarget;
      handleCommitSetField(blockId, setId, field, currentVal);

      const currentBlock = editBlocks.find((b) => b.id === blockId);
      if (!currentBlock || currentBlock.type !== 'single') {
        setKeypadTarget(null);
        return;
      }

      const sets = currentBlock.exercise.sets;
      const currentSetIndex = sets.findIndex((s) => s.id === setId);
      if (currentSetIndex === -1) {
        setKeypadTarget(null);
        return;
      }
      const currentSet = sets[currentSetIndex];

      if (field === 'rir') {
        setKeypadTarget({
          blockId,
          setId: currentSet.id,
          field: 'reps',
          setNumber: currentSet.setNumber,
          value: currentSet.reps !== undefined && currentSet.reps !== null ? String(currentSet.reps) : '',
        });
      } else if (field === 'reps') {
        setKeypadTarget({
          blockId,
          setId: currentSet.id,
          field: 'weightKg',
          setNumber: currentSet.setNumber,
          value: currentSet.weightKg !== undefined && currentSet.weightKg !== null ? String(currentSet.weightKg) : '',
        });
      } else {
        if (currentSetIndex > 0) {
          const prevSet = sets[currentSetIndex - 1];
          setKeypadTarget({
            blockId,
            setId: prevSet.id,
            field: 'rir',
            setNumber: prevSet.setNumber,
            value: prevSet.rir !== undefined && prevSet.rir !== null ? String(prevSet.rir) : '',
          });
        } else {
          const blockIndex = editBlocks.findIndex((b) => b.id === blockId);
          let foundPrev = false;
          for (let i = blockIndex - 1; i >= 0; i--) {
            const pb = editBlocks[i];
            if (pb.type === 'single' && pb.exercise.sets.length > 0) {
              const lastSet = pb.exercise.sets[pb.exercise.sets.length - 1];
              setKeypadTarget({
                blockId: pb.id,
                setId: lastSet.id,
                field: 'rir',
                setNumber: lastSet.setNumber,
                value: lastSet.rir !== undefined && lastSet.rir !== null ? String(lastSet.rir) : '',
              });
              foundPrev = true;
              break;
            }
          }
          if (!foundPrev) {
            setKeypadTarget(null);
          }
        }
      }
    },
    [keypadTarget, editBlocks, handleCommitSetField]
  );

  const handleKeypadValidate = useCallback(
    (finalVal: string) => {
      if (!keypadTarget) return;
      handleCommitSetField(keypadTarget.blockId, keypadTarget.setId, keypadTarget.field, finalVal);
      setKeypadTarget(null);
    },
    [keypadTarget, handleCommitSetField]
  );

  const handleKeypadClose = useCallback(
    (currentVal?: string) => {
      if (keypadTarget && currentVal !== undefined) {
        handleCommitSetField(keypadTarget.blockId, keypadTarget.setId, keypadTarget.field, currentVal);
      }
      setKeypadTarget(null);
    },
    [keypadTarget, handleCommitSetField]
  );

  const handleSaveEdit = async () => {
    const cleanDate = editDate.trim().replace(/-/g, '/');
    const parts = cleanDate.split('/');
    let isoDate = '';
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parts[2].trim();
      if (y.length === 2) y = `20${y}`;
      isoDate = `${y}-${m}-${d}`;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      Alert.alert('Format de date invalide', 'Veuillez saisir la date au format JJ/MM/AAAA (ex: 29/08/2026)');
      return;
    }

    let startD = new Date(`${isoDate}T${editTime.trim() || '18:00'}:00`);
    if (isNaN(startD.getTime())) {
      startD = new Date(currentSession.startTime);
    }

    let durMin = parseInt(editDurationMin, 10);
    if (isNaN(durMin) || durMin <= 0) durMin = 45;
    const durationSeconds = durMin * 60;
    const endD = new Date(startD.getTime() + durationSeconds * 1000);

    const updatedSession: WorkoutSession = {
      ...currentSession,
      title: editTitle.trim() || currentSession.title || 'Séance',
      startTime: startD.toISOString(),
      endTime: endD.toISOString(),
      durationSeconds,
      blocks: editBlocks,
      exercises: editBlocks.filter((b): b is SingleExerciseBlock => b.type === 'single').map((b) => b.exercise),
    };

    await updatePastWorkout(updatedSession);
    setCurrentSession(updatedSession);
    setIsEditing(false);
    Alert.alert('Séance mise à jour', 'Les modifications ont été enregistrées avec succès.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Header de la Modale */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {isEditing ? (
                <View>
                  <Text style={[styles.editHeaderSubtitle, { color: theme.accent }]}>MODIFICATION DE LA SÉANCE</Text>
                  <TextInput
                    style={[
                      styles.titleInput,
                      { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Titre de la séance"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              ) : (
                <View>
                  <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {currentSession.title}
                  </Text>
                  <Text style={[styles.dateText, { color: theme.textMuted }]}>
                    {formattedDate} · {formattedTime}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {!isEditing ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleStartEdit}
                    accessibilityLabel="Modifier la séance"
                  >
                    <Edit2 size={17} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleConvertToTemplate}
                    accessibilityLabel="Transformer en programme"
                  >
                    <BookmarkPlus size={17} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleDeleteSession}
                    accessibilityLabel="Supprimer la séance"
                  >
                    <Trash2 size={17} color={theme.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <X size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* En mode édition : champs Date / Heure / Durée */}
          {isEditing && (
            <View style={[styles.editMetaContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.editMetaCol}>
                <Text style={[styles.editMetaLabel, { color: theme.textMuted }]}>DATE</Text>
                <TextInput
                  style={[styles.editMetaInput, { color: theme.text, borderColor: theme.border }]}
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={styles.editMetaCol}>
                <Text style={[styles.editMetaLabel, { color: theme.textMuted }]}>HEURE</Text>
                <TextInput
                  style={[styles.editMetaInput, { color: theme.text, borderColor: theme.border }]}
                  value={editTime}
                  onChangeText={setEditTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={styles.editMetaCol}>
                <Text style={[styles.editMetaLabel, { color: theme.textMuted }]}>DURÉE (MIN)</Text>
                <TextInput
                  style={[styles.editMetaInput, { color: theme.text, borderColor: theme.border }]}
                  value={editDurationMin}
                  onChangeText={setEditDurationMin}
                  keyboardType="numeric"
                  placeholder="45"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>
          )}

          {/* Bandeau Récapitulatif des Métriques (Uniquement en mode lecture) */}
          {!isEditing && (
            <View style={[styles.metricsBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.metricCell}>
                <Clock size={14} color={theme.textMuted} />
                <Text style={[styles.metricVal, { color: theme.text }]}>
                  {Math.floor((currentSession.durationSeconds || 0) / 60)} min
                </Text>
                <Text style={[styles.metricSub, { color: theme.textMuted }]}>Durée</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.metricCell}>
                <Dumbbell size={14} color={theme.accent} />
                <Text style={[styles.metricVal, { color: theme.accent }]}>
                  {formatWeight(currentSession.totalVolumeKg || 0)} kg
                </Text>
                <Text style={[styles.metricSub, { color: theme.textMuted }]}>Volume total</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.metricCell}>
                <CheckCircle2 size={14} color={theme.primary} />
                <Text style={[styles.metricVal, { color: theme.text }]}>
                  {currentSession.completedSetsCount || 0} / {currentSession.totalSetsCount || 0}
                </Text>
                <Text style={[styles.metricSub, { color: theme.textMuted }]}>Séries validées</Text>
              </View>
            </View>
          )}

          {/* Contenu Défilant */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {isEditing ? (
              // =================== MODE ÉDITION ===================
              <View style={{ paddingBottom: 24 }}>
                {editBlocks.map((block, bIdx) => {
                  if (block.type === 'single') {
                    const ex = block.exercise;
                    return (
                      <View
                        key={block.id || bIdx}
                        style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        {/* En-tête de l'exercice en édition */}
                        <View style={styles.blockHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.exerciseTitle, { color: theme.text }]}>
                              {ex.exerciseName}
                            </Text>
                            {/* Muscles travaillés */}
                            <View style={{ marginTop: 3 }}>
                              {/* Ligne 1 : Principaux */}
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                {(ex.primaryMuscles && ex.primaryMuscles.length > 0 ? ex.primaryMuscles : (ex.primaryMuscle ? [ex.primaryMuscle] : [])).map((m, idx) => (
                                  <View key={idx} style={{ backgroundColor: theme.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' }}>{m}</Text>
                                  </View>
                                ))}
                              </View>
                              {/* Ligne 2 : Secondaires */}
                              {ex.targetMuscles && ex.targetMuscles.filter(m => !(ex.primaryMuscles || [ex.primaryMuscle]).includes(m)).length > 0 && (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                                  {ex.targetMuscles.filter(m => !(ex.primaryMuscles || [ex.primaryMuscle]).includes(m)).map((m, idx) => (
                                    <View key={idx} style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                                      <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textMuted }}>{m}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveBlock(block.id)}
                            style={[styles.trashBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={15} color={theme.danger} />
                          </TouchableOpacity>
                        </View>

                        {/* En-tête du tableau des séries */}
                        <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.colHead, styles.colS, { color: theme.textMuted }]}>SÉRIE</Text>
                          <Text style={[styles.colHead, styles.colM, { color: theme.textMuted }]}>CHARGE (KG)</Text>
                          <Text style={[styles.colHead, styles.colM, { color: theme.textMuted }]}>REPS</Text>
                          <Text style={[styles.colHead, styles.colRir, { color: theme.textMuted }]}>RIR</Text>
                          <View style={styles.colAction} />
                        </View>

                        {/* Lignes des séries éditables */}
                        {ex.sets.map((set) => (
                          <View key={set.id} style={[styles.tableRow, { borderBottomColor: `${theme.border}40` }]}>
                            <View style={[styles.setNumBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
                              <Text style={[styles.setNumText, { color: theme.text }]}>{set.setNumber}</Text>
                            </View>

                            <TouchableOpacity
                              activeOpacity={0.75}
                              style={[styles.cellBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() =>
                                setKeypadTarget({
                                  blockId: block.id,
                                  setId: set.id,
                                  field: 'weightKg',
                                  setNumber: set.setNumber,
                                  value: set.weightKg !== undefined && set.weightKg !== null ? String(set.weightKg) : '',
                                })
                              }
                            >
                              <Text
                                style={[
                                  styles.cellVal,
                                  { color: set.weightKg !== undefined && set.weightKg !== null ? theme.text : theme.textMuted },
                                ]}
                              >
                                {set.weightKg !== undefined && set.weightKg !== null ? `${set.weightKg}` : '-'}
                              </Text>
                              <Text style={[styles.cellUnit, { color: theme.textMuted }]}>kg</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.75}
                              style={[styles.cellBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() =>
                                setKeypadTarget({
                                  blockId: block.id,
                                  setId: set.id,
                                  field: 'reps',
                                  setNumber: set.setNumber,
                                  value: set.reps !== undefined && set.reps !== null ? String(set.reps) : '',
                                })
                              }
                            >
                              <Text
                                style={[
                                  styles.cellVal,
                                  { color: set.reps !== undefined && set.reps !== null ? theme.text : theme.textMuted },
                                ]}
                              >
                                {set.reps !== undefined && set.reps !== null ? `${set.reps}` : '-'}
                              </Text>
                              <Text style={[styles.cellUnit, { color: theme.textMuted }]}>reps</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.75}
                              style={[styles.cellBtn, styles.cellRir, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() =>
                                setKeypadTarget({
                                  blockId: block.id,
                                  setId: set.id,
                                  field: 'rir',
                                  setNumber: set.setNumber,
                                  value: set.rir !== undefined && set.rir !== null ? String(set.rir) : '',
                                })
                              }
                            >
                              <Text
                                style={[
                                  styles.cellVal,
                                  { color: set.rir !== undefined && set.rir !== null ? theme.accent : theme.textMuted },
                                ]}
                              >
                                {set.rir !== undefined && set.rir !== null ? `${set.rir}` : '-'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.colAction}
                              onPress={() => handleRemoveSet(block.id, set.id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Trash2 size={14} color={theme.textMuted} />
                            </TouchableOpacity>
                          </View>
                        ))}

                        {/* Ajouter une série */}
                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={[styles.addSetBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
                          onPress={() => handleAddSet(block.id)}
                        >
                          <Plus size={14} color={theme.accent} style={{ marginRight: 6 }} />
                          <Text style={[styles.addSetText, { color: theme.text }]}>Ajouter une série</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  } else if (block.type === 'circuit') {
                    const circuit = block as CircuitBlock;
                    return (
                      <View
                        key={circuit.id || bIdx}
                        style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        <View style={styles.blockHeader}>
                          <RotateCw size={16} color={theme.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.exerciseTitle, { color: theme.text, flex: 1 }]}>
                            {circuit.title || 'Circuit'} ({circuit.rounds} tour{circuit.rounds > 1 ? 's' : ''})
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveBlock(block.id)}
                            style={[styles.trashBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                          >
                            <Trash2 size={15} color={theme.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })}

                {/* Bouton Ajouter un Exercice */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.addExerciseBtn, { borderColor: theme.accent, backgroundColor: `${theme.accent}12` }]}
                  onPress={() => setShowExerciseSelector(true)}
                >
                  <Plus size={16} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.addExerciseBtnText, { color: theme.accent }]}>Ajouter un exercice</Text>
                </TouchableOpacity>

                {/* Barre de boutons Enregistrer / Annuler */}
                <View style={styles.editActionsContainer}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                    onPress={handleSaveEdit}
                  >
                    <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.cancelBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // =================== MODE LECTURE SEULE ===================
              blocks.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Aucun exercice enregistré pour cette séance.
                </Text>
              ) : (
                blocks.map((block, bIdx) => {
                  if (block.type === 'single') {
                    const ex = block.exercise;
                    const sets = ex.sets || [];

                    return (
                      <View
                        key={block.id || bIdx}
                        style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        {/* Titre de l'exercice */}
                        <View style={styles.blockHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.exerciseTitle, { color: theme.text }]}>
                              {ex.exerciseName}
                            </Text>
                            {/* Muscles travaillés */}
                            <View style={{ marginTop: 3 }}>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                {(ex.primaryMuscles && ex.primaryMuscles.length > 0 ? ex.primaryMuscles : (ex.primaryMuscle ? [ex.primaryMuscle] : [])).map((m, idx) => (
                                  <View key={idx} style={{ backgroundColor: theme.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' }}>{m}</Text>
                                  </View>
                                ))}
                                {!!ex.restSeconds && (
                                  <Text style={{ fontSize: 11, color: theme.textMuted, marginLeft: 4 }}>
                                    • {ex.restSeconds}s repos
                                  </Text>
                                )}
                              </View>
                              {ex.targetMuscles && ex.targetMuscles.filter(m => !(ex.primaryMuscles || [ex.primaryMuscle]).includes(m)).length > 0 && (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                                  {ex.targetMuscles.filter(m => !(ex.primaryMuscles || [ex.primaryMuscle]).includes(m)).map((m, idx) => (
                                    <View key={idx} style={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                                      <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textMuted }}>{m}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        {/* En-tête du tableau des séries */}
                        <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.colHead, styles.colSet, { color: theme.textMuted }]}>SÉRIE</Text>
                          <Text style={[styles.colHead, styles.colVal, { color: theme.textMuted }]}>CHARGE</Text>
                          <Text style={[styles.colHead, styles.colVal, { color: theme.textMuted }]}>REPS</Text>
                          <Text style={[styles.colHead, styles.colVal, { color: theme.textMuted }]}>RIR</Text>
                          <Text style={[styles.colHead, styles.colStatus, { color: theme.textMuted }]}>STATUT</Text>
                        </View>

                        {/* Liste des séries en lecture seule */}
                        {sets.map((s, sIdx) => {
                          const weightStr = s.weightKg !== undefined && s.weightKg !== null ? `${formatWeight(s.weightKg)} kg` : '-';
                          const repsStr = s.reps !== undefined && s.reps !== null ? `${s.reps}` : '-';
                          const rirStr = s.rir !== undefined && s.rir !== null ? `${s.rir}` : '-';

                          return (
                            <View key={s.id || sIdx} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                              <View style={styles.colSet}>
                                <Text style={[styles.setNumText, { color: theme.text }]}>#{s.setNumber || sIdx + 1}</Text>
                                {s.type && s.type !== 'normal' && (
                                  <Text style={[styles.setTypeText, { color: theme.accent }]}>
                                    {s.type.toUpperCase()}
                                  </Text>
                                )}
                              </View>

                              <Text style={[styles.colVal, styles.valText, { color: theme.text }]}>
                                {weightStr}
                              </Text>

                              <Text style={[styles.colVal, styles.valText, { color: theme.text }]}>
                                {repsStr}
                              </Text>

                              <Text style={[styles.colVal, styles.valText, { color: s.rir !== undefined ? theme.accent : theme.textMuted }]}>
                                {rirStr}
                              </Text>

                              <View style={styles.colStatus}>
                                {s.completed ? (
                                  <View style={[styles.statusBadge, { backgroundColor: theme.primary + '22' }]}>
                                    <CheckCircle2 size={12} color={theme.primary} />
                                    <Text style={[styles.statusText, { color: theme.primary }]}>Fait</Text>
                                  </View>
                                ) : (
                                  <Text style={[styles.statusTextPending, { color: theme.textMuted }]}>-</Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  } else if (block.type === 'circuit') {
                    const circuit = block as CircuitBlock;
                    return (
                      <View
                        key={circuit.id || bIdx}
                        style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        <View style={styles.blockHeader}>
                          <RotateCw size={16} color={theme.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.exerciseTitle, { color: theme.text }]}>
                            {circuit.title || 'Circuit'}
                          </Text>
                          <Text style={[styles.exerciseSub, { color: theme.textMuted, marginLeft: 8 }]}>
                            ({circuit.rounds} tour{circuit.rounds > 1 ? 's' : ''})
                          </Text>
                        </View>

                        {circuit.exercises.map((cEx, cIdx) => (
                          <View key={cEx.id || cIdx} style={[styles.circuitRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.itemName, { color: theme.text }]}>{cEx.exerciseName}</Text>
                            <Text style={[styles.itemDetail, { color: theme.textMuted }]}>
                              {cEx.targetValue} {cEx.targetType === 'reps' ? 'reps' : 'sec'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  }
                  return null;
                })
              )
            )}
          </ScrollView>
        </View>
      </View>

      {/* Clavier numérique pour la saisie des séries en mode édition */}
      {keypadTarget && (
        <CustomNumericKeypad
          visible={!!keypadTarget}
          onClose={handleKeypadClose}
          setNumber={keypadTarget.setNumber}
          activeField={keypadTarget.field}
          value={keypadTarget.value}
          onChangeValue={(val) => setKeypadTarget({ ...keypadTarget, value: val })}
          onNextField={handleKeypadNext}
          onPreviousField={handleKeypadPrevious}
          onValidate={handleKeypadValidate}
          onClear={() => setKeypadTarget({ ...keypadTarget, value: '' })}
          isLastField={isLastWorkoutField}
        />
      )}

      {/* Modal Sélection d'exercice */}
      <Modal visible={showExerciseSelector} transparent animationType="slide" onRequestClose={() => setShowExerciseSelector(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowExerciseSelector(false)}
            accessibilityLabel="Fermer le sélecteur d'exercice"
          />
          <View style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.border, height: '80%' }]}>
            <View style={[styles.headerRow, { borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: 10 }]}>
              <Text style={[styles.title, { color: theme.text }]}>Ajouter un exercice</Text>
              <TouchableOpacity
                onPress={() => setShowExerciseSelector(false)}
                style={[styles.actionIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <X size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={{ paddingVertical: 10 }}>
              <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Rechercher un exercice..."
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {filteredExercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.exRow, { borderBottomColor: theme.border }]}
                  onPress={() => handleAddExercise(ex)}
                >
                  <Text style={[styles.exName, { color: theme.text }]}>{ex.name}</Text>
                  <Text style={[styles.exCat, { color: theme.textMuted }]}>{ex.primaryMuscle}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  editHeaderSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  titleInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  editMetaCol: {
    flex: 1,
  },
  editMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  editMetaInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 24,
  },
  scrollBody: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 30,
  },
  blockCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  trashBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    marginBottom: 4,
    alignItems: 'center',
  },
  colHead: {
    fontSize: 10,
    fontWeight: '800',
  },
  colSet: {
    width: 50,
  },
  colVal: {
    flex: 1,
    textAlign: 'center',
  },
  colStatus: {
    width: 60,
    alignItems: 'flex-end',
  },
  colS: {
    width: 32,
    textAlign: 'center',
  },
  colM: {
    flex: 1,
    textAlign: 'center',
  },
  colRir: {
    width: 44,
    textAlign: 'center',
  },
  colAction: {
    width: 32,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  setNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  setNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cellBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    paddingHorizontal: 4,
  },
  cellRir: {
    flex: 0,
    width: 44,
  },
  cellVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  cellUnit: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  setTypeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  valText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPending: {
    fontSize: 12,
  },
  circuitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemDetail: {
    fontSize: 12,
    fontWeight: '600',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  addSetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addExerciseBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  editActionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  exRow: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exName: {
    fontSize: 14,
    fontWeight: '700',
  },
  exCat: {
    fontSize: 12,
    fontWeight: '500',
  },
});
