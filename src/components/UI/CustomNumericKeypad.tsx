import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { X, Delete, ArrowRight, Check, RotateCcw, ArrowLeft } from 'lucide-react-native';

export type NumericFieldType = 'weightKg' | 'reps' | 'rir';

export interface CustomNumericKeypadProps {
  visible: boolean;
  onClose: (currentVal?: string) => void;
  setNumber: number;
  activeField: NumericFieldType;
  value: string;
  onChangeValue?: (val: string) => void;
  onNextField?: (currentVal: string) => void;
  onPreviousField?: (currentVal: string) => void;
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

export const computeNextValue = (
  prevVal: string,
  key: string,
  activeField: NumericFieldType | null
): string => {
  if (key === 'backspace') {
    return prevVal.length > 0 ? prevVal.slice(0, -1) : '';
  }
  if (key === '.') {
    if (activeField === 'reps') return prevVal; // Les reps sont toujours des entiers
    if (prevVal.includes('.')) return prevVal;
    return prevVal === '' ? '0.' : prevVal + '.';
  }

  // Limitation à 2 chiffres après la virgule (ex: 82.25)
  if (prevVal.includes('.')) {
    const decimalPart = prevVal.split('.')[1];
    if (decimalPart && decimalPart.length >= 2) {
      return prevVal;
    }
  }

  // Chiffres 0-9
  if (prevVal === '0') {
    return key;
  }
  if (prevVal.length < 7) {
    return prevVal + key;
  }
  return prevVal;
};

interface KeyButtonProps {
  value: string;
  label?: string;
  isBackspace?: boolean;
  disabled?: boolean;
  onPress: (val: string) => void;
  theme: any;
}

// Sous-composant KeyButton ultra-optimisé avec réponse tactile native instantanée (0ms)
const KeyButton = React.memo<KeyButtonProps>(({
  value,
  label,
  isBackspace,
  disabled,
  onPress,
  theme,
}) => {
  const handlePress = useCallback(() => {
    onPress(value);
  }, [onPress, value]);

  return (
    <TouchableOpacity
      activeOpacity={0.55}
      delayPressIn={0}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.keypadBtn,
        isBackspace
          ? {
              backgroundColor: `${theme.danger}15`,
              borderColor: theme.danger,
              borderWidth: 1.5,
            }
          : {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: disabled ? 0.35 : 1,
            },
      ]}
    >
      {isBackspace ? (
        <Delete size={22} color={theme.danger} />
      ) : (
        <Text style={[styles.keypadText, { color: theme.text }]}>
          {label || value}
        </Text>
      )}
    </TouchableOpacity>
  );
});

KeyButton.displayName = 'KeyButton';

interface RirButtonProps {
  option: string;
  isSelected: boolean;
  onPress: (val: string) => void;
  theme: any;
}

const RirButton = React.memo<RirButtonProps>(({
  option,
  isSelected,
  onPress,
  theme,
}) => {
  const handlePress = useCallback(() => {
    onPress(option);
  }, [onPress, option]);

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      delayPressIn={0}
      onPress={handlePress}
      style={[
        styles.rirBtn,
        {
          backgroundColor: isSelected ? theme.accent : theme.surface,
          borderColor: isSelected ? theme.accent : theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.rirBtnText,
          { color: isSelected ? '#FFFFFF' : theme.text },
        ]}
      >
        {option}
      </Text>
    </TouchableOpacity>
  );
});

RirButton.displayName = 'RirButton';

