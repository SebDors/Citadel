import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert, Animated, PanResponder } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Button } from '../UI/Button';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Zap,
  ListOrdered,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Sparkles,
  Dumbbell,
  Timer,
  Bookmark,
  Info,
  Layers,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { WorkoutSession, WorkoutBlock, getTemplateBlocks, getSessionBlocks, SingleExerciseBlock, WorkoutSet, SET_TYPES_CONFIG } from '../../types';
import { SharedExercise } from '../../constants/exerciseDatabase';
import { CustomNumericKeypad, NumericFieldType } from '../UI/CustomNumericKeypad';

interface LogPastWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const LogPastWorkoutModal: React.FC<LogPastWorkoutModalProps> = ({ visible, onClose, initialDate }) => {
  const { theme } = useTheme();
  const { data, logPastWorkout, allExercises } = useWorkout();

  const formatISOToFrench = (isoStr?: string): string => {
    if (!isoStr) {
      const d = new Date();
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    if (isoStr.includes('/')) return isoStr;
    const parts = isoStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return isoStr;
  };

  const parseFrenchToISO = (frenchStr: string): string => {
    if (!frenchStr) return new Date().toISOString().split('T')[0];
    const clean = frenchStr.trim().replace(/-/g, '/');
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parts[2].trim();
      if (y.length === 2) y = `20${y}`;
      return `${y}-${m}-${d}`;
    }
    return frenchStr;
  };

  const todayFrenchStr = formatISOToFrench();

