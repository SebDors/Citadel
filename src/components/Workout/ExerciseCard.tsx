import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { WorkoutExercise, WorkoutSet } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { SetTableRow } from './SetTableRow';
import { MoreVertical, Plus, Clock, Dumbbell, Copy, Trash2, Layers, Check, RotateCcw } from 'lucide-react-native';

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
  supersetOrder?: { index: number; total: number };
  nextTargetSet?: { exerciseName: string; setNumber: number } | null;
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
  supersetOrder,
  nextTargetSet,
}) => {
  const { theme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [tempRestSeconds, setTempRestSeconds] = useState(String(exercise.restSeconds || 75));

  const primaryMusclesList = useMemo(() => {
    if (exercise.primaryMuscles && exercise.primaryMuscles.length > 0) {
      return exercise.primaryMuscles;
    }
    if (exercise.primaryMuscle) {
      return exercise.primaryMuscle.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [exercise.primaryMuscles, exercise.primaryMuscle]);

  const secondaryMusclesList = useMemo(() => {
    const list = exercise.targetMuscles || [];
    return list.filter((m) => !primaryMusclesList.includes(m));
  }, [exercise.targetMuscles, primaryMusclesList]);

  const handleSaveRestTime = () => {
    const val = parseInt(tempRestSeconds, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateRestTime(val);
    }
    setShowRestModal(false);
  };

  return (
    <Card
      style={[
        styles.cardContainer,
        exercise.supersetGroup ? { borderColor: theme.supersetTag, borderWidth: 2 } : undefined,
      ]}
    >
      {/* Superset Group Badge Header */}
      {exercise.supersetGroup && (
        <View style={[styles.supersetHeader, { backgroundColor: theme.supersetTag }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Layers size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.supersetText}>
              {exercise.supersetGroup.toUpperCase()}
              {supersetOrder ? ` · POSTE ${supersetOrder.index}/${supersetOrder.total}` : ''}
            </Text>
          </View>
          <Text style={styles.supersetSub}>Alternance automatique</Text>
        </View>
      )}

      {/* Exercise Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleArea}>
          <View style={styles.titleRow}>
            <Dumbbell size={18} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.exerciseName}</Text>
          </View>

          {/* Muscles travaillés (Ligne 1 : Principaux, Ligne 2 : Secondaires) */}
          <View style={styles.musclesContainer}>
            {/* Ligne 1 : Principaux */}
            {primaryMusclesList.length > 0 && (
              <View style={styles.musclesLine}>
                {primaryMusclesList.map((m, idx) => (
                  <View key={`pm_${idx}`} style={[styles.compactPill, { backgroundColor: theme.accent }]}>
                    <Text style={styles.compactPillText}>{m}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Ligne 2 : Secondaires */}
            {secondaryMusclesList.length > 0 && (
              <View style={[styles.musclesLine, { marginTop: 3 }]}>
                {secondaryMusclesList.map((m, idx) => (
                  <View
                    key={`sm_${idx}`}
                    style={[
                      styles.compactPill,
                      styles.secondaryPill,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.compactPillText, { color: theme.textMuted }]}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Rest Timer (Cliquable pour modifier!) & Options */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowRestModal(true)}
            style={[styles.restBadge, { borderColor: theme.accent, backgroundColor: theme.surface }]}
          >
            <Clock size={12} color={theme.accent} />
            <Text style={[styles.restText, { color: theme.accent }]}>{exercise.restSeconds}s</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowMenu(true)} style={styles.menuButton}>
            <MoreVertical size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Table Header */}
      <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
        <View style={{ width: 30, marginRight: 4, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: theme.textMuted }]}>#</Text>
        </View>
        <View style={{ flex: 1.2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: theme.textMuted }]}>PREV</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: theme.textMuted }]}>KG</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: theme.textMuted }]}>REPS</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 2, alignItems: 'center' }}>
          <Text style={[styles.thText, { color: theme.textMuted }]}>RIR</Text>
        </View>
        <View style={{ width: 38, marginLeft: 4, alignItems: 'center' }}>
          <Text numberOfLines={1} style={[styles.thText, { color: theme.textMuted, fontSize: 10 }]}>
            Check
          </Text>
        </View>
        <View style={{ width: 24, marginLeft: 4 }} />
      </View>

      {/* Set Table Rows */}
      {exercise.sets.map((set) => {
        const isNext = Boolean(
          nextTargetSet &&
          nextTargetSet.exerciseName === exercise.exerciseName &&
          nextTargetSet.setNumber === set.setNumber &&
          !set.completed
        );

        return (
          <SetTableRow
            key={set.id}
            set={set}
            exerciseId={exercise.id}
            isNextSet={isNext}
            onUpdate={(field, val) => onUpdateSet(set.id, field, val)}
            onToggleComplete={() => onToggleSetComplete(set.id)}
            onDelete={() => onRemoveSet(set.id)}
          />
        );
      })}

      {/* Add Set Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onAddSet}
        style={[styles.addSetButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Plus size={16} color={theme.accent} />
        <Text style={[styles.addSetText, { color: theme.accent }]}>Ajouter une série</Text>
      </TouchableOpacity>

      {/* Modal Édition Temps de Repos (Steppers +/- 15s et Reset à gauche) */}
      <Modal visible={showRestModal} transparent animationType="fade" onRequestClose={() => setShowRestModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRestModal(false)}>
          <View style={[styles.menuContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, alignItems: 'center' }]}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Temps de repos exercice</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
              {exercise.restSeconds !== 75 && (
                <TouchableOpacity
                  style={[styles.smallStepperBtn, { backgroundColor: theme.surface, borderColor: theme.border, marginRight: 8 }]}
                  onPress={() => onUpdateRestTime(75)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <RotateCcw size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.stepperActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => onUpdateRestTime(Math.max(0, (exercise.restSeconds || 75) - 15))}
              >
                <Text style={[styles.stepperActionText, { color: theme.text }]}>-15s</Text>
              </TouchableOpacity>

              <Text style={[styles.restDisplayValue, { color: theme.accent }]}>
                {exercise.restSeconds || 75}s
              </Text>

              <TouchableOpacity
                style={[styles.stepperActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => onUpdateRestTime((exercise.restSeconds || 75) + 15)}
              >
                <Text style={[styles.stepperActionText, { color: theme.text }]}>+15s</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Fermer"
              variant="primary"
              onPress={() => setShowRestModal(false)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Options Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>{exercise.exerciseName}</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowSupersetModal(true);
              }}
            >
              <Layers size={16} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                {exercise.supersetGroup ? 'Modifier le Superset' : 'Convertir en Superset'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onDuplicateExercise();
              }}
            >
              <Copy size={16} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Dupliquer l'exercice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onRemoveExercise();
              }}
            >
              <Trash2 size={16} color={theme.danger} />
              <Text style={[styles.menuItemText, { color: theme.danger }]}>Retirer de la séance</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Superset Group Selector */}
      <Modal visible={showSupersetModal} transparent animationType="fade" onRequestClose={() => setShowSupersetModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSupersetModal(false)}>
          <View style={[styles.menuContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Groupe Superset</Text>
            {['Superset A', 'Superset B', 'Superset C'].map((group) => (
              <TouchableOpacity
                key={group}
                style={[styles.menuItem, exercise.supersetGroup === group && { backgroundColor: theme.surface }]}
                onPress={() => {
                  onSetSupersetGroup(group);
                  setShowSupersetModal(false);
                }}
              >
                <Text style={[styles.menuItemText, { color: theme.text }]}>{group}</Text>
                {exercise.supersetGroup === group && <Check size={16} color={theme.accent} />}
              </TouchableOpacity>
            ))}

            {exercise.supersetGroup && (
              <TouchableOpacity
                style={[styles.menuItem, { marginTop: 6 }]}
                onPress={() => {
                  onSetSupersetGroup(undefined);
                  setShowSupersetModal(false);
                }}
              >
                <Text style={[styles.menuItemText, { color: theme.danger }]}>Retirer du Superset</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  supersetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  supersetText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  supersetSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitleArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '800',
  },
  musclesContainer: {
    marginTop: 3,
  },
  musclesLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  compactPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  secondaryPill: {
    borderWidth: 1,
  },
  compactPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 6,
  },
  restText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  menuButton: {
    padding: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  stepperActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  stepperActionText: {
    fontSize: 15,
    fontWeight: '800',
  },
  restDisplayValue: {
    fontSize: 22,
    fontWeight: '900',
    minWidth: 60,
    textAlign: 'center',
  },
  smallStepperBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ExerciseCard = React.memo(
  ExerciseCardComponent,
  (prev, next) =>
    prev.exercise === next.exercise &&
    prev.nextTargetSet?.exerciseName === next.nextTargetSet?.exerciseName &&
    prev.nextTargetSet?.setNumber === next.nextTargetSet?.setNumber &&
    prev.supersetOrder?.index === next.supersetOrder?.index &&
    prev.supersetOrder?.total === next.supersetOrder?.total
);
export default ExerciseCard;
