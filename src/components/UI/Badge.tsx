import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'warning' | 'superset';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', style }) => {
  const { theme } = useTheme();

  let bgColor = theme.surface;
  let textColor = theme.text;

  if (variant === 'accent') {
    bgColor = theme.accent;
    textColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    bgColor = theme.secondary;
    textColor = '#FFFFFF';
  } else if (variant === 'warning') {
    bgColor = theme.warning;
    textColor = '#FFFFFF';
  } else if (variant === 'superset') {
    bgColor = theme.supersetTag;
    textColor = '#FFFFFF';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
