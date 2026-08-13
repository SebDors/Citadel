import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { WorkoutSet, SET_TYPES_CONFIG } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Check, Trash2, X } from 'lucide-react-native';
import { CustomNumericKeypad, NumericFieldType } from '../UI/CustomNumericKeypad';

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
  const [activeKeypadField, setActiveKeypadField] = useState<NumericFieldType | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const currentTypeConfig = SET_TYPES_CONFIG[set.type] || SET_TYPES_CONFIG.normal;

  const handleOpenKeypad = (field: NumericFieldType) => {
    setActiveKeypadField(field);
    let valStr = '';
    if (field === 'weightKg') {
      valStr = set.weightKg !== undefined && set.weightKg !== null ? String(set.weightKg) : '';
    } else if (field === 'reps') {
      valStr = set.reps !== undefined && set.reps !== null ? String(set.reps) : '';
    } else if (field === 'rir') {
      valStr = set.rir !== undefined && set.rir !== null ? String(set.rir) : '';
    }
    setTempValue(valStr);
  };

  const handleKeypadChange = (newVal: string) => {
    setTempValue(newVal);
    if (!activeKeypadField) return;

    if (activeKeypadField === 'weightKg') {
      const num = newVal === '' || newVal === '.' ? undefined : parseFloat(newVal);
      onUpdate('weightKg', num !== undefined && !isNaN(num) ? num : undefined);
    } else if (activeKeypadField === 'reps') {
      const num = newVal === '' ? undefined : parseInt(newVal, 10);
      onUpdate('reps', num !== undefined && !isNaN(num) ? num : undefined);
    } else if (activeKeypadField === 'rir') {
      const num = newVal === '' ? 0 : parseInt(newVal, 10);
      onUpdate('rir', !isNaN(num) ? num : 0);
    }
  };

  const handleKeypadNext = () => {
    if (activeKeypadField === 'weightKg') {
      handleOpenKeypad('reps');
    } else if (activeKeypadField === 'reps') {
      handleOpenKeypad('rir');
    }
  };

  const handleKeypadValidate = () => {
    const num = tempValue === '' ? 0 : parseInt(tempValue, 10);
    onUpdate('rir', !isNaN(num) ? num : 0);

    if (!set.completed) {
      onToggleComplete();
    }
    setActiveKeypadField(null);
  };

  const handleKeypadClose = () => {
    setActiveKeypadField(null);
  };

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
      {/* Set # / Type Selector */}
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

      {/* Weight (Kg) Touch Cell */}
      <View style={styles.colInput}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleOpenKeypad('weightKg')}
          style={[
            styles.cellBtn,
            {
              borderColor: activeKeypadField === 'weightKg' ? theme.accent : theme.border,
              borderWidth: activeKeypadField === 'weightKg' ? 2 : 1,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.cellText,
              { color: set.weightKg !== undefined && set.weightKg !== null ? theme.text : theme.textMuted },
            ]}
          >
            {set.weightKg !== undefined && set.weightKg !== null ? String(set.weightKg) : '-'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reps Touch Cell */}
      <View style={styles.colInput}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleOpenKeypad('reps')}
          style={[
            styles.cellBtn,
            {
              borderColor: activeKeypadField === 'reps' ? theme.accent : theme.border,
              borderWidth: activeKeypadField === 'reps' ? 2 : 1,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.cellText,
              { color: set.reps !== undefined && set.reps !== null ? theme.text : theme.textMuted },
            ]}
          >
            {set.reps !== undefined && set.reps !== null ? String(set.reps) : '-'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* RIR Touch Cell */}
      <View style={styles.colInput}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleOpenKeypad('rir')}
          style={[
            styles.cellBtn,
            {
              borderColor: activeKeypadField === 'rir' ? theme.accent : theme.border,
              borderWidth: activeKeypadField === 'rir' ? 2 : 1,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.cellText,
              { color: set.rir !== undefined && set.rir !== null ? theme.text : theme.textMuted },
            ]}
          >
            {set.rir !== undefined && set.rir !== null ? String(set.rir) : '0'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Validation Checkbox */}
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

      {/* Clavier Numérique Personnalisé */}
      {activeKeypadField !== null && (
        <CustomNumericKeypad
          visible={activeKeypadField !== null}
          onClose={handleKeypadClose}
          setNumber={set.setNumber}
          activeField={activeKeypadField}
          value={tempValue}
          onChangeValue={handleKeypadChange}
          onNextField={handleKeypadNext}
          onValidate={handleKeypadValidate}
          onClear={() => handleKeypadChange('')}
        />
      )}

      {/* Modal / Volet de sélection du type de série */}
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
  cellBtn: {
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  checkButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
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
