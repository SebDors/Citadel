import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useWorkout } from '../src/context/WorkoutContext';
import { useTheme } from '../src/context/ThemeContext';
import { LiveWorkoutHeader } from '../src/components/Workout/LiveWorkoutHeader';
import { ExerciseCard } from '../src/components/Workout/ExerciseCard';
import { RestTimerBar } from '../src/components/Workout/RestTimerBar';
import { Button } from '../src/components/UI/Button';
import { useRouter } from 'expo-router';
import { Plus, Dumbbell, ArrowLeft } from 'lucide-react-native';

export default function LiveWorkoutScreen() {
  const {
    activeSession,
    finishWorkout,
    cancelWorkout,
    updateSet,
    toggleSetComplete,
    addSet,
    removeSet,
    addExerciseToActiveWorkout,
    removeExercise,
    duplicateExercise,
  } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');

  if (!activeSession) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune séance en cours</Text>
          <Button title="Retour à l'accueil" variant="primary" onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  const handleFinish = async () => {
    await finishWorkout();
    router.replace('/(tabs)/history');
  };

  const handleCancel = () => {
    cancelWorkout();
    router.replace('/(tabs)');
  };

  const handleAddExercise = () => {
    if (!newExName || !newExMuscle) return;
    addExerciseToActiveWorkout(newExName, newExMuscle, [newExMuscle]);
    setNewExName('');
    setNewExMuscle('');
    setShowAddExModal(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Bar Navigation */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Workout Tracker</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Carte d'En-tête de Séance (Fixe en haut) */}
        <LiveWorkoutHeader session={activeSession} onFinish={handleFinish} onCancel={handleCancel} />

        {/* 2. Cartes d'Exercices (Liste défilante) */}
        {activeSession.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onUpdateSet={(setId, field, val) => updateSet(ex.id, setId, field, val)}
            onToggleSetComplete={(setId) => toggleSetComplete(ex.id, setId)}
            onAddSet={() => addSet(ex.id)}
            onRemoveSet={(setId) => removeSet(ex.id, setId)}
            onDuplicateExercise={() => duplicateExercise(ex.id)}
            onRemoveExercise={() => removeExercise(ex.id)}
          />
        ))}

        {/* Bouton Ajouter un exercice */}
        <Button
          title="Ajouter un exercice à la séance"
          variant="outline"
          onPress={() => setShowAddExModal(true)}
          icon={<Plus size={18} color={theme.accent} />}
          style={{ marginTop: 14 }}
        />
      </ScrollView>

      {/* Modal Ajout d'Exercice */}
      <Modal visible={showAddExModal} transparent animationType="fade" onRequestClose={() => setShowAddExModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddExModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Ajouter un nouvel exercice</Text>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              placeholder="Nom de l'exercice (ex: Développé Couché)"
              placeholderTextColor={theme.textMuted}
              value={newExName}
              onChangeText={setNewExName}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              placeholder="Muscle principal (ex: Pectoraux, Triceps)"
              placeholderTextColor={theme.textMuted}
              value={newExMuscle}
              onChangeText={setNewExMuscle}
            />

            <View style={styles.modalButtons}>
              <Button title="Annuler" variant="outline" onPress={() => setShowAddExModal(false)} style={{ flex: 1, marginRight: 6 }} />
              <Button title="Ajouter" variant="primary" onPress={handleAddExercise} style={{ flex: 1, marginLeft: 6 }} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Rest Timer Bar */}
      <RestTimerBar />
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
    padding: 14,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 6,
  },
});
