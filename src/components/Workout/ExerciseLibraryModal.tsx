import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { SharedExercise } from '../../constants/exerciseDatabase';
import { normalizeString } from '../../utils/stringUtils';
import { CreateExerciseModal } from './CreateExerciseModal';
import { Button } from '../UI/Button';
import { Search, Plus, Edit2, Trash2, X, BookOpen } from 'lucide-react-native';

const CATEGORY_FILTERS = ['Tous', 'Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Abdos'] as const;

interface ExerciseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { allExercises, deleteCustomExercise } = useWorkout();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // État de modale de création / édition
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<SharedExercise | null>(null);

  // Normalisation & Filtrage
  const filteredExercises = useMemo(() => {
    const q = normalizeString(searchQuery);
    return allExercises.filter((ex) => {
      const matchCat = selectedCategory === 'Tous' || ex.category === selectedCategory;
      if (!matchCat) return false;

      if (!q) return true;
      return (
        normalizeString(ex.name).includes(q) ||
        normalizeString(ex.primaryMuscle).includes(q) ||
        normalizeString(ex.category).includes(q) ||
        ex.targetMuscles.some((m) => normalizeString(m).includes(q))
      );
    });
  }, [allExercises, searchQuery, selectedCategory]);

  const handleEdit = (ex: SharedExercise) => {
    setEditingExercise(ex);
    setShowCreateModal(true);
  };

  const handleDelete = (ex: SharedExercise) => {
    Alert.alert(
      'Supprimer l\'exercice',
      `Voulez-vous vraiment supprimer "${ex.name}" de la base de données ?\n(Vos séances passées conserveront leur nom sans altération).`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomExercise(ex.id);
          },
        },
      ]
    );
  };

  const handleOpenCreate = () => {
    setEditingExercise(null);
    setShowCreateModal(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookOpen size={20} color={theme.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: theme.text }]}>Bibliothèque d'Exercices</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Bouton Créer un exercice */}
          <Button
            title="+ Créer un exercice"
            variant="primary"
            onPress={handleOpenCreate}
            style={{ marginBottom: 12 }}
          />

          {/* Barre de recherche */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Rechercher par nom ou muscle..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtres par catégorie */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterRow}>
              {CATEGORY_FILTERS.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.7}
                    style={[
                      styles.filterChip,
                      {
                        borderColor: isSelected ? theme.accent : theme.border,
                        backgroundColor: isSelected ? theme.accent : theme.surface,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.filterChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Liste des exercices */}
          <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
            {filteredExercises.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aucun exercice trouvé</Text>
            ) : (
              filteredExercises.map((ex) => (
                <View key={ex.id} style={[styles.exRow, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.exName, { color: theme.text }]}>{ex.name}</Text>
                      {ex.isCustom && (
                        <View style={[styles.customBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
                          <Text style={[styles.customBadgeText, { color: theme.accent }]}>Personnalisé</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.exSub, { color: theme.textMuted }]}>
                      {ex.primaryMuscle} • {ex.category}
                    </Text>
                  </View>

                  {/* Actions d'édition/suppression pour tous les exercices */}
                  <View style={styles.actionsBox}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleEdit(ex)}
                      style={[styles.iconBtn, { backgroundColor: theme.surface }]}
                    >
                      <Edit2 size={16} color={theme.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDelete(ex)}
                      style={[styles.iconBtn, { backgroundColor: theme.surface, marginLeft: 6 }]}
                    >
                      <Trash2 size={16} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Modale de création / édition */}
      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialExercise={editingExercise}
      />
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
    maxWidth: 460,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterScroll: {
    marginBottom: 12,
    maxHeight: 36,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
  },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  exName: {
    fontSize: 14,
    fontWeight: '700',
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  exSub: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
  },
});
