import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  previousValue?: string;
  ghostValue?: string;
  ghostLabel?: string;
  onChangeValue?: (val: string) => void;
  onNextField?: (currentVal: string) => void;
  onPreviousField?: (currentVal: string) => void;
  onValidate?: (finalVal: string) => void;
  onClear?: () => void;
  isLastField?: boolean;
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

  // Si premier chiffre après 0 (sans point) : remplacer le 0 par le nouveau chiffre
  if (prevVal === '0') {
    return key;
  }

  // Limitation à 6 caractères au total (ex: 999.99)
  if (prevVal.length >= 6) {
    return prevVal;
  }

  return prevVal + key;
};

// Grille et options constantes (évite la ré-instanciation de tableaux à chaque frappe)
const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

const RIR_OPTIONS = ['0', '1', '2', '3', '4', '5+'];

interface KeyButtonProps {
  value: string;
  label?: string;
  isBackspace?: boolean;
  disabled?: boolean;
  onPress: (val: string) => void;
  theme: any;
}

// Sous-composant KeyButton ultra-réactif : déclenchement immédiat dès le contact tactile (onPressIn)
const KeyButton = React.memo<KeyButtonProps>(({
  value,
  label,
  isBackspace,
  disabled,
  onPress,
  theme,
}) => {
  const handlePressIn = useCallback(() => {
    if (!disabled) {
      onPress(value);
    }
  }, [onPress, value, disabled]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      disabled={disabled}
      unstable_pressDelay={0}
      android_ripple={{
        color: isBackspace ? `${theme.danger}40` : `${theme.accent}40`,
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.keypadBtn,
        {
          backgroundColor: isBackspace
            ? (pressed && !disabled ? `${theme.danger}35` : theme.surface)
            : (pressed && !disabled ? `${theme.accent}45` : theme.surface),
          borderColor: isBackspace
            ? (pressed && !disabled ? theme.danger : theme.border)
            : (pressed && !disabled ? theme.accent : theme.border),
          transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      {({ pressed }) =>
        isBackspace ? (
          <Delete
            size={22}
            color={pressed && !disabled ? theme.danger : theme.text}
          />
        ) : (
          <Text
            style={[
              styles.keypadText,
              {
                color: pressed && !disabled ? theme.accent : theme.text,
                fontWeight: pressed && !disabled ? '900' : '700',
              },
            ]}
          >
            {label || value}
          </Text>
        )
      }
    </Pressable>
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
  const handlePressIn = useCallback(() => {
    onPress(option);
  }, [onPress, option]);

  return (
    <Pressable
      unstable_pressDelay={0}
      onPressIn={handlePressIn}
      android_ripple={{
        color: `${theme.accent}40`,
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.rirBtn,
        {
          backgroundColor: isSelected
            ? theme.accent
            : (pressed ? `${theme.accent}35` : theme.surface),
          borderColor: isSelected
            ? theme.accent
            : (pressed ? theme.accent : theme.border),
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      {({ pressed }) => (
        <Text
          style={[
            styles.rirBtnText,
            {
              color: isSelected
                ? '#FFFFFF'
                : (pressed ? theme.accent : theme.text),
              fontWeight: isSelected || pressed ? '900' : '800',
            },
          ]}
        >
          {option}
        </Text>
      )}
    </Pressable>
  );
});

RirButton.displayName = 'RirButton';

export const CustomNumericKeypad: React.FC<CustomNumericKeypadProps> = ({
  visible,
  onClose,
  setNumber,
  activeField,
  value,
  previousValue,
  ghostValue,
  ghostLabel,
  onChangeValue,
  onNextField,
  onPreviousField,
  onValidate,
  onClear,
  isLastField,
}) => {
  const { theme } = useTheme();

  // État local de la saisie : buffer pur pour 0ms de latence
  const [localValue, setLocalValue] = useState<string>(value);
  const localValueRef = useRef<string>(localValue);
  localValueRef.current = localValue;

  // Synchronisation du buffer local uniquement lors de l'ouverture ou du changement de cible
  useEffect(() => {
    if (visible) {
      setLocalValue(value);
      localValueRef.current = value;
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
    setLocalValue((prevVal) => {
      return computeNextValue(prevVal, key, activeField);
    });
  }, [activeField]);

  // Gestion des boutons de choix rapide RIR (0, 1, 2, 3, 4, 5+) : sélection visuelle dans le buffer, validation par le bouton Valider
  const handleRirPress = useCallback((key: string) => {
    setLocalValue(key);
  }, []);

  // Gestion des incréments rapides (+/-) au-dessus du pavé
  // Si le champ est vide mais qu'une ghostValue existe, l'incrément prend la ghostValue comme point de départ
  const handleQuickIncrement = useCallback((delta: number) => {
    setLocalValue((prevVal) => {
      const baseStr = prevVal !== '' ? prevVal : (ghostValue || '');
      const currentNum = parseFloat(baseStr) || 0;
      const nextNum = Math.max(0, Math.round((currentNum + delta) * 100) / 100);
      return String(nextNum);
    });
  }, [ghostValue]);

  // Réinitialisation locale de la valeur saisie (sans commit synchrone bloquant)
  const handleClear = useCallback(() => {
    setLocalValue('');
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  // Action Suivant (passer au champ suivant en transmettant la valeur locale)
  const handleNext = useCallback(() => {
    const current = localValueRef.current;
    if (onNextField) {
      onNextField(current);
    }
  }, [onNextField]);

  // Action Précédent (retourner au champ précédent en transmettant la valeur locale)
  const handlePrevious = useCallback(() => {
    const current = localValueRef.current;
    if (onPreviousField) {
      onPreviousField(current);
    }
  }, [onPreviousField]);

  // Action Valider (valider et fermer en transmettant la valeur locale)
  const handleValidate = useCallback(() => {
    const current = localValueRef.current;
    if (onValidate) {
      onValidate(current);
    }
  }, [onValidate]);

  const effectiveIsLastField = isLastField !== undefined ? isLastField : (!onNextField || activeField === 'rir');

  // Action Fermer (ferme le modal en transmettant la valeur locale en cours)
  const handleClose = useCallback(() => {
    const current = localValueRef.current;
    if (onClose) {
      onClose(current);
    }
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
              <Text style={[styles.headerSubTitle, { color: theme.textMuted }]} numberOfLines={1}>
                {title}
                {previousValue ? (
                  <Text style={{ color: theme.accent, fontWeight: '700' }}>
                    {` · Prev: ${previousValue}`}
                  </Text>
                ) : null}
              </Text>
              <View style={styles.valueDisplayRow}>
                <TouchableOpacity
                  activeOpacity={!localValue && ghostValue ? 0.7 : 1}
                  onPress={() => {
                    if (!localValue && ghostValue) {
                      setLocalValue(ghostValue);
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'baseline' }}
                >
                  <Text
                    style={[
                      styles.headerValue,
                      {
                        color: localValue ? theme.text : (ghostValue ? `${theme.textMuted}99` : theme.textMuted),
                        fontStyle: !localValue && ghostValue ? 'italic' : 'normal',
                      },
                    ]}
                  >
                    {localValue || ghostValue || '-'}
                  </Text>
                  {Boolean(!localValue && ghostValue) && (
                    <View style={[styles.ghostPill, { backgroundColor: `${theme.accent}18`, borderColor: theme.accent }]}>
                      <Text style={[styles.ghostPillText, { color: theme.accent }]}>{ghostLabel || 'Précédent'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
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
              {RIR_OPTIONS.map((option) => {
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
              {/* Barre de puces d'incréments rapides (+/-) */}
              <View style={styles.quickChipsBar}>
                {activeField === 'weightKg' ? (
                  <>
                    <Pressable
                      unstable_pressDelay={0}
                      onPress={() => handleQuickIncrement(-2.5)}
                      style={({ pressed }) => [
                        styles.chipBtn,
                        {
                          backgroundColor: pressed ? `${theme.danger}25` : theme.surface,
                          borderColor: pressed ? theme.danger : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.danger }]}>-2.5</Text>
                    </Pressable>
                    <Pressable
                      unstable_pressDelay={0}
                      onPress={() => handleQuickIncrement(1.25)}
                      style={({ pressed }) => [
                        styles.chipBtn,
                        {
                          backgroundColor: pressed ? `${theme.accent}35` : theme.surface,
                          borderColor: pressed ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.accent }]}>+1.25</Text>
                    </Pressable>
                    <Pressable
                      unstable_pressDelay={0}
                      onPress={() => handleQuickIncrement(2.5)}
                      style={({ pressed }) => [
                        styles.chipBtn,
                        {
                          backgroundColor: pressed ? `${theme.accent}35` : theme.surface,
                          borderColor: pressed ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.accent }]}>+2.5</Text>
                    </Pressable>
                    <Pressable
                      unstable_pressDelay={0}
                      onPress={() => handleQuickIncrement(5)}
                      style={({ pressed }) => [
                        styles.chipBtn,
                        {
                          backgroundColor: pressed ? `${theme.accent}35` : theme.surface,
                          borderColor: pressed ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.accent }]}>+5</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      unstable_pressDelay={0}
                      onPress={() => handleQuickIncrement(-1)}
                      style={({ pressed }) => [
                        styles.chipBtn,
                        {
                          backgroundColor: pressed ? `${theme.danger}25` : theme.surface,
                          borderColor: pressed ? theme.danger : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.danger }]}>-1</Text>
                    </Pressable>
                    <Pressable
                      unstable_pressDelay={0}
                      onPress={() => handleQuickIncrement(1)}
                      style={({ pressed }) => [
                        styles.chipBtn,
                        {
                          backgroundColor: pressed ? `${theme.accent}35` : theme.surface,
                          borderColor: pressed ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.accent }]}>+1</Text>
                    </Pressable>
                    <Pressable
                      unstable_pressDelay={0}
                      onPress={() => handleQuickIncrement(5)}
                      style={({ pressed }) => [
                        styles.chipBtn,
                        {
                          backgroundColor: pressed ? `${theme.accent}35` : theme.surface,
                          borderColor: pressed ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.accent }]}>+5</Text>
                    </Pressable>
                  </>
                )}
              </View>

              {KEYPAD_ROWS.map((row, rowIndex) => (
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
              <Pressable
                unstable_pressDelay={0}
                onPress={handlePrevious}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.prevBtn,
                  {
                    backgroundColor: pressed ? `${theme.accent}35` : theme.surface,
                    borderColor: pressed ? theme.accent : theme.border,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
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
              </Pressable>
            )}

            {/* Bouton Gauche 2 : Effacer (neutre par défaut, rouge uniquement à l'enfoncement) */}
            <Pressable
              unstable_pressDelay={0}
              onPress={handleClear}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.clearBtn,
                {
                  backgroundColor: pressed ? `${theme.danger}30` : theme.surface,
                  borderColor: pressed ? theme.danger : theme.border,
                  borderWidth: 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              {({ pressed }) => (
                <>
                  <RotateCcw
                    size={15}
                    color={pressed ? theme.danger : theme.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.clearBtnText,
                      { color: pressed ? theme.danger : theme.text },
                    ]}
                  >
                    Effacer
                  </Text>
                </>
              )}
            </Pressable>

            {/* Bouton Droit : Suivant ➔ ou Valider 🗸 */}
            {effectiveIsLastField ? (
              <Pressable
                unstable_pressDelay={0}
                onPress={handleValidate}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.validateBtn,
                  {
                    backgroundColor: theme.accent,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.actionBtnText}>Valider</Text>
                <Check size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </Pressable>
            ) : (
              <Pressable
                unstable_pressDelay={0}
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.nextBtn,
                  {
                    backgroundColor: theme.accent,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.actionBtnText}>Suivant</Text>
                <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </Pressable>
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
  quickChipsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chipBtn: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  ghostPill: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'center',
  },
  ghostPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
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
