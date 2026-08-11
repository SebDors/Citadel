import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { useWorkout } from '../src/context/WorkoutContext';
import { Button } from '../src/components/UI/Button';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EXERCISE_DATABASE, SharedExercise } from '../src/constants/exerciseDatabase';
import {
  WorkoutExercise,
  WorkoutTemplate,
  SetType,
  SET_TYPES_CONFIG,
  calculateEstimatedWorkoutMinutes,
} from '../src/types';
import {
  ArrowLeft,
  Save,
  Plus,
  Clock,
  Trash2,
  Search,
  X,
  Check,
  Timer,
  RotateCcw,
} from 'lucide-react-native';

const PRESET_REST_TIMES = [45, 60, 75, 90, 120, 180];

export default function TemplateEditorScreen() {
  const { theme } = useTheme();
  const { data, saveTemplate } = useWorkout();
  const router = useRouter();
  const params = useLocalSearchParams();

  const templateIdParam = params.id as string | undefined;

  const [title, setTitle] = useState('');
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(75);
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Target set for type picker modal: { exIdx, setIdx }
  const [activeSetTarget, setActiveSetTarget] = useState<{ exIdx: number; setIdx: number } | null>(null);

  // Load existing template if editing
  useEffect(() => {
    if (templateIdParam && data?.templates) {
      const existing = data.templates.find((t) => t.id === templateIdParam);
      if (existing) {
        setTitle(existing.title);
        setSelectedExercises(JSON.parse(JSON.stringify(existing.exercises)));
        setDefaultRestSeconds(existing.defaultRestSeconds || 75);
      }
    }
  }, [templateIdParam, data?.templates]);

  const estimatedMinutes = calculateEstimatedWorkoutMinutes(selectedExercises);

  // Add exercise from DB
  const handleAddSharedExercise = (ex: SharedExercise) => {
    const newEx: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      primaryMuscle: ex.primaryMuscle,
      targetMuscles: ex.targetMuscles,
      restSeconds: defaultRestSeconds || ex.defaultRestSeconds || 75,
      sets: [
        { id: `s1_${Date.now()}`, setNumber: 1, type: 'normal', rir: 2, completed: false },
        { id: `s2_${Date.now()}`, setNumber: 2, type: 'normal', rir: 2, completed: false },
        { id: `s3_${Date.now()}`, setNumber: 3, type: 'normal', rir: 2, completed: false },
      ],
    };

    setSelectedExercises([...selectedExercises, newEx]);
    setShowPickerModal(false);
    setSearchQuery('');
  };

  const handleRemoveExercise = (idx: number) => {
    const updated = selectedExercises.filter((_, i) => i !== idx);
    setSelectedExercises(updated);
  };

  // Default rest adjustment for session
  const handleAdjustDefaultRest = (delta: number) => {
    setDefaultRestSeconds((prev) => Math.max(0, prev + delta));
  };

  // Specific rest adjustment for an exercise
  const handleAdjustExerciseRest = (exIdx: number, delta: number) => {
    const updated = [...selectedExercises];
    const currentRest = updated[exIdx].restSeconds ?? defaultRestSeconds;
    updated[exIdx].restSeconds = Math.max(0, currentRest + delta);
    setSelectedExercises(updated);
  };

  // Reset exercise rest to default session rest
  const handleResetExerciseRest = (exIdx: number) => {
    const updated = [...selectedExercises];
    updated[exIdx].restSeconds = defaultRestSeconds;
    setSelectedExercises(updated);
  };

  // Add set to exercise
  const handleAddSet = (exIdx: number) => {
    const updated = [...selectedExercises];
    const targetEx = updated[exIdx];
    const newSetNumber = targetEx.sets.length + 1;
    targetEx.sets.push({
      id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      setNumber: newSetNumber,
      type: 'normal',
      rir: 2,
      completed: false,
    });
    setSelectedExercises(updated);
  };

  // Remove specific set from exercise
  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...selectedExercises];
    const targetEx = updated[exIdx];
    if (targetEx.sets.length <= 1) return;

    targetEx.sets = targetEx.sets.filter((_, i) => i !== setIdx).map((s, i) => ({
      ...s,
      setNumber: i + 1,
    }));

    setSelectedExercises(updated);
  };

  // Update set type
  const handleUpdateSetType = (exIdx: number, setIdx: number, newType: SetType) => {
    const updated = [...selectedExercises];
    updated[exIdx].sets[setIdx].type = newType;
    setSelectedExercises(updated);
    setActiveSetTarget(null);
  };

  const handleSave = async () => {
    if (!title) return;

    const newTemplate: WorkoutTemplate = {
      id: templateIdParam || `tpl_${Date.now()}`,
      title,
      defaultRestSeconds,
      exercises: selectedExercises,
    };

    await saveTemplate(newTemplate);
    router.back();
  };

  // Filter exercises for modal
  const filteredDatabase = EXERCISE_DATABASE.filter((ex) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscle.toLowerCase().includes(q) ||
      ex.category.toLowerCase().includes(q) ||
      ex.targetMuscles.some((m) => m.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 0,
        },
      ]}
    >
      {/* Top Navigation */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>
          {templateIdParam ? 'Modifier la séance' : 'Créer une séance'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Save size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Nom du programme */}
        <Text style={[styles.label, { color: theme.text }]}>Nom du programme</Text>
        <TextInput
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
          ]}
          placeholder="ex: Upper B, Push, Legs..."
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Temps de repos par défaut de la séance */}
        <View style={[styles.defaultRestCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.defaultRestHeader}>
            <View style={styles.rowAlign}>
              <Timer size={18} color={theme.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.defaultRestTitle, { color: theme.text }]}>
                Repos par défaut de la séance
              </Text>
            </View>
            <View style={styles.restStepper}>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => handleAdjustDefaultRest(-15)}
              >
                <Text style={[styles.stepperBtnText, { color: theme.text }]}>-15s</Text>
              </TouchableOpacity>
              <Text style={[styles.restValueText, { color: theme.accent }]}>{defaultRestSeconds}s</Text>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => handleAdjustDefaultRest(15)}
              >
                <Text style={[styles.stepperBtnText, { color: theme.text }]}>+15s</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Raccourcis temps de repos */}
          <View style={styles.presetsRow}>
            {PRESET_REST_TIMES.map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: defaultRestSeconds === sec ? theme.accent : theme.cardBg,
                    borderColor: defaultRestSeconds === sec ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => setDefaultRestSeconds(sec)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: defaultRestSeconds === sec ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {sec}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.defaultRestHint, { color: theme.textMuted }]}>
            Ce temps sera attribué par défaut aux nouveaux exercices ajoutés.
          </Text>
        </View>

        {/* Estimation de la durée de la séance */}
        <View style={[styles.estimatedBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Clock size={18} color={theme.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.estimatedText, { color: theme.text }]}>
            Durée estimée : <Text style={{ fontWeight: '900', color: theme.accent }}>~ {estimatedMinutes} min</Text>
          </Text>
        </View>

        {/* Liste des exercices ajoutés */}
        <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
          Exercices de la séance ({selectedExercises.length})
        </Text>

        {selectedExercises.map((ex, exIdx) => {
          const exRest = ex.restSeconds ?? defaultRestSeconds;
          return (
            <View key={ex.id} style={[styles.exCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              {/* En-tête de l'exercice */}
              <View style={styles.exHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.exName, { color: theme.text }]}>{ex.exerciseName}</Text>
                  <Text style={[styles.exMuscle, { color: theme.textMuted }]}>{ex.primaryMuscle}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveExercise(exIdx)}>
                  <Trash2 size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>

              {/* Reglage du temps de repos spécifique de l'exercice */}
              <View style={[styles.exRestRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.rowAlign}>
                  <Timer size={14} color={theme.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.exRestLabel, { color: theme.textMuted }]}>Repos exercice :</Text>
                </View>
                <View style={styles.rowAlign}>
                  <TouchableOpacity
                    style={[styles.smallStepperBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    onPress={() => handleAdjustExerciseRest(exIdx, -15)}
                  >
                    <Text style={[styles.smallStepperText, { color: theme.text }]}>-15s</Text>
                  </TouchableOpacity>
                  <Text style={[styles.exRestValue, { color: theme.accent }]}>{exRest}s</Text>
                  <TouchableOpacity
                    style={[styles.smallStepperBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    onPress={() => handleAdjustExerciseRest(exIdx, 15)}
                  >
                    <Text style={[styles.smallStepperText, { color: theme.text }]}>+15s</Text>
                  </TouchableOpacity>

                  {exRest !== defaultRestSeconds && (
                    <TouchableOpacity
                      style={styles.resetRestBtn}
                      onPress={() => handleResetExerciseRest(exIdx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <RotateCcw size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Liste des Séries pour l'exercice */}
              <View style={styles.setsContainer}>
                <View style={styles.setsHeaderRow}>
                  <Text style={[styles.setsTitle, { color: theme.text }]}>
                    Séries ({ex.sets.length})
                  </Text>
                  <Text style={[styles.setsHint, { color: theme.textMuted }]}>
                    Cliquez sur le badge pour changer le type
                  </Text>
                </View>

                {ex.sets.map((set, setIdx) => {
                  const setTypeInfo = SET_TYPES_CONFIG[set.type] || SET_TYPES_CONFIG.normal;
                  return (
                    <View
                      key={set.id}
                      style={[styles.setDetailRow, { borderBottomColor: theme.border }]}
                    >
                      <Text style={[styles.setIndexText, { color: theme.text }]}>
                        Série {set.setNumber}
                      </Text>

                      {/* Badge / Sélecteur de Type de Série */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.typeBadge, { backgroundColor: setTypeInfo.color }]}
                        onPress={() => setActiveSetTarget({ exIdx, setIdx })}
                      >
                        <Text style={styles.typeBadgeCode}>{setTypeInfo.code}</Text>
                        <Text style={styles.typeBadgeLabel}>{setTypeInfo.label}</Text>
                      </TouchableOpacity>

                      {/* Supprimer une série */}
                      {ex.sets.length > 1 ? (
                        <TouchableOpacity
                          style={styles.deleteSetBtn}
                          onPress={() => handleRemoveSet(exIdx, setIdx)}
                        >
                          <Trash2 size={15} color={theme.danger} />
                        </TouchableOpacity>
                      ) : (
                        <View style={{ width: 24 }} />
                      )}
                    </View>
                  );
                })}

                {/* Bouton Ajouter une série */}
                <TouchableOpacity
                  style={[styles.addSetBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => handleAddSet(exIdx)}
                >
                  <Plus size={14} color={theme.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.addSetBtnText, { color: theme.accent }]}>Ajouter une série</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Button
          title="Ajouter un exercice depuis la base"
          variant="outline"
          onPress={() => setShowPickerModal(true)}
          icon={<Plus size={16} color={theme.accent} />}
          style={{ marginTop: 12 }}
        />

        <Button
          title="Enregistrer le programme"
          variant="primary"
          onPress={handleSave}
          disabled={!title || selectedExercises.length === 0}
          style={{ marginTop: 24 }}
        />
      </ScrollView>

      {/* Modal / Volet de Sélection du Type de Série */}
      <Modal
        visible={activeSetTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSetTarget(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveSetTarget(null)}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Choisir le type de série</Text>
              <TouchableOpacity onPress={() => setActiveSetTarget(null)}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {activeSetTarget &&
              Object.values(SET_TYPES_CONFIG).map((cfg) => {
                const currentSet = selectedExercises[activeSetTarget.exIdx]?.sets[activeSetTarget.setIdx];
                const isSelected = currentSet?.type === cfg.type;

                return (
                  <TouchableOpacity
                    key={cfg.type}
                    style={[
                      styles.typeOptionRow,
                      { borderBottomColor: theme.border },
                      isSelected && { backgroundColor: theme.surface },
                    ]}
                    onPress={() => handleUpdateSetType(activeSetTarget.exIdx, activeSetTarget.setIdx, cfg.type)}
                  >
                    <View style={[styles.typeBadgeCircle, { backgroundColor: cfg.color }]}>
                      <Text style={styles.typeBadgeText}>{cfg.code}</Text>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.typeOptionLabel, { color: theme.text }]}>{cfg.label}</Text>
                      <Text style={[styles.typeOptionDesc, { color: theme.textMuted }]}>
                        {cfg.description}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={theme.accent} />}
                  </TouchableOpacity>
                );
              })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Sélection d'Exercice avec Barre de Recherche */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPickerModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Base de Données d'Exercices</Text>

            {/* Barre de Recherche Clavier */}
            <View style={[styles.searchBarBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Rechercher par nom ou muscle..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {filteredDatabase.length === 0 ? (
                <Text style={[styles.noResultText, { color: theme.textMuted }]}>Aucun exercice trouvé</Text>
              ) : (
                filteredDatabase.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[styles.dbItemRow, { borderBottomColor: theme.border }]}
                    onPress={() => handleAddSharedExercise(ex)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dbItemName, { color: theme.text }]}>{ex.name}</Text>
                      <Text style={[styles.dbItemMuscle, { color: theme.textMuted }]}>
                        {ex.primaryMuscle} • {ex.category} • {defaultRestSeconds || ex.defaultRestSeconds}s repos
                      </Text>
                    </View>
                    <Plus size={18} color={theme.accent} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  defaultRestCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  defaultRestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  defaultRestTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restStepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  restValueText: {
    fontSize: 15,
    fontWeight: '900',
    marginHorizontal: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  defaultRestHint: {
    fontSize: 11,
    marginTop: 4,
  },
  estimatedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  estimatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exName: {
    fontSize: 15,
    fontWeight: '800',
  },
  exMuscle: {
    fontSize: 12,
  },
  exRestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  exRestLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  exRestValue: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 6,
  },
  smallStepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  smallStepperText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resetRestBtn: {
    marginLeft: 6,
    padding: 2,
  },
  setsContainer: {
    marginTop: 4,
  },
  setsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  setsTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  setsHint: {
    fontSize: 10,
  },
  setDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  setIndexText: {
    fontSize: 13,
    fontWeight: '600',
    width: 60,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeCode: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    marginRight: 6,
  },
  typeBadgeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteSetBtn: {
    padding: 4,
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
  addSetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  typeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: 0.5,
    marginVertical: 2,
  },
  typeBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  typeOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeOptionDesc: {
    fontSize: 12,
  },
  modalContent: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  noResultText: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
  },
  dbItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  dbItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dbItemMuscle: {
    fontSize: 11,
  },
});
