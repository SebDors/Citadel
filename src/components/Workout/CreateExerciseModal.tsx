import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Button } from '../UI/Button';
import { SharedExercise } from '../../constants/exerciseDatabase';
import { X, Check } from 'lucide-react-native';

const CATEGORIES: Array<'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos'> = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Bras',
  'Jambes',
  'Abdos',
];

interface CreateExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  initialExercise?: SharedExercise | null;
  onSuccess?: (createdExercise: SharedExercise) => void;
}

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
  visible,
  onClose,
  initialExercise,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { addCustomExercise, updateCustomExercise } = useWorkout();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos'>('Pectoraux');
  const [primaryMuscle, setPrimaryMuscle] = useState('');
  const [targetMusclesInput, setTargetMusclesInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialExercise) {
      setName(initialExercise.name);
      setCategory(initialExercise.category);
      setPrimaryMuscle(initialExercise.primaryMuscle);
      setTargetMusclesInput(initialExercise.targetMuscles.join(', '));
    } else {
      setName('');
      setCategory('Pectoraux');
      setPrimaryMuscle('');
      setTargetMusclesInput('');
    }
    setErrorMsg('');
  }, [initialExercise, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg("Veuillez saisir un nom d'exercice.");
      return;
    }
    if (!primaryMuscle.trim()) {
      setErrorMsg('Veuillez saisir le muscle principal.');
      return;
    }

    setErrorMsg('');
    setSaving(true);

    try {
      const parsedTargetMuscles = targetMusclesInput
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      if (initialExercise) {
        const updated: SharedExercise = {
          ...initialExercise,
          name: name.trim(),
          category,
          primaryMuscle: primaryMuscle.trim(),
          targetMuscles: parsedTargetMuscles.length > 0 ? parsedTargetMuscles : [primaryMuscle.trim()],
        };
        await updateCustomExercise(updated);
        if (onSuccess) onSuccess(updated);
      } else {
        const created = await addCustomExercise({
          name: name.trim(),
          category,
          primaryMuscle: primaryMuscle.trim(),
          targetMuscles: parsedTargetMuscles.length > 0 ? parsedTargetMuscles : [primaryMuscle.trim()],
          defaultRestSeconds: 75,
        });
        if (onSuccess) onSuccess(created);
      }

      onClose();
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de l'exercice:", e);
      setErrorMsg('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                {initialExercise ? 'Modifier l\'exercice' : 'Créer un exercice'}
              </Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              {errorMsg ? <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text> : null}

              {/* Nom de l'exercice */}
              <Text style={[styles.label, { color: theme.text }]}>Nom de l'exercice *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="Ex: Développé Incliné Haltères"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />

              {/* Catégorie musculaire */}
              <Text style={[styles.label, { color: theme.text }]}>Catégorie *</Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.7}
                      style={[
                        styles.categoryChip,
                        {
                          borderColor: isSelected ? theme.accent : theme.border,
                          backgroundColor: isSelected ? theme.accent : theme.surface,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Muscle principal */}
              <Text style={[styles.label, { color: theme.text }]}>Muscle principal *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="Ex: Pectoraux (Haut)"
                placeholderTextColor={theme.textMuted}
                value={primaryMuscle}
                onChangeText={setPrimaryMuscle}
              />

              {/* Muscles secondaires / cibles */}
              <Text style={[styles.label, { color: theme.text }]}>Muscles secondaires (séparés par virgules)</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="Ex: Triceps, Épaules"
                placeholderTextColor={theme.textMuted}
                value={targetMusclesInput}
                onChangeText={setTargetMusclesInput}
              />
            </ScrollView>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title={saving ? 'Enregistrement...' : 'Enregistrer'}
                variant="primary"
                disabled={saving}
                onPress={handleSave}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 10,
  },
});
