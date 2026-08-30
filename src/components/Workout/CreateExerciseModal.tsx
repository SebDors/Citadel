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
  const [primaryMuscle, setPrimaryMuscle] = useState('');
  const [isCustomPrimary, setIsCustomPrimary] = useState(false);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState<string[]>([]);
  const [customSecondaryInput, setCustomSecondaryInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const availableOptions = MUSCLE_OPTIONS_PER_CATEGORY[category] || MUSCLE_OPTIONS_PER_CATEGORY['Pectoraux'];

  useEffect(() => {
    if (initialExercise) {
      setName(initialExercise.name);
      setCategory(initialExercise.category);
      setPrimaryMuscle(initialExercise.primaryMuscle);

      const options = MUSCLE_OPTIONS_PER_CATEGORY[initialExercise.category]?.primary || [];
      setIsCustomPrimary(!options.includes(initialExercise.primaryMuscle));

      setSelectedSecondaryMuscles(initialExercise.targetMuscles || []);
      setCustomSecondaryInput('');
    } else {
      setName('');
      setCategory('Pectoraux');
      const defaultPrimary = MUSCLE_OPTIONS_PER_CATEGORY['Pectoraux'].primary[0];
      setPrimaryMuscle(defaultPrimary);
      setIsCustomPrimary(false);
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
      setPrimaryMuscle(newOptions.primary[0]);
      setIsCustomPrimary(false);
    }
    setSelectedSecondaryMuscles([]);
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
    if (!primaryMuscle.trim()) {
      setErrorMsg('Veuillez sélectionner ou saisir le muscle principal.');
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

      if (initialExercise) {
        const updated: SharedExercise = {
          ...initialExercise,
          name: name.trim(),
          category,
          primaryMuscle: primaryMuscle.trim(),
          targetMuscles: allSecondary.length > 0 ? allSecondary : [primaryMuscle.trim()],
        };
        await updateCustomExercise(updated);
        if (onSuccess) onSuccess(updated);
      } else {
        const created = await addCustomExercise({
          name: name.trim(),
          category,
          primaryMuscle: primaryMuscle.trim(),
          targetMuscles: allSecondary.length > 0 ? allSecondary : [primaryMuscle.trim()],
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

              {/* Muscle principal (Dropdown / Chips normés) */}
              <Text style={[styles.label, { color: theme.text }]}>Muscle principal *</Text>
              <View style={styles.chipsWrap}>
                {availableOptions.primary.map((m) => {
                  const isSelected = !isCustomPrimary && primaryMuscle === m;
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
                      onPress={() => {
                        setPrimaryMuscle(m);
                        setIsCustomPrimary(false);
                      }}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    {
                      borderColor: isCustomPrimary ? theme.accent : theme.border,
                      backgroundColor: isCustomPrimary ? theme.accent : theme.surface,
                    },
                  ]}
                  onPress={() => {
                    setIsCustomPrimary(true);
                    if (!isCustomPrimary) setPrimaryMuscle('');
                  }}
                >
                  <Text style={[styles.chipText, { color: isCustomPrimary ? '#FFFFFF' : theme.text }]}>
                    + Autre...
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustomPrimary && (
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.accent, backgroundColor: theme.surface, marginTop: 8 },
                  ]}
                  placeholder="Saisir un muscle principal personnalisé"
                  placeholderTextColor={theme.textMuted}
                  value={primaryMuscle}
                  onChangeText={setPrimaryMuscle}
                  autoFocus
                />
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
