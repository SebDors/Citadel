import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Button } from '../UI/Button';
import { X, Calendar as CalendarIcon, Clock, Zap, List, Plus, Trash2, Edit2, CheckCircle2, Search } from 'lucide-react-native';
import { WorkoutSession, WorkoutBlock, getTemplateBlocks, SingleExerciseBlock, WorkoutSet, SET_TYPES_CONFIG } from '../../types';
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
  
  const [mode, setMode] = useState<'express' | 'detailed'>('express');
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);

  // Keypad state
  const [keypadVisible, setKeypadVisible] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<{ blockId: string; setId: string; field: NumericFieldType; setNumber: number; value: string } | null>(null);

  // Exercise Selector state
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setDateStr(formatISOToFrench(initialDate) || todayFrenchStr);
    } else {
      // Reset
      setDateStr(formatISOToFrench(initialDate) || todayFrenchStr);
      setTimeStr('18:00');
      setDurationMin('45');
      setSessionTitle('Séance libre');
      setSelectedTemplateId(null);
      setMode('express');
      setBlocks([]);
      setKeypadVisible(false);
    }
  }, [visible, initialDate]);

  const templates = data?.templates || [];

  const handleSelectTemplate = (templateId: string) => {
    if (templateId === 'free') {
      setSelectedTemplateId(null);
      setSessionTitle('Séance libre');
      setBlocks([]);
      return;
    }
    const t = templates.find(x => x.id === templateId);
    if (t) {
      setSelectedTemplateId(t.id);
      setSessionTitle(t.title);
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

  const handleAddExercise = (ex: SharedExercise) => {
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
        sets: [
          { id: `set_${Date.now()}_1`, setNumber: 1, type: 'normal', completed: true }
        ]
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
        <View style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Top Bar */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Ajouter une séance passée</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {/* Section 1: Date & Heure */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Date (JJ/MM/AAAA)</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="ex: 29/08/2026"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Heure (HH:MM)</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    value={timeStr}
                    onChangeText={setTimeStr}
                    placeholder="18:00"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Durée (minutes)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]}
                    value={durationMin}
                    onChangeText={setDurationMin}
                    keyboardType="numeric"
                  />
                  <View style={{ flexDirection: 'row', marginLeft: 12 }}>
                    {[30, 45, 60, 90].map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.quickBtn,
                          { backgroundColor: durationMin === m.toString() ? theme.accent : theme.background }
                        ]}
                        onPress={() => setDurationMin(m.toString())}
                      >
                        <Text style={{ fontSize: 12, color: durationMin === m.toString() ? '#fff' : theme.text }}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Section 2: Sélection Modèle */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.label, { color: theme.textMuted, marginBottom: 8 }]}>Séance à enregistrer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.templateChip,
                    { backgroundColor: selectedTemplateId === null ? theme.accent : theme.background }
                  ]}
                  onPress={() => handleSelectTemplate('free')}
                >
                  <Text style={{ color: selectedTemplateId === null ? '#fff' : theme.text, fontWeight: '600' }}>
                    Séance libre
                  </Text>
                </TouchableOpacity>
                {templates.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.templateChip,
                      { backgroundColor: selectedTemplateId === t.id ? theme.accent : theme.background }
                    ]}
                    onPress={() => handleSelectTemplate(t.id)}
                  >
                    <Text style={{ color: selectedTemplateId === t.id ? '#fff' : theme.text, fontWeight: '600' }}>
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={[styles.label, { color: theme.textMuted }]}>Nom de la séance</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={sessionTitle}
                onChangeText={setSessionTitle}
              />
            </View>

            {/* Section 3: Mode */}
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  { backgroundColor: mode === 'express' ? theme.accent : theme.surface }
                ]}
                onPress={() => setMode('express')}
              >
                <Zap size={16} color={mode === 'express' ? '#fff' : theme.text} />
                <Text style={[styles.modeBtnText, { color: mode === 'express' ? '#fff' : theme.text }]}>Express</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  { backgroundColor: mode === 'detailed' ? theme.accent : theme.surface }
                ]}
                onPress={() => setMode('detailed')}
              >
                <List size={16} color={mode === 'detailed' ? '#fff' : theme.text} />
                <Text style={[styles.modeBtnText, { color: mode === 'detailed' ? '#fff' : theme.text }]}>Détaillé</Text>
              </TouchableOpacity>
            </View>

            {mode === 'detailed' && (
              <View style={styles.detailedSection}>
                {blocks.map((block, bIdx) => (
                  <View key={block.id} style={[styles.blockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {block.type === 'single' && (
                      <>
                        <View style={styles.blockHeader}>
                          <Text style={[styles.blockTitle, { color: theme.text }]}>{block.exercise.exerciseName}</Text>
                          <TouchableOpacity onPress={() => handleRemoveBlock(block.id)}>
                            <Trash2 size={16} color={theme.danger} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.colS, { color: theme.textMuted }]}>Série</Text>
                          <Text style={[styles.colM, { color: theme.textMuted }]}>kg</Text>
                          <Text style={[styles.colM, { color: theme.textMuted }]}>Reps</Text>
                          <Text style={styles.colAction}></Text>
                        </View>
                        {block.exercise.sets.map((set, sIdx) => (
                          <View key={set.id} style={styles.tableRow}>
                            <Text style={[styles.colS, { color: theme.text, fontWeight: '700' }]}>{set.setNumber}</Text>
                            <TouchableOpacity
                              style={[styles.cellBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() => setKeypadTarget({ blockId: block.id, setId: set.id, field: 'weightKg', setNumber: set.setNumber, value: set.weightKg?.toString() || '' })}
                            >
                              <Text style={{ color: theme.text }}>{set.weightKg || '-'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.cellBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                              onPress={() => setKeypadTarget({ blockId: block.id, setId: set.id, field: 'reps', setNumber: set.setNumber, value: set.reps?.toString() || '' })}
                            >
                              <Text style={{ color: theme.text }}>{set.reps || '-'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.colAction} onPress={() => handleRemoveSet(block.id, set.id)}>
                              <Trash2 size={16} color={theme.textMuted} />
                            </TouchableOpacity>
                          </View>
                        ))}
                        <Button
                          title="Ajouter série"
                          variant="outline"
                          onPress={() => handleAddSet(block.id)}
                          style={{ marginTop: 8 }}
                        />
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

                <Button
                  title="Ajouter un exercice"
                  variant="outline"
                  icon={<Plus size={18} color={theme.text} />}
                  onPress={() => setShowExerciseSelector(true)}
                  style={{ marginBottom: 20 }}
                />
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button title="Enregistrer" variant="primary" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>

      {/* Numeric Keypad for Detailed Mode */}
      {keypadTarget && (
        <CustomNumericKeypad
          visible={!!keypadTarget}
          onClose={() => setKeypadTarget(null)}
          setNumber={keypadTarget.setNumber}
          activeField={keypadTarget.field}
          value={keypadTarget.value}
          onChangeValue={(val) => setKeypadTarget({ ...keypadTarget, value: val })}
          onValidate={(finalVal) => {
            const num = parseFloat(finalVal);
            setBlocks(prev => prev.map(b => {
              if (b.id === keypadTarget.blockId && b.type === 'single') {
                return {
                  ...b,
                  exercise: {
                    ...b.exercise,
                    sets: b.exercise.sets.map(s => s.id === keypadTarget.setId ? { ...s, [keypadTarget.field]: isNaN(num) ? undefined : num } : s)
                  }
                };
              }
              return b;
            }));
            setKeypadTarget(null);
          }}
          onClear={() => setKeypadTarget({ ...keypadTarget, value: '' })}
        />
      )}

      {/* Exercise Selector Modal for Detailed Mode */}
      <Modal visible={showExerciseSelector} transparent animationType="slide" onRequestClose={() => setShowExerciseSelector(false)}>
        <View style={styles.overlay}>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    height: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modeBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailedSection: {
    marginBottom: 20,
  },
  blockCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colS: { width: 40, fontSize: 13, textAlign: 'center' },
  colM: { flex: 1, fontSize: 13, textAlign: 'center' },
  colAction: { width: 40, alignItems: 'center' },
  cellBtn: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
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
});
