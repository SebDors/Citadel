import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { BodyMeasurement } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { formatWeight } from '../../utils/numberUtils';
import { Card } from '../UI/Card';
import { Activity, TrendingUp } from 'lucide-react-native';

interface ModularMeasurementChartCardProps {
  measurements: BodyMeasurement[];
}

type MetricKey = 'weight' | 'chest' | 'thigh' | 'biceps';

interface MetricConfig {
  key: MetricKey;
  label: string;
  field: keyof BodyMeasurement;
  unit: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  { key: 'weight', label: 'Poids', field: 'weightKg', unit: 'kg' },
  { key: 'chest', label: 'Poitrine', field: 'chestCm', unit: 'cm' },
  { key: 'thigh', label: 'Cuisse', field: 'thighCm', unit: 'cm' },
  { key: 'biceps', label: 'Bras', field: 'bicepsCm', unit: 'cm' },
];

export const ModularMeasurementChartCard: React.FC<ModularMeasurementChartCardProps> = ({ measurements }) => {
  const { theme } = useTheme();
  const [activeMetricKey, setActiveMetricKey] = useState<MetricKey>('weight');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const activeConfig = METRIC_CONFIGS.find((c) => c.key === activeMetricKey) || METRIC_CONFIGS[0];

  // Sort measurements chronologically
  const sorted = [...(measurements || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Extract points for active metric
  const points = sorted
    .filter((m) => m[activeConfig.field] !== undefined && m[activeConfig.field] !== null)
    .map((m) => ({
      date: m.date,
      value: Number(m[activeConfig.field]),
    }));

  const latestPoint = points[points.length - 1];
  const previousPoint = points.length > 1 ? points[points.length - 2] : null;
  const delta = latestPoint && previousPoint ? (latestPoint.value - previousPoint.value).toFixed(2) : null;

  // Chart dimensions & plotting logic
  const chartHeight = 120;
  const chartWidth = 280;
  const paddingX = 30;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  let pathData = '';
  let chartPoints: { x: number; y: number; val: number; date: string }[] = [];
  let minVal = 0;
  let maxVal = 0;

  if (points.length > 0) {
    const rawValues = points.map((p) => p.value);
    minVal = Math.min(...rawValues);
    maxVal = Math.max(...rawValues);

    // Give a margin if min === max
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal - 5);
      maxVal = maxVal + 5;
    }

    const valRange = maxVal - minVal || 1;

    chartPoints = points.map((p, idx) => {
      const x = points.length === 1 ? chartWidth / 2 : paddingX + (idx / (points.length - 1)) * innerWidth;
      const y = paddingY + innerHeight - ((p.value - minVal) / valRange) * innerHeight;
      return { x, y, val: p.value, date: p.date };
    });

    if (chartPoints.length === 1) {
      pathData = `M ${chartPoints[0].x - 20} ${chartPoints[0].y} L ${chartPoints[0].x + 20} ${chartPoints[0].y}`;
    } else {
      pathData = chartPoints.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, '');
    }
  }

  return (
    <Card style={styles.card}>
      {/* Header with Title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TrendingUp size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Graphique de Mensurations</Text>
        </View>
      </View>

      {/* Metric Selector Buttons [Poids], [Poitrine], [Cuisse], [Bras] */}
      <View style={[styles.buttonsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {METRIC_CONFIGS.map((config) => {
          const isActive = config.key === activeMetricKey;
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
                style={[
                  styles.metricBtnText,
                  { color: isActive ? '#FFFFFF' : theme.text },
                  isActive && { fontWeight: '900' },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Current Metric Value Callout */}
      {latestPoint ? (
        <View style={styles.valueCalloutBox}>
          <Text style={[styles.calloutLabel, { color: theme.textMuted }]}>
            ÉVOLUTION · {activeConfig.label.toUpperCase()}
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
      ) : (
        <View style={styles.noDataBox}>
          <Text style={[styles.noDataText, { color: theme.textMuted }]}>
            Aucune mesure enregistrée pour {activeConfig.label.toLowerCase()}
          </Text>
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

            {/* Main Polyline Path */}
            {pathData !== '' && (
              <Path d={pathData} stroke={theme.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
                    r={isSelected ? "6" : "4.5"}
                    fill={isSelected ? theme.primary : theme.accent}
                    stroke={theme.cardBg}
                    strokeWidth={isSelected ? "3" : "2"}
                  />
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Overlay React Native d'interactivité 100% Cliquable */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {chartPoints.map((pt, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                style={{
                  position: 'absolute',
                  left: `${(pt.x / chartWidth) * 100}%`,
                  top: pt.y - 20,
                  transform: [{ translateX: -20 }],
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  zIndex: 20,
                }}
                onPress={() => setActivePointIndex(idx)}
              />
            ))}
          </View>

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
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6,
  },
  buttonsRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  metricBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  metricBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 24,
    fontWeight: '900',
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
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
  tooltipDate: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});
