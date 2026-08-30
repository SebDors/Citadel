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
import { Search, Plus, Edit2, Trash2, X, BookOpen, AlertTriangle } from 'lucide-react-native';

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

  // État de la modale de confirmation de suppression personnalisée
  const [deleteConfirmExercise, setDeleteConfirmExercise] = useState<SharedExercise | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Normalisation, Filtrage & Tri par ordre alphabétique
  const filteredExercises = useMemo(() => {
    const q = normalizeString(searchQuery);
    const list = allExercises.filter((ex) => {
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

    return list.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [allExercises, searchQuery, selectedCategory]);

  const handleEdit = (ex: SharedExercise) => {
    setEditingExercise(ex);
    setShowCreateModal(true);
  };

  const handleRequestDelete = (ex: SharedExercise) => {
    setDeleteConfirmExercise(ex);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmExercise) return;
    setDeleting(true);
    try {
      await deleteCustomExercise(deleteConfirmExercise.id);
      setDeleteConfirmExercise(null);
    } catch (e) {
      console.error("Erreur lors de la suppression de l'exercice:", e);
    } finally {
      setDeleting(false);
    }
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
                      onPress={() => handleRequestDelete(ex)}
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

      {/* Modale de Confirmation de Suppression (Design & DA Applicative) */}
      <Modal
        visible={!!deleteConfirmExercise}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmExercise(null)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => setDeleteConfirmExercise(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.confirmCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          >
            {/* Badge icône Danger */}
            <View style={[styles.confirmIconBadge, { backgroundColor: theme.danger + '18' }]}>
              <AlertTriangle size={24} color={theme.danger} />
            </View>

            {/* Titre */}
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Supprimer l'exercice</Text>

            {/* Message */}
            <Text style={[styles.confirmMessage, { color: theme.textMuted }]}>
              Voulez-vous vraiment supprimer <Text style={{ color: theme.text, fontWeight: '800' }}>"{deleteConfirmExercise?.name}"</Text> de la base de données ?
            </Text>

            {/* Note d'information */}
            <View style={[styles.confirmNoteBox, { backgroundColor: theme.surface }]}>
              <Text style={[styles.confirmNoteText, { color: theme.textMuted }]}>
                💡 Vos séances passées et modèles conserveront cet exercice dans l'historique sans altération.
              </Text>
            </View>

            {/* Boutons d'action */}
            <View style={styles.confirmActionsRow}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => setDeleteConfirmExercise(null)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title={deleting ? 'Suppression...' : 'Supprimer'}
                variant="danger"
                disabled={deleting}
                onPress={handleConfirmDelete}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  confirmNoteBox: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  confirmNoteText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  confirmActionsRow: {
    flexDirection: 'row',
    width: '100%',
  },
});
