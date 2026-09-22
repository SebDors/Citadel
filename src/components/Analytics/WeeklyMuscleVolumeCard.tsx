import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { Layers, Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { calculateWeeklyMuscleVolume } from '../../services/analyticsService';
import { StorageService } from '../../services/storage';

export const WeeklyMuscleVolumeCard: React.FC = () => {
  const { theme } = useTheme();
  const { data } = useWorkout();
  const [showInfo, setShowInfo] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  React.useEffect(() => {
    StorageService.loadCollapsedCards().then((saved) => {
      if (saved && typeof saved['weekly_muscle_volume'] === 'boolean') {
        setIsCollapsed(saved['weekly_muscle_volume']);
      }
    });
  }, []);

  const toggleCollapsed = async () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    const saved = await StorageService.loadCollapsedCards();
    await StorageService.saveCollapsedCards({ ...saved, weekly_muscle_volume: nextVal });
  };

  const history = data?.history || [];
  const muscleData = calculateWeeklyMuscleVolume(history, weekOffset);

  // Calcul du libellé de la semaine sélectionnée
  const weekLabel = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + weekOffset * 7;
    const start = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = `${start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'short' })}`;
    const endStr = `${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'short' })}`;

    if (weekOffset === 0) {
      return `Cette semaine (${startStr} - ${endStr})`;
    } else if (weekOffset === -1) {
      return `Semaine passée (${startStr} - ${endStr})`;
    } else {
      return `Semaine du ${startStr} au ${endStr}`;
    }
  }, [weekOffset]);

  const totalWeeklySets = useMemo(() => {
    return muscleData.reduce((sum, item) => sum + item.effectiveSets, 0);
  }, [muscleData]);

  // Nombre de séances effectuées sur la semaine sélectionnée
  const weeklySessionCount = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + weekOffset * 7;
    const start = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setMilliseconds(-1);

    return history.filter((s) => {
      const sDate = new Date(s.startTime);
      return sDate >= start && sDate <= end && s.status === 'completed';
    }).length;
  }, [history, weekOffset]);

  // Si aucun historique global n'existe du tout, on ne masque pas brutalement si l'utilisateur navigue
  if (history.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      {/* Header avec bouton réduction */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleCollapsed}
          style={styles.headerLeft}
        >
          <Layers size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Volume Musculaire Hebdo</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowInfo(!showInfo)}
            style={[styles.iconBtn, { backgroundColor: theme.surface, marginRight: 6 }]}
            accessibilityLabel="Explication des repères MEV / MAV"
          >
            <Info size={14} color={theme.textMuted} />
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

      {/* Barre de navigation entre les semaines avec bouton retour semaine actuelle */}
      <View style={[styles.weekNavRow, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setWeekOffset((prev) => prev - 1)}
          style={[styles.weekNavBtn, { backgroundColor: theme.surface }]}
        >
          <ChevronLeft size={16} color={theme.text} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.weekNavLabel, { color: theme.text }]}>
            {weekLabel}
          </Text>
          {weekOffset !== 0 && (
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
          disabled={weekOffset >= 0}
          style={[
            styles.weekNavBtn,
            { backgroundColor: theme.surface, opacity: weekOffset >= 0 ? 0.3 : 1 },
          ]}
        >
          <ChevronRight size={16} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Résumé compact quand la carte est réduite */}
      {isCollapsed ? (
        <View style={styles.collapsedSummary}>
          <Text style={[styles.collapsedText, { color: theme.textMuted }]}>
            {weeklySessionCount > 0
              ? `${weeklySessionCount} séance${weeklySessionCount > 1 ? 's' : ''} · ${muscleData.length} groupes · ${totalWeeklySets} séries effectives`
              : '0 séance · Aucun entraînement sur cette semaine'}
          </Text>
        </View>
      ) : (
        <>
          {/* Explication scientifique repliable */}
          {showInfo && (
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.infoText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: '800', color: theme.text }}>MEV</Text> = Volume Minimum Efficace pour stimuler l'hypertrophie.{"\n"}
                <Text style={{ fontWeight: '800', color: theme.text }}>MAV</Text> = Volume d'Adaptation Maximale (fourchette idéale de croissance).
              </Text>
            </View>
          )}

          {/* Barres de progression par groupe musculaire */}
          {muscleData.length === 0 ? (
            <View style={styles.emptyWeekBox}>
              <Text style={[styles.emptyWeekText, { color: theme.textMuted }]}>
                Aucune série enregistrée pour cette semaine.
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {muscleData.map((item) => {
                const progressPercent = Math.min(100, Math.round((item.effectiveSets / item.mav) * 100));
                const mevPercent = Math.round((item.mev / item.mav) * 100);

                let badgeColor = theme.textMuted;
                let badgeBg = theme.surface;
                let badgeLabel = 'Sous MEV';

                if (item.status === 'optimal') {
                  badgeColor = '#FFFFFF';
                  badgeBg = theme.primary;
                  badgeLabel = 'Optimal';
                } else if (item.effectiveSets > item.mav) {
                  badgeColor = '#FFFFFF';
                  badgeBg = theme.secondary;
                  badgeLabel = 'Volume Max';
                }

                return (
                  <View key={item.muscle} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.muscleName, { color: theme.text }]}>{item.muscle}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.setsCount, { color: theme.text }]}>
                          {item.effectiveSets} <Text style={{ fontSize: 11, color: theme.textMuted }}>séries</Text>
                        </Text>
                        <View style={[styles.badge, { backgroundColor: badgeBg, marginLeft: 8 }]}>
                          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Barre de progression avec repère MEV */}
                    <View style={[styles.barBackground, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      {/* Repère vertical MEV */}
                      <View
                        style={[
                          styles.mevMarker,
                          { left: `${mevPercent}%`, backgroundColor: theme.border },
                        ]}
                      />
                      {/* Jauge remplie */}
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${progressPercent}%`,
                            backgroundColor: item.status === 'optimal' ? theme.accent : theme.primary,
                          },
                        ]}
                      />
                    </View>

                    {/* Repères séparés sans chevauchement */}
                    <View style={styles.rangeLabelsRow}>
                      <Text style={[styles.rangeLabel, { color: theme.textMuted }]}>
                        Min : <Text style={{ fontWeight: '700', color: theme.text }}>{item.mev}</Text> (MEV)
                      </Text>
                      <Text style={[styles.rangeLabel, { color: theme.textMuted }]}>
                        Cible : <Text style={{ fontWeight: '700', color: theme.text }}>{item.mav}</Text> (MAV)
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 10,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  weekNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  todayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    marginTop: 4,
  },
  todayBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  collapsedSummary: {
    paddingVertical: 4,
  },
  collapsedText: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  infoBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyWeekBox: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyWeekText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  listContainer: {
    gap: 12,
  },
  itemContainer: {},
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '700',
  },
  setsCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  mevMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 2,
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
