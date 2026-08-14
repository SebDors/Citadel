import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { WorkoutSet, DropStep, SET_TYPES_CONFIG } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Check, Trash2, X, Plus, CornerDownRight } from 'lucide-react-native';
import { CustomNumericKeypad, NumericFieldType } from '../UI/CustomNumericKeypad';

interface SetTableRowProps {
  set: WorkoutSet;
  exerciseId: string;
  onUpdate: (field: keyof WorkoutSet, value: any) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

type KeypadTarget =
  | { type: 'main'; field: NumericFieldType }
  | { type: 'drop'; stepId: string; field: 'weightKg' | 'reps' }
  | null;

const SetTableRowComponent: React.FC<SetTableRowProps> = ({
  set,
  onUpdate,
  onToggleComplete,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<KeypadTarget>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const currentTypeConfig = SET_TYPES_CONFIG[set.type] || SET_TYPES_CONFIG.normal;

  // Ouverture du clavier numérique sur un champ principal ou décharge
  const handleOpenMainKeypad = useCallback((field: NumericFieldType) => {
    setKeypadTarget({ type: 'main', field });
    let valStr = '';
    if (field === 'weightKg') {
      valStr = set.weightKg !== undefined && set.weightKg !== null ? String(set.weightKg) : '';
    } else if (field === 'reps') {
      valStr = set.reps !== undefined && set.reps !== null ? String(set.reps) : '';
    } else if (field === 'rir') {
      valStr = set.rir !== undefined && set.rir !== null ? (set.rir >= 5 ? '5+' : String(set.rir)) : '';
    }
    setTempValue(valStr);
  }, [set.weightKg, set.reps, set.rir]);

  const handleOpenDropKeypad = useCallback((stepId: string, field: 'weightKg' | 'reps') => {
    setKeypadTarget({ type: 'drop', stepId, field });
    const step = (set.dropSteps || []).find((s) => s.id === stepId);
    const val = step ? step[field] : undefined;
    setTempValue(val !== undefined && val !== null ? String(val) : '');
  }, [set.dropSteps]);

  // Validation et mise à jour de la valeur saisie
  const commitValue = useCallback((target: KeypadTarget, valStr: string) => {
    if (!target) return;
    if (target.type === 'main') {
      const field = target.field;
      if (field === 'weightKg') {
        const num = valStr === '' || valStr === '.' ? undefined : parseFloat(valStr);
        onUpdate('weightKg', num !== undefined && !isNaN(num) ? num : undefined);
      } else if (field === 'reps') {
        const num = valStr === '' ? undefined : parseInt(valStr, 10);
        onUpdate('reps', num !== undefined && !isNaN(num) ? num : undefined);
      } else if (field === 'rir') {
        if (valStr === '' || valStr === null || valStr === undefined) {
          onUpdate('rir', undefined);
        } else if (valStr === '5+' || valStr === '5') {
          onUpdate('rir', 5);
        } else {
          const num = parseInt(valStr, 10);
          onUpdate('rir', !isNaN(num) ? num : undefined);
        }
      }
    } else if (target.type === 'drop') {
      const { stepId, field } = target;
      const num = valStr === '' || valStr === '.' ? undefined : parseFloat(valStr);
      const current = set.dropSteps || [];
      const next = current.map((s) => (s.id === stepId ? { ...s, [field]: num !== undefined && !isNaN(num) ? num : undefined } : s));
      onUpdate('dropSteps', next);
    }
  }, [onUpdate, set.dropSteps]);

  // Changement en direct de la valeur
  const handleKeypadChange = useCallback((val: string) => {
    setTempValue(val);
    if (keypadTarget) {
      commitValue(keypadTarget, val);
    }
  }, [keypadTarget, commitValue]);

  // Passage au champ suivant (KG ➔ REPS ➔ RIR)
  const handleKeypadNext = useCallback((currentVal?: string) => {
    if (!keypadTarget) return;
    const valToCommit = currentVal !== undefined ? currentVal : tempValue;
    commitValue(keypadTarget, valToCommit);

    if (keypadTarget.type === 'main') {
      if (keypadTarget.field === 'weightKg') {
        handleOpenMainKeypad('reps');
      } else if (keypadTarget.field === 'reps') {
        if (set.type === 'normal') {
          handleOpenMainKeypad('rir');
        } else {
          if (!set.completed) onToggleComplete();
          setKeypadTarget(null);
        }
      }
    } else if (keypadTarget.type === 'drop') {
      if (keypadTarget.field === 'weightKg') {
        handleOpenDropKeypad(keypadTarget.stepId, 'reps');
      } else {
        setKeypadTarget(null);
      }
    }
  }, [keypadTarget, tempValue, commitValue, handleOpenMainKeypad, handleOpenDropKeypad, set.type, set.completed, onToggleComplete]);

  // Validation finale
  const handleKeypadValidate = useCallback((finalVal?: string) => {
    if (!keypadTarget) return;
    const valToCommit = finalVal !== undefined ? finalVal : tempValue;
    commitValue(keypadTarget, valToCommit);

    if (keypadTarget.type === 'main' && !set.completed) {
      onToggleComplete();
    }
    setKeypadTarget(null);
  }, [keypadTarget, tempValue, commitValue, set.completed, onToggleComplete]);

  const handleKeypadClose = useCallback(() => {
    setKeypadTarget(null);
  }, []);

  const handleAddDropStep = () => {
    const current = set.dropSteps || [];
    const next: DropStep[] = [
      ...current,
      { id: `drop_${Date.now()}_${current.length + 1}`, weightKg: undefined, reps: undefined },
    ];
    onUpdate('dropSteps', next);
  };

  const handleRemoveDropStep = (stepId: string) => {
    const current = set.dropSteps || [];
    const next = current.filter((s) => s.id !== stepId);
    onUpdate('dropSteps', next);
  };

  return (
    <View style={styles.containerCol}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: set.completed ? theme.completedSet : 'transparent',
            borderBottomColor: theme.border,
          },
        ]}
      >
        {/* Sélecteur de type de série */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowTypeModal(true)}
          style={[styles.typeButton, { backgroundColor: currentTypeConfig.color }]}
        >
          <Text style={styles.typeText}>{currentTypeConfig.code}</Text>
        </TouchableOpacity>

