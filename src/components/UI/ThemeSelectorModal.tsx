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
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  Thèmes & Couleurs
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  Personnalisez l'ambiance visuelle
                </Text>
              </View>
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
                Sombre (OLED)
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
                Clair (Clean)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Liste des Palettes de Thèmes */}
          <ScrollView
            style={styles.themeList}
            contentContainerStyle={styles.themeListContent}
            showsVerticalScrollIndicator={false}
          >
            {allThemes.map((t: ThemeDefinition) => {
              const isSelected = themeId === t.id;
              const previewDots = t.previewColors[mode];

              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.7}
                  onPress={() => setThemeId(t.id)}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.themeCardTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.themeTitleRow}>
                        <Text style={[styles.themeName, { color: theme.text }]}>
                          {t.name}
                        </Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.selectedBadge,
                              { backgroundColor: theme.accent },
                            ]}
                          >
                            <Check size={12} color={activeTextOnAccent} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.themeSubtitle, { color: theme.textMuted }]}
                      >
                        {t.subtitle}
                      </Text>
                    </View>

                    {/* Pastilles d'Aperçu des Couleurs */}
                    <View style={styles.dotsRow}>
                      {previewDots.map((color, idx) => (
                        <View
                          key={`${t.id}-dot-${idx}`}
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: color,
                              borderColor: theme.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
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
    maxHeight: '85%',
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
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
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
    maxHeight: 380,
  },
  themeListContent: {
    gap: 8,
    paddingBottom: 4,
  },
  themeCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  themeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '800',
  },
  themeSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  selectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  footer: {
    marginTop: 12,
  },
});
