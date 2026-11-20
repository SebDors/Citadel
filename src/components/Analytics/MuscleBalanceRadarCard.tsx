import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { Compass, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Card } from '../UI/Card';
import { useTheme } from '../../context/ThemeContext';
import { MuscleVolumeBreakdown } from '../../services/analyticsService';
import { StorageService } from '../../services/storage';
import { triggerHapticLight } from '../../utils/haptics';

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

type SelectedRadarTarget =
  | { type: 'axis'; index: number }
  | { type: 'ratio'; key: 'pushPull' | 'quadHam' }
  | null;

const STAGE_WIDTH = 308;
const STAGE_HEIGHT = 250;
const SVG_SIZE = 168;

const AXIS_BUTTON_POSITIONS = [
  { top: 4, left: 110, width: 88 },
  { top: 68, right: 0, width: 82 },
  { top: 142, right: 0, width: 88 },
  { bottom: 4, left: 110, width: 88 },
  { top: 142, left: 0, width: 88 },
  { top: 68, left: 0, width: 82 },
];

export const MuscleBalanceRadarCard: React.FC<MuscleBalanceRadarCardProps> = ({ volumeData }) => {
  const { theme } = useTheme();
  const [selectedTarget, setSelectedTarget] = useState<SelectedRadarTarget>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    StorageService.loadCollapsedCards().then((saved) => {
      if (saved && typeof saved['muscle_balance_radar'] === 'boolean') {
        setIsCollapsed(saved['muscle_balance_radar']);
      }
    });
  }, []);

  const toggleCollapsed = async () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    const saved = await StorageService.loadCollapsedCards();
    await StorageService.saveCollapsedCards({ ...saved, muscle_balance_radar: nextVal });
  };

  const {
    axisValues,
    maxVal,
    pushPullRatio,
    quadHamRatio,
    pushSets,
    pullSets,
    quadSets,
    hamSets,
    volumeByMuscle,
  } = useMemo(() => {
    const setsByMuscle = new Map<string, number>();
    const breakdownByMuscle = new Map<string, MuscleVolumeBreakdown>();
    (volumeData || []).forEach((v) => {
      setsByMuscle.set(v.muscle, v.effectiveSets);
      breakdownByMuscle.set(v.muscle, v);
    });

    const values = RADAR_AXES.map((axis) => {
      const sum = axis.muscles.reduce((acc, m) => acc + (setsByMuscle.get(m) || 0), 0);
      return Math.round(sum * 10) / 10;
    });

    const max = Math.max(10, ...values);

    const pSets =
      (setsByMuscle.get('Pectoraux') || 0) +
      (setsByMuscle.get('Deltoïde Antérieur') || 0) +
      (setsByMuscle.get('Triceps') || 0);
    const plSets =
      (setsByMuscle.get('Grand Dorsal') || 0) +
      (setsByMuscle.get('Trapèzes') || 0) +
      (setsByMuscle.get('Rhomboïdes') || 0) +
      (setsByMuscle.get('Deltoïde Postérieur') || 0) +
      (setsByMuscle.get('Biceps') || 0);
    const pRatio = plSets > 0 ? Math.round((pSets / plSets) * 100) / 100 : null;

    const qSets = setsByMuscle.get('Quadriceps') || 0;
    const hSets =
      (setsByMuscle.get('Ischio-Jambiers') || 0) + (setsByMuscle.get('Fessiers') || 0);
    const qRatio = hSets > 0 ? Math.round((qSets / hSets) * 100) / 100 : null;

    return {
      axisValues: values,
      maxVal: max,
      pushPullRatio: pRatio,
      quadHamRatio: qRatio,
      pushSets: Math.round(pSets * 10) / 10,
      pullSets: Math.round(plSets * 10) / 10,
      quadSets: Math.round(qSets * 10) / 10,
      hamSets: Math.round(hSets * 10) / 10,
      volumeByMuscle: breakdownByMuscle,
    };
  }, [volumeData]);

  const cx = SVG_SIZE / 2;
  const cy = SVG_SIZE / 2;
  const radius = 64;
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

  const handleSelectAxis = (index: number) => {
    triggerHapticLight();
    setSelectedTarget((prev) =>
      prev?.type === 'axis' && prev.index === index ? null : { type: 'axis', index }
    );
  };

  const handleSelectRatio = (key: 'pushPull' | 'quadHam') => {
    triggerHapticLight();
    setSelectedTarget((prev) =>
      prev?.type === 'ratio' && prev.key === key ? null : { type: 'ratio', key }
    );
  };

  const selectedAxisSpec =
    selectedTarget?.type === 'axis' ? RADAR_AXES[selectedTarget.index] : null;
  const selectedAxisTotal =
    selectedTarget?.type === 'axis' ? axisValues[selectedTarget.index] : 0;

  return (
    <Card>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleCollapsed}
        style={[styles.header, isCollapsed && { marginBottom: 0 }]}
      >
        <View style={styles.headerLeft}>
          <Compass size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Équilibre Musculaire</Text>
        </View>
        {isCollapsed ? (
          <ChevronDown size={18} color={theme.textMuted} />
        ) : (
          <ChevronUp size={18} color={theme.textMuted} />
        )}
      </TouchableOpacity>

      {isCollapsed ? (
        <Text style={[styles.collapsedSummary, { color: theme.textMuted }]} numberOfLines={1}>
          Poussée/Tirage : {pushPullRatio !== null ? `${pushPullRatio} : 1` : '—'} · Quad/Post. : {quadHamRatio !== null ? `${quadHamRatio} : 1` : '—'}
        </Text>
      ) : (
        <>
          <View style={styles.radarWrapper}>
        <View style={styles.radarStage}>
          <View style={styles.svgCenterBox}>
            <Svg width={SVG_SIZE} height={SVG_SIZE}>
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

              {/* Axes radiaux */}
              {RADAR_AXES.map((axis, idx) => {
                const outer = getPoint(idx, 1.0);
                const isSelected = selectedTarget?.type === 'axis' && selectedTarget.index === idx;
                return (
                  <Line
                    key={axis.label}
                    x1={cx}
                    y1={cy}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={isSelected ? theme.accent : theme.border}
                    strokeWidth={isSelected ? 1.8 : 1}
                  />
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
                const isSelected = selectedTarget?.type === 'axis' && selectedTarget.index === idx;
                return (
                  <React.Fragment key={idx}>
                    {isSelected && (
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={7}
                        fill={`${theme.accent}30`}
                      />
                    )}
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 4.5 : 3.5}
                      fill={theme.accent}
                    />
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>

          {/* Boutons natifs cliquables positionnés autour de l'hexagone (aucun chevauchement SVG) */}
          {RADAR_AXES.map((axis, idx) => {
            const posStyle = AXIS_BUTTON_POSITIONS[idx];
            const isSelected = selectedTarget?.type === 'axis' && selectedTarget.index === idx;
            const value = axisValues[idx];

            return (
              <TouchableOpacity
                key={axis.label}
                activeOpacity={0.75}
                onPress={() => handleSelectAxis(idx)}
                accessibilityLabel={`${axis.label} : ${value} séries effectives`}
                style={[
                  styles.axisPillBtn,
                  posStyle,
                  {
                    backgroundColor: isSelected ? `${theme.accent}20` : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.axisPillLabel,
                    { color: isSelected ? theme.accent : theme.text },
                  ]}
                >
                  {axis.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.axisPillValue,
                    { color: value > 0 ? theme.accent : theme.textMuted },
                  ]}
                >
                  {value} sér.
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Panneau de détail interactif lorsqu'un axe ou un ratio est sélectionné */}
      {selectedAxisSpec && (
        <View
          style={[
            styles.detailBox,
            { backgroundColor: theme.surface, borderColor: `${theme.accent}55` },
          ]}
        >
          <View style={styles.detailHeader}>
            <View>
              <Text style={[styles.detailTitle, { color: theme.text }]}>
                {selectedAxisSpec.label} · {selectedAxisTotal} série{selectedAxisTotal > 1 ? 's' : ''}
              </Text>
              <Text style={[styles.detailSub, { color: theme.textMuted }]}>
                Détail des séries effectives de la semaine
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedTarget(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {selectedAxisSpec.muscles.map((muscleName) => {
            const mData = volumeByMuscle.get(muscleName);
            const effective = mData ? mData.effectiveSets : 0;
            return (
              <View key={muscleName} style={[styles.detailRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.detailMuscleName, { color: theme.text }]}>{muscleName}</Text>
                <View style={styles.detailMuscleRight}>
                  <Text
                    style={[
                      styles.detailMuscleSets,
                      { color: effective > 0 ? theme.accent : theme.textMuted },
                    ]}
                  >
                    {effective} sér.
                  </Text>
                  {mData && (
                    <Text style={[styles.detailMuscleTarget, { color: theme.textMuted }]}>
                      (cible {mData.mev}–{mData.mav})
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {selectedTarget?.type === 'ratio' && (
        <View
          style={[
            styles.detailBox,
            { backgroundColor: theme.surface, borderColor: `${theme.accent}55` },
          ]}
        >
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailTitle, { color: theme.text }]}>
                {selectedTarget.key === 'pushPull'
                  ? 'Équilibre Poussée / Tirage'
                  : 'Équilibre Quadriceps / Chaîne Post.'}
              </Text>
              <Text style={[styles.detailSub, { color: theme.textMuted }]}>
                Zone optimale recommandée : 0.8 à 1.2 : 1
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedTarget(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {selectedTarget.key === 'pushPull' ? (
            <>
              <View style={[styles.detailRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.detailMuscleName, { color: theme.text }]}>
                  Poussée (Pecs, Delto. Ant., Triceps)
                </Text>
                <Text style={[styles.detailMuscleSets, { color: theme.accent }]}>{pushSets} sér.</Text>
              </View>
              <View style={[styles.detailRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.detailMuscleName, { color: theme.text }]}>
                  Tirage (Dos, Rhomboïdes, Delto. Post., Biceps)
                </Text>
                <Text style={[styles.detailMuscleSets, { color: theme.accent }]}>{pullSets} sér.</Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.detailRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.detailMuscleName, { color: theme.text }]}>Quadriceps</Text>
                <Text style={[styles.detailMuscleSets, { color: theme.accent }]}>{quadSets} sér.</Text>
              </View>
              <View style={[styles.detailRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.detailMuscleName, { color: theme.text }]}>
                  Chaîne Postérieure (Ischios, Fessiers)
                </Text>
                <Text style={[styles.detailMuscleSets, { color: theme.accent }]}>{hamSets} sér.</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Ratios Agonistes / Antagonistes cliquables */}
      <View style={styles.ratiosRow}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => handleSelectRatio('pushPull')}
          style={[
            styles.ratioBox,
            {
              backgroundColor:
                selectedTarget?.type === 'ratio' && selectedTarget.key === 'pushPull'
                  ? `${theme.accent}18`
                  : theme.surface,
              borderColor:
                selectedTarget?.type === 'ratio' && selectedTarget.key === 'pushPull'
                  ? theme.accent
                  : theme.border,
            },
          ]}
        >
          <Text style={[styles.ratioLabel, { color: theme.textMuted }]}>Ratio Poussée / Tirage</Text>
          <Text style={[styles.ratioValue, { color: theme.text }]}>
            {pushPullRatio !== null ? `${pushPullRatio} : 1` : '—'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => handleSelectRatio('quadHam')}
          style={[
            styles.ratioBox,
            {
              backgroundColor:
                selectedTarget?.type === 'ratio' && selectedTarget.key === 'quadHam'
                  ? `${theme.accent}18`
                  : theme.surface,
              borderColor:
                selectedTarget?.type === 'ratio' && selectedTarget.key === 'quadHam'
                  ? theme.accent
                  : theme.border,
            },
          ]}
        >
          <Text style={[styles.ratioLabel, { color: theme.textMuted }]}>Ratio Quad / Chaîne Post.</Text>
          <Text style={[styles.ratioValue, { color: theme.text }]}>
            {quadHamRatio !== null ? `${quadHamRatio} : 1` : '—'}
          </Text>
        </TouchableOpacity>
      </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  collapsedSummary: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  radarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  radarStage: {
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    position: 'relative',
  },
  svgCenterBox: {
    position: 'absolute',
    left: (STAGE_WIDTH - SVG_SIZE) / 2,
    top: (STAGE_HEIGHT - SVG_SIZE) / 2,
    width: SVG_SIZE,
    height: SVG_SIZE,
  },
  axisPillBtn: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  axisPillLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  axisPillValue: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  detailBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  detailSub: {
    fontSize: 11,
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detailMuscleName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  detailMuscleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailMuscleSets: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailMuscleTarget: {
    fontSize: 10,
    fontWeight: '500',
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
