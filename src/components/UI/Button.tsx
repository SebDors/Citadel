import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getContrastTextColor } from '../../utils/colorUtils';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  icon,
  disabled = false,
}) => {
  const { theme } = useTheme();

  let bgColor = theme.accent;
  let textColor = getContrastTextColor(theme.accent);

  if (variant === 'secondary') {
    bgColor = theme.secondary;
    textColor = getContrastTextColor(theme.secondary);
  } else if (variant === 'danger') {
    bgColor = theme.danger;
    textColor = '#FFFFFF';
  } else if (variant === 'outline') {
    bgColor = 'transparent';
    textColor = theme.text;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? theme.background : bgColor,
          borderColor: theme.border,
          borderWidth: disabled || variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          { color: disabled ? theme.textMuted : textColor, marginLeft: icon ? 8 : 0 },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginVertical: 4,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
