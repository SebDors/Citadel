import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { X, Delete, ArrowRight, Check, RotateCcw } from 'lucide-react-native';

export type NumericFieldType = 'weightKg' | 'reps' | 'rir';

export interface CustomNumericKeypadProps {
  visible: boolean;
  onClose: () => void;
  setNumber: number;
  activeField: NumericFieldType;
  value: string;
  onChangeValue?: (val: string) => void;
  onNextField?: (currentVal: string) => void;
  onValidate?: (finalVal: string) => void;
  onClear?: () => void;
}

interface KeyButtonProps {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  onPress: (val: string) => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

// Sous-composant KeyButton mémoïsé avec React.memo pour des performances optimales (< 16ms)
const KeyButton = React.memo<KeyButtonProps>(({
  value,
  label,
  icon,
  onPress,
  disabled,
  style,
  textStyle,
}) => {
  const handlePress = useCallback(() => {
    onPress(value);
  }, [onPress, value]);

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={handlePress}
      disabled={disabled}
      style={style}
    >
      {icon ? icon : <Text style={textStyle}>{label || value}</Text>}
    </TouchableOpacity>
  );
});

KeyButton.displayName = 'KeyButton';

export const CustomNumericKeypad: React.FC<CustomNumericKeypadProps> = ({
  visible,
  onClose,
  setNumber,
  activeField,
  value,
  onChangeValue,
  onNextField,
  onValidate,
  onClear,
}) => {
  const { theme } = useTheme();

  // État local de la saisie pour éviter de ré-exécuter le rendu du composant parent SetTableRow à chaque touche tapée
  const [localValue, setLocalValue] = useState<string>(value);

  // Synchronisation de l'état local lors du changement de prop value ou activeField
  useEffect(() => {
    setLocalValue(value);
  }, [value, activeField, visible]);

  // Titre et unité de l'en-tête selon le champ actif
  const getFieldHeaderInfo = useCallback(() => {
    switch (activeField) {
      case 'weightKg':
        return { title: `Série ${setNumber} · Poids`, unit: 'KG' };
      case 'reps':
        return { title: `Série ${setNumber} · Répétitions`, unit: 'REPS' };
      case 'rir':
        return { title: `Série ${setNumber} · Reps in Reserve`, unit: 'RIR' };
      default:
        return { title: `Série ${setNumber}`, unit: '' };
    }
  }, [activeField, setNumber]);

  const { title, unit } = getFieldHeaderInfo();

  // Gestion des clics du pavé numérique (0-9, ., backspace)
  const handleKeyPress = useCallback((key: string) => {
    setLocalValue((prevVal) => {
      let nextVal = prevVal;
      if (key === 'backspace') {
        nextVal = prevVal.length > 0 ? prevVal.slice(0, -1) : '';
      } else if (key === '.') {
        if (activeField === 'reps') return prevVal; // Les reps sont toujours des entiers
        if (prevVal.includes('.')) return prevVal;
        nextVal = prevVal === '' ? '0.' : prevVal + '.';
      } else {
        // Chiffres 0-9
        if (prevVal === '0') {
          nextVal = key;
        } else if (prevVal.length < 6) {
          nextVal = prevVal + key;
        }
      }
      if (onChangeValue) {
        onChangeValue(nextVal);
      }
      return nextVal;
    });
  }, [activeField, onChangeValue]);

  // Gestion des boutons de choix rapide RIR (1, 2, 3, 4, 5+)
  const handleRirPress = useCallback((key: string) => {
    setLocalValue(key);
    if (onChangeValue) {
      onChangeValue(key);
    }
  }, [onChangeValue]);

  // Réinitialisation de la valeur saisie
  const handleClear = useCallback(() => {
    setLocalValue('');
    if (onChangeValue) {
      onChangeValue('');
    }
    if (onClear) {
      onClear();
    }
  }, [onChangeValue, onClear]);

  // Action Suivant (passer au champ suivant en transmettant la valeur locale)
  const handleNext = useCallback(() => {
    if (onNextField) {
      onNextField(localValue);
    }
  }, [onNextField, localValue]);

  // Action Valider (valider et fermer en transmettant la valeur locale)
  const handleValidate = useCallback(() => {
    if (onValidate) {
      onValidate(localValue);
    }
  }, [onValidate, localValue]);

  const isLastField = activeField === 'rir';

  // Pavé numérique standard 4x3 pour KG et REPS
  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  // Choix rapides RIR dédiés
  const rirOptions = ['1', '2', '3', '4', '5+'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            },
          ]}
        >
          {/* En-tête du Clavier */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerSubTitle, { color: theme.textMuted }]}>
                {title}
              </Text>
              <View style={styles.valueDisplayRow}>
                <Text
                  style={[
                    styles.headerValue,
                    { color: localValue ? theme.text : theme.textMuted },
                  ]}
                >
                  {localValue || '-'}
                </Text>
                <Text style={[styles.headerUnit, { color: theme.accent }]}>
                  {unit}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
              activeOpacity={0.7}
            >
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Affichage du mode de saisie selon le champ actif */}
          {activeField === 'rir' ? (
            /* Mode RIR : Rangée exclusive de boutons de choix rapide (1, 2, 3, 4, 5+) */
            <View style={styles.rirContainer}>
              {rirOptions.map((option) => {
                const isSelected =
                  localValue === option || (option === '5+' && localValue === '5');
                return (
                  <KeyButton
                    key={option}
                    value={option}
                    label={option}
                    onPress={handleRirPress}
                    style={[
                      styles.rirBtn,
                      {
                        backgroundColor: isSelected
                          ? theme.accent
                          : theme.surface,
                        borderColor: isSelected
                          ? theme.accent
                          : theme.border,
                      },
                    ]}
                    textStyle={[
                      styles.rirBtnText,
                      { color: isSelected ? '#FFFFFF' : theme.text },
                    ]}
                  />
                );
              })}
            </View>
          ) : (
            /* Mode Standard (KG / REPS) : Grille Numérique 4x3 */
            <View style={styles.gridContainer}>
              {keypadRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((key) => {
                    const isDotDisabled = key === '.' && activeField === 'reps';
                    return (
                      <KeyButton
                        key={key}
                        value={key}
                        label={key}
                        disabled={isDotDisabled}
                        icon={
                          key === 'backspace' ? (
                            <Delete size={22} color={theme.text} />
                          ) : undefined
                        }
                        onPress={handleKeyPress}
                        style={[
                          styles.keypadBtn,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            opacity: isDotDisabled ? 0.35 : 1,
                          },
                        ]}
                        textStyle={[styles.keypadText, { color: theme.text }]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* Barre d'action inférieure */}
          <View style={styles.buttonBar}>
            {/* Bouton Gauche : Effacer */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClear}
              style={[
                styles.actionBtn,
                styles.clearBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <RotateCcw
                size={16}
                color={theme.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.clearBtnText, { color: theme.text }]}>
                Effacer
              </Text>
            </TouchableOpacity>

            {/* Bouton Droit : Suivant ➔ ou Valider 🗸 */}
            {isLastField ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleValidate}
                style={[
                  styles.actionBtn,
                  styles.validateBtn,
                  {
                    backgroundColor: theme.success || theme.accent,
                  },
                ]}
              >
                <Text style={styles.actionBtnText}>Valider</Text>
                <Check size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleNext}
                style={[
                  styles.actionBtn,
                  styles.nextBtn,
                  {
                    backgroundColor: theme.accent,
                  },
                ]}
              >
                <Text style={styles.actionBtnText}>Suivant</Text>
                <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  valueDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  headerUnit: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  /* Mode RIR : Rangée unique de choix rapide */
  rirContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 6,
  },
  rirBtn: {
    flex: 1,
    height: 56,
    marginHorizontal: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rirBtnText: {
    fontSize: 20,
    fontWeight: '800',
  },
  /* Mode Standard : Pavé 4x3 */
  gridContainer: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keypadBtn: {
    flex: 1,
    height: 52,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadText: {
    fontSize: 22,
    fontWeight: '700',
  },
  buttonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    borderWidth: 1,
    marginRight: 8,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  nextBtn: {
    marginLeft: 8,
  },
  validateBtn: {
    marginLeft: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
