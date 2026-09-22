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
import { MUSCLE_OPTIONS_PER_CATEGORY } from '../../constants/muscleOptions';
import { X, Check, Plus } from 'lucide-react-native';

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
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<string[]>([]);
  const [customPrimaryInput, setCustomPrimaryInput] = useState('');
  const [isAddingCustomPrimary, setIsAddingCustomPrimary] = useState(false);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState<string[]>([]);
  const [customSecondaryInput, setCustomSecondaryInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const availableOptions = MUSCLE_OPTIONS_PER_CATEGORY[category] || MUSCLE_OPTIONS_PER_CATEGORY['Pectoraux'];

  useEffect(() => {
    if (initialExercise) {
      setName(initialExercise.name);
      setCategory(initialExercise.category);

      const parsedPrimaries = (initialExercise.primaryMuscles && initialExercise.primaryMuscles.length > 0)
        ? initialExercise.primaryMuscles
        : (initialExercise.primaryMuscle || '').split(',').map((s) => s.trim()).filter(Boolean);

      setSelectedPrimaryMuscles(parsedPrimaries);
      setSelectedSecondaryMuscles(initialExercise.targetMuscles || []);
      setCustomPrimaryInput('');
      setIsAddingCustomPrimary(false);
      setCustomSecondaryInput('');
    } else {
      setName('');
      setCategory('Pectoraux');
      const defaultPrimary = MUSCLE_OPTIONS_PER_CATEGORY['Pectoraux'].primary[0];
      setSelectedPrimaryMuscles([defaultPrimary]);
      setIsAddingCustomPrimary(false);
      setCustomPrimaryInput('');
      setSelectedSecondaryMuscles([]);
      setCustomSecondaryInput('');
    }
    setErrorMsg('');
  }, [initialExercise, visible]);

  // Réinitialiser la sélection par défaut lorsque la catégorie change
  const handleSelectCategory = (newCat: 'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos') => {
    setCategory(newCat);
    const newOptions = MUSCLE_OPTIONS_PER_CATEGORY[newCat];
    if (newOptions && newOptions.primary.length > 0) {
      setSelectedPrimaryMuscles([newOptions.primary[0]]);
    } else {
      setSelectedPrimaryMuscles([]);
    }
    setIsAddingCustomPrimary(false);
    setSelectedSecondaryMuscles([]);
  };

  const togglePrimaryMuscle = (muscle: string) => {
    setSelectedPrimaryMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((m) => m !== muscle);
      } else {
        return [...prev, muscle];
      }
    });
  };

  const handleAddCustomPrimary = () => {
    const trimmed = customPrimaryInput.trim();
    if (trimmed && !selectedPrimaryMuscles.includes(trimmed)) {
      setSelectedPrimaryMuscles((prev) => [...prev, trimmed]);
      setCustomPrimaryInput('');
      setIsAddingCustomPrimary(false);
    }
  };

  const toggleSecondaryMuscle = (muscle: string) => {
    setSelectedSecondaryMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg("Veuillez saisir un nom d'exercice.");
      return;
    }
    if (selectedPrimaryMuscles.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins un muscle principal.');
      return;
    }

    setErrorMsg('');
    setSaving(true);

    try {
      // Parser d'éventuels muscles secondaires personnalisés supplémentaires
      const parsedCustomSecondary = customSecondaryInput
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      const allSecondary = Array.from(new Set([...selectedSecondaryMuscles, ...parsedCustomSecondary]));
      const primaryString = selectedPrimaryMuscles.join(', ');

      if (initialExercise) {
        const updated: SharedExercise = {
          ...initialExercise,
          name: name.trim(),
          category,
          primaryMuscle: primaryString,
          primaryMuscles: selectedPrimaryMuscles,
          targetMuscles: allSecondary.length > 0 ? allSecondary : selectedPrimaryMuscles,
        };
        await updateCustomExercise(updated);
        if (onSuccess) onSuccess(updated);
      } else {
        const created = await addCustomExercise({
          name: name.trim(),
          category,
          primaryMuscle: primaryString,
          primaryMuscles: selectedPrimaryMuscles,
          targetMuscles: allSecondary.length > 0 ? allSecondary : selectedPrimaryMuscles,
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
                {initialExercise ? "Modifier l'exercice" : 'Créer un exercice'}
              </Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
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
              <View style={styles.chipsWrap}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          borderColor: isSelected ? theme.accent : theme.border,
                          backgroundColor: isSelected ? theme.accent : theme.surface,
                        },
                      ]}
                      onPress={() => handleSelectCategory(cat)}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Muscle principal (Chips multi-sélection normés) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }}>
                <Text style={[styles.label, { marginBottom: 0, color: theme.text }]}>
                  Muscles principaux * (sélection multiple)
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>
                  {selectedPrimaryMuscles.length} sélectionné{selectedPrimaryMuscles.length > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                {availableOptions.primary.map((m) => {
                  const isSelected = selectedPrimaryMuscles.includes(m);
                  return (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          borderColor: isSelected ? theme.accent : theme.border,
                          backgroundColor: isSelected ? theme.accent : theme.surface,
                        },
                      ]}
                      onPress={() => togglePrimaryMuscle(m)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isSelected && <Check size={12} color="#FFFFFF" style={{ marginRight: 4 }} />}
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? '#FFFFFF' : theme.text, fontWeight: isSelected ? '800' : '600' },
                          ]}
                        >
                          {m}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Muscles principaux personnalisés déjà sélectionnés mais pas dans la liste officielle */}
                {selectedPrimaryMuscles
                  .filter((m) => !availableOptions.primary.includes(m))
                  .map((m) => (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          borderColor: theme.accent,
                          backgroundColor: theme.accent,
                        },
                      ]}
                      onPress={() => togglePrimaryMuscle(m)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Check size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={[styles.chipText, { color: '#FFFFFF', fontWeight: '800' }]}>
                          {m}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    {
                      borderColor: isAddingCustomPrimary ? theme.accent : theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => setIsAddingCustomPrimary(!isAddingCustomPrimary)}
                >
                  <Text style={[styles.chipText, { color: theme.accent, fontWeight: '700' }]}>
                    + Autre muscle...
                  </Text>
                </TouchableOpacity>
              </View>

              {isAddingCustomPrimary && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1, color: theme.text, borderColor: theme.accent, backgroundColor: theme.surface, marginBottom: 0 },
                    ]}
                    placeholder="Ex: Chef court du biceps"
                    placeholderTextColor={theme.textMuted}
                    value={customPrimaryInput}
                    onChangeText={setCustomPrimaryInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: theme.accent,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 10,
                    }}
                    onPress={handleAddCustomPrimary}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Muscles secondaires (Chips multi-sélection normés) */}
              <Text style={[styles.label, { color: theme.text }]}>Muscles secondaires (sélection multiple)</Text>
              <View style={styles.chipsWrap}>
                {availableOptions.secondary.map((m) => {
                  const isSelected = selectedSecondaryMuscles.includes(m);
                  return (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          borderColor: isSelected ? theme.accent : theme.border,
                          backgroundColor: isSelected ? theme.accent + '25' : theme.surface,
                        },
                      ]}
                      onPress={() => toggleSecondaryMuscle(m)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isSelected && <Check size={12} color={theme.accent} style={{ marginRight: 4 }} />}
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? theme.accent : theme.text, fontWeight: isSelected ? '800' : '600' },
                          ]}
                        >
                          {m}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface, marginTop: 10 },
                ]}
                placeholder="Autres muscles secondaires (séparés par virgules)"
                placeholderTextColor={theme.textMuted}
                value={customSecondaryInput}
                onChangeText={setCustomSecondaryInput}
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
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 10,
  },
});
