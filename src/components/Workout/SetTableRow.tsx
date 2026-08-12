import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { WorkoutSet, SetType, SET_TYPES_CONFIG } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Check, Trash2, X } from 'lucide-react-native';

interface SetTableRowProps {
  set: WorkoutSet;
  exerciseId: string;
  onUpdate: (field: keyof WorkoutSet, value: any) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export const SetTableRow: React.FC<SetTableRowProps> = ({
  set,
  onUpdate,
  onToggleComplete,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [showTypeModal, setShowTypeModal] = useState(false);

  const currentTypeConfig = SET_TYPES_CONFIG[set.type] || SET_TYPES_CONFIG.normal;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: set.completed ? theme.completedSet : 'transparent',
          borderBottomColor: theme.border,
        },
      ]}
    >
      {/* Set # / Type Selector (Ouvre un volet/modal de sélection) */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShowTypeModal(true)}
        style={[styles.typeButton, { backgroundColor: currentTypeConfig.color }]}
      >
        <Text style={styles.typeText}>{currentTypeConfig.code}</Text>
      </TouchableOpacity>

      {/* Previous Performance */}
      <View style={styles.colPrevious}>
        <Text style={[styles.previousText, { color: theme.textMuted }]}>
          {set.previous || '-'}
        </Text>
      </View>

      {/* Weight (Kg) Input (Non pré-rempli, placeholder uniquement) */}
      <View style={styles.colInput}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          keyboardType="numeric"
          value={set.weightKg !== undefined && set.weightKg !== null ? String(set.weightKg) : ''}
          onChangeText={(val: string) => onUpdate('weightKg', val === '' ? undefined : parseFloat(val) || 0)}
          placeholder="0"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {/* Reps Input (Non pré-rempli, placeholder uniquement) */}
      <View style={styles.colInput}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          keyboardType="numeric"
          value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''}
          onChangeText={(val: string) => onUpdate('reps', val === '' ? undefined : parseInt(val, 10) || 0)}
          placeholder="0"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {/* RIR Direct Numeric Input (Saisie directe du RIR : 0, 1, 2, 3...) */}
      <View style={styles.colInput}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          keyboardType="numeric"
          value={set.rir !== undefined && set.rir !== null ? String(set.rir) : ''}
          onChangeText={(val: string) => onUpdate('rir', val === '' ? 0 : parseInt(val, 10) || 0)}
          placeholder="0"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {/* Validation Checkbox (Carré à bords arrondis, contour vert et fond coché uniquement à la validation) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggleComplete}
        style={[
          styles.checkButton,
          {
            backgroundColor: set.completed ? (theme.success || '#618764') : 'transparent',
            borderColor: theme.success || '#618764',
          },
        ]}
      >
        {set.completed && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
      </TouchableOpacity>

      {/* Delete Set */}
      <TouchableOpacity activeOpacity={0.7} onPress={onDelete} style={styles.deleteButton}>
        <Trash2 size={16} color={theme.danger} />
      </TouchableOpacity>

      {/* Modal / Volet de sélection du type de série (Demande utilisateur!) */}
      <Modal visible={showTypeModal} transparent animationType="slide" onRequestClose={() => setShowTypeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypeModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Choisir le type de série</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {Object.values(SET_TYPES_CONFIG).map((cfg) => (
              <TouchableOpacity
                key={cfg.type}
                style={[
                  styles.typeOptionRow,
                  { borderBottomColor: theme.border },
                  set.type === cfg.type && { backgroundColor: theme.surface },
                ]}
                onPress={() => {
                  onUpdate('type', cfg.type);
                  setShowTypeModal(false);
                }}
              >
                <View style={[styles.typeBadgeCircle, { backgroundColor: cfg.color }]}>
                  <Text style={styles.typeBadgeText}>{cfg.code}</Text>
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.typeOptionLabel, { color: theme.text }]}>{cfg.label}</Text>
                  <Text style={[styles.typeOptionDesc, { color: theme.textMuted }]}>{cfg.description}</Text>
                </View>
                {set.type === cfg.type && <Check size={18} color={theme.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  typeButton: {
    width: 30,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  typeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  colPrevious: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  colInput: {
    flex: 1,
    marginHorizontal: 2,
  },
  input: {
    height: 34,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  rirButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  rirText: {
    fontSize: 11,
    fontWeight: '700',
  },
  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  deleteButton: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginLeft: 4,
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
});
