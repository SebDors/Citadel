import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  ScrollView,
  Modal,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { BodyMeasurement, MeasurementMetricKey } from '../../types';
import { useWorkout } from '../../context/WorkoutContext';
import { useTheme } from '../../context/ThemeContext';
import { formatWeight } from '../../utils/numberUtils';
import { buildSmoothBezierPath, findNearestChartPointIndex } from '../../utils/svgChartUtils';
import { Card } from '../UI/Card';
import { TrendingUp, SlidersHorizontal, X, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { calculateExponentialMovingAverage } from '../../services/analyticsService';

interface ModularMeasurementChartCardProps {
  measurements: BodyMeasurement[];
}

interface MetricConfig {
  key: MeasurementMetricKey;
  label: string;
  field: keyof BodyMeasurement;
  unit: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  { key: 'weight', label: 'Poids', field: 'weightKg', unit: 'kg' },
  { key: 'bodyFat', label: 'Masse Grasse', field: 'bodyFatPercentage', unit: '%' },
  { key: 'waist', label: 'Taille', field: 'waistCm', unit: 'cm' },
  { key: 'chest', label: 'Poitrine', field: 'chestCm', unit: 'cm' },
  { key: 'thigh', label: 'Cuisse', field: 'thighCm', unit: 'cm' },
  { key: 'biceps', label: 'Bras', field: 'bicepsCm', unit: 'cm' },
];

export const ModularMeasurementChartCard: React.FC<ModularMeasurementChartCardProps> = ({ measurements }) => {
  const { theme } = useTheme();
  const { data, updateUserProfile } = useWorkout();
  const hiddenMetrics = data?.profile?.hiddenMeasurementMetrics ?? [];

  const visibleConfigs = useMemo(() => {
    const filtered = METRIC_CONFIGS.filter((c) => !hiddenMetrics.includes(c.key));
    return filtered.length > 0 ? filtered : [METRIC_CONFIGS[0]];
  }, [hiddenMetrics]);

  const [activeMetricKey, setActiveMetricKey] = useState<MeasurementMetricKey>(visibleConfigs[0].key);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const metricsScrollRef = useRef<ScrollView>(null);
  const [metricsScrollX, setMetricsScrollX] = useState(0);
  const [metricsContainerWidth, setMetricsContainerWidth] = useState(0);
  const [metricsContentWidth, setMetricsContentWidth] = useState(0);

  const canScrollLeft = metricsScrollX > 6;
  const canScrollRight =
    metricsContentWidth > metricsContainerWidth + 6 &&
    metricsScrollX < metricsContentWidth - metricsContainerWidth - 6;

  const handleMetricsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setMetricsScrollX(e.nativeEvent.contentOffset.x);
  };

  const nudgeMetricsScroll = (delta: number) => {
    const maxOffset = Math.max(0, metricsContentWidth - metricsContainerWidth);
    const targetX = Math.max(0, Math.min(maxOffset, metricsScrollX + delta));
    metricsScrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  useEffect(() => {
    setMetricsScrollX(0);
    metricsScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [visibleConfigs.length]);

  useEffect(() => {
    if (!visibleConfigs.some((c) => c.key === activeMetricKey)) {
      setActiveMetricKey(visibleConfigs[0].key);
      setActivePointIndex(null);
    }
  }, [visibleConfigs, activeMetricKey]);

  const toggleMetricVisibility = async (metricKey: MeasurementMetricKey) => {
    const isCurrentlyHidden = hiddenMetrics.includes(metricKey);
    if (!isCurrentlyHidden && visibleConfigs.length <= 1) {
      return; // Conserver au moins une métrique visible
    }
    const nextHidden = isCurrentlyHidden
      ? hiddenMetrics.filter((k) => k !== metricKey)
      : [...hiddenMetrics, metricKey];
    await updateUserProfile({ hiddenMeasurementMetrics: nextHidden });
  };

  const activeConfig =
    visibleConfigs.find((c) => c.key === activeMetricKey) || visibleConfigs[0];

  // Sort measurements chronologically
  const sorted = useMemo(() => {
    return [...(measurements || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [measurements]);

  // Extract points for active metric
  const points = useMemo(() => {
    return sorted
      .filter((m) => m[activeConfig.field] !== undefined && m[activeConfig.field] !== null)
      .map((m) => ({
        date: m.date,
        value: Number(m[activeConfig.field]),
      }));
  }, [sorted, activeConfig.field]);

  // Calcul du lissage par moyenne mobile exponentielle (EMA) pour le poids (MacroFactor)
  const trendPoints = useMemo(() => {
    if (activeMetricKey !== 'weight' || points.length === 0) return [];
    return calculateExponentialMovingAverage(points, 0.15);
  }, [points, activeMetricKey]);

  const latestPoint = points[points.length - 1];
  const previousPoint = points.length > 1 ? points[points.length - 2] : null;
  const delta = latestPoint && previousPoint ? (latestPoint.value - previousPoint.value).toFixed(2) : null;

  const latestTrend = trendPoints[trendPoints.length - 1];

  // Chart dimensions & plotting logic
  const chartHeight = 120;
  const chartWidth = 280;
  const paddingX = 30;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  let pathData = '';
  let trendPathData = '';
  let chartPoints: { x: number; y: number; val: number; date: string; trendVal?: number }[] = [];
  let minVal = 0;
  let maxVal = 0;

  if (points.length > 0) {
    const rawValues = points.map((p) => p.value);
    const trendValues = trendPoints.map((t) => t.trend);
    const allValues = [...rawValues, ...trendValues];

    minVal = Math.min(...allValues);
    maxVal = Math.max(...allValues);

    // Margin if min === max
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal - 5);
      maxVal = maxVal + 5;
    }

    const valRange = maxVal - minVal || 1;

    chartPoints = points.map((p, idx) => {
      const x = points.length === 1 ? chartWidth / 2 : paddingX + (idx / (points.length - 1)) * innerWidth;
      const y = paddingY + innerHeight - ((p.value - minVal) / valRange) * innerHeight;
      const t = trendPoints[idx]?.trend;
      return { x, y, val: p.value, date: p.date, trendVal: t };
    });

    pathData = buildSmoothBezierPath(chartPoints);
    if (trendPoints.length > 1) {
      const trendCoords = trendPoints.map((pt, idx) => ({
        x: paddingX + (idx / (trendPoints.length - 1)) * innerWidth,
        y: paddingY + innerHeight - ((pt.trend - minVal) / valRange) * innerHeight,
      }));
      trendPathData = buildSmoothBezierPath(trendCoords);
    }
  }

  const chartPointsRef = useRef(chartPoints);
  chartPointsRef.current = chartPoints;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const nearest = findNearestChartPointIndex(evt.nativeEvent.locationX, chartPointsRef.current);
          if (nearest !== null) setActivePointIndex(nearest);
        },
        onPanResponderMove: (evt) => {
          const nearest = findNearestChartPointIndex(evt.nativeEvent.locationX, chartPointsRef.current);
          if (nearest !== null) setActivePointIndex(nearest);
        },
      }),
    []
  );

  return (
    <Card style={styles.card}>
      {/* Header avec bouton paramètres de visibilité */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TrendingUp size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Graphique de Mensurations</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowSettingsModal(true)}
          style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityLabel="Personnaliser les mesures affichées"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SlidersHorizontal size={14} color={theme.textMuted} />
          <Text style={[styles.settingsBtnText, { color: theme.textMuted }]}>Gérer</Text>
        </TouchableOpacity>
      </View>

      {/* Pilules horizontales aérées avec indicateurs directionnels de défilement */}
      <View style={[styles.buttonsWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ScrollView
          ref={metricsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleMetricsScroll}
          onLayout={(e) => setMetricsContainerWidth(e.nativeEvent.layout.width)}
          onContentSizeChange={(w) => setMetricsContentWidth(w)}
          contentContainerStyle={[
            styles.buttonsScrollContent,
            canScrollRight && { paddingRight: 28 },
            canScrollLeft && { paddingLeft: 28 },
          ]}
        >
          {visibleConfigs.map((config) => {
            const isActive = config.key === activeConfig.key;
            return (
              <TouchableOpacity
                key={config.key}
                activeOpacity={0.8}
                style={[
                  styles.metricBtn,
                  isActive && { backgroundColor: theme.accent },
                ]}
                onPress={() => {
                  setActiveMetricKey(config.key);
                  setActivePointIndex(null);
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.metricBtnText,
                    { color: isActive ? '#FFFFFF' : theme.textMuted },
                    isActive && { fontWeight: '800' },
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {canScrollLeft && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => nudgeMetricsScroll(-120)}
            accessibilityLabel="Défiler les mesures vers la gauche"
            style={[
              styles.scrollHintArrow,
              styles.scrollHintLeft,
              { backgroundColor: theme.surface, borderRightColor: theme.border },
            ]}
          >
            <ChevronLeft size={16} color={theme.accent} />
          </TouchableOpacity>
        )}

        {canScrollRight && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => nudgeMetricsScroll(120)}
            accessibilityLabel="Défiler les mesures vers la droite"
            style={[
              styles.scrollHintArrow,
              styles.scrollHintRight,
              { backgroundColor: theme.surface, borderLeftColor: theme.border },
            ]}
          >
            <ChevronRight size={16} color={theme.accent} />
          </TouchableOpacity>
        )}
      </View>

      {/* Current Metric Value Callout */}
      {latestPoint ? (
        <View style={styles.valueCalloutBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={[styles.calloutLabel, { color: theme.textMuted }]}>
                {activeConfig.label.toUpperCase()} ENREGISTRÉ
              </Text>
              <View style={styles.calloutValueRow}>
                <Text style={[styles.calloutValue, { color: theme.text }]}>
                  {formatWeight(latestPoint.value)} {activeConfig.unit}
                </Text>
                {delta !== null && (
                  <Text
                    style={[
                      styles.deltaText,
                      { color: Number(delta) >= 0 ? theme.primary : theme.danger },
                    ]}
                  >
                    {Number(delta) >= 0 ? `+${delta}` : delta} {activeConfig.unit}
                  </Text>
                )}
              </View>
            </View>

            {/* Affichage de la tendance lissée (MacroFactor) si poids */}
            {activeMetricKey === 'weight' && latestTrend && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.calloutLabel, { color: theme.textMuted }]}>
                  TENDANCE LISSÉE
                </Text>
                <Text style={[styles.trendValue, { color: theme.primary }]}>
                  {formatWeight(latestTrend.trend)} kg
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noDataBox}>
          <Text style={[styles.noDataText, { color: theme.textMuted }]}>
            Aucune mesure enregistrée pour {activeConfig.label.toLowerCase()}
          </Text>
        </View>
      )}

      {/* Légende si métrique = poids */}
      {activeMetricKey === 'weight' && trendPoints.length > 1 && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Poids brut</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: theme.primary }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Tendance lissée (EMA)</Text>
          </View>
        </View>
      )}

      {/* SVG Chart Canvas avec Points Cliquables et Tooltip */}
      {points.length > 0 && (
        <View style={styles.chartContainer}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {/* Grid horizontal lines */}
            <Line x1="10" y1={paddingY} x2={chartWidth - 10} y2={paddingY} stroke={theme.border} strokeDasharray="3 3" opacity={0.5} />
            <Line x1="10" y1={chartHeight / 2} x2={chartWidth - 10} y2={chartHeight / 2} stroke={theme.border} strokeDasharray="3 3" opacity={0.5} />
            <Line x1="10" y1={chartHeight - paddingY} x2={chartWidth - 10} y2={chartHeight - paddingY} stroke={theme.border} strokeDasharray="3 3" opacity={0.5} />

            {/* Min and Max labels on Y axis */}
            <SvgText x="10" y={paddingY + 4} fill={theme.textMuted} fontSize="9" fontWeight="600">
              {maxVal} {activeConfig.unit}
            </SvgText>
            <SvgText x="10" y={chartHeight - paddingY - 2} fill={theme.textMuted} fontSize="9" fontWeight="600">
              {minVal} {activeConfig.unit}
            </SvgText>

            {/* Main Polyline Path (Mesure brute) */}
            {pathData !== '' && (
              <Path
                d={pathData}
                stroke={theme.accent}
                strokeWidth={activeMetricKey === 'weight' ? '1.5' : '3'}
                strokeOpacity={activeMetricKey === 'weight' ? 0.45 : 1}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Tendance lissée (MacroFactor EMA) */}
            {trendPathData !== '' && (
              <Path
                d={trendPathData}
                stroke={theme.primary}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Plot Circles */}
            {chartPoints.map((pt, idx) => {
              const isSelected = activePointIndex === idx;
              return (
                <React.Fragment key={idx}>
                  {isSelected && (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill={theme.primary + '33'}
                    />
                  )}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? "6" : "4"}
                    fill={isSelected ? theme.primary : theme.accent}
                    stroke={theme.cardBg}
                    strokeWidth={isSelected ? "3" : "2"}
                  />
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Détecteur de geste continu PanResponder pour scrubbing tactile (AM-06) */}
          <View
            style={StyleSheet.absoluteFillObject}
            {...panResponder.panHandlers}
          />

          {/* Tooltip de Détail au Clic sur un Point */}
          {activePointIndex !== null && chartPoints[activePointIndex] && (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  backgroundColor: theme.text,
                  left: `${Math.min(Math.max((chartPoints[activePointIndex].x / chartWidth) * 100, 18), 82)}%`,
                  top: Math.max(chartPoints[activePointIndex].y - 45, -5),
                  transform: [{ translateX: -40 }],
                },
              ]}
            >
              <Text style={[styles.tooltipVal, { color: theme.background }]}>
                {formatWeight(chartPoints[activePointIndex].val)} {activeConfig.unit}
              </Text>
              {chartPoints[activePointIndex].trendVal !== undefined && (
                <Text style={[styles.tooltipSub, { color: theme.background }]}>
                  Tendance : {formatWeight(chartPoints[activePointIndex].trendVal!)} kg
                </Text>
              )}
              <Text style={[styles.tooltipDate, { color: theme.background }]}>
                {new Date(chartPoints[activePointIndex].date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modale de sélection des mesures affichées */}
      <Modal
        visible={showSettingsModal}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity
          style={styles.settingsOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.settingsSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          >
            <View style={styles.settingsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingsTitle, { color: theme.text }]}>
                  Mesures affichées
                </Text>
                <Text style={[styles.settingsSubtitle, { color: theme.textMuted }]}>
                  Masquez les mesures que vous ne suivez pas (graphique & saisie).
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {METRIC_CONFIGS.map((cfg) => {
              const isEnabled = !hiddenMetrics.includes(cfg.key);
              const isOnlyVisible = isEnabled && visibleConfigs.length <= 1;
              return (
                <TouchableOpacity
                  key={cfg.key}
                  activeOpacity={0.75}
                  disabled={isOnlyVisible}
                  onPress={() => toggleMetricVisibility(cfg.key)}
                  style={[
                    styles.settingOptionRow,
                    { borderBottomColor: theme.border, opacity: isOnlyVisible ? 0.6 : 1 },
                  ]}
                >
                  <View>
                    <Text style={[styles.settingOptionLabel, { color: theme.text }]}>
                      {cfg.label}
                    </Text>
                    <Text style={[styles.settingOptionUnit, { color: theme.textMuted }]}>
                      Unité : {cfg.unit}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.settingToggleBox,
                      {
                        backgroundColor: isEnabled ? theme.accent : theme.surface,
                        borderColor: isEnabled ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    {isEnabled && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },
  settingsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  buttonsWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollHintArrow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollHintLeft: {
    left: 0,
    borderRightWidth: 1,
  },
  scrollHintRight: {
    right: 0,
    borderLeftWidth: 1,
  },
  metricBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  metricBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 42 : 34,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  settingsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingOptionUnit: {
    fontSize: 11,
    marginTop: 1,
  },
  settingToggleBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueCalloutBox: {
    marginBottom: 8,
  },
  calloutLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calloutValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  calloutValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  trendValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noDataBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 30,
  },
  tooltipVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  tooltipSub: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.9,
    marginTop: 1,
  },
  tooltipDate: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
    opacity: 0.75,
  },
});
