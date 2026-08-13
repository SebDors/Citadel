import React from 'react';
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
  onChangeValue: (val: string) => void;
  onNextField?: () => void;
  onValidate?: () => void;
  onClear?: () => void;
}

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

  // Titre et unité de l'en-tête selon le champ actif
  const getFieldHeaderInfo = () => {
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
  };

  const { title, unit } = getFieldHeaderInfo();

  // Gestion des clics sur les touches numériques
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      if (value.length > 0) {
        onChangeValue(value.slice(0, -1));
      }
      return;
    }

    if (key === '.') {
      // Ignorer si déjà un point decimal
      if (value.includes('.')) return;
      // Si la valeur est vide, ajouter "0."
      if (value === '') {
        onChangeValue('0.');
        return;
      }
      onChangeValue(value + '.');
      return;
    }

    // Pour les chiffres '0'..'9'
    if (value === '0') {
      // Si on tape un chiffre alors que c'était '0', le remplacer sauf si c'est '0'
      onChangeValue(key);
      return;
    }

    // Limiter la longueur max (ex: 6 caractères)
    if (value.length >= 6) return;

    onChangeValue(value + key);
  };

  const handleClear = () => {
    onChangeValue('');
    if (onClear) {
      onClear();
    }
  };

  // Clés du pavé numérique 4x3
  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  const isLastField = activeField === 'rir';

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
          {/* Header du Clavier */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerSubTitle, { color: theme.textMuted }]}>
                {title}
              </Text>
              <View style={styles.valueDisplayRow}>
                <Text style={[styles.headerValue, { color: theme.text }]}>
                  {value || '0'}
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

          {/* Grille Numérique 4x3 */}
          <View style={styles.gridContainer}>
            {keypadRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.6}
                    onPress={() => handleKeyPress(key)}
                    style={[
                      styles.keypadBtn,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {key === 'backspace' ? (
                      <Delete size={22} color={theme.text} />
                    ) : (
                      <Text style={[styles.keypadText, { color: theme.text }]}>
                        {key}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

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
              <RotateCcw size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.clearBtnText, { color: theme.text }]}>
                Effacer
              </Text>
            </TouchableOpacity>

            {/* Bouton Droit : Suivant ➔ ou Valider 🗸 */}
            {isLastField ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onValidate}
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
                onPress={onNextField}
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
