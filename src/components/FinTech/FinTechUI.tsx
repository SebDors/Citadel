import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { FINTECH_COLORS, FINTECH_RADIUS, FINTECH_SPACING } from '../../constants/fintechTheme';
import { TrendingUp, Plus } from 'lucide-react-native';

interface FinTechBalanceProps {
  label?: string;
  value: string | number;
  unit?: string;
  trendText?: string;
  isPositive?: boolean;
}

export const FinTechBalance: React.FC<FinTechBalanceProps> = ({
  label = 'VOLUME DE LA SEMAINE',
  value,
  unit = 'KG',
  trendText = '+12% cette semaine',
  isPositive = true,
}) => {
  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceLabel}>{label}</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceValue}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </Text>
        <Text style={styles.balanceUnit}> {unit}</Text>
      </View>

      {trendText ? (
        <View style={styles.trendCapsule}>
          <TrendingUp size={13} color={FINTECH_COLORS.green} style={{ marginRight: 4 }} />
          <Text style={styles.trendText}>▲ {trendText}</Text>
        </View>
      ) : null}
    </View>
  );
};

interface FinTechPillProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const FinTechPill: React.FC<FinTechPillProps> = ({
  label,
  active = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.pill,
        active ? styles.pillActive : styles.pillInactive,
        style,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          active ? styles.pillTextActive : styles.pillTextInactive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface FinTechAssetRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  metric: string;
  submetric?: string;
  onPress?: () => void;
  rightAction?: React.ReactNode;
}

export const FinTechAssetRow: React.FC<FinTechAssetRowProps> = ({
  icon,
  title,
  subtitle,
  metric,
  submetric,
  onPress,
  rightAction,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={styles.assetRow}
    >
      {icon ? <View style={styles.assetIconCircle}>{icon}</View> : null}

      <View style={styles.assetCenter}>
        <Text style={styles.assetTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.assetSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.assetRight}>
        <Text style={styles.assetMetric}>{metric}</Text>
        {submetric ? <Text style={styles.assetSubmetric}>{submetric}</Text> : null}
        {rightAction}
      </View>
    </TouchableOpacity>
  );
};

interface FinTechFloatingBarProps {
  primaryTitle: string;
  onPrimaryPress: () => void;
  secondaryTitle?: string;
  onSecondaryPress?: () => void;
  secondaryIcon?: React.ReactNode;
}

export const FinTechFloatingBar: React.FC<FinTechFloatingBarProps> = ({
  primaryTitle,
  onPrimaryPress,
  secondaryTitle,
  onSecondaryPress,
  secondaryIcon,
}) => {
  return (
    <View style={styles.floatingBarWrapper}>
      <View style={styles.floatingBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPrimaryPress}
          style={styles.floatingPrimaryBtn}
        >
          <Plus size={18} color={FINTECH_COLORS.black} style={{ marginRight: 6 }} />
          <Text style={styles.floatingPrimaryText}>{primaryTitle}</Text>
        </TouchableOpacity>

        {secondaryTitle && onSecondaryPress ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSecondaryPress}
            style={styles.floatingSecondaryBtn}
          >
            {secondaryIcon || null}
            <Text style={styles.floatingSecondaryText}>{secondaryTitle}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceContainer: {
    paddingVertical: 12,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: FINTECH_COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceValue: {
    fontSize: 44,
    fontWeight: '800',
    color: FINTECH_COLORS.text,
    letterSpacing: -1,
  },
  balanceUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: FINTECH_COLORS.textMuted,
    marginLeft: 4,
  },
  trendCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: FINTECH_COLORS.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: FINTECH_RADIUS.pill,
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: FINTECH_COLORS.green,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: FINTECH_RADIUS.pill,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: FINTECH_COLORS.pillActiveBg,
  },
  pillInactive: {
    backgroundColor: FINTECH_COLORS.pillBg,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: FINTECH_COLORS.pillActiveText,
  },
  pillTextInactive: {
    color: FINTECH_COLORS.textMuted,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: FINTECH_COLORS.border,
  },
  assetIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: FINTECH_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  assetCenter: {
    flex: 1,
  },
  assetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: FINTECH_COLORS.text,
    marginBottom: 3,
  },
  assetSubtitle: {
    fontSize: 13,
    color: FINTECH_COLORS.textMuted,
  },
  assetRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  assetMetric: {
    fontSize: 15,
    fontWeight: '700',
    color: FINTECH_COLORS.text,
  },
  assetSubmetric: {
    fontSize: 12,
    color: FINTECH_COLORS.textMuted,
    marginTop: 2,
  },
  floatingBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: FINTECH_COLORS.surface,
    padding: 6,
    borderRadius: FINTECH_RADIUS.pill,
    borderWidth: 1,
    borderColor: '#26262A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  floatingPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FINTECH_COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: FINTECH_RADIUS.pill,
  },
  floatingPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: FINTECH_COLORS.black,
  },
  floatingSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FINTECH_COLORS.surfaceSubtle,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: FINTECH_RADIUS.pill,
  },
  floatingSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: FINTECH_COLORS.text,
  },
});
