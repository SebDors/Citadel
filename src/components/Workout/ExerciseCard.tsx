import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { WorkoutExercise, WorkoutSet } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { SetTableRow } from './SetTableRow';
import { Plus, Clock, Copy, Trash2, Layers, MoreHorizontal, X } from 'lucide-react-native';
import {
  SWISS_COLORS,
  SWISS_TYPOGRAPHY,
  SWISS_GRID,
} from '../../constants/swissTheme';
import { SwissDivider } from '../Swiss';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onUpdateSet: (setId: string, field: keyof WorkoutSet, value: any) => void;
  onToggleSetComplete: (setId: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onDuplicateExercise: () => void;
  onRemoveExercise: () => void;
  onUpdateRestTime: (newRestSeconds: number) => void;
  onSetSupersetGroup: (supersetGroup?: string) => void;
}

const ExerciseCardComponent: React.FC<ExerciseCardProps> = ({
  exercise,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onRemoveSet,
  onDuplicateExercise,
  onRemoveExercise,
  onUpdateRestTime,
  onSetSupersetGroup,
}) => {
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  const [showMenu, setShowMenu] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [tempRestSeconds, setTempRestSeconds] = useState(String(exercise.restSeconds || 75));

  const handleSaveRestTime = () => {
    const val = parseInt(tempRestSeconds, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateRestTime(val);
    }
    setShowRestModal(false);
  };

  const musclesStr = [exercise.primaryMuscle, ...exercise.targetMuscles]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Superset Group Badge Header */}
      {exercise.supersetGroup && (
        <View style={styles.supersetHeader}>
          <Text style={[styles.supersetText, { color: palette.accent }]}>
            SUPERSET // {exercise.supersetGroup.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Exercise Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleArea}>
          <Text
            style={[
              styles.exerciseName,
              { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
            ]}
          >
            {exercise.exerciseName.toUpperCase()}
          </Text>
          <Text style={[styles.musclesText, { color: palette.textMuted }]}>
            {musclesStr || 'GÉNÉRAL'}
          </Text>
        </View>

        {/* Rest Timer (Cliquable) & Options */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowRestModal(true)}
            style={styles.restBadge}
          >
            <Clock size={12} color={palette.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.restText, { color: palette.textMuted }]}>
              {exercise.restSeconds || 75}S
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowMenu(true)}
            style={styles.menuButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.optionsLabel, { color: palette.textMuted }]}>
              OPTIONS //
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table Header (Hairline Swiss Grid) */}
      <View style={[styles.tableHeader, { borderBottomColor: palette.border }]}>
        <View style={{ width: 30, marginRight: 4, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: palette.textMuted }]}>SET</Text>
        </View>
        <View style={{ flex: 1.2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: palette.textMuted }]}>PRÉV</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: palette.textMuted }]}>KG</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: palette.textMuted }]}>REPS</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: palette.textMuted }]}>RIR</Text>
        </View>
        <View style={{ width: 34, marginLeft: 6, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: palette.accent }]}>✓</Text>
        </View>
        <View style={{ width: 24, marginLeft: 4 }} />
      </View>

      {/* Sets Rows */}
      {exercise.sets.map((set, idx) => (
        <SetTableRow
          key={set.id}
          set={set}
          exerciseId={exercise.id}
          onUpdate={(field, val) => onUpdateSet(set.id, field, val)}
          onToggleComplete={() => onToggleSetComplete(set.id)}
          onDelete={() => onRemoveSet(set.id)}
        />
      ))}

      {/* Add Set Button (Typographic Link) */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onAddSet}
        style={styles.addSetButton}
      >
        <Plus size={14} color={palette.accent} style={{ marginRight: 6 }} />
        <Text style={[styles.addSetText, { color: palette.accent }]}>
          AJOUTER UNE SÉRIE
        </Text>
      </TouchableOpacity>

      <SwissDivider subtle style={{ marginTop: 24 }} />

      {/* Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {exercise.exerciseName.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <X size={18} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowRestModal(true);
              }}
            >
              <Clock size={16} color={palette.text} />
              <Text style={[styles.menuItemText, { color: palette.text }]}>
                Temps de repos ({exercise.restSeconds || 75}s)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowSupersetModal(true);
              }}
            >
              <Layers size={16} color={palette.text} />
              <Text style={[styles.menuItemText, { color: palette.text }]}>
                {exercise.supersetGroup
                  ? `Changer de Superset (${exercise.supersetGroup})`
                  : 'Associer à un Superset'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onDuplicateExercise();
              }}
            >
              <Copy size={16} color={palette.text} />
              <Text style={[styles.menuItemText, { color: palette.text }]}>
                Dupliquer l'exercice
              </Text>
            </TouchableOpacity>

            <SwissDivider subtle style={{ marginVertical: 8 }} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onRemoveExercise();
              }}
            >
              <Trash2 size={16} color={palette.accent} />
              <Text style={[styles.menuItemText, { color: palette.accent }]}>
                Supprimer de la séance
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rest Time Modal */}
      <Modal
        visible={showRestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRestModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text, marginBottom: 12 }]}>
              TEMPS DE REPOS (SECONDES)
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
              ]}
              keyboardType="numeric"
              value={tempRestSeconds}
              onChangeText={setTempRestSeconds}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setShowRestModal(false)}
                style={styles.modalBtn}
              >
                <Text style={[styles.modalBtnText, { color: palette.textMuted }]}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveRestTime}
                style={[styles.modalBtn, { borderBottomColor: palette.accent, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalBtnText, { color: palette.accent }]}>ENREGISTRER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Superset Modal */}
      <Modal
        visible={showSupersetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSupersetModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSupersetModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text, marginBottom: 12 }]}>
              SUPERSET // GROUPE
            </Text>
            <View style={styles.supersetOptionsRow}>
              {['A', 'B', 'C', 'D'].map((grp) => (
                <TouchableOpacity
                  key={grp}
                  onPress={() => {
                    onSetSupersetGroup(grp);
                    setShowSupersetModal(false);
                  }}
                  style={[
                    styles.supersetCircle,
                    {
                      borderColor: exercise.supersetGroup === grp ? palette.accent : palette.border,
                      backgroundColor: exercise.supersetGroup === grp ? palette.accent : palette.background,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: exercise.supersetGroup === grp ? '#FFFFFF' : palette.text,
                      fontWeight: '800',
                    }}
                  >
                    {grp}
                  </Text>
                </TouchableOpacity>
              ))}
              {exercise.supersetGroup ? (
                <TouchableOpacity
                  onPress={() => {
                    onSetSupersetGroup(undefined);
                    setShowSupersetModal(false);
                  }}
                  style={[styles.supersetCircle, { borderColor: palette.border, backgroundColor: palette.background }]}
                >
                  <X size={16} color={palette.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const ExerciseCard = React.memo(ExerciseCardComponent);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  supersetHeader: {
    marginBottom: 6,
  },
  supersetText: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleArea: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  musclesText: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  restText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  menuButton: {
    paddingVertical: 2,
  },
  optionsLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  thText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addSetText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 24,
    borderTopWidth: 1,
  },
  modalCard: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  supersetOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  supersetCircle: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