export const CustomNumericKeypad: React.FC<CustomNumericKeypadProps> = ({
  visible,
  onClose,
  setNumber,
  activeField,
  value,
  onChangeValue,
  onNextField,
  onPreviousField,
  onValidate,
  onClear,
}) => {
  const { theme } = useTheme();

  // État local de la saisie : buffer pur pour 0ms de latence
  const [localValue, setLocalValue] = useState<string>(value);

  // Synchronisation du buffer local uniquement lors de l'ouverture ou du changement de cible
  useEffect(() => {
    if (visible) {
      console.log(`[CITADEL-PERF] Clavier ouvert: field=${activeField}, setNumber=${setNumber}, initialValue="${value}"`);
      setLocalValue(value);
    }
  }, [visible, activeField, setNumber, value]);

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

  // Gestion des clics du pavé numérique (0-9, ., backspace) : purement local, callback stable (< 0.5ms)
  const handleKeyPress = useCallback((key: string) => {
    const t0 = Date.now();
    setLocalValue((prevVal) => {
      const nextVal = computeNextValue(prevVal, key, activeField);
      console.log(`[CITADEL-PERF] Touche pressée: "${key}", "${prevVal}" ➔ "${nextVal}" (${Date.now() - t0}ms)`);
      return nextVal;
    });
  }, [activeField]);

  // Gestion des boutons de choix rapide RIR (0, 1, 2, 3, 4, 5+) : commit direct et validation instantanée
  const handleRirPress = useCallback((key: string) => {
    console.log(`[CITADEL-PERF] RIR sélectionné: "${key}" ➔ commit immédiat dans la séance`);
    setLocalValue(key);
    if (onValidate) {
      onValidate(key);
    } else if (onNextField) {
      onNextField(key);
    } else if (onClose) {
      onClose(key);
    }
  }, [onValidate, onNextField, onClose]);

  // Réinitialisation locale de la valeur saisie (sans commit synchrone bloquant)
  const handleClear = useCallback(() => {
    console.log(`[CITADEL-PERF] Effacer cliqué pour champ: ${activeField}`);
    setLocalValue('');
    if (onClear) {
      onClear();
    }
  }, [onClear, activeField]);

  // Action Suivant (passer au champ suivant en transmettant la valeur locale)
  const handleNext = useCallback(() => {
    console.log(`[CITADEL-PERF] Suivant cliqué: transmission de "${localValue}"`);
    if (onNextField) {
      onNextField(localValue);
    }
  }, [onNextField, localValue]);

  // Action Précédent (retourner au champ précédent en transmettant la valeur locale)
  const handlePrevious = useCallback(() => {
    console.log(`[CITADEL-PERF] Précédent cliqué: transmission de "${localValue}"`);
    if (onPreviousField) {
      onPreviousField(localValue);
    }
  }, [onPreviousField, localValue]);

  // Action Valider (valider et fermer en transmettant la valeur locale)
  const handleValidate = useCallback(() => {
    console.log(`[CITADEL-PERF] Valider cliqué: validation finale de "${localValue}"`);
    if (onValidate) {
      onValidate(localValue);
    }
  }, [onValidate, localValue]);

  const isLastField = activeField === 'rir';

  // Action Fermer (ferme le modal en transmettant la valeur locale en cours)
  const handleClose = useCallback(() => {
    console.log(`[CITADEL-PERF] Fermeture clavier: valeur finale enregistrée "${localValue}"`);
    if (onClose) {
      onClose(localValue);
    }
  }, [onClose, localValue]);

  // Pavé numérique standard 4x3 pour KG et REPS
  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  // Choix rapides RIR dédiés (de 0 à 5+)
  const rirOptions = ['0', '1', '2', '3', '4', '5+'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
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
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Affichage du mode de saisie selon le champ actif */}
          {activeField === 'rir' ? (
            /* Mode RIR : Rangée exclusive de boutons de choix rapide (0, 1, 2, 3, 4, 5+) */
            <View style={styles.rirContainer}>
              {rirOptions.map((option) => {
                const isSelected =
                  localValue === option || (option === '5+' && (localValue === '5+' || localValue === '5'));
                return (
                  <RirButton
                    key={option}
                    option={option}
                    isSelected={isSelected}
                    onPress={handleRirPress}
                    theme={theme}
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
                    const isBackspace = key === 'backspace';
                    return (
                      <KeyButton
                        key={key}
                        value={key}
                        label={key}
                        isBackspace={isBackspace}
                        disabled={isDotDisabled}
                        onPress={handleKeyPress}
                        theme={theme}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* Barre d'action inférieure */}
          <View style={styles.buttonBar}>
            {/* Bouton Gauche 1 : Précédent (si pas sur le tout premier champ) */}
            {activeField !== 'weightKg' && onPreviousField && (
              <TouchableOpacity
                activeOpacity={0.6}
                delayPressIn={0}
                onPress={handlePrevious}
                style={[
                  styles.actionBtn,
                  styles.prevBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ArrowLeft
                  size={15}
                  color={theme.text}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.prevBtnText, { color: theme.text }]}>
                  Précédent
                </Text>
              </TouchableOpacity>
            )}

            {/* Bouton Gauche 2 : Effacer (même style danger rouge que backspace) */}
            <TouchableOpacity
              activeOpacity={0.6}
              delayPressIn={0}
              onPress={handleClear}
              style={[
                styles.actionBtn,
                styles.clearBtn,
                {
                  backgroundColor: `${theme.danger}15`,
                  borderColor: theme.danger,
                  borderWidth: 1.5,
                },
              ]}
            >
              <RotateCcw
                size={15}
                color={theme.danger}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.clearBtnText, { color: theme.danger }]}>
                Effacer
              </Text>
            </TouchableOpacity>

            {/* Bouton Droit : Suivant ➔ ou Valider 🗸 */}
            {isLastField ? (
              <TouchableOpacity
                activeOpacity={0.7}
                delayPressIn={0}
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
                activeOpacity={0.7}
                delayPressIn={0}
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
  prevBtn: {
    borderWidth: 1,
    marginRight: 6,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    borderWidth: 1,
    marginRight: 6,
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
