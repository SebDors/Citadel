import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeDefinition } from '../../constants/colors';
import { Palette, X, Moon, Sun, Check } from 'lucide-react-native';
import { Button } from './Button';
import { getContrastTextColor } from '../../utils/colorUtils';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, mode, themeId, allThemes, setThemeId, setMode } = useTheme();

  const activeTextOnAccent = getContrastTextColor(theme.accent);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
            styles.modalContainer,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${theme.accent}20` },
                ]}
              >
                <Palette size={20} color={theme.accent} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>
                Thèmes
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Fermer le menu des thèmes"
            >
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Sélecteur de Mode (Sombre / Clair) */}
          <View
            style={[
              styles.modeSegmentContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeBtn,
                mode === 'dark' && {
                  backgroundColor: theme.accent,
                },
              ]}
              onPress={() => setMode('dark')}
            >
              <Moon
                size={16}
                color={mode === 'dark' ? activeTextOnAccent : theme.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'dark' ? activeTextOnAccent : theme.textMuted },
                ]}
              >
                Sombre
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeBtn,
                mode === 'light' && {
                  backgroundColor: theme.accent,
                },
              ]}
              onPress={() => setMode('light')}
            >
              <Sun
                size={16}
                color={mode === 'light' ? activeTextOnAccent : theme.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'light' ? activeTextOnAccent : theme.textMuted },
                ]}
              >
                Clair
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grille 2 colonnes des Nuanciers de Thèmes */}
          <ScrollView
            style={styles.themeList}
            contentContainerStyle={styles.themeGrid}
            showsVerticalScrollIndicator={false}
          >
            {allThemes.map((t: ThemeDefinition) => {
              const isSelected = themeId === t.id;
              const previewDots = t.previewColors[mode];

              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.75}
                  onPress={() => setThemeId(t.id)}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: isSelected ? `${theme.accent}14` : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  {/* Nuancier Swatch Preview */}
                  <View
                    style={[
                      styles.swatchContainer,
                      {
                        borderColor: isSelected ? `${theme.accent}40` : 'rgba(128, 128, 128, 0.25)',
                      },
                    ]}
                  >
                    <View style={[styles.swatchSegment, { backgroundColor: previewDots[0], flex: 3 }]} />
                    <View style={[styles.swatchSegment, { backgroundColor: previewDots[1], flex: 2 }]} />
                    <View style={[styles.swatchSegment, { backgroundColor: previewDots[2], flex: 2 }]} />
                    <View style={[styles.swatchSegment, { backgroundColor: previewDots[3], flex: 1.2 }]} />
                  </View>

                  {/* Ligne Titre & Badge de sélection */}
                  <View style={styles.cardFooter}>
                    <Text
                      style={[
                        styles.themeName,
                        { color: isSelected ? theme.accent : theme.text },
                        isSelected && { fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {t.name}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.selectedBadge,
                          { backgroundColor: theme.accent },
                        ]}
                      >
                        <Check size={10} color={activeTextOnAccent} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bouton de Validation */}
          <View style={styles.footer}>
            <Button
              title="Valider"
              variant="primary"
              onPress={onClose}
              style={{ width: '100%' }}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '94%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  modeSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeList: {
    maxHeight: 400,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    paddingBottom: 4,
  },
  themeCard: {
    width: '48.5%',
    borderRadius: 12,
    padding: 8,
  },
  swatchContainer: {
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
    borderWidth: 1,
  },
  swatchSegment: {
    height: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    minHeight: 20,
  },
  themeName: {
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  selectedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 14,
  },
});
