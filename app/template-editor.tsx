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
import { WorkoutExercise, WorkoutTemplate, calculateEstimatedWorkoutMinutes } from '../src/types';
import { ArrowLeft, Save, Plus, Clock, Trash2, Dumbbell, Search } from 'lucide-react-native';

export default function TemplateEditorScreen() {
  const { theme } = useTheme();
  const { data, saveTemplate } = useWorkout();
  const router = useRouter();
  const params = useLocalSearchParams();

  const templateIdParam = params.id as string | undefined;

  const [title, setTitle] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load existing template if editing
  useEffect(() => {
    if (templateIdParam && data?.templates) {
      const existing = data.templates.find((t) => t.id === templateIdParam);
      if (existing) {
        setTitle(existing.title);
        setSelectedExercises(JSON.parse(JSON.stringify(existing.exercises)));
      }
    }
  }, [templateIdParam, data?.templates]);

  const estimatedMinutes = calculateEstimatedWorkoutMinutes(selectedExercises);

  const handleAddSharedExercise = (ex: SharedExercise) => {
    const newEx: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      primaryMuscle: ex.primaryMuscle,
      targetMuscles: ex.targetMuscles,
      restSeconds: ex.defaultRestSeconds || 75,
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

  const handleAdjustSetsCount = (idx: number, delta: number) => {
    const updated = [...selectedExercises];
    const targetEx = updated[idx];
    const currentSets = targetEx.sets;

    if (delta > 0) {
      const newSetNumber = currentSets.length + 1;
      targetEx.sets.push({
        id: `s_${Date.now()}_${newSetNumber}`,
        setNumber: newSetNumber,
        type: 'normal',
        rir: 2,
        completed: false,
      });
    } else if (currentSets.length > 1) {
      targetEx.sets.pop();
    }

    setSelectedExercises(updated);
  };

  const handleSave = async () => {
    if (!title) return;

    const newTemplate: WorkoutTemplate = {
      id: templateIdParam || `tpl_${Date.now()}`,
      title,
      exercises: selectedExercises,
    };

    await saveTemplate(newTemplate);
    router.back();
  };

  // Filter 52 exercises for search modal
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0 }]}>
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
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          placeholder="ex: Upper B, Push, Legs..."
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />

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

        {selectedExercises.map((ex, idx) => (
          <View key={ex.id} style={[styles.exCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.exHeader}>
              <View>
                <Text style={[styles.exName, { color: theme.text }]}>{ex.exerciseName}</Text>
                <Text style={[styles.exMuscle, { color: theme.textMuted }]}>{ex.primaryMuscle}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveExercise(idx)}>
                <Trash2 size={18} color={theme.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.setsConfigRow}>
              <Text style={[styles.setsLabel, { color: theme.text }]}>Séries : {ex.sets.length}</Text>
              <View style={styles.setButtonsGroup}>
                <TouchableOpacity
                  style={[styles.setBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => handleAdjustSetsCount(idx, -1)}
                >
                  <Text style={[styles.setBtnText, { color: theme.text }]}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.setBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => handleAdjustSetsCount(idx, 1)}
                >
                  <Text style={[styles.setBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

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

      {/* Modal Sélection d'Exercice avec Barre de Recherche */}
      <Modal visible={showPickerModal} transparent animationType="slide" onRequestClose={() => setShowPickerModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPickerModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
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
                        {ex.primaryMuscle} • {ex.category} • {ex.defaultRestSeconds}s repos
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
    marginBottom: 8,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exName: {
    fontSize: 15,
    fontWeight: '800',
  },
  exMuscle: {
    fontSize: 12,
  },
  setsConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setsLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  setButtonsGroup: {
    flexDirection: 'row',
  },
  setBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  setBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
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
