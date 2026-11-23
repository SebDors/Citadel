import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Flame, Plus, Edit2, Trash2, Check, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';

interface CardioActivitiesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CardioActivitiesModal: React.FC<CardioActivitiesModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const {
    cardioActivities,
    addCardioActivity,
    renameCardioActivity,
    deleteCardioActivity,
    resetCardioActivities,
  } = useWorkout();

  const [newActivityName, setNewActivityName] = useState('');
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAdd = async () => {
    const trimmed = newActivityName.trim();
    if (!trimmed) return;
    if (cardioActivities.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Activité existante', `"${trimmed}" figure déjà dans la liste.`);
      return;
    }
    await addCardioActivity(trimmed);
    setNewActivityName('');
  };

  const handleStartEdit = (name: string) => {
    setEditingActivity(name);
    setEditingText(name);
  };

  const handleConfirmEdit = async () => {
    if (!editingActivity) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      setEditingActivity(null);
      return;
    }
    if (
      trimmed.toLowerCase() !== editingActivity.toLowerCase() &&
      cardioActivities.some((a) => a.toLowerCase() === trimmed.toLowerCase())
    ) {
      Alert.alert('Nom déjà utilisé', `"${trimmed}" existe déjà.`);
      return;
    }
    await renameCardioActivity(editingActivity, trimmed);
    setEditingActivity(null);
    setEditingText('');
  };

  const handleDelete = (name: string) => {
    Alert.alert(
      'Supprimer cette activité ?',
      `"${name}" sera retirée de la liste des activités proposées.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteCardioActivity(name),
        },
      ]
    );
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Réinitialiser les activités ?',
      'Rétablir la liste par défaut (Course, Boxe, Vélo, Natation, Corde à sauter, HIIT, Rameur) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rétablir',
          onPress: () => resetCardioActivities(),
        },
      ]
    );
  };

  const handleClose = () => {
    setEditingActivity(null);
    setEditingText('');
    setNewActivityName('');
    onClose();
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBadge, { backgroundColor: '#F9731620' }]}>
                  <Flame size={18} color="#F97316" />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>
                  Activités Cardio
                </Text>
                <View style={[styles.countBadge, { backgroundColor: '#F9731620', borderColor: '#F9731650' }]}>
                  <Text style={[styles.countText, { color: '#F97316' }]}>
                    {cardioActivities.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Ajout rapide */}
            <View style={styles.addRow}>
              <TextInput
                style={[
                  styles.addInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Nouvelle activité (ex: Escalade, Foot)..."
                placeholderTextColor={theme.textMuted}
                value={newActivityName}
                onChangeText={setNewActivityName}
                onSubmitEditing={handleAdd}
                returnKeyType="done"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!newActivityName.trim()}
                onPress={handleAdd}
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: newActivityName.trim() ? '#F97316' : theme.surface,
                    borderColor: newActivityName.trim() ? '#F97316' : theme.border,
                  },
                ]}
              >
                <Plus size={18} color={newActivityName.trim() ? '#FFFFFF' : theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Liste des activités */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.listScroll}
            >
              {cardioActivities.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Aucune activité enregistrée. Ajoutez-en une ci-dessus.
                </Text>
              ) : (
                cardioActivities.map((actName) => {
                  const isEditing = editingActivity === actName;
                  return (
                    <View
                      key={actName}
                      style={[
                        styles.rowCard,
                        { backgroundColor: theme.surface, borderColor: isEditing ? '#F97316' : theme.border },
                      ]}
                    >
                      {isEditing ? (
                        <>
                          <TextInput
                            autoFocus
                            style={[styles.editInput, { color: theme.text }]}
                            value={editingText}
                            onChangeText={setEditingText}
                            onSubmitEditing={handleConfirmEdit}
                            returnKeyType="done"
                          />
                          <TouchableOpacity
                            onPress={handleConfirmEdit}
                            style={[styles.rowIconBtn, { backgroundColor: '#10B98120' }]}
                          >
                            <Check size={16} color="#10B981" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingActivity(null);
                              setEditingText('');
                            }}
                            style={[styles.rowIconBtn, { backgroundColor: theme.cardBg }]}
                          >
                            <X size={16} color={theme.textMuted} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <View style={styles.rowLeft}>
                            <Flame size={15} color="#F97316" />
                            <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={1}>
                              {actName}
                            </Text>
                          </View>
                          <View style={styles.rowActions}>
                            <TouchableOpacity
                              onPress={() => handleStartEdit(actName)}
                              style={[styles.rowIconBtn, { backgroundColor: theme.cardBg }]}
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                              accessibilityLabel={`Modifier ${actName}`}
                            >
                              <Edit2 size={14} color={theme.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDelete(actName)}
                              style={[styles.rowIconBtn, { backgroundColor: theme.cardBg }]}
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                              accessibilityLabel={`Supprimer ${actName}`}
                            >
                              <Trash2 size={14} color={theme.danger} />
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Footer Reset */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleResetDefaults}
              style={[styles.resetBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <RotateCcw size={14} color={theme.textMuted} />
              <Text style={[styles.resetText, { color: theme.textMuted }]}>
                Réinitialiser la liste par défaut
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'android' ? 40 : 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listScroll: {
    maxHeight: 330,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 24,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowName: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    paddingVertical: 2,
  },
  resetBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resetText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
