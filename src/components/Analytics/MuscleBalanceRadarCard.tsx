import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Compass } from 'lucide-react-native';
import { Card } from '../UI/Card';
import { useTheme } from '../../context/ThemeContext';
import { MuscleVolumeBreakdown } from '../../services/analyticsService';

interface MuscleBalanceRadarCardProps {
  volumeData: MuscleVolumeBreakdown[];
}

interface AxisSpec {
  label: string;
  muscles: string[];
}

const RADAR_AXES: AxisSpec[] = [
  { label: 'Pecs', muscles: ['Pectoraux'] },
  { label: 'Dos', muscles: ['Grand Dorsal', 'Trapèzes', 'Rhomboïdes', 'Grand Rond', 'Lombaires'] },
  { label: 'Épaules', muscles: ['Deltoïde Antérieur', 'Deltoïde Latéral', 'Deltoïde Postérieur'] },
  { label: 'Bras', muscles: ['Biceps', 'Triceps', 'Avant-bras'] },
  { label: 'Jambes', muscles: ['Quadriceps', 'Ischio-Jambiers', 'Fessiers', 'Grand Fessier', 'Adducteurs', 'Mollets'] },
  { label: 'Abdos', muscles: ['Abdominaux', 'Obliques'] },
];

export const MuscleBalanceRadarCard: React.FC<MuscleBalanceRadarCardProps> = ({ volumeData }) => {
  const { theme } = useTheme();

  const { axisValues, maxVal, pushPullRatio, quadHamRatio } = useMemo(() => {
    const setsByMuscle = new Map<string, number>();
    (volumeData || []).forEach((v) => {
      setsByMuscle.set(v.muscle, v.effectiveSets);
    });

    const values = RADAR_AXES.map((axis) => {
      const sum = axis.muscles.reduce((acc, m) => acc + (setsByMuscle.get(m) || 0), 0);
      return Math.round(sum * 10) / 10;
    });

    const max = Math.max(10, ...values);

    const pushSets = (setsByMuscle.get('Pectoraux') || 0) + (setsByMuscle.get('Deltoïde Antérieur') || 0) + (setsByMuscle.get('Triceps') || 0);
    const pullSets = (setsByMuscle.get('Grand Dorsal') || 0) + (setsByMuscle.get('Trapèzes') || 0) + (setsByMuscle.get('Rhomboïdes') || 0) + (setsByMuscle.get('Deltoïde Postérieur') || 0) + (setsByMuscle.get('Biceps') || 0);
    const pRatio = pullSets > 0 ? Math.round((pushSets / pullSets) * 100) / 100 : null;

    const quadSets = setsByMuscle.get('Quadriceps') || 0;
    const hamSets = (setsByMuscle.get('Ischio-Jambiers') || 0) + (setsByMuscle.get('Fessiers') || 0);
    const qRatio = hamSets > 0 ? Math.round((quadSets / hamSets) * 100) / 100 : null;

    return {
      axisValues: values,
      maxVal: max,
      pushPullRatio: pRatio,
      quadHamRatio: qRatio,
    };
  }, [volumeData]);

  const size = 230;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  const levels = [0.33, 0.66, 1.0];

  const getPoint = (axisIdx: number, ratio: number) => {
    const angle = (Math.PI * 2 * axisIdx) / RADAR_AXES.length - Math.PI / 2;
    return {
      x: cx + radius * ratio * Math.cos(angle),
      y: cy + radius * ratio * Math.sin(angle),
    };
  };

  const dataPolygonPoints = axisValues
    .map((val, idx) => {
      const r = Math.min(1, val / maxVal);
      const pt = getPoint(idx, Math.max(0.08, r));
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <Card>
      <View style={styles.header}>
        <Compass size={18} color={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>Équilibre Musculaire (Radar)</Text>
      </View>

      <View style={styles.radarContainer}>
        <Svg width={size} height={size}>
          {/* Grilles concentriques */}
          {levels.map((lvl, lIdx) => {
            const pts = RADAR_AXES.map((_, idx) => {
              const p = getPoint(idx, lvl);
              return `${p.x},${p.y}`;
            }).join(' ');
            return (
              <Polygon
                key={lIdx}
                points={pts}
                fill="none"
                stroke={theme.border}
                strokeWidth={1}
                strokeDasharray={lIdx < 2 ? '3,3' : undefined}
              />
            );
          })}

          {/* Axes radiaux + labels */}
          {RADAR_AXES.map((axis, idx) => {
            const outer = getPoint(idx, 1.0);
            const labelPos = getPoint(idx, 1.24);
            return (
              <React.Fragment key={axis.label}>
                <Line
                  x1={cx}
                  y1={cy}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={theme.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y + 4}
                  fontSize="11"
                  fontWeight="700"
                  fill={theme.textMuted}
                  textAnchor="middle"
                >
                  {axis.label} ({axisValues[idx]})
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Polygone des séries effectives */}
          <Polygon
            points={dataPolygonPoints}
            fill={`${theme.accent}35`}
            stroke={theme.accent}
            strokeWidth={2.2}
          />

          {/* Points aux sommets */}
          {axisValues.map((val, idx) => {
            const r = Math.min(1, val / maxVal);
            const pt = getPoint(idx, Math.max(0.08, r));
            return (
              <Circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={3.5}
                fill={theme.accent}
              />
            );
          })}
        </Svg>
      </View>

      {/* Ratios Agonistes / Antagonistes */}
      <View style={styles.ratiosRow}>
        <View style={[styles.ratioBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.ratioLabel, { color: theme.textMuted }]}>Ratio Poussée / Tirage</Text>
          <Text style={[styles.ratioValue, { color: theme.text }]}>
            {pushPullRatio !== null ? `${pushPullRatio} : 1` : '—'}
          </Text>
        </View>
        <View style={[styles.ratioBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.ratioLabel, { color: theme.textMuted }]}>Ratio Quad / Chaîne Post.</Text>
          <Text style={[styles.ratioValue, { color: theme.text }]}>
            {quadHamRatio !== null ? `${quadHamRatio} : 1` : '—'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  ratiosRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  ratioBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  ratioLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  ratioValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});