  const [dateStr, setDateStr] = useState(formatISOToFrench(initialDate) || todayFrenchStr);
  const [timeStr, setTimeStr] = useState('18:00');
  const [durationMin, setDurationMin] = useState('45');
  const [sessionTitle, setSessionTitle] = useState('Séance libre');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [prefillSourceText, setPrefillSourceText] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'express' | 'detailed'>('detailed');
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);

  // Keypad state
  const [keypadVisible, setKeypadVisible] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<{ blockId: string; setId: string; field: NumericFieldType; setNumber: number; value: string } | null>(null);

  // Exercise Selector state
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Template Selector state (Dropdown Pop-up)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Swipe-down to dismiss animated values
  const translateY = useRef(new Animated.Value(0)).current;
  const templateTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateY.stopAnimation();
    translateY.setValue(0);
    templateTranslateY.stopAnimation();
    templateTranslateY.setValue(0);
    if (visible) {
      setDateStr(formatISOToFrench(initialDate) || todayFrenchStr);
    } else {
      // Reset
      setDateStr(formatISOToFrench(initialDate) || todayFrenchStr);
      setTimeStr('18:00');
      setDurationMin('45');
      setSessionTitle('Séance libre');
      setSelectedTemplateId(null);
      setPrefillSourceText(null);
      setMode('detailed');
      setBlocks([]);
      setKeypadVisible(false);
      setShowTemplateSelector(false);
      setTemplateSearchQuery('');
    }
  }, [visible, initialDate, translateY, templateTranslateY]);

  useEffect(() => {
    if (showTemplateSelector) {
      templateTranslateY.stopAnimation();
      templateTranslateY.setValue(0);
    }
  }, [showTemplateSelector, templateTranslateY]);

  const handleOpenTemplateSelector = useCallback(() => {
    templateTranslateY.stopAnimation();
    templateTranslateY.setValue(0);
    setTemplateSearchQuery('');
    setShowTemplateSelector(true);
  }, [templateTranslateY]);

  const handleCloseTemplateSelector = useCallback(() => {
    templateTranslateY.stopAnimation();
    templateTranslateY.setValue(0);
    setShowTemplateSelector(false);
  }, [templateTranslateY]);

  const mainPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 70 || gesture.vy > 0.5) {
            Animated.timing(translateY, {
              toValue: 600,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              onClose();
              setTimeout(() => {
                translateY.stopAnimation();
                translateY.setValue(0);
              }, 150);
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [onClose, translateY]
  );

  const templatePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            templateTranslateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 70 || gesture.vy > 0.5) {
            Animated.timing(templateTranslateY, {
              toValue: 600,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              setShowTemplateSelector(false);
              setTimeout(() => {
                templateTranslateY.stopAnimation();
                templateTranslateY.setValue(0);
              }, 150);
            });
          } else {
            Animated.spring(templateTranslateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [templateTranslateY]
  );

  // Modèles triés dans l'ordre alphabétique
  const templates = useMemo(() => {
    return [...(data?.templates || [])].sort((a, b) =>
      a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' })
    );
  }, [data?.templates]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return templates.find(t => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return templates;
    return templates.filter(t => t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()));
  }, [templates, templateSearchQuery]);

  const handleSelectTemplate = (templateId: string) => {
    if (templateId === 'free') {
      setSelectedTemplateId(null);
      setSessionTitle('Séance libre');
      setBlocks([]);
      setPrefillSourceText(null);
      return;
    }
    const t = templates.find(x => x.id === templateId);
    if (t) {
      setSelectedTemplateId(t.id);
      setSessionTitle(t.title);
      setMode('detailed');

      // Chercher la dernière séance passée correspondant à ce modèle
      const sortedHistory = [...(data?.history || [])].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      const lastSession = sortedHistory.find(
        s => (s.templateId && s.templateId === t.id) ||
             (s.title && s.title.toLowerCase().trim() === t.title.toLowerCase().trim())
      );

      if (lastSession) {
        const lastDateFormatted = new Date(lastSession.startTime).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        });
        setPrefillSourceText(`Données pré-remplies selon votre dernière séance du ${lastDateFormatted}`);
        const pastBlocks = getSessionBlocks(lastSession);
        const readyBlocks: WorkoutBlock[] = JSON.parse(JSON.stringify(pastBlocks)).map((b: WorkoutBlock) => {
          if (b.type === 'single') {
            return {
              ...b,
              id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              exercise: {
                ...b.exercise,
                id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                sets: (b.exercise.sets || []).map((s, idx) => ({
                  ...s,
                  id: `set_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
                  completed: true,
                  weightKg: s.weightKg,
                  reps: s.reps,
                  rir: s.rir,
                }))
              }
            };
          }
          return {
            ...b,
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          };
        });
        setBlocks(readyBlocks);
      } else {
        setPrefillSourceText("Modèle neuf : pré-rempli avec les valeurs cibles par défaut");
        const rawBlocks = getTemplateBlocks(t);
        const readyBlocks: WorkoutBlock[] = JSON.parse(JSON.stringify(rawBlocks)).map((b: WorkoutBlock) => {
          if (b.type === 'single') {
            return {
              ...b,
              exercise: {
                ...b.exercise,
                sets: b.exercise.sets.map(s => ({
                  ...s,
                  completed: true
                }))
              }
            };
          }
          return b;
        });
        setBlocks(readyBlocks);
      }
    }
  };

  const handleAddSet = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId && b.type === 'single') {
        const lastSet = b.exercise.sets[b.exercise.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `set_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
          setNumber: b.exercise.sets.length + 1,
          type: lastSet ? lastSet.type : 'normal',
          completed: true,
        };
        return { ...b, exercise: { ...b.exercise, sets: [...b.exercise.sets, newSet] } };
      }
      return b;
    }));
  };

  const handleRemoveSet = (blockId: string, setId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId && b.type === 'single') {
        return {
          ...b,
          exercise: {
            ...b.exercise,
            sets: b.exercise.sets.filter(s => s.id !== setId).map((s, i) => ({ ...s, setNumber: i + 1 }))
          }
        };
      }
      return b;
    }));
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const handleCommitSetField = useCallback((blockId: string, setId: string, field: NumericFieldType, rawVal: string) => {
    const num = parseFloat(rawVal);
    const cleanNum = isNaN(num) ? undefined : num;
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId && b.type === 'single') {
        return {
          ...b,
          exercise: {
            ...b.exercise,
            sets: b.exercise.sets.map(s => s.id === setId ? { ...s, [field]: cleanNum } : s)
          }
        };
      }
      return b;
    }));
  }, []);

  const isLastWorkoutField = useMemo(() => {
    if (!keypadTarget) return false;
    if (keypadTarget.field !== 'rir') return false;
    const currentBlock = blocks.find(b => b.id === keypadTarget.blockId);
    if (!currentBlock || currentBlock.type !== 'single') return true;
    const sets = currentBlock.exercise.sets;
    const setIdx = sets.findIndex(s => s.id === keypadTarget.setId);
    if (setIdx !== sets.length - 1) return false;
    const blockIdx = blocks.findIndex(b => b.id === keypadTarget.blockId);
    for (let i = blockIdx + 1; i < blocks.length; i++) {
      const nb = blocks[i];
      if (nb.type === 'single' && (nb as SingleExerciseBlock).exercise.sets.length > 0) {
        return false;
      }
    }
    return true;
  }, [keypadTarget, blocks]);

  const handleKeypadNext = useCallback((currentVal: string) => {
    if (!keypadTarget) return;
    const { blockId, setId, field } = keypadTarget;
    handleCommitSetField(blockId, setId, field, currentVal);

    const currentBlock = blocks.find(b => b.id === blockId);
    if (!currentBlock || currentBlock.type !== 'single') {
      setKeypadTarget(null);
      return;
    }

    const sets = currentBlock.exercise.sets;
    const currentSetIndex = sets.findIndex(s => s.id === setId);
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
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        let foundNext = false;
        for (let i = blockIndex + 1; i < blocks.length; i++) {
          const nb = blocks[i];
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
  }, [keypadTarget, blocks, handleCommitSetField]);

  const handleKeypadPrevious = useCallback((currentVal: string) => {
    if (!keypadTarget) return;
    const { blockId, setId, field } = keypadTarget;
    handleCommitSetField(blockId, setId, field, currentVal);

    const currentBlock = blocks.find(b => b.id === blockId);
    if (!currentBlock || currentBlock.type !== 'single') {
      setKeypadTarget(null);
      return;
    }

    const sets = currentBlock.exercise.sets;
    const currentSetIndex = sets.findIndex(s => s.id === setId);
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
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        let foundPrev = false;
        for (let i = blockIndex - 1; i >= 0; i--) {
          const pb = blocks[i];
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
  }, [keypadTarget, blocks, handleCommitSetField]);

  const handleKeypadValidate = useCallback((finalVal: string) => {
    if (!keypadTarget) return;
    handleCommitSetField(keypadTarget.blockId, keypadTarget.setId, keypadTarget.field, finalVal);
    setKeypadTarget(null);
  }, [keypadTarget, handleCommitSetField]);

  const handleKeypadClose = useCallback((currentVal?: string) => {
    if (keypadTarget && currentVal !== undefined) {
      handleCommitSetField(keypadTarget.blockId, keypadTarget.setId, keypadTarget.field, currentVal);
    }
    setKeypadTarget(null);
  }, [keypadTarget, handleCommitSetField]);

  const handleAddExercise = (ex: SharedExercise) => {
    let prefilledSets: WorkoutSet[] = [
      { id: `set_${Date.now()}_1`, setNumber: 1, type: 'normal', completed: true }
    ];

    if (data?.history && data.history.length > 0) {
      const sortedHistory = [...data.history].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      for (const sess of sortedHistory) {
        const sessBlocks = getSessionBlocks(sess);
        const matchingBlock = sessBlocks.find(
          b => b.type === 'single' && b.exercise.exerciseName.toLowerCase().trim() === ex.name.toLowerCase().trim()
        ) as SingleExerciseBlock | undefined;

        if (matchingBlock && matchingBlock.exercise.sets && matchingBlock.exercise.sets.length > 0) {
          prefilledSets = matchingBlock.exercise.sets.map((s, idx) => ({
            id: `set_${Date.now()}_${idx + 1}`,
            setNumber: idx + 1,
            type: s.type || 'normal',
            completed: true,
            weightKg: s.weightKg,
            reps: s.reps,
            rir: s.rir,
          }));
          break;
        }
      }
    }

    const newBlock: SingleExerciseBlock = {
      id: `block_${Date.now()}`,
      type: 'single',
      exercise: {
        id: `ex_${Date.now()}`,
        exerciseId: ex.id,
        exerciseName: ex.name,
        primaryMuscle: ex.primaryMuscle,
        targetMuscles: ex.targetMuscles || [],
        restSeconds: 90,
        sets: prefilledSets,
      }
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowExerciseSelector(false);
  };

  const handleSave = async () => {
    const isoDateStr = parseFrenchToISO(dateStr);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDateStr)) {
      Alert.alert("Format de date invalide", "Veuillez saisir la date au format JJ/MM/AAAA (ex: 29/08/2026)");
      return;
    }
    let startD = new Date(`${isoDateStr}T${timeStr}:00`);
    if (isNaN(startD.getTime())) {
      startD = new Date();
    }
    
    let dur = parseInt(durationMin, 10);
    if (isNaN(dur) || dur <= 0) dur = 45;

    const endD = new Date(startD.getTime() + dur * 60000);

    let finalBlocks = blocks;
    if (mode === 'express' && selectedTemplateId && blocks.length === 0) {
      const t = templates.find(x => x.id === selectedTemplateId);
      if (t) {
        const sortedHistory = [...(data?.history || [])].sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        const lastSession = sortedHistory.find(
          s => (s.templateId && s.templateId === t.id) ||
               (s.title && s.title.toLowerCase().trim() === t.title.toLowerCase().trim())
        );
        if (lastSession) {
          finalBlocks = getSessionBlocks(lastSession).map((b: WorkoutBlock) => {
            if (b.type === 'single') {
              return {
                ...b,
                exercise: {
                  ...b.exercise,
                  sets: (b.exercise.sets || []).map(s => ({ ...s, completed: true }))
                }
              };
            }
            return b;
          });
        } else {
          finalBlocks = getTemplateBlocks(t).map((b: WorkoutBlock) => {
            if (b.type === 'single') {
              return {
                ...b,
                exercise: {
                  ...b.exercise,
                  sets: b.exercise.sets.map(s => ({ ...s, completed: true }))
                }
              };
            }
            return b;
          });
        }
      }
    }

    let totalVolume = 0;
    let completedSetsCount = 0;
    let totalSetsCount = 0;

    finalBlocks.forEach(b => {
      if (b.type === 'single') {
        b.exercise.sets.forEach(s => {
          totalSetsCount++;
          if (s.completed) {
            completedSetsCount++;
            if (s.weightKg && s.reps) totalVolume += s.weightKg * s.reps;
          }
        });
      } else if (b.type === 'circuit') {
        totalSetsCount += b.rounds * b.exercises.length;
        completedSetsCount = totalSetsCount;
      }
    });

    const session: WorkoutSession = {
      id: `session_past_${Date.now()}`,
      title: sessionTitle || 'Séance libre',
      templateId: selectedTemplateId || undefined,
      status: 'completed',
      hasStarted: true,
      startTime: startD.toISOString(),
      endTime: endD.toISOString(),
      durationSeconds: dur * 60,
      blocks: finalBlocks,
      totalVolumeKg: totalVolume,
      completedSetsCount,
      totalSetsCount,
      isCircuit: false,
    };

    await logPastWorkout(session);
    onClose();
  };

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allExercises, searchQuery]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Fermer la modal"
        />
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle & Top Bar / Header */}
          <View style={[styles.headerContainer, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
            {/* Draggable surface covering the full header */}
            <View style={StyleSheet.absoluteFillObject} {...mainPanResponder.panHandlers} />

            <View pointerEvents="box-none" style={{ width: '100%' }}>
              <View pointerEvents="none" style={styles.dragHandleContainer}>
                <View style={[styles.dragHandle, { backgroundColor: theme.background }]} />
              </View>

              <View pointerEvents="box-none" style={styles.header}>
                <View pointerEvents="none" style={styles.headerLeft}>
                  <View style={[styles.headerIconBadge, { backgroundColor: `${theme.accent}18`, borderColor: `${theme.accent}30` }]}>
                    <CalendarIcon size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>Ajouter une séance passée</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>Enregistrement rétroactif & historique</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Fermer"
                >
                  <X size={18} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section 1: Date & Heure */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.accent}15` }]}>
                  <Clock size={13} color={theme.accent} />
                </View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DATE & HORAIRE</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Date (JJ/MM/AAAA)</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <CalendarIcon size={15} color={theme.accent} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.text }]}
                      value={dateStr}
                      onChangeText={setDateStr}
                      placeholder="29/08/2026"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Heure (HH:MM)</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Clock size={15} color={theme.accent} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.text }]}
                      value={timeStr}
                      onChangeText={setTimeStr}
                      placeholder="18:00"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>
              </View>

              {/* Duration */}
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Durée de la séance</Text>
                <View style={styles.durationRow}>
                  <View style={[styles.durationInputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Timer size={15} color={theme.accent} style={{ marginRight: 6 }} />
                    <TextInput
                      style={[styles.durationInput, { color: theme.text }]}
                      value={durationMin}
                      onChangeText={setDurationMin}
                      keyboardType="numeric"
                      placeholder="45"
                      placeholderTextColor={theme.textMuted}
                    />
                    <Text style={[styles.unitText, { color: theme.textMuted }]}>min</Text>
                  </View>

                  <View style={styles.quickPresetsRow}>
                    {[30, 45, 60, 90].map(m => {
                      const isSel = durationMin === m.toString();
                      return (
                        <TouchableOpacity
                          key={m}
                          activeOpacity={0.7}
                          style={[
                            styles.presetChip,
                            {
                              backgroundColor: isSel ? theme.accent : theme.background,
                              borderColor: isSel ? theme.accent : theme.border,
                            }
                          ]}
                          onPress={() => setDurationMin(m.toString())}
                        >
                          <Text style={[styles.presetChipText, { color: isSel ? '#FFFFFF' : theme.text }]}>
                            {m}m
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Section 2: Sélection Modèle */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.accent}15` }]}>
                  <Dumbbell size={13} color={theme.accent} />
                </View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PROGRAMME ASSOCIÉ</Text>
              </View>

              {/* Dropdown / Picker Trigger Button */}
              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.dropdownTrigger, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={handleOpenTemplateSelector}
              >
                <View style={[styles.dropdownIconBadge, { backgroundColor: selectedTemplate ? `${theme.accent}18` : `${theme.textMuted}15` }]}>
                  {selectedTemplate ? (
                    <Dumbbell size={16} color={theme.accent} />
                  ) : (
                    <Sparkles size={16} color={theme.accent} />
                  )}
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.dropdownTitle, { color: theme.text }]} numberOfLines={1}>
                    {selectedTemplate ? selectedTemplate.title : 'Séance libre (aucun programme)'}
                  </Text>
                  <Text style={[styles.dropdownSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                    {selectedTemplate
                      ? (() => {
                          const count = getTemplateBlocks(selectedTemplate).length;
                          return `${count} exercice${count > 1 ? 's' : ''} configuré${count > 1 ? 's' : ''}`;
                        })()
                      : 'Enregistrement libre sans modèle prédéfini'}
                  </Text>
                </View>

                <View style={[styles.dropdownChevronWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <ChevronDown size={16} color={theme.textMuted} />
                </View>
              </TouchableOpacity>

              <View style={{ marginTop: 14 }}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Nom personnalisé</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Bookmark size={15} color={theme.accent} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.inputField, { color: theme.text }]}
                    value={sessionTitle}
                    onChangeText={setSessionTitle}
                    placeholder="Nom de la séance..."
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Section 3: Segmented Control pour le Mode */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 12 }]}>
              <View style={[styles.segmentedContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.segmentTab,
                    mode === 'express' && [styles.segmentTabActive, { backgroundColor: theme.surface, borderColor: theme.border }],
                  ]}
                  onPress={() => setMode('express')}
                >
                  <View style={[styles.tabIconBadge, { backgroundColor: mode === 'express' ? `${theme.accent}20` : 'transparent' }]}>
                    <Zap size={14} color={mode === 'express' ? theme.accent : theme.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tabTitle, { color: mode === 'express' ? theme.text : theme.textMuted }]}>
                      Express
                    </Text>
                    <Text style={[styles.tabSub, { color: theme.textMuted }]}>
                      Tout valider
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.segmentTab,
                    mode === 'detailed' && [styles.segmentTabActive, { backgroundColor: theme.surface, borderColor: theme.border }],
                  ]}
                  onPress={() => setMode('detailed')}
                >
                  <View style={[styles.tabIconBadge, { backgroundColor: mode === 'detailed' ? `${theme.accent}20` : 'transparent' }]}>
                    <ListOrdered size={14} color={mode === 'detailed' ? theme.accent : theme.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tabTitle, { color: mode === 'detailed' ? theme.text : theme.textMuted }]}>
                      Détaillé
                    </Text>
                    <Text style={[styles.tabSub, { color: theme.textMuted }]}>
                      Charges & reps
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.modeNoteRow}>
                <Info size={13} color={theme.textMuted} style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={[styles.modeNoteText, { color: theme.textMuted }]}>
                  {mode === 'express'
                    ? "En mode Express, les exercices et séries du modèle sont automatiquement validés selon votre dernière performance."
                    : "En mode Détaillé, vous pouvez ajuster manuellement le poids et les répétitions pour chaque série."}
                </Text>
              </View>
            </View>

            {/* Section 4: Détaillé */}
            {mode === 'detailed' && (
              <View style={styles.detailedSection}>
                {prefillSourceText ? (
                  <View style={[styles.prefillBanner, { backgroundColor: `${theme.accent}12`, borderColor: `${theme.accent}35` }]}>
                    <Sparkles size={15} color={theme.accent} style={{ marginRight: 8 }} />
                    <Text style={[styles.prefillBannerText, { color: theme.text }]}>
                      {prefillSourceText}
                    </Text>
                  </View>
                ) : null}

                {blocks.map((block, bIdx) => (
                  <View key={block.id} style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {block.type === 'single' && (
                      <>
                        {/* Block Header */}
                        <View style={styles.blockHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                            <View style={[styles.orderBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
                              <Text style={[styles.orderBadgeText, { color: theme.accent }]}>#{bIdx + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.blockTitle, { color: theme.text }]} numberOfLines={1}>
                                {block.exercise.exerciseName}
                              </Text>
                              {/* Muscles travaillés */}
                              <View style={{ marginTop: 3 }}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                  {(block.exercise.primaryMuscles && block.exercise.primaryMuscles.length > 0 ? block.exercise.primaryMuscles : (block.exercise.primaryMuscle ? [block.exercise.primaryMuscle] : [])).map((m, idx) => (
                                    <View key={idx} style={{ backgroundColor: theme.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' }}>{m}</Text>
                                    </View>
                                  ))}
                                </View>
                                {block.exercise.targetMuscles && block.exercise.targetMuscles.filter(m => !(block.exercise.primaryMuscles || [block.exercise.primaryMuscle]).includes(m)).length > 0 && (
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                                    {block.exercise.targetMuscles.filter(m => !(block.exercise.primaryMuscles || [block.exercise.primaryMuscle]).includes(m)).map((m, idx) => (
                                      <View key={idx} style={{ backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textMuted }}>{m}</Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>
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

                        {/* Table Header */}
                        <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.colHead, styles.colS, { color: theme.textMuted }]}>SÉRIE</Text>
                          <Text style={[styles.colHead, styles.colM, { color: theme.textMuted }]}>CHARGE (KG)</Text>
                          <Text style={[styles.colHead, styles.colM, { color: theme.textMuted }]}>REPS</Text>
                          <Text style={[styles.colHead, styles.colRir, { color: theme.textMuted }]}>RIR</Text>
                          <View style={styles.colAction} />
                        </View>

                        {/* Set Rows */}
                        {block.exercise.sets.map((set, sIdx) => (
                          <View key={set.id} style={[styles.tableRow, { borderBottomColor: `${theme.border}40` }]}>
                            <View style={[styles.setNumBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
                              <Text style={[styles.setNumText, { color: theme.text }]}>
                                {set.setNumber}
                              </Text>
                            </View>

                            <TouchableOpacity
                              activeOpacity={0.75}
                              style={[styles.cellBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() => setKeypadTarget({ blockId: block.id, setId: set.id, field: 'weightKg', setNumber: set.setNumber, value: set.weightKg !== undefined && set.weightKg !== null ? String(set.weightKg) : '' })}
                            >
                              <Text style={[styles.cellVal, { color: set.weightKg !== undefined && set.weightKg !== null ? theme.text : theme.textMuted }]}>
                                {set.weightKg !== undefined && set.weightKg !== null ? `${set.weightKg}` : '-'}
                              </Text>
                              <Text style={[styles.cellUnit, { color: theme.textMuted }]}>kg</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.75}
                              style={[styles.cellBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() => setKeypadTarget({ blockId: block.id, setId: set.id, field: 'reps', setNumber: set.setNumber, value: set.reps !== undefined && set.reps !== null ? String(set.reps) : '' })}
                            >
                              <Text style={[styles.cellVal, { color: set.reps !== undefined && set.reps !== null ? theme.text : theme.textMuted }]}>
                                {set.reps !== undefined && set.reps !== null ? `${set.reps}` : '-'}
                              </Text>
                              <Text style={[styles.cellUnit, { color: theme.textMuted }]}>reps</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.75}
                              style={[styles.cellBtn, styles.cellRir, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() => setKeypadTarget({ blockId: block.id, setId: set.id, field: 'rir', setNumber: set.setNumber, value: set.rir !== undefined && set.rir !== null ? String(set.rir) : '' })}
                            >
                              <Text style={[styles.cellVal, { color: set.rir !== undefined && set.rir !== null ? theme.accent : theme.textMuted }]}>
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

                        {/* Add Set in card */}
                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={[styles.addSetBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
                          onPress={() => handleAddSet(block.id)}
                        >
                          <Plus size={14} color={theme.accent} style={{ marginRight: 6 }} />
                          <Text style={[styles.addSetText, { color: theme.text }]}>Ajouter une série</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {block.type === 'circuit' && (
                      <>
                        <View style={styles.blockHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Zap size={16} color={theme.accent} style={{ marginRight: 6 }} />
                            <Text style={[styles.blockTitle, { color: theme.text }]}>
                              {block.title || 'Circuit'} ({block.circuitType === 'amrap' ? `${block.amrapDurationMinutes || 12} min AMRAP` : `${block.rounds} tours`})
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveBlock(block.id)}>
                            <Trash2 size={16} color={theme.danger} />
                          </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 8 }}>
                          {block.exercises.map((item, exIdx) => {
                            const letter = String.fromCharCode(65 + exIdx);
                            const itemSetType = item.setType || 'normal';
                            const typeCfg = SET_TYPES_CONFIG[itemSetType] || SET_TYPES_CONFIG.normal;
                            return (
                              <View
                                key={item.id}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingVertical: 8,
                                  paddingHorizontal: 10,
                                  borderRadius: 8,
                                  backgroundColor: theme.background,
                                  marginBottom: 6,
                                  borderWidth: 1,
                                  borderColor: theme.border,
                                }}
                              >
                                <View
                                 style={{
                                   width: 22,
                                   height: 22,
                                   borderRadius: 11,
                                   backgroundColor: theme.accent,
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   marginRight: 8,
                                 }}
                                >
                                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{letter}</Text>
                                </View>

                                <View style={{ flex: 1, marginRight: 8 }}>
                                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                                    {item.exerciseName}
                                  </Text>
                                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '500' }}>
                                    {item.targetValue} {item.targetType === 'reps' ? 'reps' : 's'} · {item.primaryMuscle}
                                  </Text>
                                </View>

                                <View
                                  style={{
                                    backgroundColor: typeCfg.color,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                                    {typeCfg.code} • {typeCfg.label.split(' ')[0]}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </View>
                ))}

                {/* Add Exercise Hero Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.addExDashedCard, { borderColor: theme.accent, backgroundColor: `${theme.accent}0A` }]}
                  onPress={() => setShowExerciseSelector(true)}
                >
                  <View style={[styles.addExIconCircle, { backgroundColor: `${theme.accent}20` }]}>
                    <Plus size={18} color={theme.accent} />
                  </View>
                  <Text style={[styles.addExText, { color: theme.text }]}>Ajouter un exercice à la séance</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Sticky Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            >
              <CheckCircle2 size={20} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Enregistrer la séance</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Numeric Keypad for Detailed Mode */}
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

      {/* Template Selector Modal (Dropdown Pop-up) */}
      <Modal
        visible={showTemplateSelector}
        transparent
        animationType="slide"
        onRequestClose={handleCloseTemplateSelector}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleCloseTemplateSelector}
            accessibilityLabel="Fermer le sélecteur de programme"
          />
          <Animated.View
            style={[
              styles.content,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                height: '75%',
                transform: [{ translateY: templateTranslateY }],
              },
            ]}
          >
            {/* Drag Handle & Header */}
            <View style={[styles.headerContainer, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
              {/* Draggable surface covering the full header */}
              <View style={StyleSheet.absoluteFillObject} {...templatePanResponder.panHandlers} />

              <View pointerEvents="box-none" style={{ width: '100%' }}>
                <View pointerEvents="none" style={styles.dragHandleContainer}>
                  <View style={[styles.dragHandle, { backgroundColor: theme.background }]} />
                </View>

                <View pointerEvents="box-none" style={styles.header}>
                  <View pointerEvents="none" style={styles.headerLeft}>
                    <View style={[styles.headerIconBadge, { backgroundColor: `${theme.accent}18`, borderColor: `${theme.accent}30` }]}>
                      <Dumbbell size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.title, { color: theme.text }]}>Choisir un programme</Text>
                      <Text style={[styles.subtitle, { color: theme.textMuted }]}>Ordre alphabétique</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleCloseTemplateSelector}
                    style={[styles.closeBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Fermer"
                  >
                    <X size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {templates.length > 3 && (
              <View style={{ padding: 12, paddingBottom: 6 }}>
                <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                  <Search size={16} color={theme.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Rechercher un programme..."
                    placeholderTextColor={theme.textMuted}
                    value={templateSearchQuery}
                    onChangeText={setTemplateSearchQuery}
                  />
                  {templateSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setTemplateSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <ScrollView style={{ flex: 1, padding: 12 }} showsVerticalScrollIndicator={false}>
              {/* Option 1 : Séance libre */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.templateSelectCard,
                  {
                    backgroundColor: selectedTemplateId === null ? `${theme.accent}12` : theme.surface,
                    borderColor: selectedTemplateId === null ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => {
                  handleSelectTemplate('free');
                  handleCloseTemplateSelector();
                }}
              >
                <View style={[styles.templateSelectIconBadge, { backgroundColor: selectedTemplateId === null ? `${theme.accent}25` : theme.background }]}>
                  <Sparkles size={18} color={selectedTemplateId === null ? theme.accent : theme.textMuted} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.templateSelectTitle, { color: selectedTemplateId === null ? theme.accent : theme.text }]}>
                    Séance libre
                  </Text>
                  <Text style={[styles.templateSelectSub, { color: theme.textMuted }]}>
                    Aucun programme prédéfini, exercices ajoutés librement
                  </Text>
                </View>
                {selectedTemplateId === null && (
                  <View style={[styles.checkCircle, { backgroundColor: theme.accent }]}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Templates list */}
              {filteredTemplates.map(t => {
                const isSelected = selectedTemplateId === t.id;
                const blocksCount = getTemplateBlocks(t).length;
                return (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.7}
                    style={[
                      styles.templateSelectCard,
                      {
                        backgroundColor: isSelected ? `${theme.accent}12` : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.border,
                      },
                    ]}
                    onPress={() => {
                      handleSelectTemplate(t.id);
                      handleCloseTemplateSelector();
                    }}
                  >
                    <View style={[styles.templateSelectIconBadge, { backgroundColor: isSelected ? `${theme.accent}25` : theme.background }]}>
                      <Dumbbell size={18} color={isSelected ? theme.accent : theme.textMuted} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.templateSelectTitle, { color: isSelected ? theme.accent : theme.text }]}>
                        {t.title}
                      </Text>
                      <Text style={[styles.templateSelectSub, { color: theme.textMuted }]}>
                        {blocksCount} exercice{blocksCount > 1 ? 's' : ''} configuré{blocksCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: theme.accent }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Exercise Selector Modal for Detailed Mode */}
      <Modal visible={showExerciseSelector} transparent animationType="slide" onRequestClose={() => setShowExerciseSelector(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowExerciseSelector(false)}
            accessibilityLabel="Fermer le sélecteur d'exercice"
          />
          <View style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.border, height: '80%' }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <Text style={[styles.title, { color: theme.text }]}>Sélectionner un exercice</Text>
              <TouchableOpacity onPress={() => setShowExerciseSelector(false)} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 12 }}>
              <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
                <Search size={18} color={theme.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Rechercher..."
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {filteredExercises.map(ex => (
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
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    height: '93%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  headerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 26,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    width: 105,
  },
  durationInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  quickPresetsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  dropdownIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  dropdownSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  dropdownChevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  templateSelectIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateSelectTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  templateSelectSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  segmentTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  tabSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  modeNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  modeNoteText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },
  detailedSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  prefillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  prefillBannerText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    flex: 1,
  },
  blockCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  muscleSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  colHead: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  colS: { width: 34, textAlign: 'center' },
  colM: { flex: 1, textAlign: 'center' },
  colRir: { width: 44, textAlign: 'center' },
  colAction: { width: 34, alignItems: 'center' },
  setNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    paddingHorizontal: 4,
  },
  cellRir: {
    flex: 0,
    width: 44,
  },
  cellVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  cellUnit: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addExDashedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 20,
    gap: 8,
  },
  addExIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  exRow: {
    padding: 16,
    borderBottomWidth: 1,
  },
  exName: {
    fontSize: 15,
    fontWeight: '600',
  },
  exCat: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
