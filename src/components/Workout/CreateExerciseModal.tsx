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
import {
  MUSCLE_GROUPS,
  CATEGORY_MUSCLE_GROUPS,
  MuscleGroup,
  normalizeMuscle,
  MuscleTarget,
} from '../../constants/muscles';
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
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<MuscleGroup[]>([]);
  const [subRegion, setSubRegion] = useState('');
  const [showAllPrimaries, setShowAllPrimaries] = useState(false);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [showAllSecondaries, setShowAllSecondaries] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialExercise) {
      setName(initialExercise.name);
      setCategory(initialExercise.category);

      const parsedPrimaries = (initialExercise.primaryMuscles && initialExercise.primaryMuscles.length > 0)
        ? initialExercise.primaryMuscles
        : (initialExercise.primaryMuscle || '').split(',').map((s) => s.trim()).filter(Boolean);

      const normalizedPrimaries = parsedPrimaries.map((p) => normalizeMuscle(p).muscle);
      setSelectedPrimaryMuscles(Array.from(new Set(normalizedPrimaries)));

      let extractedSubRegion = initialExercise.subRegion || '';
      if (!extractedSubRegion && initialExercise.primaryMuscle) {
        extractedSubRegion = normalizeMuscle(initialExercise.primaryMuscle).subRegion || '';
      }
      setSubRegion(extractedSubRegion);

      const normalizedSecondaries = (initialExercise.targetMuscles || [])
        .map((m) => normalizeMuscle(m).muscle)
        .filter((m) => !normalizedPrimaries.includes(m));
      setSelectedSecondaryMuscles(Array.from(new Set(normalizedSecondaries)));
      setShowAllPrimaries(false);
      setShowAllSecondaries(false);
    } else {
      setName('');
      setCategory('Pectoraux');
      const defaultPrimary = CATEGORY_MUSCLE_GROUPS['Pectoraux'][0];
      setSelectedPrimaryMuscles([defaultPrimary]);
      setSubRegion('');
      setSelectedSecondaryMuscles([]);
      setShowAllPrimaries(false);
      setShowAllSecondaries(false);
    }
    setErrorMsg('');
  }, [initialExercise, visible]);

  // Réinitialiser la sélection par défaut lorsque la catégorie change
  const handleSelectCategory = (newCat: 'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos') => {
    setCategory(newCat);
    const catMuscles = CATEGORY_MUSCLE_GROUPS[newCat];
    if (catMuscles && catMuscles.length > 0) {
      setSelectedPrimaryMuscles([catMuscles[0]]);
    } else {
      setSelectedPrimaryMuscles([]);
    }
    setSelectedSecondaryMuscles([]);
    setShowAllPrimaries(false);
    setShowAllSecondaries(false);
  };

  const togglePrimaryMuscle = (muscle: MuscleGroup) => {
    setSelectedPrimaryMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((m) => m !== muscle);
      } else {
        return [...prev, muscle];
      }
    });
  };

  const toggleSecondaryMuscle = (muscle: MuscleGroup) => {
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
      const primaryString = selectedPrimaryMuscles.join(', ');
      const muscleTargets: MuscleTarget[] = [
        ...selectedPrimaryMuscles.map((m) => ({
          muscle: m,
          subRegion: subRegion.trim() || undefined,
          role: 'primary' as const,
          fraction: 1.0,
        })),
        ...selectedSecondaryMuscles.map((m) => ({
          muscle: m,
          role: 'secondary' as const,
          fraction: 0.5,
        })),
      ];

      if (initialExercise) {
        const updated: SharedExercise = {
          ...initialExercise,
          name: name.trim(),
          category,
          primaryMuscle: selectedPrimaryMuscles[0] || primaryString,
          primaryMuscles: selectedPrimaryMuscles,
          subRegion: subRegion.trim() || undefined,
          targetMuscles: selectedSecondaryMuscles,
          muscleTargets,
        };
        await updateCustomExercise(updated);
        if (onSuccess) onSuccess(updated);
      } else {
        const created = await addCustomExercise({
          name: name.trim(),
          category,
          primaryMuscle: selectedPrimaryMuscles[0] || primaryString,
          primaryMuscles: selectedPrimaryMuscles,
          subRegion: subRegion.trim() || undefined,
          targetMuscles: selectedSecondaryMuscles,
          muscleTargets,
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
                  Muscles principaux * (sélection normée)
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>
                  {selectedPrimaryMuscles.length} sélectionné{selectedPrimaryMuscles.length > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                {CATEGORY_MUSCLE_GROUPS[category].map((m) => {
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

                {/* Muscles principaux sélectionnés issus d'autres catégories */}
                {selectedPrimaryMuscles
                  .filter((m) => !CATEGORY_MUSCLE_GROUPS[category].includes(m))
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

                {/* Autres muscles de la liste globale MUSCLE_GROUPS */}
                {showAllPrimaries &&
                  MUSCLE_GROUPS.filter(
                    (m) =>
                      !CATEGORY_MUSCLE_GROUPS[category].includes(m) &&
                      !selectedPrimaryMuscles.includes(m)
                  ).map((m) => (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      onPress={() => togglePrimaryMuscle(m)}
                    >
                      <Text style={[styles.chipText, { color: theme.text, fontWeight: '600' }]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    {
                      borderColor: showAllPrimaries ? theme.accent : theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => setShowAllPrimaries(!showAllPrimaries)}
                >
                  <Text style={[styles.chipText, { color: theme.accent, fontWeight: '700' }]}>
                    {showAllPrimaries ? 'Moins de groupes' : '+ Tous les groupes'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sous-région / Faisceau (texte libre optionnel) */}
              <Text style={[styles.label, { color: theme.text, marginTop: 12, marginBottom: 4 }]}>
                Sous-région / Faisceau (optionnel)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                ]}
                placeholder="Ex: Chef claviculaire (Haut), Chef long, Médian..."
                placeholderTextColor={theme.textMuted}
                value={subRegion}
                onChangeText={setSubRegion}
              />

              {/* Muscles secondaires (Chips multi-sélection normés) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }}>
                <Text style={[styles.label, { marginBottom: 0, color: theme.text }]}>
                  Muscles secondaires (sélection normée)
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>
                  {selectedSecondaryMuscles.length} sélectionné{selectedSecondaryMuscles.length > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.chipsWrap}>
                {MUSCLE_GROUPS.filter(
                  (m) =>
                    !selectedPrimaryMuscles.includes(m) &&
                    (showAllSecondaries ||
                      CATEGORY_MUSCLE_GROUPS[category].includes(m) ||
                      selectedSecondaryMuscles.includes(m))
                ).map((m) => {
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

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    {
                      borderColor: showAllSecondaries ? theme.accent : theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => setShowAllSecondaries(!showAllSecondaries)}
                >
                  <Text style={[styles.chipText, { color: theme.accent, fontWeight: '700' }]}>
                    {showAllSecondaries ? 'Moins de groupes' : '+ Tous les groupes'}
                  </Text>
                </TouchableOpacity>
              </View>
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