        {/* Performance précédente */}
        <View style={styles.colPrevious}>
          <Text style={[styles.previousText, { color: theme.textMuted }]}>
            {set.previous || '-'}
          </Text>
        </View>

        {/* Saisie Poids (Kg) */}
        <View style={styles.colInput}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenMainKeypad('weightKg')}
            style={[
              styles.cellBtn,
              {
                borderColor: keypadTarget?.type === 'main' && keypadTarget.field === 'weightKg' ? theme.accent : theme.border,
                borderWidth: keypadTarget?.type === 'main' && keypadTarget.field === 'weightKg' ? 2 : 1,
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

        {/* Saisie Reps */}
        <View style={styles.colInput}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenMainKeypad('reps')}
            style={[
              styles.cellBtn,
              {
                borderColor: keypadTarget?.type === 'main' && keypadTarget.field === 'reps' ? theme.accent : theme.border,
                borderWidth: keypadTarget?.type === 'main' && keypadTarget.field === 'reps' ? 2 : 1,
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

        {/* Saisie RIR : Affichée UNIQUEMENT si la série est de type "normal" */}
        <View style={styles.colInput}>
          {set.type === 'normal' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenMainKeypad('rir')}
              style={[
                styles.cellBtn,
                {
                  borderColor: keypadTarget?.type === 'main' && keypadTarget.field === 'rir' ? theme.accent : theme.border,
                  borderWidth: keypadTarget?.type === 'main' && keypadTarget.field === 'rir' ? 2 : 1,
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
                {set.rir !== undefined && set.rir !== null ? (set.rir >= 5 ? '5+' : String(set.rir)) : '-'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Checkbox de complétion */}
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

        {/* Suppression de la série */}
        <TouchableOpacity activeOpacity={0.7} onPress={onDelete} style={styles.deleteButton}>
          <Trash2 size={16} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {/* Sous-section pour les décharges Drop Set (Type D) */}
      {set.type === 'drop' && (
        <View style={[styles.dropContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.dropHeaderRow}>
            <CornerDownRight size={14} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.dropHeaderText, { color: theme.accent }]}>
              Décharges dégressives (Drop Set)
            </Text>
          </View>

          {(set.dropSteps || []).map((step, idx) => {
            const isWeightActive = keypadTarget?.type === 'drop' && keypadTarget.stepId === step.id && keypadTarget.field === 'weightKg';
            const isRepsActive = keypadTarget?.type === 'drop' && keypadTarget.stepId === step.id && keypadTarget.field === 'reps';

            return (
              <View key={step.id || idx} style={styles.dropStepRow}>
                <Text style={[styles.dropStepLabel, { color: theme.textMuted }]}>
                  Étape {idx + 2} :
                </Text>

                {/* Bouton Poids Décharge (Ouvre le clavier numérique) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.dropCellBtn,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: isWeightActive ? theme.accent : theme.border,
                      borderWidth: isWeightActive ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleOpenDropKeypad(step.id, 'weightKg')}
                >
                  <Text style={[styles.dropCellText, { color: step.weightKg !== undefined ? theme.text : theme.textMuted }]}>
                    {step.weightKg !== undefined ? `${step.weightKg} kg` : '- kg'}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.dropTimesText, { color: theme.textMuted }]}>×</Text>

                {/* Bouton Reps Décharge (Ouvre le clavier numérique) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.dropCellBtn,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: isRepsActive ? theme.accent : theme.border,
                      borderWidth: isRepsActive ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleOpenDropKeypad(step.id, 'reps')}
                >
                  <Text style={[styles.dropCellText, { color: step.reps !== undefined ? theme.text : theme.textMuted }]}>
                    {step.reps !== undefined ? `${step.reps} reps` : '- reps'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleRemoveDropStep(step.id)}
                  style={{ padding: 4, marginLeft: 4 }}
                >
                  <Trash2 size={14} color={theme.danger} />
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAddDropStep}
            style={[styles.addDropBtn, { borderColor: theme.accent }]}
          >
            <Plus size={13} color={theme.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.addDropText, { color: theme.accent }]}>+ Décharge</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clavier Numérique Personnalisé */}
      {keypadTarget !== null && (
        <CustomNumericKeypad
          visible={keypadTarget !== null}
          onClose={handleKeypadClose}
          setNumber={set.setNumber}
          activeField={keypadTarget.type === 'main' ? keypadTarget.field : (keypadTarget.field as NumericFieldType)}
          value={tempValue}
          onChangeValue={handleKeypadChange}
          onNextField={handleKeypadNext}
          onValidate={handleKeypadValidate}
          onClear={() => commitValue(keypadTarget, '')}
        />
      )}

      {/* Modal de sélection du type de série */}
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
                  if (cfg.type === 'failure' || cfg.type === 'amrap') {
                    onUpdate('rir', 0);
                  } else if (cfg.type === 'warmup') {
                    onUpdate('rir', undefined);
                  } else if (cfg.type === 'drop') {
                    if (!set.dropSteps || set.dropSteps.length === 0) {
                      onUpdate('dropSteps', [
                        { id: `drop_${Date.now()}_1`, weightKg: undefined, reps: undefined }
                      ]);
                    }
                  }
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

SetTableRowComponent.displayName = 'SetTableRowComponent';

export const SetTableRow = React.memo(SetTableRowComponent);
export default SetTableRow;

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
  containerCol: {
    width: '100%',
  },
  dropContainer: {
    marginLeft: 32,
    marginTop: 4,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dropHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dropStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  dropStepLabel: {
    fontSize: 12,
    fontWeight: '700',
    width: 62,
  },
  dropCellBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  dropCellText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropTimesText: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 6,
  },
  addDropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  addDropText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
