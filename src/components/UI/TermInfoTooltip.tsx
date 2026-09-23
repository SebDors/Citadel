import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface TermDefinition {
  title: string;
  explanation: string;
}

export const WORKOUT_TERMS: Record<string, TermDefinition> = {
  AMRAP: {
    title: 'AMRAP (As Many Reps/Rounds As Possible)',
    explanation: 'Effectuez un maximum de répétitions ou de tours dans le temps imparti, en maintenant une forme d\'exécution stricte.',
  },
  SUPERSET: {
    title: 'Superset',
    explanation: 'Enchaînement direct de 2 exercices sans temps de repos entre eux, généralement sur des groupes musculaires antagonistes ou complémentaires.',
  },
  CIRCUIT: {
    title: 'Circuit Training',
    explanation: 'Enchaînement continu de plusieurs exercices différents avec peu ou pas de repos entre chaque poste, répété sur un nombre défini de tours.',
  },
  DROP_SET: {
    title: 'Drop Set (Série dégressive)',
    explanation: 'Poussez la série jusqu\'à l\'échec technique, réduisez immédiatement la charge d\'environ 20 à 30 % sans repos et poursuivez l\'effort.',
  },
  RIR: {
    title: 'RIR (Reps In Reserve)',
    explanation: 'Nombre de répétitions supplémentaires que vous auriez pu réussir avant l\'échec postural complet (ex: RIR 2 = capable d\'en faire 2 de plus).',
  },
  ECHEC: {
    title: 'Échec musculaire (Failure)',
    explanation: 'Point où le muscle ne peut plus compléter la phase concentrique d\'une répétition avec une trajectoire et une technique correctes.',
  },
};

interface TermInfoTooltipProps {
  termKey?: keyof typeof WORKOUT_TERMS;
  customTitle?: string;
  customExplanation?: string;
  size?: number;
  iconColor?: string;
}

export const TermInfoTooltip: React.FC<TermInfoTooltipProps> = ({
  termKey,
  customTitle,
  customExplanation,
  size = 14,
  iconColor,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const iconRef = useRef<View>(null);

  const term = termKey ? WORKOUT_TERMS[termKey] : undefined;
  const title = customTitle || term?.title || 'Information';
  const explanation = customExplanation || term?.explanation || '';

  const handleOpen = () => {
    if (iconRef.current) {
      iconRef.current.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get('window').width;
        const bubbleWidth = 260;
        const bubbleHeight = 110;

        // Position horizontale centrée sur l'icône, limitée aux bordures de l'écran
        let left = x + width / 2 - bubbleWidth / 2;
        if (left < 16) left = 16;
        if (left + bubbleWidth > screenWidth - 16) left = screenWidth - bubbleWidth - 16;

        // Position verticale au-dessus de l'icône, ou en dessous si pas assez de place
        let top = y - bubbleHeight - 8;
        if (top < (StatusBar.currentHeight || 24) + 16) {
          top = y + height + 8;
        }

        setTooltipPos({ top, left });
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  };

  return (
    <View collapsable={false} ref={iconRef} style={styles.container}>
      <TouchableOpacity
        onPress={handleOpen}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Informations sur ${title}`}
      >
        <Info size={size} color={iconColor || theme.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.tooltipBubble,
                  {
                    top: tooltipPos.top,
                    left: tooltipPos.left,
                    backgroundColor: theme.text,
                  },
                ]}
              >
                <Text style={[styles.tooltipTitle, { color: theme.background }]}>
                  {title}
                </Text>
                <Text style={[styles.tooltipText, { color: theme.background }]}>
                  {explanation}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tooltipBubble: {
    position: 'absolute',
    width: 260,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 999,
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    opacity: 0.9,
  },
});
