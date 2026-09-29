import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import {
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Clock,
  Dumbbell,
  TrendingUp,
} from 'lucide-react-native';
import {
  calculateWeeklyFatigueSnapshots,
  WeeklyFatigueSnapshot,
} from '../../services/analyticsService';
import { StorageService } from '../../services/storage';
import { WorkoutSession, BodyMeasurement } from '../../types';

interface FatigueMarkersCardProps {
  history?: WorkoutSession[];
  measurements?: BodyMeasurement[];
}

export const FatigueMarkersCard: React.FC<FatigueMarkersCardProps> = ({
  history: propHistory,
  measurements: propMeasurements,
}) => {
  const { theme } = useTheme();
  const { data } = useWorkout();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  useEffect(() => {
    StorageService.loadCollapsedCards().then((saved) => {
      if (saved && typeof saved['fatigue_markers'] === 'boolean') {
        setIsCollapsed(saved['fatigue_markers']);
      }
    });
  }, []);

  const toggleCollapsed = async () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    const saved = await StorageService.loadCollapsedCards();
    await StorageService.saveCollapsedCards({ ...saved, fatigue_markers: nextVal });
  };

  const effectiveHistory = propHistory ?? data?.history ?? [];
  const effectiveMeasurements = propMeasurements ?? data?.measurements ?? [];

  const snapshots: WeeklyFatigueSnapshot[] = useMemo(() => {
    return calculateWeeklyFatigueSnapshots(effectiveHistory, effectiveMeasurements);
  }, [effectiveHistory, effectiveMeasurements]);

  // Si aucun historique de séance, on n'affiche pas la carte
  if (effectiveHistory.length === 0 || snapshots.length === 0) {
    return null;
  }

  // Index de la semaine sélectionnée (snapshots est ordonné chronologiquement, le dernier est weekOffset 0)
  const maxOffset = 0;
  const minOffset = -(snapshots.length - 1);
  const safeOffset = Math.max(minOffset, Math.min(maxOffset, weekOffset));
  const currentSnapshotIndex = snapshots.length - 1 + safeOffset;
  const currentSnapshot = snapshots[currentSnapshotIndex] ?? snapshots[snapshots.length - 1];

  // Calcul du delta de RIR
  const hasRirComparison = currentSnapshot.avgRir > 0 && currentSnapshot.avgRir4wRollingAvg > 0;
  const rirDelta = hasRirComparison
    ? Math.round((currentSnapshot.avgRir - currentSnapshot.avgRir4wRollingAvg) * 10) / 10
    : null;

  const isUnderRecovering = currentSnapshot.isUnderRecovering;
  const hasSessions = currentSnapshot.totalSessions > 0;

  // Configuration du badge de statut
  let statusColor = '#10B981';
  let statusBg = 'rgba(16, 185, 129, 0.12)';
  let statusBorder = 'rgba(16, 185, 129, 0.3)';
  let statusTitle = 'Récupération Optimale';
  let statusDesc =
    "L'intensité perçue et le RIR sont stables par rapport à votre moyenne de référence sur 4 semaines. Vos réserves d'énergie soutiennent le volume actuel.";

  if (isUnderRecovering) {
    statusColor = '#F59E0B';
    statusBg = 'rgba(245, 158, 11, 0.14)';
    statusBorder = 'rgba(245, 158, 11, 0.35)';
    statusTitle = 'Signes de fatigue / Sous-récupération';
    statusDesc = `Le RIR moyen (${currentSnapshot.avgRir}) dépasse de plus d'1 point votre référence sur 4 semaines (${currentSnapshot.avgRir4wRollingAvg}), associé à un poids stable ou baissier${
      currentSnapshot.bodyweightKg !== null ? ` (${currentSnapshot.bodyweightKg} kg)` : ''
    }. Envisagez d'espacer les séances ou d'alléger le volume (deload).`;
  } else if (!hasSessions) {
    statusColor = theme.textMuted;
    statusBg = `${theme.surface}`;
    statusBorder = theme.border;
    statusTitle = 'Aucune séance';
    statusDesc = 'Enregistrez vos entraînements et renseignez votre RIR pour analyser vos marqueurs.';
  } else if (currentSnapshot.avgRir === 0) {
    statusColor = theme.textMuted;
    statusBg = `${theme.surface}`;
    statusBorder = theme.border;
    statusTitle = 'RIR non renseigné';
    statusDesc = 'Saisissez vos RIR (Répétitions en Réserve) à la fin des séries pour activer la détection de fatigue.';
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleCollapsed}
          style={styles.headerLeft}
        >
          <Activity size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Marqueurs de Fatigue</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowInfo(!showInfo)}
            style={[styles.iconBtn, { backgroundColor: theme.surface, marginRight: 6 }]}
            accessibilityLabel="Informations sur les marqueurs de fatigue"
          >
            <Info size={14} color={showInfo ? theme.accent : theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleCollapsed}
            style={[styles.iconBtn, { backgroundColor: theme.surface }]}
            accessibilityLabel={isCollapsed ? 'Développer' : 'Réduire'}
          >
            {isCollapsed ? (
              <ChevronDown size={16} color={theme.text} />
            ) : (
              <ChevronUp size={16} color={theme.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation semaine */}
      <View style={[styles.weekNavRow, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setWeekOffset((prev) => Math.max(minOffset, prev - 1))}
          disabled={safeOffset <= minOffset}
          style={[
            styles.weekNavBtn,
            { backgroundColor: theme.surface, opacity: safeOffset <= minOffset ? 0.3 : 1 },
          ]}
        >
          <ChevronLeft size={16} color={theme.text} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.weekNavLabel, { color: theme.text }]}>
            {currentSnapshot.weekLabel}
          </Text>
          {safeOffset !== 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setWeekOffset(0)}
              style={[styles.todayBtn, { backgroundColor: `${theme.accent}20`, borderColor: theme.accent }]}
            >
              <Text style={[styles.todayBtnText, { color: theme.accent }]}>Revenir à cette semaine</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
          disabled={safeOffset >= 0}
          style={[
            styles.weekNavBtn,
            { backgroundColor: theme.surface, opacity: safeOffset >= 0 ? 0.3 : 1 },
          ]}
        >
          <ChevronRight size={16} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Résumé compact quand replié */}
      {isCollapsed ? (
        <View style={styles.collapsedSummary}>
          <View style={[styles.compactStatusPill, { backgroundColor: statusBg, borderColor: statusBorder }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.compactStatusText, { color: statusColor }]}>{statusTitle}</Text>
          </View>
          <Text style={[styles.collapsedText, { color: theme.textMuted }]}>
            {hasSessions
              ? `RIR: ${currentSnapshot.avgRir > 0 ? currentSnapshot.avgRir : '-'} · 4 sem: ${
                  currentSnapshot.avgRir4wRollingAvg > 0 ? currentSnapshot.avgRir4wRollingAvg : '-'
                } · ${currentSnapshot.bodyweightKg !== null ? `${currentSnapshot.bodyweightKg} kg` : '-'} · ${
                  currentSnapshot.totalSessions
                } séance${currentSnapshot.totalSessions > 1 ? 's' : ''}`
              : '0 séance sur cette semaine'}
          </Text>
        </View>
      ) : (
        <>
          {/* Explication pédagogique repliable */}
          {showInfo && (
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.infoText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: '800', color: theme.text }}>Détection de sous-récupération :</Text>
                {'\n'}
                • <Text style={{ fontWeight: '700', color: theme.text }}>RIR Moyen :</Text> Répétitions en réserve moyennes. Si votre RIR grimpe anormalement (&gt; moyenne 4 sem. + 1), votre système nerveux peine à recruter les unités motrices rapides.
                {'\n'}
                • <Text style={{ fontWeight: '700', color: theme.text }}>Poids corporel :</Text> Un déficit calorique ou une perte de poids amplifie le risque de surentraînement.
                {'\n'}
                • <Text style={{ fontWeight: '700', color: theme.text }}>Moyenne 4 semaines :</Text> Baseline glissante d'intensité pour filtrer les fluctuations ponctuelles.
              </Text>
            </View>
          )}

          {/* Diagnostic de statut */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: statusBg, borderColor: statusBorder },
            ]}
          >
            <View style={styles.statusHeaderRow}>
              {isUnderRecovering ? (
                <AlertTriangle size={18} color={statusColor} style={{ marginRight: 8 }} />
              ) : hasSessions ? (
                <CheckCircle2 size={18} color={statusColor} style={{ marginRight: 8 }} />
              ) : (
                <Activity size={18} color={statusColor} style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.statusBannerTitle, { color: statusColor }]}>
                {statusTitle}
              </Text>
            </View>
            <Text style={[styles.statusBannerDesc, { color: theme.text }]}>
              {statusDesc}
            </Text>
          </View>

          {/* Grille de métriques brutes */}
          <View style={styles.metricsGrid}>
            {/* 1. RIR Moyen vs 4 Semaines */}
            <View style={[styles.metricTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>RIR Moyen</Text>
                <TrendingUp size={14} color={theme.accent} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {currentSnapshot.avgRir > 0 ? currentSnapshot.avgRir.toFixed(1) : '—'}
                </Text>
                {rirDelta !== null && (
                  <View
                    style={[
                      styles.deltaBadge,
                      {
                        backgroundColor:
                          rirDelta > 1
                            ? 'rgba(245, 158, 11, 0.15)'
                            : rirDelta <= 0
                            ? 'rgba(16, 185, 129, 0.15)'
                            : `${theme.border}`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deltaText,
                        {
                          color:
                            rirDelta > 1
                              ? '#F59E0B'
                              : rirDelta <= 0
                              ? '#10B981'
                              : theme.textMuted,
                        },
                      ]}
                    >
                      {rirDelta > 0 ? `+${rirDelta}` : `${rirDelta}`}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>
                4 sem : {currentSnapshot.avgRir4wRollingAvg > 0 ? currentSnapshot.avgRir4wRollingAvg.toFixed(1) : '—'}
              </Text>
            </View>

            {/* 2. Poids Corporel */}
            <View style={[styles.metricTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Poids de corps</Text>
                <Scale size={14} color={theme.accent} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {currentSnapshot.bodyweightKg !== null ? `${currentSnapshot.bodyweightKg}` : '—'}
                  {currentSnapshot.bodyweightKg !== null && (
                    <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textMuted }}> kg</Text>
                  )}
                </Text>
              </View>
              <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>
                {currentSnapshot.bodyweightKg !== null ? 'Pesée la plus proche' : 'Aucune pesée'}
              </Text>
            </View>

            {/* 3. Durée Moyenne des séances */}
            <View style={[styles.metricTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Durée séance</Text>
                <Clock size={14} color={theme.accent} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {currentSnapshot.avgSessionDurationMin > 0 ? `${currentSnapshot.avgSessionDurationMin}` : '—'}
                  {currentSnapshot.avgSessionDurationMin > 0 && (
                    <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textMuted }}> min</Text>
                  )}
                </Text>
              </View>
              <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>
                Moyenne réelle
              </Text>
            </View>

            {/* 4. Total Séances */}
            <View style={[styles.metricTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Séances</Text>
                <Dumbbell size={14} color={theme.accent} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {currentSnapshot.totalSessions}
                </Text>
              </View>
              <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>
                {currentSnapshot.totalSessions > 1 ? 'Entraînements faits' : 'Entraînement fait'}
              </Text>
            </View>
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  weekNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  todayBtn: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  todayBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  collapsedSummary: {
    marginTop: 4,
    gap: 6,
  },
  compactStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  collapsedText: {
    fontSize: 12,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  statusBannerDesc: {
    fontSize: 12,
    lineHeight: 16.5,
    opacity: 0.9,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    minWidth: '47%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  deltaBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricSubtitle: {
    fontSize: 11,
  },
});
