import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutSet, SetType } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Check, Trash2 } from 'lucide-react-native';

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

  const getSetTypeBadge = (type: SetType) => {
    switch (type) {
      case 'warmup':
        return { label: 'W', bg: '#D97706' };
      case 'drop':
        return { label: 'D', bg: '#8B5CF6' };
      case 'amrap':
        return { label: 'A', bg: '#EC4899' };
      case 'failure':
        return { label: 'F', bg: '#EF4444' };
      default:
        return { label: `${set.setNumber}`, bg: theme.secondary };
    }
  };

  const setBadge = getSetTypeBadge(set.type);

  const cycleSetType = () => {
    const types: SetType[] = ['normal', 'warmup', 'drop', 'amrap', 'failure'];
    const currentIndex = types.indexOf(set.type);
    const nextType = types[(currentIndex + 1) % types.length];
    onUpdate('type', nextType);
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
      <TouchableOpacity activeOpacity={0.7} onPress={cycleSetType} style={[styles.typeButton, { backgroundColor: setBadge.bg }]}>
        <Text style={styles.typeText}>{setBadge.label}</Text>
      </TouchableOpacity>

      {/* Previous Performance */}
      <View style={styles.colPrevious}>
        <Text style={[styles.previousText, { color: theme.textMuted }]}>
          {set.previous || '-'}
        </Text>
      </View>

      {/* Weight (Kg) Input */}
      <View style={styles.colInput}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          keyboardType="numeric"
          value={set.weightKg ? String(set.weightKg) : ''}
          onChangeText={(val: string) => onUpdate('weightKg', parseFloat(val) || 0)}
          placeholder="0"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {/* Reps Input */}
      <View style={styles.colInput}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          keyboardType="numeric"
          value={set.reps ? String(set.reps) : ''}
          onChangeText={(val: string) => onUpdate('reps', parseInt(val, 10) || 0)}
          placeholder="0"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {/* RIR (Reps In Reserve) Selector */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.rirButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
        onPress={() => {
          const nextRir = (set.rir + 1) % 6; // 0 à 5
          onUpdate('rir', nextRir);
        }}
      >
        <Text style={[styles.rirText, { color: theme.text }]}>RIR {set.rir}</Text>
      </TouchableOpacity>

      {/* Validation Checkbox */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggleComplete}
        style={[
          styles.checkButton,
          {
            backgroundColor: set.completed ? theme.primary : theme.surface,
            borderColor: theme.primary,
          },
        ]}
      >
        <Check size={18} color={set.completed ? '#FFFFFF' : theme.textMuted} />
      </TouchableOpacity>

      {/* Delete Set */}
      <TouchableOpacity activeOpacity={0.7} onPress={onDelete} style={styles.deleteButton}>
        <Trash2 size={16} color={theme.danger} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  typeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  typeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  colPrevious: {
    flex: 1.2,
    justifyContent: 'center',
  },
  previousText: {
    fontSize: 12,
    fontWeight: '500',
  },
  colInput: {
    flex: 1,
    marginHorizontal: 3,
  },
  input: {
    height: 34,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
  },
});
