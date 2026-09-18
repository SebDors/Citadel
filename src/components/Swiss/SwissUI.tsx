import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  SWISS_COLORS,
  SWISS_TYPOGRAPHY,
  SWISS_GRID,
} from '../../constants/swissTheme';
import { useTheme } from '../../context/ThemeContext';

/**
 * Séparateur de grille ultra-fin (0.5px à 1px)
 */
export const SwissDivider: React.FC<{
  vertical?: boolean;
  style?: ViewStyle;
  subtle?: boolean;
}> = ({ vertical = false, style, subtle = false }) => {
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  return (
    <View
      style={[
        vertical
          ? {
              width: subtle ? SWISS_GRID.hairline : SWISS_GRID.divider,
              backgroundColor: subtle ? palette.hairline : palette.border,
            }
          : {
              height: subtle ? SWISS_GRID.hairline : SWISS_GRID.divider,
              backgroundColor: subtle ? palette.hairline : palette.border,
              width: '100%',
            },
        style,
      ]}
    />
  );
};

/**
 * En-tête typographique éditorial monumental
 */
export const SwissHeader: React.FC<{
  index?: string; // ex: "01"
  category?: string; // ex: "STATUS // READY"
  title: string; // Titre monumental
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}> = ({ index, category, title, subtitle, action, style }) => {
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  return (
    <View style={[styles.headerContainer, style]}>
      {(index || category) && (
        <View style={styles.categoryRow}>
          {index ? (
            <Text style={[styles.indexNumber, { color: palette.accent }]}>
              {index}
            </Text>
          ) : null}
          {category ? (
            <Text style={[styles.categoryText, { color: palette.textMuted }]}>
              {category.toUpperCase()}
            </Text>
          ) : null}
          {action ? <View style={styles.headerAction}>{action}</View> : null}
        </View>
      )}
      <Text
        style={[
          styles.monumentalTitle,
          { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitleText, { color: palette.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

/**
 * Sommaire de liste éditoriale numérotée (ex: Programmes, Séances)
 */
export const SwissIndexRow: React.FC<{
  index: string; // "01", "02"
  title: string;
  metadata?: string;
  metaRight?: string;
  onPress?: () => void;
  active?: boolean;
  style?: ViewStyle;
}> = ({ index, title, metadata, metaRight, onPress, active = false, style }) => {
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  const content = (
    <View style={[styles.rowContainer, style]}>
      <SwissDivider subtle />
      <View style={styles.rowContent}>
        <Text style={[styles.rowIndex, { color: palette.accent }]}>
          {index}
        </Text>
        <View style={styles.rowCenter}>
          <Text
            style={[
              styles.rowTitle,
              { color: active ? palette.accent : palette.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {metadata ? (
            <Text style={[styles.rowMeta, { color: palette.textMuted }]}>
              {metadata}
            </Text>
          ) : null}
        </View>
        {metaRight ? (
          <Text style={[styles.rowMetaRight, { color: palette.textMuted }]}>
            {metaRight.toUpperCase()}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.65} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

/**
 * Bouton ou lien typographique pur (sans carte fermée)
 */
export const SwissActionLink: React.FC<{
  label: string;
  onPress: () => void;
  variant?: 'crimson' | 'neutral' | 'underlined';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}> = ({ label, onPress, variant = 'neutral', style, textStyle, icon }) => {
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  const color =
    variant === 'crimson'
      ? palette.accent
      : palette.text;

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={[
        styles.actionLinkContainer,
        variant === 'underlined' && {
          borderBottomWidth: 1.5,
          borderBottomColor: palette.accent,
          paddingBottom: 2,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      <Text
        style={[
          styles.actionLinkLabel,
          { color, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: SWISS_GRID.gapLarge,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  indexNumber: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: '900',
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingLabel,
  },
  categoryText: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: '700',
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingLabel,
  },
  headerAction: {
    marginLeft: 'auto',
  },
  monumentalTitle: {
    fontSize: SWISS_TYPOGRAPHY.h1,
    fontWeight: '900',
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingTitle,
    lineHeight: 42,
  },
  subtitleText: {
    fontSize: SWISS_TYPOGRAPHY.body,
    fontWeight: '400',
    marginTop: 6,
    lineHeight: 22,
  },
  rowContainer: {
    width: '100%',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowIndex: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    width: 26,
  },
  rowCenter: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  rowMetaRight: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionLinkLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
